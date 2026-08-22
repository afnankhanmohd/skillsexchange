import { supabase } from "@/integrations/supabase/client";
import type { Skill } from "./types";

const PROFILE_FIELDS =
  "id, full_name, college, location, avatar_url, bio, availability, portfolio_url, linkedin_url";

export async function fetchSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("skills")
    .select(`*, profile:profiles!skills_user_id_fkey(${PROFILE_FIELDS})`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Skill[];
}

export async function fetchSkill(id: string): Promise<Skill | null> {
  const { data, error } = await supabase
    .from("skills")
    .select(`*, profile:profiles!skills_user_id_fkey(${PROFILE_FIELDS})`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Skill | null;
}

export async function fetchMySkills(userId: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("skills")
    .select(`*, profile:profiles!skills_user_id_fkey(${PROFILE_FIELDS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Skill[];
}

export type SavedItems = {
  skills: Skill[];
  skillIds: Set<string>;
};

export async function fetchSavedItems(userId: string): Promise<SavedItems> {
  const { data, error } = await supabase
    .from("saved_items")
    .select(
      `id, item_type, skill_id, created_at,
       skill:skills(*, profile:profiles!skills_user_id_fkey(${PROFILE_FIELDS}))`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    skill_id: string | null;
    skill: Skill | null;
  }[];
  return {
    skills: rows.map((r) => r.skill).filter((s): s is Skill => !!s),
    skillIds: new Set(rows.map((r) => r.skill_id).filter((v): v is string => !!v)),
  };
}

export async function toggleSaved(userId: string, itemId: string, isSaved: boolean) {
  if (isSaved) {
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .eq("skill_id", itemId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("saved_items").insert({
    user_id: userId,
    item_type: "skill",
    skill_id: itemId,
    job_id: null,
  });
  if (error) throw error;
}

// `email` is intentionally excluded: it is not readable through the Data API.
export const PROFILE_SELECT =
  "id, full_name, college, location, bio, avatar_url, portfolio_url, linkedin_url, availability, role, created_at, updated_at";

export async function fetchProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}


export async function fetchInquiries(userId: string) {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function fetchContactMessages() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function resolveAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
