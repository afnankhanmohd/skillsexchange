import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CardSkeletonGrid } from "@/components/CardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SkillCard } from "@/components/SkillCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { fetchSavedItems, fetchSkills, toggleSaved } from "@/lib/api";
import { EXCHANGE_PREFERENCES, EXPERIENCE_LEVELS, SKILL_CATEGORIES, WORK_MODES } from "@/lib/constants";
import { sampleSkills } from "@/lib/sample-data";
import type { Skill } from "@/lib/types";

const ANY = "any";
const PAGE_SIZE = 9;

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  exchange: z.string().optional(),
  mode: z.string().optional(),
  sort: z.enum(["newest", "relevant", "alpha"]).optional(),
});

export const Route = createFileRoute("/skills/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Explore student skills — skillSExhange" },
      {
        name: "description",
        content:
          "Browse skills students offer: web development, design, video editing, tutoring, data analysis and more. Filter by category, level and exchange preference.",
      },
      { property: "og:title", content: "Explore student skills — skillSExhange" },
      {
        property: "og:description",
        content: "Find a peer with the exact skill you need, and exchange value your way.",
      },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const skillsQuery = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });
  const savedQuery = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: () => fetchSavedItems(user!.id),
  });

  const saveMutation = useMutation({
    mutationFn: ({ skill, isSaved }: { skill: Skill; isSaved: boolean }) =>
      toggleSaved(user!.id, "skill", skill.id, isSaved),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saved", user?.id] });
      toast.success(variables.isSaved ? "Removed from saved" : "Saved to your dashboard");
    },
    onError: (error) => toast.error("Could not update saved items", { description: error.message }),
  });

  function patch(next: Partial<z.infer<typeof searchSchema>>) {
    setVisible(PAGE_SIZE);
    navigate({ to: "/skills", search: { ...search, ...next } });
  }

  const rows = skillsQuery.data?.length ? skillsQuery.data : skillsQuery.isSuccess ? sampleSkills : [];

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    let list = rows.filter((skill) => {
      if (search.category && search.category !== ANY && skill.category !== search.category) return false;
      if (search.level && search.level !== ANY && skill.experience_level !== search.level) return false;
      if (search.exchange && search.exchange !== ANY && skill.exchange_preference !== search.exchange)
        return false;
      if (search.mode && search.mode !== ANY && skill.work_mode !== search.mode) return false;
      if (!q) return true;
      return [skill.title, skill.description, skill.category, skill.help_offered, skill.profile?.full_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });

    if (search.sort === "alpha") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (search.sort === "relevant" && q) {
      list = [...list].sort(
        (a, b) => Number(b.title.toLowerCase().includes(q)) - Number(a.title.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [rows, search]);

  const isSample = skillsQuery.isSuccess && !skillsQuery.data?.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Explore skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} skill{filtered.length === 1 ? "" : "s"} offered by students.
          </p>
        </div>
        <Button asChild>
          <Link to="/skills/new">
            <Plus className="size-4" /> Add your skill
          </Link>
        </Button>
      </div>

      <section aria-label="Filters" className="card-surface mt-6 space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4" /> Filters
        </div>
        <div className="relative">
          <Label htmlFor="skill-search" className="sr-only">
            Search skills
          </Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="skill-search"
            value={search.q ?? ""}
            onChange={(event) => patch({ q: event.target.value || undefined })}
            placeholder="Search by keyword, skill, or student"
            className="pl-9"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label="Category"
            value={search.category ?? ANY}
            options={SKILL_CATEGORIES}
            onChange={(value) => patch({ category: value === ANY ? undefined : value })}
          />
          <FilterSelect
            label="Experience"
            value={search.level ?? ANY}
            options={EXPERIENCE_LEVELS}
            onChange={(value) => patch({ level: value === ANY ? undefined : value })}
          />
          <FilterSelect
            label="Exchange"
            value={search.exchange ?? ANY}
            options={EXCHANGE_PREFERENCES}
            onChange={(value) => patch({ exchange: value === ANY ? undefined : value })}
          />
          <FilterSelect
            label="Work mode"
            value={search.mode ?? ANY}
            options={WORK_MODES}
            onChange={(value) => patch({ mode: value === ANY ? undefined : value })}
          />
          <FilterSelect
            label="Sort by"
            value={search.sort ?? "newest"}
            options={["newest", "relevant", "alpha"]}
            labels={{ newest: "Newest", relevant: "Most relevant", alpha: "A–Z" }}
            includeAny={false}
            onChange={(value) => patch({ sort: value as "newest" | "relevant" | "alpha" })}
          />
        </div>
      </section>

      {isSample ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing sample listings until students publish real skills.
        </p>
      ) : null}

      <div className="mt-6">
        {skillsQuery.isLoading ? (
          <CardSkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No skills match those filters"
            description="Try clearing a filter or searching a broader keyword."
            action={
              <Button variant="outline" onClick={() => navigate({ to: "/skills", search: {} })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, visible).map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isSaved={savedQuery.data?.skillIds.has(skill.id)}
                  onToggleSave={
                    user && !skill.isSample
                      ? (item) =>
                          saveMutation.mutate({
                            skill: item,
                            isSaved: !!savedQuery.data?.skillIds.has(item.id),
                          })
                      : undefined
                  }
                />
              ))}
            </div>
            {visible < filtered.length ? (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => setVisible((value) => value + PAGE_SIZE)}>
                  Load more skills
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  labels,
  includeAny = true,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  labels?: Record<string, string>;
  includeAny?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeAny ? <SelectItem value={ANY}>Any</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labels?.[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
