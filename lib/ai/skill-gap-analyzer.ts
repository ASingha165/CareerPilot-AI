import { getGeminiModel } from "@/lib/ai/gemini";
import { SKILL_GAP_PROMPT } from "@/lib/ai/prompts";
import { safeJsonParse } from "@/lib/utils";
import type { SkillGapRoadmap } from "@/lib/types";

export const MOCK_ROADMAP: SkillGapRoadmap = {
  targetRole: "AI/ML Engineer",
  currentSkills: [
    {
      skill: "Python",
      currentLevel: 72,
      requiredLevel: 90,
      level: "developing",
      priority: "critical",
      resources: ["Advanced Python courses", "Real projects"],
      category: "Programming Languages",
    },
    {
      skill: "Machine Learning",
      currentLevel: 55,
      requiredLevel: 88,
      level: "developing",
      priority: "critical",
      resources: ["Andrew Ng ML Course", "Hands-On ML book"],
      category: "Data & AI/ML",
    },
    {
      skill: "Deep Learning",
      currentLevel: 35,
      requiredLevel: 80,
      level: "needs-work",
      priority: "critical",
      resources: ["fast.ai course", "Deep Learning Specialization"],
      category: "Data & AI/ML",
    },
    {
      skill: "MLOps",
      currentLevel: 10,
      requiredLevel: 70,
      level: "beginner",
      priority: "important",
      resources: ["MLflow documentation", "Deploying ML Models course"],
      category: "Cloud & DevOps",
    },
    {
      skill: "Cloud Platforms",
      currentLevel: 0,
      requiredLevel: 65,
      level: "not-started",
      priority: "important",
      resources: ["AWS Machine Learning Specialty", "GCP AI Platform"],
      category: "Cloud & DevOps",
    },
    {
      skill: "SQL",
      currentLevel: 68,
      requiredLevel: 75,
      level: "developing",
      priority: "nice-to-have",
      resources: ["Advanced SQL practice", "Database optimization"],
      category: "Databases",
    },
  ],
  stages: [
    {
      stage: 1,
      title: "Foundation",
      description: "Solidify Python, math, and data fundamentals",
      skills: ["Advanced Python", "Linear Algebra", "Statistics", "Pandas/NumPy"],
      estimatedWeeks: 4,
      difficulty: "beginner",
      projects: ["Python data analysis project", "Statistical exploration of a dataset"],
      completed: false,
    },
    {
      stage: 2,
      title: "Core ML Skills",
      description: "Build practical machine learning knowledge",
      skills: ["Supervised Learning", "Model Evaluation", "Feature Engineering", "scikit-learn"],
      estimatedWeeks: 6,
      difficulty: "intermediate",
      projects: ["End-to-end ML pipeline", "Kaggle competition entry"],
      completed: false,
    },
    {
      stage: 3,
      title: "Advanced Skills",
      description: "Deep learning and specialized AI techniques",
      skills: ["Deep Learning", "CNNs", "Transformers", "NLP", "Computer Vision"],
      estimatedWeeks: 8,
      difficulty: "advanced",
      projects: ["Image classifier with deployment", "NLP chatbot or sentiment analyzer"],
      completed: false,
    },
    {
      stage: 4,
      title: "Projects & Portfolio",
      description: "Build production-ready projects and deploy them",
      skills: ["MLOps", "Docker", "Cloud Deployment", "API Development"],
      estimatedWeeks: 6,
      difficulty: "intermediate",
      projects: [
        "Deploy ML model as REST API on AWS/GCP",
        "End-to-end ML project with MLflow tracking",
        "Contributing to an open-source ML project",
      ],
      completed: false,
    },
    {
      stage: 5,
      title: "Interview Preparation",
      description: "Prepare for technical interviews and system design",
      skills: [
        "Data Structures & Algorithms",
        "System Design for ML",
        "Behavioral Interviews",
        "ML Theory",
      ],
      estimatedWeeks: 4,
      difficulty: "advanced",
      projects: [
        "Mock interviews on Pramp or Interviewing.io",
        "LeetCode ML-focused problems",
      ],
      completed: false,
    },
  ],
  totalEstimatedWeeks: 28,
};

export async function analyzeSkillGap(
  targetRole: string,
  currentSkills: string[],
  resumeAnalysisSummary: string
): Promise<SkillGapRoadmap> {
  const model = getGeminiModel();
  const prompt = SKILL_GAP_PROMPT(targetRole, currentSkills, resumeAnalysisSummary);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = safeJsonParse<SkillGapRoadmap>(text);
  if (!parsed) {
    throw new Error("Failed to parse skill gap analysis from AI");
  }

  return parsed;
}
