"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BrainCircuit,
  LayoutDashboard,
  User,
  FileText,
  Target,
  Map,
  Mic,
  GitBranch,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCareerStore } from "@/lib/store/career-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/career", label: "Career Paths", icon: Target },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/interview", label: "Mock Interview", icon: Mic },
  { href: "/interview-intelligence", label: "Interview Intelligence", icon: Target },
  { href: "/github", label: "GitHub", icon: GitBranch },
  { href: "/skillsbuild", label: "IBM SkillsBuild", icon: BookOpen },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    profile,
    fullProfile,
    user,
    readinessScore,
    isAiAnalysisStale,
    completeness,
    reset,
  } = useCareerStore();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    reset();
    router.push("/login");
  };

  const displayName =
    fullProfile?.profile.personal.fullName || user?.name || profile?.name || "Student";
  const displayRole =
    fullProfile?.profile.careerPreferences.targetRoles[0] || profile?.degree || "Career Pilot";

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#1e293b] border-r border-slate-700/50 flex flex-col z-30 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">CareerPilot</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info card */}
        {(user || profile || fullProfile) && (
          <div className="px-5 py-4 border-b border-slate-700/40 bg-slate-900/40">
            <Link
              href="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 group hover:opacity-95"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                  {displayName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{displayRole}</div>
              </div>
            </Link>

            {/* Completeness & Readiness */}
            <div className="mt-3 space-y-1.5">
              {completeness && (
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Completeness</span>
                    <span className="text-blue-400 font-semibold">{completeness.overallPercentage}%</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${completeness.overallPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {readinessScore && (
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Job Readiness</span>
                    <span className="text-emerald-400 font-semibold">{readinessScore.overall}%</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${readinessScore.overall}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
              const isProfile = item.href === "/profile";
              const showStaleBadge =
                isProfile && (isAiAnalysisStale || fullProfile?.profile.isAiAnalysisStale);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    active
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {showStaleBadge && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {active && !showStaleBadge && <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-slate-700/40 flex items-center justify-between">
          <Link
            href="/profile"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>⚙️</span> Profile Settings
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href="/login"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-10 glass border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">CareerPilot</span>
            </div>
          </div>

          <Link
            href="/profile"
            className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white"
          >
            {displayName.charAt(0).toUpperCase()}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
