import { getGeminiModel } from "@/lib/ai/gemini";
import { CAREER_RECOMMENDATION_PROMPT } from "@/lib/ai/prompts";
import { safeJsonParse } from "@/lib/utils";
import type { CareerRecommendation, CareerProfile, ResumeAnalysis } from "@/lib/types";

export const MOCK_RECOMMENDATIONS: CareerRecommendation[] = [
  {
    role: "AI/ML Engineer",
    matchPercentage: 91,
    whyItFits:
      "Your Python proficiency and ML project experience align strongly with AI/ML engineering. The hands-on work with TensorFlow and scikit-learn demonstrates practical readiness for entry-level AI roles.",
    existingStrengths: ["Python", "Machine Learning", "TensorFlow", "Data Analysis"],
    missingSkills: ["MLOps", "Cloud Platforms", "Deep Learning (advanced)", "System Design"],
    recommendedProjects: [
      "Build and deploy an ML model to AWS/GCP with an API endpoint",
      "End-to-end NLP pipeline with FastAPI backend",
      "Kaggle competition with documented approach",
    ],
    learningPath: [
      "Complete a cloud platform fundamentals course (AWS or GCP)",
      "Learn Docker and basic MLOps with MLflow",
      "Study deep learning (CNNs, transformers) systematically",
      "Practice system design for ML applications",
    ],
    nextSteps: [
      "Add model deployment to an existing project",
      "Create a clean GitHub portfolio with README documentation",
      "Apply for ML/AI internships or entry roles",
    ],
  },
  {
    role: "Data Scientist",
    matchPercentage: 83,
    whyItFits:
      "Your foundation in Python, SQL, and ML is highly relevant for data science roles. Adding statistical depth and business storytelling would make you a strong candidate.",
    existingStrengths: ["Python", "SQL", "Machine Learning", "Data Analysis"],
    missingSkills: ["Statistical Modeling", "A/B Testing", "Business Intelligence Tools", "Experimentation"],
    recommendedProjects: [
      "End-to-end data analysis report on a real dataset",
      "Predictive analytics project with business insights",
    ],
    learningPath: [
      "Strengthen statistics and probability foundations",
      "Learn data visualization (Tableau or Power BI)",
      "Study A/B testing and causal inference",
    ],
    nextSteps: [
      "Work through a Kaggle dataset with full EDA and insights",
      "Build a portfolio blog with data stories",
    ],
  },
  {
    role: "Software Developer",
    matchPercentage: 72,
    whyItFits:
      "Your programming background provides a solid base for software development. Expanding beyond Python into web frameworks and software engineering principles would strengthen this path.",
    existingStrengths: ["Python", "Git", "Problem Solving", "Flask"],
    missingSkills: ["System Design", "JavaScript/TypeScript", "Testing", "Software Architecture"],
    recommendedProjects: [
      "Full-stack web application with user authentication",
      "REST API with proper documentation and tests",
    ],
    learningPath: [
      "Learn JavaScript/TypeScript fundamentals",
      "Study data structures and algorithms for interviews",
      "Learn software testing practices",
    ],
    nextSteps: [
      "Build one full-stack project",
      "Practice LeetCode medium problems regularly",
    ],
  },
  {
    role: "Data Analyst",
    matchPercentage: 68,
    whyItFits:
      "Your SQL and data analysis skills are directly applicable to data analyst roles, which are a strong entry point into tech careers.",
    existingStrengths: ["SQL", "Python", "Data Analysis", "Communication"],
    missingSkills: ["Excel/Sheets advanced", "Dashboard Tools", "Business Metrics", "Reporting"],
    recommendedProjects: [
      "Interactive business dashboard using real public dataset",
    ],
    learningPath: [
      "Learn Tableau or Power BI",
      "Practice SQL complex queries and window functions",
      "Study business analytics fundamentals",
    ],
    nextSteps: [
      "Complete a business analytics project",
      "Apply for data analyst internships",
    ],
  },
];

export async function recommendCareers(
  profile: CareerProfile,
  resumeAnalysis: ResumeAnalysis
): Promise<CareerRecommendation[]> {
  const model = getGeminiModel();

  const profileStr = JSON.stringify({
    name: profile.name,
    degree: `${profile.degree} in ${profile.branch}`,
    graduationYear: profile.graduationYear,
    skills: profile.currentSkills,
    interests: profile.interests,
    industries: profile.preferredIndustries,
    goals: profile.careerGoals,
    targetRoles: profile.targetRoles,
    experienceLevel: profile.experienceLevel,
  }, null, 2);

  const analysisStr = JSON.stringify({
    skills: resumeAnalysis.extractedSkills,
    technologies: resumeAnalysis.technologies,
    domains: resumeAnalysis.domains,
    strengths: resumeAnalysis.strengths,
    weaknesses: resumeAnalysis.weaknesses,
  }, null, 2);

  const prompt = CAREER_RECOMMENDATION_PROMPT(profileStr, analysisStr);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = safeJsonParse<CareerRecommendation[]>(text);
  if (!parsed || !Array.isArray(parsed)) {
    throw new Error("Failed to parse career recommendations from AI");
  }

  return parsed;
}
