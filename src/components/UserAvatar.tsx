import { useQuery } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "S"
  );
}

export function UserAvatar({
  name,
  avatarPath,
  className,
}: {
  name: string;
  avatarPath: string | null;
  className?: string;
}) {
  const { data: url } = useQuery({
    queryKey: ["avatar", avatarPath],
    enabled: !!avatarPath,
    staleTime: 30 * 60 * 1000,
    queryFn: () => resolveAvatarUrl(avatarPath),
  });

  return (
    <Avatar className={cn("size-10 border border-border", className)}>
      {url ? <AvatarImage src={url} alt={name} /> : null}
      <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
        {initials(name || "Student")}
      </AvatarFallback>
    </Avatar>
  );
}
