import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Inbox, MailOpen, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchContactMessages } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin review — skillSExhange" },
      {
        name: "description",
        content: "Administrator view for reviewing contact submissions from students and visitors.",
      },
      { property: "og:title", content: "Admin review — skillSExhange" },
      { property: "og:description", content: "Review and triage contact submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["contact-messages"],
    enabled: isAdmin,
    queryFn: fetchContactMessages,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast.success("Marked as read");
    },
    onError: () => toast.error("Could not update this message"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Admins only"
          description="Your account doesn't have administrator access to this area."
        />
      </div>
    );
  }

  const messages = messagesQuery.data ?? [];
  const unread = messages.filter((message) => !message.is_read).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contact submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages sent through the public contact form.
          </p>
        </div>
        <Chip tone={unread ? "accent" : "neutral"}>{unread} unread</Chip>
      </div>

      {messagesQuery.isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : messages.length ? (
        <ul className="mt-6 space-y-3">
          {messages.map((message) => (
            <li key={message.id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{message.name}</p>
                  <p className="text-sm text-muted-foreground">{message.phone_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone={message.is_read ? "neutral" : "primary"}>
                    {message.is_read ? "Read" : "New"}
                  </Chip>
                  {!message.is_read ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markRead.mutate(message.id)}
                      disabled={markRead.isPending}
                    >
                      <MailOpen className="size-4" /> Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">
                {message.message}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="No submissions yet"
            description="Messages from the contact form will show up here."
          />
        </div>
      )}
    </div>
  );
}
