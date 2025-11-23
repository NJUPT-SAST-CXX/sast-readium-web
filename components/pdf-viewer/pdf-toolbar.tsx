"use client";

import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  Minimize,
  Download,
  Printer,
  Search,
  X,
  Menu,
  Moon,
  Sun,
  Maximize2,
  BookOpen,
  Columns2,
  FileText,
  Rows3,
  Star,
  CaseSensitive,
  MessageSquare,
  Presentation,
  Keyboard,
  Settings,
  LayoutGrid,
  Copy,
  Volume2,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import { usePDFStore, AnnotationStamp } from "@/lib/pdf-store";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PDFSettingsDialog } from "./pdf-settings-dialog";
import { PDFMenuBar } from "./pdf-menubar";
import { PDFAnnotationsToolbar } from "./pdf-annotations-toolbar";
import { PDFGoToPage } from "./pdf-go-to-page";
import {
  isTauri,
  openPdfFileViaNativeDialog,
  openPdfFolderViaNativeDialog,
} from "@/lib/tauri-bridge";

interface PDFToolbarProps {
  onDownload: () => void;
  onPrint: () => void;
  onSearch: (query: string) => void;
  onClose: () => void;
  onToggleBookmarks?: () => void;
  onAnnotationTypeSelect?: (
    type: "highlight" | "comment" | "shape" | "text" | "drawing" | null
  ) => void;
  selectedAnnotationType?:
    | "highlight"
    | "comment"
    | "shape"
    | "text"
    | "drawing"
    | null;
  onStampSelect?: (stamp: AnnotationStamp) => void;
  onExtractCurrentPageText?: () => void;
  onExtractAllText?: () => void;
  onOpenFileFromMenu?: (file: File | File[]) => void;
  onRevealInFileManager?: () => void;
  showSearch?: boolean;
  onShowSearchChange?: (show: boolean) => void;
  showSettings?: boolean;
  onShowSettingsChange?: (show: boolean) => void;
  onOpenSignatureDialog?: () => void;
  onFileUpdate?: (newFile: File) => void;
}

