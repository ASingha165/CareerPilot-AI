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
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertTriangle,
  User,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCareerStore } from "@/lib/store/career-store";
import { CAREER_ICONS } from "@/lib/constants/careers";
import { cn, getReadinessColor, formatDate } from "@/lib/utils";

function ReadinessRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={
            score >= 85
              ? "#34d399"
              : score >= 70
              ? "#60a5fa"
              : score >= 55
              ? "#fbbf24"
              : score >= 40
              ? "#fb923c"
              : "#f87171"
          }
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
    fullProfile,
    user,
    onboardingComplete,
    resumeAnalysis,
    recommendations,
    readinessScore,
    setReadinessScore,
    roadmap,
    selectedCareer,
    isAiAnalysisStale,
    setIsAiAnalysisStale,
    setFullProfile,
    refreshFullProfile,
  } = useCareerStore();

  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeStep, setReanalyzeStep] = useState("");

  // Sync profile data on mount
  useEffect(() => {
    refreshFullProfile();
  }, [refreshFullProfile]);

  useEffect(() => {
    if (!onboardingComplete && !fullProfile && !user && !profile) {
      router.push("/login");
    }
  }, [onboardingComplete, fullProfile, user, profile, router]);

  // Derived user details
  const displayName =
    fullProfile?.profile.personal.fullName || user?.name || profile?.name || "Student";
  const displayDegree =
    fullProfile?.education[0]?.degree || profile?.degree || "Student";
  const displayBranch =
    fullProfile?.education[0]?.fieldOfStudy || profile?.branch || "Computer Science";
  const displayYear =
    fullProfile?.education[0]?.endYear || profile?.graduationYear || new Date().getFullYear();

  const targetRole =
    fullProfile?.profile.careerPreferences.targetRoles[0] ||
    selectedCareer ||
    profile?.targetRoles[0] ||
    "Software Developer";

  const topRecommendation = recommendations[0];

  // Recent developments from activity log or profile
  const recentDevelopments =
    fullProfile?.activities?.slice(0, 4) || [
      { id: "1", title: "Profile Initialized", description: "Created CareerPilot career profile", timestamp: new Date().toISOString() },
    ];

  const completeness = fullProfile?.completeness;

  // Handle re-analysis
  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setReanalyzeStep("Reviewing verified profile changes...");
    try {
      setTimeout(() => setReanalyzeStep("Comparing skills with target role..."), 800);
      setTimeout(() => setReanalyzeStep("Generating updated guidance..."), 1600);

      const res = await fetch("/api/career-analysis/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Re-analysis failed");

      if (data.profile) setFullProfile(data.profile);
      setIsAiAnalysisStale(false);
    } catch (err: unknown) {
      console.error("Re-analysis error:", err);
    } finally {
      setIsReanalyzing(false);
      setReanalyzeStep("");
    }
  };

  const calculateScore = async () => {
    setIsCalculatingScore(true);
    try {
      const profileSummary = JSON.stringify({
        name: displayName,
        degree: `${displayDegree} in ${displayBranch}`,
        skills: fullProfile?.skills?.map((s) => s.name) || profile?.currentSkills || [],
        goals: fullProfile?.profile.personal.bio || profile?.careerGoals || "",
      });
      const resumeSummary = resumeAnalysis
        ? JSON.stringify({
            skills: resumeAnalysis.extractedSkills,
            strengths: resumeAnalysis.strengths,
            weaknesses: resumeAnalysis.weaknesses,
          })
        : "";

      const res = await fetch("/api/readiness-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileSummary,
          resumeAnalysis: resumeSummary,
          interviewHistory: "",
          githubSummary: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate readiness score");
      setReadinessScore(data.score);
    } catch (err: unknown) {
      console.error("Score calculation error:", err);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  return (
    <AppShell>
      {/* Welcome header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
            {getGreeting()}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            {displayName} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {displayDegree} in {displayBranch} · Class of {displayYear}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Button variant="outline" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
              Manage Profile
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            leftIcon={
              isReanalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )
            }
          >
            {isReanalyzing ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STALE ANALYSIS ALERT BANNER (Requirements 13 & 14) */}
      {/* ============================================================ */}
      {(isAiAnalysisStale || fullProfile?.profile.isAiAnalysisStale) && (
        <div className="mb-6 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Profile Updated</h4>
              <p className="text-xs text-amber-200/80">
                Your AI career analysis was based on an older profile. Re-analyze to translate your latest skills and projects into updated recommendations.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0"
          >
            {isReanalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Analyzing...
              </>
            ) : (
              "Re-analyze Career Profile"
            )}
          </Button>
        </div>
      )}

      {/* Re-analysis progression banner */}
      {isReanalyzing && (
        <div className="mb-6 p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>{reanalyzeStep || "Re-analyzing your updated career profile..."}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TOP ROW: Profile Completeness + Target Career + Readiness */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Profile Card (Requirement 17) */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Profile Health
              </span>
              <Badge variant="blue" className="text-[10px]">
                Living Profile
              </Badge>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-white">
                {completeness?.overallPercentage || 75}%
              </span>
              <span className="text-xs text-slate-400 font-medium">completeness</span>
            </div>
            <div className="h-2 w-full bg-slate-700/80 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${completeness?.overallPercentage || 75}%` }}
              />
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Verified Skills:</span>
                <strong className="text-white">
                  {fullProfile?.skills.length || profile?.currentSkills.length || 0}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="text-slate-300">
                  {fullProfile?.profile.lastProfileUpdate
                    ? formatDate(fullProfile.profile.lastProfileUpdate)
                    : "Today"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/40">
            <Link
              href="/profile"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-between group"
            >
              <span>Update skills & milestones</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </Card>

        {/* Target Career Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Career
              </span>
              <Badge variant="emerald" className="text-[10px]">
                Primary Goal
              </Badge>
            </div>

            <div className="text-3xl mb-2">{CAREER_ICONS[targetRole] || "💼"}</div>
            <h3 className="text-lg font-bold text-white mb-1">{targetRole}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              {topRecommendation?.whyItFits ||
                `Personalized recommendations are tailored to prepare you for ${targetRole} positions.`}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {topRecommendation?.matchPercentage
                ? `${topRecommendation.matchPercentage}% fit score`
                : "Active focus"}
            </span>
            <Link href="/career" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold">
              Explore paths <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Job Readiness Card */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Job Readiness
            </span>
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
              <p className="text-xs text-slate-500">Recalculating readiness…</p>
            </div>
          ) : readinessScore ? (
            <>
              <ReadinessRing score={readinessScore.overall} />
              <div className="text-center mt-3">
                <p className={cn("font-bold text-sm", getReadinessColor(readinessScore.overall))}>
                  {readinessScore.label}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                  {readinessScore.explanation}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 gap-3">
              <TrendingUp className="w-8 h-8 text-slate-600" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">No readiness score</p>
                <p className="text-xs text-slate-500 mb-3">Evaluate readiness across 7 key dimensions</p>
              </div>
              <Button size="sm" onClick={calculateScore} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Calculate Score
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ============================================================ */}
      {/* SECOND ROW: Skill Gaps + Recent Development */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Skill Gaps Card (Requirement 17) */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Target Skill Gaps</h3>
              <p className="text-xs text-slate-400">Skills needed to qualify for {targetRole}</p>
            </div>
            <Link href="/roadmap" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Roadmap →
            </Link>
          </div>

          {roadmap?.currentSkills?.length ? (
            <div className="space-y-3">
              {roadmap.currentSkills.slice(0, 4).map((gap) => (
                <div key={gap.skill} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 truncate">
                    <span className="text-xs font-semibold text-slate-200">{gap.skill}</span>
                  </div>
                  <div className="flex-1">
                    <ProgressBar value={gap.currentLevel} size="sm" />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right shrink-0">
                    {gap.currentLevel}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {["MLOps & Deployment", "Advanced Cloud Systems", "System Design"].map((sk) => (
                <div key={sk} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40 text-xs">
                  <span className="text-slate-300 font-medium">{sk}</span>
                  <Badge variant="yellow" className="text-[10px]">High Priority</Badge>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
            <span className="text-xs text-slate-500">Recommended Next Step:</span>
            <span className="text-xs text-emerald-400 font-semibold">Complete an MLOps module</span>
          </div>
        </Card>

        {/* Recent Development Card (Requirement 17) */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Profile Development</h3>
              <p className="text-xs text-slate-400">Milestones added to your living career timeline</p>
            </div>
            <Link href="/profile" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              + Add New
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentDevelopments.map((dev) => (
              <div
                key={dev.id}
                className="flex items-start gap-3 p-2.5 bg-slate-800/30 rounded-xl border border-slate-700/40"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white truncate">{dev.title}</h5>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatDate(dev.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{dev.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/40">
            <Link
              href="/profile"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-between"
            >
              <span>View complete career timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* THIRD ROW: Quick Access Shortcuts */}
      {/* ============================================================ */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick Access
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { label: "My Profile", icon: User, href: "/profile", color: "text-blue-400" },
            { label: "Resume", icon: FileText, href: "/resume", color: "text-indigo-400" },
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
                className="flex flex-col items-center gap-2 p-3.5 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/40 rounded-xl transition-all hover:border-slate-600 group"
              >
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", item.color)} />
                <span className="text-xs text-slate-400 group-hover:text-white transition-colors text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
