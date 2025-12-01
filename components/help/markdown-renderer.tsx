"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";
import {
  CodeHighlighter,
  extractLanguageFromClassName,
} from "@/components/ui/code-highlighter";
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
} from "lucide-react";

// ============================================================================
// Admonition Component
// ============================================================================

interface AdmonitionProps {
  type: string;
  title?: string;
  children: React.ReactNode;
}

const admonitionConfig: Record<
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
};

function Admonition({ type, title, children }: AdmonitionProps) {
  const config = admonitionConfig[type.toLowerCase()] || admonitionConfig.note;
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div className={cn("my-4 rounded-lg border-l-4 p-4", config.className)}>
      <div className="flex items-center gap-2 font-semibold mb-2">
        <Icon className="h-5 w-5" />
        <span>{displayTitle}</span>
      </div>
      <div className="text-sm [&>p]:mt-0 [&>p:first-child]:mt-0">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================

interface TabItem {
  label: string;
  content: string;
}

// ============================================================================
// Grid Cards Component
// ============================================================================

interface CardItem {
  title: string;
  content: string;
  link?: { text: string; url: string };
}

interface GridCardsProps {
  cards: CardItem[];
}

function GridCards({ cards }: GridCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 my-6 sm:grid-cols-2">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <h4 className="font-semibold mb-2">{card.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{card.content}</p>
          {card.link && (
            <a
              href={card.link.url}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {card.link.text} →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Keyboard Shortcut Component
// ============================================================================

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono font-semibold bg-muted border border-border rounded shadow-sm">
      {children}
    </kbd>
  );
}

// ============================================================================
// Content Processing Functions
// ============================================================================

/**
 * Parse MkDocs grid cards syntax into structured data
 */
function parseGridCards(markdown: string): {
  cards: CardItem[];
  remaining: string;
} {
  const cards: CardItem[] = [];
  let remaining = markdown;

  const gridMatch = markdown.match(
    /<div class="grid cards"[^>]*markdown[^>]*>([\s\S]*?)<\/div>/
  );

  if (gridMatch) {
    const inner = gridMatch[1];
    const normalized = inner.replace(/^\s*-[\t ]{3}/, "");
    const cardBlocks = normalized
      .split(/\n-[\t ]{3}/)
      .map((card: string) => card.trim())
      .filter(Boolean);

    for (const block of cardBlocks) {
      const lines = block.split(/\n/);
      let title = "";
      let content = "";
      let link: { text: string; url: string } | undefined;

      for (const line of lines) {
        const trimmed = line.trim();
        // Skip icon lines
        if (trimmed.match(/^:[\w-]+:/)) continue;
        if (trimmed === "---") continue;

        // Extract title from **bold**
        const titleMatch = trimmed.match(/\*\*(.+?)\*\*/);
        if (titleMatch && !title) {
          title = titleMatch[1].replace(/:[\w-]+:\{[^}]*\}/g, "").trim();
          continue;
        }

        // Extract link
        const linkMatch = trimmed.match(/\[:[\w-]+:\s*(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          link = { text: linkMatch[1], url: linkMatch[2] };
          continue;
        }

        // Regular content
        if (trimmed && !trimmed.startsWith(":")) {
          content += (content ? " " : "") + trimmed;
        }
      }

      if (title) {
        cards.push({ title, content, link });
      }
    }

    remaining = markdown.replace(gridMatch[0], "");
  }

  return { cards, remaining };
}

/**
 * Parse MkDocs admonitions into structured data
 * Handles admonitions with indented content blocks (including lists)
 */
function parseAdmonitions(markdown: string): {
  admonitions: Array<{
    type: string;
    title: string;
    content: string;
    position: number;
  }>;
  processed: string;
} {
  const admonitions: Array<{
    type: string;
    title: string;
    content: string;
    position: number;
  }> = [];
  let placeholderIndex = 0;

  // Process line by line to handle indented content properly
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inAdmonition = false;
  let currentType = "";
  let currentTitle = "";
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for admonition start: !!! type "title" or !!! type
    const admonitionMatch = line.match(/^(!!!?)\s+(\w+)(?:\s+"([^"]*)")?$/);

    if (admonitionMatch) {
      // Save previous admonition if exists
      if (inAdmonition && currentType) {
        const placeholder = `__ADMONITION_${placeholderIndex}__`;
        admonitions.push({
          type: currentType,
          title: currentTitle,
          content: currentContent.join("\n").trim(),
          position: placeholderIndex,
        });
        placeholderIndex++;
        result.push(placeholder);
      }

      // Start new admonition
      currentType = admonitionMatch[2];
      currentTitle = admonitionMatch[3] || "";
      currentContent = [];
      inAdmonition = true;
      continue;
    }

    if (inAdmonition) {
      // Check if line is indented (part of admonition content)
      if (line.startsWith("    ") || line.trim() === "") {
        // Remove 4-space indent
        currentContent.push(line.replace(/^    /, ""));
        continue;
      } else {
        // End of admonition - save it
        const placeholder = `__ADMONITION_${placeholderIndex}__`;
        admonitions.push({
          type: currentType,
          title: currentTitle,
          content: currentContent.join("\n").trim(),
          position: placeholderIndex,
        });
        placeholderIndex++;
        result.push(placeholder);

        // Reset
        inAdmonition = false;
        currentType = "";
        currentTitle = "";
        currentContent = [];

        // Add current line to result
        result.push(line);
        continue;
      }
    }

    result.push(line);
  }

  // Handle any remaining admonition at end of file
  if (inAdmonition && currentType) {
    const placeholder = `__ADMONITION_${placeholderIndex}__`;
    admonitions.push({
      type: currentType,
      title: currentTitle,
      content: currentContent.join("\n").trim(),
      position: placeholderIndex,
    });
    result.push(placeholder);
  }

  return { admonitions, processed: result.join("\n") };
}

/**
 * Parse MkDocs tabs syntax into structured data
 * Handles tabs with code blocks inside them
 */
function parseTabs(markdown: string): {
  tabGroups: Array<{ tabs: TabItem[]; position: number }>;
  processed: string;
} {
  const tabGroups: Array<{ tabs: TabItem[]; position: number }> = [];
  let placeholderIndex = 0;

  // Split by lines and process
  const lines = markdown.split("\n");
  const result: string[] = [];
  let currentTabs: TabItem[] = [];
  let currentTabLabel = "";
  let currentTabContent: string[] = [];
  let inTabBlock = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks (even inside tabs)
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }

    // Check for tab header: === "Tab Name"
    const tabHeaderMatch = line.match(/^===\s+"([^"]+)"\s*$/);

    if (tabHeaderMatch && !inCodeBlock) {
      // Save previous tab if exists
      if (currentTabLabel) {
        currentTabs.push({
          label: currentTabLabel,
          content: currentTabContent.join("\n").trim(),
        });
      }

      // Start new tab
      currentTabLabel = tabHeaderMatch[1];
      currentTabContent = [];
      inTabBlock = true;
      continue;
    }

    if (inTabBlock && !inCodeBlock) {
      // Check if line is indented (part of tab content)
      if (line.startsWith("    ") || line.trim() === "") {
        // Remove 4-space indent
        currentTabContent.push(line.replace(/^    /, ""));
        continue;
      } else if (line.match(/^===\s+"/)) {
        // Another tab header - handled above
        continue;
      } else {
        // End of tab block - save current tabs
        if (currentTabLabel) {
          currentTabs.push({
            label: currentTabLabel,
            content: currentTabContent.join("\n").trim(),
          });
        }

        if (currentTabs.length > 0) {
          const placeholder = `__TABS_${placeholderIndex}__`;
          tabGroups.push({
            tabs: [...currentTabs],
            position: placeholderIndex,
          });
          placeholderIndex++;
          result.push(placeholder);
        }

        // Reset
        currentTabs = [];
        currentTabLabel = "";
        currentTabContent = [];
        inTabBlock = false;

        // Add current line to result
        result.push(line);
        continue;
      }
    } else if (inTabBlock && inCodeBlock) {
      // Inside code block within tab - keep content with indent removed
      currentTabContent.push(line.replace(/^    /, ""));
      continue;
    }

    result.push(line);
  }

  // Handle any remaining tabs at end of file
  if (currentTabLabel) {
    currentTabs.push({
      label: currentTabLabel,
      content: currentTabContent.join("\n").trim(),
    });
  }

  if (currentTabs.length > 0) {
    const placeholder = `__TABS_${placeholderIndex}__`;
    tabGroups.push({ tabs: [...currentTabs], position: placeholderIndex });
    result.push(placeholder);
  }

  return { tabGroups, processed: result.join("\n") };
}

