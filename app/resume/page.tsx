"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useCareerStore } from "@/lib/store/career-store";
import { cn } from "@/lib/utils";
import type { ResumeAnalysis } from "@/lib/types";

// ---- ResumeAnalysisView ----

function SkillChips({
  items,
  variant,
}: {
  items: string[];
  variant: "blue" | "emerald" | "purple" | "yellow" | "orange" | "red" | "slate";
}) {
  if (!items?.length) return <p className="text-slate-500 text-sm">None detected</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant={variant}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold text-white">
          <span>{icon}</span>
          {title}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/40">
          <div className="mt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function ResumeAnalysisView({
  analysis,
  isMock,
}: {
  analysis: ResumeAnalysis;
  isMock: boolean;
}) {
  return (
    <div className="space-y-4 animate-slide-up">
      {isMock && (
        <Alert variant="warning" title="Demo Mode">
          AI analysis is not configured. Add your{" "}
          <code className="text-xs bg-slate-700 px-1 rounded">GEMINI_API_KEY</code> to{" "}
          <code className="text-xs bg-slate-700 px-1 rounded">.env.local</code> to enable real AI analysis.
          Showing sample data.
        </Alert>
      )}

      {/* Skills overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span>⚙️</span>
            <h3 className="font-semibold text-white">Technical Skills</h3>
          </div>
          <SkillChips items={analysis.extractedSkills?.technical} variant="blue" />
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span>🤝</span>
            <h3 className="font-semibold text-white">Soft Skills</h3>
          </div>
          <SkillChips items={analysis.extractedSkills?.soft} variant="purple" />
        </Card>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span>✅</span>
            <h3 className="font-semibold text-emerald-400">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {analysis.strengths?.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="border-orange-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span>⚠️</span>
            <h3 className="font-semibold text-orange-400">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {analysis.weaknesses?.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Suggestions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-white">Resume Improvement Suggestions</h3>
        </div>
        <div className="space-y-2">
          {analysis.suggestions?.map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-slate-300 p-3 bg-slate-800/50 rounded-lg">
              <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
              {s}
            </div>
          ))}
        </div>
      </Card>

      {/* Collapsible sections */}
      <CollapsibleSection title="Education" icon="🎓">
        <SkillChips items={analysis.education} variant="slate" />
      </CollapsibleSection>

      <CollapsibleSection title="Projects" icon="🛠️">
        <SkillChips items={analysis.projects} variant="blue" />
      </CollapsibleSection>

      <CollapsibleSection title="Technologies Detected" icon="💻">
        <SkillChips items={analysis.technologies} variant="purple" />
      </CollapsibleSection>

      {analysis.certifications?.length > 0 && (
        <CollapsibleSection title="Certifications" icon="🏆">
          <SkillChips items={analysis.certifications} variant="yellow" />
        </CollapsibleSection>
      )}

      {analysis.achievements?.length > 0 && (
        <CollapsibleSection title="Achievements" icon="⭐">
          <SkillChips items={analysis.achievements} variant="emerald" />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Missing Skills" icon="🎯">
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-3">
            Skills commonly expected for your experience level that were not found in your resume.
          </p>
          <SkillChips items={analysis.missingSkills} variant="orange" />
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ---- Upload Zone ----

function UploadZone({
  onFileSelect,
  isLoading,
}: {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-all cursor-pointer",
        dragOver
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-600/60 hover:border-slate-500 hover:bg-slate-800/30",
        isLoading && "pointer-events-none opacity-60"
      )}
    >
      <input
        type="file"
        accept=".pdf,.txt"
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
        disabled={isLoading}
      />

      {isLoading ? (
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
      ) : (
        <Upload className="w-10 h-10 text-slate-400 mb-4" />
      )}

      <p className="text-white font-semibold mb-1">
        {isLoading ? "Analyzing your resume…" : "Drop your resume here"}
      </p>
      <p className="text-slate-400 text-sm mb-4">
        {isLoading ? "AI is reading your resume" : "or click to browse your files"}
      </p>
      <p className="text-xs text-slate-600">PDF or TXT · Max 5MB</p>
    </div>
  );
}

// ---- Main Page ----

export default function ResumePage() {
  const router = useRouter();
  const {
    resumeAnalysis,
    resumeFileName,
    profile,
    setResumeAnalysis,
    setLoading,
    isLoading,
  } = useCareerStore();

  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setLoading(true, "Analyzing your resume with AI…");

    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (profile) {
        formData.append("profile", JSON.stringify(profile));
      }

      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setResumeAnalysis(data.analysis, data.fileName, data.rawText || "");
      setIsMock(data.isMock);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setResumeAnalysis(
      { extractedSkills: { technical: [], soft: [] }, education: [], projects: [], experience: [], certifications: [], achievements: [], technologies: [], domains: [], strengths: [], weaknesses: [], missingSkills: [], suggestions: [] },
      "",
      ""
    );
    setIsMock(false);
    setError(null);
  };

  return (
    <AppShell>
      <PageHeader
        title="Resume Analyzer"
        subtitle="Upload your resume for AI-powered analysis of your skills, strengths, and gaps."
        badge="📄 Resume"
        action={
          resumeAnalysis && (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/career")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              See Career Matches
            </Button>
          )
        }
      />

      {!profile && (
        <Alert variant="warning" className="mb-6">
          Complete your <button onClick={() => router.push("/onboarding")} className="underline text-yellow-300">career profile</button> first for more personalized analysis.
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="mb-6" title="Upload failed">
          {error}{" "}
          <button onClick={() => setError(null)} className="ml-1">
            <X className="w-3 h-3 inline" />
          </button>
        </Alert>
      )}

      {!resumeAnalysis || !resumeFileName ? (
        <div className="max-w-2xl mx-auto">
          <UploadZone onFileSelect={handleFileUpload} isLoading={isLoading} />

          {/* Tips */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: "🔒", title: "Private", desc: "File is processed and discarded — never stored" },
              { icon: "⚡", title: "Fast", desc: "AI analysis completes in under 30 seconds" },
              { icon: "🎯", title: "Actionable", desc: "Specific suggestions, not generic advice" },
            ].map((tip) => (
              <div key={tip.title} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{tip.title}</div>
                <div className="text-xs text-slate-500">{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* File header */}
          <div className="flex items-center justify-between mb-6 bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white text-sm">{resumeFileName}</span>
              <Badge variant="emerald">
                <CheckCircle2 className="w-3 h-3" /> Analyzed
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAnalysis}
              >
                Re-upload
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/career")}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Career Matches
              </Button>
            </div>
          </div>

          <ResumeAnalysisView analysis={resumeAnalysis} isMock={isMock} />
        </div>
      )}
    </AppShell>
  );
}
