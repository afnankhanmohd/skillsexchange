import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "accent" | "warn";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent/15 text-accent-foreground",
  warn: "bg-destructive/10 text-destructive",
};

export function Chip({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
