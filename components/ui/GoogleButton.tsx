"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  text?: string;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function GoogleButton({
  text = "Continue with Google",
  onClick,
  isLoading = false,
  disabled = false,
  className,
  type = "button",
}: GoogleButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick();
    } else {
      window.location.href = "/api/auth/google";
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={text}
      className={cn(
        "w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl",
        "bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm",
        "border border-slate-300/80 shadow-md hover:shadow-lg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
      ) : (
        <GoogleIcon className="w-5 h-5 shrink-0" />
      )}
      <span className="font-semibold text-slate-800 tracking-wide">{text}</span>
    </button>
  );
}
