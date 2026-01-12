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
import { processEmojis } from "@/lib/emoji";
import type { Components } from "react-markdown";
import {
  CodeHighlighter,
  extractLanguageFromClassName,
} from "@/components/ui/code-highlighter";
import { Link as LinkIcon } from "lucide-react";
import { Admonition } from "./admonition";
import { TableOfContents } from "./table-of-contents";
import { Kbd } from "./kbd";
import { MermaidDiagram } from "./mermaid-diagram";
import { ClickableImage } from "./image-lightbox";

// Re-export TOCItem for backward compatibility
export type { TOCItem } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
  showTOC?: boolean;
  enableAnchors?: boolean;
  theme?: "light" | "dark" | "auto";
  onHeadingsChange?: (headings: TOCItem[]) => void;
  searchQuery?: string;
  currentSearchIndex?: number;
}

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
  searchQuery = "",
  currentSearchIndex = 0,
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

  // Extract all images for gallery navigation
  const allImages = useMemo(() => {
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: Array<{ src: string; alt: string }> = [];
    let match;
    while ((match = imgRegex.exec(normalizedContent)) !== null) {
      images.push({ alt: match[1], src: match[2] });
    }
    return images;
  }, [normalizedContent]);

  // Search highlighting effect - scroll to current match
  useEffect(() => {
    if (!searchQuery || !contentRef.current) return;

    const marks = contentRef.current.querySelectorAll(
      "mark[data-search-match]"
    );
    if (
      marks.length > 0 &&
      currentSearchIndex >= 0 &&
      currentSearchIndex < marks.length
    ) {
      const currentMark = marks[currentSearchIndex];
      // Remove previous highlight
      marks.forEach((m) => m.classList.remove("ring-2", "ring-primary"));
      // Highlight current match
      currentMark.classList.add("ring-2", "ring-primary");
      currentMark.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchQuery, currentSearchIndex]);

  // Helper function to highlight search matches in text
  const highlightSearchMatches = useCallback(
    (text: string): React.ReactNode => {
      if (!searchQuery || !text) return text;

      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedQuery})`, "gi");
      const parts = text.split(regex);

      if (parts.length === 1) return text;

      return parts.map((part, index) => {
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
          return (
            <mark
              key={index}
              data-search-match="true"
              className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    },
    [searchQuery]
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
    result = processEmojis(result);
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
          {typeof children === "string"
            ? highlightSearchMatches(children)
            : children}
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

        // Handle Mermaid diagrams
        if (language === "mermaid") {
          return <MermaidDiagram code={codeString} />;
        }

        // Parse line highlight syntax from language string (e.g., "js{1,3-5}")
        const parseHighlightLines = (lang: string | undefined): number[] => {
          if (!lang) return [];
          const match = lang.match(/\{([^}]+)\}/);
          if (!match) return [];

          const lines: number[] = [];
          const parts = match[1].split(",");
          for (const part of parts) {
            if (part.includes("-")) {
              const [start, end] = part.split("-").map(Number);
              for (let i = start; i <= end; i++) {
                lines.push(i);
              }
            } else {
              lines.push(Number(part));
            }
          }
          return lines.filter((n) => !isNaN(n));
        };

        const highlightLines = parseHighlightLines(codeClassName);
        const cleanLanguage = language?.replace(/\{[^}]+\}/, "");

        return (
          <CodeHighlighter
            code={codeString}
            language={cleanLanguage}
            showCopyButton={true}
            showLineNumbers={codeString.split("\n").length > 5}
            theme={theme}
            highlightLines={highlightLines}
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
      hr: () => (
        <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      ),
      img: ({ src, alt }) => (
        <ClickableImage
          src={typeof src === "string" ? src : ""}
          alt={alt || ""}
          className="rounded-lg border my-4 max-w-full h-auto"
          allImages={allImages}
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
      // Footnote support
      sup: ({ children, ...props }) => (
        <sup
          className="text-xs text-primary hover:underline cursor-pointer"
          {...props}
        >
          {children}
        </sup>
      ),
      section: ({ className, children, ...props }) => {
        // Handle footnotes section
        if (className?.includes("footnotes")) {
          return (
            <section
              className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground"
              {...props}
            >
              <h2 className="text-base font-semibold mb-2 text-foreground">
                Footnotes
              </h2>
              {children}
            </section>
          );
        }
        return (
          <section className={className} {...props}>
            {children}
          </section>
        );
      },
      // Collapsible details/summary support
      details: ({ children, ...props }) => (
        <details
          className="my-4 rounded-lg border border-border bg-muted/30 group"
          {...props}
        >
          {children}
        </details>
      ),
      summary: ({ children, ...props }) => (
        <summary
          className="flex cursor-pointer items-center gap-2 px-4 py-3 font-medium hover:bg-muted/50 transition-colors list-none [&::-webkit-details-marker]:hidden"
          {...props}
        >
          <span className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90">
            ▶
          </span>
          <span>{children}</span>
        </summary>
      ),
    }),
    [createHeadingComponent, theme, allImages, highlightSearchMatches]
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