/**
 * Convert keyboard shortcut syntax ++key++ to <kbd> elements
 */
function processKeyboardShortcuts(markdown: string): string {
  return markdown.replace(/\+\+([^+]+)\+\+/g, (_, keys) => {
    const keyList = keys.split("+").map((k: string) => k.trim());
    return keyList.map((k: string) => `<kbd>${k}</kbd>`).join("+");
  });
}

/**
 * Clean up MkDocs-specific syntax
 */
function cleanMkDocsSyntax(markdown: string): string {
  return (
    markdown
      // Remove material icons syntax with various formats
      .replace(/:[\w-]+:\{[^}]*\}/g, "")
      .replace(/:material-[\w-]+:/g, "")
      .replace(/:octicons-[\w-]+:/g, "")
      .replace(/:fontawesome-[\w-]+:/g, "")
      // Handle icon links like [:octicons-arrow-right-24: text](url)
      .replace(/\[:[\w-]+:\s*([^\]]+)\]\(([^)]+)\)/g, "[$1]($2)")
      // Remove standalone icon references (but keep arrows for navigation)
      .replace(/:[\w]+-[\w-]+:/g, "→")
      // Clean up markdown attribute syntax {.class} {#id}
      .replace(/\{[.#][^}]*\}/g, "")
      // Remove align attribute from divs but keep the div
      .replace(/<div align="[^"]*">/g, "<div>")
      // Clean up empty grid cards divs
      .replace(/<div class="grid cards"[^>]*>/g, "")
      .replace(/<\/div>/g, "")
  );
}

/**
 * Dedent non-code-block content
 */
function dedentNonCodeBlocks(markdown: string): string {
  const parts = markdown.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) => {
      const isCodeBlock = index % 2 === 1 && part.startsWith("```");
      if (isCodeBlock) {
        return part;
      }
      return part.replace(/\n {4}/g, "\n");
    })
    .join("");
}

