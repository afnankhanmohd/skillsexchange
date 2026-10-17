# Public student profiles and job pages

## What to build
- Add a public student profile page with safe public details, active skill listings, and a share button.
- Add a browsable public directory of open jobs and a shareable public detail page for each job.
- Keep job pages read-only; do not restore job posting or management tools.
- Link student names to their public profile and expose job browsing in site navigation.
- Add route-specific metadata and include public profile/job URLs in the sitemap where appropriate.

## Technical details
- Reuse the existing Supabase browser client, public profile field selection, semantic styling, `ShareButtons`, and TanStack file routes.
- Restrict profile queries to non-sensitive fields and show only open jobs; do not display profile email or phone.
- Update `roadmap.md` and record the public read-only page structure in `AGENTS.md`.