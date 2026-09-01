"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Map,
  CheckCircle2,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCareerStore } from "@/lib/store/career-store";
import {
  cn,
  getSkillLevelLabel,
  getSkillLevelColor,
  getSkillLevelTextColor,
} from "@/lib/utils";
import type { SkillGap, RoadmapStage } from "@/lib/types";

const priorityConfig = {
  critical: { label: "Critical", variant: "red" as const, emoji: "🔴" },
  important: { label: "Important", variant: "yellow" as const, emoji: "🟡" },
  "nice-to-have": { label: "Nice to have", variant: "slate" as const, emoji: "⚪" },
};

const difficultyConfig = {
  beginner: { label: "Beginner", color: "text-emerald-400" },
  intermediate: { label: "Intermediate", color: "text-yellow-400" },
  advanced: { label: "Advanced", color: "text-red-400" },
};

function SkillGapBar({ gap }: { gap: SkillGap }) {
  const priority = priorityConfig[gap.priority];

  return (
    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{gap.skill}</span>
          <Badge variant={priority.variant}>
            {priority.emoji} {priority.label}
          </Badge>
        </div>
        <span className="text-xs text-slate-500">{gap.category}</span>
      </div>

      <div className="space-y-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-20 shrink-0">Current</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", getSkillLevelColor(gap.currentLevel))}
              style={{ width: `${gap.currentLevel}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-10 text-right">{gap.currentLevel}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-20 shrink-0">Required</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-500"
              style={{ width: `${gap.requiredLevel}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-10 text-right">{gap.requiredLevel}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", getSkillLevelTextColor(gap.currentLevel))}>
          {getSkillLevelLabel(gap.currentLevel)}
        </span>
        {gap.currentLevel < gap.requiredLevel && (
          <span className="text-xs text-slate-500">
            Gap: {gap.requiredLevel - gap.currentLevel}%
          </span>
        )}
      </div>
    </div>
  );
}

function StageCard({ stage, index }: { stage: RoadmapStage; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const diff = difficultyConfig[stage.difficulty];

  return (
    <div
      className={cn(
        "border rounded-2xl overflow-hidden transition-all",
        stage.completed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-700/50 bg-[#1e293b]"
      )}
    >
      <div
        className="flex items-start gap-4 p-5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {/* Stage number */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
            stage.completed
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-blue-600/20 text-blue-400"
          )}
        >
          {stage.completed ? <CheckCircle2 className="w-5 h-5" /> : stage.stage}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-white">{stage.title}</span>
            <span className={cn("text-xs font-medium", diff.color)}>
              {diff.label}
            </span>
          </div>
          <p className="text-sm text-slate-400">{stage.description}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {stage.estimatedWeeks}w
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/40 space-y-4 animate-fade-in pt-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Skills to learn
            </div>
            <div className="flex flex-wrap gap-2">
              {stage.skills.map((skill) => (
                <Badge key={skill} variant="blue">{skill}</Badge>
              ))}
            </div>
          </div>

          {stage.projects?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                🛠️ Projects to build
              </div>
              <ul className="space-y-1">
                {stage.projects.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-purple-400 shrink-0">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  const router = useRouter();
  const {
    profile,
    roadmap,
    selectedCareer,
    resumeAnalysis,
    setRoadmap,
    setLoading,
    isLoading,
    loadingMessage,
  } = useCareerStore();

  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const generateRoadmap = async () => {
    setError(null);
    setLoading(true, "Building your personalized learning roadmap…");

    try {
      const targetRole = selectedCareer || profile?.targetRoles?.[0] || "Software Developer";
      const currentSkills = [
        ...(profile?.currentSkills || []),
        ...(resumeAnalysis?.extractedSkills?.technical || []),
      ];

      const res = await fetch("/api/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          currentSkills: [...new Set(currentSkills)],
          resumeAnalysisSummary: resumeAnalysis
            ? JSON.stringify({
                skills: resumeAnalysis.extractedSkills,
                strengths: resumeAnalysis.strengths,
                weaknesses: resumeAnalysis.weaknesses,
              })
            : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate roadmap");

      setRoadmap(data.roadmap);
      setIsMock(data.isMock);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Skill Gap Roadmap"
        subtitle={
          roadmap
            ? `Personalized learning path to become a ${roadmap.targetRole}`
            : "Your step-by-step plan to bridge skill gaps and reach your target role."
        }
        badge="🗺️ Roadmap"
        action={
          roadmap ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/interview")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Practice Interview
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
          Demo mode — showing sample roadmap. Configure{" "}
          <code className="text-xs bg-slate-700 px-1 rounded">GEMINI_API_KEY</code> for personalized AI roadmaps.
        </Alert>
      )}

      {!roadmap ? (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Map className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Build your learning roadmap
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            CareerPilot will create a personalized 5-stage learning plan that takes you from
            where you are today to where you need to be — with specific skills, projects,
            and timelines.
          </p>

          {selectedCareer && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm">
              <Target className="w-4 h-4" /> Target: {selectedCareer}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-slate-400 text-sm">{loadingMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!selectedCareer && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/career")}
                >
                  Choose Career First
                </Button>
              )}
              <Button
                size="lg"
                onClick={generateRoadmap}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Generate My Roadmap
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-2xl font-bold text-white">{roadmap.totalEstimatedWeeks}w</div>
              <div className="text-xs text-slate-400 mt-1">Estimated time</div>
            </Card>
            <Card>
              <div className="text-2xl font-bold text-white">{roadmap.stages?.length}</div>
              <div className="text-xs text-slate-400 mt-1">Learning stages</div>
            </Card>
            <Card>
              <div className="text-2xl font-bold text-orange-400">
                {roadmap.currentSkills?.filter((s) => s.priority === "critical").length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Critical gaps</div>
            </Card>
            <Card>
              <div className="text-2xl font-bold text-emerald-400">
                {roadmap.currentSkills?.filter((s) => s.currentLevel >= 75).length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Strong skills</div>
            </Card>
          </div>

          {/* Skill gap analysis */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Your Skill Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roadmap.currentSkills?.map((gap) => (
                <SkillGapBar key={gap.skill} gap={gap} />
              ))}
            </div>
          </div>

          {/* Learning stages */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-400" />
              Your Learning Journey
            </h2>
            <div className="space-y-3">
              {roadmap.stages?.map((stage, i) => (
                <StageCard key={stage.stage} stage={stage} index={i} />
              ))}
            </div>
          </div>

          <Card>
            <h3 className="font-semibold text-white mb-2">Interview practice resources</h3>
            <p className="text-sm text-slate-400">
              Use the{" "}
              <a
                href="https://prachub.com/categories/machine-learning"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                PracHub machine learning interview question bank
              </a>{" "}
              for company-tagged technical questions alongside mock interview practice.
            </p>
          </Card>

          {/* Progress bar */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Overall Progress</h3>
              <span className="text-sm text-slate-400">
                {roadmap.stages?.filter((s) => s.completed).length} of {roadmap.stages?.length} stages
              </span>
            </div>
            <ProgressBar
              value={roadmap.stages?.filter((s) => s.completed).length}
              max={roadmap.stages?.length}
              size="lg"
              color="bg-blue-500"
            />
          </Card>
        </div>
      )}
    </AppShell>
  );
}
