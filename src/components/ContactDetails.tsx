import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserContact, whatsappLink } from "@/lib/contact";

type Props = {
  userId: string | null | undefined;
  name: string;
  subject?: string;
};

export function ContactDetails({ userId, name, subject }: Props) {
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-contact", userId],
    enabled: !!user && !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchUserContact(userId!),
  });

  const isRateLimited =
    error instanceof Error && /rate_limited|rate limit/i.test(error.message);

  if (!userId) return null;

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-sm font-medium">Contact {name} directly</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in to see the phone number and email address shared by this student.
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/auth">Sign in to view contact</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-xl border border-border p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  const email = data?.email?.trim() || null;
  const phone = data?.phone?.trim() || null;

  if (isError || !data || (!email && !phone)) {
    return (
      <div className="rounded-xl border border-border p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <ShieldOff className="size-4 text-muted-foreground" />
          Direct contact unavailable
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data && !data.contactVisible
            ? `${name} keeps their contact details private. Send an inquiry instead.`
            : `${name} hasn't shared a phone number or email yet. Send an inquiry instead.`}
        </p>
      </div>
    );
  }

  const mailSubject = encodeURIComponent(subject ?? "Hello from skillSExhange");

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-medium">Connect with {name}</p>
      <div className="mt-3 grid gap-2">
        {email ? (
          <Button asChild variant="outline" size="sm" className="justify-start">
            <a href={`mailto:${email}?subject=${mailSubject}`}>
              <Mail className="size-4" />
              <span className="truncate">{email}</span>
            </a>
          </Button>
        ) : null}
        {phone ? (
          <>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <a href={`tel:${phone}`}>
                <Phone className="size-4" />
                <span className="truncate">{phone}</span>
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <a href={whatsappLink(phone)} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                Message on WhatsApp
              </a>
            </Button>
          </>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Shared by {name}. Please keep outreach respectful and relevant.
      </p>
    </div>
  );
}
