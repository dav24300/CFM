import {
  getAdminStats,
  getAdminData,
  adminCreate,
  adminUpdateStatus,
  adminDelete,
} from "@/infrastructure/repositories/content.repository";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  getAllUsers,
  getUserById,
  activateUser,
  suspendUser,
  setUserPassword,
  addHelpRequestUpdate,
} from "@/infrastructure/repositories/users.repository";
import {
  getAllFamilyLinks,
  adminApproveFamilyLink,
} from "@/infrastructure/repositories/family-links.repository";
import {
  createPetition,
  getPetitionSignatures,
  getPetitionById,
} from "@/infrastructure/repositories/petitions.repository";
import { getAllDonations } from "@/infrastructure/repositories/donations.repository";
import {
  createLiveEvent,
  setLiveEventStatus,
  createLivePoll,
  getLiveEvents,
} from "@/infrastructure/repositories/live.repository";
import { sendAccountActivatedEmail } from "@/infrastructure/email/nodemailer.adapter";
import { petitionSignaturesToCsv } from "@/infrastructure/auth/password-reset";

export {
  getAdminStats,
  getAdminData,
  adminCreate,
  adminUpdateStatus,
  adminDelete,
  getAllUsers,
  activateUser,
  suspendUser,
  addHelpRequestUpdate,
  getAllFamilyLinks,
  adminApproveFamilyLink,
  createPetition,
  getPetitionSignatures,
  getPetitionById,
  getAllDonations,
  createLiveEvent,
  setLiveEventStatus,
  createLivePoll,
  getLiveEvents,
  petitionSignaturesToCsv,
};

export async function activateUserWithEmail(userId: number) {
  const user = await activateUser(userId);
  if (user?.email) {
    await sendAccountActivatedEmail(user.email, user.first_name);
  }
  return user;
}

// Alphabet sans 0/O/1/I/l : le mot de passe provisoire sera dicté au téléphone
// ou recopié à la main depuis une fiche.
const PROVISIONAL_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateProvisionalPassword(): string {
  const pick = () => PROVISIONAL_ALPHABET[randomInt(PROVISIONAL_ALPHABET.length)];
  const group = () => Array.from({ length: 4 }, pick).join("");
  // Ex. « cfm-4h7k-2mrt » : lisible, transcriptible, changé ensuite par le membre.
  return `cfm-${group()}-${group()}`;
}

/**
 * Réinitialise le mot de passe d'un membre sans email ni SMS : renvoie un mot de
 * passe provisoire EN CLAIR, une seule fois (jamais stocké ni journalisé). Le
 * changement horodate password_changed_at → toute session en cours est révoquée.
 */
export async function adminResetPassword(userId: number) {
  const user = await getUserById(userId);
  if (!user) return null;
  const password = generateProvisionalPassword();
  await setUserPassword(userId, await bcrypt.hash(password, 10));
  return { userId, password };
}
