import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { MyApplications } from "@/components/MyApplications";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "My applications — skillSExhange" },
      {
        name: "description",
        content:
          "Track every listing you applied to, the cover letter you wrote, the resume you attached, and the student's reply.",
      },
      { property: "og:title", content: "My applications — skillSExhange" },
      {
        property: "og:description",
        content: "Your submitted applications and their current status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyApplicationsPage,
});

function MyApplicationsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">My applications</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Everything you've submitted, with the cover letter you sent and the reply so far.
      </p>

      {user ? <MyApplications userId={user.id} /> : null}
    </div>
  );
}
