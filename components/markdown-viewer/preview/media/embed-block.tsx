"use client";

import { useState, useMemo } from "react";
import { ExternalLink, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmbedBlockProps {
  src: string;
  title?: string;
  height?: number;
  className?: string;
}

// Known embed providers and their configurations
const embedProviders: Record<
  string,
  { name: string; allowFullscreen: boolean; sandbox?: string }
> = {
  figma: {
    name: "Figma",
    allowFullscreen: true,
  },
  codepen: {
    name: "CodePen",
    allowFullscreen: true,
  },
  codesandbox: {
    name: "CodeSandbox",
    allowFullscreen: true,
  },
  stackblitz: {
    name: "StackBlitz",
    allowFullscreen: true,
  },
  excalidraw: {
    name: "Excalidraw",
    allowFullscreen: true,
  },
  miro: {
    name: "Miro",
    allowFullscreen: true,
  },
  notion: {
    name: "Notion",
    allowFullscreen: false,
  },
  airtable: {
    name: "Airtable",
    allowFullscreen: false,
  },
  gist: {
    name: "GitHub Gist",
    allowFullscreen: false,
  },
  twitter: {
    name: "Twitter",
    allowFullscreen: false,
  },
  spotify: {
    name: "Spotify",
    allowFullscreen: false,
  },
};

function detectProvider(url: string): string | null {
  const patterns: Record<string, RegExp> = {
    figma: /figma\.com/,
    codepen: /codepen\.io/,
    codesandbox: /codesandbox\.io/,
    stackblitz: /stackblitz\.com/,
    excalidraw: /excalidraw\.com/,
    miro: /miro\.com/,
    notion: /notion\.so/,
    airtable: /airtable\.com/,
    gist: /gist\.github\.com/,
    twitter: /twitter\.com|x\.com/,
    spotify: /spotify\.com/,
  };

  for (const [provider, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return provider;
    }
  }
  return null;
}

export function EmbedBlock({
  src,
  title,
  height = 400,
  className,
}: EmbedBlockProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const provider = useMemo(() => detectProvider(src), [src]);
  const providerConfig = provider ? embedProviders[provider] : null;

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by toggling key
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "my-4 p-6 rounded-lg border border-dashed text-center",
          className
        )}
      >
        <p className="text-muted-foreground mb-2">无法加载嵌入内容</p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重试
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={src} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              打开原链接
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "my-4 rounded-lg border overflow-hidden",
        isExpanded && "fixed inset-4 z-50 m-0",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b">
        <div className="flex items-center gap-2 text-sm">
          {providerConfig && (
            <span className="font-medium">{providerConfig.name}</span>
          )}
          {title && (
            <>
              {providerConfig && (
                <span className="text-muted-foreground">·</span>
              )}
              <span className="text-muted-foreground truncate">{title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {providerConfig?.allowFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={src} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Embed content */}
      <div
        className="relative bg-muted/30"
        style={{ height: isExpanded ? "calc(100% - 41px)" : height }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <iframe
          src={src}
          title={title || "Embedded content"}
          className={cn("w-full h-full border-0", isLoading && "opacity-0")}
          allowFullScreen={providerConfig?.allowFullscreen}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    </div>
  );
}
