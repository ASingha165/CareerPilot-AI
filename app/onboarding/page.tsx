"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BrainCircuit,
  ArrowRight,
  ArrowLeft,
  User,
  GraduationCap,
  Lightbulb,
  Target,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { useCareerStore } from "@/lib/store/career-store";
import { INDUSTRIES, CAREER_ROLES, COMMON_SKILLS } from "@/lib/constants/careers";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CareerProfile, ExperienceLevel } from "@/lib/types";

// ---- Zod schemas per step ----

const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  experienceLevel: z.enum(["student", "fresher", "intern", "entry"]),
});

const step2Schema = z.object({
  education: z.string().min(3, "Please describe your education"),
  degree: z.string().min(2, "Please enter your degree"),
  branch: z.string().min(2, "Please enter your branch/major"),
  graduationYear: z.coerce
    .number()
    .min(2020, "Year must be 2020 or later")
    .max(2030, "Year must be 2030 or earlier"),
});

const step3Schema = z.object({
  careerGoals: z.string().min(10, "Please describe your career goals (at least 10 characters)"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ---- Multi-select chip component ----

function ChipSelect({
  options,
  selected,
  onChange,
  maxSelect,
  allowCustom,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  maxSelect?: number;
  allowCustom?: boolean;
  placeholder?: string;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      if (maxSelect && selected.length >= maxSelect) return;
      onChange([...selected, opt]);
    }
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      if (!maxSelect || selected.length < maxSelect) {
        onChange([...selected, trimmed]);
        setCustom("");
      }
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
              selected.includes(opt)
                ? "bg-blue-600/30 border-blue-500 text-blue-300"
                : "bg-slate-800/60 border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-300"
            )}
          >
            {selected.includes(opt) && <span className="mr-1">✓</span>}
            {opt}
          </button>
        ))}
      </div>

      {/* Selected custom items */}
      {selected.filter((s) => !options.includes(s)).map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border bg-purple-600/20 border-purple-500/50 text-purple-300 mr-2 mb-2"
        >
          {s}
          <button
            type="button"
            onClick={() => onChange(selected.filter((x) => x !== s))}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {allowCustom && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder={placeholder || "Add custom..."}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addCustom}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Step components ----

function StepPersonal({
  onNext,
}: {
  onNext: (data: Step1Data) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { experienceLevel: "student" },
  });

  const expLevel = watch("experienceLevel");

  const levels: { value: ExperienceLevel; label: string; desc: string }[] = [
    { value: "student", label: "Student", desc: "Currently enrolled in college/university" },
    { value: "fresher", label: "Fresh Graduate", desc: "Recently graduated, no full-time experience" },
    { value: "intern", label: "Interned", desc: "Completed one or more internships" },
    { value: "entry", label: "Entry Level", desc: "1-2 years of work experience" },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Your full name
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Priya Sharma"
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Where are you right now?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {levels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setValue("experienceLevel", level.value)}
              className={cn(
                "text-left p-4 rounded-xl border transition-all",
                expLevel === level.value
                  ? "bg-blue-600/20 border-blue-500 text-white"
                  : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-slate-500"
              )}
            >
              <div className="font-semibold text-sm mb-0.5">{level.label}</div>
              <div className="text-xs text-slate-500">{level.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" rightIcon={<ArrowRight className="w-5 h-5" />}>
        Continue
      </Button>
    </form>
  );
}

function StepEducation({
  onNext,
  onBack,
}: {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { graduationYear: 2025 },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Institution / University
          </label>
          <input
            {...register("education")}
            placeholder="e.g. IIT Bombay, Mumbai University"
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {errors.education && (
            <p className="text-red-400 text-xs mt-1">{errors.education.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Degree
          </label>
          <input
            {...register("degree")}
            placeholder="e.g. B.Tech, B.Sc, BCA"
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {errors.degree && (
            <p className="text-red-400 text-xs mt-1">{errors.degree.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Branch / Major
          </label>
          <input
            {...register("branch")}
            placeholder="e.g. Computer Science, Data Science"
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {errors.branch && (
            <p className="text-red-400 text-xs mt-1">{errors.branch.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Graduation Year
          </label>
          <input
            type="number"
            {...register("graduationYear")}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          {errors.graduationYear && (
            <p className="text-red-400 text-xs mt-1">{errors.graduationYear.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack} leftIcon={<ArrowLeft className="w-5 h-5" />}>
          Back
        </Button>
        <Button type="submit" size="lg" className="flex-1" rightIcon={<ArrowRight className="w-5 h-5" />}>
          Continue
        </Button>
      </div>
    </form>
  );
}

function StepSkills({
  onNext,
  onBack,
  skills,
  interests,
  industries,
  onChange,
}: {
  onNext: () => void;
  onBack: () => void;
  skills: string[];
  interests: string[];
  industries: string[];
  onChange: (field: string, val: string[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Current Skills
          <span className="text-slate-500 font-normal ml-2">(select all that apply)</span>
        </label>
        <ChipSelect
          options={COMMON_SKILLS}
          selected={skills}
          onChange={(val) => onChange("currentSkills", val)}
          allowCustom
          placeholder="Add a skill..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Interests
        </label>
        <ChipSelect
          options={["AI & Machine Learning", "Web Development", "Mobile Apps", "Data Science", "Cybersecurity", "Cloud Computing", "Game Development", "Blockchain", "Open Source", "Startups"]}
          selected={interests}
          onChange={(val) => onChange("interests", val)}
          allowCustom
          placeholder="Add an interest..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Preferred Industries
        </label>
        <ChipSelect
          options={INDUSTRIES}
          selected={industries}
          onChange={(val) => onChange("preferredIndustries", val)}
          maxSelect={5}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack} leftIcon={<ArrowLeft className="w-5 h-5" />}>
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={onNext}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function StepGoals({
  onNext,
  onBack,
  targetRoles,
  onTargetRolesChange,
}: {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  targetRoles: string[];
  onTargetRolesChange: (val: string[]) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Career Goals
        </label>
        <textarea
          {...register("careerGoals")}
          rows={3}
          placeholder="e.g. I want to become an AI engineer at a product company, working on real-world ML systems..."
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
        {errors.careerGoals && (
          <p className="text-red-400 text-xs mt-1">{errors.careerGoals.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Target Job Roles
          <span className="text-slate-500 font-normal ml-2">(pick up to 3)</span>
        </label>
        <ChipSelect
          options={CAREER_ROLES}
          selected={targetRoles}
          onChange={onTargetRolesChange}
          maxSelect={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack} leftIcon={<ArrowLeft className="w-5 h-5" />}>
          Back
        </Button>
        <Button type="submit" size="lg" className="flex-1" rightIcon={<ArrowRight className="w-5 h-5" />}>
          Create My Profile
        </Button>
      </div>
    </form>
  );
}

// ---- Main Onboarding Wizard ----

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Education", icon: GraduationCap },
  { label: "Skills", icon: Lightbulb },
  { label: "Goals", icon: Target },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, setOnboardingComplete } = useCareerStore();

  const [step, setStep] = useState(0);

  // Accumulated form data across steps
  const [formData, setFormData] = useState<Partial<CareerProfile>>({
    currentSkills: [],
    interests: [],
    preferredIndustries: [],
    targetRoles: [],
    experienceLevel: "student",
  });

  const updateFormData = (update: Partial<CareerProfile>) => {
    setFormData((prev) => ({ ...prev, ...update }));
  };

  const handleStep1 = (data: Step1Data) => {
    updateFormData(data);
    setStep(1);
  };

  const handleStep2 = (data: Step2Data) => {
    updateFormData(data);
    setStep(2);
  };

  const handleStep3 = () => {
    setStep(3);
  };

  const handleStep4 = (data: Step3Data) => {
    const finalProfile: CareerProfile = {
      name: formData.name!,
      experienceLevel: formData.experienceLevel!,
      education: formData.education!,
      degree: formData.degree!,
      branch: formData.branch!,
      graduationYear: formData.graduationYear!,
      currentSkills: formData.currentSkills || [],
      interests: formData.interests || [],
      preferredIndustries: formData.preferredIndustries || [],
      targetRoles: formData.targetRoles || [],
      careerGoals: data.careerGoals,
    };

    setProfile(finalProfile);
    setOnboardingComplete(true);
    router.push("/resume");
  };

  const stepContent = [
    <StepPersonal key="s1" onNext={handleStep1} />,
    <StepEducation
      key="s2"
      onNext={handleStep2}
      onBack={() => setStep(0)}
    />,
    <StepSkills
      key="s3"
      onNext={handleStep3}
      onBack={() => setStep(1)}
      skills={formData.currentSkills || []}
      interests={formData.interests || []}
      industries={formData.preferredIndustries || []}
      onChange={(field, val) => updateFormData({ [field]: val })}
    />,
    <StepGoals
      key="s4"
      onNext={handleStep4}
      onBack={() => setStep(2)}
      targetRoles={formData.targetRoles || []}
      onTargetRolesChange={(val) => updateFormData({ targetRoles: val })}
    />,
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">CareerPilot</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                  isDone
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "bg-slate-800/60 text-slate-600 border border-slate-700/40"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-6 h-px mx-1",
                    i < step ? "bg-emerald-500/50" : "bg-slate-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-[#1e293b] border border-slate-700/50 rounded-2xl p-8 shadow-2xl animate-slide-up">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            {["Tell us about yourself", "Your education", "Skills & Interests", "Goals & Ambitions"][step]}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {[
              "This helps CareerPilot personalize everything for you",
              "Your academic background shapes your career path",
              "Select all that apply — you can always update this later",
              "What do you want to achieve? Be as specific as you like",
            ][step]}
          </p>
        </div>

        {stepContent[step]}

        <div className="mt-6 text-center text-xs text-slate-600">
          Step {step + 1} of {STEPS.length} · All data is stored locally in your browser
        </div>
      </div>
    </div>
  );
}
