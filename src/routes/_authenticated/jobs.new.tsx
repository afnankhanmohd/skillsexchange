import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Chip } from "@/components/Chip";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COMPENSATION_TYPES, JOB_CATEGORIES, WORK_MODES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/jobs/new")({
  head: () => ({
    meta: [
      { title: "Post a job — skillSExhange" },
      {
        name: "description",
        content:
          "Post a gig, project, or collaboration request and reach students with the exact skills you need.",
      },
      { property: "og:title", content: "Post a job — skillSExhange" },
      {
        property: "og:description",
        content: "Reach students with the skills your project needs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewJobPage,
});

const schema = z.object({
  title: z.string().trim().min(4, "Give the opportunity a clear title").max(120),
  organization: z.string().trim().max(120).optional(),
  category: z.enum(JOB_CATEGORIES, { message: "Pick a category" }),
  description: z.string().trim().min(40, "Describe the work in at least 40 characters").max(2000),
  compensation_type: z.enum(COMPENSATION_TYPES),
  compensation_details: z.string().trim().max(300).optional(),
  work_mode: z.enum(WORK_MODES),
  location: z.string().trim().max(120).optional(),
  deadline: z.string().trim().optional(),
  status: z.enum(["draft", "open"]),
});

function NewJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState("");
  const [compensation, setCompensation] = useState("Paid");
  const [mode, setMode] = useState("Remote");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("jobs").insert({
        user_id: user.id,
        title: values.title,
        organization: values.organization || null,
        category: values.category,
        description: values.description,
        required_skills: skills,
        compensation_type: values.compensation_type,
        compensation_details: values.compensation_details || null,
        work_mode: values.work_mode,
        location: values.location || null,
        deadline: values.deadline || null,
        status: values.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job posted", { description: "You can manage it from your dashboard." });
      void navigate({ to: "/dashboard" });
    },
    onError: (error) =>
      toast.error("Could not post this job", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  function addSkill() {
    const value = skillInput.trim();
    if (!value || skills.includes(value) || skills.length >= 10) return;
    setSkills((current) => [...current, value]);
    setSkillInput("");
  }

  function submit(event: React.FormEvent<HTMLFormElement>, status: "draft" | "open") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      title: form.get("title") ?? "",
      organization: form.get("organization") ?? "",
      category,
      description: form.get("description") ?? "",
      compensation_type: compensation,
      compensation_details: form.get("compensation_details") ?? "",
      work_mode: mode,
      location: form.get("location") ?? "",
      deadline: form.get("deadline") ?? "",
      status,
    });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    createMutation.mutate(parsed.data);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Post a job or project</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell students exactly what you need, the timeline, and what they get in return.
      </p>

      <form
        className="card-surface mt-6 space-y-4 p-5 sm:p-6"
        onSubmit={(event) => submit(event, "open")}
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="title">Job title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Build a landing page for our student club"
          />
          {errors["title"] ? <p className="text-xs text-destructive">{errors["title"]}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="organization">Organization (optional)</Label>
            <Input id="organization" name="organization" placeholder="e.g. Design Club" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {JOB_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors["category"] ? (
              <p className="text-xs text-destructive">{errors["category"]}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Detailed description</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            placeholder="Scope, deliverables, timeline, and anything a student should know before applying."
          />
          {errors["description"] ? (
            <p className="text-xs text-destructive">{errors["description"]}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="required_skills">Required skills</Label>
          <div className="flex gap-2">
            <Input
              id="required_skills"
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Type a skill and press Enter"
            />
            <Button type="button" variant="outline" onClick={addSkill}>
              Add
            </Button>
          </div>
          {skills.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Chip key={skill} tone="primary">
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() => setSkills((current) => current.filter((s) => s !== skill))}
                  >
                    <X className="size-3" />
                  </button>
                </Chip>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Compensation type</Label>
            <Select value={compensation} onValueChange={setCompensation}>
              <SelectTrigger aria-label="Compensation type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPENSATION_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compensation_details">Budget / reward</Label>
            <Input
              id="compensation_details"
              name="compensation_details"
              placeholder="e.g. ₹4,000 or a design portfolio credit"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Work mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger aria-label="Work mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g. Delhi" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" name="deadline" type="date" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Publish job
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={createMutation.isPending}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (!form) return;
              submit(
                {
                  preventDefault: () => {},
                  currentTarget: form,
                } as unknown as React.FormEvent<HTMLFormElement>,
                "draft",
              );
            }}
          >
            Save as draft
          </Button>
        </div>
      </form>
    </div>
  );
}
