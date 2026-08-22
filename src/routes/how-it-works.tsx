import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Handshake, MessagesSquare, Sparkles, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How skillSExhange works — exchange skills with students" },
      {
        name: "description",
        content:
          "Create a student profile, publish your skills or post an opportunity, then connect with peers to collaborate and exchange value.",
      },
      { property: "og:title", content: "How skillSExhange works" },
      {
        property: "og:description",
        content: "Three simple steps to exchange skills and find student-friendly opportunities.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    icon: UserPlus,
    title: "1. Create your student profile",
    body: "Add your college, location, bio, portfolio and LinkedIn links, and how many hours you can commit each week. A complete profile gets far more inquiries.",
  },
  {
    icon: Sparkles,
    title: "2. Add skills or post an opportunity",
    body: "Publish each skill you can offer with an experience level and exchange preference — paid, skill exchange, volunteer, or either. Browsing instead? Find peers whose skills match what you need.",
  },
  {
    icon: Handshake,
    title: "3. Connect, collaborate, and exchange value",
    body: "Send an inquiry or express interest, agree on scope and terms, then deliver. Save listings you like so you can come back to them later.",
  },
];

const FAQS = [
  {
    q: "Is skillSExhange free?",
    a: "Yes. Browsing, publishing skills, and posting opportunities are free for students.",
  },
  {
    q: "Do I need work experience?",
    a: "No. Most students start with coursework, club projects, or self-taught skills — that is exactly what the platform is for.",
  },
  {
    q: "What is a skill exchange?",
    a: "Instead of money, two students trade help: you edit a video, they tutor you in statistics.",
  },
  {
    q: "How do I stay safe?",
    a: "Keep conversations on clear terms, agree on scope before starting, and report anything inappropriate through the contact page.",
  },
];

function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h1>
      <p className="mt-3 text-muted-foreground">
        skillSExhange is a peer-to-peer marketplace where students trade talents and find realistic
        opportunities. Here's the whole flow.
      </p>

      <ol className="mt-8 space-y-4">
        {STEPS.map((step) => (
          <li key={step.title} className="card-surface flex gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <step.icon className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{step.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">Frequently asked</h2>
        <dl className="mt-5 space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="card-surface p-5">
              <dt className="text-sm font-semibold">{faq.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="card-surface mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Still have a question?</h2>
          <p className="text-sm text-muted-foreground">
            Send us a message and a student-support teammate will reply.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/skills">
              Explore skills <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">
              <MessagesSquare className="size-4" /> Contact us
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
