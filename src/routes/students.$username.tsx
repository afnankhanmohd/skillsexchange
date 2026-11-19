import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GraduationCap, Globe, Instagram, Linkedin, MapPin, Clock, UserRound } from "lucide-react";

import { CardSkeletonGrid } from "@/components/CardSkeleton";
import { Chip } from "@/components/Chip";
import { ContactDetails } from "@/components/ContactDetails";
import { ShareButtons } from "@/components/ShareButtons";
import { SkillCard } from "@/components/SkillCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMySkills, fetchProfileByUsername } from "@/lib/api";

export const Route = createFileRoute("/students/$username")({
  loader: async ({ params }) => {
    const profile = await fetchProfileByUsername(params.username).catch(() => null);
    if (!profile) throw notFound();
    return {
      name: profile.full_name || "Student",
      username: profile.username ?? params.username,
      bio: profile.bio ? profile.bio.slice(0, 150) : null,
      college: profile.college ?? null,
    };
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.name
      ? `${loaderData.name} (@${loaderData.username}) — skillSExhange`
      : `Student @${params.username} — skillSExhange`;
    const summary = loaderData?.bio
      ? `${loaderData.name}${loaderData.college ? ` at ${loaderData.college}` : ""}: ${loaderData.bio}`
      : `See ${loaderData?.name ?? "this student"}'s profile, skills and how to connect on skillSExhange.`;
    const url = `https://skillsexchange.lovable.app/students/${params.username}`;
    return {
      meta: [
        { title },
        { name: "description", content: summary },
        { property: "og:title", content: title },
        { property: "og:description", content: summary },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PublicProfilePage,
  errorComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="mt-2 text-sm text-muted-foreground">Try loading this profile again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-lg font-semibold">Student not found</p>
      <p className="mt-2 text-sm text-muted-foreground">
        No student matches that username. Ask them to share their exact @username.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/skills">Explore skills</Link>
      </Button>
    </div>
  ),
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const loaderData = Route.useLoaderData();

  const profileQuery = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const profile = await fetchProfileByUsername(username);
      if (!profile) throw notFound();
      return profile;
    },
  });

  const profile = profileQuery.data;

  const skillsQuery = useQuery({
    queryKey: ["public-profile-skills", profile?.id],
    enabled: !!profile,
    queryFn: () => fetchMySkills(profile!.id),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <CardSkeletonGrid />
      </div>
    );
  }

  if (!profile) return null;
  const activeSkills = (skillsQuery.data ?? []).filter((skill) => skill.is_active);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="card-surface p-6">
        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar
            name={profile.full_name || "Student"}
            avatarPath={profile.avatar_url ?? null}
            className="size-16"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {profile.full_name || "Student"}
              {profile.username ? (
                <span className="ml-2 text-base font-medium text-muted-foreground">
                  @{profile.username}
                </span>
              ) : null}
            </h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.college ? (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" /> {profile.college}
                </span>
              ) : null}
              {profile.location ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {profile.location}
                </span>
              ) : null}
              {profile.availability ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" /> {profile.availability}
                </span>
              ) : null}
            </div>
          </div>
          <ShareButtons
            title={`${profile.full_name || "A student"} on skillSExhange`}
            text={`Check out ${profile.full_name || "this student"} (@${profile.username ?? username}) on skillSExhange`}
            path={`/students/${profile.username ?? username}`}
          />
        </div>

        {profile.bio ? (
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {profile.bio}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.instagram_url ? (
            <a
              href={profile.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              <Instagram className="size-4" /> Instagram
            </a>
          ) : null}
          {profile.linkedin_url ? (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              <Linkedin className="size-4" /> LinkedIn
            </a>
          ) : null}
          {profile.portfolio_url ? (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              <Globe className="size-4" /> Portfolio
            </a>
          ) : null}
          {!profile.instagram_url && !profile.linkedin_url && !profile.portfolio_url ? (
            <Chip>No links shared yet</Chip>
          ) : null}
        </div>
      </header>

      <section className="card-surface mt-6 p-6">
        <h2 className="text-base font-semibold">Connect with {profile.full_name || "this student"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Contact details appear for signed-in students when sharing is on. Start a live session to
          teach or learn together on a shared whiteboard.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ContactDetails userId={profile.id} name={profile.full_name || "this student"} />
          <Button asChild className="sm:self-start">
            <Link
              to="/sessions"
              search={{ guestId: profile.id, guestName: profile.full_name || "Student" }}
            >
              <UserRound className="size-4" /> Start a live session
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight">
          Skills {profile.full_name ? `${profile.full_name.split(" ")[0]} offers` : "offered"}
        </h2>
        {skillsQuery.isLoading ? (
          <CardSkeletonGrid />
        ) : activeSkills.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No published skills yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
