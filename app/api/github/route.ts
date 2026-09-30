import { NextRequest, NextResponse } from "next/server";
import {
  fetchGitHubProfile,
  fetchGitHubRepos,
  calculateTopLanguages,
} from "@/lib/github/analyzer";
import { isGeminiConfigured, getGeminiModel } from "@/lib/ai/gemini";
import { GITHUB_ANALYSIS_PROMPT } from "@/lib/ai/prompts";
import { safeJsonParse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body as { username: string };

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "");
    if (!sanitizedUsername) {
      return NextResponse.json(
        { error: "Invalid GitHub username" },
        { status: 400 }
      );
    }

    // Step 1: Fetch GitHub profile and repos from GitHub API
    let profile;
    let repos;
    try {
      [profile, repos] = await Promise.all([
        fetchGitHubProfile(sanitizedUsername),
        fetchGitHubRepos(sanitizedUsername),
      ]);
    } catch (githubError) {
      console.error("[API /github] GitHub API error:", githubError);
      const message =
        githubError instanceof Error
          ? githubError.message
          : "Failed to fetch GitHub profile";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        success: true,
        analysis: null,
        isMock: true,
        message: "GitHub analysis requires GEMINI_API_KEY to be configured",
      });
    }

    // Step 2: Use Gemini AI to qualitatively analyze repositories
    const topLanguages = calculateTopLanguages(repos);
    const repoSummary = repos.slice(0, 15).map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stars,
      topics: r.topics,
    }));

    try {
      const model = getGeminiModel();
      const prompt = GITHUB_ANALYSIS_PROMPT(
        sanitizedUsername,
        JSON.stringify(repoSummary, null, 2)
      );
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const aiAnalysis = safeJsonParse<{
        techStack: string[];
        projectTypes: string[];
        activityLevel: "high" | "medium" | "low" | "inactive";
        practicalExperience: string;
        strengths: string[];
        suggestions: string[];
      }>(text);

      const analysis = {
        username: profile.login,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        topLanguages,
        repositories: repos.slice(0, 12),
        techStack: aiAnalysis?.techStack || topLanguages.map((l) => l.language),
        projectTypes: aiAnalysis?.projectTypes || [],
        activityLevel: aiAnalysis?.activityLevel || "low",
        practicalExperience:
          aiAnalysis?.practicalExperience ||
          `${sanitizedUsername} has ${profile.public_repos} public repositories.`,
        strengths: aiAnalysis?.strengths || [],
        suggestions: aiAnalysis?.suggestions || [],
      };

      return NextResponse.json({
        success: true,
        analysis,
        isMock: false,
      });
    } catch (aiError) {
      console.error("[API /github] AI generation error:", aiError);
      return NextResponse.json(
        {
          error:
            "AI generation error: Unable to generate AI insights for this GitHub profile at this time.",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("[API /github] Unexpected Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze GitHub profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
