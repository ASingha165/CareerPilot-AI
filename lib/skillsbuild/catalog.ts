import type { SkillsBuildResource } from "@/lib/types";

// IBM SkillsBuild resource recommendations.
// These are structured placeholders ready for real API/URL integration.
// isPlaceholder: true means the URL has not been linked to a live course yet.

export const SKILLSBUILD_CATALOG: SkillsBuildResource[] = [
  {
    id: "sb-ai-ml-001",
    title: "Machine Learning with Python",
    description:
      "Learn core ML algorithms, model training, and evaluation using Python and scikit-learn.",
    skillArea: "Machine Learning",
    level: "intermediate",
    estimatedHours: 20,
    tags: ["Python", "Machine Learning", "scikit-learn", "AI"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-ai-dl-001",
    title: "Deep Learning Fundamentals",
    description:
      "Understand neural networks, CNNs, and RNNs with hands-on exercises.",
    skillArea: "Deep Learning",
    level: "intermediate",
    estimatedHours: 25,
    tags: ["Deep Learning", "Neural Networks", "TensorFlow", "AI"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-cloud-001",
    title: "Cloud Computing Foundations",
    description:
      "Introduction to cloud concepts, deployment models, and IBM Cloud services.",
    skillArea: "Cloud Computing",
    level: "beginner",
    estimatedHours: 12,
    tags: ["Cloud", "IBM Cloud", "Infrastructure", "DevOps"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-data-001",
    title: "Data Science Methodology",
    description:
      "Structured approach to solving business problems with data. Covers the full data science process.",
    skillArea: "Data Science",
    level: "beginner",
    estimatedHours: 8,
    tags: ["Data Science", "Methodology", "Analytics"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-cyber-001",
    title: "Cybersecurity Fundamentals",
    description:
      "Core concepts of cybersecurity including threat models, encryption, and security frameworks.",
    skillArea: "Cybersecurity",
    level: "beginner",
    estimatedHours: 15,
    tags: ["Cybersecurity", "Security", "Networking"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-dev-001",
    title: "Application Development with Python",
    description:
      "Build web applications and APIs using Python frameworks including Flask and Django basics.",
    skillArea: "Software Development",
    level: "intermediate",
    estimatedHours: 18,
    tags: ["Python", "Flask", "Web Development", "APIs"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-devops-001",
    title: "DevOps Essentials",
    description:
      "Introduction to DevOps culture, CI/CD pipelines, Docker, and Kubernetes basics.",
    skillArea: "DevOps",
    level: "intermediate",
    estimatedHours: 20,
    tags: ["DevOps", "Docker", "CI/CD", "Kubernetes"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-sql-001",
    title: "Databases and SQL",
    description:
      "Relational database design, SQL queries, joins, and database optimization fundamentals.",
    skillArea: "Databases",
    level: "beginner",
    estimatedHours: 10,
    tags: ["SQL", "Databases", "PostgreSQL", "Data"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-nlp-001",
    title: "Natural Language Processing",
    description:
      "Text classification, sentiment analysis, and language model fundamentals.",
    skillArea: "NLP",
    level: "advanced",
    estimatedHours: 22,
    tags: ["NLP", "Text Analysis", "Transformers", "BERT", "AI"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
  {
    id: "sb-pm-001",
    title: "Agile Project Management",
    description:
      "Agile methodology, Scrum framework, and project leadership for technical teams.",
    skillArea: "Project Management",
    level: "beginner",
    estimatedHours: 8,
    tags: ["Agile", "Scrum", "Project Management", "Leadership"],
    url: "https://skillsbuild.org",
    isPlaceholder: true,
  },
];

export function getRecommendedResources(
  missingSkills: string[],
  targetRole: string,
  limit = 4
): SkillsBuildResource[] {
  const skillsLower = missingSkills.map((s) => s.toLowerCase());
  const roleLower = targetRole.toLowerCase();

  // Score each resource by relevance
  const scored = SKILLSBUILD_CATALOG.map((resource) => {
    let score = 0;
    const tagsLower = resource.tags.map((t) => t.toLowerCase());
    const titleLower = resource.title.toLowerCase();
    const skillAreaLower = resource.skillArea.toLowerCase();

    for (const skill of skillsLower) {
      if (tagsLower.some((tag) => tag.includes(skill) || skill.includes(tag)))
        score += 3;
      if (titleLower.includes(skill)) score += 2;
      if (skillAreaLower.includes(skill)) score += 2;
    }

    if (roleLower.includes("ml") || roleLower.includes("ai")) {
      if (tagsLower.includes("ai") || tagsLower.includes("machine learning"))
        score += 1;
    }

    return { resource, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.resource);
}