export function PDFToolbar({
  onDownload,
  onPrint,
  onSearch,
  onClose,
  onToggleBookmarks,
  onAnnotationTypeSelect,
  selectedAnnotationType,
  onStampSelect,
  onExtractCurrentPageText,
  onExtractAllText,
  onOpenFileFromMenu,
  onRevealInFileManager,
  showSearch,
  onShowSearchChange,
  showSettings,
  onShowSettingsChange,
  onOpenSignatureDialog,
  onFileUpdate,
}: PDFToolbarProps) {
  const { t } = useTranslation();
  const {
    zoom,
    isFullscreen,
    showThumbnails,
    showOutline,
    showAnnotations,
    isDarkMode,
    searchQuery,
    searchResults,
    currentSearchIndex,
    viewMode,
    fitMode,
    caseSensitiveSearch,
    showMenuBar,
    zoomIn,
    zoomOut,
    setZoom,
    setViewMode,
    setFitMode,
    rotateClockwise,
    rotateCounterClockwise,
    toggleFullscreen,
    toggleThumbnails,
    toggleOutline,
    toggleAnnotations,
    toggleDarkMode,
    isPresentationMode,
    togglePresentationMode,
    showKeyboardShortcuts,
    toggleKeyboardShortcuts,
    setSearchQuery,
    nextSearchResult,
    previousSearchResult,
    toggleCaseSensitiveSearch,
    toggleMenuBar,
    isReading,
    setIsReading,
  } = usePDFStore();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearchQuery);
    onSearch(localSearchQuery);
  };

  // Zoom levels from 50% to 300% as requested
  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

  const handleMenuOpenFile = () => {
    if (!onOpenFileFromMenu) return;

    if (isTauri()) {
      openPdfFileViaNativeDialog()
        .then((file) => {
          if (file) {
            onOpenFileFromMenu(file);
          }
        })
        .catch((err) => {
          console.error("Failed to open PDF via menu native dialog", err);
        });
      return;
    }

    fileInputRef.current?.click();
  };

  const handleMenuOpenFolder = () => {
    if (!onOpenFileFromMenu) return;

    if (isTauri()) {
      openPdfFolderViaNativeDialog()
        .then((files) => {
          if (!files || files.length === 0) return;
          onOpenFileFromMenu(files);
        })
        .catch((err) => {
          console.error("Failed to open folder via menu native dialog", err);
        });
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0 && onOpenFileFromMenu) {
              const pdfFiles: File[] = [];
              for (let i = 0; i < files.length; i++) {
                if (files[i].type === "application/pdf") {
                  pdfFiles.push(files[i]);
                }
              }
              if (pdfFiles.length > 0) {
                onOpenFileFromMenu(pdfFiles);
              }
            }
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />

        {/* Menu Bar */}
        <PDFMenuBar
          onDownload={onDownload}
          onPrint={onPrint}
          onSave={onDownload}
          onSearch={() => onShowSearchChange?.(true)}
          onOpenSettings={() => onShowSettingsChange?.(true)}
          onOpenFile={onOpenFileFromMenu ? handleMenuOpenFile : undefined}
          onOpenFolder={onOpenFileFromMenu ? handleMenuOpenFolder : undefined}
          onRevealInFileManager={onRevealInFileManager}
          onOpenRecentFile={onOpenFileFromMenu}
          onFileUpdate={onFileUpdate}
        />

        {/* Main PDF Toolbar */}
        <div className="flex flex-col border-b border-border bg-background">
          {/* Main Toolbar */}
          <div className="flex items-center justify-between gap-2 px-2 sm:px-4 py-2 overflow-x-auto scrollbar-hide">
            {/* Left Section */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMenuBar}
                    className={cn(
                      "shrink-0 flex",
                      showMenuBar ? "bg-accent" : ""
                    )}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <div>{t("toolbar.tooltip.toggle_menu")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("viewer.menu_toggle_hint")}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />
              <ButtonGroup className="gap-0.5 sm:gap-1">
                <div className="hidden sm:block">
                  <PDFGoToPage />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleThumbnails}
                      className={cn(
                        "hidden sm:flex",
                        showThumbnails ? "bg-accent" : ""
                      )}
                    >
                      <LayoutGrid className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.toggle_thumbnails")}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsReading(!isReading)}
                      className={
                        isReading
                          ? "bg-accent text-accent-foreground animate-pulse"
                          : ""
                      }
                    >
                      {isReading ? (
                        <Square className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isReading
                      ? t("toolbar.tooltip.toggle_tts_stop")
                      : t("toolbar.tooltip.toggle_tts_start")}
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>

              <Separator orientation="vertical" className="h-6" />

              <ButtonGroup>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleOutline}
                      className={cn(
                        "hidden md:flex",
                        showOutline ? "bg-accent" : ""
                      )}
                    >
                      <BookOpen className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.toggle_bookmarks")}
                  </TooltipContent>
                </Tooltip>
                {onToggleBookmarks && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleBookmarks}
                        className="hidden md:flex"
                      >
                        <Star className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("toolbar.tooltip.my_bookmarks")}
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAnnotations}
                      className={cn(
                        "hidden sm:flex",
                        showAnnotations ? "bg-accent" : ""
                      )}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.toggle_annotations")}
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>
            </div>

            {/* Center Section - Zoom and View Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Zoom Controls */}
              <ButtonGroup className="hidden sm:flex gap-0.5 sm:gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={zoomOut}
                      className="shrink-0"
                    >
                      <ZoomOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div>{t("toolbar.tooltip.zoom_out")}</div>
                      <div className="text-muted-foreground">Ctrl/Cmd + -</div>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select
                      value={zoom.toString()}
                      onValueChange={(value) => setZoom(parseFloat(value))}
                    >
                      <SelectTrigger className="h-9 min-w-[70px] sm:min-w-[96px] px-2">
                        <SelectValue>{Math.round(zoom * 100)}%</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {zoomLevels.map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {level === 1.0
                              ? t("toolbar.tooltip.actual_size")
                              : `${Math.round(level * 100)}%`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div>{t("toolbar.tooltip.zoom_level")}</div>
                      <div className="text-muted-foreground">
                        Ctrl/Cmd + Scroll to zoom
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFitMode("custom");
                        setZoom(1.0);
                      }}
                      className="hidden sm:flex"
                    >
                      <span className="text-xs font-medium">100%</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div>{t("toolbar.tooltip.actual_size")}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={zoomIn}
                      className="shrink-0"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div>{t("toolbar.tooltip.zoom_in")}</div>
                      <div className="text-muted-foreground">Ctrl/Cmd + +</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>

              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />

              {/* Rotation Controls */}
              <ButtonGroup className="hidden md:flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={rotateCounterClockwise}
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.rotate_ccw")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={rotateClockwise}
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.rotate_cw")}
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>

              <Separator
                orientation="vertical"
                className="h-6 hidden md:block"
              />

              {/* View Mode Controls */}
              <ButtonGroup className="hidden lg:flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("single")}
                      className={viewMode === "single" ? "bg-accent" : ""}
                    >
                      <FileText className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.single_page")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("continuous")}
                      className={viewMode === "continuous" ? "bg-accent" : ""}
                    >
                      <Rows3 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.continuous")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("twoPage")}
                      className={viewMode === "twoPage" ? "bg-accent" : ""}
                    >
                      <Columns2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.two_page")}
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>

              <Separator
                orientation="vertical"
                className="h-6 hidden lg:block"
              />

              {/* Fit Mode Controls */}
              <ButtonGroup className="hidden xl:flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFitMode("fitWidth")}
                      className={fitMode === "fitWidth" ? "bg-accent" : ""}
                    >
                      <Maximize2 className="h-5 w-5 rotate-90" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.fit_width")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFitMode("fitPage")}
                      className={fitMode === "fitPage" ? "bg-accent" : ""}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.fit_page")}
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2">
              <ButtonGroup className="gap-0.5 sm:gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onShowSearchChange?.(!showSearch)}
                      className={cn(
                        "shrink-0 hidden sm:flex",
                        showSearch ? "bg-accent" : ""
                      )}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("toolbar.tooltip.search")}</TooltipContent>
                </Tooltip>

                {onExtractCurrentPageText && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onExtractCurrentPageText}
                        className="hidden sm:flex"
                      >
                        <FileText className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("toolbar.tooltip.extract_page")}
                    </TooltipContent>
                  </Tooltip>
                )}

                {onExtractAllText && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onExtractAllText}
                        className="hidden sm:flex"
                      >
                        <Copy className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("toolbar.tooltip.extract_all")}
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onPrint}
                      className="hidden md:flex"
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("toolbar.tooltip.print")}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDownload}
                      className="hidden sm:flex"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.download")}
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>

              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />

              <ButtonGroup className="gap-0.5 sm:gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePresentationMode}
                      className={cn(
                        "hidden lg:flex",
                        isPresentationMode ? "bg-accent" : ""
                      )}
                    >
                      <Presentation className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.presentation")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleKeyboardShortcuts}
                      className={cn(
                        "hidden xl:flex",
                        showKeyboardShortcuts ? "bg-accent" : ""
                      )}
                    >
                      <Keyboard className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.shortcuts")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleDarkMode}
                      className="hidden md:flex"
                    >
                      {isDarkMode ? (
                        <Sun className="h-5 w-5" />
                      ) : (
                        <Moon className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.dark_mode")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onShowSettingsChange?.(true)}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.settings")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="hidden sm:flex"
                    >
                      {isFullscreen ? (
                        <Minimize className="h-5 w-5" />
                      ) : (
                        <Maximize className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.fullscreen")}
                  </TooltipContent>
                </Tooltip>
              </ButtonGroup>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="flex items-center gap-2 border-t border-border px-4 py-2">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-1 items-center gap-2"
              >
                <Input
                  type="text"
                  placeholder={t("toolbar.search.placeholder")}
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={caseSensitiveSearch ? "default" : "ghost"}
                      size="icon"
                      onClick={toggleCaseSensitiveSearch}
                      className="h-9 w-9"
                    >
                      <CaseSensitive className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("toolbar.tooltip.case_sensitive")}
                  </TooltipContent>
                </Tooltip>
                <Button type="submit" size="sm">
                  {t("toolbar.tooltip.search")}
                </Button>
              </form>
              {searchResults.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {currentSearchIndex + 1} / {searchResults.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={previousSearchResult}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextSearchResult}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onShowSearchChange?.(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Annotations Toolbar */}
        {!isPresentationMode && (
          <PDFAnnotationsToolbar
            onAnnotationTypeSelect={onAnnotationTypeSelect || (() => {})}
            selectedType={selectedAnnotationType || null}
            onStampSelect={onStampSelect || (() => {})}
            onOpenSignatureDialog={onOpenSignatureDialog}
          />
        )}

        {showSettings && (
          <PDFSettingsDialog
            open={showSettings}
            onOpenChange={onShowSettingsChange || (() => {})}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
