/**
 * Preview-only sample content. It is never written to the database and is only
 * used as a visual fallback when a marketplace query returns zero real rows.
 */
import type { PublicProfile, Skill } from "./types";

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();
const daysAhead = (n: number) =>
  new Date(now.getTime() + n * 86_400_000).toISOString().slice(0, 10);

function person(id: string, full_name: string, college: string, location: string): PublicProfile {
  return {
    id,
    full_name,
    college,
    location,
    avatar_url: null,
    bio: `${full_name.split(" ")[0]} is a student collaborator on skillSExhange.`,
    availability: "5-10 hrs / week",
    portfolio_url: null,
    linkedin_url: null,
  };
}

export const samplePeople: PublicProfile[] = [
  person("sample-p1", "Aarav Menon", "IIT Madras", "Chennai, IN"),
  person("sample-p2", "Sara Iqbal", "Delhi University", "New Delhi, IN"),
  person("sample-p3", "Tanvi Rao", "Christ University", "Bengaluru, IN"),
  person("sample-p4", "Rohit Desai", "VIT Vellore", "Vellore, IN"),
  person("sample-p5", "Meera Nair", "NIT Trichy", "Trichy, IN"),
  person("sample-p6", "Dev Sharma", "BITS Pilani", "Pilani, IN"),
];

function skill(
  id: string,
  profile: PublicProfile,
  data: Partial<Skill> & Pick<Skill, "title" | "category" | "description">,
  index: number,
): Skill {
  return {
    id,
    user_id: profile.id,
    title: data.title,
    category: data.category,
    description: data.description,
    experience_level: data.experience_level ?? "Intermediate",
    help_offered: data.help_offered ?? null,
    exchange_preference: data.exchange_preference ?? "Either",
    work_mode: data.work_mode ?? "Remote",
    location: data.location ?? profile.location,
    availability: data.availability ?? "Weekends",
    is_active: true,
    created_at: daysAgo(index + 1),
    updated_at: daysAgo(index + 1),
    profile,
    isSample: true,
  };
}

const p = (i: number): PublicProfile => samplePeople[i]!;

export const sampleSkills: Skill[] = [
  skill(
    "sample-s1",
    p(0),
    {
      title: "React Frontend Developer",
      category: "Web Development",
      description:
        "I build responsive React + TypeScript interfaces for student clubs and early-stage startups. Comfortable with Tailwind, component libraries and API integration.",
      experience_level: "Advanced",
      exchange_preference: "Paid",
      help_offered: "Landing pages, dashboards, bug fixing, code reviews",
    },
    0,
  ),
  skill(
    "sample-s2",
    p(1),
    {
      title: "Figma UI Designer",
      category: "UI/UX Design",
      description:
        "Wireframes, design systems and clickable prototypes in Figma. I love making student projects feel professional without overcomplicating them.",
      exchange_preference: "Skill Exchange",
      help_offered: "App screens, design systems, usability feedback",
      work_mode: "Hybrid",
    },
    1,
  ),
  skill(
    "sample-s3",
    p(2),
    {
      title: "Video Editor for Reels",
      category: "Video Editing",
      description:
        "Short-form edits for Instagram and YouTube Shorts — captions, transitions, sound design. Fast turnaround during weekends.",
      experience_level: "Intermediate",
      exchange_preference: "Paid",
      help_offered: "Reels, event recaps, podcast clips",
    },
    2,
  ),
  skill(
    "sample-s4",
    p(3),
    {
      title: "English Communication Tutor",
      category: "Tutoring",
      description:
        "Weekly speaking practice, interview prep and pronunciation drills. I have coached 30+ juniors before placement season.",
      exchange_preference: "Volunteer",
      help_offered: "Mock interviews, group practice, feedback notes",
    },
    3,
  ),
  skill(
    "sample-s5",
    p(4),
    {
      title: "Canva Social Media Designer",
      category: "Graphic Design",
      description:
        "Poster sets, story templates and event branding built in Canva so your team can reuse and edit everything later.",
      experience_level: "Beginner",
      exchange_preference: "Either",
      help_offered: "Posters, carousels, brand kits",
    },
    4,
  ),
  skill(
    "sample-s6",
    p(5),
    {
      title: "Python Data Analysis",
      category: "Data Analysis",
      description:
        "Pandas cleaning, exploratory analysis and clear matplotlib charts for research projects, surveys and fest analytics.",
      experience_level: "Advanced",
      exchange_preference: "Either",
      help_offered: "Survey analysis, dashboards, report writing",
      work_mode: "Remote",
    },
    5,
  ),
];

export const sampleTestimonials = [
  {
    name: "Aarav Menon",
    college: "IIT Madras",
    quote:
      "I traded two weekends of React work for a full design system. Both of us walked away with something for our portfolios.",
  },
  {
    name: "Sara Iqbal",
    college: "Delhi University",
    quote:
      "I listed my design skills on a Monday and had three students reach out by Wednesday.",
  },
  {
    name: "Dev Sharma",
    college: "BITS Pilani",
    quote:
      "Tutoring juniors in Python here got me my first paid analytics project off campus.",
  },
];
