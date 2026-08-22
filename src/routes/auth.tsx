import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or join — skillSExhange" },
      {
        name: "description",
        content:
          "Create your free student account on skillSExhange to publish skills and connect with peers.",
      },
      { property: "og:title", content: "Sign in or join — skillSExhange" },
      {
        property: "og:description",
        content: "Join the student skill and opportunity exchange.",
      },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  college: z.string().trim().min(2, "Enter your college or university"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

function AuthPage() {
  const { mode = "signin", redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: redirect === "/dashboard" || !redirect ? "/dashboard" : "/dashboard", replace: true });
    }
  }, [user, isLoading, navigate, redirect]);

  function setMode(next: "signin" | "signup" | "forgot") {
    setErrors({});
    navigate({ to: "/auth", search: { mode: next } });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setErrors({});
    setPending(true);
    try {
      if (mode === "forgot") {
        const email = String(form.get("email") ?? "").trim();
        if (!z.string().email().safeParse(email).success) {
          setErrors({ email: "Enter a valid email" });
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Password reset link sent", {
          description: "Check your inbox for the reset email.",
        });
        return;
      }

      if (mode === "signup") {
        const parsed = signUpSchema.safeParse({
          fullName: form.get("fullName"),
          college: form.get("college"),
          email: form.get("email"),
          password: form.get("password"),
        });
        if (!parsed.success) {
          setErrors(
            Object.fromEntries(
              parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
            ),
          );
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.fullName, college: parsed.data.college },
          },
        });
        if (error) throw error;
        toast.success("Account created", { description: "Let's finish your profile." });
        navigate({ to: "/profile" });
        return;
      }

      const parsed = signInSchema.safeParse({
        email: form.get("email"),
        password: form.get("password"),
      });
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
        return;
      }
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error("Something went wrong", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function googleSignIn() {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (error) {
      toast.error("Google sign-in failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  const title =
    mode === "signup" ? "Create your student account" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="card-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Join the student exchange and start collaborating."
            : mode === "forgot"
              ? "We'll email you a secure reset link."
              : "Sign in to manage your skills, saved listings, and inquiries."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {mode === "signup" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" autoComplete="name" aria-invalid={!!errors['fullName']} />
                {errors['fullName'] ? (
                  <p className="text-xs text-destructive">{errors['fullName']}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="college">College / university</Label>
                <Input id="college" name="college" autoComplete="organization" aria-invalid={!!errors['college']} />
                {errors['college'] ? <p className="text-xs text-destructive">{errors['college']}</p> : null}
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors['email']} />
            {errors['email'] ? <p className="text-xs text-destructive">{errors['email']}</p> : null}
          </div>

          {mode !== "forgot" ? (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                aria-invalid={!!errors['password']}
              />
              {errors['password'] ? <p className="text-xs text-destructive">{errors['password']}</p> : null}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>

        {mode !== "forgot" ? (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => void googleSignIn()}>
              Continue with Google
            </Button>
          </>
        ) : null}

        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              <p>
                New here?{" "}
                <button type="button" className="font-medium text-primary" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </p>
              <p>
                <button type="button" className="font-medium text-primary" onClick={() => setMode("forgot")}>
                  Forgot your password?
                </button>
              </p>
            </>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" className="font-medium text-primary" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </p>
          )}
          <p>
            <Link to="/" className="hover:text-primary">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
