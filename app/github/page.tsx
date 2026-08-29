"use client";

import { useState } from "react";
import {
  GitBranch,
  ExternalLink,
  Star,
  GitFork,
  Loader2,
  Globe,
  Users,
  BookOpen,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCareerStore } from "@/lib/store/career-store";
import { cn } from "@/lib/utils";

const activityColors = {
  high: "text-emerald-400",
  medium: "text-blue-400",
  low: "text-yellow-400",
  inactive: "text-red-400",
};

export default function GitHubPage() {
  const { githubAnalysis, setGithubAnalysis, setLoading, isLoading } = useCareerStore();
  const [username, setUsername] = useState(githubAnalysis?.username ?? "");
  const [error, setError] = useState<string | null>(null);

  const clearAnalysis = () => {
    // Reset so user can analyze a different profile
    setGithubAnalysis(null);
    setError(null);
    setUsername("");
  };

  const analyzeProfile = async () => {
    if (!username.trim()) return;
    setError(null);
    setLoading(true, "Fetching GitHub profile…");

    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to analyze profile");
      if (data.isMock) {
        setError("GitHub analysis requires GEMINI_API_KEY to be configured. Add it to .env.local");
        return;
      }

      setGithubAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="GitHub Analyzer"
        subtitle="Connect your GitHub profile to enrich your career analysis with real project data."
        badge="🐙 GitHub"
      />

      <Alert variant="info" className="mb-6">
        Only <strong>public</strong> repository data is analyzed. No passwords, tokens, or private repos are ever accessed.
      </Alert>

      {error && (
        <Alert variant="error" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {!githubAnalysis ? (
        <div className="max-w-xl mx-auto">
          <Card>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-orange-400" />
              Enter your GitHub username
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3">
                <span className="text-slate-500 text-sm">github.com/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") analyzeProfile(); }}
                  placeholder="yourusername"
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </div>
              <Button
                onClick={analyzeProfile}
                loading={isLoading}
                disabled={!username.trim()}
              >
                Analyze
              </Button>
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: "🔓", title: "Public Only", desc: "Only public repos are analyzed" },
              { icon: "🤖", title: "AI Insights", desc: "Gemini analyzes your tech stack and project quality" },
              { icon: "📊", title: "Career Impact", desc: "GitHub data improves your readiness score" },
            ].map((t) => (
              <div key={t.title} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{t.title}</div>
                <div className="text-xs text-slate-500">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {/* Profile header */}
          <Card>
            <div className="flex items-start gap-4">
              {githubAnalysis.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={githubAnalysis.avatarUrl}
                  alt={githubAnalysis.username}
                  className="w-16 h-16 rounded-full border-2 border-slate-600"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">@{githubAnalysis.username}</h2>
                {githubAnalysis.bio && (
                  <p className="text-sm text-slate-400 mt-1">{githubAnalysis.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {githubAnalysis.publicRepos} repos
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {githubAnalysis.followers} followers
                  </span>
                  <span className={cn("font-semibold capitalize", activityColors[githubAnalysis.activityLevel])}>
                    ● {githubAnalysis.activityLevel} activity
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAnalysis}
              >
                Re-analyze
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top languages */}
            <Card>
              <h3 className="font-semibold text-white mb-4">Top Languages</h3>
              <div className="space-y-3">
                {githubAnalysis.topLanguages.map((l) => (
                  <ProgressBar
                    key={l.language}
                    value={l.percentage}
                    label={l.language}
                    showValue
                    size="md"
                  />
                ))}
              </div>
            </Card>

            {/* AI insights */}
            <Card>
              <h3 className="font-semibold text-white mb-4">AI Analysis</h3>
              <p className="text-sm text-slate-300 mb-4">{githubAnalysis.practicalExperience}</p>

              <div className="mb-3">
                <div className="text-xs text-emerald-400 font-semibold mb-2">Strengths</div>
                <ul className="space-y-1">
                  {githubAnalysis.strengths.map((s) => (
                    <li key={s} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs text-yellow-400 font-semibold mb-2">Suggestions</div>
                <ul className="space-y-1">
                  {githubAnalysis.suggestions.map((s) => (
                    <li key={s} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-yellow-400">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          {/* Tech stack */}
          <Card>
            <h3 className="font-semibold text-white mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {githubAnalysis.techStack.map((t) => (
                <Badge key={t} variant="blue">{t}</Badge>
              ))}
            </div>
          </Card>

          {/* Repositories */}
          <Card>
            <h3 className="font-semibold text-white mb-4">Repositories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {githubAnalysis.repositories.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                      {repo.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  </div>
                  {repo.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {repo.language}
                      </span>
                    )}
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stars}
                      </span>
                    )}
                    {repo.forks > 0 && (
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" />
                        {repo.forks}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
