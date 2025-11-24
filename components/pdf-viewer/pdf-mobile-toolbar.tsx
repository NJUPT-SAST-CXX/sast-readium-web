"use client";

import { Button } from "@/components/ui/button";
import { usePDFStore } from "@/lib/pdf-store";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  BookOpen,
  LayoutGrid,
  Settings,
  Home,
  RotateCw,
  Maximize2,
  Moon,
  Sun,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface PDFMobileToolbarProps {
  onSearch: () => void;
  onOpenSettings: () => void;
  orientation?: "portrait" | "landscape";
}

export function PDFMobileToolbar({
  onSearch,
  onOpenSettings,
  orientation = "portrait",
}: PDFMobileToolbarProps) {
  const { t } = useTranslation();
  const {
    currentPage,
    numPages,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    toggleThumbnails,
    toggleOutline,
    isDarkMode,
    toggleDarkMode,
    rotateClockwise,
    setFitMode,
  } = usePDFStore();

  const isLandscape = orientation === "landscape";
  const sectionGap = isLandscape ? "gap-0.5" : "gap-1";

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between border-t border-border bg-background sm:hidden z-50",
        "pt-safe pb-safe pr-safe pl-safe",
        isLandscape ? "h-12 px-2" : "h-14 px-4"
      )}
      data-orientation={orientation}
    >
      {/* Left: Thumbnails & Outline */}
      <div className={cn("flex items-center", sectionGap)}>
        <Button variant="ghost" size="icon" onClick={toggleThumbnails}>
          <LayoutGrid className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleOutline}>
          <BookOpen className="h-5 w-5" />
        </Button>
      </div>

      {/* Center: Page Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={previousPage}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span
          className={cn(
            "text-sm font-medium w-16 text-center",
            isLandscape && "text-xs w-14"
          )}
        >
          {currentPage} / {numPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextPage}
          disabled={currentPage >= numPages}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Right: Search & More Menu */}
      <div className={cn("flex items-center", sectionGap)}>
        <Button variant="ghost" size="icon" onClick={onSearch}>
          <Search className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={firstPage}>
              <Home className="mr-2 h-4 w-4" />
              <span>{t("toolbar.tooltip.first_page")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={lastPage}>
              <Home className="mr-2 h-4 w-4 rotate-180" />
              <span>{t("toolbar.tooltip.last_page")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={rotateClockwise}>
              <RotateCw className="mr-2 h-4 w-4" />
              <span>{t("toolbar.tooltip.rotate_cw")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFitMode("fitWidth")}>
              <Maximize2 className="mr-2 h-4 w-4 rotate-90" />
              <span>{t("toolbar.tooltip.fit_width")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleDarkMode}>
              {isDarkMode ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>
                {isDarkMode
                  ? t("toolbar.tooltip.light_mode")
                  : t("toolbar.tooltip.dark_mode")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("menu.settings.label")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
