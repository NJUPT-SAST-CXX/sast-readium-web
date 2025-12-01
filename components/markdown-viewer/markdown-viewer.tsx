"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  FileText,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { readMarkdownContent } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/help/markdown-renderer";
import { usePDFStore } from "@/lib/pdf";

interface MarkdownViewerProps {
  file: File;
  onClose?: () => void;
  header?: React.ReactNode;
}

interface SearchResult {
  index: number;
  text: string;
  context: string;
}

export function MarkdownViewer({ file, onClose, header }: MarkdownViewerProps) {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);

  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isDarkMode, themeMode, setThemeMode } = usePDFStore();

  // Load markdown content
  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const text = await readMarkdownContent(file);
        if (!cancelled) {
          setContent(text);
        }
      } catch (err) {
        console.error("Failed to load markdown:", err);
        if (!cancelled) {
          setError(t("markdown.error_loading"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [file, t]);

  // Search functionality
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !content) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    const lines = content.split("\n");
    let charIndex = 0;

    lines.forEach((line) => {
      let lineIndex = 0;
      while (true) {
        const foundIndex = line.toLowerCase().indexOf(query, lineIndex);
        if (foundIndex === -1) break;

        results.push({
          index: charIndex + foundIndex,
          text: line.substring(foundIndex, foundIndex + query.length),
          context: line.substring(
            Math.max(0, foundIndex - 30),
            Math.min(line.length, foundIndex + query.length + 30)
          ),
        });

        lineIndex = foundIndex + 1;
      }
      charIndex += line.length + 1; // +1 for newline
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchQuery, content]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const nextSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }
  }, [searchResults.length]);

  const previousSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex(
        (prev) => (prev - 1 + searchResults.length) % searchResults.length
      );
    }
  }, [searchResults.length]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 2.0));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Download markdown file
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, file.name]);

  // Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F: Toggle search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
        if (!showSearch) {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }

      // Escape: Close search or close viewer
      if (e.key === "Escape") {
        if (showSearch) {
          setShowSearch(false);
        }
      }

      // Ctrl/Cmd + Plus: Zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        zoomIn();
      }

      // Ctrl/Cmd + Minus: Zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }

      // Ctrl/Cmd + 0: Reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        resetZoom();
      }

      // F11: Toggle fullscreen
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }

      // Enter in search: Next result
      if (e.key === "Enter" && showSearch) {
        e.preventDefault();
        if (e.shiftKey) {
          previousSearchResult();
        } else {
          nextSearchResult();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showSearch,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFullscreen,
    nextSearchResult,
    previousSearchResult,
  ]);

  // Theme background class
  const themeClass = useMemo(() => {
    if (themeMode === "sepia") {
      return "bg-[#f4ecd8] text-[#5c4b37]";
    }
    return isDarkMode
      ? "bg-background text-foreground"
      : "bg-white text-gray-900";
  }, [themeMode, isDarkMode]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t("markdown.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <FileText className="h-16 w-16 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={onClose}>
          {t("viewer.go_back")}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex h-screen w-full flex-col", themeClass)}>
        {/* Header (Tab bar) */}
        {header}

        {/* Toolbar */}
        {showToolbar && (
          <div className="flex items-center justify-between border-b border-border bg-background/95 px-2 py-1 backdrop-blur print:hidden">
            <div className="flex items-center gap-1">
              {/* Menu toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowToolbar((prev) => !prev)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("toolbar.tooltip.toggle_menu")}
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="mx-1 h-6" />

              {/* Zoom controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={zoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.tooltip.zoom_out")}</TooltipContent>
              </Tooltip>

              <span className="min-w-[4rem] text-center text-sm">
                {Math.round(zoom * 100)}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={zoomIn}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.tooltip.zoom_in")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={resetZoom}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("toolbar.tooltip.actual_size")}
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="mx-1 h-6" />

              {/* Search */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showSearch ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setShowSearch((prev) => !prev);
                      if (!showSearch) {
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      }
                    }}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.tooltip.search")}</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isDarkMode ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setThemeMode("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    {t("settings.option.light")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemeMode("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    {t("settings.option.dark")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemeMode("sepia")}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t("settings.option.sepia")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="mx-1 h-6" />

              {/* Download */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.tooltip.download")}</TooltipContent>
              </Tooltip>

              {/* Print */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.tooltip.print")}</TooltipContent>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("toolbar.tooltip.fullscreen")}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Search bar */}
        {showSearch && (
          <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2 print:hidden">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={t("toolbar.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 flex-1"
            />
            {searchResults.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {currentSearchIndex + 1} / {searchResults.length}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={previousSearchResult}
              disabled={searchResults.length === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextSearchResult}
              disabled={searchResults.length === 0}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1">
          <div
            ref={contentRef}
            className="mx-auto max-w-4xl px-6 py-8"
            style={{
              fontSize: `${zoom * 100}%`,
            }}
          >
            <MarkdownRenderer
              content={content}
              docPath={file.name}
              language={i18n.language.startsWith("zh") ? "zh" : "en"}
            />
          </div>
        </ScrollArea>

        {/* Footer status bar */}
        <div className="flex items-center justify-between border-t border-border bg-background/95 px-4 py-1 text-xs text-muted-foreground print:hidden">
          <span>{file.name}</span>
          <span>
            {content.split(/\s+/).filter(Boolean).length} {t("markdown.words")}{" "}
            · {content.split("\n").length} {t("markdown.lines")}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
