import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, CalendarClock, MapPin, Wallet } from "lucide-react";

import { Chip } from "@/components/Chip";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import type { Job } from "@/lib/types";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function JobCard({
  job,
  isSaved,
  onToggleSave,
}: {
  job: Job;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
}) {
  return (
    <article className="card-surface group flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={job.organization ?? job.profile?.full_name ?? "Student"}
            avatarPath={job.profile?.avatar_url ?? null}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {job.organization ?? job.profile?.full_name ?? "Student poster"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Posted {formatDate(job.created_at)}
              {job.status === "closed" ? " · Closed" : ""}
            </p>
          </div>
        </div>
        {onToggleSave ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isSaved ? "Remove from saved jobs" : "Save this job"}
            aria-pressed={!!isSaved}
            onClick={() => onToggleSave(job)}
          >
            {isSaved ? (
              <BookmarkCheck className="size-4 text-primary" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <h3 className="text-base leading-snug font-semibold text-foreground">
          <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="hover:text-primary">
            {job.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
      </div>

      {job.required_skills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {job.required_skills.slice(0, 4).map((skill) => (
            <li key={skill}>
              <Chip tone="primary">{skill}</Chip>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2">
        {job.compensation_type ? (
          <Chip tone="accent" icon={<Wallet className="size-3" />}>
            {job.compensation_type}
          </Chip>
        ) : null}
        <Chip icon={<MapPin className="size-3" />}>
          {job.work_mode === "Remote" ? "Remote" : (job.location ?? job.work_mode ?? "Flexible")}
        </Chip>
        {job.deadline ? (
          <Chip icon={<CalendarClock className="size-3" />}>Due {formatDate(job.deadline)}</Chip>
        ) : null}
      </div>
    </article>
  );
}
