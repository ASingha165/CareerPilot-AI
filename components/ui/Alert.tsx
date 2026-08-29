import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const config = {
  info: {
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: Info,
    iconColor: "text-blue-400",
    titleColor: "text-blue-300",
  },
  success: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-300",
  },
  warning: {
    bg: "bg-yellow-500/10 border-yellow-500/20",
    icon: AlertTriangle,
    iconColor: "text-yellow-400",
    titleColor: "text-yellow-300",
  },
  error: {
    bg: "bg-red-500/10 border-red-500/20",
    icon: XCircle,
    iconColor: "text-red-400",
    titleColor: "text-red-300",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps) {
  const c = config[variant];
  const Icon = c.icon;

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-xl border text-sm",
        c.bg,
        className
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", c.iconColor)} />
      <div className="flex-1">
        {title && (
          <div className={cn("font-semibold mb-1", c.titleColor)}>{title}</div>
        )}
        <div className="text-slate-300">{children}</div>
      </div>
    </div>
  );
}
