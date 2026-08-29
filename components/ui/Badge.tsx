import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "purple" | "emerald" | "yellow" | "orange" | "red" | "slate";
  className?: string;
}

const variants = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  slate: "bg-slate-700/50 text-slate-400 border-slate-600/50",
};

export function Badge({ children, variant = "slate", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
