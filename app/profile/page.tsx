"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  GraduationCap,
  Sparkles,
  Briefcase,
  Award,
  FolderGit2,
  FileText,
  GitBranch,
  Target,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Loader2,
  X,
  Upload,
  TrendingUp,
  ShieldCheck,
  Lock,
  Check,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { GoogleIcon } from "@/components/ui/GoogleButton";
import { useCareerStore } from "@/lib/store/career-store";
import { CAREER_ROLES, INDUSTRIES, COMMON_SKILLS } from "@/lib/constants/careers";
import { formatDate } from "@/lib/utils";
import type {
  EducationRecord,
  SkillRecord,
  ProjectRecord,
  ExperienceRecord,
  CertificationRecord,
  AchievementRecord,
  SkillProficiency,
  ResumeAnalysis,
} from "@/lib/types";

type ProfileTab =
  | "basic"
  | "education"
  | "skills"
  | "projects"
  | "experience"
  | "certifications"
  | "achievements"
  | "resume"
  | "preferences"
  | "activity"
  | "security";

function ProfileContent() {
  const {
    fullProfile,
    user,
    setFullProfile,
    refreshFullProfile,
    isAiAnalysisStale,
    setIsAiAnalysisStale,
  } = useCareerStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>("skills");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Re-analysis state
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalysisStep, setReanalysisStep] = useState<string>("");

  // Modals state
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillRecord | null>(null);

  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationRecord | null>(null);

  const [projModalOpen, setProjModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<ProjectRecord | null>(null);

  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceRecord | null>(null);

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificationRecord | null>(null);

  const [achModalOpen, setAchModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<AchievementRecord | null>(null);

  // Resume import suggestions modal
  const [resumeImportModalOpen, setResumeImportModalOpen] = useState(false);
  const [extractedResumeData, setExtractedResumeData] = useState<ResumeAnalysis | null>(null);
  const [selectedImportSkills, setSelectedImportSkills] = useState<string[]>([]);

  // Confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "skill" | "education" | "project" | "experience" | "certification" | "achievement" | "resume";
    id: string;
    title: string;
  } | null>(null);

  // Filter & Search states
  const [skillSearch, setSkillSearch] = useState("");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("all");

  // Load user session on mount
  useEffect(() => {
    refreshFullProfile();
  }, [refreshFullProfile]);

  const searchParams = useSearchParams();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);

  // Check URL query parameters for notifications or security tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "security") {
      setActiveTab("security");
    }
    const connected = searchParams.get("connected");
    if (connected === "google") {
      showNotification("success", "Google account successfully connected!");
    }
    const welcome = searchParams.get("welcome");
    if (welcome === "google") {
      showNotification(
        "success",
        "Welcome to CareerPilot! Your Google profile has been imported. Complete your profile details below."
      );
    }
    const err = searchParams.get("error");
    if (err === "google_already_linked") {
      showNotification("error", "This Google account is already linked to another CareerPilot user.");
    } else if (err === "google_not_configured") {
      showNotification(
        "error",
        "Google Sign-In is not configured yet. Please configure credentials in .env."
      );
    }
  }, [searchParams]);

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google?mode=connect";
  };

  const handleDisconnectGoogle = async () => {
    setDisconnectingGoogle(true);
    try {
      const res = await fetch("/api/auth/disconnect-google", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect Google");
      if (data.profile) setFullProfile(data.profile);
      showNotification("success", "Google account successfully disconnected.");
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to disconnect Google");
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification("error", "New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showNotification("error", "New password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword || undefined,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      if (data.profile) setFullProfile(data.profile);
      showNotification("success", data.message || "Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // ----------------------------------------------------
  // RE-ANALYZE CAREER PROFILE ACTION
  // ----------------------------------------------------
  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setReanalysisStep("Reviewing skills and proficiencies...");

    try {
      setTimeout(() => setReanalysisStep("Reviewing verified projects and experience..."), 800);
      setTimeout(() => setReanalysisStep("Identifying skill gaps against target roles..."), 1600);
      setTimeout(() => setReanalysisStep("Updating recommendations and readiness score..."), 2400);

      const res = await fetch("/api/career-analysis/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Re-analysis failed");
      }

      if (data.profile) {
        setFullProfile(data.profile);
      }
      setIsAiAnalysisStale(false);
      showNotification("success", "Career profile successfully re-analyzed! Recommendations updated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to re-analyze profile";
      showNotification("error", msg);
    } finally {
      setIsReanalyzing(false);
      setReanalysisStep("");
    }
  };

  // ----------------------------------------------------
  // BASIC INFO FORM HANDLERS
  // ----------------------------------------------------
  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    phone: "",
    location: "",
    bio: "",
  });

  const [prefForm, setPrefForm] = useState({
    targetRole: "",
    preferredIndustry: "",
    preferredWorkType: "hybrid",
    preferredLocation: "",
  });

  useEffect(() => {
    if (fullProfile) {
      setPersonalForm({
        fullName: fullProfile.profile.personal.fullName || fullProfile.user.name || "",
        phone: fullProfile.profile.personal.phone || "",
        location: fullProfile.profile.personal.location || "",
        bio: fullProfile.profile.personal.bio || "",
      });
      setPrefForm({
        targetRole: fullProfile.profile.careerPreferences.targetRoles[0] || CAREER_ROLES[0],
        preferredIndustry: fullProfile.profile.careerPreferences.preferredIndustry || "Technology",
        preferredWorkType: fullProfile.profile.careerPreferences.preferredWorkType || "hybrid",
        preferredLocation: fullProfile.profile.careerPreferences.preferredLocation || "",
      });
    }
  }, [fullProfile]);

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal: personalForm,
          careerPreferences: {
            ...fullProfile?.profile.careerPreferences,
            targetRoles: [prefForm.targetRole],
            preferredIndustry: prefForm.preferredIndustry,
            preferredWorkType: prefForm.preferredWorkType,
            preferredLocation: prefForm.preferredLocation,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setFullProfile(data.profile);
      showNotification("success", "Basic information updated successfully");
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // SKILLS CRUD
  // ----------------------------------------------------
  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "Programming",
    proficiency: "intermediate" as SkillProficiency,
    experienceYears: 1,
  });

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    try {
      if (editingSkill) {
        const res = await fetch(`/api/skills/${editingSkill.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSkill),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update skill");
        setFullProfile(data.profile);
        showNotification("success", `Updated skill "${newSkill.name}"`);
      } else {
        const res = await fetch("/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSkill),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add skill");
        setFullProfile(data.profile);
        showNotification("success", `Added skill "${newSkill.name}"`);
      }
      setSkillModalOpen(false);
      setEditingSkill(null);
      setNewSkill({ name: "", category: "Programming", proficiency: "intermediate", experienceYears: 1 });
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Error saving skill");
    }
  };

  // ----------------------------------------------------
  // EDUCATION CRUD
  // ----------------------------------------------------
  const [eduForm, setEduForm] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: new Date().getFullYear() - 3,
    endYear: new Date().getFullYear() + 1,
    grade: "",
    coursework: "",
  });

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...eduForm,
        coursework: eduForm.coursework ? eduForm.coursework.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      const url = editingEdu ? `/api/education/${editingEdu.id}` : "/api/education";
      const method = editingEdu ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save education");
      setFullProfile(data.profile);
      showNotification("success", "Education record saved");
      setEduModalOpen(false);
      setEditingEdu(null);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Save failed");
    }
  };

  // ----------------------------------------------------
  // PROJECTS CRUD
  // ----------------------------------------------------
  const [projForm, setProjForm] = useState({
    name: "",
    description: "",
    technologies: "",
    role: "Developer",
    githubUrl: "",
    liveUrl: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "completed" as "completed" | "in-progress" | "planned",
    skills: "",
  });

  const handleSaveProj = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...projForm,
        technologies: projForm.technologies ? projForm.technologies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        skills: projForm.skills ? projForm.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      const url = editingProj ? `/api/projects/${editingProj.id}` : "/api/projects";
      const method = editingProj ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save project");
      setFullProfile(data.profile);
      showNotification("success", "Project saved successfully");
      setProjModalOpen(false);
      setEditingProj(null);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Save failed");
    }
  };

  // ----------------------------------------------------
  // EXPERIENCE CRUD
  // ----------------------------------------------------
  const [expForm, setExpForm] = useState({
    type: "internship" as ExperienceRecord["type"],
    organization: "",
    position: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isCurrent: false,
    technologies: "",
    achievements: "",
  });

  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...expForm,
        technologies: expForm.technologies ? expForm.technologies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        achievements: expForm.achievements ? expForm.achievements.split("\n").map((s) => s.trim()).filter(Boolean) : [],
      };
      const url = editingExp ? `/api/experience/${editingExp.id}` : "/api/experience";
      const method = editingExp ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save experience");
      setFullProfile(data.profile);
      showNotification("success", "Experience saved successfully");
      setExpModalOpen(false);
      setEditingExp(null);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Save failed");
    }
  };

  // ----------------------------------------------------
  // CERTIFICATIONS CRUD
  // ----------------------------------------------------
  const [certForm, setCertForm] = useState({
    name: "",
    issuingOrganization: "",
    issueDate: new Date().toISOString().split("T")[0],
    credentialId: "",
    credentialUrl: "",
    relatedSkills: "",
  });

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...certForm,
        relatedSkills: certForm.relatedSkills ? certForm.relatedSkills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      const url = editingCert ? `/api/certifications/${editingCert.id}` : "/api/certifications";
      const method = editingCert ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save certification");
      setFullProfile(data.profile);
      showNotification("success", "Certification saved and skills updated");
      setCertModalOpen(false);
      setEditingCert(null);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Save failed");
    }
  };

  // ----------------------------------------------------
  // ACHIEVEMENTS CRUD
  // ----------------------------------------------------
  const [achForm, setAchForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    issuingOrganization: "",
    credentialUrl: "",
    skills: "",
    tags: "",
  });

  const handleSaveAch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...achForm,
        skills: achForm.skills ? achForm.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        tags: achForm.tags ? achForm.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      const url = editingAch ? `/api/achievements/${editingAch.id}` : "/api/achievements";
      const method = editingAch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save achievement");
      setFullProfile(data.profile);
      showNotification("success", "Achievement saved successfully");
      setAchModalOpen(false);
      setEditingAch(null);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Save failed");
    }
  };

  // ----------------------------------------------------
  // GENERIC DELETE CONFIRMATION HANDLER
  // ----------------------------------------------------
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    try {
      let endpoint = "";
      if (type === "skill") endpoint = `/api/skills/${id}`;
      else if (type === "education") endpoint = `/api/education/${id}`;
      else if (type === "project") endpoint = `/api/projects/${id}`;
      else if (type === "experience") endpoint = `/api/experience/${id}`;
      else if (type === "certification") endpoint = `/api/certifications/${id}`;
      else if (type === "achievement") endpoint = `/api/achievements/${id}`;
      else if (type === "resume") endpoint = `/api/resume/${id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");

      setFullProfile(data.profile);
      showNotification("success", `Removed ${type} successfully`);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ----------------------------------------------------
  // RESUME UPLOAD & CONFIRM IMPORT
  // ----------------------------------------------------
  const [resumeUploading, setResumeUploading] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resume upload failed");

      if (data.profile) setFullProfile(data.profile);

      // Open review/import modal with extracted items
      if (data.analysis) {
        setExtractedResumeData(data.analysis);
        const technical = data.analysis.extractedSkills?.technical || [];
        setSelectedImportSkills(technical);
        setResumeImportModalOpen(true);
      }

      showNotification("success", `Resume "${file.name}" uploaded and parsed`);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  };

  const handleImportResumeConfirmed = async () => {
    if (!extractedResumeData) return;
    try {
      const res = await fetch("/api/resume/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: selectedImportSkills,
          education: extractedResumeData.education,
          projects: extractedResumeData.projects,
          certifications: extractedResumeData.certifications,
          achievements: extractedResumeData.achievements,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setFullProfile(data.profile);
      setResumeImportModalOpen(false);
      showNotification("success", "Confirmed resume details added to your live profile!");
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Import failed");
    }
  };

  // Safe data access
  const skillsList = fullProfile?.skills || [];
  const educationList = fullProfile?.education || [];
  const projectsList = fullProfile?.projects || [];
  const experienceList = fullProfile?.experience || [];
  const certificationsList = fullProfile?.certifications || [];
  const achievementsList = fullProfile?.achievements || [];
  const resumesList = fullProfile?.resumes || [];
  const activitiesList = fullProfile?.activities || [];
  const completeness = fullProfile?.completeness;

  const filteredSkills = skillsList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(skillSearch.toLowerCase());
    const matchesCategory =
      skillCategoryFilter === "all" || s.category.toLowerCase() === skillCategoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(skillsList.map((s) => s.category)));

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Status notification */}
        {statusMessage && (
          <Alert
            variant={statusMessage.type === "success" ? "success" : "error"}
            title={statusMessage.type === "success" ? "Success" : "Error"}
          >
            {statusMessage.text}
          </Alert>
        )}

        {/* ============================================================ */}
        {/* PROFILE HEADER & COMPLETENESS HERO CARD */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-900 border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
                {(fullProfile?.profile.personal.fullName || user?.name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    {fullProfile?.profile.personal.fullName || user?.name || "Student"}
                  </h1>
                  <Badge variant="blue" className="text-xs">
                    {fullProfile?.profile.careerPreferences.targetRoles[0] || "Target: Software Developer"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {fullProfile?.profile.personal.email || user?.email || "Student Account"} •{" "}
                  {fullProfile?.profile.personal.location || "Location not set"}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Profile updated:{" "}
                    <strong className="text-slate-300 font-medium">
                      {fullProfile?.profile.lastProfileUpdate
                        ? formatDate(fullProfile.profile.lastProfileUpdate)
                        : "Today"}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI analysis:{" "}
                    <strong className="text-slate-300 font-medium">
                      {fullProfile?.profile.lastAiAnalysisDate
                        ? formatDate(fullProfile.profile.lastAiAnalysisDate)
                        : "Not yet run"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Completeness Pill & Re-analyze CTA */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 min-w-[240px]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Profile Completeness</span>
                  <span className="font-bold text-blue-400">
                    {completeness?.overallPercentage || 0}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${completeness?.overallPercentage || 0}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{completeness?.completedSections.length || 0} complete</span>
                  <span>{completeness?.incompleteSections.length || 0} to improve</span>
                </div>
              </div>

              <Button
                variant={isAiAnalysisStale ? "primary" : "secondary"}
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="justify-center shadow-lg shadow-blue-500/10"
                leftIcon={
                  isReanalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )
                }
              >
                {isReanalyzing ? "Re-analyzing..." : "Re-analyze Career Profile"}
              </Button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* STALE ANALYSIS BANNER (Requirement 13) */}
          {/* ============================================================ */}
          {(isAiAnalysisStale || fullProfile?.profile.isAiAnalysisStale) && (
            <div className="mt-6 pt-5 border-t border-slate-700/50">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">Profile Updated</h4>
                    <p className="text-xs text-amber-200/80">
                      Your career profile was recently updated with new skills or details. Re-run AI analysis to update recommendations and readiness scores.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0"
                >
                  {isReanalyzing ? "Analyzing..." : "Re-analyze Now"}
                </Button>
              </div>
            </div>
          )}

          {/* Loading progression overlay */}
          {isReanalyzing && (
            <div className="mt-4 p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>{reanalysisStep || "Analyzing your updated profile..."}</span>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* NAVIGATION TABS */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-700/60 no-scrollbar">
          {[
            { id: "skills" as ProfileTab, label: "Skills", icon: Sparkles, count: skillsList.length },
            { id: "education" as ProfileTab, label: "Education", icon: GraduationCap, count: educationList.length },
            { id: "projects" as ProfileTab, label: "Projects", icon: FolderGit2, count: projectsList.length },
            { id: "experience" as ProfileTab, label: "Experience", icon: Briefcase, count: experienceList.length },
            { id: "certifications" as ProfileTab, label: "Certifications", icon: Award, count: certificationsList.length },
            { id: "achievements" as ProfileTab, label: "Achievements", icon: TrendingUp, count: achievementsList.length },
            { id: "resume" as ProfileTab, label: "Resume", icon: FileText, count: resumesList.length },
            { id: "preferences" as ProfileTab, label: "Preferences", icon: Target },
            { id: "basic" as ProfileTab, label: "Personal Info", icon: User },
            { id: "security" as ProfileTab, label: "Account Security", icon: ShieldCheck },
            { id: "activity" as ProfileTab, label: "Timeline", icon: Clock, count: activitiesList.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      active ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: SKILLS MANAGEMENT (Requirements 3 & 12) */}
        {/* ============================================================ */}
        {activeTab === "skills" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Dynamic Skill Profile</span>
                  <Badge variant="blue">{skillsList.length} total</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your skills evolve continuously. Add new competencies as you complete courses, projects, and certifications.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingSkill(null);
                  setNewSkill({ name: "", category: "Programming", proficiency: "intermediate", experienceYears: 1 });
                  setSkillModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Skill
              </Button>
            </div>

            {/* Search and Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search skills by name..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={skillCategoryFilter}
                onChange={(e) => setSkillCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills Grid */}
            {filteredSkills.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8">
                <Sparkles className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No skills match your search</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Add your technical and soft skills to strengthen your CareerPilot analysis and unlock tailored career matches.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSkillSearch("");
                    setSkillCategoryFilter("all");
                    setSkillModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Your First Skill
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSkills.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-4.5 hover:border-slate-600 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                            {s.name}
                          </h4>
                          <span className="text-[11px] text-slate-400">{s.category}</span>
                        </div>
                        <Badge
                          variant={
                            s.proficiency === "expert"
                              ? "purple"
                              : s.proficiency === "advanced"
                              ? "emerald"
                              : s.proficiency === "intermediate"
                              ? "blue"
                              : "yellow"
                          }
                          className="capitalize text-[10px]"
                        >
                          {s.proficiency}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {s.experienceYears ? `${s.experienceYears}y exp` : "Hands-on experience"}
                        </span>
                        <span className="capitalize text-slate-500">Source: {s.source}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Updated {formatDate(s.lastUpdated)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSkill(s);
                            setNewSkill({
                              name: s.name,
                              category: s.category,
                              proficiency: s.proficiency,
                              experienceYears: s.experienceYears || 1,
                            });
                            setSkillModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Edit skill"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "skill",
                              id: s.id,
                              title: `skill "${s.name}"`,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Delete skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: EDUCATION (Requirement 3) */}
        {/* ============================================================ */}
        {activeTab === "education" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Education History</span>
                  <Badge variant="blue">{educationList.length}</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Degrees, institutions, majors, and relevant coursework.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingEdu(null);
                  setEduForm({
                    institution: "",
                    degree: "",
                    fieldOfStudy: "",
                    startYear: new Date().getFullYear() - 3,
                    endYear: new Date().getFullYear() + 1,
                    grade: "",
                    coursework: "",
                  });
                  setEduModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Education
              </Button>
            </div>

            {educationList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8">
                <GraduationCap className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No education records added</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add your college, university, or degrees.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {educationList.map((edu) => (
                  <div
                    key={edu.id}
                    className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{edu.institution}</h4>
                        <p className="text-sm text-blue-300 font-medium">
                          {edu.degree} in {edu.fieldOfStudy}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                          <span>
                            {edu.startYear} – {edu.endYear}
                          </span>
                          {edu.grade && <span>• Grade: {edu.grade}</span>}
                        </div>
                        {edu.coursework && edu.coursework.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {edu.coursework.map((c) => (
                              <span
                                key={c}
                                className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md text-slate-300"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingEdu(edu);
                          setEduForm({
                            institution: edu.institution,
                            degree: edu.degree,
                            fieldOfStudy: edu.fieldOfStudy,
                            startYear: edu.startYear,
                            endYear: edu.endYear,
                            grade: edu.grade || "",
                            coursework: edu.coursework?.join(", ") || "",
                          });
                          setEduModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDeleteConfirm({
                            type: "education",
                            id: edu.id,
                            title: `education record at ${edu.institution}`,
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PROJECTS (Requirement 5) */}
        {/* ============================================================ */}
        {activeTab === "projects" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Projects Portfolio</span>
                  <Badge variant="blue">{projectsList.length}</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showcase projects that demonstrate your practical skills and engineering capabilities.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingProj(null);
                  setProjForm({
                    name: "",
                    description: "",
                    technologies: "",
                    role: "Developer",
                    githubUrl: "",
                    liveUrl: "",
                    startDate: new Date().toISOString().split("T")[0],
                    endDate: "",
                    status: "completed",
                    skills: "",
                  });
                  setProjModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Project
              </Button>
            </div>

            {projectsList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8">
                <FolderGit2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No projects added yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Adding projects gives the AI strong signals about your hands-on coding and stack experience.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectsList.map((p) => (
                  <Card key={p.id} className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-base font-bold text-white">{p.name}</h4>
                          <span className="text-xs text-slate-400">{p.role}</span>
                        </div>
                        <Badge
                          variant={
                            p.status === "completed"
                              ? "emerald"
                              : p.status === "in-progress"
                              ? "blue"
                              : "yellow"
                          }
                          className="capitalize text-[10px]"
                        >
                          {p.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-3 mb-4">{p.description}</p>

                      {p.technologies && p.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {p.technologies.map((t) => (
                            <span
                              key={t}
                              className="text-[11px] bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md text-blue-300 font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        {p.githubUrl && (
                          <a
                            href={p.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <GitBranch className="w-3.5 h-3.5" /> Code
                          </a>
                        )}
                        {p.liveUrl && (
                          <a
                            href={p.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Demo
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingProj(p);
                            setProjForm({
                              name: p.name,
                              description: p.description,
                              technologies: p.technologies?.join(", ") || "",
                              role: p.role,
                              githubUrl: p.githubUrl || "",
                              liveUrl: p.liveUrl || "",
                              startDate: p.startDate,
                              endDate: p.endDate || "",
                              status: p.status,
                              skills: p.skills?.join(", ") || "",
                            });
                            setProjModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "project",
                              id: p.id,
                              title: `project "${p.name}"`,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: EXPERIENCE (Requirement 6) */}
        {/* ============================================================ */}
        {activeTab === "experience" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Work & Practical Experience</span>
                  <Badge variant="blue">{experienceList.length}</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Internships, freelance, research, open-source, or part-time work.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingExp(null);
                  setExpForm({
                    type: "internship",
                    organization: "",
                    position: "",
                    description: "",
                    startDate: new Date().toISOString().split("T")[0],
                    endDate: "",
                    isCurrent: false,
                    technologies: "",
                    achievements: "",
                  });
                  setExpModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Experience
              </Button>
            </div>

            {experienceList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8">
                <Briefcase className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No experience entries</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Add internships, research fellowships, or freelance contracts.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {experienceList.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-white">{exp.position}</h4>
                          <Badge variant="purple" className="capitalize text-[10px]">
                            {exp.type}
                          </Badge>
                          {exp.isCurrent && (
                            <Badge variant="emerald" className="text-[10px]">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 font-medium">{exp.organization}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate || "Present"}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-slate-300 mt-2">{exp.description}</p>
                        )}
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {exp.technologies.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md text-slate-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-start">
                      <button
                        onClick={() => {
                          setEditingExp(exp);
                          setExpForm({
                            type: exp.type,
                            organization: exp.organization,
                            position: exp.position,
                            description: exp.description,
                            startDate: exp.startDate,
                            endDate: exp.endDate || "",
                            isCurrent: exp.isCurrent,
                            technologies: exp.technologies?.join(", ") || "",
                            achievements: exp.achievements?.join("\n") || "",
                          });
                          setExpModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: "experience",
                            id: exp.id,
                            title: `experience "${exp.position} at ${exp.organization}"`,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: CERTIFICATIONS (Requirement 7) */}
        {/* ============================================================ */}
        {activeTab === "certifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Certifications & Credentials</span>
                  <Badge variant="blue">{certificationsList.length}</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Professional certifications contribute directly to your verified skill readiness.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingCert(null);
                  setCertForm({
                    name: "",
                    issuingOrganization: "",
                    issueDate: new Date().toISOString().split("T")[0],
                    credentialId: "",
                    credentialUrl: "",
                    relatedSkills: "",
                  });
                  setCertModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Certification
              </Button>
            </div>

            {certificationsList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8">
                <Award className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No certifications recorded</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Add certifications from IBM SkillsBuild, AWS, Google, Coursera, etc.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificationsList.map((cert) => (
                  <Card key={cert.id} className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="text-sm font-bold text-white">{cert.name}</h4>
                        <Badge variant="yellow" className="text-[10px]">
                          Certified
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{cert.issuingOrganization}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Issued: {cert.issueDate}</p>

                      {cert.relatedSkills && cert.relatedSkills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {cert.relatedSkills.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-blue-900/30 border border-blue-700/40 px-2 py-0.5 rounded text-blue-300"
                            >
                              +{s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                      {cert.credentialUrl ? (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Verify Credential
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {cert.credentialId ? `ID: ${cert.credentialId}` : ""}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCert(cert);
                            setCertForm({
                              name: cert.name,
                              issuingOrganization: cert.issuingOrganization,
                              issueDate: cert.issueDate,
                              credentialId: cert.credentialId || "",
                              credentialUrl: cert.credentialUrl || "",
                              relatedSkills: cert.relatedSkills?.join(", ") || "",
                            });
                            setCertModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "certification",
                              id: cert.id,
                              title: `certification "${cert.name}"`,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: ACHIEVEMENTS (Requirement 4) */}
        {/* ============================================================ */}
        {activeTab === "achievements" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Chronological Achievements</span>
                  <Badge variant="blue">{achievementsList.length}</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hackathon wins, publications, scholarships, leadership awards, and competitions.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingAch(null);
                  setAchForm({
                    title: "",
                    description: "",
                    date: new Date().toISOString().split("T")[0],
                    issuingOrganization: "",
                    credentialUrl: "",
                    skills: "",
                    tags: "",
                  });
                  setAchModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Achievement
              </Button>
            </div>

            {achievementsList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8">
                <TrendingUp className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No achievements recorded</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Add hackathons, coding contests, academic awards, or leadership honors.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {achievementsList.map((ach) => (
                  <div
                    key={ach.id}
                    className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                          <span className="text-xs text-slate-500">• {ach.date}</span>
                        </div>
                        {ach.issuingOrganization && (
                          <p className="text-xs text-slate-400 mt-0.5">{ach.issuingOrganization}</p>
                        )}
                        <p className="text-xs text-slate-300 mt-1.5">{ach.description}</p>

                        {ach.tags && ach.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ach.tags.map((t) => (
                              <Badge key={t} variant="slate" className="text-[10px]">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-start">
                      <button
                        onClick={() => {
                          setEditingAch(ach);
                          setAchForm({
                            title: ach.title,
                            description: ach.description,
                            date: ach.date,
                            issuingOrganization: ach.issuingOrganization || "",
                            credentialUrl: ach.credentialUrl || "",
                            skills: ach.skills?.join(", ") || "",
                            tags: ach.tags?.join(", ") || "",
                          });
                          setAchModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: "achievement",
                            id: ach.id,
                            title: `achievement "${ach.title}"`,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 7: RESUME UPLOAD & PARSING (Requirement 8 & 22) */}
        {/* ============================================================ */}
        {activeTab === "resume" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Resume & Documents</span>
                  <Badge variant="blue">{resumesList.length}</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload PDF or DOCX files. CareerPilot extracts skills and milestones without blindly overwriting your verified profile.
                </p>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/60 rounded-3xl p-8 text-center bg-slate-900/40 transition-all">
              <input
                type="file"
                id="resume-file-input"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={resumeUploading}
              />
              <label
                htmlFor="resume-file-input"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 hover:scale-105 transition-transform">
                  {resumeUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-white">
                  {resumeUploading ? "Analyzing Document with AI..." : "Click to Upload Resume (PDF / DOCX)"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Support for PDF and DOCX files up to 8MB. Analyzed insights can be previewed and confirmed.
                </p>
              </label>
            </div>

            {/* Uploaded Resumes List */}
            {resumesList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Uploaded Documents
                </h3>
                {resumesList.map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{r.fileName}</h4>
                          <Badge variant="emerald" className="text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Analyzed
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Uploaded on {formatDate(r.uploadDate)} • {(r.fileSize / 1024).toFixed(1)} KB • {r.fileType.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.analysis && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setExtractedResumeData(r.analysis || null);
                            setSelectedImportSkills(r.analysis?.extractedSkills?.technical || []);
                            setResumeImportModalOpen(true);
                          }}
                        >
                          Review Extracted Data
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDeleteConfirm({
                            type: "resume",
                            id: r.id,
                            title: `resume document "${r.fileName}"`,
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 8: CAREER PREFERENCES */}
        {/* ============================================================ */}
        {activeTab === "preferences" && (
          <Card className="p-6 md:p-8 animate-fade-in max-w-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Career Preferences</h2>
            <p className="text-xs text-slate-400 mb-6">
              Changing your target career intelligently marks AI analysis as stale so you can re-align recommendations.
            </p>

            <form onSubmit={handleSaveBasicInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Primary Target Role
                </label>
                <select
                  value={prefForm.targetRole}
                  onChange={(e) => setPrefForm({ ...prefForm, targetRole: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CAREER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Preferred Industry
                </label>
                <select
                  value={prefForm.preferredIndustry}
                  onChange={(e) => setPrefForm({ ...prefForm, preferredIndustry: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Work Arrangement
                  </label>
                  <select
                    value={prefForm.preferredWorkType}
                    onChange={(e) => setPrefForm({ ...prefForm, preferredWorkType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-site</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Preferred Location
                  </label>
                  <input
                    type="text"
                    value={prefForm.preferredLocation}
                    onChange={(e) => setPrefForm({ ...prefForm, preferredLocation: e.target.value })}
                    placeholder="e.g. San Francisco or Remote"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" disabled={isLoading}>
                  Save Career Preferences
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 9: PERSONAL INFO */}
        {/* ============================================================ */}
        {activeTab === "basic" && (
          <Card className="p-6 md:p-8 animate-fade-in max-w-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Personal Information</h2>
            <p className="text-xs text-slate-400 mb-6">
              Update your name, contact information, and public bio.
            </p>

            <form onSubmit={handleSaveBasicInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={personalForm.fullName}
                  onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={personalForm.phone}
                    onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={personalForm.location}
                    onChange={(e) => setPersonalForm({ ...personalForm, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short Bio / Career Summary
                </label>
                <textarea
                  rows={3}
                  value={personalForm.bio}
                  onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                  placeholder="Tell CareerPilot about your aspirations..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" disabled={isLoading}>
                  Save Personal Information
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 10: ACTIVITY TIMELINE (Requirement 18) */}
        {/* ============================================================ */}
        {activeTab === "activity" && (
          <div className="space-y-4 animate-fade-in max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Career Evolution Timeline</span>
                <Badge variant="blue">{activitiesList.length} events</Badge>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every milestone, new skill, and project creates a permanent timeline of your student career growth.
              </p>
            </div>

            {activitiesList.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8">
                <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">No activity logged yet</h3>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/60">
                {activitiesList.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-4">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 shadow" />
                    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-4 flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{act.title}</span>
                        <span className="text-slate-500">{formatDate(act.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-300">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 11: ACCOUNT SECURITY & CONNECTED ACCOUNTS (Requirement 15) */}
        {/* ============================================================ */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-fade-in max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Account Security &amp; Connected Accounts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your authentication methods and linked sign-in providers.
              </p>
            </div>

            {/* Connected Accounts Card */}
            <Card className="p-6 md:p-8 bg-[#1e293b]/90 border border-slate-700/60 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Connected Accounts
              </h3>

              <div className="space-y-4">
                {/* Google Provider Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <GoogleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Google</span>
                        {fullProfile?.user.googleId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Connected
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            Not connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fullProfile?.user.googleId
                          ? `Linked with Google (${fullProfile.user.email})`
                          : "Sign in with one click using your Google account"}
                      </p>
                    </div>
                  </div>

                  <div>
                    {fullProfile?.user.googleId ? (
                      <div className="flex flex-col items-end gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleDisconnectGoogle}
                          disabled={
                            disconnectingGoogle ||
                            fullProfile?.user.authProvider === "google"
                          }
                          className="text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 border-red-500/20 disabled:opacity-50"
                        >
                          {disconnectingGoogle ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Disconnecting...
                            </>
                          ) : (
                            "Disconnect Google"
                          )}
                        </Button>
                        {fullProfile?.user.authProvider === "google" && (
                          <span className="text-[10px] text-amber-400/90 max-w-[220px] text-right">
                            Set a password below before disconnecting Google to prevent losing account access.
                          </span>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleConnectGoogle}
                        className="text-xs bg-white hover:bg-slate-100 text-slate-800 font-semibold shadow-md"
                        leftIcon={<GoogleIcon className="w-3.5 h-3.5" />}
                      >
                        Connect Google
                      </Button>
                    )}
                  </div>
                </div>

                {/* Email & Password Provider Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Email &amp; Password</span>
                        {fullProfile?.user.authProvider === "password" ||
                        fullProfile?.user.authProvider === "google+password" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Enabled
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Not configured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fullProfile?.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Password Management Card */}
            <Card className="p-6 md:p-8 bg-[#1e293b]/90 border border-slate-700/60 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                {fullProfile?.user.authProvider === "google" ? "Set Account Password" : "Change Password"}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                {fullProfile?.user.authProvider === "google"
                  ? "Create a password to enable signing in with either Google or your email address."
                  : "Keep your account secure with a strong password (minimum 6 characters)."}
              </p>

              <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                {fullProfile?.user.authProvider !== "google" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="Enter current password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Confirm new password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-2 rounded-xl text-xs"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Saving...
                      </>
                    ) : fullProfile?.user.authProvider === "google" ? (
                      "Set Password"
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT SKILL */}
        {/* ============================================================ */}
        {skillModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  {editingSkill ? "Edit Skill" : "Add New Skill"}
                </h3>
                <button
                  onClick={() => setSkillModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSkill} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    placeholder="e.g. Python, Docker, PyTorch"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Common skill suggestions */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COMMON_SKILLS.slice(0, 5).map((cs) => (
                      <button
                        key={cs}
                        type="button"
                        onClick={() => setNewSkill({ ...newSkill, name: cs })}
                        className="text-[10px] bg-slate-800 text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700/60"
                      >
                        +{cs}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Programming">Programming</option>
                    <option value="AI/ML">AI / Machine Learning</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Database">Database & SQL</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Soft Skills">Soft Skills & Leadership</option>
                    <option value="Certifications">Certifications</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Proficiency Level
                    </label>
                    <select
                      value={newSkill.proficiency}
                      onChange={(e) =>
                        setNewSkill({
                          ...newSkill,
                          proficiency: e.target.value as SkillProficiency,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Years Experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={newSkill.experienceYears}
                      onChange={(e) =>
                        setNewSkill({ ...newSkill, experienceYears: Number(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSkillModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {editingSkill ? "Update Skill" : "Add to Profile"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT EDUCATION */}
        {/* ============================================================ */}
        {eduModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  {editingEdu ? "Edit Education" : "Add Education Record"}
                </h3>
                <button onClick={() => setEduModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdu} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Institution / University
                  </label>
                  <input
                    type="text"
                    required
                    value={eduForm.institution}
                    onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Degree
                    </label>
                    <input
                      type="text"
                      required
                      value={eduForm.degree}
                      onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                      placeholder="B.S. / M.S."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      required
                      value={eduForm.fieldOfStudy}
                      onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                      placeholder="Computer Science"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Start
                    </label>
                    <input
                      type="number"
                      value={eduForm.startYear}
                      onChange={(e) => setEduForm({ ...eduForm, startYear: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      End / Expected
                    </label>
                    <input
                      type="number"
                      value={eduForm.endYear}
                      onChange={(e) => setEduForm({ ...eduForm, endYear: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Grade / GPA
                    </label>
                    <input
                      type="text"
                      value={eduForm.grade}
                      onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                      placeholder="3.8 / 4.0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Relevant Coursework (comma separated)
                  </label>
                  <input
                    type="text"
                    value={eduForm.coursework}
                    onChange={(e) => setEduForm({ ...eduForm, coursework: e.target.value })}
                    placeholder="Algorithms, Distributed Systems, ML"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEduModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Education
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT PROJECT */}
        {/* ============================================================ */}
        {projModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  {editingProj ? "Edit Project" : "Add Project"}
                </h3>
                <button onClick={() => setProjModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProj} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={projForm.name}
                    onChange={(e) => setProjForm({ ...projForm, name: e.target.value })}
                    placeholder="e.g. Distributed Task Queue"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Description & Impact
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={projForm.description}
                    onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                    placeholder="What did you build, what challenges did you solve, and what impact did it have?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Technologies Used (comma separated)
                  </label>
                  <input
                    type="text"
                    value={projForm.technologies}
                    onChange={(e) => setProjForm({ ...projForm, technologies: e.target.value })}
                    placeholder="React, TypeScript, Go, Docker"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={projForm.githubUrl}
                      onChange={(e) => setProjForm({ ...projForm, githubUrl: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Live Demo URL
                    </label>
                    <input
                      type="url"
                      value={projForm.liveUrl}
                      onChange={(e) => setProjForm({ ...projForm, liveUrl: e.target.value })}
                      placeholder="https://demo.app"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setProjModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Project
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT EXPERIENCE */}
        {/* ============================================================ */}
        {expModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  {editingExp ? "Edit Experience" : "Add Experience"}
                </h3>
                <button onClick={() => setExpModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Position / Role
                    </label>
                    <input
                      type="text"
                      required
                      value={expForm.position}
                      onChange={(e) => setExpForm({ ...expForm, position: e.target.value })}
                      placeholder="e.g. Software Engineer Intern"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      required
                      value={expForm.organization}
                      onChange={(e) => setExpForm({ ...expForm, organization: e.target.value })}
                      placeholder="e.g. TechCorp"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Experience Type
                  </label>
                  <select
                    value={expForm.type}
                    onChange={(e) =>
                      setExpForm({
                        ...expForm,
                        type: e.target.value as ExperienceRecord["type"],
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                  >
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                    <option value="part-time">Part-time</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="research">Research Assistant</option>
                    <option value="full-time">Full-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Description & Responsibilities
                  </label>
                  <textarea
                    rows={3}
                    value={expForm.description}
                    onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                    placeholder="Key contributions and achievements..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={expForm.startDate}
                      onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      disabled={expForm.isCurrent}
                      value={expForm.endDate}
                      onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-current-exp"
                    checked={expForm.isCurrent}
                    onChange={(e) => setExpForm({ ...expForm, isCurrent: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="is-current-exp" className="text-xs text-slate-300">
                    I currently work in this role
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setExpModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Experience
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT CERTIFICATION */}
        {/* ============================================================ */}
        {certModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  {editingCert ? "Edit Certification" : "Add Certification"}
                </h3>
                <button onClick={() => setCertModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCert} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Certification Name
                  </label>
                  <input
                    type="text"
                    required
                    value={certForm.name}
                    onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                    placeholder="e.g. AWS Certified Developer"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={certForm.issuingOrganization}
                    onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={certForm.issueDate}
                      onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Credential ID
                    </label>
                    <input
                      type="text"
                      value={certForm.credentialId}
                      onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                      placeholder="Optional"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Related Skills (auto-added to skill profile)
                  </label>
                  <input
                    type="text"
                    value={certForm.relatedSkills}
                    onChange={(e) => setCertForm({ ...certForm, relatedSkills: e.target.value })}
                    placeholder="e.g. Cloud, AWS, Lambda"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setCertModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Certification
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT ACHIEVEMENT */}
        {/* ============================================================ */}
        {achModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">
                  {editingAch ? "Edit Achievement" : "Add Achievement"}
                </h3>
                <button onClick={() => setAchModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Achievement Title
                  </label>
                  <input
                    type="text"
                    required
                    value={achForm.title}
                    onChange={(e) => setAchForm({ ...achForm, title: e.target.value })}
                    placeholder="e.g. Hackathon 1st Place Winner"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={achForm.description}
                    onChange={(e) => setAchForm({ ...achForm, description: e.target.value })}
                    placeholder="What did you achieve and what was the scope?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={achForm.date}
                      onChange={(e) => setAchForm({ ...achForm, date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={achForm.issuingOrganization}
                      onChange={(e) => setAchForm({ ...achForm, issuingOrganization: e.target.value })}
                      placeholder="e.g. Major League Hacking"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setAchModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Achievement
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: RESUME REVIEW & IMPORT CONFIRMATION (Requirement 8 & 22) */}
        {/* ============================================================ */}
        {resumeImportModalOpen && extractedResumeData && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-scale-in max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      We found these new details in your resume
                    </h3>
                    <p className="text-xs text-slate-400">
                      Confirm which items you want to import into your live profile.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResumeImportModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Skills Section */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Extracted Skills ({extractedResumeData.extractedSkills?.technical?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImportSkills(
                          extractedResumeData.extractedSkills?.technical || []
                        )
                      }
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-700/50">
                    {(extractedResumeData.extractedSkills?.technical || []).map((sk: string) => {
                      const isSelected = selectedImportSkills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedImportSkills(selectedImportSkills.filter((x) => x !== sk));
                            } else {
                              setSelectedImportSkills([...selectedImportSkills, sk]);
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? "bg-blue-600/30 border-blue-500 text-blue-300"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {sk}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extracted Projects */}
                {extractedResumeData.projects?.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Extracted Projects
                    </span>
                    <div className="space-y-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-700/50">
                      {extractedResumeData.projects.map((pr: string, idx: number) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-blue-400 font-bold">•</span>
                          <span>{pr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Certifications */}
                {extractedResumeData.certifications?.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Extracted Certifications
                    </span>
                    <div className="space-y-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-700/50">
                      {extractedResumeData.certifications.map((ct: string, idx: number) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-yellow-400 font-bold">•</span>
                          <span>{ct}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setResumeImportModalOpen(false)}
                >
                  Discard
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={handleImportResumeConfirmed}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Import Selected into Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: DELETION CONFIRMATION DIALOG (Requirement 10) */}
        {/* ============================================================ */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-red-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-in text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Removal</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently remove {deleteConfirm.title}? This will also update your AI analysis.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExecuteDelete}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
