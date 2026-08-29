import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

function getBarColor(value: number, customColor?: string): string {
  if (customColor) return customColor;
  if (value >= 80) return "bg-emerald-500";
  if (value >= 60) return "bg-blue-500";
  if (value >= 40) return "bg-yellow-500";
  if (value >= 20) return "bg-orange-500";
  return "bg-red-500";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  color,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = getBarColor(percentage, color);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm text-slate-400">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-white">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-slate-700/60 rounded-full overflow-hidden", sizeMap[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
