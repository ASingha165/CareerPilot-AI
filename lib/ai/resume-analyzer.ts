import { getGeminiModel } from "@/lib/ai/gemini";
import { RESUME_ANALYSIS_PROMPT } from "@/lib/ai/prompts";
import { safeJsonParse } from "@/lib/utils";
import type { ResumeAnalysis } from "@/lib/types";

export const MOCK_RESUME_ANALYSIS: ResumeAnalysis = {
  extractedSkills: {
    technical: ["Python", "Machine Learning", "SQL", "TensorFlow", "Git"],
    soft: ["Communication", "Problem Solving", "Team Collaboration"],
  },
  education: ["B.Tech Computer Science — XYZ University (2025)"],
  projects: [
    "Sentiment Analysis Web App — NLP-based tweet classifier",
    "Student Grade Predictor — ML model using scikit-learn",
  ],
  experience: [],
  certifications: ["Google Data Analytics Certificate"],
  achievements: [
    "Top 10% in university class",
    "Hackathon finalist — TechFest 2024",
  ],
  technologies: ["Python", "TensorFlow", "Flask", "MySQL", "Jupyter"],
  domains: ["Machine Learning", "Data Analysis", "Web Development"],
  strengths: [
    "Strong Python fundamentals with applied ML project experience",
    "Good understanding of data preprocessing and model evaluation",
    "Initiative shown through hackathon participation",
  ],
  weaknesses: [
    "No professional work experience listed",
    "Projects lack production deployment details",
    "Resume lacks quantified impact metrics",
  ],
  missingSkills: [
    "Cloud platforms (AWS/GCP/Azure)",
    "MLOps / model deployment",
    "Deep learning frameworks beyond TensorFlow basics",
  ],
  suggestions: [
    "Add metrics to project descriptions (e.g., '92% accuracy on 10k samples')",
    "Include a GitHub link with active repositories",
    "Add a professional summary at the top",
    "Mention any internship or freelance work",
  ],
};

export async function analyzeResume(
  resumeText: string,
  profileContext?: string
): Promise<ResumeAnalysis> {
  const model = getGeminiModel();
  const prompt = RESUME_ANALYSIS_PROMPT(resumeText, profileContext);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = safeJsonParse<ResumeAnalysis>(text);
  if (!parsed) {
    throw new Error("Failed to parse resume analysis response from AI");
  }

  return parsed;
}
