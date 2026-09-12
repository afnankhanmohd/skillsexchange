import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { fetchMyApplications, resolveResumeUrl } from "@/lib/api";

function statusTone(status: string) {
  if (status === "accepted") return "accent" as const;
  if (status === "declined") return "neutral" as const;
  return "primary" as const;
}

function ResumeLink({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const url = await resolveResumeUrl(path);
          if (!url) throw new Error("The file link could not be opened.");
          window.open(url, "_blank", "noreferrer");
        } catch (error) {
          toast.error("Could not open your resume", {
            description: error instanceof Error ? error.message : undefined,
          });
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
      View resume
    </Button>
  );
}

export function MyApplications({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ["my-applications", userId],
    enabled: !!userId,
    queryFn: () => fetchMyApplications(userId),
  });

  useRealtimeInvalidate(
    `my-applications-${userId}`,
    [
      {
        table: "skill_applications",
        filter: `applicant_id=eq.${userId}`,
        keys: [["my-applications", userId]],
      },
    ],
    !!userId,
  );

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="card-surface space-y-2 p-5">
        <p className="text-sm text-destructive">We couldn't load your applications.</p>
        <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const applications = query.data ?? [];

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="You haven't applied to anything yet"
        description="When you apply to a listing with your resume and cover letter, it will show up here so you can track the reply."
        action={
          <Button asChild>
            <Link to="/skills">Explore skills</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {applications.map((application) => (
        <li key={application.id} className="card-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {application.skill ? (
                <Link
                  to="/skills/$skillId"
                  params={{ skillId: application.skill.id }}
                  className="hover:text-primary"
                >
                  {application.skill.title}
                </Link>
              ) : (
                "A listing"
              )}
            </p>
            <Chip tone={statusTone(application.status)}>
              {application.status === "new" || application.status === "pending"
                ? "Awaiting reply"
                : application.status}
            </Chip>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {application.skill?.category ? `${application.skill.category} · ` : ""}
            Sent {new Date(application.created_at).toLocaleDateString()}
          </p>
          <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">
            {application.cover_letter}
          </p>
          {application.resume_path ? (
            <div className="mt-3">
              <ResumeLink path={application.resume_path} />
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No resume attached.</p>
          )}
        </li>
      ))}
    </ul>
  );
}