interface MarkdownRendererProps {
  content: string;
  docPath: string;
  language: string;
  className?: string;
}

function resolveDocAsset(
  src: string | undefined,
  language: string,
  docPath: string
): string | undefined {
  if (!src) return undefined;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("//") ||
    src.startsWith("data:") ||
    src.startsWith("/")
  ) {
    return src;
  }

  const dirIndex = docPath.lastIndexOf("/");
  const docDir = dirIndex >= 0 ? docPath.slice(0, dirIndex + 1) : "";
  try {
    const base = new URL(
      `/docs/${language}/${docDir}`,
      "https://sast-readium.local"
    );
    const resolved = new URL(src, base);
    return resolved.pathname;
  } catch {
    return `/docs/${language}/${docDir}${src}`;
  }
}

function createComponents(
  resolveSrc: (src?: string) => string | undefined
): Components {
  return {
    h1: ({ children, ...props }) => (
      <h1
        className="scroll-m-20 text-3xl font-bold tracking-tight mb-6 pb-2 border-b"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4 pb-2 border-b"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="scroll-m-20 text-lg font-semibold tracking-tight mt-4 mb-2"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="scroll-m-20 text-base font-semibold mt-4 mb-2" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6
        className="scroll-m-20 text-sm font-semibold mt-4 mb-2 text-muted-foreground"
        {...props}
      >
        {children}
      </h6>
    ),
    p: ({ children, ...props }) => (
      <p className="leading-7 not-first:mt-4" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="my-4 ml-6 list-disc [&>li]:mt-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-4 ml-6 list-decimal [&>li]:mt-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-7" {...props}>
        {children}
      </li>
    ),
    a: ({ href, children, ...props }) => (
      <a
        href={href}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="mt-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ className, children, node, ...props }) => {
      // Check if this is inline code (no parent pre element)
      const isInline = !className && node?.position;

      if (isInline) {
        return (
          <code
            className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
            {...props}
          >
            {children}
          </code>
        );
      }

      // For code blocks, extract language and use CodeHighlighter
      const language = extractLanguageFromClassName(className);
      const codeString = String(children).replace(/\n$/, "");

      return (
        <CodeHighlighter
          code={codeString}
          language={language}
          showCopyButton={true}
          theme="auto"
        />
      );
    },
    pre: ({ children, ...props }) => {
      // The pre element just wraps the code block styling
      return (
        <pre
          className="mt-4 mb-4 overflow-x-auto rounded-lg border bg-muted p-4"
          {...props}
        >
          {children}
        </pre>
      );
    },
    table: ({ children, ...props }) => (
      <div className="my-6 w-full overflow-auto">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted/50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => (
      <tr className="border-b transition-colors hover:bg-muted/50" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border px-4 py-2 text-left font-semibold [[align=center]]:text-center [[align=right]]:text-right"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="border px-4 py-2 text-left [[align=center]]:text-center [[align=right]]:text-right"
        {...props}
      >
        {children}
      </td>
    ),
    hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
    img: ({ src, alt, ...props }) => {
      const resolvedSrc = typeof src === "string" ? resolveSrc(src) : undefined;
      return (
        <img
          src={resolvedSrc}
          alt={alt || ""}
          className="rounded-lg border my-4 max-w-full h-auto"
          loading="lazy"
          {...props}
        />
      );
    },
    strong: ({ children, ...props }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    del: ({ children, ...props }) => (
      <del className="line-through text-muted-foreground" {...props}>
        {children}
      </del>
    ),
  };
}

export function MarkdownRenderer({
  content,
  className,
  docPath,
  language,
}: MarkdownRendererProps) {
  // Normalize line endings to Unix style
  const normalizedContent = useMemo(
    () => content.replace(/\r\n/g, "\n"),
    [content]
  );

  // Parse and process content
  const { cards, remaining: afterCards } = useMemo(
    () => parseGridCards(normalizedContent),
    [normalizedContent]
  );

  const { admonitions, processed: afterAdmonitions } = useMemo(
    () => parseAdmonitions(afterCards),
    [afterCards]
  );

  const { tabGroups, processed: afterTabs } = useMemo(
    () => parseTabs(afterAdmonitions),
    [afterAdmonitions]
  );

  const processedContent = useMemo(() => {
    let result = afterTabs;
    // Process keyboard shortcuts
    result = processKeyboardShortcuts(result);
    // Clean MkDocs syntax
    result = cleanMkDocsSyntax(result);
    // Dedent non-code blocks
    result = dedentNonCodeBlocks(result);
    return result;
  }, [afterTabs]);

  // Create components with kbd support
  const components = useMemo(() => {
    const baseComponents = createComponents((src) =>
      resolveDocAsset(src, language, docPath)
    );

    return {
      ...baseComponents,
      // Override kbd to use our styled component
      kbd: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <Kbd {...props}>{children}</Kbd>
      ),
    };
  }, [language, docPath]);

  // Render admonition by index
  const renderAdmonition = (index: number) => {
    const admonition = admonitions.find((a) => a.position === index);
    if (!admonition) return null;

    return (
      <Admonition
        key={`admonition-${index}`}
        type={admonition.type}
        title={admonition.title}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {admonition.content}
        </ReactMarkdown>
      </Admonition>
    );
  };

  // Render tab group by index
  const renderTabGroup = (index: number) => {
    const tabGroup = tabGroups.find((t) => t.position === index);
    if (!tabGroup) return null;

    return (
      <TabsRenderer
        key={`tabs-${index}`}
        tabs={tabGroup.tabs}
        components={components}
      />
    );
  };

  // Split content by placeholders and render
  const renderContent = () => {
    const parts = processedContent.split(/(__ADMONITION_\d+__|__TABS_\d+__)/);

    return parts.map((part, index) => {
      const admonitionMatch = part.match(/__ADMONITION_(\d+)__/);
      if (admonitionMatch) {
        return renderAdmonition(parseInt(admonitionMatch[1], 10));
      }

      const tabsMatch = part.match(/__TABS_(\d+)__/);
      if (tabsMatch) {
        return renderTabGroup(parseInt(tabsMatch[1], 10));
      }

      if (!part.trim()) return null;

      return (
        <ReactMarkdown
          key={`content-${index}`}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        className
      )}
    >
      {/* Render grid cards if present */}
      {cards.length > 0 && <GridCards cards={cards} />}

      {/* Render main content with admonitions and tabs */}
      {renderContent()}
    </div>
  );
}

// ============================================================================
// Tabs Renderer (renders markdown inside tabs)
// ============================================================================

interface TabsRendererProps {
  tabs: TabItem[];
  components: Components;
}

function TabsRenderer({ tabs, components }: TabsRendererProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="my-4 not-prose">
      <div className="flex border-b border-border">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              "hover:text-foreground",
              activeTab === index
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 prose prose-neutral dark:prose-invert max-w-none">
        {tabs[activeTab] && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {tabs[activeTab].content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
