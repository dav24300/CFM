import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import {
  getAdminStats,
  adminCreate,
  adminUpdateStatus,
  adminDelete,
  getHelpRequestById,
} from "@/lib/db";
import { adminUpdateContent, updateContactStatus } from "@/infrastructure/repositories/content.repository";
import { updateStoreAsync } from "@/infrastructure/persistence/store-access";
import {
  activateUser,
  suspendUser,
  adminApproveFamilyLink,
  adminRejectFamilyLink,
  createPetition,
  addHelpRequestUpdate,
} from "@/lib/members";
import {
  sendAccountActivatedEmail,
  sendHelpRequestUpdateEmail,
} from "@/lib/email";
import { sendPushToTopic } from "@/lib/push";
import { logAdminAction } from "@/lib/admin-audit";
import {
  jsonData,
  jsonError,
  jsonForbidden,
  jsonSuccess,
  jsonUnauthorized,
} from "@/lib/api-response";

// Actions à fort impact réservées à l'admin fondateur (jamais au rôle volunteer).
const ADMIN_ONLY_ACTIONS = new Set([
  "activate_user",
  "suspend_user",
  "delete",
  "approve_family_link",
  "reject_family_link",
]);

export async function GET() {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }
  return jsonData(await getAdminStats());
}

export async function POST(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) {
    await logAdminAction({
      actorType: "unknown",
      endpoint: "/api/admin",
      action: "unauthorized",
      status: "denied",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonUnauthorized();
  }

  try {
    const body = await request.json();
    const { table, action, data, id } = body;
    const auditTarget = table || "unknown";

    if (ADMIN_ONLY_ACTIONS.has(action) && access !== "admin") {
      await logAdminAction({
        actorType: access,
        endpoint: "/api/admin",
        action: `${action}:forbidden`,
        target: String(id ?? auditTarget),
        status: "denied",
        ip: request.headers.get("x-forwarded-for") || null,
      });
      return jsonForbidden();
    }

    if (action === "create" && table) {
      const contentTables = [
        "news",
        "studies",
        "campaigns",
        "actions",
        "testimonials",
        "press_releases",
      ];
      if (contentTables.includes(table)) {
        await adminCreate(table, data);
      } else if (table === "petitions") {
        await createPetition({
          title: data.title,
          description: data.description,
          content: data.content,
          goal: parseInt(data.goal, 10) || 100,
        });
      }
    } else if (action === "update_content" && table && id) {
      const ok = await adminUpdateContent(table, id, data);
      if (!ok) return jsonError("Élément introuvable", 404);
    } else if (action === "update_status") {
      if (table === "memberships" || table === "help_requests") {
        await adminUpdateStatus(table, id, data.status);
      }
    } else if (action === "activate_user" && id) {
      const user = await activateUser(id);
      if (user) {
        await sendAccountActivatedEmail(user.email, user.first_name);
      }
    } else if (action === "suspend_user" && id) {
      await suspendUser(id);
    } else if (action === "approve_family_link" && id) {
      await adminApproveFamilyLink(id);
    } else if (action === "reject_family_link" && id) {
      await adminRejectFamilyLink(id);
    } else if (action === "contact_update" && id) {
      const ok = await updateContactStatus(id, data.status);
      if (!ok) return jsonError("Message introuvable", 404);
    } else if (action === "help_update" && id) {
      await addHelpRequestUpdate({
        help_request_id: id,
        status: data.status,
        note: data.note,
        updated_by: access === "volunteer" ? "bénévole" : "admin",
      });
      const req = await getHelpRequestById(id);
      if (req?.email) {
        await sendHelpRequestUpdateEmail(
          req.email as string,
          req.first_name as string,
          data.status,
          data.note || ""
        );
      }
      await sendPushToTopic("help", {
        title: "Mise à jour dossier CFM",
        body: `Statut : ${data.status}`,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/membre/tableau-de-bord`,
      });
    } else if (action === "petition_signatures_mark_read") {
      await updateStoreAsync((store) => {
        store.site_settings = store.site_settings || {};
        store.site_settings.petition_signatures_seen_at = new Date().toISOString();
      });
    } else if (action === "delete" && id && table) {
      await adminDelete(table, id);
    } else if (action === "reject_membership" && id) {
      await adminUpdateStatus("memberships", id, "rejected");
    }

    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin",
      action: `${action}:${table || "none"}`,
      target: String(id ?? auditTarget),
      status: "success",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonSuccess();
  } catch (err) {
    console.error(err);
    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin",
      action: "exception",
      status: "error",
      ip: request.headers.get("x-forwarded-for") || null,
      metadata: { message: err instanceof Error ? err.message : "unknown" },
    });
    return jsonError("Erreur serveur", 500);
  }
}
