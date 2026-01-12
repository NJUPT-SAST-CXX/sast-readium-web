"use client";

import { cn } from "@/lib/utils";

export interface CardBlockProps {
  title?: string;
  icon?: React.ReactNode;
  variant?: "default" | "outlined" | "filled";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-background border shadow-sm",
  outlined: "border-2 border-dashed",
  filled: "bg-muted border-0",
};

export function CardBlock({
  title,
  icon,
  variant = "default",
  children,
  className,
}: CardBlockProps) {
  return (
    <div
      className={cn(
        "my-4 rounded-lg overflow-hidden",
        variantClasses[variant],
        className
      )}
    >
      {(title || icon) && (
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          {icon}
          {title && <span className="font-medium">{title}</span>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
