import { Facebook, Linkedin, Link2, MessageCircle, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShareButtons({ title, text, path }: { title: string; text: string; path: string }) {
  const url = () => (typeof window !== "undefined" ? `${window.location.origin}${path}` : path);
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const enc = encodeURIComponent;

  async function nativeOrCopy() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: url() });
        return;
      } catch {
        return;
      }
    }
    await copy();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="size-4" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => open(`https://wa.me/?text=${enc(`${text} ${url()}`)}`)}>
          <MessageCircle className="size-4" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url())}`)}>
          <Twitter className="size-4" /> X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url())}`)}>
          <Linkedin className="size-4" /> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url())}`)}>
          <Facebook className="size-4" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copy}>
          <Link2 className="size-4" /> Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={nativeOrCopy}>
          <Share2 className="size-4" /> More…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
