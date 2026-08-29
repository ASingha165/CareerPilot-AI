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
} from "@/lib/types";

const initialState: AppState = {
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

export const useCareerStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,

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
      // Only persist essential data, not transient loading states
      partialize: (state) => ({
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
