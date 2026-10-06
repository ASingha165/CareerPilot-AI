"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppState,
  AppActions,
  CareerProfile,
  ResumeAnalysis,
  CareerRecommendation,
  ReadinessScore,
  SkillGapRoadmap,
  InterviewSession,
  GitHubAnalysis,
  SkillsBuildResource,
  FullUserProfile,
  ActivityRecord,
} from "@/lib/types";

const initialState: AppState = {
  user: null,
  fullProfile: null,
  isAiAnalysisStale: false,
  completeness: null,
  activities: [],
  profile: null,
  onboardingComplete: false,
  resumeText: null,
  resumeAnalysis: null,
  resumeFileName: null,
  recommendations: [],
  selectedCareer: null,
  readinessScore: null,
  roadmap: null,
  interviewSessions: [],
  activeInterviewSession: null,
  githubAnalysis: null,
  skillsBuildResources: [],
  isLoading: false,
  loadingMessage: "",
  error: null,
};

// Helper to convert FullUserProfile to legacy CareerProfile for backward-compatibility
function convertToLegacyProfile(fp: FullUserProfile): CareerProfile {
  const firstEdu = fp.education[0];
  return {
    name: fp.user.name,
    education: firstEdu?.institution || "Student",
    degree: firstEdu?.degree || "Undergraduate",
    branch: firstEdu?.fieldOfStudy || "Computer Science",
    graduationYear: firstEdu?.endYear || new Date().getFullYear(),
    interests: fp.profile.careerPreferences.careerInterests || [],
    currentSkills: fp.skills.map((s) => s.name),
    preferredIndustries: fp.profile.careerPreferences.preferredIndustry
      ? [fp.profile.careerPreferences.preferredIndustry]
      : ["Technology"],
    careerGoals: fp.profile.personal.bio || "Advance tech career",
    targetRoles: fp.profile.careerPreferences.targetRoles || ["Software Developer"],
    experienceLevel: fp.experience.length > 0 ? "intern" : "student",
  };
}

export const useCareerStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setFullProfile: (fullProfile) => {
        if (!fullProfile) {
          set({
            fullProfile: null,
            user: null,
            completeness: null,
            activities: [],
            isAiAnalysisStale: false,
          });
          return;
        }

        const legacyProfile = convertToLegacyProfile(fullProfile);
        const latestAnalysis = fullProfile.latestAnalysis;

        set({
          fullProfile,
          user: fullProfile.user,
          profile: legacyProfile,
          onboardingComplete: true,
          completeness: fullProfile.completeness,
          activities: fullProfile.activities || [],
          isAiAnalysisStale: fullProfile.profile.isAiAnalysisStale,
          selectedCareer:
            fullProfile.profile.careerPreferences.targetRoles[0] ||
            get().selectedCareer ||
            "Software Developer",
          ...(latestAnalysis
            ? {
                recommendations: latestAnalysis.recommendations,
                readinessScore: latestAnalysis.readinessScore,
                roadmap: latestAnalysis.roadmap,
              }
            : {}),
        });
      },

      setIsAiAnalysisStale: (isAiAnalysisStale) =>
        set((state) => ({
          isAiAnalysisStale,
          fullProfile: state.fullProfile
            ? {
                ...state.fullProfile,
                profile: {
                  ...state.fullProfile.profile,
                  isAiAnalysisStale,
                },
              }
            : null,
        })),

      setActivities: (activities: ActivityRecord[]) => set({ activities }),

      refreshFullProfile: async () => {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              get().setFullProfile(data.profile);
            }
          }
        } catch (err) {
          console.error("Failed to refresh profile:", err);
        }
      },

      setProfile: (profile: CareerProfile) =>
        set({ profile }),

      setOnboardingComplete: (val: boolean) =>
        set({ onboardingComplete: val }),

      setResumeAnalysis: (
        analysis: ResumeAnalysis,
        fileName: string,
        rawText: string
      ) =>
        set({
          resumeAnalysis: analysis,
          resumeFileName: fileName,
          resumeText: rawText,
        }),

      setRecommendations: (recs: CareerRecommendation[]) =>
        set({ recommendations: recs }),

      setSelectedCareer: (role: string) =>
        set({ selectedCareer: role }),

      setReadinessScore: (score: ReadinessScore) =>
        set({ readinessScore: score }),

      setRoadmap: (roadmap: SkillGapRoadmap) =>
        set({ roadmap }),

      addInterviewSession: (session: InterviewSession) =>
        set((state) => ({
          interviewSessions: [session, ...state.interviewSessions],
        })),

      updateInterviewSession: (session: InterviewSession) =>
        set((state) => ({
          interviewSessions: state.interviewSessions.map((s) =>
            s.id === session.id ? session : s
          ),
          activeInterviewSession:
            state.activeInterviewSession?.id === session.id
              ? session
              : state.activeInterviewSession,
        })),

      setActiveInterviewSession: (session: InterviewSession | null) =>
        set({ activeInterviewSession: session }),

      setGithubAnalysis: (analysis: GitHubAnalysis | null) =>
        set({ githubAnalysis: analysis }),

      setSkillsBuildResources: (resources: SkillsBuildResource[]) =>
        set({ skillsBuildResources: resources }),

      setLoading: (loading: boolean, message = "") =>
        set({ isLoading: loading, loadingMessage: message }),

      setError: (error: string | null) =>
        set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: "careerpilot-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        onboardingComplete: state.onboardingComplete,
        resumeAnalysis: state.resumeAnalysis,
        resumeFileName: state.resumeFileName,
        recommendations: state.recommendations,
        selectedCareer: state.selectedCareer,
        readinessScore: state.readinessScore,
        roadmap: state.roadmap,
        interviewSessions: state.interviewSessions,
        githubAnalysis: state.githubAnalysis,
        skillsBuildResources: state.skillsBuildResources,
      }),
    }
  )
);
