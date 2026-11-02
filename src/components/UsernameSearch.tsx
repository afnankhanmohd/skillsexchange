import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { searchProfiles } from "@/lib/api";

export function UsernameSearch({
  onNavigate,
  autoFocus = false,
}: {
  onNavigate?: () => void;
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timer);
  }, [term]);

  const results = useQuery({
    queryKey: ["username-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: () => searchProfiles(debounced),
  });

  function go(username: string) {
    setTerm("");
    setDebounced("");
    onNavigate?.();
    void navigate({ to: "/students/$username", params: { username } });
  }

  const open = focused && debounced.length >= 2;

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={term}
        autoFocus={autoFocus}
        onChange={(event) => setTerm(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setFocused(false), 150);
        }}
        placeholder="Search students by @username"
        aria-label="Search students by username"
        className="pl-9"
      />
      {open ? (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {results.isLoading ? (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </p>
          ) : (results.data?.length ?? 0) === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No students found for “{debounced}”.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.data!.map((profile) => (
                <li key={profile.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      go(profile.username ?? profile.id);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <UserRound className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{profile.full_name || "Student"}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        @{profile.username ?? profile.id.slice(0, 8)}
                        {profile.college ? ` · ${profile.college}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
