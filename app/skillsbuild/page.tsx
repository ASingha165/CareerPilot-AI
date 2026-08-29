"use client";

import { useEffect } from "react";
import { BookOpen, ExternalLink, Clock, ChevronRight, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useCareerStore } from "@/lib/store/career-store";
import { getRecommendedResources } from "@/lib/skillsbuild/catalog";
import { cn } from "@/lib/utils";
import type { SkillsBuildResource } from "@/lib/types";

const levelConfig = {
  beginner: { label: "Beginner", color: "emerald" as const },
  intermediate: { label: "Intermediate", color: "yellow" as const },
  advanced: { label: "Advanced", color: "red" as const },
};

function ResourceCard({ resource }: { resource: SkillsBuildResource }) {
  const level = levelConfig[resource.level];

  return (
    <div className="flex flex-col border border-slate-700/50 bg-[#1e293b] rounded-2xl p-5 hover:border-slate-600 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={level.color}>{level.label}</Badge>
          {resource.isPlaceholder && (
            <Badge variant="slate">Preview</Badge>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-white mb-1">{resource.title}</h3>
      <p className="text-sm text-slate-400 flex-1 mb-4">{resource.description}</p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {resource.estimatedHours}h
          </span>
          <span>{resource.skillArea}</span>
        </div>

        <a
          href="https://skillsbuild.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {resource.isPlaceholder ? "Explore IBM SkillsBuild" : "Start Course"}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/40">
        <div className="flex flex-wrap gap-1">
          {resource.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SkillsBuildPage() {
  const {
    roadmap,
    recommendations,
    selectedCareer,
    skillsBuildResources,
    setSkillsBuildResources,
  } = useCareerStore();

  useEffect(() => {
    if (skillsBuildResources.length === 0) {
      const missingSkills = [
        ...(roadmap?.currentSkills
          ?.filter((s) => s.currentLevel < s.requiredLevel)
          ?.map((s) => s.skill) || []),
        ...(recommendations[0]?.missingSkills || []),
      ];

      const targetRole = selectedCareer || recommendations[0]?.role || "";
      const resources = getRecommendedResources(
        missingSkills.length > 0 ? missingSkills : ["Machine Learning", "Python", "Cloud"],
        targetRole,
        8
      );

      setSkillsBuildResources(resources);
    }
  }, [roadmap, recommendations, selectedCareer, skillsBuildResources, setSkillsBuildResources]);

  const resources = skillsBuildResources.length > 0
    ? skillsBuildResources
    : getRecommendedResources(["Python", "Machine Learning", "Cloud"], "Software Developer", 8);

  const byLevel = {
    beginner: resources.filter((r) => r.level === "beginner"),
    intermediate: resources.filter((r) => r.level === "intermediate"),
    advanced: resources.filter((r) => r.level === "advanced"),
  };

  return (
    <AppShell>
      <PageHeader
        title="IBM SkillsBuild Recommendations"
        subtitle="Curated learning resources matched to your skill gaps and career goals."
        badge="📚 Learning"
      />

      <Alert variant="info" className="mb-6">
        <strong>About IBM SkillsBuild:</strong> These recommendations are matched to your profile.
        Course data is currently structured as placeholders ready for real IBM SkillsBuild API integration.
        Click any resource to explore IBM SkillsBuild directly.
      </Alert>

      {/* Personalization context */}
      {(selectedCareer || recommendations[0]) && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <span className="text-sm text-white font-medium">
              Personalized for:{" "}
            </span>
            <span className="text-sm text-blue-400">
              {selectedCareer || recommendations[0]?.role}
            </span>
            {roadmap?.currentSkills?.filter((s) => s.priority === "critical").length ? (
              <span className="text-sm text-slate-400 ml-2">
                · {roadmap.currentSkills.filter((s) => s.priority === "critical").length} critical skill gaps
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Resources by level */}
      {(["beginner", "intermediate", "advanced"] as const).map((level) => {
        const levelResources = byLevel[level];
        if (levelResources.length === 0) return null;

        return (
          <div key={level} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={levelConfig[level].color}>
                {levelConfig[level].label}
              </Badge>
              <span className="text-xs text-slate-500">
                {levelResources.length} course{levelResources.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        );
      })}

      {/* CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl text-center">
        <h3 className="font-bold text-white mb-2">Explore the full IBM SkillsBuild catalog</h3>
        <p className="text-slate-400 text-sm mb-4">
          Thousands of free courses covering AI, data science, cloud, cybersecurity, and more.
          Many courses include digital badges and certificates.
        </p>
        <a
          href="https://skillsbuild.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Visit IBM SkillsBuild
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </AppShell>
  );
}
