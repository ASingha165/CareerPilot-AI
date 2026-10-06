import Link from "next/link";
import {
  BrainCircuit,
  FileText,
  GitBranch,
  Target,
  Trophy,
  Map,
  BookOpen,
  Mic,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Resume Analyzer",
    description:
      "Upload your resume and get AI-powered analysis of your skills, strengths, gaps, and actionable improvement suggestions.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Target,
    title: "Career Path Matching",
    description:
      "Discover which career paths align with your profile. Get match percentages, explanations, and a personalized fit score.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: Trophy,
    title: "Job Readiness Score",
    description:
      "Get an explainable readiness score across 7 dimensions — from technical skills to interview preparedness.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    icon: Map,
    title: "Skill Gap Roadmap",
    description:
      "Visualize exactly what skills you need to build, in what order, with estimated timelines and project ideas.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: BookOpen,
    title: "IBM SkillsBuild Resources",
    description:
      "Get curated learning recommendations matched to your specific skill gaps and career goals.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: GitBranch,
    title: "GitHub Analyzer",
    description:
      "Connect your GitHub to analyze your real-world project experience and technical stack from public repositories.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    icon: Mic,
    title: "AI Mock Interviewer",
    description:
      "Practice with role-specific interview questions and receive detailed feedback on every answer you give.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  {
    icon: BrainCircuit,
    title: "Progress Tracking",
    description:
      "Track your readiness score over time, review past interview sessions, and see your improvement clearly.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
];

const steps = [
  { step: "01", title: "Tell us about yourself", desc: "Quick career onboarding — takes 3 minutes" },
  { step: "02", title: "Upload your resume", desc: "AI extracts and analyzes your profile" },
  { step: "03", title: "See your career fit", desc: "Match scores with explanation for multiple paths" },
  { step: "04", title: "Get your roadmap", desc: "Personalized learning plan with timelines" },
  { step: "05", title: "Practice interviews", desc: "AI-generated questions with real feedback" },
];

const stats = [
  { label: "Career Paths Analyzed", value: "9+" },
  { label: "Skills Tracked", value: "50+" },
  { label: "Interview Question Types", value: "4" },
  { label: "Readiness Dimensions", value: "7" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CareerPilot</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <Link href="/login" className="hover:text-white text-slate-300 font-medium transition-colors">
                Sign In
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="md:hidden text-xs text-slate-300 hover:text-white font-medium px-2 py-1"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                Sign Up <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4" />
            Living Student Career Profile · Powered by Gemini AI
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Your living AI
            <br />
            <span className="text-gradient">career copilot</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Maintain an evolving profile of your skills, projects, and achievements.
            CareerPilot continuously re-analyzes your growth into personalized career guidance, skill gaps, and interview prep.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-xl shadow-blue-500/25"
            >
              Start Your Living Profile
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Demo preview card */}
          <div className="relative max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-6 border border-slate-700/50 text-left">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">CareerPilot Dashboard</div>
                  <div className="text-sm text-slate-400">Good morning, Priya 👋</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-400">78</div>
                  <div className="text-xs text-slate-400 mt-1">Career Readiness</div>
                  <div className="text-xs text-emerald-400 mt-1">↑ +6 this week</div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-400">🤖</div>
                  <div className="text-xs text-white font-medium mt-1">AI/ML Engineer</div>
                  <div className="text-xs text-slate-400 mt-1">91% match</div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <div className="text-2xl font-bold text-yellow-400">4</div>
                  <div className="text-xs text-slate-400 mt-1">Skill Gaps</div>
                  <div className="text-xs text-orange-400 mt-1">Critical skills</div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { skill: "Python", level: 72, color: "bg-blue-500" },
                  { skill: "Machine Learning", level: 55, color: "bg-yellow-500" },
                  { skill: "Deep Learning", level: 35, color: "bg-orange-500" },
                  { skill: "MLOps", level: 10, color: "bg-red-500" },
                ].map((item) => (
                  <div key={item.skill} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-32 shrink-0">{item.skill}</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.level}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{item.level}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need to launch your career
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              CareerPilot combines resume analysis, AI career matching, skill gap tracking,
              and mock interviews — all in one intelligent platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`${feature.bg} ${feature.border} border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
                >
                  <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 text-lg">
              From onboarding to interview-ready in minutes
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={step.step}
                className="flex items-start gap-6 glass rounded-2xl p-6"
              >
                <div className="shrink-0 w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">{step.step}</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white mb-1">{step.title}</div>
                  <div className="text-sm text-slate-400">{step.desc}</div>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-slate-600 mt-1 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-12 text-center border border-blue-500/20 glow-blue">
            <h2 className="text-4xl font-bold text-white mb-6">
              Not just career advice.
              <br />
              <span className="text-gradient">A personalized action plan.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              CareerPilot analyzes your actual resume, projects, and skills to give you
              a step-by-step roadmap that tells you exactly what to learn, build, and practice
              to land your target role.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              {[
                "AI-powered, not just templates",
                "Explains every recommendation",
                "Personalized to your actual skills",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {point}
                </div>
              ))}
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105"
            >
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">CareerPilot</span>
          </div>
          <div className="text-sm text-slate-500">
            CareerPilot is an AI guidance tool. Scores and recommendations are for educational purposes only.
          </div>
          <div className="text-sm text-slate-500">
            Built for hackathon demo purposes
          </div>
        </div>
      </footer>
    </div>
  );
}
