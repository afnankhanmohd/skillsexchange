# Applications: apply, track, and verify in the browser

## What you'll get

1. **An "Apply with resume" form on each listing.** Anyone signed in (other than the listing owner) can attach a resume file and write a cover letter. Submitting it puts the application straight into that listing's inbox. Not signed in? A "Sign in to apply" prompt instead of a broken form.

2. **Inbox and Edit buttons on your dashboard listings**, each showing how many new inquiries and applications are waiting, so you can jump straight to the right listing.

3. **A "My applications" area for applicants** so people can track what they sent: listing title, the cover letter they wrote, the resume they attached, the date, and the current state (New / Accepted / Declined), updating live as owners respond. It appears as a tab on the dashboard with its own page as well.

4. **A browser walkthrough** of the whole loop on the real app: publish a listing with a photo, apply to it, accept the application as the owner, and confirm the accepted state shows on the listing page and in the applicant's own list. I'll report what I saw with screenshots.

## Technical notes

- `src/routes/skills.$skillId.tsx`: add an application dialog (file input + cover letter, client-side size/type validation) calling `createSkillApplication`, invalidating the listing inbox and applicant queries; owner sees Inbox/Edit links instead.
- `src/lib/api.ts`: add `fetchMyApplications(userId)` (applications joined to listing title/owner) and `fetchListingInboxCounts(skillIds)` for the dashboard badges. Existing RLS already lets an applicant read their own rows.
- New route `src/routes/_authenticated/applications.tsx` rendering the applicant list, reused as a dashboard tab; realtime via the existing `useRealtimeInvalidate` hook on `skill_applications` filtered to `applicant_id`.
- `src/routes/_authenticated/dashboard.tsx`: per-listing Inbox/Edit actions with counts, plus the "My applications" tab.
- Each new route gets its own `head()` metadata.
- No database changes needed; `skill_applications`, the `resumes` bucket, and policies are already in place.

## Verification

Typecheck, then a Playwright pass on localhost with a real signed-in session covering publish-with-photo, apply, accept, and the applicant's own view. Test rows left over from earlier checks get cleaned up at the end.
