export type MembershipRecord = {
  id: number;
  type: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  province?: string;
  military_link?: string;
  parent_military_name?: string;
  skills?: string;
  message?: string;
  status: string;
  created_at: string;
};

export type HelpRequestRecord = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone: string;
  province: string;
  age?: number | null;
  is_minor?: number;
  parental_consent?: number;
  military_status?: string | null;
  need_type: string;
  description: string;
  confidential?: number;
  user_id?: number | null;
  status: string;
  created_at: string;
};

export type ContactMessageRecord = {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: string;
  created_at: string;
};

export type NewsletterRecord = {
  id: number;
  email: string;
  created_at: string;
};
