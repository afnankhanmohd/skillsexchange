import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clock,
  Globe,
  Handshake,
  Linkedin,
  Loader2,
  MapPin,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/Chip";
import { ContactDetails } from "@/components/ContactDetails";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchSavedItems, fetchSkill, toggleSaved } from "@/lib/api";
import { sampleSkills } from "@/lib/sample-data";
import type { Skill } from "@/lib/types";

export const Route = createFileRoute("/skills/$skillId")({
  loader: async ({ params }) => {
    let skill: Skill | null = null;
    try {
      skill = await fetchSkill(params.skillId);
    } catch {
      skill = null;
    }
    if (!skill) skill = sampleSkills.find((s) => s.id === params.skillId) ?? null;
    if (!skill) return { title: null, description: null, author: null, category: null };
    return {
      title: skill.title,
      description: skill.description,
      author: skill.profile?.full_name ?? null,
      category: skill.category,
    };
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.title
      ? `${loaderData.title}${loaderData.author ? ` by ${loaderData.author}` : ""} — skillSExhange`
      : "Skill details — skillSExhange";
    const summary = loaderData?.description
      ? `${loaderData.category ? `${loaderData.category}: ` : ""}${loaderData.description}`.slice(0, 155)
      : "See what this student can help with, how they prefer to exchange, and send an inquiry.";
    const url = `https://skillsexchange.lovable.app/skills/${params.skillId}`;
    return {
      meta: [
        { title },
        { name: "description", content: summary },
        { property: "og:title", content: title },
        { property: "og:description", content: summary },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: SkillDetailPage,
});

function SkillDetailPage() {
  const { skillId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const skillQuery = useQuery({
    queryKey: ["skill", skillId],
    queryFn: async () => {
      const sample = sampleSkills.find((item) => item.id === skillId);
      if (sample) return sample;
      const skill = await fetchSkill(skillId);
      if (!skill) throw notFound();
      return skill;
    },
  });

  const savedQuery = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: () => fetchSavedItems(user!.id),
  });

  const skill = skillQuery.data;
  const isSaved = !!(skill && savedQuery.data?.skillIds.has(skill.id));

  const saveMutation = useMutation({
    mutationFn: () => toggleSaved(user!.id, skill!.id, isSaved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved", user?.id] });
      toast.success(isSaved ? "Removed from saved" : "Saved to your dashboard");
    },
    onError: (error) => toast.error("Could not update saved items", { description: error.message }),
  });

  const inquiryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inquiries").insert({
        sender_id: user!.id,
        recipient_id: skill!.user_id,
        skill_id: skill!.id,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inquiries", user?.id] });
      toast.success("Inquiry sent", { description: "You'll see replies in your dashboard." });
    },
    onError: (error) => toast.error("Inquiry not sent", { description: error.message }),
  });

  if (skillQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!skill) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/skills">
          <ArrowLeft className="size-4" /> Back to skills
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <article className="card-surface p-6">
          <div className="flex flex-wrap gap-2">
            <Chip tone="primary">{skill.category}</Chip>
            {skill.experience_level ? <Chip>{skill.experience_level}</Chip> : null}
            {skill.exchange_preference ? <Chip tone="accent">{skill.exchange_preference}</Chip> : null}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{skill.title}</h1>
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {skill.description}
          </p>

          {skill.help_offered ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold">What they can help with</h2>
              <p className="mt-1.5 text-sm whitespace-pre-line text-muted-foreground">
                {skill.help_offered}
              </p>
            </section>
          ) : null}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Work mode</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                {skill.work_mode ?? "Flexible"}
                {skill.location ? ` · ${skill.location}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Availability</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                {skill.availability ?? "Ask the student"}
              </dd>
            </div>
          </dl>
        </article>

        <aside className="card-surface h-fit p-6">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={skill.profile?.full_name ?? "Student"}
              avatarPath={skill.profile?.avatar_url ?? null}
              className="size-12"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold">{skill.profile?.full_name ?? "Student"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {skill.profile?.college ?? "Student"}
              </p>
            </div>
          </div>

          {skill.profile?.bio ? (
            <p className="mt-4 text-sm text-muted-foreground">{skill.profile.bio}</p>
          ) : null}

          <div className="mt-4 space-y-2 text-sm">
            {skill.profile?.portfolio_url ? (
              <a
                href={skill.profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Globe className="size-4" /> Portfolio
              </a>
            ) : null}
            {skill.profile?.linkedin_url ? (
              <a
                href={skill.profile.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Linkedin className="size-4" /> LinkedIn
              </a>
            ) : null}
          </div>

          {!skill.isSample ? (
            <div className="mt-5">
              <ContactDetails
                userId={skill.user_id}
                name={skill.profile?.full_name ?? "this student"}
                subject={`skillSExhange: ${skill.title}`}
              />
            </div>
          ) : null}



          <div className="mt-6 space-y-2">
            {user && !skill.isSample ? (
              <>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={skill.user_id === user.id}>
                      <Send className="size-4" />
                      {skill.user_id === user.id ? "This is your listing" : "Send an inquiry"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send an inquiry</DialogTitle>
                      <DialogDescription>
                        Tell {skill.profile?.full_name ?? "this student"} what you need and what you can
                        offer in return.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                      <Label htmlFor="inquiry-message">Message</Label>
                      <Textarea
                        id="inquiry-message"
                        rows={5}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Hi! I'd love help with…"
                      />
                      {message.trim().length > 0 && message.trim().length < 15 ? (
                        <p className="text-xs text-destructive">Write at least 15 characters.</p>
                      ) : null}
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => inquiryMutation.mutate()}
                        disabled={message.trim().length < 15 || inquiryMutation.isPending}
                      >
                        {inquiryMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        Send inquiry
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                  {isSaved ? "Saved" : "Save skill"}
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link to="/auth">
                  <Handshake className="size-4" /> Sign in to connect
                </Link>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
