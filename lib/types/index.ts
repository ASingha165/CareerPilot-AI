// ============================================================
// CareerPilot — Central Type Definitions
// ============================================================

export type ExperienceLevel = "student" | "fresher" | "intern" | "entry";

export interface CareerProfile {
  name: string;
  education: string;
  degree: string;
  branch: string;
  graduationYear: number;
  interests: string[];
  currentSkills: string[];
  preferredIndustries: string[];
  careerGoals: string;
  targetRoles: string[];
  experienceLevel: ExperienceLevel;
}

// ---- Resume Analysis ----------------------------------------

export interface ResumeAnalysis {
  extractedSkills: {
    technical: string[];
    soft: string[];
  };
  education: string[];
  projects: string[];
  experience: string[];
  certifications: string[];
  achievements: string[];
  technologies: string[];
  domains: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  rawText?: string;
}

// ---- Career Recommendation ----------------------------------

export type CareerRole =
  | "AI/ML Engineer"
  | "Software Developer"
  | "Full-Stack Developer"
  | "Data Analyst"
  | "Data Scientist"
  | "Cybersecurity Analyst"
  | "Cloud/DevOps Engineer"
  | "Product Manager"
  | "Technical Lead";

export interface CareerRecommendation {
  role: CareerRole | string;
  matchPercentage: number;
  whyItFits: string;
  existingStrengths: string[];
  missingSkills: string[];
  recommendedProjects: string[];
  learningPath: string[];
  nextSteps: string[];
  icon?: string;
}

// ---- Readiness Score ----------------------------------------

export interface ReadinessBreakdown {
  technicalSkills: number;
  projects: number;
  experience: number;
  certifications: number;
  resumeQuality: number;
  githubActivity: number;
  interviewReadiness: number;
}

export interface ReadinessScore {
  overall: number;
  breakdown: ReadinessBreakdown;
  label: string; // e.g. "Career Ready", "Getting There", "Early Stage"
  explanation: string;
  topImprovements: string[];
}

// ---- Skill Gap ----------------------------------------------

export type SkillPriority = "critical" | "important" | "nice-to-have";
export type SkillLevel =
  | "strong"
  | "developing"
  | "needs-work"
  | "beginner"
  | "not-started";

export interface SkillGap {
  skill: string;
  currentLevel: number; // 0–100
  requiredLevel: number; // 0–100
  level: SkillLevel;
  priority: SkillPriority;
  resources: string[];
  category: string;
}

export interface RoadmapStage {
  stage: number;
  title: string;
  description: string;
  skills: string[];
  estimatedWeeks: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  projects: string[];
  completed: boolean;
}

export interface SkillGapRoadmap {
  targetRole: string;
  currentSkills: SkillGap[];
  stages: RoadmapStage[];
  totalEstimatedWeeks: number;
}

// ---- IBM SkillsBuild Recommendations ------------------------

export interface SkillsBuildResource {
  id: string;
  title: string;
  description: string;
  skillArea: string;
  level: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  tags: string[];
  url?: string; // real URL when integrated
  isPlaceholder: boolean; // flag: real vs placeholder
}

// ---- Mock Interview -----------------------------------------

export type InterviewType = "technical" | "behavioral" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionCategory =
  | "technical"
  | "behavioral"
  | "problem-solving"
  | "situational";

export interface AnswerFeedback {
  score: number; // 0–100
  whatWasGood: string[];
  improvements: string[];
  missingPoints: string[];
  betterStructure: string;
  followUpPractice: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  hint?: string;
  answer?: string;
  feedback?: AnswerFeedback;
  timeSpentSeconds?: number;
}

export interface InterviewResult {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  areasToImprove: string[];
  strengths: string[];
  summary: string;
}

export interface InterviewSession {
  id: string;
  role: string;
  type: InterviewType;
  difficulty: Difficulty;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  result?: InterviewResult;
  createdAt: string;
  completedAt?: string;
  status: "setup" | "in-progress" | "completed";
}

// ---- GitHub Analysis ----------------------------------------

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
  url: string;
}

export interface GitHubAnalysis {
  username: string;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  topLanguages: { language: string; percentage: number }[];
  repositories: GitHubRepo[];
  techStack: string[];
  projectTypes: string[];
  activityLevel: "high" | "medium" | "low" | "inactive";
  practicalExperience: string;
  strengths: string[];
  suggestions: string[];
}

// Re-export persistent entity models
export * from "@/lib/db/types";

import type {
  FullUserProfile,
  ProfileCompleteness,
  ActivityRecord,
  AuthProvider,
} from "@/lib/db/types";

// ---- App Store State ----------------------------------------

export interface AppState {
  // Auth & Persistent Profile
  user: {
    id: string;
    email: string;
    name: string;
    googleId?: string | null;
    avatar?: string | null;
    authProvider?: AuthProvider;
  } | null;
  fullProfile: FullUserProfile | null;
  isAiAnalysisStale: boolean;
  completeness: ProfileCompleteness | null;
  activities: ActivityRecord[];

  // Onboarding
  profile: CareerProfile | null;
  onboardingComplete: boolean;

  // Resume
  resumeText: string | null;
  resumeAnalysis: ResumeAnalysis | null;
  resumeFileName: string | null;

  // Career
  recommendations: CareerRecommendation[];
  selectedCareer: string | null;

  // Readiness
  readinessScore: ReadinessScore | null;

  // Roadmap
  roadmap: SkillGapRoadmap | null;

  // Interviews
  interviewSessions: InterviewSession[];
  activeInterviewSession: InterviewSession | null;

  // GitHub
  githubAnalysis: GitHubAnalysis | null;

  // SkillsBuild
  skillsBuildResources: SkillsBuildResource[];

  // UI
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

export interface AppActions {
  setUser: (
    user: {
      id: string;
      email: string;
      name: string;
      googleId?: string | null;
      avatar?: string | null;
      authProvider?: AuthProvider;
    } | null
  ) => void;
  setFullProfile: (fullProfile: FullUserProfile | null) => void;
  setIsAiAnalysisStale: (val: boolean) => void;
  setActivities: (activities: ActivityRecord[]) => void;
  refreshFullProfile: () => Promise<void>;
  setProfile: (profile: CareerProfile) => void;
  setOnboardingComplete: (val: boolean) => void;
  setResumeAnalysis: (
    analysis: ResumeAnalysis,
    fileName: string,
    rawText: string
  ) => void;
  setRecommendations: (recs: CareerRecommendation[]) => void;
  setSelectedCareer: (role: string) => void;
  setReadinessScore: (score: ReadinessScore) => void;
  setRoadmap: (roadmap: SkillGapRoadmap) => void;
  addInterviewSession: (session: InterviewSession) => void;
  updateInterviewSession: (session: InterviewSession) => void;
  setActiveInterviewSession: (session: InterviewSession | null) => void;
  setGithubAnalysis: (analysis: GitHubAnalysis | null) => void;
  setSkillsBuildResources: (resources: SkillsBuildResource[]) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

