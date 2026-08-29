import type { CareerRole } from "@/lib/types";

export const CAREER_ROLES: CareerRole[] = [
  "AI/ML Engineer",
  "Software Developer",
  "Full-Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Cybersecurity Analyst",
  "Cloud/DevOps Engineer",
  "Product Manager",
  "Technical Lead",
];

export const CAREER_ICONS: Record<string, string> = {
  "AI/ML Engineer": "🤖",
  "Software Developer": "💻",
  "Full-Stack Developer": "🌐",
  "Data Analyst": "📊",
  "Data Scientist": "🔬",
  "Cybersecurity Analyst": "🛡️",
  "Cloud/DevOps Engineer": "☁️",
  "Product Manager": "🎯",
  "Technical Lead": "⚡",
};

export const INDUSTRIES = [
  "Technology",
  "Finance / FinTech",
  "Healthcare / MedTech",
  "E-commerce / Retail",
  "Education / EdTech",
  "Manufacturing",
  "Consulting",
  "Government / Public Sector",
  "Media / Entertainment",
  "Startups",
];

export const SKILL_CATEGORIES = [
  "Programming Languages",
  "Web Development",
  "Data & AI/ML",
  "Cloud & DevOps",
  "Databases",
  "Cybersecurity",
  "Mobile Development",
  "Soft Skills",
];

export const COMMON_SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "React",
  "Next.js",
  "Node.js",
  "Vue.js",
  "Angular",
  "Machine Learning",
  "Deep Learning",
  "TensorFlow",
  "PyTorch",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Git",
  "Linux",
  "Data Analysis",
  "Statistics",
  "NLP",
  "Computer Vision",
  "REST APIs",
  "GraphQL",
  "CI/CD",
  "Agile",
  "System Design",
];

export const READINESS_DIMENSIONS = [
  { key: "technicalSkills", label: "Technical Skills", icon: "⚙️" },
  { key: "projects", label: "Projects", icon: "🛠️" },
  { key: "experience", label: "Experience", icon: "💼" },
  { key: "certifications", label: "Certifications", icon: "🏆" },
  { key: "resumeQuality", label: "Resume Quality", icon: "📄" },
  { key: "githubActivity", label: "GitHub Activity", icon: "🐙" },
  { key: "interviewReadiness", label: "Interview Readiness", icon: "🎤" },
] as const;
