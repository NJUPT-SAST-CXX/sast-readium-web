"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantClasses = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = "md",
  variant = "default",
  className,
}: ProgressBarProps) {
  const percentage = useMemo(() => {
    const p = Math.min(100, Math.max(0, (value / max) * 100));
    return Math.round(p);
  }, [value, max]);

  // Auto-determine variant based on percentage if not specified
  const effectiveVariant = useMemo(() => {
    if (variant !== "default") return variant;
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "info";
    if (percentage >= 25) return "warning";
    return "danger";
  }, [variant, percentage]);

  return (
    <div className={cn("my-3", className)}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="font-medium tabular-nums">{percentage}%</span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        className={cn(
          "w-full rounded-full bg-muted overflow-hidden",
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[effectiveVariant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
