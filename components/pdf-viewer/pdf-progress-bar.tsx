"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { usePDFStore } from "@/lib/pdf-store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Navigation2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PDFProgressBarProps {
  className?: string;
  alwaysShow?: boolean;
}

export function PDFProgressBar({ className, alwaysShow }: PDFProgressBarProps) {
  const {
    currentPage,
    numPages,
    showPageNavigationInBottomBar,
    toggleBottomBarMode,
    goToPage,
    firstPage,
    lastPage,
    nextPage,
    previousPage,
  } = usePDFStore();

  // Local state for page input
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Update page input when currentPage changes externally
  useEffect(() => {
    if (document.activeElement?.tagName !== "INPUT") {
      const timeoutId = setTimeout(() => {
        setPageInput(currentPage.toString());
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage]);

  const handlePageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      goToPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // Calculate progress percentage
  const progress =
    numPages > 0 ? ((currentPage - 1) / (numPages - 1)) * 100 : 0;

  return (
    <TooltipProvider>
      <div
        className={cn(
          // Fixed positioning at bottom of viewport
          "fixed bottom-0 left-0 right-0 z-40",
          // Hide on mobile portrait unless forced
          alwaysShow ? "block" : "hidden sm:block",
          // Background and border styling
          "bg-background/95 backdrop-blur-sm border-t border-border",
          // Padding - responsive for mobile (more compact)
          "px-3 py-1.5 sm:px-4 sm:py-2",
          // Shadow for depth
          "shadow-lg",
          // Fixed height for consistency (more compact)
          "h-[56px] sm:h-[60px]",
          className
        )}
      >
        <div className="flex items-center justify-between h-full">
          {/* Toggle button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBottomBarMode}
                className="h-8 w-8 shrink-0"
              >
                {showPageNavigationInBottomBar ? (
                  <BarChart3 className="h-4 w-4" />
                ) : (
                  <Navigation2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showPageNavigationInBottomBar
                ? "Show Reading Progress"
                : "Show Page Navigation"}
            </TooltipContent>
          </Tooltip>

          {/* Content area - either progress bar or page navigation */}
          <div className="flex-1 mx-3 sm:mx-4">
            {showPageNavigationInBottomBar ? (
              /* Page Navigation Mode */
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-1 sm:mr-2">
                  Page:
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={firstPage}
                      disabled={currentPage <= 1}
                      className="h-8 w-8"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>First Page (Home)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={previousPage}
                      disabled={currentPage <= 1}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous Page (←)</TooltipContent>
                </Tooltip>

                <form
                  onSubmit={handlePageInputSubmit}
                  className="flex items-center gap-1 sm:gap-2"
                >
                  <Input
                    type="text"
                    value={pageInput}
                    onChange={handlePageInputChange}
                    onBlur={() => setPageInput(currentPage.toString())}
                    className="w-12 sm:w-16 h-8 text-center text-xs sm:text-sm"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    / {numPages}
                  </span>
                </form>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextPage}
                      disabled={currentPage >= numPages}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Page (→)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={lastPage}
                      disabled={currentPage >= numPages}
                      className="h-8 w-8"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Last Page (End)</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              /* Progress Bar Mode */
              <div>
                <Progress value={Math.min(100, Math.max(0, progress))} />
                <div className="mt-1 sm:mt-1.5 flex justify-between text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium">Page {currentPage}</span>
                  <span className="font-semibold tabular-nums">
                    {Math.round(progress)}%
                  </span>
                  <span className="font-medium">{numPages} pages</span>
                </div>
              </div>
            )}
          </div>

          {/* Spacer to balance the toggle button */}
          <div className="h-8 w-8 shrink-0" />
        </div>
      </div>
    </TooltipProvider>
  );
}
