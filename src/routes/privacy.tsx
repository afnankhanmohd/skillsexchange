import { createFileRoute } from "@tanstack/react-router";

import { SUPPORT_EMAIL } from "@/lib/constants";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — skillSExhange" },
      {
        name: "description",
        content:
          "How skillSExhange collects, uses, and protects student data across profiles, skills, and job listings.",
      },
      { property: "og:title", content: "Privacy policy — skillSExhange" },
      {
        property: "og:description",
        content: "How skillSExhange handles student data and privacy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
          <p className="mt-2">
            When you create an account we store your name, email address, and college. Anything you
            add to your profile — bio, location, availability, portfolio and LinkedIn links, and
            avatar — is stored so it can be shown on your public profile and listings.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">What is public</h2>
          <p className="mt-2">
            Your name, college, location, bio, availability, links, avatar, active skills, and open
            job posts are visible to anyone browsing the platform. Your email address and phone
            number are never shown publicly and are not readable by other users.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Messages and inquiries</h2>
          <p className="mt-2">
            Inquiries and job applications are visible only to the sender and the recipient. Contact
            form submissions are visible only to platform administrators.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Your choices</h2>
          <p className="mt-2">
            You can edit or delete your skills and job posts at any time, and deactivate listings so
            they no longer appear publicly. To request deletion of your account and data, email{" "}
            <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
