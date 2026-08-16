import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Handshake,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { CardSkeletonGrid } from "@/components/CardSkeleton";
import { Chip } from "@/components/Chip";
import { JobCard } from "@/components/JobCard";
import { SkillCard } from "@/components/SkillCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJobs, fetchSkills } from "@/lib/api";
import { SKILL_CATEGORIES } from "@/lib/constants";
import { sampleJobs, sampleSkills, sampleTestimonials } from "@/lib/sample-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "skillSExhange — Learn More. Earn More. Exchange Skills." },
      {
        name: "description",
        content:
          "Discover student skills, post small jobs and projects, and exchange talents with peers. Built for students who want real experience.",
      },
      { property: "og:title", content: "skillSExhange — Learn More. Earn More. Exchange Skills." },
      {
        property: "og:description",
        content:
          "Peer-to-peer skill and opportunity exchange for students. Browse skills, post jobs, collaborate.",
      },
    ],
  }),
  component: LandingPage,
});

const BENEFITS = [
  {
    icon: Rocket,
    title: "Build a real portfolio",
    body: "Turn classroom skills into shipped work with proof you can show recruiters.",
  },
  {
    icon: Wallet,
    title: "Earn or exchange",
    body: "Get paid, swap skills, or volunteer — you choose how value flows.",
  },
  {
    icon: Handshake,
    title: "Student-only network",
    body: "Collaborate with peers who understand deadlines, budgets, and exam weeks.",
  },
  {
    icon: ShieldCheck,
    title: "Safe and transparent",
    body: "Clear profiles, colleges, and availability so you know who you're working with.",
  },
];

const STEPS = [
  { icon: UserPlus, title: "Create your student profile", body: "Add your college, bio, links, and availability in minutes." },
  { icon: Sparkles, title: "Add skills or post an opportunity", body: "Publish what you can do, or describe the help you need." },
  { icon: Handshake, title: "Connect, collaborate, exchange value", body: "Send inquiries, agree on terms, and build something together." },
];

function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const skillsQuery = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });
  const jobsQuery = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });

  const skills = (skillsQuery.data?.length ? skillsQuery.data : sampleSkills).slice(0, 6);
  const jobs = (jobsQuery.data?.length ? jobsQuery.data : sampleJobs).slice(0, 3);

  return (
    <>
      <section className="border-b border-border bg-hero-soft">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Chip tone="accent" icon={<Sparkles className="size-3" />}>
              Peer-to-peer student marketplace
            </Chip>
            <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight text-foreground sm:text-5xl">
              Learn More. Earn More. <span className="text-primary">Exchange Skills.</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              skillSExhange helps students trade talents, collaborate on real projects, and find
              student-friendly opportunities — without needing years of formal experience.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link to="/skills">
                  Explore Skills <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/jobs/new">
                  <Briefcase className="size-4" /> Post a Job
                </Link>
              </Button>
            </div>

            <form
              className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                navigate({ to: "/skills", search: { q: query || undefined } });
              }}
            >
              <label htmlFor="hero-search" className="sr-only">
                Search skills, services, jobs or keywords
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="hero-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try “Figma”, “video editing”, “tutoring”…"
                  className="h-12 pl-9"
                />
              </div>
              <Button type="submit" size="lg" variant="secondary">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured skills</h2>
            <p className="text-sm text-muted-foreground">Talent students are offering right now.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/skills">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <ul className="mt-5 flex flex-wrap gap-2">
          {SKILL_CATEGORIES.map((category) => (
            <li key={category}>
              <Link to="/skills" search={{ category }}>
                <Chip className="transition-colors hover:bg-secondary">{category}</Chip>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {skillsQuery.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Featured opportunities</h2>
              <p className="text-sm text-muted-foreground">
                Gigs, collaborations, and projects posted by students.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/jobs">
                Find jobs <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6">
            {jobsQuery.isLoading ? (
              <CardSkeletonGrid count={3} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold tracking-tight">Why students use skillSExhange</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="card-surface flex gap-4 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <benefit.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{benefit.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight">Students are already exchanging</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {sampleTestimonials.map((testimonial) => (
            <figure key={testimonial.name} className="card-surface p-6">
              <div className="flex gap-0.5 text-accent" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm text-muted-foreground">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold">
                {testimonial.name}
                <span className="block text-xs font-normal text-muted-foreground">
                  {testimonial.college}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="card-surface bg-hero-gradient px-6 py-10 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            Ready to exchange your first skill?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-primary-foreground/85">
            Create a free student profile, publish what you're good at, and start collaborating this
            week.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/auth" search={{ mode: "signup" }}>
              Join skillSExhange free
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
