import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserContact } from "@/lib/contact";
import { profileCompletion } from "@/lib/types";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Edit your profile — skillSExhange" },
      {
        name: "description",
        content:
          "Update your student profile: college, location, bio, availability, portfolio links, and avatar.",
      },
      { property: "og:title", content: "Edit your profile — skillSExhange" },
      {
        property: "og:description",
        content: "Keep your student profile complete so others can trust your listings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  college: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(600).optional(),
  availability: z.string().trim().max(120).optional(),
  portfolio_url: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]),
  linkedin_url: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]),
  phone: z.union([
    z
      .string()
      .trim()
      .regex(/^\+\d{6,17}$/, "Enter a valid mobile number with country code"),
    z.literal(""),
  ]),
  contact_visible: z.boolean(),
});

function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [contactVisible, setContactVisible] = useState(true);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [localNumber, setLocalNumber] = useState("");

  const contactQuery = useQuery({
    queryKey: ["user-contact", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const contact = await fetchUserContact(user!.id);
      setContactVisible(contact?.contactVisible ?? true);
      const parts = splitPhone(contact?.phone ?? "");
      setCountryCode(parts.countryCode);
      setLocalNumber(parts.number);
      return contact;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          college: values.college || null,
          location: values.location || null,
          bio: values.bio || null,
          availability: values.availability || null,
          portfolio_url: values.portfolio_url || null,
          linkedin_url: values.linkedin_url || null,
          email: values.email || null,
          phone: values.phone || null,
          contact_visible: values.contact_visible,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      void queryClient.invalidateQueries({ queryKey: ["user-contact"] });
      toast.success("Profile updated");
    },
    onError: (error) =>
      toast.error("Could not save your profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = profileSchema.safeParse({
      full_name: form.get("full_name") ?? "",
      college: form.get("college") ?? "",
      location: form.get("location") ?? "",
      bio: form.get("bio") ?? "",
      availability: form.get("availability") ?? "",
      portfolio_url: form.get("portfolio_url") ?? "",
      linkedin_url: form.get("linkedin_url") ?? "",
      email: form.get("email") ?? "",
      phone: form.get("phone") ?? "",
      contact_visible: contactVisible,
    });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    saveMutation.mutate(parsed.data);
  }

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please choose a file under 3 MB." });
      return;
    }
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (error) throw error;
      refreshProfile();
      void queryClient.invalidateQueries({ queryKey: ["avatar"] });
      toast.success("Avatar updated");
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const completion = profileCompletion(profile);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A complete profile makes other students far more likely to reach out.
      </p>

      <div className="mt-5 max-w-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Completion</span>
          <span className="text-muted-foreground">{completion}%</span>
        </div>
        <Progress value={completion} className="mt-2" />
      </div>

      <div className="card-surface mt-6 flex items-center gap-4 p-5">
        <UserAvatar
          name={profile?.full_name ?? "Student"}
          avatarPath={profile?.avatar_url ?? null}
          className="size-16"
        />
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload avatar
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">JPG or PNG, up to 3 MB.</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload avatar"
            onChange={(event) => void handleAvatar(event)}
          />
        </div>
      </div>

      <form className="card-surface mt-6 space-y-4 p-5 sm:p-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} />
          {errors["full_name"] ? (
            <p className="text-xs text-destructive">{errors["full_name"]}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="college">College / university</Label>
            <Input id="college" name="college" defaultValue={profile?.college ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={profile?.location ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={profile?.bio ?? ""}
            placeholder="What do you study, what do you build, and what are you looking for?"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Availability</Label>
          <Input
            id="availability"
            name="availability"
            defaultValue={profile?.availability ?? ""}
            placeholder="e.g. Weekends, 10 hrs/week"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="portfolio_url">Portfolio URL</Label>
            <Input
              id="portfolio_url"
              name="portfolio_url"
              type="url"
              defaultValue={profile?.portfolio_url ?? ""}
            />
            {errors["portfolio_url"] ? (
              <p className="text-xs text-destructive">{errors["portfolio_url"]}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              defaultValue={profile?.linkedin_url ?? ""}
            />
            {errors["linkedin_url"] ? (
              <p className="text-xs text-destructive">{errors["linkedin_url"]}</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">Contact details</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Signed-in students can reach you directly on these when sharing is on. Guests never see
            them.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={contactQuery.data?.email ?? ""}
                placeholder="you@college.edu"
              />
              {errors["email"] ? (
                <p className="text-xs text-destructive">{errors["email"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={contactQuery.data?.phone ?? ""}
                placeholder="+91 98765 43210"
              />
              {errors["phone"] ? (
                <p className="text-xs text-destructive">{errors["phone"]}</p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <Label htmlFor="contact_visible" className="text-sm font-normal">
              Show my email and mobile number to signed-in students
            </Label>
            <Switch
              id="contact_visible"
              checked={contactVisible}
              onCheckedChange={setContactVisible}
            />
          </div>
        </div>

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>
    </div>
  );
}
