# SkillShare Hub

Build a production-ready, mobile-first web application named “skillSExhange”.

Purpose:
skillSExhange is a peer-to-peer skill and opportunity exchange platform for students. Many students have useful skills but lack formal experience, jobs, mentors, or a way to collaborate. The platform lets students discover other students’ skills, post small jobs/projects, offer help, and exchange skills with one another.

Tech stack:
- React + TypeScript
- Tailwind CSS
- Supabase for authentication, PostgreSQL database, storage, and realtime where useful
- Use Lucide React icons
- Use clean reusable components and responsive layouts
- Do not use placeholder-only functionality; connect all forms and key actions to Supabase

Design direction:
- Clean, youthful, professional, trustworthy
- Mobile-first design, excellent on 360px+ widths, then scale elegantly to tablet and desktop
- Color system:
  - Primary: indigo / violet
  - Accent: teal or emerald
  - Neutral backgrounds: white, soft slate, light gray
- Rounded cards, subtle shadows, generous spacing, accessible contrast
- Modern sans-serif typography
- Include loading states, empty states, validation messages, success/error toasts, and skeleton loaders
- Keep the interface simple and approachable for students

Core user roles:
1. Guest: can browse public skills and job listings.
2. Authenticated student: can create a profile, publish skills, post jobs, save listings, contact other users, and submit contact messages.
3. Admin: can review contact submissions and manage inappropriate content.

Pages and features:

1. Landing page
- Hero headline: “Learn More. Earn More. Exchange Skills.”
- Supporting text explaining that students can exchange talents, collaborate, and find student-friendly opportunities.
- Two calls to action:
  - “Explore Skills”
  - “Post a Job”
- Search bar for skills, services, jobs, or keywords.
- Featured skills section with categories such as:
  - Web Development
  - Graphic Design
  - Video Editing
  - Content Writing
  - UI/UX Design
  - Photography
  - Marketing
  - Tutoring
  - Data Analysis
  - Public Speaking
- Featured job listings section.
- How it works section:
  1. Create your student profile
  2. Add skills or post an opportunity
  3. Connect, collaborate, and exchange value
- Benefits section for students.
- Testimonials using realistic sample data.
- Footer with navigation, social links, privacy policy, terms, and contact link.

2. Authentication
- Email/password sign-up and sign-in using Supabase Auth.
- Optional Google OAuth button if supported by the Supabase configuration.
- Sign-up fields:
  - Full name
  - Email
  - Password
  - College/university
- Redirect new users to onboarding/profile creation.
- Include forgot-password flow.
- Protect dashboard, profile editing, job posting, saved listings, and messaging routes.

3. Student profile
- Public profile page with:
  - Avatar
  - Full name
  - College/university
  - Location
  - Bio
  - Portfolio URL
  - LinkedIn URL
  - Availability status
  - Skills offered
  - Skills wanted
  - Posted jobs
  - Rating/review placeholder architecture for future enhancement
- Edit profile page.
- Support avatar uploads with Supabase Storage.
- Add profile completion progress indicator.

4. Skills marketplace
- Browse all student skills in a card-based layout.
- Each skill card should show:
  - Student avatar
  - Student name
  - Skill title
  - Skill category
  - Experience level: Beginner, Intermediate, Advanced
  - Short description
  - Exchange preference: “Skill exchange”, “Paid”, “Either”, or “Volunteer”
  - Location / remote status
- Filters:
  - Search keyword
  - Skill category
  - Experience level
  - Exchange preference
  - Remote / in-person
- Sort by newest, most relevant, and alphabetical.
- Clicking a card opens a skill detail view.
- Allow authenticated users to save skill listings and send an inquiry.

5. Jobs and projects marketplace
- Browse student-friendly jobs, gigs, collaboration requests, internships, and project opportunities.
- Job card fields:
  - Job title
  - Organization or poster name
  - Category
  - Description preview
  - Required skills
  - Compensation type: Paid, Skill Exchange, Volunteer, Negotiable
  - Budget / compensation text
  - Remote / in-person
  - Location
  - Deadline
  - Date posted
- Filters:
  - Search
  - Job category
  - Required skill
  - Compensation type
  - Remote / location
- Job details page with full description and “Apply / Express Interest” button.
- Authenticated users can create, edit, delete, close, save, and manage their job listings.
- Ensure only job owners can edit or delete their own listings.

6. Post a skill
- Authenticated users can add multiple skills.
- Form fields:
  - Skill title
  - Category
  - Description
  - Experience level
  - What they can help with
  - Exchange preference
  - Remote or in-person
  - Location
  - Availability
- Form validation and clear success feedback.

7. Post a job
- Authenticated users can create job or collaboration requests.
- Form fields:
  - Job title
  - Category
  - Detailed description
  - Required skills (tag input)
  - Compensation type
  - Budget or reward description
  - Work mode: Remote, In-person, Hybrid
  - Location
  - Application deadline
- Add draft-friendly UX if simple to implement.
- Show a preview before publishing if practical.

8. Student dashboard
- Personalized dashboard after login.
- Display:
  - Welcome section with profile completion
  - My skills
  - My posted jobs
  - Saved skills and jobs
  - Recent inquiries/applications
  - Quick actions: Add Skill, Post Job, Edit Profile
- Use helpful empty states for new users.

9. Contact page
- Build a clean contact form with fields:
  - Name
  - Phone number
  - Message
- Include client-side validation:
  - Name required
  - Valid phone number required
  - Message required with sensible minimum length
- On submit, save form data to Supabase PostgreSQL.
- Show a polished success confirmation.
- Include support email and social links as configurable placeholders.
- Make this form publicly available without requiring login.

10. Admin area
- Create an admin-only route/page.
- Admin can view contact submissions, including:
  - Name
  - Phone number
  - Message
  - Submitted date
  - Read/unread status
