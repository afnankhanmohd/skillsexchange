import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Briefcase, Inbox, Plus, Sparkles, UserCog } from "lucide-react";

import { CardSkeletonGrid } from "@/components/CardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { JobCard } from "@/components/JobCard";
import { SkillCard } from "@/components/SkillCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchInquiries,
  fetchMyApplications,
  fetchMyJobs,
  fetchMySkills,
  fetchSavedItems,
} from "@/lib/api";
import { profileCompletion } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — skillSExhange" },
      {
        name: "description",
        content:
          "Manage your published skills, job posts, saved listings, and incoming inquiries in one place.",
      },
      { property: "og:title", content: "Your dashboard — skillSExhange" },
      {
        property: "og:description",
        content: "Your skills, jobs, saved listings, and inquiries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const userId = user?.id ?? "";

  const skillsQuery = useQuery({
    queryKey: ["my-skills", userId],
    enabled: !!userId,
    queryFn: () => fetchMySkills(userId),
  });
  const jobsQuery = useQuery({
    queryKey: ["my-jobs", userId],
    enabled: !!userId,
    queryFn: () => fetchMyJobs(userId),
  });
  const savedQuery = useQuery({
    queryKey: ["saved", userId],
    enabled: !!userId,
    queryFn: () => fetchSavedItems(userId),
  });
  const inquiriesQuery = useQuery({
    queryKey: ["inquiries", userId],
    enabled: !!userId,
    queryFn: () => fetchInquiries(userId),
  });
  const applicationsQuery = useQuery({
    queryKey: ["applications", userId],
    enabled: !!userId,
    queryFn: () => fetchMyApplications(userId),
  });

  const completion = profileCompletion(profile);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="card-surface p-5 sm:p-7">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your listings fresh so other students can find you.
        </p>

        <div className="mt-5 max-w-md">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Profile completion</span>
            <span className="text-muted-foreground">{completion}%</span>
          </div>
          <Progress value={completion} className="mt-2" />
          {completion < 100 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Add the missing details to earn more trust from other students.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/skills/new">
              <Plus className="size-4" /> Add skill
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/jobs/new">
              <Briefcase className="size-4" /> Post a job
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/profile">
              <UserCog className="size-4" /> Edit profile
            </Link>
          </Button>
        </div>
      </header>

      <Tabs defaultValue="skills" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="skills">My skills</TabsTrigger>
          <TabsTrigger value="jobs">My jobs</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-5">
          {skillsQuery.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : skillsQuery.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skillsQuery.data.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No skills published yet"
              description="Publish your first skill so other students can discover what you do."
              action={
                <Button asChild>
                  <Link to="/skills/new">Add a skill</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="jobs" className="mt-5">
          {jobsQuery.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : jobsQuery.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobsQuery.data.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No job posts yet"
              description="Post a gig, project, or collaboration request to find student help."
              action={
                <Button asChild>
                  <Link to="/jobs/new">Post a job</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-5 space-y-6">
          {savedQuery.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : savedQuery.data && (savedQuery.data.skills.length || savedQuery.data.jobs.length) ? (
            <>
              {savedQuery.data.skills.length ? (
                <section>
                  <h2 className="text-sm font-semibold">Saved skills</h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {savedQuery.data.skills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} isSaved />
                    ))}
                  </div>
                </section>
              ) : null}
              {savedQuery.data.jobs.length ? (
                <section>
                  <h2 className="text-sm font-semibold">Saved jobs</h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {savedQuery.data.jobs.map((job) => (
                      <JobCard key={job.id} job={job} isSaved />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Save skills and jobs while browsing to come back to them later."
              action={
                <Button asChild>
                  <Link to="/skills">Explore skills</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5 space-y-6">
          <section className="card-surface p-5">
            <h2 className="text-sm font-semibold">Recent inquiries</h2>
            {inquiriesQuery.data?.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {inquiriesQuery.data.map((inquiry) => (
                  <li key={inquiry.id} className="rounded-xl bg-muted/60 p-3">
                    <p className="text-muted-foreground">{inquiry.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inquiry.sender_id === userId ? "Sent" : "Received"} ·{" "}
                      {new Date(inquiry.created_at).toLocaleDateString()} · {inquiry.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No inquiries yet — they&apos;ll appear here once students reach out.
              </p>
            )}
          </section>

          <section className="card-surface p-5">
            <h2 className="text-sm font-semibold">My applications</h2>
            {applicationsQuery.data?.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {applicationsQuery.data.map((application) => (
                  <li key={application.id} className="rounded-xl bg-muted/60 p-3">
                    <p className="font-medium">{application.job?.title ?? "Job removed"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {application.status} · {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No applications yet"
                description="Express interest in a job and track its status here."
                action={
                  <Button asChild>
                    <Link to="/jobs">Find jobs</Link>
                  </Button>
                }
              />
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
