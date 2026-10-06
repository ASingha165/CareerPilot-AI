import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  User,
  Session,
  UserProfileEntity,
  EducationRecord,
  SkillRecord,
  ProjectRecord,
  ExperienceRecord,
  CertificationRecord,
  AchievementRecord,
  ResumeRecord,
  ActivityRecord,
  AiAnalysisRecord,
  FullUserProfile,
  ProfileCompleteness,
} from "./types";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", ".data")
  : path.join(process.cwd(), ".data");

// Helper to ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn(`[DB] Warning ensuring data dir ${DATA_DIR}:`, err);
  }
}

const fileMtimes: Record<string, number> = {};

function getFileMtime(filename: string): number {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return fs.statSync(filePath).mtimeMs;
    }
  } catch {}
  return 0;
}

// Atomic JSON file read/write
function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filename, defaultValue);
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`[DB] Error reading ${filename}:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
    fileMtimes[filename] = getFileMtime(filename);
  } catch (err) {
    console.error(`[DB] Error writing ${filename}:`, err);
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  }
}

// In-memory cache
interface DbCache {
  users: User[];
  sessions: Session[];
  profiles: UserProfileEntity[];
  education: EducationRecord[];
  skills: SkillRecord[];
  projects: ProjectRecord[];
  experience: ExperienceRecord[];
  certifications: CertificationRecord[];
  achievements: AchievementRecord[];
  resumes: ResumeRecord[];
  activities: ActivityRecord[];
  aiAnalyses: AiAnalysisRecord[];
}

const CACHE_FILES: Record<keyof DbCache, string> = {
  users: "users.json",
  sessions: "sessions.json",
  profiles: "profiles.json",
  education: "education.json",
  skills: "skills.json",
  projects: "projects.json",
  experience: "experience.json",
  certifications: "certifications.json",
  achievements: "achievements.json",
  resumes: "resumes.json",
  activities: "activities.json",
  aiAnalyses: "ai_analyses.json",
};

let cache: DbCache | null = null;

export function invalidateCache(): void {
  cache = null;
}

function loadCache(): DbCache {
  if (!cache) {
    cache = {
      users: readJsonFile<User[]>("users.json", []),
      sessions: readJsonFile<Session[]>("sessions.json", []),
      profiles: readJsonFile<UserProfileEntity[]>("profiles.json", []),
      education: readJsonFile<EducationRecord[]>("education.json", []),
      skills: readJsonFile<SkillRecord[]>("skills.json", []),
      projects: readJsonFile<ProjectRecord[]>("projects.json", []),
      experience: readJsonFile<ExperienceRecord[]>("experience.json", []),
      certifications: readJsonFile<CertificationRecord[]>("certifications.json", []),
      achievements: readJsonFile<AchievementRecord[]>("achievements.json", []),
      resumes: readJsonFile<ResumeRecord[]>("resumes.json", []),
      activities: readJsonFile<ActivityRecord[]>("activities.json", []),
      aiAnalyses: readJsonFile<AiAnalysisRecord[]>("ai_analyses.json", []),
    };

    for (const [, filename] of Object.entries(CACHE_FILES)) {
      fileMtimes[filename] = getFileMtime(filename);
    }

    // Seed demo student if no users exist
    if (cache.users.length === 0) {
      seedDemoUser(cache);
    }

    return cache;
  }

  // If cache is loaded, sync any files changed on disk by another process
  for (const [key, filename] of Object.entries(CACHE_FILES) as [keyof DbCache, string][]) {
    const currentMtime = getFileMtime(filename);
    if (currentMtime !== fileMtimes[filename]) {
      (cache as unknown as Record<string, unknown>)[key] = readJsonFile(filename, []);
      fileMtimes[filename] = currentMtime;
    }
  }

  return cache;
}

function persistCache<K extends keyof DbCache>(key: K): void {
  const current = loadCache();
  writeJsonFile(`${String(key)}.json`, current[key]);
}

// Dynamic Profile Completeness calculation
export function calculateProfileCompleteness(
  profile: UserProfileEntity,
  education: EducationRecord[],
  skills: SkillRecord[],
  projects: ProjectRecord[],
  experience: ExperienceRecord[],
  certifications: CertificationRecord[],
  achievements: AchievementRecord[],
  resumes: ResumeRecord[]
): ProfileCompleteness {
  const hasBasicInfo = !!(
    profile.personal.fullName &&
    profile.personal.email &&
    profile.personal.bio
  );
  const hasEducation = education.length > 0;
  const hasSkills = skills.length >= 3;
  const hasProjects = projects.length > 0;
  const hasExperience = experience.length > 0;
  const hasCertifications = certifications.length > 0;
  const hasAchievements = achievements.length > 0;
  const hasResume = resumes.length > 0;
  const hasGithub = !!(profile.lastGithubAnalysis || profile.personal.bio?.includes("github"));
  const hasCareerPreferences = !!(
    profile.careerPreferences.targetRoles.length > 0 &&
    profile.careerPreferences.preferredIndustry
  );

  const sections: { name: string; key: keyof ProfileCompleteness["details"]; complete: boolean; weight: number }[] = [
    { name: "Basic Information", key: "basicInfo", complete: hasBasicInfo, weight: 15 },
    { name: "Education", key: "education", complete: hasEducation, weight: 15 },
    { name: "Skills", key: "skills", complete: hasSkills, weight: 20 },
    { name: "Projects", key: "projects", complete: hasProjects, weight: 15 },
    { name: "Resume", key: "resume", complete: hasResume, weight: 15 },
    { name: "Career Preferences", key: "careerPreferences", complete: hasCareerPreferences, weight: 10 },
    { name: "Experience", key: "experience", complete: hasExperience, weight: 5 },
    { name: "Certifications", key: "certifications", complete: hasCertifications, weight: 5 },
  ];

  let totalScore = 0;
  const completedSections: string[] = [];
  const incompleteSections: string[] = [];

  for (const s of sections) {
    if (s.complete) {
      totalScore += s.weight;
      completedSections.push(s.name);
    } else {
      incompleteSections.push(s.name);
    }
  }

  // Bonus points for achievements or github (capped at 100%)
  if (hasAchievements) totalScore = Math.min(100, totalScore + 3);
  if (hasGithub) totalScore = Math.min(100, totalScore + 2);

  return {
    overallPercentage: Math.min(100, Math.round(totalScore)),
    completedSections,
    incompleteSections,
    details: {
      basicInfo: hasBasicInfo,
      education: hasEducation,
      skills: hasSkills,
      projects: hasProjects,
      experience: hasExperience,
      certifications: hasCertifications,
      achievements: hasAchievements,
      resume: hasResume,
      github: hasGithub,
      careerPreferences: hasCareerPreferences,
    },
  };
}

// Seed initial demo data for smooth first experience
function seedDemoUser(c: DbCache) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync("demo123", salt, 64).toString("hex");
  const demoUserId = "user_demo_student_01";
  const now = new Date().toISOString();

  const demoUser: User = {
    id: demoUserId,
    email: "demo@careerpilot.ai",
    name: "Alex Rivera",
    passwordHash,
    salt,
    createdAt: now,
    updatedAt: now,
  };

  const demoProfile: UserProfileEntity = {
    userId: demoUserId,
    personal: {
      fullName: "Alex Rivera",
      email: "demo@careerpilot.ai",
      phone: "+1 (555) 019-2834",
      location: "San Francisco, CA",
      bio: "Aspiring AI/ML Engineer with a strong background in Python, PyTorch, and full-stack web applications. Passionate about LLMs and production ML systems.",
      avatarUrl: "",
    },
    careerPreferences: {
      targetRoles: ["AI/ML Engineer", "Software Developer"],
      preferredIndustry: "Technology / AI",
      preferredWorkType: "hybrid",
      preferredLocation: "San Francisco, CA / Remote",
      careerInterests: ["Machine Learning", "Large Language Models", "System Design"],
    },
    createdDate: now,
    lastProfileUpdate: now,
    lastAiAnalysisDate: now,
    lastResumeUpdate: now,
    lastGithubAnalysis: null,
    isAiAnalysisStale: false,
  };

  c.users.push(demoUser);
  c.profiles.push(demoProfile);

  c.education.push({
    id: "edu_1",
    userId: demoUserId,
    institution: "University of California, Berkeley",
    degree: "B.S. in Computer Science",
    fieldOfStudy: "Computer Science & Engineering",
    startYear: 2021,
    endYear: 2025,
    grade: "3.85 / 4.0 GPA",
    coursework: ["Data Structures & Algorithms", "Artificial Intelligence", "Operating Systems", "Database Systems"],
    createdAt: now,
    updatedAt: now,
  });

  const demoSkills: SkillRecord[] = [
    { id: "sk_1", userId: demoUserId, name: "Python", category: "Programming", proficiency: "advanced", experienceYears: 3, source: "manual", lastUpdated: now, createdAt: now },
    { id: "sk_2", userId: demoUserId, name: "Machine Learning", category: "AI/ML", proficiency: "intermediate", experienceYears: 2, source: "manual", lastUpdated: now, createdAt: now },
    { id: "sk_3", userId: demoUserId, name: "TensorFlow", category: "AI/ML", proficiency: "intermediate", experienceYears: 1.5, source: "manual", lastUpdated: now, createdAt: now },
    { id: "sk_4", userId: demoUserId, name: "React", category: "Web Development", proficiency: "intermediate", experienceYears: 2, source: "manual", lastUpdated: now, createdAt: now },
    { id: "sk_5", userId: demoUserId, name: "TypeScript", category: "Web Development", proficiency: "intermediate", experienceYears: 1.5, source: "manual", lastUpdated: now, createdAt: now },
    { id: "sk_6", userId: demoUserId, name: "SQL", category: "Database", proficiency: "intermediate", experienceYears: 2, source: "manual", lastUpdated: now, createdAt: now },
  ];
  c.skills.push(...demoSkills);

  c.projects.push({
    id: "proj_1",
    userId: demoUserId,
    name: "CareerPilot-AI",
    description: "AI-powered career copilot with continuous profile analysis, resume parsing, and personalized learning roadmaps.",
    technologies: ["Next.js", "React", "TypeScript", "Gemini AI", "Tailwind CSS"],
    role: "Full-Stack Developer",
    githubUrl: "https://github.com/alexrivera/careerpilot-ai",
    liveUrl: "https://careerpilot.ai",
    startDate: "2024-01-15",
    endDate: "2024-05-20",
    status: "completed",
    skills: ["React", "TypeScript", "Next.js", "AI/ML"],
    createdAt: now,
    updatedAt: now,
  });

  c.experience.push({
    id: "exp_1",
    userId: demoUserId,
    type: "internship",
    organization: "NexGen Analytics",
    position: "Machine Learning Intern",
    description: "Developed text categorization pipeline using transformer models; improved inference throughput by 35%.",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    isCurrent: false,
    technologies: ["Python", "PyTorch", "HuggingFace", "FastAPI"],
    achievements: ["Reduced latency by 35%", "Presented findings to VP of Engineering"],
    createdAt: now,
    updatedAt: now,
  });

  c.certifications.push({
    id: "cert_1",
    userId: demoUserId,
    name: "DeepLearning.AI TensorFlow Developer",
    issuingOrganization: "DeepLearning.AI / Coursera",
    issueDate: "2024-03-10",
    credentialId: "DL-TF-94821",
    credentialUrl: "https://coursera.org/verify/DL-TF-94821",
    relatedSkills: ["TensorFlow", "Deep Learning"],
    createdAt: now,
    updatedAt: now,
  });

  c.achievements.push({
    id: "ach_1",
    userId: demoUserId,
    title: "CalHacks 10.0 Finalist",
    description: "Placed top 10 out of 400+ teams by creating an automated multimodal medical diagnosis assistant.",
    date: "2023-11-05",
    issuingOrganization: "CalHacks",
    skills: ["Python", "FastAPI", "Teamwork"],
    tags: ["Hackathon", "AI", "Finalist"],
    createdAt: now,
    updatedAt: now,
  });

  c.activities.push({
    id: "act_1",
    userId: demoUserId,
    title: "Account Created",
    description: "Created CareerPilot profile",
    type: "profile_created",
    timestamp: now,
  });

  persistCache("users");
  persistCache("profiles");
  persistCache("education");
  persistCache("skills");
  persistCache("projects");
  persistCache("experience");
  persistCache("certifications");
  persistCache("achievements");
  persistCache("activities");
}

// Database helper API
export const db = {
  users: {
    findByEmail(email: string): User | undefined {
      const normalized = email.toLowerCase().trim();
      const c = loadCache();
      let u = c.users.find((u) => u.email.toLowerCase() === normalized);
      if (!u) {
        c.users = readJsonFile<User[]>("users.json", []);
        fileMtimes["users.json"] = getFileMtime("users.json");
        u = c.users.find((u) => u.email.toLowerCase() === normalized);
      }
      if (!u) return undefined;
      return {
        ...u,
        googleId: u.googleId ?? null,
        avatar: u.avatar ?? null,
        authProvider: u.authProvider || (u.googleId ? (u.passwordHash ? "google+password" : "google") : "password"),
      };
    },
    findById(id: string): User | undefined {
      const c = loadCache();
      let u = c.users.find((u) => u.id === id);
      if (!u) {
        c.users = readJsonFile<User[]>("users.json", []);
        fileMtimes["users.json"] = getFileMtime("users.json");
        u = c.users.find((u) => u.id === id);
      }
      if (!u) return undefined;
      return {
        ...u,
        googleId: u.googleId ?? null,
        avatar: u.avatar ?? null,
        authProvider: u.authProvider || (u.googleId ? (u.passwordHash ? "google+password" : "google") : "password"),
      };
    },
    findByGoogleId(googleId: string): User | undefined {
      if (!googleId) return undefined;
      const c = loadCache();
      let u = c.users.find((u) => u.googleId === googleId);
      if (!u) {
        c.users = readJsonFile<User[]>("users.json", []);
        fileMtimes["users.json"] = getFileMtime("users.json");
        u = c.users.find((u) => u.googleId === googleId);
      }
      if (!u) return undefined;
      return {
        ...u,
        googleId: u.googleId ?? null,
        avatar: u.avatar ?? null,
        authProvider: u.authProvider || (u.googleId ? (u.passwordHash ? "google+password" : "google") : "password"),
      };
    },
    create(user: Partial<User> & { email: string; name: string }): User {
      const c = loadCache();
      const now = new Date().toISOString();
      const authProvider =
        user.authProvider ||
        (user.googleId ? (user.passwordHash ? "google+password" : "google") : "password");
      const record: User = {
        id: user.id || `user_${crypto.randomBytes(8).toString("hex")}`,
        email: user.email.toLowerCase().trim(),
        name: user.name.trim(),
        passwordHash: user.passwordHash || "",
        salt: user.salt || "",
        googleId: user.googleId || null,
        avatar: user.avatar || null,
        authProvider,
        createdAt: user.createdAt || now,
        updatedAt: user.updatedAt || now,
      };
      c.users.push(record);
      persistCache("users");
      return record;
    },
    update(id: string, updates: Partial<User>): User | null {
      const c = loadCache();
      const idx = c.users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      c.users[idx] = { ...c.users[idx], ...updates, updatedAt: new Date().toISOString() };
      persistCache("users");
      return c.users[idx];
    },
  },

  sessions: {
    create(userId: string, token: string, expiresAt: string): Session {
      const c = loadCache();
      const session: Session = {
        id: `sess_${crypto.randomBytes(8).toString("hex")}`,
        userId,
        token,
        expiresAt,
        createdAt: new Date().toISOString(),
      };
      c.sessions.push(session);
      persistCache("sessions");
      return session;
    },
    findByToken(token: string): Session | undefined {
      const c = loadCache();
      const now = new Date().toISOString();
      let s = c.sessions.find((s) => s.token === token && s.expiresAt > now);
      if (!s) {
        c.sessions = readJsonFile<Session[]>("sessions.json", []);
        fileMtimes["sessions.json"] = getFileMtime("sessions.json");
        s = c.sessions.find((s) => s.token === token && s.expiresAt > now);
      }
      return s;
    },
    deleteByToken(token: string): void {
      const c = loadCache();
      c.sessions = c.sessions.filter((s) => s.token !== token);
      persistCache("sessions");
    },
    deleteExpired(): void {
      const c = loadCache();
      const now = new Date().toISOString();
      c.sessions = c.sessions.filter((s) => s.expiresAt > now);
      persistCache("sessions");
    },
  },

  profiles: {
    findByUserId(userId: string): UserProfileEntity | undefined {
      const c = loadCache();
      let p = c.profiles.find((p) => p.userId === userId);
      if (!p) {
        c.profiles = readJsonFile<UserProfileEntity[]>("profiles.json", []);
        fileMtimes["profiles.json"] = getFileMtime("profiles.json");
        p = c.profiles.find((p) => p.userId === userId);
      }
      return p;
    },
    create(profile: UserProfileEntity): UserProfileEntity {
      const c = loadCache();
      c.profiles.push(profile);
      persistCache("profiles");
      return profile;
    },
    update(userId: string, updates: Partial<UserProfileEntity>): UserProfileEntity | null {
      const c = loadCache();
      const idx = c.profiles.findIndex((p) => p.userId === userId);
      if (idx === -1) return null;
      c.profiles[idx] = {
        ...c.profiles[idx],
        ...updates,
        lastProfileUpdate: new Date().toISOString(),
      };
      persistCache("profiles");
      return c.profiles[idx];
    },
    markAiStale(userId: string): void {
      const c = loadCache();
      const profile = c.profiles.find((p) => p.userId === userId);
      if (profile) {
        profile.isAiAnalysisStale = true;
        profile.lastProfileUpdate = new Date().toISOString();
        persistCache("profiles");
      }
    },
    markAiAnalyzed(userId: string): void {
      const c = loadCache();
      const profile = c.profiles.find((p) => p.userId === userId);
      if (profile) {
        profile.isAiAnalysisStale = false;
        profile.lastAiAnalysisDate = new Date().toISOString();
        persistCache("profiles");
      }
    },
  },

  education: {
    findByUserId(userId: string): EducationRecord[] {
      const c = loadCache();
      return c.education.filter((e) => e.userId === userId);
    },
    create(edu: Omit<EducationRecord, "id" | "createdAt" | "updatedAt">): EducationRecord {
      const c = loadCache();
      const record: EducationRecord = {
        ...edu,
        id: `edu_${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      c.education.push(record);
      persistCache("education");
      db.profiles.markAiStale(edu.userId);
      return record;
    },
    update(id: string, userId: string, updates: Partial<EducationRecord>): EducationRecord | null {
      const c = loadCache();
      const idx = c.education.findIndex((e) => e.id === id && e.userId === userId);
      if (idx === -1) return null;
      c.education[idx] = { ...c.education[idx], ...updates, updatedAt: new Date().toISOString() };
      persistCache("education");
      db.profiles.markAiStale(userId);
      return c.education[idx];
    },
    delete(id: string, userId: string): boolean {
      const c = loadCache();
      const initialLen = c.education.length;
      c.education = c.education.filter((e) => !(e.id === id && e.userId === userId));
      if (c.education.length !== initialLen) {
        persistCache("education");
        db.profiles.markAiStale(userId);
        return true;
      }
      return false;
    },
  },

  skills: {
    findByUserId(userId: string): SkillRecord[] {
      const c = loadCache();
      return c.skills.filter((s) => s.userId === userId);
    },
    create(skill: Omit<SkillRecord, "id" | "createdAt" | "lastUpdated">): { skill: SkillRecord; isDuplicate: boolean } {
      const c = loadCache();
      const existing = c.skills.find(
        (s) => s.userId === skill.userId && s.name.toLowerCase() === skill.name.toLowerCase().trim()
      );
      if (existing) {
        return { skill: existing, isDuplicate: true };
      }
      const record: SkillRecord = {
        ...skill,
        name: skill.name.trim(),
        id: `sk_${crypto.randomBytes(6).toString("hex")}`,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      c.skills.push(record);
      persistCache("skills");
      db.profiles.markAiStale(skill.userId);
      return { skill: record, isDuplicate: false };
    },
    update(id: string, userId: string, updates: Partial<SkillRecord>): SkillRecord | null {
      const c = loadCache();
      const idx = c.skills.findIndex((s) => s.id === id && s.userId === userId);
      if (idx === -1) return null;
      c.skills[idx] = { ...c.skills[idx], ...updates, lastUpdated: new Date().toISOString() };
      persistCache("skills");
      db.profiles.markAiStale(userId);
      return c.skills[idx];
    },
    delete(id: string, userId: string): boolean {
      const c = loadCache();
      const initialLen = c.skills.length;
      c.skills = c.skills.filter((s) => !(s.id === id && s.userId === userId));
      if (c.skills.length !== initialLen) {
        persistCache("skills");
        db.profiles.markAiStale(userId);
        return true;
      }
      return false;
    },
  },

  projects: {
    findByUserId(userId: string): ProjectRecord[] {
      const c = loadCache();
      return c.projects.filter((p) => p.userId === userId);
    },
    create(proj: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">): ProjectRecord {
      const c = loadCache();
      const record: ProjectRecord = {
        ...proj,
        id: `proj_${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      c.projects.push(record);
      persistCache("projects");
      db.profiles.markAiStale(proj.userId);
      return record;
    },
    update(id: string, userId: string, updates: Partial<ProjectRecord>): ProjectRecord | null {
      const c = loadCache();
      const idx = c.projects.findIndex((p) => p.id === id && p.userId === userId);
      if (idx === -1) return null;
      c.projects[idx] = { ...c.projects[idx], ...updates, updatedAt: new Date().toISOString() };
      persistCache("projects");
      db.profiles.markAiStale(userId);
      return c.projects[idx];
    },
    delete(id: string, userId: string): boolean {
      const c = loadCache();
      const initialLen = c.projects.length;
      c.projects = c.projects.filter((p) => !(p.id === id && p.userId === userId));
      if (c.projects.length !== initialLen) {
        persistCache("projects");
        db.profiles.markAiStale(userId);
        return true;
      }
      return false;
    },
  },

  experience: {
    findByUserId(userId: string): ExperienceRecord[] {
      const c = loadCache();
      return c.experience.filter((e) => e.userId === userId);
    },
    create(exp: Omit<ExperienceRecord, "id" | "createdAt" | "updatedAt">): ExperienceRecord {
      const c = loadCache();
      const record: ExperienceRecord = {
        ...exp,
        id: `exp_${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      c.experience.push(record);
      persistCache("experience");
      db.profiles.markAiStale(exp.userId);
      return record;
    },
    update(id: string, userId: string, updates: Partial<ExperienceRecord>): ExperienceRecord | null {
      const c = loadCache();
      const idx = c.experience.findIndex((e) => e.id === id && e.userId === userId);
      if (idx === -1) return null;
      c.experience[idx] = { ...c.experience[idx], ...updates, updatedAt: new Date().toISOString() };
      persistCache("experience");
      db.profiles.markAiStale(userId);
      return c.experience[idx];
    },
    delete(id: string, userId: string): boolean {
      const c = loadCache();
      const initialLen = c.experience.length;
      c.experience = c.experience.filter((e) => !(e.id === id && e.userId === userId));
      if (c.experience.length !== initialLen) {
        persistCache("experience");
        db.profiles.markAiStale(userId);
        return true;
      }
      return false;
    },
  },

  certifications: {
    findByUserId(userId: string): CertificationRecord[] {
      const c = loadCache();
      return c.certifications.filter((cert) => cert.userId === userId);
    },
    create(cert: Omit<CertificationRecord, "id" | "createdAt" | "updatedAt">): CertificationRecord {
      const c = loadCache();
      const record: CertificationRecord = {
        ...cert,
        id: `cert_${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      c.certifications.push(record);
      persistCache("certifications");

      // Automatically add related skills to the user's skill profile if not present
      if (cert.relatedSkills && cert.relatedSkills.length > 0) {
        for (const skillName of cert.relatedSkills) {
          const trimmed = skillName.trim();
          if (trimmed) {
            db.skills.create({
              userId: cert.userId,
              name: trimmed,
              category: "Certifications",
              proficiency: "intermediate",
              source: "certification",
            });
          }
        }
      }

      db.profiles.markAiStale(cert.userId);
      return record;
    },
    update(id: string, userId: string, updates: Partial<CertificationRecord>): CertificationRecord | null {
      const c = loadCache();
      const idx = c.certifications.findIndex((cert) => cert.id === id && cert.userId === userId);
      if (idx === -1) return null;
      c.certifications[idx] = { ...c.certifications[idx], ...updates, updatedAt: new Date().toISOString() };
      persistCache("certifications");
      db.profiles.markAiStale(userId);
      return c.certifications[idx];
    },
    delete(id: string, userId: string): boolean {
      const c = loadCache();
      const initialLen = c.certifications.length;
      c.certifications = c.certifications.filter((cert) => !(cert.id === id && cert.userId === userId));
      if (c.certifications.length !== initialLen) {
        persistCache("certifications");
        db.profiles.markAiStale(userId);
        return true;
      }
      return false;
    },
  },

  achievements: {
    findByUserId(userId: string): AchievementRecord[] {
      const c = loadCache();
      return c.achievements
        .filter((a) => a.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    create(ach: Omit<AchievementRecord, "id" | "createdAt" | "updatedAt">): AchievementRecord {
      const c = loadCache();
      const record: AchievementRecord = {
        ...ach,
        id: `ach_${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      c.achievements.push(record);
      persistCache("achievements");
      db.profiles.markAiStale(ach.userId);
      return record;
    },
    update(id: string, userId: string, updates: Partial<AchievementRecord>): AchievementRecord | null {
      const c = loadCache();
      const idx = c.achievements.findIndex((a) => a.id === id && a.userId === userId);
      if (idx === -1) return null;
      c.achievements[idx] = { ...c.achievements[idx], ...updates, updatedAt: new Date().toISOString() };
      persistCache("achievements");
      db.profiles.markAiStale(userId);
      return c.achievements[idx];
    },
    delete(id: string, userId: string): boolean {
      const c = loadCache();
      const initialLen = c.achievements.length;
      c.achievements = c.achievements.filter((a) => !(a.id === id && a.userId === userId));
      if (c.achievements.length !== initialLen) {
        persistCache("achievements");
        db.profiles.markAiStale(userId);
        return true;
      }
      return false;
    },
  },

  resumes: {
    findByUserId(userId: string): ResumeRecord[] {
      const c = loadCache();
      return c.resumes
        .filter((r) => r.userId === userId)
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    },
    create(resume: Omit<ResumeRecord, "id" | "createdAt">): ResumeRecord {
      const c = loadCache();
      const record: ResumeRecord = {
        ...resume,
        id: `res_${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
      };
      c.resumes.push(record);
      persistCache("resumes");

      // Update last resume update on profile
      const prof = c.profiles.find((p) => p.userId === resume.userId);
      if (prof) {
        prof.lastResumeUpdate = new Date().toISOString();
        prof.isAiAnalysisStale = true;
        persistCache("profiles");
      }
      return record;
    },
    delete(id: string, userId: string): boolean {
      const c = loadCache();
      const initialLen = c.resumes.length;
      c.resumes = c.resumes.filter((r) => !(r.id === id && r.userId === userId));
      if (c.resumes.length !== initialLen) {
        persistCache("resumes");
        return true;
      }
      return false;
    },
  },

  activities: {
    findByUserId(userId: string, limit = 20): ActivityRecord[] {
      const c = loadCache();
      return c.activities
        .filter((a) => a.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    add(
      userId: string,
      title: string,
      description: string,
      type: ActivityRecord["type"]
    ): ActivityRecord {
      const c = loadCache();
      const record: ActivityRecord = {
        id: `act_${crypto.randomBytes(6).toString("hex")}`,
        userId,
        title,
        description,
        type,
        timestamp: new Date().toISOString(),
      };
      c.activities.push(record);
      persistCache("activities");
      return record;
    },
  },

  aiAnalyses: {
    findByUserId(userId: string): AiAnalysisRecord[] {
      const c = loadCache();
      return c.aiAnalyses
        .filter((a) => a.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    getLatest(userId: string): AiAnalysisRecord | undefined {
      const list = db.aiAnalyses.findByUserId(userId);
      return list[0];
    },
    save(analysis: Omit<AiAnalysisRecord, "id" | "createdAt">): AiAnalysisRecord {
      const c = loadCache();
      const record: AiAnalysisRecord = {
        ...analysis,
        id: `ai_${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
      };
      c.aiAnalyses.push(record);
      persistCache("aiAnalyses");
      db.profiles.markAiAnalyzed(analysis.userId);
      return record;
    },
  },

  // Aggregate getter to fetch everything for an authenticated user
  getFullProfile(userId: string): FullUserProfile | null {
    const user = db.users.findById(userId);
    if (!user) return null;

    let profile = db.profiles.findByUserId(userId);
    if (!profile) {
      // Auto-create default profile if missing
      profile = db.profiles.create({
        userId,
        personal: {
          fullName: user.name,
          email: user.email,
        },
        careerPreferences: {
          targetRoles: ["Software Developer"],
          preferredIndustry: "Technology",
          preferredWorkType: "hybrid",
          preferredLocation: "Flexible",
          careerInterests: [],
        },
        createdDate: user.createdAt,
        lastProfileUpdate: user.createdAt,
        lastAiAnalysisDate: null,
        lastResumeUpdate: null,
        lastGithubAnalysis: null,
        isAiAnalysisStale: false,
      });
    }

    const education = db.education.findByUserId(userId);
    const skills = db.skills.findByUserId(userId);
    const projects = db.projects.findByUserId(userId);
    const experience = db.experience.findByUserId(userId);
    const certifications = db.certifications.findByUserId(userId);
    const achievements = db.achievements.findByUserId(userId);
    const resumes = db.resumes.findByUserId(userId);
    const activities = db.activities.findByUserId(userId, 15);
    const latestAnalysis = db.aiAnalyses.getLatest(userId);

    const completeness = calculateProfileCompleteness(
      profile,
      education,
      skills,
      projects,
      experience,
      certifications,
      achievements,
      resumes
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId ?? null,
        avatar: user.avatar ?? null,
        authProvider:
          user.authProvider ||
          (user.googleId ? (user.passwordHash ? "google+password" : "google") : "password"),
        createdAt: user.createdAt,
      },
      profile,
      education,
      skills,
      projects,
      experience,
      certifications,
      achievements,
      resumes,
      activities,
      latestAnalysis,
      completeness,
    };
  },
};
