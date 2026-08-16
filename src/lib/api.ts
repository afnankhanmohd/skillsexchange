import { supabase } from "@/integrations/supabase/client";
import type { Job, Skill } from "./types";

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

export async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(`*, profile:profiles!jobs_user_id_fkey(${PROFILE_FIELDS})`)
    .in("status", ["open", "closed"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Job[];
}

export async function fetchJob(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select(`*, profile:profiles!jobs_user_id_fkey(${PROFILE_FIELDS})`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Job | null;
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

export async function fetchMyJobs(userId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(`*, profile:profiles!jobs_user_id_fkey(${PROFILE_FIELDS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Job[];
}

export type SavedItems = {
  skills: Skill[];
  jobs: Job[];
  skillIds: Set<string>;
  jobIds: Set<string>;
};

export async function fetchSavedItems(userId: string): Promise<SavedItems> {
  const { data, error } = await supabase
    .from("saved_items")
    .select(
      `id, item_type, skill_id, job_id, created_at,
       skill:skills(*, profile:profiles!skills_user_id_fkey(${PROFILE_FIELDS})),
       job:jobs(*, profile:profiles!jobs_user_id_fkey(${PROFILE_FIELDS}))`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    skill_id: string | null;
    job_id: string | null;
    skill: Skill | null;
    job: Job | null;
  }[];
  return {
    skills: rows.map((r) => r.skill).filter((s): s is Skill => !!s),
    jobs: rows.map((r) => r.job).filter((j): j is Job => !!j),
    skillIds: new Set(rows.map((r) => r.skill_id).filter((v): v is string => !!v)),
    jobIds: new Set(rows.map((r) => r.job_id).filter((v): v is string => !!v)),
  };
}

export async function toggleSaved(
  userId: string,
  type: "skill" | "job",
  itemId: string,
  isSaved: boolean,
) {
  if (isSaved) {
    const column = type === "skill" ? "skill_id" : "job_id";
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .eq(column, itemId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("saved_items").insert({
    user_id: userId,
    item_type: type,
    skill_id: type === "skill" ? itemId : null,
    job_id: type === "job" ? itemId : null,
  });
  if (error) throw error;
}

export async function fetchProfile(id: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
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

export async function fetchMyApplications(userId: string) {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(id, title, status)")
    .eq("applicant_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as {
    id: string;
    message: string | null;
    status: string;
    created_at: string;
    job: { id: string; title: string; status: string } | null;
  }[];
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
