import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, MapPin, Sparkles } from "lucide-react";

import { Chip } from "@/components/Chip";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import type { Skill } from "@/lib/types";

export function SkillCard({
  skill,
  isSaved,
  onToggleSave,
}: {
  skill: Skill;
  isSaved?: boolean | undefined;
  onToggleSave?: ((skill: Skill) => void) | undefined;
}) {
  return (
    <article className="card-surface group flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={skill.profile?.full_name ?? "Student"} avatarPath={skill.profile?.avatar_url ?? null} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {skill.profile?.full_name ?? "Student"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {skill.profile?.college ?? "Independent learner"}
            </p>
          </div>
        </div>
        {onToggleSave ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isSaved ? "Remove from saved skills" : "Save this skill"}
            aria-pressed={!!isSaved}
            onClick={() => onToggleSave(skill)}
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
          <Link to="/skills/$skillId" params={{ skillId: skill.id }} className="hover:text-primary">
            {skill.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{skill.description}</p>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Chip tone="primary">{skill.category}</Chip>
        {skill.experience_level ? <Chip>{skill.experience_level}</Chip> : null}
        {skill.exchange_preference ? (
          <Chip tone="accent" icon={<Sparkles className="size-3" />}>
            {skill.exchange_preference}
          </Chip>
        ) : null}
        <Chip icon={<MapPin className="size-3" />}>
          {skill.work_mode === "Remote" ? "Remote" : (skill.location ?? skill.work_mode ?? "Flexible")}
        </Chip>
      </div>
    </article>
  );
}
