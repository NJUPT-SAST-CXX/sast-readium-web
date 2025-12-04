"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  cn,
  slugify,
  extractHeadings,
  parseAdmonitions,
  processKeyboardShortcuts,
  type TOCItem,
} from "@/lib/utils";
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
  ChevronRight,
  ChevronDown,
  Link as LinkIcon,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Re-export TOCItem for backward compatibility
export type { TOCItem } from "@/lib/utils";

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
  showTOC?: boolean;
  enableAnchors?: boolean;
  theme?: "light" | "dark" | "auto";
  onHeadingsChange?: (headings: TOCItem[]) => void;
}

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
        <Icon className="h-5 w-5 shrink-0" />
        <span>{displayTitle}</span>
      </div>
      <div className="text-sm [&>p]:mt-0 [&>p:first-child]:mt-0">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Table of Contents Component
// ============================================================================

interface TOCProps {
  items: TOCItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
}

export function TableOfContents({ items, activeId, onItemClick }: TOCProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between p-2 hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="font-medium">Table of Contents</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <nav className="mt-2 border-l-2 border-muted pl-4">
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              >
                <button
                  onClick={() => onItemClick?.(item.id)}
                  className={cn(
                    "block w-full text-left text-sm py-1 px-2 rounded transition-colors hover:bg-muted",
                    activeId === item.id
                      ? "text-primary font-medium bg-primary/10"
                      : "text-muted-foreground"
                  )}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </CollapsibleContent>
    </Collapsible>
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

// Note: Content processing functions (slugify, parseAdmonitions, processKeyboardShortcuts,
// extractHeadings) are now imported from @/lib/utils/markdown-utils

// ============================================================================
// Main Component
// ============================================================================

export function MarkdownPreview({
  content,
  className,
  showTOC = false,
  enableAnchors = true,
  theme = "auto",
  onHeadingsChange,
}: MarkdownPreviewProps) {
  const [activeHeading, setActiveHeading] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Normalize line endings
  const normalizedContent = useMemo(
    () => content.replace(/\r\n/g, "\n"),
    [content]
  );

  // Extract headings for TOC
  const headings = useMemo(
    () => extractHeadings(normalizedContent),
    [normalizedContent]
  );

  // Notify parent of headings change
  useEffect(() => {
    onHeadingsChange?.(headings);
  }, [headings, onHeadingsChange]);

  // Parse admonitions
  const { admonitions, processed: afterAdmonitions } = useMemo(
    () => parseAdmonitions(normalizedContent),
    [normalizedContent]
  );

  // Process content
  const processedContent = useMemo(() => {
    let result = afterAdmonitions;
    result = processKeyboardShortcuts(result);
    return result;
  }, [afterAdmonitions]);

  // Handle anchor click
  const handleAnchorClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeading(id);
    }
  }, []);

  // Intersection observer for active heading
  useEffect(() => {
    if (!showTOC || !contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    const headingElements = contentRef.current.querySelectorAll(
      "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"
    );
    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [showTOC, processedContent]);

  // Create heading component with anchor
  const createHeadingComponent = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      const Tag = `h${level}` as const;
      const sizeClasses: Record<number, string> = {
        1: "text-3xl font-bold tracking-tight mb-6 pb-2 border-b",
        2: "text-2xl font-semibold tracking-tight mt-8 mb-4 pb-2 border-b",
        3: "text-xl font-semibold tracking-tight mt-6 mb-3",
        4: "text-lg font-semibold tracking-tight mt-4 mb-2",
        5: "text-base font-semibold mt-4 mb-2",
        6: "text-sm font-semibold mt-4 mb-2 text-muted-foreground",
      };

      return function HeadingComponent({
        children,
        ...props
      }: React.HTMLAttributes<HTMLHeadingElement>) {
        const text =
          typeof children === "string"
            ? children
            : Array.isArray(children)
              ? children.join("")
              : "";
        const id = slugify(text);

        return (
          <Tag
            id={enableAnchors ? id : undefined}
            className={cn("scroll-m-20 group relative", sizeClasses[level])}
            {...props}
          >
            {children}
            {enableAnchors && (
              <button
                onClick={() => handleAnchorClick(id)}
                className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Copy link to heading"
              >
                <LinkIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </Tag>
        );
      };
    },
    [enableAnchors, handleAnchorClick]
  );

  // Create components
  const components: Components = useMemo(
    () => ({
      h1: createHeadingComponent(1),
      h2: createHeadingComponent(2),
      h3: createHeadingComponent(3),
      h4: createHeadingComponent(4),
      h5: createHeadingComponent(5),
      h6: createHeadingComponent(6),
      p: ({ children, ...props }) => (
        <p className="leading-7 [&:not(:first-child)]:mt-4" {...props}>
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
      li: ({ children, ...props }) => {
        // Handle task list items
        const childArray = Array.isArray(children) ? children : [children];
        const firstChild = childArray[0];

        if (
          typeof firstChild === "object" &&
          firstChild !== null &&
          "type" in firstChild &&
          firstChild.type === "input" &&
          (firstChild as React.ReactElement<{ type?: string }>).props?.type ===
            "checkbox"
        ) {
          return (
            <li className="flex items-start gap-2 list-none -ml-6" {...props}>
              {children}
            </li>
          );
        }

        return (
          <li className="leading-7" {...props}>
            {children}
          </li>
        );
      },
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
      code: ({ className: codeClassName, children, node, ...props }) => {
        const isInline = !codeClassName && node?.position;

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

        const language = extractLanguageFromClassName(codeClassName);
        const codeString = String(children).replace(/\n$/, "");

        return (
          <CodeHighlighter
            code={codeString}
            language={language}
            showCopyButton={true}
            showLineNumbers={codeString.split("\n").length > 5}
            theme={theme}
          />
        );
      },
      pre: ({ children, ...props }) => (
        <pre
          className="mt-4 mb-4 overflow-x-auto rounded-lg border bg-muted p-4"
          {...props}
        >
          {children}
        </pre>
      ),
      table: ({ children, ...props }) => (
        <div className="my-6 w-full overflow-auto">
          <table className="w-full border-collapse text-sm" {...props}>
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
          className="border px-4 py-2 text-left font-semibold [&[align=center]]:text-center [&[align=right]]:text-right"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
          {...props}
        >
          {children}
        </td>
      ),
      hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
      img: ({ src, alt, ...props }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || ""}
          className="rounded-lg border my-4 max-w-full h-auto"
          loading="lazy"
          {...props}
        />
      ),
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
      input: ({ type, checked, ...props }) => {
        if (type === "checkbox") {
          return (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...props}
            />
          );
        }
        return <input type={type} {...props} />;
      },
      kbd: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <Kbd {...props}>{children}</Kbd>
      ),
    }),
    [createHeadingComponent, theme]
  );

  // Render admonition by index
  const renderAdmonition = useCallback(
    (index: number) => {
      const admonition = admonitions.find((a) => a.position === index);
      if (!admonition) return null;

      return (
        <Admonition
          key={`admonition-${index}`}
          type={admonition.type}
          title={admonition.title}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={components}
          >
            {admonition.content}
          </ReactMarkdown>
        </Admonition>
      );
    },
    [admonitions, components]
  );

  // Split content by placeholders and render
  const renderContent = useCallback(() => {
    const parts = processedContent.split(/(__ADMONITION_\d+__)/);

    return parts.map((part, index) => {
      const admonitionMatch = part.match(/__ADMONITION_(\d+)__/);
      if (admonitionMatch) {
        return renderAdmonition(parseInt(admonitionMatch[1], 10));
      }

      if (!part.trim()) return null;

      return (
        <ReactMarkdown
          key={`content-${index}`}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={components}
        >
          {part}
        </ReactMarkdown>
      );
    });
  }, [processedContent, renderAdmonition, components]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        className
      )}
    >
      {showTOC && headings.length > 0 && (
        <TableOfContents
          items={headings}
          activeId={activeHeading}
          onItemClick={handleAnchorClick}
        />
      )}
      {renderContent()}
    </div>
  );
}

// ============================================================================
// Standalone TOC Sidebar Component
// ============================================================================

interface TOCSidebarProps {
  items: TOCItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

export function TOCSidebar({
  items,
  activeId,
  onItemClick,
  className,
}: TOCSidebarProps) {
  if (items.length === 0) return null;

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4">
        <h4 className="mb-4 text-sm font-semibold">On This Page</h4>
        <nav>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              >
                <button
                  onClick={() => onItemClick?.(item.id)}
                  className={cn(
                    "block w-full text-left text-sm py-1 transition-colors hover:text-foreground",
                    activeId === item.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </ScrollArea>
  );
}
