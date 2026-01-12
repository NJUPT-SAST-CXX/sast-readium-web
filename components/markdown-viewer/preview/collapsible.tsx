"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "my-4 rounded-lg border border-border bg-muted/30",
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
        <span>{title}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50">
          <div className="pt-3 text-sm">{children}</div>
        </div>
      )}
    </div>
  );
}

export interface DetailsBlockProps {
  summary: string;
  children: React.ReactNode;
  open?: boolean;
}

export function DetailsBlock({ summary, children, open }: DetailsBlockProps) {
  return (
    <details
      className="my-4 rounded-lg border border-border bg-muted/30 group"
      open={open}
    >
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-medium hover:bg-muted/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90" />
        <span>{summary}</span>
      </summary>
      <div className="px-4 pb-4 pt-0 border-t border-border/50">
        <div className="pt-3 text-sm">{children}</div>
      </div>
    </details>
  );
}
