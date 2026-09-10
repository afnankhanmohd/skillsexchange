import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Inbox, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteSkill,
  fetchSkill,
  removeListingPhoto,
  resolveListingPhotoUrls,
  updateSkill,
  uploadListingPhotos,
  validateImageFiles,
} from "@/lib/api";
import {
  EXCHANGE_PREFERENCES,
  EXPERIENCE_LEVELS,
  SKILL_CATEGORIES,
  WORK_MODES,
} from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/skills/$skillId/edit")({
  head: () => ({
    meta: [
      { title: "Edit your listing — skillSExhange" },
      {
        name: "description",
        content:
          "Update your listing's description, photos, details and visibility at any time after publishing.",
      },
      { property: "og:title", content: "Edit your listing — skillSExhange" },
      {
        property: "og:description",
        content: "Change your listing's details, photos or status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditSkillPage,
});

const schema = z.object({
  title: z.string().trim().min(4, "Give your skill a clear title").max(90),
  category: z.enum(SKILL_CATEGORIES, { message: "Pick a category" }),
  description: z.string().trim().min(30, "Describe your skill in at least 30 characters").max(1200),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  exchange_preference: z.enum(EXCHANGE_PREFERENCES),
  work_mode: z.enum(WORK_MODES),
  help_offered: z.string().trim().max(600).optional(),
  location: z.string().trim().max(120).optional(),
  availability: z.string().trim().max(120).optional(),
});

function EditSkillPage() {
  const { skillId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const skillQuery = useQuery({
    queryKey: ["skill", skillId],
    queryFn: () => fetchSkill(skillId),
  });

  const skill = skillQuery.data;
  const isOwner = !!(user && skill && skill.user_id === user.id);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [exchange, setExchange] = useState("Either");
  const [mode, setMode] = useState("Remote");
  const [isActive, setIsActive] = useState(true);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!skill) return;
    setCategory(skill.category);
    setLevel(skill.experience_level ?? "Intermediate");
    setExchange(skill.exchange_preference ?? "Either");
    setMode(skill.work_mode ?? "Remote");
    setIsActive(skill.is_active);
  }, [skill]);

  const photosQuery = useQuery({
    queryKey: ["skill-photos", skillId, skill?.photos],
    enabled: !!skill && (skill.photos?.length ?? 0) > 0,
    queryFn: () => resolveListingPhotoUrls(skill?.photos ?? []),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["skill", skillId] });
    queryClient.invalidateQueries({ queryKey: ["my-skills", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["skills"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!skill || !user) throw new Error("Not ready");
      let photos = skill.photos ?? [];
      if (files.length > 0) {
        validateImageFiles(files);
        const uploaded = await uploadListingPhotos(user.id, files);
        photos = [...photos, ...uploaded].slice(0, 8);
      }
      await updateSkill(skill.id, {
        photos,
        is_active: isActive,
        title: values.title,
        category: values.category,
        description: values.description,
        experience_level: values.experience_level,
        exchange_preference: values.exchange_preference,
        work_mode: values.work_mode,
        help_offered: values.help_offered || null,
        location: values.location || null,
        availability: values.availability || null,
      });
    },
    onSuccess: () => {
      setFiles([]);
      invalidate();
      toast.success("Listing updated");
      void navigate({ to: "/skills/$skillId", params: { skillId } });
    },
    onError: (error) =>
      toast.error("Could not save your changes", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const removePhotoMutation = useMutation({
    mutationFn: (path: string) => removeListingPhoto(skillId, skill?.photos ?? [], path),
    onSuccess: () => {
      invalidate();
      toast.success("Photo removed");
    },
    onError: (error) => toast.error("Could not remove photo", { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSkill(skillId),
    onSuccess: () => {
      invalidate();
      toast.success("Listing deleted");
      void navigate({ to: "/dashboard" });
    },
    onError: (error) => toast.error("Could not delete listing", { description: error.message }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      title: form.get("title") ?? "",
      category,
      description: form.get("description") ?? "",
      experience_level: level,
      exchange_preference: exchange,
      work_mode: mode,
      help_offered: form.get("help_offered") ?? "",
      location: form.get("location") ?? "",
      availability: form.get("availability") ?? "",
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

  if (skillQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!skill || !isOwner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon={Trash2}
          title={skill ? "You can't edit this listing" : "Listing not found"}
          description={
            skill
              ? "Only the student who published a listing can change it."
              : "This listing may have been removed."
          }
          action={
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/skills/$skillId" params={{ skillId }}>
          <ArrowLeft className="size-4" /> Back to listing
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Edit listing</h1>
        <Button asChild size="sm" variant="outline">
          <Link to="/skills/$skillId/inbox" params={{ skillId }}>
            <Inbox className="size-4" /> Inbox
          </Link>
        </Button>
      </div>

      <form className="card-surface mt-6 space-y-4 p-5 sm:p-6" onSubmit={handleSubmit} noValidate>
        <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
          <div>
            <p className="text-sm font-medium">Visible to students</p>
            <p className="text-xs text-muted-foreground">
              Turn this off to hide the listing without deleting it.
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Listing visible" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Skill title</Label>
          <Input id="title" name="title" defaultValue={skill.title} />
          {errors["title"] ? <p className="text-xs text-destructive">{errors["title"]}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors["category"] ? (
              <p className="text-xs text-destructive">{errors["category"]}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Experience level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger aria-label="Experience level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={5} defaultValue={skill.description} />
          {errors["description"] ? (
            <p className="text-xs text-destructive">{errors["description"]}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="help_offered">What you can help with</Label>
          <Textarea
            id="help_offered"
            name="help_offered"
            rows={3}
            defaultValue={skill.help_offered ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label>Current photos</Label>
          {(skill.photos?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">No photos on this listing yet.</p>
          ) : photosQuery.isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="size-20 rounded-lg" />
              <Skeleton className="size-20 rounded-lg" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(skill.photos ?? []).map((path, index) => (
                <div key={path} className="relative">
                  <img
                    src={photosQuery.data?.[index] ?? ""}
                    alt={`${skill.title} photo ${index + 1}`}
                    className="size-20 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => removePhotoMutation.mutate(path)}
                    disabled={removePhotoMutation.isPending}
                    className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="photos">Add photos</Label>
          <Input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))}
          />
          <p className="text-xs text-muted-foreground">
            {files.length > 0
              ? `${files.length} new photo${files.length > 1 ? "s" : ""} will be uploaded when you save`
              : "JPG or PNG, max 5 MB each."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Exchange preference</Label>
            <Select value={exchange} onValueChange={setExchange}>
              <SelectTrigger aria-label="Exchange preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXCHANGE_PREFERENCES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Work mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger aria-label="Work mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={skill.location ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="availability">Availability</Label>
            <Input id="availability" name="availability" defaultValue={skill.availability ?? ""} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm("Delete this listing permanently?")) deleteMutation.mutate();
            }}
          >
            <Trash2 className="size-4" /> Delete listing
          </Button>
        </div>
      </form>
    </div>
  );
}
