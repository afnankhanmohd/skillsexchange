import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ need: z.string().trim().min(5).max(1000) });

const MatchSchema = z.object({
  matches: z.array(z.object({ id: z.string(), score: z.number(), reason: z.string() })),
});

export type MatchResult = { skillId: string; score: number; reason: string };

export const findStudentMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<{ matches: MatchResult[]; error: string | null }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { matches: [], error: "AI matching is not set up yet." };

    const { data: skills, error } = await context.supabase
      .from("skills")
      .select("id, title, help_offered, description, experience_level, user_id")
      .eq("is_active", true)
      .neq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(150);
    if (error) return { matches: [], error: "Could not load skills." };
    if (!skills?.length) return { matches: [], error: null };

    const catalog = skills
      .map(
        (s) =>
          `id:${s.id} | ${s.title} | level:${s.experience_level ?? "-"} | ${(s.help_offered ?? s.description ?? "").slice(0, 200)}`,
      )
      .join("\n");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema: MatchSchema }),
        system:
          "You match students with other students' skills. Given a student's need and a list of skills, return up to 6 of the most relevant skills (only ids from the list), score 0-100, and a short friendly one-sentence reason in simple words. Return an empty list if nothing fits.",
        prompt: `Student need:\n${data.need}\n\nSkills:\n${catalog}`,
        maxRetries: 0,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const output = await result.output;
      const valid = new Set(skills.map((s) => s.id));
      const matches = output.matches
        .filter((m) => valid.has(m.id))
        .slice(0, 6)
        .map((m) => ({ skillId: m.id, score: Math.max(0, Math.min(100, Math.round(m.score))), reason: m.reason }));
      return { matches, error: null };
    } catch (e) {
      console.error("match error", e);
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) return { matches: [], error: "Too many requests right now. Please try again in a moment." };
      if (status === 402) return { matches: [], error: "AI credits have run out. Please add credits to keep matching." };
      return { matches: [], error: "Could not find matches right now. Please try again." };
    }
  });