- Admin can mark messages as read.
- Admin can view/manage basic reported or inappropriate content architecture if practical.
- Keep this section protected through role-based access.

Database design in Supabase PostgreSQL:

Create the following tables with UUID primary keys, timestamps, constraints, foreign keys, and useful indexes.

1. profiles
- id uuid primary key references auth.users(id) on delete cascade
- full_name text not null
- email text
- college text
- location text
- bio text
- avatar_url text
- portfolio_url text
- linkedin_url text
- availability text
- role text default 'student' check role in ('student', 'admin')
- created_at timestamptz default now()
- updated_at timestamptz default now()

2. skills
- id uuid primary key default gen_random_uuid()
- user_id uuid references profiles(id) on delete cascade
- title text not null
- category text not null
- description text not null
- experience_level text check experience_level in ('Beginner', 'Intermediate', 'Advanced')
- help_offered text
- exchange_preference text check exchange_preference in ('Skill Exchange', 'Paid', 'Either', 'Volunteer')
- work_mode text check work_mode in ('Remote', 'In-person', 'Hybrid')
- location text
- availability text
- is_active boolean default true
- created_at timestamptz default now()
- updated_at timestamptz default now()

3. jobs
- id uuid primary key default gen_random_uuid()
- user_id uuid references profiles(id) on delete cascade
- title text not null
- category text not null
- description text not null
- required_skills text[] default '{}'
- compensation_type text check compensation_type in ('Paid', 'Skill Exchange', 'Volunteer', 'Negotiable')
- compensation_details text
- work_mode text check work_mode in ('Remote', 'In-person', 'Hybrid')
- location text
- deadline date
- status text default 'open' check status in ('draft', 'open', 'closed')
- created_at timestamptz default now()
- updated_at timestamptz default now()

4. saved_items
- id uuid primary key default gen_random_uuid()
- user_id uuid references profiles(id) on delete cascade
- item_type text check item_type in ('skill', 'job')
- skill_id uuid references skills(id) on delete cascade nullable
- job_id uuid references jobs(id) on delete cascade nullable
- created_at timestamptz default now()
- Add a constraint that exactly one of skill_id or job_id is provided.
- Prevent duplicate saves using unique indexes.

5. inquiries
- id uuid primary key default gen_random_uuid()
- sender_id uuid references profiles(id) on delete cascade
- recipient_id uuid references profiles(id) on delete cascade
- skill_id uuid references skills(id) on delete set null
- job_id uuid references jobs(id) on delete set null
- message text not null
- status text default 'new' check status in ('new', 'read', 'responded', 'archived')
- created_at timestamptz default now()

6. contact_messages
- id uuid primary key default gen_random_uuid()
- name text not null
- phone_number text not null
- message text not null
- is_read boolean default false
- created_at timestamptz default now()

7. applications
- id uuid primary key default gen_random_uuid()
- job_id uuid references jobs(id) on delete cascade
- applicant_id uuid references profiles(id) on delete cascade
- message text
- status text default 'pending' check status in ('pending', 'reviewed', 'accepted', 'rejected')
- created_at timestamptz default now()
- Add a unique constraint for one application per applicant per job.

Supabase requirements:
- Enable Row Level Security on every table.
- Public users may read active skills and open jobs.
- Authenticated users may:
  - Read public profiles needed for listings.
  - Create and update only their own profile.
  - Create, update, and delete only their own skills and jobs.
  - Save and remove only their own saved items.
  - View and manage only their own inquiries and applications.
- Allow public insert only for the contact_messages table, but do not allow public reads.
- Admin users can read and update contact messages.
- Create an automatic profile row when a new auth user signs up, using a Supabase trigger/function.
- Create updated_at triggers for relevant tables.
- Create a Supabase Storage bucket named “avatars” and secure upload/read policies appropriately.

Navigation:
- Desktop: logo, Explore Skills, Find Jobs, How It Works, Contact, Dashboard/Profile menu.
- Mobile: responsive hamburger drawer or bottom navigation with Home, Skills, Jobs, Dashboard, Profile.
- Show authentication buttons for guests and user menu for logged-in users.

Components to build:
- Navbar
- Mobile navigation
- Footer
- Search/filter bar
- Skill card
- Job card
- Profile header
- Tag/chip component
- Empty state component
- Loading skeleton component
- Protected route wrapper
- Auth forms
- Pagination or “Load more” behavior
- Reusable modal/dialog for delete confirmations
- Toast notification system

Seed/sample content:
- Add realistic sample skills, profiles, and job listings so the application looks populated in preview mode.
- Examples:
  - “Figma UI Designer”
  - “React Frontend Developer”
  - “Video Editor for Reels”
  - “English Communication Tutor”
  - “Canva Social Media Designer”
  - “Python Data Analysis”
  - “Build a Landing Page for Our Student Club”
  - “Need a Video Editor for a College Event”
  - “Looking for a Presentation Designer”
- Keep sample data clearly separate from production data logic.

Quality requirements:
- Use semantic HTML and accessible labels.
- Keyboard-accessible forms, menus, dialogs, and buttons.
- Include useful form validation.
- Avoid excessive animation; use subtle transitions only.
- Do not expose Supabase secrets in frontend code.
- Use environment variables for Supabase URL and anon key.
- Make all important pages functional and connected to real Supabase queries/mutations.
- Handle empty, loading, and error states gracefully.
- Structure the code cleanly for maintainability.

Final deliverable:
Generate the complete responsive React/Tailwind application with Supabase integration, database SQL/migrations, RLS policies, storage setup guidance, and realistic seeded preview data. Make it visually polished, ready to deploy, and easy to extend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://skillsexchange.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9febabfa-6fa1-4fad-adb8-81321860eb38).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
