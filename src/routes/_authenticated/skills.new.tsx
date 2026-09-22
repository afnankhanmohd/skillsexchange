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
import { EXPERIENCE_LEVELS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/skills/new")({
  head: () => ({
    meta: [
      { title: "Add a skill — skillSExhange" },
      {
        name: "description",
        content:
          "Add a skill in two simple steps so other students can find you and ask for your help.",
      },
      { property: "og:title", content: "Add a skill — skillSExhange" },
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
  title: z.string().trim().min(3, "Write what you are good at").max(90),
  help_offered: z.string().trim().min(10, "Tell us a little more").max(600),
  experience_level: z.enum(EXPERIENCE_LEVELS),
});

function NewSkillPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [level, setLevel] = useState<string>("Beginner");

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          title: values.title,
          category: "Other",
          description: values.help_offered,
          help_offered: values.help_offered,
          experience_level: values.experience_level,
          exchange_preference: "Either",
          work_mode: null,
          location: null,
          availability: null,
          photos: [],
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (skillId) => {
      queryClient.invalidateQueries({ queryKey: ["my-skills", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success("Skill added", { description: "Other students can now see it." });
      void navigate({ to: "/skills/$skillId", params: { skillId } });
    },
    onError: (error) =>
      toast.error("Could not add your skill", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      title: form.get("title") ?? "",
      help_offered: form.get("help_offered") ?? "",
      experience_level: level,
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
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Add a skill</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Just three easy questions. It takes less than a minute.
      </p>

      <form className="card-surface mt-6 space-y-5 p-5 sm:p-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="title">What are you good at?</Label>
          <Input id="title" name="title" placeholder="e.g. Drawing cartoons" />
          {errors["title"] ? <p className="text-xs text-destructive">{errors["title"]}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="help_offered">How can you help someone?</Label>
          <Textarea
            id="help_offered"
            name="help_offered"
            rows={4}
            placeholder="e.g. I can teach you how to draw cartoon faces step by step."
          />
          {errors["help_offered"] ? (
            <p className="text-xs text-destructive">{errors["help_offered"]}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label>How good are you at it?</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger aria-label="How good are you at it">
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

        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Add my skill
        </Button>
      </form>
    </div>
  );
}
