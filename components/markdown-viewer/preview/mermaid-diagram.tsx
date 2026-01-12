"use client";

import { useState, useEffect, useRef, useId } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw, Maximize2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================================================
// Types
// ============================================================================

export interface MermaidDiagramProps {
  code: string;
  className?: string;
}

// ============================================================================
// Mermaid Diagram Component
// ============================================================================

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const diagramId = `mermaid-${uniqueId.replace(/:/g, "-")}`;

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      setIsLoading(true);
      setError(null);

      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import("mermaid")).default;

        // Initialize mermaid with theme detection
        const isDark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "inherit",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
          sequence: {
            useMaxWidth: true,
          },
          gantt: {
            useMaxWidth: true,
          },
        });

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(diagramId, code);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
          setSvg("");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, diagramId]);

  // Re-render on theme change
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          // Theme changed, re-render
          setSvg("");
          setIsLoading(true);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy SVG:", err);
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "my-4 flex items-center justify-center rounded-lg border bg-muted/30 p-8",
          className
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Rendering diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "my-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4",
          className
        )}
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">
              Failed to render Mermaid diagram
            </p>
            <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
              {error}
            </pre>
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Show source code
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {code}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "group relative my-4 rounded-lg border bg-background p-4 overflow-x-auto",
          className
        )}
      >
        {/* Toolbar */}
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 hover:bg-background"
            onClick={handleCopyCode}
            title="Copy Mermaid code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 hover:bg-background"
            onClick={() => setIsFullscreen(true)}
            title="View fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Diagram */}
        <div
          className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Mermaid Diagram</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Code
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySvg}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy SVG
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div
            className="flex justify-center p-4 [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
