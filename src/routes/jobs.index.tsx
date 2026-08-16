import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CardSkeletonGrid } from "@/components/CardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { JobCard } from "@/components/JobCard";
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
import { fetchJobs, fetchSavedItems, toggleSaved } from "@/lib/api";
import { COMPENSATION_TYPES, JOB_CATEGORIES, WORK_MODES } from "@/lib/constants";
import { sampleJobs } from "@/lib/sample-data";
import type { Job } from "@/lib/types";

const ANY = "any";
const PAGE_SIZE = 9;

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  skill: z.string().optional(),
  compensation: z.string().optional(),
  mode: z.string().optional(),
  sort: z.enum(["newest", "deadline", "alpha"]).optional(),
});

export const Route = createFileRoute("/jobs/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Student jobs, gigs & collaborations — skillSExhange" },
      {
        name: "description",
        content:
          "Browse student-friendly jobs, gigs, internships and collaboration requests. Filter by category, required skill, compensation and work mode.",
      },
      { property: "og:title", content: "Student jobs & projects — skillSExhange" },
      {
        property: "og:description",
        content: "Find paid gigs, skill exchanges and volunteer projects posted by students.",
      },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const jobsQuery = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const savedQuery = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: () => fetchSavedItems(user!.id),
  });

  const saveMutation = useMutation({
    mutationFn: ({ job, isSaved }: { job: Job; isSaved: boolean }) =>
      toggleSaved(user!.id, "job", job.id, isSaved),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saved", user?.id] });
      toast.success(variables.isSaved ? "Removed from saved" : "Saved to your dashboard");
    },
    onError: (error) => toast.error("Could not update saved items", { description: error.message }),
  });

  function patch(next: Partial<z.infer<typeof searchSchema>>) {
    setVisible(PAGE_SIZE);
    navigate({ to: "/jobs", search: { ...search, ...next } });
  }

  const rows = jobsQuery.data?.length ? jobsQuery.data : jobsQuery.isSuccess ? sampleJobs : [];

  const allSkills = useMemo(
    () => Array.from(new Set(rows.flatMap((job) => job.required_skills))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    let list = rows.filter((job) => {
      if (search.category && search.category !== ANY && job.category !== search.category) return false;
      if (search.compensation && search.compensation !== ANY && job.compensation_type !== search.compensation)
        return false;
      if (search.mode && search.mode !== ANY && job.work_mode !== search.mode) return false;
      if (search.skill && search.skill !== ANY && !job.required_skills.includes(search.skill)) return false;
      if (!q) return true;
      return [job.title, job.description, job.category, job.organization, ...job.required_skills]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });

    if (search.sort === "alpha") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (search.sort === "deadline") {
      list = [...list].sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
    }
    return list;
  }, [rows, search]);

  const isSample = jobsQuery.isSuccess && !jobsQuery.data?.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Find jobs & projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"} for students.
          </p>
        </div>
        <Button asChild>
          <Link to="/jobs/new">
            <Plus className="size-4" /> Post a job
          </Link>
        </Button>
      </div>

      <section aria-label="Filters" className="card-surface mt-6 space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4" /> Filters
        </div>
        <div className="relative">
          <Label htmlFor="job-search" className="sr-only">
            Search jobs
          </Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="job-search"
            value={search.q ?? ""}
            onChange={(event) => patch({ q: event.target.value || undefined })}
            placeholder="Search by keyword, role, or organisation"
            className="pl-9"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <JobFilter
            label="Category"
            value={search.category ?? ANY}
            options={JOB_CATEGORIES}
            onChange={(value) => patch({ category: value === ANY ? undefined : value })}
          />
          <JobFilter
            label="Required skill"
            value={search.skill ?? ANY}
            options={allSkills}
            onChange={(value) => patch({ skill: value === ANY ? undefined : value })}
          />
          <JobFilter
            label="Compensation"
            value={search.compensation ?? ANY}
            options={COMPENSATION_TYPES}
            onChange={(value) => patch({ compensation: value === ANY ? undefined : value })}
          />
          <JobFilter
            label="Work mode"
            value={search.mode ?? ANY}
            options={WORK_MODES}
            onChange={(value) => patch({ mode: value === ANY ? undefined : value })}
          />
          <JobFilter
            label="Sort by"
            value={search.sort ?? "newest"}
            options={["newest", "deadline", "alpha"]}
            labels={{ newest: "Newest", deadline: "Deadline soon", alpha: "A–Z" }}
            includeAny={false}
            onChange={(value) => patch({ sort: value as "newest" | "deadline" | "alpha" })}
          />
        </div>
      </section>

      {isSample ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing sample opportunities until students publish real listings.
        </p>
      ) : null}

      <div className="mt-6">
        {jobsQuery.isLoading ? (
          <CardSkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No opportunities match those filters"
            description="Adjust your filters, or post the opportunity you're looking for."
            action={
              <Button variant="outline" onClick={() => navigate({ to: "/jobs", search: {} })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, visible).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedQuery.data?.jobIds.has(job.id) ?? false}
                  {...(user && !job.isSample
                    ? {
                        onToggleSave: (item: Job) =>
                          saveMutation.mutate({
                            job: item,
                            isSaved: !!savedQuery.data?.jobIds.has(item.id),
                          }),
                      }
                    : {})}
                />
              ))}
            </div>
            {visible < filtered.length ? (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => setVisible((value) => value + PAGE_SIZE)}>
                  Load more jobs
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function JobFilter({
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
