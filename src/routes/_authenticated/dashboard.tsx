import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Inbox, Plus, Sparkles, UserCog } from "lucide-react";
import { toast } from "sonner";

import { CardSkeletonGrid } from "@/components/CardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SkillCard } from "@/components/SkillCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

import { Badge } from "@/components/ui/badge";
import {
  fetchInquiries,
  fetchMySkills,
  fetchSavedItems,
  toggleSaved,
  updateInquiryStatus,
} from "@/lib/api";
import { profileCompletion } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — skillSExhange" },
      {
        name: "description",
        content:
          "Manage your published skills, saved listings, and incoming inquiries in one place.",
      },
      { property: "og:title", content: "Your dashboard — skillSExhange" },
      {
        property: "og:description",
        content: "Your skills, saved listings, and inquiries.",
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

  const queryClient = useQueryClient();

  const unsaveMutation = useMutation({
    mutationFn: (skillId: string) => toggleSaved(userId, skillId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved", userId] });
      toast.success("Removed from saved");
    },
    onError: (error) => toast.error("Could not update saved items", { description: error.message }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries", userId] });
      toast.success("Inquiry updated");
    },
    onError: (error) => toast.error("Could not update inquiry", { description: error.message }),
  });

  const inquiries = inquiriesQuery.data ?? [];
  const received = inquiries.filter((item) => item.recipient_id === userId);
  const sent = inquiries.filter((item) => item.sender_id === userId);

  const completion = profileCompletion(profile);

  const realtimeStatus = useRealtimeInvalidate(
    `dashboard-${userId}`,
    [
      { table: "skills", filter: `user_id=eq.${userId}`, keys: [["my-skills", userId]] },
      { table: "saved_items", filter: `user_id=eq.${userId}`, keys: [["saved", userId]] },
      { table: "inquiries", keys: [["inquiries", userId]] },
      { table: "profiles", filter: `id=eq.${userId}`, keys: [["profile", userId]] },
    ],
    !!userId,
  );


  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="card-surface p-5 sm:p-7">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`size-2 rounded-full ${
              realtimeStatus === "live"
                ? "bg-emerald-500"
                : realtimeStatus === "reconnecting"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-muted-foreground/50 animate-pulse"
            }`}
            aria-hidden
          />
          <span>
            {realtimeStatus === "live"
              ? "Live updates on"
              : realtimeStatus === "reconnecting"
                ? "Reconnecting live updates…"
                : "Connecting live updates…"}
          </span>
        </div>

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
            <Link to="/profile">
              <UserCog className="size-4" /> Edit profile
            </Link>
          </Button>
        </div>
      </header>

      <Tabs defaultValue="skills" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="skills">My skills ({skillsQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedQuery.data?.skills.length ?? 0})</TabsTrigger>
          <TabsTrigger value="activity">Inquiries ({inquiries.length})</TabsTrigger>
        </TabsList>


        <TabsContent value="skills" className="mt-5">
          {skillsQuery.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : skillsQuery.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skillsQuery.data.map((skill) => {
                const counts = countsQuery.data?.[skill.id];
                return (
                  <div key={skill.id} className="flex flex-col gap-2">
                    <SkillCard skill={skill} />
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to="/skills/$skillId/inbox" params={{ skillId: skill.id }}>
                          <Inbox className="size-4" /> Inbox
                          {counts?.newCount ? (
                            <Badge variant="secondary">{counts.newCount} new</Badge>
                          ) : counts?.total ? (
                            <span className="text-xs text-muted-foreground">({counts.total})</span>
                          ) : null}
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to="/skills/$skillId/edit" params={{ skillId: skill.id }}>
                          <Pencil className="size-4" /> Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
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

        <TabsContent value="saved" className="mt-5 space-y-6">
          {savedQuery.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : savedQuery.data?.skills.length ? (
            <section>
              <h2 className="text-sm font-semibold">Saved skills</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedQuery.data.skills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isSaved
                    onToggleSave={(item) => unsaveMutation.mutate(item.id)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Save skills while browsing to come back to them later."
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
            <h2 className="text-sm font-semibold">Inquiries on your listings</h2>
            {inquiriesQuery.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading inquiries…</p>
            ) : received.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {received.map((inquiry) => (
                  <li key={inquiry.id} className="rounded-xl bg-muted/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {inquiry.sender?.full_name || "A student"}
                        {inquiry.skill ? (
                          <>
                            {" · "}
                            <Link
                              to="/skills/$skillId"
                              params={{ skillId: inquiry.skill.id }}
                              className="text-primary hover:underline"
                            >
                              {inquiry.skill.title}
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <Badge variant="secondary">{inquiry.status}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{inquiry.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Received {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={statusMutation.isPending || inquiry.status === "accepted"}
                        onClick={() => statusMutation.mutate({ id: inquiry.id, status: "accepted" })}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={statusMutation.isPending || inquiry.status === "declined"}
                        onClick={() => statusMutation.mutate({ id: inquiry.id, status: "declined" })}
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No inquiries yet"
                description="Publish clear skill listings and students will reach out here."
                action={
                  <Button asChild>
                    <Link to="/skills/new">Add a skill</Link>
                  </Button>
                }
              />
            )}
          </section>

          <section className="card-surface p-5">
            <h2 className="text-sm font-semibold">Inquiries you sent</h2>
            {sent.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {sent.map((inquiry) => (
                  <li key={inquiry.id} className="rounded-xl bg-muted/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        To {inquiry.recipient?.full_name || "a student"}
                        {inquiry.skill ? ` · ${inquiry.skill.title}` : ""}
                      </p>
                      <Badge variant="outline">{inquiry.status}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{inquiry.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sent {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="You haven't sent any inquiries"
                description="Find a peer with the skill you need and start a conversation."
                action={
                  <Button asChild>
                    <Link to="/skills">Explore skills</Link>
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

