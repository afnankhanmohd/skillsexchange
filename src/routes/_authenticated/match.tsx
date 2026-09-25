import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchSkills } from "@/lib/api";
import { findStudentMatches, type MatchResult } from "@/lib/match.functions";

export const Route = createFileRoute("/_authenticated/match")({
  head: () => ({
    meta: [
      { title: "Find a student match — skillSExhange" },
      { name: "description", content: "Describe what you need and get AI-picked students who can help." },
      { property: "og:title", content: "Find a student match — skillSExhange" },
      { property: "og:description", content: "AI suggests the best students for your skill or project needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchPage,
});

function MatchPage() {
  const [need, setNeed] = useState("");
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const find = useServerFn(findStudentMatches);
  const { data: skills = [] } = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });

  const mutation = useMutation({
    mutationFn: (text: string) => find({ data: { need: text } }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setResults(res.matches);
    },
    onError: () => toast.error("Could not find matches. Please try again."),
  });

  const byId = new Map(skills.map((s) => [s.id, s]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Sparkles className="size-6 text-primary" /> Find a student match
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us what you need help with or what your project is. We'll suggest students who fit.
      </p>

      <form
        className="card-surface mt-6 space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (need.trim().length < 5) {
            toast.error("Write a little more about what you need.");
            return;
          }
          mutation.mutate(need.trim());
        }}
      >
        <Textarea
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="e.g. I need someone to help design a poster for our science fair."
          aria-label="What do you need help with"
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {mutation.isPending ? "Finding matches…" : "Find matches"}
        </Button>
      </form>

      {results ? (
        <section className="mt-6 space-y-3">
          {results.length === 0 ? (
            <p className="card-surface p-5 text-sm text-muted-foreground">
              No good matches yet. Try describing your need differently, or check back as more students join.
            </p>
          ) : (
            results.map((m) => {
              const skill = byId.get(m.skillId);
              if (!skill) return null;
              return (
                <Link
                  key={m.skillId}
                  to="/skills/$skillId"
                  params={{ skillId: m.skillId }}
                  className="card-surface flex gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
                >
                  <UserAvatar name={skill.profile?.full_name ?? "Student"} avatarPath={skill.profile?.avatar_url ?? null} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{skill.title}</p>
                      <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        {m.score}% match
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{skill.profile?.full_name ?? "Student"}</p>
                    <p className="mt-1 text-sm">{m.reason}</p>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      ) : null}
    </div>
  );
}
