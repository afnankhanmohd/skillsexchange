import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";

import logoAsset from "@/assets/logo.svg.asset.json";
import { SOCIAL_LINKS, SUPPORT_EMAIL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <img src={logoAsset.url} alt="skillSExhange logo" className="h-10 w-auto rounded-lg dark:bg-white/92 dark:px-2 dark:py-1" />
          <p className="text-sm text-muted-foreground">
            A peer-to-peer skill and opportunity exchange built for students.
          </p>
        </div>

        <nav aria-label="Explore" className="space-y-3 text-sm">
          <h2 className="font-semibold text-foreground">Explore</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link to="/skills" className="hover:text-primary">
                Browse skills
              </Link>
            </li>
            <li>
              <Link to="/jobs" className="hover:text-primary">
                Find jobs
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-primary">
                How it works
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company" className="space-y-3 text-sm">
          <h2 className="font-semibold text-foreground">Company</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link to="/contact" className="hover:text-primary">
                Contact us
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary">
                Terms of use
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <h2 className="font-semibold text-foreground">Stay connected</h2>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Mail className="size-4" /> {SUPPORT_EMAIL}
          </a>
          <ul className="flex gap-3 text-muted-foreground">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} skillSExhange. Built by students, for students.
      </p>
    </footer>
  );
}
