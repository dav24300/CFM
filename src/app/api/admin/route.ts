import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import {
  getAdminStats,
  adminCreate,
  adminUpdateStatus,
  adminDelete,
  getHelpRequestById,
} from "@/lib/db";
import { adminUpdateContent } from "@/infrastructure/repositories/content.repository";
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
  jsonSuccess,
  jsonUnauthorized,
} from "@/lib/api-response";

export async function GET() {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }
  return jsonData(getAdminStats());
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
        adminCreate(table, data);
      } else if (table === "petitions") {
        createPetition({
          title: data.title,
          description: data.description,
          content: data.content,
          goal: parseInt(data.goal, 10) || 100,
        });
      }
    } else if (action === "update_content" && table && id) {
      const ok = adminUpdateContent(table, id, data);
      if (!ok) return jsonError("Élément introuvable", 404);
    } else if (action === "update_status") {
      if (table === "memberships" || table === "help_requests") {
        adminUpdateStatus(table, id, data.status);
      }
    } else if (action === "activate_user" && id) {
      const user = activateUser(id);
      if (user) {
        await sendAccountActivatedEmail(user.email, user.first_name);
      }
    } else if (action === "suspend_user" && id) {
      suspendUser(id);
    } else if (action === "approve_family_link" && id) {
      adminApproveFamilyLink(id);
    } else if (action === "reject_family_link" && id) {
      adminRejectFamilyLink(id);
    } else if (action === "help_update" && id) {
      addHelpRequestUpdate({
        help_request_id: id,
        status: data.status,
        note: data.note,
        updated_by: access === "volunteer" ? "bénévole" : "admin",
      });
      const req = getHelpRequestById(id);
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
    } else if (action === "delete" && id && table) {
      adminDelete(table, id);
    } else if (action === "reject_membership" && id) {
      adminUpdateStatus("memberships", id, "rejected");
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
