"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Send,
  RotateCcw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  Lightbulb,
  AlertTriangle,
  Target,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCareerStore } from "@/lib/store/career-store";
import { cn } from "@/lib/utils";
import type { AnswerFeedback, InterviewQuestion, InterviewResult } from "@/lib/types";

function FeedbackPanel({ feedback, question }: { feedback: AnswerFeedback; question: string }) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Score */}
      <div className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/40">
        <div className="w-16 h-16 shrink-0">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#334155" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={feedback.score >= 70 ? "#34d399" : feedback.score >= 50 ? "#fbbf24" : "#f87171"}
                strokeWidth="6"
                strokeDasharray={`${(feedback.score / 100) * 175.9} 175.9`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{feedback.score}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">Answer Score</div>
          <div className={cn(
            "text-sm font-medium mt-0.5",
            feedback.score >= 70 ? "text-emerald-400" : feedback.score >= 50 ? "text-yellow-400" : "text-red-400"
          )}>
            {feedback.score >= 80 ? "Excellent" : feedback.score >= 60 ? "Good" : feedback.score >= 40 ? "Needs Work" : "Try Again"}
          </div>
        </div>
      </div>

      {/* Good points */}
      {feedback.whatWasGood?.length > 0 && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">What was good</span>
          </div>
          <ul className="space-y-1">
            {feedback.whatWasGood.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-400">Improvements</span>
        </div>
        <ul className="space-y-1">
          {feedback.improvements?.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-orange-400 shrink-0">•</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Missing points */}
      {feedback.missingPoints?.length > 0 && (
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">You could have mentioned</span>
          </div>
          <ul className="space-y-1">
            {feedback.missingPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-blue-400 shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Better structure */}
      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-400">Better answer structure</span>
        </div>
        <p className="text-sm text-slate-300">{feedback.betterStructure}</p>
      </div>
    </div>
  );
}

function InterviewResultView({
  result,
  session,
  onRetry,
}: {
  result: InterviewResult;
  session: { role: string; questions: InterviewQuestion[] };
  onRetry: () => void;
}) {
  const router = useRouter();

  const dimensions = [
    { key: "technicalScore", label: "Technical Knowledge", score: result.technicalScore },
    { key: "communicationScore", label: "Communication", score: result.communicationScore },
    { key: "problemSolvingScore", label: "Problem Solving", score: result.problemSolvingScore },
    { key: "confidenceScore", label: "Confidence & Clarity", score: result.confidenceScore },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Overall score */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-4 border-blue-500/30 mb-4">
          <div>
            <div className="text-4xl font-extrabold text-white">{result.overallScore}</div>
            <div className="text-xs text-slate-400">/100</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Interview Complete!</h2>
        <p className="text-slate-400">
          {result.overallScore >= 80
            ? "Excellent performance! You're well prepared."
            : result.overallScore >= 60
            ? "Good effort! Review the feedback and keep practicing."
            : "Keep practicing — improvement comes with repetition."}
        </p>
      </div>

      {/* Breakdown */}
      <Card>
        <h3 className="font-semibold text-white mb-4">Performance Breakdown</h3>
        <div className="space-y-3">
          {dimensions.map((d) => (
            <ProgressBar
              key={d.key}
              value={d.score}
              label={d.label}
              showValue
              size="md"
            />
          ))}
        </div>
      </Card>

      {/* Areas to improve */}
      {result.areasToImprove?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-3">Areas to Improve</h3>
          <ul className="space-y-2">
            {result.areasToImprove.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-orange-400 shrink-0">•</span>
                {a}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={onRetry} leftIcon={<RotateCcw className="w-4 h-4" />}>
          Practice Again
        </Button>
        <Button onClick={() => router.push("/interview")}>
          New Interview
        </Button>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const {
    activeInterviewSession,
    interviewSessions,
    updateInterviewSession,
    setActiveInterviewSession,
  } = useCareerStore();

  // Resolve session from store
  const session =
    activeInterviewSession?.id === sessionId
      ? activeInterviewSession
      : interviewSessions.find((s) => s.id === sessionId) || null;

  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (session && !activeInterviewSession) {
      setActiveInterviewSession(session);
    }
  }, [session, activeInterviewSession, setActiveInterviewSession]);

  if (!session) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-slate-400 mb-4">Session not found.</p>
          <Button onClick={() => router.push("/interview")}>Back to Interviews</Button>
        </div>
      </AppShell>
    );
  }

  if (session.status === "completed" && session.result) {
    return (
      <AppShell>
        <InterviewResultView
          result={session.result}
          session={session}
          onRetry={() => router.push("/interview")}
        />
      </AppShell>
    );
  }

  const currentIndex = session.currentQuestionIndex;
  const currentQuestion = session.questions[currentIndex];
  const currentFeedback = currentQuestion?.feedback;
  const isLastQuestion = currentIndex === session.questions.length - 1;
  const progress = ((currentIndex) / session.questions.length) * 100;

  const submitAnswer = async () => {
    if (!answer.trim() && !currentFeedback) return;

    setIsEvaluating(true);
    setError(null);

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: answer.trim(),
          role: session.role,
          category: currentQuestion.category,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");

      // Update question with answer and feedback
      const updatedQuestions = session.questions.map((q, i) =>
        i === currentIndex ? { ...q, answer: answer.trim(), feedback: data.feedback } : q
      );

      const updatedSession = {
        ...session,
        questions: updatedQuestions,
      };

      updateInterviewSession(updatedSession);
      setActiveInterviewSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  const goToNext = () => {
    if (isLastQuestion) {
      // Calculate final results
      const answeredQuestions = session.questions.filter((q) => q.feedback);
      const avgScore =
        answeredQuestions.length > 0
          ? Math.round(
              answeredQuestions.reduce((sum, q) => sum + (q.feedback?.score || 0), 0) /
                answeredQuestions.length
            )
          : 0;

      const result: InterviewResult = {
        overallScore: avgScore,
        technicalScore: Math.round(avgScore * 1.05),
        communicationScore: Math.round(avgScore * 0.95),
        problemSolvingScore: Math.round(avgScore * 1.0),
        confidenceScore: Math.round(avgScore * 0.9),
        areasToImprove: session.questions
          .flatMap((q) => q.feedback?.improvements || [])
          .slice(0, 3),
        strengths: session.questions
          .flatMap((q) => q.feedback?.whatWasGood || [])
          .slice(0, 3),
        summary: `You completed a ${session.difficulty} ${session.type} interview for ${session.role} with a score of ${avgScore}/100.`,
      };

      const completedSession = {
        ...session,
        status: "completed" as const,
        result,
        completedAt: new Date().toISOString(),
      };

      updateInterviewSession(completedSession);
      setActiveInterviewSession(completedSession);
    } else {
      const updatedSession = {
        ...session,
        currentQuestionIndex: currentIndex + 1,
      };
      updateInterviewSession(updatedSession);
      setActiveInterviewSession(updatedSession);
      setAnswer("");
      textareaRef.current?.focus();
    }
  };

  const categoryConfig: Record<string, { label: string; color: string }> = {
    technical: { label: "Technical", color: "blue" },
    behavioral: { label: "Behavioral", color: "purple" },
    "problem-solving": { label: "Problem Solving", color: "orange" },
    situational: { label: "Situational", color: "emerald" },
  };
  const cat = categoryConfig[currentQuestion?.category] || { label: currentQuestion?.category, color: "slate" };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/interview")}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-white">{session.role}</h1>
              <p className="text-xs text-slate-500">
                {session.type} · {session.difficulty}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Q{currentIndex + 1} / {session.questions.length}
          </div>
        </div>

        {/* Progress */}
        <ProgressBar value={progress} size="sm" color="bg-blue-500" className="mb-6" />

        {/* Question */}
        <Card className="mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-blue-400 font-bold text-sm">{currentIndex + 1}</span>
            </div>
            <div className="flex-1">
              <Badge variant={cat.color as "blue" | "purple" | "orange" | "emerald" | "slate"} className="mb-2">
                {cat.label}
              </Badge>
              <p className="text-white font-medium leading-relaxed">{currentQuestion?.question}</p>
            </div>
          </div>

          {currentQuestion?.hint && !currentFeedback && (
            <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
              <span>{currentQuestion.hint}</span>
            </div>
          )}
        </Card>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        {/* Answer area */}
        {!currentFeedback ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={6}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">{answer.length} chars</span>
              <Button
                onClick={submitAnswer}
                loading={isEvaluating}
                disabled={!answer.trim()}
                rightIcon={<Send className="w-4 h-4" />}
              >
                {isEvaluating ? "Evaluating…" : "Submit Answer"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show their answer */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
              <div className="text-xs text-slate-500 mb-2">Your answer:</div>
              <p className="text-sm text-slate-300">{currentQuestion.answer}</p>
            </div>

            {/* Feedback */}
            <FeedbackPanel feedback={currentFeedback} question={currentQuestion.question} />

            {/* Next */}
            <div className="flex justify-end">
              <Button
                onClick={goToNext}
                rightIcon={isLastQuestion ? <Trophy className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              >
                {isLastQuestion ? "See Results" : "Next Question"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
