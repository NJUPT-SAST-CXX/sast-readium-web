"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Type, Clock, Mic, Hash, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface WordCountStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  readingTime: number; // in minutes
  speakingTime: number; // in minutes
}

export interface WordCountPanelProps {
  content: string;
  className?: string;
  showInline?: boolean;
}

// Calculate word count statistics
function calculateStats(content: string): WordCountStats {
  const characters = content.length;
  const charactersNoSpaces = content.replace(/\s/g, "").length;

  // Words: split by whitespace, filter empty
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Lines
  const lines = content.split("\n").length;

  // Paragraphs: groups of non-empty lines
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  // Sentences: split by sentence-ending punctuation
  const sentences = content
    .split(/[.!?。！？]+/)
    .filter((s) => s.trim().length > 0).length;

  // Reading time: ~200-250 words per minute for English, ~300-400 characters per minute for Chinese
  // Use a blended approach
  const hasChineseChars = /[\u4e00-\u9fff]/.test(content);
  let readingTime: number;

  if (hasChineseChars) {
    // For Chinese text, use character count
    readingTime = Math.ceil(charactersNoSpaces / 350);
  } else {
    // For English text, use word count
    readingTime = Math.ceil(words / 225);
  }
  readingTime = Math.max(1, readingTime);

  // Speaking time: ~150 words per minute or ~250 characters per minute
  let speakingTime: number;
  if (hasChineseChars) {
    speakingTime = Math.ceil(charactersNoSpaces / 250);
  } else {
    speakingTime = Math.ceil(words / 150);
  }
  speakingTime = Math.max(1, speakingTime);

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    paragraphs,
    sentences,
    readingTime,
    speakingTime,
  };
}

export function WordCountPanel({
  content,
  className,
  showInline = true,
}: WordCountPanelProps) {
  useTranslation();
  const stats = useMemo(() => calculateStats(content), [content]);

  const inlineContent = (
    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
      <span>{stats.words} 词</span>
      <span>·</span>
      <span>{stats.lines} 行</span>
      <span>·</span>
      <span>{stats.readingTime} 分钟阅读</span>
    </span>
  );

  const detailedContent = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{stats.characters.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">字符</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">
            {stats.charactersNoSpaces.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">字符（不含空格）</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{stats.words.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">词</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{stats.lines.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">行</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{stats.paragraphs.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">段落</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{stats.sentences.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">句子</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{stats.readingTime} 分钟</div>
          <div className="text-xs text-muted-foreground">阅读时间</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{stats.speakingTime} 分钟</div>
          <div className="text-xs text-muted-foreground">朗读时间</div>
        </div>
      </div>
    </div>
  );

  if (!showInline) {
    return <div className={cn("p-3", className)}>{detailedContent}</div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "hover:bg-muted px-2 py-1 rounded transition-colors cursor-pointer",
            className
          )}
        >
          {inlineContent}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="mb-2 font-medium text-sm">文档统计</div>
        {detailedContent}
      </PopoverContent>
    </Popover>
  );
}
