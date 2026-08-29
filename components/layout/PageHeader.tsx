import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-8", className)}>
      <div>
        {badge && (
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {badge}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-slate-400 mt-1 text-sm md:text-base">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
