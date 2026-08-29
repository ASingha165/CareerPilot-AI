"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Target,
  Map,
  Mic,
  GitBranch,
  BookOpen,
  Sparkles,
  Clock,
  Trophy,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCareerStore } from "@/lib/store/career-store";
import { CAREER_ICONS, READINESS_DIMENSIONS } from "@/lib/constants/careers";
import { cn, getReadinessColor, formatDate } from "@/lib/utils";

function ReadinessRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke={score >= 85 ? "#34d399" : score >= 70 ? "#60a5fa" : score >= 55 ? "#fbbf24" : score >= 40 ? "#fb923c" : "#f87171"}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function EmptyStateCard({
  icon,
  title,
  description,
  action,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
}) {
  return (
    <div className="text-center py-6">
      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      <Link href={href}>
        <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
          {action}
        </Button>
      </Link>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    onboardingComplete,
    resumeAnalysis,
    recommendations,
    readinessScore,
    setReadinessScore,
    roadmap,
    interviewSessions,
    selectedCareer,
    githubAnalysis,
  } = useCareerStore();

  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  useEffect(() => {
    if (!onboardingComplete) {
      router.push("/onboarding");
    }
  }, [onboardingComplete, router]);

  if (!onboardingComplete || !profile) {
    return null;
  }

  const calculateScore = async () => {
    setIsCalculatingScore(true);
    setScoreError(null);
    try {
      const profileSummary = JSON.stringify({
        name: profile.name,
        degree: `${profile.degree} in ${profile.branch}`,
        skills: profile.currentSkills,
        goals: profile.careerGoals,
        experienceLevel: profile.experienceLevel,
      });
      const resumeSummary = resumeAnalysis
        ? JSON.stringify({
            skills: resumeAnalysis.extractedSkills,
            strengths: resumeAnalysis.strengths,
            weaknesses: resumeAnalysis.weaknesses,
            certifications: resumeAnalysis.certifications,
          })
        : "";
      const interviewSummary =
        interviewSessions.length > 0
          ? `${interviewSessions.length} sessions completed. Average score: ${Math.round(
              interviewSessions
                .filter((s) => s.result)
                .reduce((sum, s) => sum + (s.result?.overallScore || 0), 0) /
                Math.max(1, interviewSessions.filter((s) => s.result).length)
            )}`
          : "";
      const githubSummary = githubAnalysis
        ? `${githubAnalysis.publicRepos} repos, activity: ${githubAnalysis.activityLevel}, tech: ${githubAnalysis.techStack.join(", ")}`
        : "";

      const res = await fetch("/api/readiness-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileSummary,
          resumeAnalysis: resumeSummary,
          interviewHistory: interviewSummary,
          githubSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate score");
      setReadinessScore(data.score);
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : "Failed to calculate score");
    } finally {
      setIsCalculatingScore(false);
    }
  };

  const topRecommendation = recommendations[0] || null;
  const recentSessions = interviewSessions.slice(0, 3);
  const avgInterviewScore =
    recentSessions.filter((s) => s.result).length > 0
      ? Math.round(
          recentSessions
            .filter((s) => s.result)
            .reduce((sum, s) => sum + (s.result?.overallScore || 0), 0) /
            recentSessions.filter((s) => s.result).length
        )
      : null;

  const completedStages = roadmap?.stages?.filter((s) => s.completed).length || 0;
  const totalStages = roadmap?.stages?.length || 0;

  // Build next steps
  const nextSteps: { label: string; href: string; icon: string }[] = [];
  if (!resumeAnalysis) nextSteps.push({ label: "Upload and analyze your resume", href: "/resume", icon: "📄" });
  if (recommendations.length === 0) nextSteps.push({ label: "Get career path recommendations", href: "/career", icon: "🎯" });
  if (!roadmap) nextSteps.push({ label: "Build your skill gap roadmap", href: "/roadmap", icon: "🗺️" });
  if (interviewSessions.length === 0) nextSteps.push({ label: "Practice your first mock interview", href: "/interview", icon: "🎤" });
  if (!githubAnalysis) nextSteps.push({ label: "Connect GitHub to enrich your profile", href: "/github", icon: "🐙" });

  return (
    <AppShell>
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm">{getGreeting()}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
          {profile.name} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {profile.degree} in {profile.branch} · {profile.graduationYear}
        </p>
      </div>

      {/* Top row — Readiness + Career + Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Readiness Score */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Career Readiness
            </div>
            {readinessScore && (
              <button
                onClick={calculateScore}
                disabled={isCalculatingScore}
                className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                title="Recalculate score"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isCalculatingScore && "animate-spin")} />
              </button>
            )}
          </div>
          {isCalculatingScore ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs text-slate-500">Calculating score…</p>
            </div>
          ) : readinessScore ? (
            <>
              <ReadinessRing score={readinessScore.overall} />
              <div className="text-center mt-3">
                <p className={cn("font-bold", getReadinessColor(readinessScore.overall))}>
                  {readinessScore.label}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3">{readinessScore.explanation}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 gap-3">
              <TrendingUp className="w-8 h-8 text-slate-600" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">No score yet</p>
                <p className="text-xs text-slate-500 mb-3">Get your AI-powered career readiness assessment</p>
              </div>
              {scoreError && <p className="text-xs text-red-400 text-center">{scoreError}</p>}
              <Button size="sm" onClick={calculateScore} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Calculate Score
              </Button>
            </div>
          )}
        </Card>

        {/* Top Career Match */}
        <Card>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Top Career Match
          </div>
          {topRecommendation ? (
            <>
              <div className="text-4xl mb-3">{CAREER_ICONS[topRecommendation.role] || "💼"}</div>
              <h3 className="font-bold text-white text-lg">{topRecommendation.role}</h3>
              <div className="flex items-center gap-2 mt-2 mb-3">
                <div className="text-2xl font-extrabold text-emerald-400">
                  {topRecommendation.matchPercentage}%
                </div>
                <span className="text-slate-500 text-sm">match</span>
              </div>
              <ProgressBar value={topRecommendation.matchPercentage} size="sm" />
              <p className="text-xs text-slate-500 mt-3 line-clamp-2">{topRecommendation.whyItFits}</p>
              <Link href="/career" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                See all paths <ArrowRight className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <EmptyStateCard
              icon={<Target className="w-6 h-6" />}
              title="No career match"
              description="Get AI-powered career recommendations"
              action="Explore Paths"
              href="/career"
            />
          )}
        </Card>

        {/* Roadmap Progress */}
        <Card>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Learning Roadmap
          </div>
          {roadmap ? (
            <>
              <div className="text-sm font-semibold text-white mb-1">{roadmap.targetRole}</div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-extrabold text-blue-400">{completedStages}</span>
                <span className="text-slate-500 text-sm">/ {totalStages} stages</span>
              </div>
              <ProgressBar
                value={completedStages}
                max={totalStages}
                size="md"
                color="bg-blue-500"
                className="mb-3"
              />
              <div className="text-xs text-slate-500">
                ~{roadmap.totalEstimatedWeeks} weeks total · {roadmap.currentSkills?.filter((s) => s.priority === "critical").length} critical gaps
              </div>
              <Link href="/roadmap" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                View full roadmap <ArrowRight className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <EmptyStateCard
              icon={<Map className="w-6 h-6" />}
              title="No roadmap yet"
              description="Build your personalized learning path"
              action="Create Roadmap"
              href="/roadmap"
            />
          )}
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Skill Gaps */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Skill Gap Summary
            </div>
            <Link href="/roadmap" className="text-xs text-blue-400 hover:text-blue-300">
              Full Roadmap →
            </Link>
          </div>
          {roadmap?.currentSkills?.length ? (
            <div className="space-y-3">
              {roadmap.currentSkills.slice(0, 5).map((gap) => (
                <div key={gap.skill} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-28 shrink-0 truncate">{gap.skill}</span>
                  <div className="flex-1">
                    <ProgressBar value={gap.currentLevel} size="sm" />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right shrink-0">
                    {gap.currentLevel}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Skill analysis pending"
              description="Upload resume or generate roadmap"
              action="Get Analysis"
              href="/resume"
            />
          )}
        </Card>

        {/* Readiness breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Readiness Breakdown
            </div>
          </div>
          {readinessScore ? (
            <div className="space-y-2.5">
              {READINESS_DIMENSIONS.map((dim) => {
                const val = readinessScore.breakdown[dim.key as keyof typeof readinessScore.breakdown];
                return (
                  <div key={dim.key} className="flex items-center gap-3">
                    <span className="text-sm shrink-0">{dim.icon}</span>
                    <span className="text-sm text-slate-400 flex-1 min-w-0 truncate">{dim.label}</span>
                    <div className="w-24 shrink-0">
                      <ProgressBar value={val} size="sm" />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right shrink-0">{val}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm mb-3">Complete your profile to see your readiness breakdown</p>
              <Link href="/resume">
                <Button size="sm" variant="outline">Get Started →</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Interview performance */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Interview Performance
            </div>
            <Link href="/interview" className="text-xs text-blue-400 hover:text-blue-300">
              Practice →
            </Link>
          </div>
          {recentSessions.length > 0 ? (
            <>
              {avgInterviewScore !== null && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-xl">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-lg font-bold text-white">{avgInterviewScore}/100</div>
                    <div className="text-xs text-slate-500">Average score</div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-700/40 last:border-0">
                    <div>
                      <span className="text-white font-medium">{s.role}</span>
                      <span className="text-slate-500 ml-2 text-xs">{s.type}</span>
                    </div>
                    {s.result ? (
                      <Badge variant={s.result.overallScore >= 70 ? "emerald" : "yellow"}>
                        {s.result.overallScore}
                      </Badge>
                    ) : (
                      <Badge variant="slate">Pending</Badge>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyStateCard
              icon={<Mic className="w-6 h-6" />}
              title="No interviews yet"
              description="Practice with AI-generated questions"
              action="Start Practice"
              href="/interview"
            />
          )}
        </Card>

        {/* Next steps */}
        <Card>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Your Next Steps
          </div>
          {nextSteps.length > 0 ? (
            <div className="space-y-2">
              {nextSteps.slice(0, 5).map((step, i) => (
                <Link
                  key={i}
                  href={step.href}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/40 rounded-xl transition-all group"
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-sm text-slate-300 group-hover:text-white flex-1 transition-colors">
                    {step.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-white font-semibold mb-1">Great progress!</p>
              <p className="text-slate-500 text-sm">You&apos;ve completed all key steps.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick access row */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick Access
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Resume", icon: FileText, href: "/resume", color: "text-blue-400" },
            { label: "Careers", icon: Target, href: "/career", color: "text-purple-400" },
            { label: "Roadmap", icon: Map, href: "/roadmap", color: "text-emerald-400" },
            { label: "Interview", icon: Mic, href: "/interview", color: "text-pink-400" },
            { label: "GitHub", icon: GitBranch, href: "/github", color: "text-orange-400" },
            { label: "SkillsBuild", icon: BookOpen, href: "/skillsbuild", color: "text-cyan-400" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-2 p-4 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/40 rounded-xl transition-all hover:border-slate-600 group"
              >
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", item.color)} />
                <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
