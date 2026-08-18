import { supabase } from "@/integrations/supabase/client";

export type UserContact = {
  email: string | null;
  phone: string | null;
  contactVisible: boolean;
};

/**
 * Contact details are not readable through the table API. This RPC returns them
 * only to signed-in users, and only when the owner shares them.
 */
export async function fetchUserContact(userId: string): Promise<UserContact | null> {
  const { data, error } = await supabase.rpc("get_user_contact", { _user_id: userId });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;
  return {
    email: row.email ?? null,
    phone: row.phone ?? null,
    contactVisible: row.contact_visible ?? false,
  };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function whatsappLink(phone: string): string {
  return `https://wa.me/${normalizePhone(phone).replace(/^\+/, "")}`;
}
