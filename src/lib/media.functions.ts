import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  bucket: z.enum(["avatars", "listing-photos"]),
  paths: z.array(z.string().min(1).max(500)).max(20),
});

// Signs photo links only for files that are actually shown publicly:
// avatars referenced by a profile, and photos attached to an active listing.
export const signPublicMedia = createServerFn({ method: "POST" })
  .inputValidator((data) => input.parse(data))
  .handler(async ({ data }) => {
    const paths = data.paths.filter((p) => !p.startsWith("http"));
    if (!paths.length) return [] as { path: string; url: string }[];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let allowed: string[] = [];
    if (data.bucket === "avatars") {
      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select("avatar_url")
        .in("avatar_url", paths);
      allowed = (rows ?? []).map((r) => r.avatar_url as string);
    } else {
      const { data: rows } = await supabaseAdmin
        .from("skills")
        .select("photos")
        .eq("is_active", true)
        .overlaps("photos", paths);
      const set = new Set((rows ?? []).flatMap((r) => r.photos ?? []));
      allowed = paths.filter((p) => set.has(p));
    }
    if (!allowed.length) return [];
    const { data: signed } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrls(allowed, 60 * 60);
    return (signed ?? [])
      .filter((s) => s.signedUrl && s.path)
      .map((s) => ({ path: s.path as string, url: s.signedUrl }));
  });
