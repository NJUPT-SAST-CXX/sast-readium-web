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
  Edit,
  Eye,
  PanelRight,
  List,
  Save,
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
import {
  cn,
  readMarkdownContent,
  searchInContent,
  type SearchResult,
} from "@/lib/utils";
import { usePDFStore } from "@/lib/pdf";
import { MarkdownPreview, TOCSidebar, type TOCItem } from "./preview";
import {
  exportAsHtml,
  exportAsPdf,
  exportAsPdfBlob,
} from "@/lib/markdown-export";
import { MarkdownEditor } from "./editor";

export type MarkdownViewMode = "view" | "edit" | "split";

interface MarkdownViewerProps {
  file: File;
  onClose?: () => void;
  header?: React.ReactNode;
  initialMode?: MarkdownViewMode;
  onSave?: (content: string, file: File) => void;
}

// SearchResult type is now imported from @/lib/utils

export function MarkdownViewer({
  file,
  onClose,
  header,
  initialMode = "view",
  onSave,
}: MarkdownViewerProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);
  const [viewMode, setViewMode] = useState<MarkdownViewMode>(initialMode);
  const [showTOC, setShowTOC] = useState(false);
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isDarkMode, themeMode, setThemeMode, setCurrentPDF, setPdfUrl } =
    usePDFStore();

  // Track unsaved changes
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setHasUnsavedChanges(newContent !== originalContent);
    },
    [originalContent]
  );

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(content, file);
      setOriginalContent(content);
      setHasUnsavedChanges(false);
    }
  }, [content, file, onSave]);

  // Handle anchor click from TOC
  const handleAnchorClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

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
          setOriginalContent(text);
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

  // Search functionality - using imported searchInContent utility
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !content) {
      setSearchResults([]);
      return;
    }

    const results = searchInContent(content, searchQuery, false);
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

  // Export as HTML
  const handleExportHtml = useCallback(() => {
    exportAsHtml(content, file.name);
  }, [content, file.name]);

  // Export as PDF
  const handleExportPdf = useCallback(async () => {
    await exportAsPdf(content, file.name);
  }, [content, file.name]);

  // Preview as PDF in viewer
  const handlePreviewPdf = useCallback(async () => {
    const title = file.name.replace(/\.(md|markdown)$/i, "");
    const blob = await exportAsPdfBlob(content, title);
    const pdfFile = new File([blob], `${title}.pdf`, {
      type: "application/pdf",
    });
    setCurrentPDF(pdfFile);
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  }, [content, file.name, setCurrentPDF, setPdfUrl]);

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

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (onSave && hasUnsavedChanges) {
          handleSave();
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
    onSave,
    hasUnsavedChanges,
    handleSave,
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

        {/* Collapsed toolbar toggle button */}
        {!showToolbar && (
          <div className="absolute top-2 left-2 z-10 print:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shadow-md"
                  onClick={() => setShowToolbar(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t("toolbar.tooltip.toggle_menu")}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Toolbar */}
        {showToolbar && (
          <div className="flex items-center justify-between border-b border-border bg-background/95 px-2 py-1 backdrop-blur print:hidden overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
              {/* Menu toggle - always visible */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowToolbar(false)}
                    aria-label={t("toolbar.tooltip.toggle_menu")}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("toolbar.tooltip.toggle_menu")}
                </TooltipContent>
              </Tooltip>

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* Zoom controls - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={zoomOut}
                      aria-label={t("toolbar.tooltip.zoom_out")}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.zoom_out")}
                  </TooltipContent>
                </Tooltip>

                <span className="min-w-[3rem] text-center text-sm">
                  {Math.round(zoom * 100)}%
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={zoomIn}
                      aria-label={t("toolbar.tooltip.zoom_in")}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.zoom_in")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={resetZoom}
                      aria-label={t("toolbar.tooltip.actual_size")}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.actual_size")}
                  </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />
              </div>

              {/* Search - always visible */}
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
                    aria-label={t("toolbar.tooltip.search")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.tooltip.search")}</TooltipContent>
              </Tooltip>

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* TOC toggle - hidden on mobile in split/edit mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showTOC ? "secondary" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      viewMode !== "view" && "hidden sm:flex"
                    )}
                    onClick={() => setShowTOC((prev) => !prev)}
                    disabled={headings.length === 0}
                    aria-label={t("markdown.toc", "Table of Contents")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("markdown.toc", "Table of Contents")}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* View mode toggle - use compact toggle on mobile */}
              <div className="flex items-center bg-muted/50 rounded-md p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "view" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode("view")}
                      aria-label={t("markdown.view_mode", "View")}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("markdown.view_mode", "View")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "edit" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewMode("edit")}
                      aria-label={t("markdown.edit_mode", "Edit")}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("markdown.edit_mode", "Edit")}
                  </TooltipContent>
                </Tooltip>

                {/* Split view - hidden on mobile */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "split" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7 hidden sm:flex"
                      onClick={() => setViewMode("split")}
                      aria-label={t("markdown.split_mode", "Split View")}
                    >
                      <PanelRight className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("markdown.split_mode", "Split View")}
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* Save button (only show if onSave provided and has changes) */}
              {onSave && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={hasUnsavedChanges ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges}
                      aria-label={t("markdown.save", "Save (Ctrl+S)")}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("markdown.save", "Save (Ctrl+S)")}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Theme toggle - hidden on mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex"
                  >
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

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* Download/Export Menu - always visible */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t("toolbar.tooltip.download")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownload}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t("markdown.download_md", "Download Markdown")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportHtml}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t("markdown.export_html", "Export as HTML")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t("markdown.export_pdf", "Export as PDF")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePreviewPdf}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("markdown.preview_pdf", "Preview as PDF")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Print - hidden on mobile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex"
                    onClick={handlePrint}
                    aria-label={t("toolbar.tooltip.print")}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("toolbar.tooltip.print")}</TooltipContent>
              </Tooltip>

              {/* Fullscreen - hidden on mobile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex"
                    onClick={toggleFullscreen}
                    aria-label={t("toolbar.tooltip.fullscreen")}
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
        <div className="flex-1 flex overflow-hidden relative">
          {/* TOC Sidebar - overlay on mobile, fixed on desktop */}
          {showTOC && headings.length > 0 && viewMode !== "edit" && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-20 sm:hidden"
                onClick={() => setShowTOC(false)}
              />
              {/* TOC Sidebar */}
              <div
                className={cn(
                  "border-r border-border shrink-0 bg-background z-30",
                  // Mobile: absolute overlay from left
                  "absolute left-0 top-0 bottom-0 w-64 sm:relative sm:w-56 lg:w-64",
                  // Animation
                  "transition-transform duration-200 ease-in-out"
                )}
              >
                <div className="flex items-center justify-between p-2 border-b sm:hidden">
                  <span className="text-sm font-medium">
                    {t("markdown.toc", "Table of Contents")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowTOC(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <TOCSidebar
                  items={headings}
                  onItemClick={(id) => {
                    handleAnchorClick(id);
                    // Close TOC on mobile after clicking
                    if (window.innerWidth < 640) {
                      setShowTOC(false);
                    }
                  }}
                />
              </div>
            </>
          )}

          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            {viewMode === "view" && (
              <ScrollArea className="h-full">
                <div
                  ref={contentRef}
                  className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8"
                  style={{ fontSize: `${zoom * 100}%` }}
                >
                  <MarkdownPreview
                    content={content}
                    showTOC={false}
                    enableAnchors={true}
                    onHeadingsChange={setHeadings}
                    searchQuery={searchQuery}
                    currentSearchIndex={currentSearchIndex}
                  />
                </div>
              </ScrollArea>
            )}

            {viewMode === "edit" && (
              <MarkdownEditor
                value={content}
                onChange={handleContentChange}
                onSave={onSave ? handleSave : undefined}
                fileName={file.name}
                showToolbar={false}
                defaultViewMode="edit"
                className="h-full border-0 rounded-none"
              />
            )}

            {viewMode === "split" && (
              <div className="flex h-full">
                {/* Editor pane */}
                <div className="w-1/2 border-r border-border">
                  <MarkdownEditor
                    value={content}
                    onChange={handleContentChange}
                    onSave={onSave ? handleSave : undefined}
                    fileName={file.name}
                    showToolbar={false}
                    showStatusBar={false}
                    defaultViewMode="edit"
                    className="h-full border-0 rounded-none"
                  />
                </div>
                {/* Preview pane */}
                <div className="w-1/2">
                  <ScrollArea className="h-full">
                    <div
                      className="px-4 sm:px-6 py-6 sm:py-8"
                      style={{ fontSize: `${zoom * 100}%` }}
                    >
                      <MarkdownPreview
                        content={content}
                        showTOC={false}
                        enableAnchors={true}
                        onHeadingsChange={setHeadings}
                        searchQuery={searchQuery}
                        currentSearchIndex={currentSearchIndex}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer status bar */}
        <div className="flex items-center justify-between border-t border-border bg-background/95 px-2 sm:px-4 py-1 text-xs text-muted-foreground print:hidden gap-2">
          <span className="truncate max-w-[40%] sm:max-w-none">
            {file.name}
          </span>
          <span className="shrink-0">
            <span className="hidden sm:inline">
              {content.split(/\s+/).filter(Boolean).length}{" "}
              {t("markdown.words")} · {content.split("\n").length}{" "}
              {t("markdown.lines")} ·{" "}
              {Math.max(
                1,
                Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)
              )}{" "}
              {t("markdown.min_read", "min read")}
            </span>
            <span className="sm:hidden">
              {content.split(/\s+/).filter(Boolean).length}W ·{" "}
              {content.split("\n").length}L ·{" "}
              {Math.max(
                1,
                Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)
              )}
              m
            </span>
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
