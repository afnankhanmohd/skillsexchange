import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SOCIAL_LINKS, SUPPORT_EMAIL } from "@/lib/constants";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact skillSExhange — student support" },
      {
        name: "description",
        content:
          "Questions, feedback, or a report? Send the skillSExhange student support team a message and we'll get back to you.",
      },
      { property: "og:title", content: "Contact skillSExhange" },
      {
        property: "og:description",
        content: "Reach the student support team behind skillSExhange.",
      },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone_number: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[+]?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  message: z.string().trim().min(20, "Please write at least 20 characters"),
});

type FieldErrors = { name?: string; phone_number?: string; message?: string };

function ContactPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = contactSchema.safeParse({
      name: form.get("name"),
      phone_number: form.get("phone_number"),
      message: form.get("message"),
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof FieldErrors;
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setPending(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setPending(false);

    if (error) {
      toast.error("Message not sent", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Message sent", { description: "We'll reply as soon as we can." });
    event.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Contact us</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Questions about exchanging skills, reporting a listing, or partnering with your college? Send
        a message — no account needed.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="size-12 text-accent" />
              <h2 className="text-lg font-semibold">Thanks — your message is in!</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Our student support team usually replies within 1–2 working days.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone_number">Phone number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  aria-invalid={!!errors.phone_number}
                />
                {errors.phone_number ? (
                  <p className="text-xs text-destructive">{errors.phone_number}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Tell us what you need help with…"
                  aria-invalid={!!errors.message}
                />
                {errors.message ? (
                  <p className="text-xs text-destructive">{errors.message}</p>
                ) : null}
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
                Send message
              </Button>
            </form>
          )}
        </div>

        <aside className="card-surface space-y-4 p-6">
          <div>
            <h2 className="text-sm font-semibold">Support email</h2>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Mail className="size-4" /> {SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Follow along</h2>
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noreferrer" className="hover:text-primary">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Reporting inappropriate content? Include the listing title so our team can review it
            quickly.
          </p>
        </aside>
      </div>
    </div>
  );
}
