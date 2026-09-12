import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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


export type InquiryWithContext = Tables<"inquiries"> & {
  skill: { id: string; title: string } | null;
  sender: { id: string; full_name: string; avatar_url: string | null } | null;
  recipient: { id: string; full_name: string; avatar_url: string | null } | null;
};

export async function fetchInquiries(userId: string): Promise<InquiryWithContext[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(
      `*,
       skill:skills(id, title),
       sender:profiles!inquiries_sender_id_fkey(id, full_name, avatar_url),
       recipient:profiles!inquiries_recipient_id_fkey(id, full_name, avatar_url)`,
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as InquiryWithContext[];
}

export async function updateInquiryStatus(id: string, status: string) {
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function setSkillActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("skills").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function deleteSkill(id: string) {
  const { error } = await supabase.from("skills").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchContactMessages() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSkillInquiries(skillId: string): Promise<InquiryWithContext[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(
      `*,
       skill:skills(id, title),
       sender:profiles!inquiries_sender_id_fkey(id, full_name, avatar_url),
       recipient:profiles!inquiries_recipient_id_fkey(id, full_name, avatar_url)`,
    )
    .eq("skill_id", skillId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as InquiryWithContext[];
}

export async function uploadListingPhotos(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("listing-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function resolveListingPhotoUrls(paths: string[] | null): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const remote = paths.filter((p) => p.startsWith("http"));
  const stored = paths.filter((p) => !p.startsWith("http"));
  if (stored.length === 0) return remote;
  const { data, error } = await supabase.storage
    .from("listing-photos")
    .createSignedUrls(stored, 60 * 60);
  if (error) return remote;
  const signed = (data ?? [])
    .map((item) => item.signedUrl)
    .filter((url): url is string => typeof url === "string" && url.length > 0);
  return [...remote, ...signed];
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateImageFiles(files: File[]) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`${file.name} is not an image file.`);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`${file.name} is larger than 5 MB.`);
    }
  }
}

export async function updateSkill(
  id: string,
  values: Partial<Tables<"skills">> & { photos?: string[] },
) {
  const { error } = await supabase.from("skills").update(values).eq("id", id);
  if (error) throw error;
}

export async function removeListingPhoto(skillId: string, photos: string[], path: string) {
  const next = photos.filter((item) => item !== path);
  await updateSkill(skillId, { photos: next });
  if (!path.startsWith("http")) {
    await supabase.storage.from("listing-photos").remove([path]);
  }
  return next;
}

export type SkillApplication = Tables<"skill_applications"> & {
  applicant: { id: string; full_name: string; avatar_url: string | null } | null;
};

export async function fetchSkillApplications(skillId: string): Promise<SkillApplication[]> {
  const { data, error } = await supabase
    .from("skill_applications")
    .select(`*, applicant:profiles!skill_applications_applicant_id_fkey(id, full_name, avatar_url)`)
    .eq("skill_id", skillId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SkillApplication[];
}

export async function uploadResume(userId: string, file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Your resume must be under 5 MB.");
  const allowed = ["pdf", "doc", "docx"];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowed.includes(ext)) throw new Error("Upload your resume as a PDF or Word document.");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function resolveResumeUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function createSkillApplication(input: {
  skillId: string;
  applicantId: string;
  coverLetter: string;
  resume: File | null;
}) {
  const resumePath = input.resume ? await uploadResume(input.applicantId, input.resume) : null;
  const { error } = await supabase.from("skill_applications").insert({
    skill_id: input.skillId,
    applicant_id: input.applicantId,
    cover_letter: input.coverLetter,
    resume_path: resumePath,
  });
  if (error) throw error;
}

export async function updateApplicationStatus(id: string, status: string) {
  const { error } = await supabase.from("skill_applications").update({ status }).eq("id", id);
  if (error) throw error;
}

export type MyApplication = Tables<"skill_applications"> & {
  skill: { id: string; title: string; category: string; user_id: string } | null;
};

export async function fetchMyApplications(userId: string): Promise<MyApplication[]> {
  const { data, error } = await supabase
    .from("skill_applications")
    .select(`*, skill:skills(id, title, category, user_id)`)
    .eq("applicant_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyApplication[];
}

export type ListingCounts = Record<string, { newCount: number; total: number }>;

/** New + total inquiry and application counts per listing, for dashboard badges. */
export async function fetchListingInboxCounts(skillIds: string[]): Promise<ListingCounts> {
  const counts: ListingCounts = {};
  if (skillIds.length === 0) return counts;
  for (const id of skillIds) counts[id] = { newCount: 0, total: 0 };

  const [inquiries, applications] = await Promise.all([
    supabase.from("inquiries").select("skill_id, status").in("skill_id", skillIds),
    supabase.from("skill_applications").select("skill_id, status").in("skill_id", skillIds),
  ]);
  if (inquiries.error) throw inquiries.error;
  if (applications.error) throw applications.error;

  const rows = [...(inquiries.data ?? []), ...(applications.data ?? [])] as {
    skill_id: string | null;
    status: string;
  }[];
  for (const row of rows) {
    if (!row.skill_id) continue;
    const entry = counts[row.skill_id];
    if (!entry) continue;
    entry.total += 1;
    if (row.status === "new" || row.status === "pending") entry.newCount += 1;
  }
  return counts;
}

export async function resolveAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
