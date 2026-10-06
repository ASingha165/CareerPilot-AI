import type { CareerRecommendation, ReadinessScore, SkillGapRoadmap, ResumeAnalysis } from "@/lib/types";
import type { AuthProvider } from "@/lib/constants/auth";
export type { AuthProvider } from "@/lib/constants/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  salt?: string;
  googleId?: string | null;
  avatar?: string | null;
  authProvider?: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CareerPreferences {
  targetRoles: string[];
  preferredIndustry: string;
  preferredWorkType: string; // "remote" | "hybrid" | "on-site" | "flexible"
  preferredLocation: string;
  careerInterests: string[];
}

export interface UserProfileEntity {
  userId: string;
  personal: PersonalInfo;
  careerPreferences: CareerPreferences;
  createdDate: string;
  lastProfileUpdate: string;
  lastAiAnalysisDate: string | null;
  lastResumeUpdate: string | null;
  lastGithubAnalysis: string | null;
  isAiAnalysisStale: boolean;
}

export interface EducationRecord {
  id: string;
  userId: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  grade?: string;
  coursework?: string[];
  createdAt: string;
  updatedAt: string;
}

export type SkillProficiency = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillSource = "manual" | "resume" | "github" | "certification";

export interface SkillRecord {
  id: string;
  userId: string;
  name: string;
  category: string;
  proficiency: SkillProficiency;
  experienceYears?: number;
  source: SkillSource;
  lastUpdated: string;
  createdAt: string;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  technologies: string[];
  role: string;
  githubUrl?: string;
  liveUrl?: string;
  startDate: string;
  endDate?: string;
  status: "in-progress" | "completed" | "planned";
  skills: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExperienceType =
  | "internship"
  | "freelance"
  | "part-time"
  | "volunteer"
  | "research"
  | "full-time"
  | "other";

export interface ExperienceRecord {
  id: string;
  userId: string;
  type: ExperienceType;
  organization: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  technologies: string[];
  achievements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CertificationRecord {
  id: string;
  userId: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  documentUrl?: string;
  relatedSkills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AchievementRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  issuingOrganization?: string;
  credentialUrl?: string;
  documentUrl?: string;
  skills: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  status: "uploaded" | "analyzed" | "error";
  analysis?: ResumeAnalysis;
  rawText?: string;
  createdAt: string;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  type:
    | "profile_created"
    | "skill_added"
    | "skill_updated"
    | "skill_deleted"
    | "project_added"
    | "project_updated"
    | "project_deleted"
    | "experience_added"
    | "certification_added"
    | "achievement_added"
    | "resume_uploaded"
    | "github_connected"
    | "career_goal_changed"
    | "ai_reanalyzed";
  timestamp: string;
}

export interface AiAnalysisRecord {
  id: string;
  userId: string;
  createdAt: string;
  targetRole: string;
  readinessScore: ReadinessScore;
  recommendations: CareerRecommendation[];
  roadmap: SkillGapRoadmap;
}

export interface ProfileCompleteness {
  overallPercentage: number;
  completedSections: string[];
  incompleteSections: string[];
  details: {
    basicInfo: boolean;
    education: boolean;
    skills: boolean;
    projects: boolean;
    experience: boolean;
    certifications: boolean;
    achievements: boolean;
    resume: boolean;
    github: boolean;
    careerPreferences: boolean;
  };
}

export interface FullUserProfile {
  user: {
    id: string;
    email: string;
    name: string;
    googleId?: string | null;
    avatar?: string | null;
    authProvider?: AuthProvider;
    createdAt: string;
  };
  profile: UserProfileEntity;
  education: EducationRecord[];
  skills: SkillRecord[];
  projects: ProjectRecord[];
  experience: ExperienceRecord[];
  certifications: CertificationRecord[];
  achievements: AchievementRecord[];
  resumes: ResumeRecord[];
  activities: ActivityRecord[];
  latestAnalysis?: AiAnalysisRecord;
  completeness: ProfileCompleteness;
}
