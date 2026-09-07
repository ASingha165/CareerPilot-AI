"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Building2, CheckCircle2, ChevronRight, Loader2, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useCareerStore } from "@/lib/store/career-store";

type Intelligence = {
  overallReadiness: number;
  headline: string;
  summary: string;
  dimensions: { name: string; score: number; status: string; reason: string }[];
  priorities: { title: string; priority: "high" | "medium" | "low"; reason: string; action: string }[];
  interviewPlan: { category: string; focus: string; sessions: number; difficulty: string }[];
  nextActions: string[];
};

const priorityColors: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function InterviewIntelligencePage() {
  const { profile, selectedCareer, readinessScore, roadmap, resumeAnalysis, githubAnalysis } = useCareerStore();

  const [role, setRole] = useState(selectedCareer || profile?.targetRoles?.[0] || "Software Developer");
  const [company, setCompany] = useState("");
  const [result, setResult] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const profileSummary = useMemo(
    () =>
      [
        profile && `${profile.degree} in ${profile.branch}; experience level: ${profile.experienceLevel}`,
        profile?.currentSkills?.length && `Current skills: ${profile.currentSkills.join(", ")}`,
        resumeAnalysis?.strengths?.length && `Resume strengths: ${resumeAnalysis.strengths.join(", ")}`,
        githubAnalysis?.techStack?.length && `GitHub stack: ${githubAnalysis.techStack.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    [profile, resumeAnalysis, githubAnalysis]
  );

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/interview-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          company,
          profileSummary,
          readiness: readinessScore?.breakdown,
          skillGaps: roadmap?.currentSkills
            ?.filter((s) => s.priority !== "nice-to-have")
            .map((s) => s.skill),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not generate interview intelligence");
      setResult(d);
      setIsMock(Boolean(d.isMock));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate interview intelligence");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Interview Intelligence"
        subtitle="Turn your career target and skill gaps into a focused interview-readiness plan."
        badge="🎯 Interview Readiness"
      />

      {error && (
        <Alert variant="error" className="mb-6" title="Generation failed">
          {error}
        </Alert>
      )}
      {isMock && (
        <Alert variant="info" className="mb-6">
          Demo mode — add{" "}
          <code className="text-xs bg-slate-700 px-1 rounded">GEMINI_API_KEY</code> for personalized
          AI analysis.
        </Alert>
      )}

      {/* Input card + profile snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-semibold text-white">Target interview</h2>
              <p className="text-xs text-slate-500">
                Give CareerPilot a target so preparation becomes specific.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="text-xs text-slate-400 mb-2 block">Target role</span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="e.g. Software Developer"
              />
            </label>
            <label>
              <span className="text-xs text-slate-400 mb-2 block">
                Company <span className="text-slate-600">(optional)</span>
              </span>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Google, IBM, Amazon"
                />
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between gap-4 mt-5 p-4 rounded-xl bg-slate-900/40 border border-slate-700/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Personalized from your profile</div>
                <div className="text-xs text-slate-500">Resume · GitHub · readiness · skill gaps</div>
              </div>
            </div>
            <Button onClick={generate} disabled={!role || loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  Analyze readiness <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Profile snapshot */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">Profile snapshot</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-3">
            {readinessScore && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400">Career readiness</span>
                  <span className="text-xs font-semibold text-blue-400">
                    {readinessScore.overall}%
                  </span>
                </div>
                <ProgressBar value={readinessScore.overall} size="sm" />
              </div>
            )}
            {profile && (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">
                  {profile.degree} · {profile.branch}
                </div>
                <div className="text-xs text-slate-500 capitalize">{profile.experienceLevel}</div>
              </div>
            )}
            {selectedCareer && (
              <div className="pt-1">
                <div className="text-xs text-slate-500 mb-1">Target career</div>
                <Badge variant="blue">{selectedCareer}</Badge>
              </div>
            )}
            {!profile && (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 mb-3">Complete your profile for personalized analysis</p>
                <Link href="/onboarding">
                  <Button variant="secondary" size="sm">
                    Set up profile
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Results or empty state */}
      {!result ? (
        <Card className="text-center py-16">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Build your interview strategy</h2>
          <p className="max-w-xl mx-auto text-sm text-slate-400 mt-2">
            CareerPilot will score the dimensions that matter, identify the highest-impact gaps, and
            turn them into a practical interview plan.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall score */}
          <Card>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-32 h-32 rounded-full border-8 border-slate-700 flex items-center justify-center shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{result.overallReadiness}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">ready</div>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="blue">{role}</Badge>
                  {company && <Badge variant="purple">{company}</Badge>}
                </div>
                <h2 className="text-2xl font-bold text-white">{result.headline}</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-3xl">{result.summary}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competency matrix */}
            <Card>
              <h3 className="font-semibold text-white mb-5">Competency matrix</h3>
              <div className="space-y-5">
                {result.dimensions.map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-white">
                        {d.name}
                        <span className="ml-2 text-[10px] text-slate-500">{d.status}</span>
                      </span>
                      <span className="text-sm font-semibold text-blue-400">{d.score}%</span>
                    </div>
                    <ProgressBar value={d.score} size="sm" />
                    <p className="text-xs text-slate-500 mt-1.5">{d.reason}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Priorities */}
            <Card>
              <h3 className="font-semibold text-white mb-5">Highest-impact priorities</h3>
              <div className="space-y-3">
                {result.priorities.map((p, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/30"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-sm font-semibold text-white">{p.title}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${priorityColors[p.priority] || ""}`}
                      >
                        {p.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{p.reason}</p>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-300">{p.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Interview plan */}
          <Card>
            <h3 className="font-semibold text-white mb-5">Recommended interview plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.interviewPlan.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/30 space-y-2"
                >
                  <div className="text-sm font-semibold text-white">{item.category}</div>
                  <p className="text-xs text-slate-400">{item.focus}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">{item.sessions} sessions</span>
                    <Badge variant="blue">{item.difficulty}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Next actions */}
          <Card>
            <h3 className="font-semibold text-white mb-5">Next actions</h3>
            <div className="space-y-3">
              {result.nextActions.map((action, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">{action}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
