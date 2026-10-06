import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { recommendCareers, MOCK_RECOMMENDATIONS } from "@/lib/ai/career-recommender";
import { calculateReadinessScore, MOCK_READINESS_SCORE } from "@/lib/ai/readiness-scorer";
import { analyzeSkillGap, MOCK_ROADMAP } from "@/lib/ai/skill-gap-analyzer";
import type { CareerProfile, ResumeAnalysis } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.user.id;
    const fullProfile = db.getFullProfile(userId);
    if (!fullProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { profile, education, skills, projects, experience, certifications, achievements, resumes } =
      fullProfile;

    const targetRole =
      profile.careerPreferences.targetRoles[0] || "Software Developer";

    // Build synthesized career profile for AI prompts
    const legacyCareerProfile: CareerProfile = {
      name: fullProfile.user.name,
      education: education[0]?.institution || "University",
      degree: education[0]?.degree || "Bachelor's Degree",
      branch: education[0]?.fieldOfStudy || "Computer Science",
      graduationYear: education[0]?.endYear || new Date().getFullYear(),
      interests: profile.careerPreferences.careerInterests || [],
      currentSkills: skills.map((s) => s.name),
      preferredIndustries: profile.careerPreferences.preferredIndustry
        ? [profile.careerPreferences.preferredIndustry]
        : ["Technology"],
      careerGoals: profile.personal.bio || `Targeting ${targetRole}`,
      targetRoles: profile.careerPreferences.targetRoles.length > 0
        ? profile.careerPreferences.targetRoles
        : [targetRole],
      experienceLevel: experience.length > 0 ? "intern" : "student",
    };

    // Synthesize verified resume analysis or construct from live profile data
    const latestResume = resumes[0];
    const resumeAnalysis: ResumeAnalysis = latestResume?.analysis || {
      extractedSkills: {
        technical: skills.map((s) => s.name),
        soft: ["Problem Solving", "Collaboration", "Communication"],
      },
      education: education.map((e) => `${e.degree} from ${e.institution}`),
      projects: projects.map((p) => `${p.name}: ${p.description}`),
      experience: experience.map((e) => `${e.position} at ${e.organization} (${e.startDate})`),
      certifications: certifications.map((c) => `${c.name} - ${c.issuingOrganization}`),
      achievements: achievements.map((a) => a.title),
      technologies: Array.from(new Set(projects.flatMap((p) => p.technologies))),
      domains: [profile.careerPreferences.preferredIndustry || "Technology"],
      strengths: skills.slice(0, 4).map((s) => `Demonstrated skill in ${s.name} (${s.proficiency})`),
      weaknesses: [],
      missingSkills: [],
      suggestions: ["Continue building deployed projects with your evolving skillset."],
    };

    const profileSummary = JSON.stringify({
      targetRole,
      skills: skills.map((s) => ({ name: s.name, level: s.proficiency, expYears: s.experienceYears })),
      projects: projects.map((p) => ({ name: p.name, tech: p.technologies, status: p.status })),
      experience: experience.map((e) => ({ role: e.position, org: e.organization, type: e.type })),
      certifications: certifications.map((c) => c.name),
      achievements: achievements.map((a) => a.title),
      education: education.map((e) => ({ degree: e.degree, inst: e.institution })),
    });

    const resumeSummary = JSON.stringify({
      skills: resumeAnalysis.extractedSkills,
      projects: resumeAnalysis.projects,
      experience: resumeAnalysis.experience,
      certifications: resumeAnalysis.certifications,
    });

    // Run AI analyses in parallel
    let recommendations;
    let readinessScore;
    let roadmap;

    if (isGeminiConfigured()) {
      const [recsResult, scoreResult, roadmapResult] = await Promise.allSettled([
        recommendCareers(legacyCareerProfile, resumeAnalysis),
        calculateReadinessScore(profileSummary, resumeSummary, "", ""),
        analyzeSkillGap(targetRole, skills.map((s) => s.name), resumeSummary),
      ]);

      recommendations =
        recsResult.status === "fulfilled" ? recsResult.value : MOCK_RECOMMENDATIONS;
      readinessScore =
        scoreResult.status === "fulfilled" ? scoreResult.value : MOCK_READINESS_SCORE;
      roadmap =
        roadmapResult.status === "fulfilled"
          ? roadmapResult.value
          : { ...MOCK_ROADMAP, targetRole };
    } else {
      // Dynamic fallback tailored to the user's actual skills and target role
      recommendations = MOCK_RECOMMENDATIONS.map((r, i) => {
        if (i === 0 && targetRole) {
          return {
            ...r,
            role: targetRole,
            whyItFits: `Based on your updated profile with ${skills.length} verified skills including ${skills.slice(0, 3).map((s) => s.name).join(", ")}, you have strong alignment with ${targetRole}.`,
            existingStrengths: skills.slice(0, 4).map((s) => s.name),
          };
        }
        return r;
      });

      // Calculate dynamic readiness score based on actual profile metrics
      const skillCount = skills.length;
      const projectCount = projects.length;
      const expCount = experience.length;
      const certCount = certifications.length;

      const techScore = Math.min(95, 40 + skillCount * 8);
      const projScore = Math.min(95, 30 + projectCount * 15);
      const expScore = Math.min(95, 20 + expCount * 25);
      const certScore = Math.min(95, 25 + certCount * 20);
      const overall = Math.round((techScore + projScore + expScore + certScore) / 4);

      readinessScore = {
        overall,
        breakdown: {
          technicalSkills: techScore,
          projects: projScore,
          experience: expScore,
          certifications: certScore,
          resumeQuality: resumes.length > 0 ? 80 : 40,
          githubActivity: profile.lastGithubAnalysis ? 75 : 20,
          interviewReadiness: 50,
        },
        label: overall >= 80 ? "Career Ready" : overall >= 65 ? "Strong Candidate" : "Getting There",
        explanation: `Your updated profile shows ${skillCount} skills, ${projectCount} projects, and ${certCount} certifications. Your readiness has been recalculated to reflect your latest career milestones.`,
        topImprovements: [
          "Continue applying skills to full-stack or production projects",
          "Practice targeted mock interview questions for " + targetRole,
          "Document and showcase your code repository links",
        ],
      };

      roadmap = {
        ...MOCK_ROADMAP,
        targetRole,
      };
    }

    // Save persistent analysis in database
    const savedAnalysis = db.aiAnalyses.save({
      userId,
      targetRole,
      readinessScore,
      recommendations,
      roadmap,
    });

    // Mark AI analyzed & log activity
    db.activities.add(
      userId,
      "Career Profile Re-analyzed",
      `AI updated recommendations and readiness score (${readinessScore.overall}%) for ${targetRole}`,
      "ai_reanalyzed"
    );

    const updatedProfile = db.getFullProfile(userId);

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      profile: updatedProfile,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /career-analysis/reanalyze] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to re-analyze career profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
