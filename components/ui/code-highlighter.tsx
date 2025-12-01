"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from "shiki";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

// Supported languages - add more as needed
const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "scala",
  "html",
  "css",
  "scss",
  "json",
  "yaml",
  "toml",
  "xml",
  "markdown",
  "sql",
  "bash",
  "shell",
  "powershell",
  "dockerfile",
  "graphql",
  "vue",
  "svelte",
  "astro",
];

// Language aliases mapping
const LANGUAGE_ALIASES: Record<string, BundledLanguage> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  cs: "csharp",
  "c++": "cpp",
  "c#": "csharp",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  ps1: "powershell",
  psm1: "powershell",
};

// Singleton highlighter instance
let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: SUPPORTED_LANGUAGES,
    });
  }
  return highlighterPromise;
}

function normalizeLanguage(lang: string | undefined): BundledLanguage | "text" {
  if (!lang) return "text";
  const normalized = lang.toLowerCase().trim();

  // Check aliases first
  if (normalized in LANGUAGE_ALIASES) {
    return LANGUAGE_ALIASES[normalized];
  }

  // Check if it's a supported language
  if (SUPPORTED_LANGUAGES.includes(normalized as BundledLanguage)) {
    return normalized as BundledLanguage;
  }

  return "text";
}

interface CodeHighlighterProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  theme?: "light" | "dark" | "auto";
}

function CodeHighlighterInner({
  code,
  language,
  className,
  showLineNumbers = false,
  showCopyButton = true,
  theme = "auto",
}: CodeHighlighterProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const normalizedLang = useMemo(() => normalizeLanguage(language), [language]);
  const trimmedCode = useMemo(() => code.trim(), [code]);

  // Determine theme based on system preference or explicit setting
  const resolvedTheme = useMemo(() => {
    if (theme !== "auto")
      return theme === "dark" ? "github-dark" : "github-light";
    // Check for dark mode class on document
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark")
        ? "github-dark"
        : "github-light";
    }
    return "github-dark";
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const highlighter = await getHighlighter();

        if (cancelled) return;

        if (normalizedLang === "text") {
          // No highlighting for plain text
          setHighlightedCode("");
          return;
        }

        const html = highlighter.codeToHtml(trimmedCode, {
          lang: normalizedLang,
          theme: resolvedTheme,
        });

        if (!cancelled) {
          setHighlightedCode(html);
        }
      } catch (error) {
        console.error("Failed to highlight code:", error);
        if (!cancelled) {
          setHighlightedCode("");
        }
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [trimmedCode, normalizedLang, resolvedTheme]);

  // Derive loading state from highlightedCode
  const isLoading = !highlightedCode && normalizedLang !== "text";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trimmedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [trimmedCode]);

  // Line numbers component
  const lineNumbers = useMemo(() => {
    if (!showLineNumbers) return null;
    const lines = trimmedCode.split("\n");
    return (
      <div className="select-none pr-4 text-right text-muted-foreground/50 text-xs leading-relaxed">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
    );
  }, [trimmedCode, showLineNumbers]);

  // Fallback for plain text or loading state
  if (isLoading || !highlightedCode) {
    return (
      <div className={cn("relative group", className)}>
        <div className="flex">
          {lineNumbers}
          <pre className="flex-1 overflow-x-auto">
            <code className="font-mono text-sm leading-relaxed">
              {trimmedCode}
            </code>
          </pre>
        </div>
        {showCopyButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <div className="flex">
        {lineNumbers}
        <div
          className="flex-1 overflow-x-auto [&>pre]:bg-transparent! [&>pre]:p-0! [&>pre]:m-0! [&_code]:text-sm [&_code]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
      {showCopyButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}

export const CodeHighlighter = memo(CodeHighlighterInner);

// Export utility for extracting language from className
export function extractLanguageFromClassName(
  className?: string
): string | undefined {
  if (!className) return undefined;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : undefined;
}
