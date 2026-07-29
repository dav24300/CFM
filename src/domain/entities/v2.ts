export type UserRole = "member" | "volunteer" | "coordinator";
export type MembershipType = "famille" | "soutien" | "benevole";
export type UserStatus = "pending" | "active" | "suspended";

export type User = {
  id: number;
  // Nullable depuis la connexion par téléphone : un membre peut n'avoir aucun
  // email. Toute lecture doit garder ce null (cf. gardes `if (user.email)` aux
  // points d'envoi d'email, et `u.email?.toLowerCase()` dans le repository).
  email: string | null;
  password_hash: string;
  first_name: string;
  last_name: string;
  // `phone` = saisie brute conservée (jamais perdue). `phone_e164` = forme
  // canonique servant d'identifiant de connexion (unique, partiel), ou null si
  // le numéro est absent/inexploitable.
  phone: string | null;
  phone_e164: string | null;
  province: string | null;
  role: UserRole;
  membership_type: MembershipType;
  military_link: string | null;
  parent_military_name: string | null;
  skills: string | null;
  status: UserStatus;
  verified_at: string | null;
  created_at: string;
};

export type FamilyLink = {
  id: number;
  parent_user_id: number;
  child_user_id: number;
  relationship: string;
  status: "pending_child" | "pending_parent" | "pending_admin" | "approved" | "rejected";
  initiated_by: "parent" | "child";
  created_at: string;
};

export type Donation = {
  id: number;
  user_id: number | null;
  amount: number;
  currency: string;
  provider: "orange" | "mpesa" | "airtel";
  phone: string;
  transaction_id: string | null;
  status: "pending" | "completed" | "failed";
  donor_name: string | null;
  donor_email: string | null;
  created_at: string;
};

export type Petition = {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string | null;
  goal: number;
  signatures_count: number;
  active: number;
  created_at: string;
};

export type PetitionSignature = {
  id: number;
  petition_id: number;
  user_id: number | null;
  email: string;
  name: string;
  signed_at: string;
};

export type HelpRequestUpdate = {
  id: number;
  help_request_id: number;
  status: string;
  note: string;
  updated_by: string;
  created_at: string;
};

export type PasswordResetToken = {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: number;
  created_at: string;
};

export type PublicUser = Omit<User, "password_hash">;
