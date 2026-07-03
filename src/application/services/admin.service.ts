import {
  getAdminStats,
  getAdminData,
  adminCreate,
  adminUpdateStatus,
  adminDelete,
} from "@/infrastructure/repositories/content.repository";
import {
  getAllUsers,
  activateUser,
  suspendUser,
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
  const user = activateUser(userId);
  if (user) {
    await sendAccountActivatedEmail(user.email, user.first_name);
  }
  return user;
}
