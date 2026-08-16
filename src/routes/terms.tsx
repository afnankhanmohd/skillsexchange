import { createFileRoute } from "@tanstack/react-router";

import { SUPPORT_EMAIL } from "@/lib/constants";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — skillSExhange" },
      {
        name: "description",
        content:
          "The rules for using skillSExhange: acceptable listings, respectful collaboration, and account responsibilities.",
      },
      { property: "og:title", content: "Terms of service — skillSExhange" },
      {
        property: "og:description",
        content: "The rules for publishing skills and job posts on skillSExhange.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms of service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Who can use skillSExhange</h2>
          <p className="mt-2">
            The platform is built for students. You are responsible for keeping your account secure
            and for the accuracy of what you publish about your skills and availability.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Listings and conduct</h2>
          <p className="mt-2">
            Post only opportunities and skills you can genuinely deliver. Do not post spam, scams,
            adult content, harassment, or work that breaks your institution&apos;s rules. We may
            remove listings and suspend accounts that break these terms.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Agreements between students</h2>
          <p className="mt-2">
            skillSExhange helps students find each other. Any payment, skill exchange, deadline, or
            deliverable is agreed directly between the two students — we are not a party to those
            agreements and do not process payments.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Questions</h2>
          <p className="mt-2">
            Reach us at{" "}
            <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            for anything related to these terms.
          </p>
        </section>
      </div>
    </div>
  );
}
