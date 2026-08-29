import type { GitHubRepo, GitHubAnalysis } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";
import { getGeminiModel } from "@/lib/ai/gemini";
import { GITHUB_ANALYSIS_PROMPT } from "@/lib/ai/prompts";

const GITHUB_API = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function fetchGitHubProfile(username: string): Promise<{
  login: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  name: string | null;
}> {
  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error(`GitHub user "${username}" not found`);
    if (res.status === 403) throw new Error("GitHub API rate limit reached. Add a GITHUB_TOKEN to .env.local");
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=30&type=owner`,
    {
      headers: getHeaders(),
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repositories for ${username}`);
  }

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((repo: any) => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    topics: repo.topics || [],
    url: repo.html_url,
  }));
}

export function calculateTopLanguages(
  repos: GitHubRepo[]
): { language: string; percentage: number }[] {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const repo of repos) {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
      total++;
    }
  }

  if (total === 0) return [];

  return Object.entries(counts)
    .map(([language, count]) => ({
      language,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);
}

export async function analyzeGitHubProfile(
  username: string
): Promise<GitHubAnalysis> {
  const [profile, repos] = await Promise.all([
    fetchGitHubProfile(username),
    fetchGitHubRepos(username),
  ]);

  const topLanguages = calculateTopLanguages(repos);

  // Use Gemini to analyze the repos qualitatively
  const repoSummary = repos.slice(0, 15).map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stars,
    topics: r.topics,
  }));

  const model = getGeminiModel();
  const prompt = GITHUB_ANALYSIS_PROMPT(username, JSON.stringify(repoSummary, null, 2));
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

  return {
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
      `${username} has ${profile.public_repos} public repositories.`,
    strengths: aiAnalysis?.strengths || [],
    suggestions: aiAnalysis?.suggestions || [],
  };
}
