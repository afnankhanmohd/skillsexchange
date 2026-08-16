/**
 * Preview-only sample content. It is never written to the database and is only
 * used as a visual fallback when a marketplace query returns zero real rows.
 */
import type { Job, PublicProfile, Skill } from "./types";

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

function job(
  id: string,
  profile: PublicProfile,
  data: Partial<Job> & Pick<Job, "title" | "category" | "description">,
  index: number,
): Job {
  return {
    id,
    user_id: profile.id,
    title: data.title,
    organization: data.organization ?? null,
    category: data.category,
    description: data.description,
    required_skills: data.required_skills ?? [],
    compensation_type: data.compensation_type ?? "Negotiable",
    compensation_details: data.compensation_details ?? "Discussed with the team",
    work_mode: data.work_mode ?? "Remote",
    location: data.location ?? profile.location,
    deadline: data.deadline ?? daysAhead(14 + index),
    status: "open",
    created_at: daysAgo(index + 1),
    updated_at: daysAgo(index + 1),
    profile,
    isSample: true,
  };
}

export const sampleJobs: Job[] = [
  job(
    "sample-j1",
    p(1),
    {
      title: "Build a Landing Page for Our Student Club",
      organization: "Coding Club, Delhi University",
      category: "Web Development",
      description:
        "We need a single-page site for our club with an events section, team page and a join form. Design references will be shared. Great chance to add a real project to your portfolio.",
      required_skills: ["React", "Tailwind CSS", "Responsive design"],
      compensation_type: "Paid",
      compensation_details: "₹6,000 fixed on delivery",
    },
    0,
  ),
  job(
    "sample-j2",
    p(2),
    {
      title: "Need a Video Editor for a College Event",
      organization: "Sparkfest 2026",
      category: "Video Editing",
      description:
        "Two-day cultural fest coverage: one 90-second highlight film plus five reels. Raw footage will be handed over on the last evening of the fest.",
      required_skills: ["Premiere Pro", "Color grading", "Sound design"],
      compensation_type: "Paid",
      compensation_details: "₹4,500 + festival passes",
      work_mode: "Hybrid",
    },
    1,
  ),
  job(
    "sample-j3",
    p(3),
    {
      title: "Looking for a Presentation Designer",
      organization: "E-Cell VIT",
      category: "Graphic Design",
      description:
        "Polish a 15-slide pitch deck for a national startup competition. We have the content — we need visual hierarchy, charts and consistent styling.",
      required_skills: ["Figma", "Slides", "Data visualisation"],
      compensation_type: "Skill Exchange",
      compensation_details: "Exchange for web development or mentoring hours",
    },
    2,
  ),
  job(
    "sample-j4",
    p(4),
    {
      title: "Content Writer for Campus Newsletter",
      organization: "NIT Trichy Media Cell",
      category: "Content Writing",
      description:
        "Write two 500-word features every month covering student achievements and campus initiatives. Editing support provided.",
      required_skills: ["Writing", "Interviewing", "Editing"],
      compensation_type: "Volunteer",
      compensation_details: "Certificate + byline credit",
    },
    3,
  ),
  job(
    "sample-j5",
    p(5),
    {
      title: "Data Analysis Intern for Survey Project",
      organization: "Research Group, BITS Pilani",
      category: "Data Analysis",
      description:
        "Help clean and analyse a 2,000-response survey on student wellbeing, then co-author the summary report.",
      required_skills: ["Python", "Pandas", "Statistics"],
      compensation_type: "Negotiable",
      compensation_details: "Stipend + co-authorship",
    },
    4,
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
      "I posted a club landing page gig on a Monday and had three serious student applicants by Wednesday.",
  },
  {
    name: "Dev Sharma",
    college: "BITS Pilani",
    quote:
      "Tutoring juniors in Python here got me my first paid analytics project off campus.",
  },
];
