import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { uploadListingPhotos } from "@/lib/api";
import {
  EXCHANGE_PREFERENCES,
  EXPERIENCE_LEVELS,
  SKILL_CATEGORIES,
  WORK_MODES,
} from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/skills/new")({
  head: () => ({
    meta: [
      { title: "Publish a skill — skillSExhange" },
      {
        name: "description",
        content:
          "Add a skill to your profile so other students can discover what you offer and how you like to exchange.",
      },
      { property: "og:title", content: "Publish a skill — skillSExhange" },
      {
        property: "og:description",
        content: "Share what you can help other students with.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewSkillPage,
});

const schema = z.object({
  title: z.string().trim().min(4, "Give your skill a clear title").max(90),
  category: z.enum(SKILL_CATEGORIES, { message: "Pick a category" }),
  description: z.string().trim().min(30, "Describe your skill in at least 30 characters").max(1200),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  exchange_preference: z.enum(EXCHANGE_PREFERENCES),
  work_mode: z.enum(WORK_MODES),
  help_offered: z.string().trim().max(600).optional(),
  location: z.string().trim().max(120).optional(),
  availability: z.string().trim().max(120).optional(),
});

function NewSkillPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<string>("");
  const [level, setLevel] = useState<string>("Intermediate");
  const [exchange, setExchange] = useState<string>("Either");
  const [mode, setMode] = useState<string>("Remote");
  const [files, setFiles] = useState<File[]>([]);

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!user) throw new Error("Not signed in");
      const photos = files.length > 0 ? await uploadListingPhotos(user.id, files) : [];
      const { data, error } = await supabase
        .from("skills")
        .insert({
          photos,
          user_id: user.id,
          title: values.title,
          category: values.category,
          description: values.description,
          experience_level: values.experience_level,
          exchange_preference: values.exchange_preference,
          work_mode: values.work_mode,
          help_offered: values.help_offered || null,
          location: values.location || null,
          availability: values.availability || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (skillId) => {
      queryClient.invalidateQueries({ queryKey: ["my-skills", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setFiles([]);
      toast.success("Skill published", { description: "Students can now discover it." });
      void navigate({ to: "/skills/$skillId", params: { skillId } });
    },
    onError: (error) =>
      toast.error("Could not publish your skill", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      title: form.get("title") ?? "",
      category,
      description: form.get("description") ?? "",
      experience_level: level,
      exchange_preference: exchange,
      work_mode: mode,
      help_offered: form.get("help_offered") ?? "",
      location: form.get("location") ?? "",
      availability: form.get("availability") ?? "",
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
      <h1 className="text-2xl font-bold tracking-tight">Publish a skill</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Be specific — clear listings get far more inquiries.
      </p>

      <form className="card-surface mt-6 space-y-4 p-5 sm:p-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="title">Skill title</Label>
          <Input id="title" name="title" placeholder="e.g. React Frontend Developer" />
          {errors["title"] ? <p className="text-xs text-destructive">{errors["title"]}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((item) => (
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
          <div className="space-y-1.5">
            <Label>Experience level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger aria-label="Experience level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="What do you do, what tools do you use, and what results have you delivered?"
          />
          {errors["description"] ? (
            <p className="text-xs text-destructive">{errors["description"]}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="help_offered">What you can help with</Label>
          <Textarea
            id="help_offered"
            name="help_offered"
            rows={3}
            placeholder="e.g. Landing pages, component libraries, code reviews"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Exchange preference</Label>
            <Select value={exchange} onValueChange={setExchange}>
              <SelectTrigger aria-label="Exchange preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXCHANGE_PREFERENCES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g. Pune, India" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="availability">Availability</Label>
            <Input id="availability" name="availability" placeholder="e.g. 8 hrs/week" />
          </div>
        </div>

        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Publish skill
        </Button>
      </form>
    </div>
  );
}
