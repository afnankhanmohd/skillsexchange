import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Globe,
  Handshake,
  FileText,
  Inbox,
  Linkedin,
  Loader2,
  MapPin,
  Pencil,
  Send,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  createSkillApplication,
  fetchSavedItems,
  fetchSkill,
  fetchSkillInquiries,
  resolveListingPhotoUrls,
  toggleSaved,
  updateInquiryStatus,
} from "@/lib/api";
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
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);

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
  const isOwner = !!(user && skill && skill.user_id === user.id && !skill.isSample);

  const photosQuery = useQuery({
    queryKey: ["skill-photos", skillId, skill?.photos],
    enabled: !!skill && (skill.photos?.length ?? 0) > 0,
    queryFn: () => resolveListingPhotoUrls(skill?.photos ?? []),
  });

  const inboxQuery = useQuery({
    queryKey: ["skill-inquiries", skillId],
    enabled: isOwner,
    queryFn: () => fetchSkillInquiries(skillId),
  });

  useEffect(() => {
    if (!isOwner) return;
    const channel = supabase
      .channel(`listing-inbox-${skillId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries", filter: `skill_id=eq.${skillId}` },
        () => queryClient.invalidateQueries({ queryKey: ["skill-inquiries", skillId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isOwner, skillId, queryClient]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-inquiries", skillId] });
      queryClient.invalidateQueries({ queryKey: ["inquiries", user?.id] });
      toast.success("Inquiry updated");
    },
    onError: (error) => toast.error("Could not update inquiry", { description: error.message }),
  });

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
      queryClient.invalidateQueries({ queryKey: ["skill-inquiries", skillId] });
      toast.success("Inquiry sent", {
        description: "It landed in this listing's inbox — replies show in your dashboard.",
      });
    },
    onError: (error) => toast.error("Inquiry not sent", { description: error.message }),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      createSkillApplication({
        skillId: skill!.id,
        applicantId: user!.id,
        coverLetter: coverLetter.trim(),
        resume,
      }),
    onSuccess: () => {
      setCoverLetter("");
      setResume(null);
      setApplyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["skill-applications", skillId] });
      queryClient.invalidateQueries({ queryKey: ["my-applications", user?.id] });
      toast.success("Application sent", {
        description: "Track it any time under My applications.",
      });
    },
    onError: (error) => toast.error("Application not sent", { description: error.message }),
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

          {(skill.photos?.length ?? 0) > 0 ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold">Photos</h2>
              {photosQuery.isLoading ? (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {skill.photos.map((path) => (
                    <Skeleton key={path} className="aspect-4/3 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(photosQuery.data ?? []).map((url, index) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={`${skill.title} sample ${index + 1}`}
                        loading="lazy"
                        className="aspect-4/3 w-full rounded-xl border border-border object-cover transition hover:opacity-90"
                      />
                    </a>
                  ))}
                </div>
              )}
            </section>
          ) : null}

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

      {isOwner ? (
        <section className="card-surface mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Inbox className="size-4 text-muted-foreground" /> Inbox for this listing
            </h2>
            {inboxQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground">
                {inboxQuery.data?.length ?? 0} inquir{(inboxQuery.data?.length ?? 0) === 1 ? "y" : "ies"}
              </span>
            )}
          </div>

          {inboxQuery.isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : inboxQuery.isError ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-destructive">We couldn't load this inbox.</p>
              <Button size="sm" variant="outline" onClick={() => void inboxQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : (inboxQuery.data?.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No inquiries yet. They will appear here the moment someone reaches out.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {inboxQuery.data!.map((inquiry) => (
                <li key={inquiry.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={inquiry.sender?.full_name ?? "Student"}
                      avatarPath={inquiry.sender?.avatar_url ?? null}
                      className="size-9"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {inquiry.sender?.full_name ?? "Student"}
                        </p>
                        <Chip tone={inquiry.status === "accepted" ? "accent" : "neutral"}>
                          {inquiry.status}
                        </Chip>
                        <span className="text-xs text-muted-foreground">
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm whitespace-pre-line text-muted-foreground">
                        {inquiry.message}
                      </p>
                      {inquiry.status === "new" ? (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: inquiry.id, status: "accepted" })
                            }
                          >
                            <Check className="size-4" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: inquiry.id, status: "declined" })
                            }
                          >
                            <X className="size-4" /> Decline
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
