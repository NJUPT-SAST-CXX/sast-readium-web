"use client";

import { cn } from "@/lib/utils";

export interface ColumnsLayoutProps {
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

const gapClasses = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const columnClasses = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

export function ColumnsLayout({
  columns = 2,
  gap = "md",
  children,
  className,
}: ColumnsLayoutProps) {
  return (
    <div
      className={cn(
        "grid my-4",
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// Column item wrapper
export function Column({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
