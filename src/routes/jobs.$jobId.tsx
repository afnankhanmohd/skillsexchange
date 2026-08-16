import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  Globe,
  Loader2,
  MapPin,
  Send,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/Chip";
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
import { fetchJob, fetchSavedItems, toggleSaved } from "@/lib/api";
import { sampleJobs } from "@/lib/sample-data";

export const Route = createFileRoute("/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job details — skillSExhange" },
      {
        name: "description",
        content:
          "Read the full brief, required skills, compensation, and deadline, then express interest in this student opportunity.",
      },
      { property: "og:title", content: "Job details — skillSExhange" },
      {
        property: "og:description",
        content: "A student-friendly opportunity on the skillSExhange marketplace.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">We couldn&apos;t load this job</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
      <Button asChild className="mt-6">
        <Link to="/jobs">Back to jobs</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Job not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This listing may have been removed.</p>
      <Button asChild className="mt-6">
        <Link to="/jobs">Browse jobs</Link>
      </Button>
    </div>
  ),
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const sample = sampleJobs.find((item) => item.id === jobId);
      if (sample) return sample;
      const job = await fetchJob(jobId);
      if (!job) throw notFound();
      return job;
    },
  });

  const savedQuery = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: () => fetchSavedItems(user!.id),
  });

  const job = jobQuery.data;
  const isSaved = job ? (savedQuery.data?.jobIds.has(job.id) ?? false) : false;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !job) return;
      await toggleSaved(user.id, "job", job.id, isSaved);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved", user?.id] });
      toast.success(isSaved ? "Removed from saved" : "Saved for later");
    },
    onError: () => toast.error("Could not update your saved jobs"),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!user || !job) throw new Error("Sign in required");
      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        applicant_id: user.id,
        message: message.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setMessage("");
      toast.success("Interest sent", { description: "The poster can now see your application." });
      void queryClient.invalidateQueries({ queryKey: ["applications", user?.id] });
    },
    onError: (error) =>
      toast.error("Could not send your application", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  if (jobQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!job) return null;

  const isOwner = user?.id === job.user_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to jobs
      </Link>

      <div className="card-surface mt-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.organization || job.profile?.full_name || "Student poster"}
            </p>
          </div>
          <Chip tone={job.status === "open" ? "accent" : "neutral"}>{job.status}</Chip>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>{job.category}</Chip>
          {job.compensation_type ? (
            <Chip tone="accent">
              <Wallet className="size-3.5" /> {job.compensation_type}
            </Chip>
          ) : null}
          {job.work_mode ? (
            <Chip tone="neutral">
              <Globe className="size-3.5" /> {job.work_mode}
            </Chip>
          ) : null}
          {job.location ? (
            <Chip tone="neutral">
              <MapPin className="size-3.5" /> {job.location}
            </Chip>
          ) : null}
          {job.deadline ? (
            <Chip tone="neutral">
              <CalendarClock className="size-3.5" /> Apply by{" "}
              {new Date(job.deadline).toLocaleDateString()}
            </Chip>
          ) : null}
        </div>

        <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {job.description}
        </p>

        {job.compensation_details ? (
          <p className="mt-4 text-sm">
            <span className="font-medium">Compensation:</span>{" "}
            <span className="text-muted-foreground">{job.compensation_details}</span>
          </p>
        ) : null}

        {job.required_skills?.length ? (
          <div className="mt-5">
            <h2 className="text-sm font-semibold">Required skills</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.required_skills.map((skill) => (
                <Chip key={skill} tone="neutral">
                  {skill}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
          <UserAvatar
            name={job.profile?.full_name ?? "Student"}
            avatarPath={job.profile?.avatar_url ?? null}
            className="size-11"
          />
          <div className="text-sm">
            <p className="font-medium">{job.profile?.full_name ?? "Student poster"}</p>
            <p className="text-muted-foreground">{job.profile?.college ?? "Student community"}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isOwner || job.status !== "open" || !!job.isSample}>
                    <Send className="size-4" />
                    {isOwner ? "This is your listing" : "Apply / express interest"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Express interest</DialogTitle>
                    <DialogDescription>
                      Tell the poster why you&apos;re a good fit for “{job.title}”.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-1.5">
                    <Label htmlFor="application-message">Message</Label>
                    <Textarea
                      id="application-message"
                      rows={5}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Share relevant work, availability, and how you'd approach this."
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => applyMutation.mutate()}
                      disabled={applyMutation.isPending || message.trim().length < 10}
                    >
                      {applyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Send application
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !!job.isSample}
              >
                {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {isSaved ? "Saved" : "Save job"}
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link to="/auth" search={{ mode: "signin" }}>
                Sign in to apply
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
