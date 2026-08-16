import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type SkillRow = Tables<"skills">;
export type JobRow = Tables<"jobs">;
export type ContactMessage = Tables<"contact_messages">;
export type Inquiry = Tables<"inquiries">;
export type Application = Tables<"applications">;

export type PublicProfile = Pick<
  Profile,
  | "id"
  | "full_name"
  | "college"
  | "location"
  | "avatar_url"
  | "bio"
  | "availability"
  | "portfolio_url"
  | "linkedin_url"
>;

export type Skill = SkillRow & { profile: PublicProfile | null; isSample?: boolean };
export type Job = JobRow & { profile: PublicProfile | null; isSample?: boolean };

export function profileCompletion(profile: Profile | null): number {
  if (!profile) return 0;
  const fields: (keyof Profile)[] = [
    "full_name",
    "college",
    "location",
    "bio",
    "avatar_url",
    "portfolio_url",
    "linkedin_url",
    "availability",
  ];
  const filled = fields.filter((f) => {
    const value = profile[f];
    return typeof value === "string" && value.trim().length > 0;
  }).length;
  return Math.round((filled / fields.length) * 100);
}
