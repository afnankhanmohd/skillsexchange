# Listing inbox, editing, and applications

## What you'll get

1. **A full inbox page for each listing** at its own address, reachable from the listing page and your dashboard. It lists every inquiry and application for that one listing, with filters for New (unread), Accepted and Declined, plus counts on each filter and live updates as new messages arrive.

2. **Photos that really persist.** Photo uploads already go to a real storage area, so this step is about proving and hardening it: uploads are size- and type-checked, failures show a clear message instead of silently publishing an empty listing, and the listing page shows the stored images.

3. **A browser walkthrough.** I'll sign in as a real account, fill in a genuine listing, attach a photo, publish it, and confirm the photo appears on the listing page. I'll report exactly what I saw, with screenshots.

4. **An edit page for each listing** so you can change the title, description, details, status (active/hidden) and photos — add new ones, remove existing ones — after posting. Reachable from the listing page and your dashboard, owner only.

5. **An application form on each listing** where someone can attach a resume file and write a cover letter. Applications land in that listing's inbox alongside inquiries, and you can accept or decline them and download the resume.

## Technical notes

- **Data:** new `skill_applications` table (`skill_id`, `applicant_id`, `cover_letter`, `resume_path`, `status`, timestamps) with GRANTs, RLS (applicant inserts/reads own; listing owner reads and updates status), an `updated_at` trigger, and realtime enabled. The existing `applications` table stays untouched (it belongs to the removed jobs feature).
- **Storage:** reuse the private `listing-photos` bucket for images; add a private `resumes` bucket with owner-folder RLS policies, read access limited to the applicant and the listing owner via signed URLs generated in an authenticated server function.
- **Routes:**
  - `src/routes/_authenticated/skills.$skillId.inbox.tsx` — full inbox with status filter tabs, merged inquiries + applications, accept/decline, realtime.
  - `src/routes/_authenticated/skills.$skillId.edit.tsx` — edit form prefilled from the listing, photo add/remove, status toggle, delete.
  - Application form rendered as a dialog on `src/routes/skills.$skillId.tsx`, guarded behind sign-in.
- **API layer:** extend `src/lib/api.ts` with `updateSkill`, `fetchSkillApplications`, `createSkillApplication`, `updateApplicationStatus`, `uploadResume`, `resolveResumeUrl`, and photo removal from a listing's `photos` array.
- **Inbox link:** add an "Inbox" button per listing on the dashboard's My skills tab, with an unread count.
- Each new route gets its own `head()` metadata.

## Verification

Typecheck, then a Playwright pass on localhost with a real signed-in session: publish a listing with a photo, open its page, confirm the photo renders, open the inbox, submit an application from a second view where possible, and confirm it appears under New.
