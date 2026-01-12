"use client";

import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Quote,
  Bug,
  Flame,
  HelpCircle,
  FileText,
  Bookmark,
  Zap,
  Target,
  Clock,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Admonition Configuration
// ============================================================================

export const admonitionConfig: Record<
  string,
  { icon: React.ElementType; className: string; defaultTitle: string }
> = {
  note: {
    icon: FileText,
    className:
      "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    defaultTitle: "Note",
  },
  info: {
    icon: Info,
    className:
      "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    defaultTitle: "Info",
  },
  tip: {
    icon: Lightbulb,
    className:
      "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
    defaultTitle: "Tip",
  },
  success: {
    icon: CheckCircle,
    className:
      "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
    defaultTitle: "Success",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    defaultTitle: "Warning",
  },
  danger: {
    icon: AlertCircle,
    className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
    defaultTitle: "Danger",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
    defaultTitle: "Error",
  },
  bug: {
    icon: Bug,
    className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
    defaultTitle: "Bug",
  },
  example: {
    icon: FileText,
    className:
      "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    defaultTitle: "Example",
  },
  quote: {
    icon: Quote,
    className:
      "border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-300",
    defaultTitle: "Quote",
  },
  abstract: {
    icon: FileText,
    className:
      "border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    defaultTitle: "Abstract",
  },
  question: {
    icon: HelpCircle,
    className:
      "border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    defaultTitle: "Question",
  },
  failure: {
    icon: AlertCircle,
    className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
    defaultTitle: "Failure",
  },
  important: {
    icon: Flame,
    className:
      "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    defaultTitle: "Important",
  },
  bookmark: {
    icon: Bookmark,
    className:
      "border-indigo-500/50 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    defaultTitle: "Bookmark",
  },
  todo: {
    icon: Target,
    className:
      "border-pink-500/50 bg-pink-500/10 text-pink-700 dark:text-pink-300",
    defaultTitle: "To Do",
  },
  deadline: {
    icon: Clock,
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    defaultTitle: "Deadline",
  },
  highlight: {
    icon: Star,
    className:
      "border-yellow-400/50 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400",
    defaultTitle: "Highlight",
  },
  recommendation: {
    icon: ThumbsUp,
    className:
      "border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    defaultTitle: "Recommendation",
  },
  discussion: {
    icon: MessageSquare,
    className:
      "border-slate-500/50 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    defaultTitle: "Discussion",
  },
  inspiration: {
    icon: Zap,
    className:
      "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    defaultTitle: "Inspiration",
  },
  favorite: {
    icon: Heart,
    className:
      "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    defaultTitle: "Favorite",
  },
};

// ============================================================================
// Admonition Component
// ============================================================================

export interface AdmonitionProps {
  type: string;
  title?: string;
  children: React.ReactNode;
}

export function Admonition({ type, title, children }: AdmonitionProps) {
  const config = admonitionConfig[type.toLowerCase()] || admonitionConfig.note;
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div className={cn("my-4 rounded-lg border-l-4 p-4", config.className)}>
      <div className="flex items-center gap-2 font-semibold mb-2">
        <Icon className="h-5 w-5 shrink-0" />
        <span>{displayTitle}</span>
      </div>
      <div className="text-sm [&>p]:mt-0 [&>p:first-child]:mt-0">
        {children}
      </div>
    </div>
  );
}
