"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  LayoutDashboard,
  FileText,
  Target,
  Map,
  Mic,
  GitBranch,
  BookOpen,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCareerStore } from "@/lib/store/career-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/career", label: "Career Paths", icon: Target },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/interview", label: "Mock Interview", icon: Mic },
  { href: "/github", label: "GitHub", icon: GitBranch },
  { href: "/skillsbuild", label: "IBM SkillsBuild", icon: BookOpen },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, readinessScore } = useCareerStore();

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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
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

        {/* User info */}
        {profile && (
          <div className="px-6 py-4 border-b border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{profile.name}</div>
                <div className="text-xs text-slate-400 truncate">{profile.degree}</div>
              </div>
            </div>
            {readinessScore && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${readinessScore.overall}%` }}
                  />
                </div>
                <span className="text-xs text-blue-400 font-semibold shrink-0">
                  {readinessScore.overall}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    active
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom — re-onboard */}
        <div className="px-4 py-4 border-t border-slate-700/30">
          <Link
            href="/onboarding"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
          >
            <span>✏️</span> Update Profile
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-10 glass border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
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
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
