"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Sparkles,
  BookOpen,
  Map,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCareerStore } from "@/lib/store/career-store";
import { CAREER_ICONS } from "@/lib/constants/careers";
import { cn, getMatchColor } from "@/lib/utils";
import type { CareerRecommendation } from "@/lib/types";

function CareerCard({
  rec,
  rank,
  isSelected,
  onSelect,
  onViewRoadmap,
}: {
  rec: CareerRecommendation;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  onViewRoadmap: () => void;
}) {
  const [expanded, setExpanded] = useState(rank === 0);
  const icon = CAREER_ICONS[rec.role] || "💼";
  const matchColor = getMatchColor(rec.matchPercentage);

  return (
    <div
      className={cn(
        "border rounded-2xl overflow-hidden transition-all",
        isSelected
          ? "border-blue-500 bg-blue-500/5"
          : "border-slate-700/50 bg-[#1e293b] hover:border-slate-600"
      )}
    >
      {/* Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-white">{rec.role}</h3>
            {rank === 0 && (
              <Badge variant="yellow">
                <Sparkles className="w-3 h-3" /> Top Match
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 line-clamp-2">{rec.whyItFits}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("text-2xl font-extrabold", matchColor)}>
            {rec.matchPercentage}%
          </div>
          <div className="text-xs text-slate-500">match</div>
        </div>
      </div>

      {/* Match bar */}
      <div className="px-5 pb-3">
        <ProgressBar
          value={rec.matchPercentage}
          size="sm"
          color={
            rec.matchPercentage >= 85
              ? "bg-emerald-500"
              : rec.matchPercentage >= 70
              ? "bg-blue-500"
              : "bg-yellow-500"
          }
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-700/40 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                ✅ Your Strengths
              </div>
              <ul className="space-y-1">
                {rec.existingStrengths?.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                🎯 Missing Skills
              </div>
              <ul className="space-y-1">
                {rec.missingSkills?.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              📚 Learning Path
            </div>
            <div className="space-y-1">
              {rec.learningPath?.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-blue-400 font-bold shrink-0 w-4">{i + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
              🛠️ Recommended Projects
            </div>
            <div className="flex flex-wrap gap-2">
              {rec.recommendedProjects?.map((p) => (
                <Badge key={p} variant="purple">{p}</Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant={isSelected ? "secondary" : "primary"}
              size="sm"
              onClick={onSelect}
              leftIcon={isSelected ? <CheckCircle2 className="w-4 h-4" /> : undefined}
            >
              {isSelected ? "Selected Path" : "Select This Path"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewRoadmap}
              rightIcon={<Map className="w-4 h-4" />}
            >
              View Roadmap
            </Button>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-500 hover:text-slate-300 border-t border-slate-700/40 transition-colors"
        >
          Show details <ChevronRight className="w-3 h-3 rotate-90" />
        </button>
      )}
    </div>
  );
}

export default function CareerPage() {
  const router = useRouter();
  const {
    profile,
    resumeAnalysis,
    recommendations,
    selectedCareer,
    setRecommendations,
    setSelectedCareer,
    setLoading,
    isLoading,
    loadingMessage,
  } = useCareerStore();

  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const generateRecommendations = async () => {
    if (!profile) {
      router.push("/onboarding");
      return;
    }

    setError(null);
    setLoading(true, "Generating your personalized career recommendations…");

    try {
      const res = await fetch("/api/career-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          resumeAnalysis: resumeAnalysis || {
            extractedSkills: { technical: profile.currentSkills, soft: [] },
            technologies: profile.currentSkills,
            domains: profile.interests,
            strengths: [],
            weaknesses: [],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get recommendations");

      setRecommendations(data.recommendations);
      setIsMock(data.isMock);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCareer = (role: string) => {
    setSelectedCareer(role);
  };

  return (
    <AppShell>
      <PageHeader
        title="Career Path Recommendations"
        subtitle="AI-matched career paths based on your skills, education, and goals."
        badge="🎯 Career Paths"
        action={
          recommendations.length > 0 && selectedCareer ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/roadmap")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Roadmap
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert variant="error" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {isMock && (
        <Alert variant="warning" className="mb-6">
          Demo mode — showing sample recommendations. Add{" "}
          <code className="text-xs bg-slate-700 px-1 rounded">GEMINI_API_KEY</code> to{" "}
          <code className="text-xs bg-slate-700 px-1 rounded">.env.local</code> for real AI recommendations.
        </Alert>
      )}

      {recommendations.length === 0 ? (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Discover your best career matches
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            CareerPilot will analyze your profile, skills, and interests to recommend
            the careers where you have the highest chance of success — with a full
            explanation of why each one fits.
          </p>

          {!profile && (
            <Alert variant="warning" className="mb-6 text-left">
              Complete your <button onClick={() => router.push("/onboarding")} className="underline">career profile</button> first for personalized recommendations.
            </Alert>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-slate-400 text-sm">{loadingMessage}</p>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={generateRecommendations}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Generate Career Recommendations
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-sm">
              {recommendations.length} career paths analyzed · {selectedCareer ? (
                <span className="text-blue-400 font-medium">Selected: {selectedCareer}</span>
              ) : (
                "Select a path to see your roadmap"
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateRecommendations}
              loading={isLoading}
            >
              Regenerate
            </Button>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <CareerCard
                key={rec.role}
                rec={rec}
                rank={i}
                isSelected={selectedCareer === rec.role}
                onSelect={() => handleSelectCareer(rec.role)}
                onViewRoadmap={() => {
                  handleSelectCareer(rec.role);
                  router.push("/roadmap");
                }}
              />
            ))}
          </div>

          {selectedCareer && (
            <div className="mt-8 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <h3 className="font-bold text-white mb-2">Next steps for {selectedCareer}</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="md"
                  onClick={() => router.push("/roadmap")}
                  leftIcon={<Map className="w-4 h-4" />}
                >
                  View Skill Roadmap
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => router.push("/skillsbuild")}
                  leftIcon={<BookOpen className="w-4 h-4" />}
                >
                  IBM SkillsBuild Resources
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => router.push("/interview")}
                >
                  Practice Interview
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
