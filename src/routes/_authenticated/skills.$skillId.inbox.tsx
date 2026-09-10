import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  FileText,
  Inbox,
  Loader2,
  Pencil,
  Send,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchSkill,
  fetchSkillApplications,
  fetchSkillInquiries,
  resolveResumeUrl,
  updateApplicationStatus,
  updateInquiryStatus,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/skills/$skillId/inbox")({
  head: () => ({
    meta: [
      { title: "Listing inbox — skillSExhange" },
      {
        name: "description",
        content:
          "Read every inquiry and application for one of your listings, and filter by new, accepted or declined.",
      },
      { property: "og:title", content: "Listing inbox — skillSExhange" },
      {
        property: "og:description",
        content: "Inquiries and applications for a single listing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListingInboxPage,
});

type Filter = "new" | "accepted" | "declined" | "all";

function ListingInboxPage() {
  const { skillId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("new");

  const skillQuery = useQuery({
    queryKey: ["skill", skillId],
    queryFn: () => fetchSkill(skillId),
  });

  const isOwner = !!(user && skillQuery.data && skillQuery.data.user_id === user.id);

  const inquiriesQuery = useQuery({
    queryKey: ["skill-inquiries", skillId],
    enabled: isOwner,
    queryFn: () => fetchSkillInquiries(skillId),
  });

  const applicationsQuery = useQuery({
    queryKey: ["skill-applications", skillId],
    enabled: isOwner,
    queryFn: () => fetchSkillApplications(skillId),
  });

  useEffect(() => {
    if (!isOwner) return;
    const channel = supabase
      .channel(`listing-inbox-page-${skillId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries", filter: `skill_id=eq.${skillId}` },
        () => queryClient.invalidateQueries({ queryKey: ["skill-inquiries", skillId] }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "skill_applications",
          filter: `skill_id=eq.${skillId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["skill-applications", skillId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isOwner, skillId, queryClient]);

  const inquiryStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-inquiries", skillId] });
      queryClient.invalidateQueries({ queryKey: ["inquiries", user?.id] });
      toast.success("Inquiry updated");
    },
    onError: (error) => toast.error("Could not update inquiry", { description: error.message }),
  });

  const applicationStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-applications", skillId] });
      toast.success("Application updated");
    },
    onError: (error) => toast.error("Could not update application", { description: error.message }),
  });

  type Item = {
    id: string;
    kind: "inquiry" | "application";
    status: string;
    createdAt: string;
    name: string;
    avatar: string | null;
    body: string;
    resumePath: string | null;
  };

  const items: Item[] = [
    ...(inquiriesQuery.data ?? []).map((row) => ({
      id: row.id,
      kind: "inquiry" as const,
      status: row.status,
      createdAt: row.created_at,
      name: row.sender?.full_name || "A student",
      avatar: row.sender?.avatar_url ?? null,
      body: row.message,
      resumePath: null,
    })),
    ...(applicationsQuery.data ?? []).map((row) => ({
      id: row.id,
      kind: "application" as const,
      status: row.status,
      createdAt: row.created_at,
      name: row.applicant?.full_name || "A student",
      avatar: row.applicant?.avatar_url ?? null,
      body: row.cover_letter,
      resumePath: row.resume_path,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    new: items.filter((item) => item.status === "new" || item.status === "pending").length,
    accepted: items.filter((item) => item.status === "accepted").length,
    declined: items.filter((item) => item.status === "declined").length,
    all: items.length,
  };

  const visible =
    filter === "all"
      ? items
      : filter === "new"
        ? items.filter((item) => item.status === "new" || item.status === "pending")
        : items.filter((item) => item.status === filter);

  const isLoading = skillQuery.isLoading || inquiriesQuery.isLoading || applicationsQuery.isLoading;

  if (skillQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!skillQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          icon={Inbox}
          title="Listing not found"
          description="This listing may have been removed."
          action={
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          icon={Inbox}
          title="This inbox isn't yours"
          description="Only the student who published this listing can read its inbox."
          action={
            <Button asChild>
              <Link to="/skills/$skillId" params={{ skillId }}>
                View the listing
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/skills/$skillId" params={{ skillId }}>
          <ArrowLeft className="size-4" /> Back to listing
        </Link>
      </Button>

      <header className="card-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Inbox className="size-5 text-muted-foreground" /> Inbox
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{skillQuery.data.title}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/skills/$skillId/edit" params={{ skillId }}>
              <Pencil className="size-4" /> Edit listing
            </Link>
          </Button>
        </div>
      </header>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="new">New ({counts.new})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({counts.accepted})</TabsTrigger>
          <TabsTrigger value="declined">Declined ({counts.declined})</TabsTrigger>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={Inbox}
            title={filter === "new" ? "Nothing new right now" : "Nothing here yet"}
            description="Inquiries and applications for this listing appear here the moment they arrive."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((item) => (
            <InboxRow
              key={`${item.kind}-${item.id}`}
              item={item}
              pending={inquiryStatus.isPending || applicationStatus.isPending}
              onStatus={(status) =>
                item.kind === "inquiry"
                  ? inquiryStatus.mutate({ id: item.id, status })
                  : applicationStatus.mutate({ id: item.id, status })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function InboxRow({
  item,
  pending,
  onStatus,
}: {
  item: {
    id: string;
    kind: "inquiry" | "application";
    status: string;
    createdAt: string;
    name: string;
    avatar: string | null;
    body: string;
    resumePath: string | null;
  };
  pending: boolean;
  onStatus: (status: string) => void;
}) {
  const resumeQuery = useQuery({
    queryKey: ["resume-url", item.resumePath],
    enabled: !!item.resumePath,
    queryFn: () => resolveResumeUrl(item.resumePath),
  });

  const isOpen = item.status === "new" || item.status === "pending";

  return (
    <li className="card-surface p-4">
      <div className="flex items-start gap-3">
        <UserAvatar name={item.name} avatarPath={item.avatar} className="size-9" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{item.name}</p>
            <Chip tone={item.kind === "application" ? "primary" : "neutral"}>
              {item.kind === "application" ? (
                <>
                  <FileText className="size-3" /> Application
                </>
              ) : (
                <>
                  <Send className="size-3" /> Inquiry
                </>
              )}
            </Chip>
            <Chip tone={item.status === "accepted" ? "accent" : "neutral"}>{item.status}</Chip>
            <span className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>

          <p className="mt-1.5 text-sm whitespace-pre-line text-muted-foreground">{item.body}</p>

          {item.resumePath ? (
            <div className="mt-2 text-sm">
              {resumeQuery.isLoading ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Preparing resume…
                </span>
              ) : resumeQuery.data ? (
                <a
                  href={resumeQuery.data}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <FileText className="size-4" /> Open resume
                </a>
              ) : (
                <span className="text-muted-foreground">Resume unavailable</span>
              )}
            </div>
          ) : null}

          {isOpen ? (
            <div className="mt-3 flex gap-2">
              <Button size="sm" disabled={pending} onClick={() => onStatus("accepted")}>
                <Check className="size-4" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => onStatus("declined")}
              >
                <X className="size-4" /> Decline
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
