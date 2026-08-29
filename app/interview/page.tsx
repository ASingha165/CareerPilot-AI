"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  ArrowRight,
  Clock,
  Zap,
  Brain,
  MessageSquare,
  ChevronRight,
  Loader2,
  History,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useCareerStore } from "@/lib/store/career-store";
import { CAREER_ICONS, CAREER_ROLES } from "@/lib/constants/careers";
import { cn, generateId, formatDate } from "@/lib/utils";
import type { InterviewType, Difficulty, InterviewSession } from "@/lib/types";

const interviewTypes: { value: InterviewType; label: string; desc: string; icon: string }[] = [
  { value: "technical", label: "Technical", desc: "Algorithms, system design, domain knowledge", icon: "⚙️" },
  { value: "behavioral", label: "Behavioral", desc: "Past experiences, soft skills, STAR format", icon: "🤝" },
  { value: "mixed", label: "Mixed", desc: "Combination of technical and behavioral", icon: "🎯" },
];

const difficulties: { value: Difficulty; label: string; desc: string; color: string }[] = [
  { value: "easy", label: "Easy", desc: "Fundamentals & concepts", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { value: "medium", label: "Medium", desc: "Applied knowledge", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  { value: "hard", label: "Hard", desc: "Advanced & architecture", color: "text-red-400 border-red-500/30 bg-red-500/10" },
];

function SessionCard({ session }: { session: InterviewSession }) {
  const icon = CAREER_ICONS[session.role] || "💼";
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white text-sm">{session.role}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          {session.type} · {session.difficulty} · {formatDate(session.createdAt)}
        </div>
      </div>
      {session.result ? (
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-blue-400">{session.result.overallScore}</div>
          <div className="text-xs text-slate-500">score</div>
        </div>
      ) : (
        <Badge variant="yellow">In Progress</Badge>
      )}
    </div>
  );
}

export default function InterviewPage() {
  const router = useRouter();
  const {
    profile,
    selectedCareer,
    recommendations,
    addInterviewSession,
    setActiveInterviewSession,
    interviewSessions,
    setLoading,
    isLoading,
    loadingMessage,
  } = useCareerStore();

  const [selectedRole, setSelectedRole] = useState(
    selectedCareer || profile?.targetRoles?.[0] || ""
  );
  const [selectedType, setSelectedType] = useState<InterviewType>("mixed");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const startInterview = async () => {
    if (!selectedRole) return;

    setError(null);
    setLoading(true, "Generating your interview questions…");

    try {
      const profileSummary = profile
        ? `${profile.name}, ${profile.degree} in ${profile.branch}. Skills: ${profile.currentSkills.join(", ")}`
        : "";

      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          type: selectedType,
          difficulty: selectedDifficulty,
          profileSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");

      const session: InterviewSession = {
        id: generateId(),
        role: selectedRole,
        type: selectedType,
        difficulty: selectedDifficulty,
        questions: data.questions,
        currentQuestionIndex: 0,
        status: "in-progress",
        createdAt: new Date().toISOString(),
      };

      setIsMock(data.isMock);
      addInterviewSession(session);
      setActiveInterviewSession(session);
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const allRoles = [
    ...new Set([
      ...(profile?.targetRoles || []),
      ...(recommendations.map((r) => r.role) || []),
      ...CAREER_ROLES,
    ]),
  ].slice(0, 12);

  return (
    <AppShell>
      <PageHeader
        title="AI Mock Interviewer"
        subtitle="Practice with real interview questions and receive AI-powered feedback on every answer."
        badge="🎤 Mock Interview"
      />

      {error && (
        <Alert variant="error" className="mb-6" title="Error">
          {error}
        </Alert>
      )}

      {isMock && (
        <Alert variant="info" className="mb-6">
          Demo mode — questions are sample data. Configure{" "}
          <code className="text-xs bg-slate-700 px-1 rounded">GEMINI_API_KEY</code> for role-specific AI questions.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role selection */}
          <Card>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" />
              Choose a role
            </h3>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => {
                const icon = CAREER_ICONS[role] || "💼";
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                      selectedRole === role
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    <span>{icon}</span>
                    {role}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Interview type */}
          <Card>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Interview type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {interviewTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedType(t.value)}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all",
                    selectedType === t.value
                      ? "bg-purple-600/20 border-purple-500 text-white"
                      : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-slate-500"
                  )}
                >
                  <div className="text-xl mb-2">{t.icon}</div>
                  <div className="font-semibold text-sm mb-1">{t.label}</div>
                  <div className="text-xs text-slate-500">{t.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Difficulty */}
          <Card>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Difficulty
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDifficulty(d.value)}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    selectedDifficulty === d.value
                      ? d.color
                      : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-slate-500"
                  )}
                >
                  <div className="font-bold text-sm mb-1">{d.label}</div>
                  <div className="text-xs opacity-70">{d.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Start */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-sm">{loadingMessage}</span>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={startInterview}
                disabled={!selectedRole}
                leftIcon={<Mic className="w-5 h-5" />}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="px-8"
              >
                Start Interview
              </Button>
            )}
            {!selectedRole && (
              <p className="text-sm text-slate-500">Select a role to continue</p>
            )}
          </div>
        </div>

        {/* Session history */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-white">Session History</h3>
              {interviewSessions.length > 0 && (
                <Badge variant="slate">{interviewSessions.length}</Badge>
              )}
            </div>

            {interviewSessions.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No sessions yet</p>
                <p className="text-slate-600 text-xs mt-1">Complete your first interview to see history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interviewSessions.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveInterviewSession(s);
                      router.push(`/interview/${s.id}`);
                    }}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <SessionCard session={s} />
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-3">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">•</span>
                Use the STAR method for behavioral questions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">•</span>
                Think aloud when solving technical problems
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">•</span>
                Aim for 2-3 minutes per answer
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">•</span>
                Complete all 5 questions to get a full score
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
