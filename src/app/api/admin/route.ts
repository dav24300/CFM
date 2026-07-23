import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import {
  getAdminStats,
  adminCreate,
  adminUpdateStatus,
  adminDelete,
  getHelpRequestById,
} from "@/infrastructure/repositories/content.repository";
import { adminUpdateContent, updateContactStatus } from "@/infrastructure/repositories/content.repository";
import { patchSiteSettings } from "@/infrastructure/repositories/settings.repository";
import {
  activateUser,
  activateUsers,
  suspendUser,
  addHelpRequestUpdate,
} from "@/infrastructure/repositories/users.repository";
import {
  adminApproveFamilyLink,
  adminRejectFamilyLink,
} from "@/infrastructure/repositories/family-links.repository";
import { createPetition } from "@/infrastructure/repositories/petitions.repository";
import {
  sendAccountActivatedEmail,
  sendHelpRequestUpdateEmail,
} from "@/infrastructure/email/nodemailer.adapter";
import { sendPushToTopic } from "@/infrastructure/push/web-push.adapter";
import { logAdminAction } from "@/lib/admin-audit";
import { runAfterResponse } from "@/lib/after-response";
import { getClientIp } from "@/infrastructure/rate-limit/memory";
import { parseOrBadRequest } from "@/lib/validators";
import {
  adminActionSchema,
  type AdminActionName,
} from "@/lib/validators/admin-api";
import {
  jsonData,
  jsonError,
  jsonForbidden,
  jsonSuccess,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

/**
 * Matrice de rôles FAIL-CLOSED du god-endpoint (P2.3, politique iso-strict :
 * reproduit exactement les droits volunteer constatés avant refactor).
 * L'exhaustivité du Record sur l'union AdminActionName garantit à la
 * compilation qu'aucune nouvelle action ne peut être ajoutée au schéma sans
 * déclarer explicitement son niveau d'accès.
 * "volunteer" = accessible aux deux rôles ; "admin" = admin fondateur seul.
 */
const ACTION_ACCESS: Record<AdminActionName, "admin" | "volunteer"> = {
  create: "volunteer",
  update_content: "volunteer",
  update_status: "volunteer",
  contact_update: "volunteer",
  help_update: "volunteer",
  petition_signatures_mark_read: "volunteer",
  reject_membership: "volunteer",
  activate_user: "admin",
  activate_users: "admin",
  suspend_user: "admin",
  approve_family_link: "admin",
  reject_family_link: "admin",
  delete: "admin",
};

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
      ip: getClientIp(request),
    });
    return jsonUnauthorized();
  }

  const parsed = parseOrBadRequest(
    adminActionSchema,
    await request.json().catch(() => null),
    "Action inconnue ou champs invalides"
  );
  if (!parsed.ok) return parsed.response;
  const payload = parsed.data;
  const table = "table" in payload ? payload.table : undefined;
  const id = "id" in payload ? payload.id : undefined;
  const auditTarget = table || "unknown";

  if (ACTION_ACCESS[payload.action] === "admin" && access !== "admin") {
    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin",
      action: `${payload.action}:forbidden`,
      target: String(id ?? auditTarget),
      status: "denied",
      ip: getClientIp(request),
    });
    return jsonForbidden();
  }

  try {
    switch (payload.action) {
      case "create": {
        if (payload.table === "petitions") {
          const data = payload.data as Record<string, string>;
          await createPetition({
            title: data.title,
            description: data.description,
            content: data.content,
            goal: parseInt(data.goal, 10) || 100,
          });
        } else {
          await adminCreate(payload.table, payload.data as Record<string, string>);
        }
        break;
      }
      case "update_content": {
        const ok = await adminUpdateContent(
          payload.table,
          payload.id,
          payload.data as Record<string, string | number | null>
        );
        if (!ok) return jsonError("Élément introuvable", 404);
        break;
      }
      case "update_status":
        await adminUpdateStatus(payload.table, payload.id, payload.data.status);
        break;
      case "activate_user": {
        const user = await activateUser(payload.id);
        if (user) {
          runAfterResponse(() => sendAccountActivatedEmail(user.email, user.first_name));
        }
        break;
      }
      case "activate_users": {
        const users = await activateUsers(payload.ids);
        for (const user of users) {
          runAfterResponse(() => sendAccountActivatedEmail(user.email, user.first_name));
        }
        await logAdminAction({
          actorType: access,
          endpoint: "/api/admin",
          action: "activate_users",
          target: String(users.length),
          status: "success",
          ip: getClientIp(request),
          metadata: { requested: payload.ids.length, activated: users.length },
        });
        // Rapport explicite : `activated` peut être < `requested` (comptes déjà
        // actifs ou inexistants) sans que ce soit une erreur.
        return jsonSuccess({
          activated: users.length,
          requested: payload.ids.length,
          ids: users.map((u) => u.id),
        });
      }
      case "suspend_user":
        await suspendUser(payload.id);
        break;
      case "approve_family_link":
        await adminApproveFamilyLink(payload.id);
        break;
      case "reject_family_link":
        await adminRejectFamilyLink(payload.id);
        break;
      case "contact_update": {
        const ok = await updateContactStatus(payload.id, payload.data.status);
        if (!ok) return jsonError("Message introuvable", 404);
        break;
      }
      case "help_update": {
        await addHelpRequestUpdate({
          help_request_id: payload.id,
          status: payload.data.status,
          note: payload.data.note ?? "",
          updated_by: access === "volunteer" ? "bénévole" : "admin",
        });
        const req = await getHelpRequestById(payload.id);
        if (req?.email) {
          await sendHelpRequestUpdateEmail(
            req.email as string,
            req.first_name as string,
            payload.data.status,
            payload.data.note || ""
          );
        }
        await sendPushToTopic("help", {
          title: "Mise à jour dossier CFM",
          body: `Statut : ${payload.data.status}`,
          url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/portail`,
        });
        break;
      }
      case "petition_signatures_mark_read":
        await patchSiteSettings({
          petition_signatures_seen_at: new Date().toISOString(),
        });
        break;
      case "delete":
        await adminDelete(payload.table, payload.id);
        break;
      case "reject_membership":
        await adminUpdateStatus("memberships", payload.id, "rejected");
        break;
    }

    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin",
      action: `${payload.action}:${table || "none"}`,
      target: String(id ?? auditTarget),
      status: "success",
      ip: getClientIp(request),
    });
    return jsonSuccess();
  } catch (err) {
    console.error(err);
    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin",
      action: "exception",
      status: "error",
      ip: getClientIp(request),
      metadata: { message: err instanceof Error ? err.message : "unknown" },
    });
    return jsonError("Erreur serveur", 500);
  }
}
