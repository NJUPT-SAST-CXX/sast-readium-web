"use client";

import { cn } from "@/lib/utils";
import { Circle, CheckCircle } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status?: "pending" | "active" | "completed";
}

export interface TimelineBlockProps {
  items: TimelineItem[];
  className?: string;
}

export function TimelineBlock({ items, className }: TimelineBlockProps) {
  return (
    <div className={cn("my-4", className)}>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="relative flex gap-4 pl-8">
              {/* Icon */}
              <div
                className={cn(
                  "absolute left-0 w-6 h-6 rounded-full flex items-center justify-center bg-background",
                  item.status === "completed" && "text-green-500",
                  item.status === "active" && "text-primary",
                  item.status === "pending" && "text-muted-foreground"
                )}
              >
                {item.status === "completed" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle
                    className={cn(
                      "h-5 w-5",
                      item.status === "active" && "fill-current"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  {item.date && (
                    <span className="text-xs text-muted-foreground">
                      {item.date}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Parse timeline from markdown syntax
// :::timeline
// - [x] 2024-01-01: Task completed
// - [ ] 2024-01-02: Task pending
// :::
export function parseTimelineFromMarkdown(content: string): TimelineItem[] {
  const lines = content.trim().split("\n");
  const items: TimelineItem[] = [];

  for (const line of lines) {
    const match = line.match(
      /^-\s*\[([ x])\]\s*(?:(\d{4}-\d{2}-\d{2}):?\s*)?(.+)$/
    );
    if (match) {
      const isCompleted = match[1] === "x";
      const date = match[2] || undefined;
      const title = match[3].trim();

      items.push({
        id: `timeline-${items.length}`,
        title,
        date,
        status: isCompleted ? "completed" : "pending",
      });
    }
  }

  return items;
}
