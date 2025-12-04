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

// Supported languages - comprehensive list
const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  // Web
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "html",
  "css",
  "scss",
  "less",
  "vue",
  "svelte",
  "astro",
  // Systems
  "rust",
  "go",
  "c",
  "cpp",
  "zig",
  // JVM
  "java",
  "kotlin",
  "scala",
  "groovy",
  // .NET
  "csharp",
  "fsharp",
  // Scripting
  "python",
  "ruby",
  "php",
  "perl",
  "lua",
  "r",
  // Mobile
  "swift",
  "objective-c",
  "dart",
  // Data/Config
  "json",
  "yaml",
  "toml",
  "xml",
  "ini",
  "csv",
  // Database
  "sql",
  "plsql",
  "prisma",
  // Shell
  "bash",
  "shell",
  "powershell",
  "fish",
  "bat",
  // DevOps
  "dockerfile",
  "nginx",
  "apache",
  "terraform",
  // Markup
  "markdown",
  "latex",
  "rst",
  // API
  "graphql",
  "protobuf",
  // Functional
  "haskell",
  "elixir",
  "erlang",
  "clojure",
  "ocaml",
  // Other
  "vim",
  "diff",
  "git-commit",
  "git-rebase",
  "makefile",
  "cmake",
  "asm",
  "wasm",
  "regex",
];

// Language aliases mapping
const LANGUAGE_ALIASES: Record<string, BundledLanguage> = {
  // JavaScript/TypeScript
  js: "javascript",
  ts: "typescript",
  mjs: "javascript",
  cjs: "javascript",
  mts: "typescript",
  cts: "typescript",
  // Python
  py: "python",
  py3: "python",
  pyw: "python",
  // Ruby
  rb: "ruby",
  // Rust
  rs: "rust",
  // C#
  cs: "csharp",
  "c#": "csharp",
  // C++
  "c++": "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  hxx: "cpp",
  h: "c",
  // Shell
  sh: "bash",
  zsh: "bash",
  ksh: "bash",
  // YAML
  yml: "yaml",
  // Markdown
  md: "markdown",
  mdx: "markdown",
  // PowerShell
  ps1: "powershell",
  psm1: "powershell",
  psd1: "powershell",
  // F#
  fs: "fsharp",
  fsx: "fsharp",
  // Objective-C
  m: "objective-c",
  mm: "objective-c",
  // Other
  kt: "kotlin",
  kts: "kotlin",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hrl: "erlang",
  hs: "haskell",
  lhs: "haskell",
  ml: "ocaml",
  mli: "ocaml",
  clj: "clojure",
  cljs: "clojure",
  edn: "clojure",
  tf: "terraform",
  tfvars: "terraform",
  proto: "protobuf",
  gql: "graphql",
  tex: "latex",
  dockerfile: "dockerfile",
  makefile: "makefile",
  mk: "makefile",
  s: "asm",
  asm: "asm",
  wat: "wasm",
  wast: "wasm",
  conf: "ini",
  cfg: "ini",
  properties: "ini",
  pl: "perl",
  pm: "perl",
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
  showLanguageLabel?: boolean;
  theme?: "light" | "dark" | "auto";
  maxHeight?: string;
  wrapLines?: boolean;
  highlightLines?: number[];
}

function CodeHighlighterInner({
  code,
  language,
  className,
  showLineNumbers = false,
  showCopyButton = true,
  showLanguageLabel = true,
  theme = "auto",
  maxHeight,
  wrapLines = false,
  highlightLines = [],
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
      <div className="select-none pr-4 text-right text-muted-foreground/50 text-xs leading-relaxed border-r border-border/50 mr-4">
        {lines.map((_, i) => (
          <div
            key={i}
            className={cn(
              "px-2",
              highlightLines.includes(i + 1) && "bg-yellow-500/20"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    );
  }, [trimmedCode, showLineNumbers, highlightLines]);

  // Language label
  const languageLabel = useMemo(() => {
    if (!showLanguageLabel || normalizedLang === "text") return null;
    return (
      <span className="absolute top-2 right-12 text-xs text-muted-foreground/70 font-mono uppercase">
        {normalizedLang}
      </span>
    );
  }, [showLanguageLabel, normalizedLang]);

  // Container style
  const containerStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (maxHeight) {
      style.maxHeight = maxHeight;
      style.overflow = "auto";
    }
    return style;
  }, [maxHeight]);

  // Code wrapper classes
  const codeWrapperClasses = cn(
    "flex-1",
    wrapLines ? "whitespace-pre-wrap break-words" : "overflow-x-auto"
  );

  // Fallback for plain text or loading state
  if (isLoading || !highlightedCode) {
    return (
      <div className={cn("relative group", className)} style={containerStyle}>
        {languageLabel}
        <div className="flex">
          {lineNumbers}
          <pre className={codeWrapperClasses}>
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
    <div className={cn("relative group", className)} style={containerStyle}>
      {languageLabel}
      <div className="flex">
        {lineNumbers}
        <div
          className={cn(
            codeWrapperClasses,
            "[&>pre]:bg-transparent! [&>pre]:p-0! [&>pre]:m-0! [&_code]:text-sm [&_code]:leading-relaxed"
          )}
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
