"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { usePDFStore } from "@/lib/pdf";
import { PDFPage } from "../page";
import { PDFPageProxy } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Clock,
  Pointer,
  Pencil,
  Focus,
  Play,
  Pause,
  Undo2,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTouchGestures } from "@/hooks/use-touch-gestures";

interface PresentationModeProps {
  pdfDocument: {
    numPages: number;
    getPage: (num: number) => Promise<PDFPageProxy>;
  } | null;
  rotation: number;
  pageRotations: Record<number, number>;
  pageOrder: number[];
}

export function PresentationMode({
  pdfDocument,
  rotation,
  pageRotations,
  pageOrder,
}: PresentationModeProps) {
  const { t } = useTranslation();
  const {
    currentPage,
    numPages,
    nextPage,
    previousPage: goToPreviousPage,
    isPresentationMode,
    togglePresentationMode,
    goToPage,
  } = usePDFStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(
    null
  );
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [lastPage, setLastPage] = useState(currentPage);
  const [screenOverlay, setScreenOverlay] = useState<
    "none" | "black" | "white"
  >("none");
  const [showLaserPointer, setShowLaserPointer] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });
  const [showOverview, setShowOverview] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [allPageObjs, setAllPageObjs] = useState<(PDFPageProxy | null)[]>([]);
  const [showPenTool, setShowPenTool] = useState(false);
  const [penStrokes, setPenStrokes] = useState<
    Map<number, { x: number; y: number }[][]>
  >(new Map());
  const [currentStroke, setCurrentStroke] = useState<
    { x: number; y: number }[]
  >([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0 });
  const [jumpToSlideInput, setJumpToSlideInput] = useState("");
  const [showJumpInput, setShowJumpInput] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceInterval] = useState(5); // seconds
  const [showThumbnailStrip, setShowThumbnailStrip] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [penColorPicker, setPenColorPicker] = useState(false);
  const [selectedPenColor, setSelectedPenColor] = useState("#ff0000");
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presentationStartTime = useRef<number>(0);

  // Touch gesture support for mobile
  useTouchGestures(containerRef, {
    onSwipeLeft: useCallback(() => {
      if (!showOverview && !showHelp && screenOverlay === "none") {
        nextPage();
      }
    }, [showOverview, showHelp, screenOverlay, nextPage]),
    onSwipeRight: useCallback(() => {
      if (!showOverview && !showHelp && screenOverlay === "none") {
        goToPreviousPage();
      }
    }, [showOverview, showHelp, screenOverlay, goToPreviousPage]),
    onDoubleTap: useCallback(() => {
      setIsControlsVisible((prev) => !prev);
    }, []),
    minSwipeDistance: 50,
  });

  // Calculate slide direction based on last page
  const slideDirection = useMemo(() => {
    if (currentPage > lastPage) {
      return "next" as const;
    } else if (currentPage < lastPage) {
      return "prev" as const;
    }
    return null;
  }, [currentPage, lastPage]);

  // Update last page after currentPage changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLastPage(currentPage);
    }, 300); // After animation completes
    return () => clearTimeout(timeout);
  }, [currentPage]);

  // Exit presentation helper - defined early to avoid hoisting issues
  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    togglePresentationMode();
  }, [togglePresentationMode]);

  // Load current page
  useEffect(() => {
    if (!pdfDocument || !isPresentationMode) return;

    const loadPage = async () => {
      try {
        const originalPageNum =
          pageOrder.length > 0 ? pageOrder[currentPage - 1] : currentPage;
        const page = await pdfDocument.getPage(originalPageNum);
        setCurrentPageObj(page);
      } catch (err) {
        console.error("Error loading page for presentation:", err);
      }
    };

    loadPage();
  }, [pdfDocument, currentPage, pageOrder, isPresentationMode]);

  // Enter fullscreen when presentation mode starts
  useEffect(() => {
    if (!isPresentationMode) return;

    const enterFullscreen = async () => {
      try {
        if (
          containerRef.current &&
          document.fullscreenElement !== containerRef.current
        ) {
          await containerRef.current.requestFullscreen();
        }
      } catch (err) {
        console.error("Failed to enter fullscreen:", err);
      }
    };

    enterFullscreen();

    // Handle fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isPresentationMode) {
        togglePresentationMode();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isPresentationMode, togglePresentationMode]);

  // Keyboard navigation
  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
        case "Enter":
        case "PageDown":
          e.preventDefault();
          if (currentPage < numPages) {
            nextPage();
          }
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "Backspace":
        case "PageUp":
          e.preventDefault();
          if (currentPage > 1) {
            goToPreviousPage();
          }
          break;
        case "Home":
          e.preventDefault();
          goToPage(1);
          break;
        case "End":
          e.preventDefault();
          goToPage(numPages);
          break;
        case "Escape":
          e.preventDefault();
          if (showOverview) {
            setShowOverview(false);
          } else if (screenOverlay !== "none") {
            setScreenOverlay("none");
          } else {
            exitPresentation();
          }
          break;
        case "b":
        case "B":
          e.preventDefault();
          setScreenOverlay((prev) => (prev === "black" ? "none" : "black"));
          break;
        case "w":
        case "W":
          e.preventDefault();
          setScreenOverlay((prev) => (prev === "white" ? "none" : "white"));
          break;
        case "l":
        case "L":
          e.preventDefault();
          setShowLaserPointer((prev) => !prev);
          break;
        case "g":
        case "G":
          e.preventDefault();
          setShowOverview((prev) => !prev);
          break;
        case "t":
        case "T":
          e.preventDefault();
          setShowTimer((prev) => !prev);
          break;
        case "p":
        case "P":
          e.preventDefault();
          setShowPenTool((prev) => !prev);
          setShowLaserPointer(false);
          setShowSpotlight(false);
          break;
        case "s":
        case "S":
          e.preventDefault();
          setShowSpotlight((prev) => !prev);
          setShowLaserPointer(false);
          setShowPenTool(false);
          break;
        case "a":
        case "A":
          e.preventDefault();
          setAutoAdvance((prev) => !prev);
          break;
        case "f":
        case "F":
          e.preventDefault();
          setShowThumbnailStrip((prev) => !prev);
          break;
        case "h":
        case "H":
        case "?":
          e.preventDefault();
          setShowHelp((prev) => !prev);
          break;
        case "c":
        case "C":
          // Clear drawings on current page
          if (showPenTool) {
            e.preventDefault();
            setPenStrokes((prev) => {
              const newMap = new Map(prev);
              newMap.delete(currentPage);
              return newMap;
            });
          }
          break;
        case "z":
        case "Z":
          // Undo last stroke on current page
          if (showPenTool && e.ctrlKey) {
            e.preventDefault();
            setPenStrokes((prev) => {
              const newMap = new Map(prev);
              const pageStrokes = newMap.get(currentPage) || [];
              if (pageStrokes.length > 0) {
                newMap.set(currentPage, pageStrokes.slice(0, -1));
              }
              return newMap;
            });
          }
          break;
        default:
          // Handle number keys for jump to slide
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            setShowJumpInput(true);
            setJumpToSlideInput((prev) => prev + e.key);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPresentationMode,
    currentPage,
    numPages,
    nextPage,
    goToPreviousPage,
    goToPage,
    exitPresentation,
    showOverview,
    screenOverlay,
    showPenTool,
  ]);

  // Mouse click navigation
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't navigate if clicking on controls
      if ((e.target as HTMLElement).closest("[data-controls]")) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const isLeftSide = clickX < rect.width / 3;
      const isRightSide = clickX > (rect.width * 2) / 3;

      if (isLeftSide && currentPage > 1) {
        goToPreviousPage();
      } else if (isRightSide || (!isLeftSide && currentPage < numPages)) {
        nextPage();
      }
    },
    [currentPage, numPages, nextPage, goToPreviousPage]
  );

  // Show controls on mouse move and update laser/spotlight/pen position
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setIsControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3000);

      // Update laser pointer position
      if (showLaserPointer) {
        setLaserPosition({ x: e.clientX, y: e.clientY });
      }

      // Update spotlight position
      if (showSpotlight) {
        setSpotlightPosition({ x: e.clientX, y: e.clientY });
      }

      // Draw with pen tool
      if (showPenTool && isDrawing) {
        setCurrentStroke((prev) => [...prev, { x: e.clientX, y: e.clientY }]);
      }
    },
    [showLaserPointer, showSpotlight, showPenTool, isDrawing]
  );

  // Pen tool mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        showPenTool &&
        !(e.target as HTMLElement).closest("[data-controls]")
      ) {
        setIsDrawing(true);
        setCurrentStroke([{ x: e.clientX, y: e.clientY }]);
      }
    },
    [showPenTool]
  );

  const handleMouseUp = useCallback(() => {
    if (showPenTool && isDrawing && currentStroke.length > 0) {
      setPenStrokes((prev) => {
        const newMap = new Map(prev);
        const pageStrokes = newMap.get(currentPage) || [];
        newMap.set(currentPage, [...pageStrokes, currentStroke]);
        return newMap;
      });
      setCurrentStroke([]);
      setIsDrawing(false);
    }
  }, [showPenTool, isDrawing, currentStroke, currentPage]);

  // Timer effect
  useEffect(() => {
    if (!isPresentationMode || !showTimer) return;

    const interval = setInterval(() => {
      setElapsedTime(
        Math.floor((Date.now() - presentationStartTime.current) / 1000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isPresentationMode, showTimer]);

  // Reset timer when entering presentation mode
  useEffect(() => {
    if (isPresentationMode && presentationStartTime.current === 0) {
      presentationStartTime.current = Date.now();
    }
    if (!isPresentationMode) {
      presentationStartTime.current = 0;
    }
  }, [isPresentationMode]);

  // Load all pages for overview
  useEffect(() => {
    if (!pdfDocument || !showOverview) return;

    const loadAllPages = async () => {
      const pages: (PDFPageProxy | null)[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          pages.push(page);
        } catch {
          pages.push(null);
        }
      }
      setAllPageObjs(pages);
    };

    loadAllPages();
  }, [pdfDocument, showOverview]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-advance effect
  useEffect(() => {
    if (!isPresentationMode || !autoAdvance) return;

    const interval = setInterval(() => {
      if (currentPage < numPages) {
        nextPage();
      } else {
        setAutoAdvance(false); // Stop at last slide
      }
    }, autoAdvanceInterval * 1000);

    return () => clearInterval(interval);
  }, [
    isPresentationMode,
    autoAdvance,
    autoAdvanceInterval,
    currentPage,
    numPages,
    nextPage,
  ]);

  // Jump to slide effect
  useEffect(() => {
    if (!showJumpInput || jumpToSlideInput === "") return;

    const timeout = setTimeout(() => {
      const pageNum = parseInt(jumpToSlideInput, 10);
      if (pageNum >= 1 && pageNum <= numPages) {
        goToPage(pageNum);
      }
      setJumpToSlideInput("");
      setShowJumpInput(false);
    }, 1500); // Wait 1.5s after last digit

    return () => clearTimeout(timeout);
  }, [jumpToSlideInput, showJumpInput, numPages, goToPage]);

  // Load pages for thumbnail strip
  useEffect(() => {
    if (!pdfDocument || (!showThumbnailStrip && !showOverview)) return;
    if (allPageObjs.length === pdfDocument.numPages) return;

    const loadAllPages = async () => {
      const pages: (PDFPageProxy | null)[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          pages.push(page);
        } catch {
          pages.push(null);
        }
      }
      setAllPageObjs(pages);
    };

    loadAllPages();
  }, [pdfDocument, showThumbnailStrip, showOverview, allPageObjs.length]);

  // Touch navigation
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;

      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0 && currentPage < numPages) {
          nextPage();
        } else if (deltaX > 0 && currentPage > 1) {
          goToPreviousPage();
        }
      }

      touchStartRef.current = null;
    },
    [currentPage, numPages, nextPage, goToPreviousPage]
  );

  // Track container size for scale calculation
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Calculate scale using useMemo to avoid setState in effect
  const scale = useMemo(() => {
    if (!currentPageObj || containerSize.width === 0) return 1;

    const viewport = currentPageObj.getViewport({ scale: 1, rotation });

    // Add padding
    const padding = 40;
    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - padding * 2;

    const scaleX = availableWidth / viewport.width;
    const scaleY = availableHeight / viewport.height;

    return Math.min(scaleX, scaleY);
  }, [currentPageObj, rotation, containerSize]);

  if (!isPresentationMode) return null;

  const originalPageNum =
    pageOrder.length > 0 ? pageOrder[currentPage - 1] : currentPage;
  const pageRotation = (rotation + (pageRotations[originalPageNum] || 0)) % 360;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-none"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor:
          isControlsVisible || showLaserPointer || showPenTool || showSpotlight
            ? showPenTool
              ? "crosshair"
              : "default"
            : "none",
      }}
    >
      {/* Spotlight overlay */}
      {showSpotlight && (
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle 150px at ${spotlightPosition.x}px ${spotlightPosition.y}px, transparent 0%, rgba(0,0,0,0.85) 100%)`,
          }}
        />
      )}

      {/* Pen strokes SVG overlay */}
      <svg
        className="absolute inset-0 z-25 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Saved strokes for current page */}
        {(penStrokes.get(currentPage) || []).map((stroke, strokeIndex) => (
          <polyline
            key={strokeIndex}
            points={stroke.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={selectedPenColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Current stroke being drawn */}
        {currentStroke.length > 0 && (
          <polyline
            points={currentStroke.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={selectedPenColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Jump to slide input */}
      {showJumpInput && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-black/80 backdrop-blur-sm px-8 py-4 rounded-xl text-white text-center">
            <div className="text-sm opacity-70 mb-2">
              {t("presentation.go_to_slide", { defaultValue: "Go to slide" })}
            </div>
            <div className="text-5xl font-bold font-mono">
              {jumpToSlideInput || "_"}
            </div>
          </div>
        </div>
      )}

      {/* Auto-advance indicator */}
      {autoAdvance && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/30 backdrop-blur-sm text-white text-sm">
          <Play className="h-4 w-4" />
          <span>
            {t("presentation.auto_advance", { defaultValue: "Auto" })} (
            {autoAdvanceInterval}s)
          </span>
        </div>
      )}

      {/* Black/White screen overlay */}
      {screenOverlay !== "none" && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
            screenOverlay === "black" ? "bg-black" : "bg-white"
          )}
          onClick={() => setScreenOverlay("none")}
        >
          <p
            className={cn(
              "text-sm opacity-50",
              screenOverlay === "black" ? "text-white" : "text-black"
            )}
          >
            {t("presentation.click_to_resume", {
              defaultValue: "Click to resume",
            })}
          </p>
        </div>
      )}

      {/* Slide overview/grid */}
      {showOverview && (
        <div
          data-controls
          className="absolute inset-0 z-40 bg-black/95 overflow-auto p-4 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-white text-lg sm:text-xl font-semibold">
              {t("presentation.slide_overview", {
                defaultValue: "Slide Overview",
              })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowOverview(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
            {Array.from({ length: numPages }).map((_, index) => {
              const pageNum = index + 1;
              const pageObj = allPageObjs[index];
              return (
                <button
                  key={pageNum}
                  className={cn(
                    "relative group rounded-lg overflow-hidden border-2 transition-all",
                    currentPage === pageNum
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-transparent hover:border-white/50"
                  )}
                  onClick={() => {
                    goToPage(pageNum);
                    setShowOverview(false);
                  }}
                >
                  <div className="aspect-[4/3] bg-gray-800 flex items-center justify-center">
                    {pageObj ? (
                      <PDFPage
                        page={pageObj}
                        scale={0.15}
                        rotation={
                          (rotation + (pageRotations[pageNum] || 0)) % 360
                        }
                        className="max-w-full max-h-full"
                      />
                    ) : (
                      <div className="animate-pulse bg-gray-700 w-full h-full" />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                    {pageNum}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Help overlay */}
      {showHelp && (
        <div
          data-controls
          className="absolute inset-0 z-50 bg-black/95 overflow-auto p-4 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-xl font-semibold">
                {t("presentation.help_title", {
                  defaultValue: "Keyboard Shortcuts",
                })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowHelp(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-white">
              {/* Navigation */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">
                  {t("presentation.help_navigation", {
                    defaultValue: "Navigation",
                  })}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>← → ↑ ↓</span>
                    <span className="text-white/60">
                      {t("presentation.help_nav_arrows", {
                        defaultValue: "Navigate slides",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Space / Enter</span>
                    <span className="text-white/60">
                      {t("presentation.help_next", {
                        defaultValue: "Next slide",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Home / End</span>
                    <span className="text-white/60">
                      {t("presentation.help_first_last", {
                        defaultValue: "First / Last slide",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>1-9</span>
                    <span className="text-white/60">
                      {t("presentation.help_jump", {
                        defaultValue: "Jump to slide",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>G</span>
                    <span className="text-white/60">
                      {t("presentation.help_grid", {
                        defaultValue: "Slide overview",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>F</span>
                    <span className="text-white/60">
                      {t("presentation.help_filmstrip", {
                        defaultValue: "Thumbnail strip",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">
                  {t("presentation.help_tools", { defaultValue: "Tools" })}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>L</span>
                    <span className="text-white/60">
                      {t("presentation.help_laser", {
                        defaultValue: "Laser pointer",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>P</span>
                    <span className="text-white/60">
                      {t("presentation.help_pen", {
                        defaultValue: "Pen / Drawing",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>S</span>
                    <span className="text-white/60">
                      {t("presentation.help_spotlight", {
                        defaultValue: "Spotlight",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+Z</span>
                    <span className="text-white/60">
                      {t("presentation.help_undo", {
                        defaultValue: "Undo drawing",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>C</span>
                    <span className="text-white/60">
                      {t("presentation.help_clear", {
                        defaultValue: "Clear drawings",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Display */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">
                  {t("presentation.help_display", { defaultValue: "Display" })}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>B</span>
                    <span className="text-white/60">
                      {t("presentation.help_black", {
                        defaultValue: "Black screen",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>W</span>
                    <span className="text-white/60">
                      {t("presentation.help_white", {
                        defaultValue: "White screen",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>T</span>
                    <span className="text-white/60">
                      {t("presentation.help_timer", {
                        defaultValue: "Toggle timer",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>A</span>
                    <span className="text-white/60">
                      {t("presentation.help_auto", {
                        defaultValue: "Auto-advance",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Other */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-primary">
                  {t("presentation.help_other", { defaultValue: "Other" })}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>H / ?</span>
                    <span className="text-white/60">
                      {t("presentation.help_show_help", {
                        defaultValue: "Show this help",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESC</span>
                    <span className="text-white/60">
                      {t("presentation.help_exit", {
                        defaultValue: "Exit presentation",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Touch gestures - mobile only */}
              <div className="space-y-3 sm:col-span-2">
                <h3 className="text-lg font-medium text-primary">
                  {t("presentation.help_touch", {
                    defaultValue: "Touch Gestures",
                  })}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      ←{" "}
                      {t("presentation.help_swipe", { defaultValue: "Swipe" })}
                    </span>
                    <span className="text-white/60">
                      {t("presentation.help_next", {
                        defaultValue: "Next slide",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      →{" "}
                      {t("presentation.help_swipe", { defaultValue: "Swipe" })}
                    </span>
                    <span className="text-white/60">
                      {t("presentation.help_prev", {
                        defaultValue: "Previous slide",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {t("presentation.help_double_tap", {
                        defaultValue: "Double tap",
                      })}
                    </span>
                    <span className="text-white/60">
                      {t("presentation.help_toggle_controls", {
                        defaultValue: "Toggle controls",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Laser pointer */}
      {showLaserPointer && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: laserPosition.x - 8,
            top: laserPosition.y - 8,
          }}
        >
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_4px_rgba(239,68,68,0.7)] animate-pulse" />
        </div>
      )}

      {/* Page content */}
      {!showOverview && (
        <div
          key={currentPage}
          className={cn(
            "transition-all duration-300 ease-out",
            slideDirection === "next" &&
              "animate-in slide-in-from-right-4 fade-in",
            slideDirection === "prev" &&
              "animate-in slide-in-from-left-4 fade-in"
          )}
        >
          {currentPageObj ? (
            <PDFPage
              page={currentPageObj}
              scale={scale}
              rotation={pageRotation}
              className="shadow-2xl"
            />
          ) : (
            <div className="flex items-center justify-center w-96 h-64 bg-gray-800 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
          )}
        </div>
      )}

      {/* Navigation arrows - visible on hover */}
      <div
        data-controls
        className={cn(
          "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 transition-opacity duration-300",
          isControlsVisible && currentPage > 1 ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
          onClick={(e) => {
            e.stopPropagation();
            goToPreviousPage();
          }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      </div>

      <div
        data-controls
        className={cn(
          "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 transition-opacity duration-300",
          isControlsVisible && currentPage < numPages
            ? "opacity-100"
            : "opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
          onClick={(e) => {
            e.stopPropagation();
            nextPage();
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Top controls bar */}
      <div
        data-controls
        className={cn(
          "absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-wrap items-center justify-end gap-1 sm:gap-2 transition-opacity duration-300 max-w-[70vw] sm:max-w-none",
          isControlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Timer toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white",
            showTimer ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowTimer(!showTimer);
          }}
          title={t("presentation.toggle_timer", {
            defaultValue: "Toggle Timer (T)",
          })}
        >
          <Clock className="h-5 w-5" />
        </Button>

        {/* Laser pointer toggle - hidden on mobile (not useful without mouse) */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white",
            showLaserPointer ? "bg-red-500/50" : "bg-white/10 hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowLaserPointer(!showLaserPointer);
          }}
          title={t("presentation.toggle_laser", {
            defaultValue: "Toggle Laser Pointer (L)",
          })}
        >
          <Pointer className="h-5 w-5" />
        </Button>

        {/* Grid/Overview toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white",
            showOverview ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowOverview(!showOverview);
          }}
          title={t("presentation.toggle_overview", {
            defaultValue: "Toggle Overview (G)",
          })}
        >
          <Grid3X3 className="h-5 w-5" />
        </Button>

        {/* Pen tool toggle - hidden on mobile (not useful without mouse) */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white",
            showPenTool ? "bg-red-500/50" : "bg-white/10 hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowPenTool(!showPenTool);
            setShowLaserPointer(false);
            setShowSpotlight(false);
          }}
          title={t("presentation.toggle_pen", {
            defaultValue: "Toggle Pen (P)",
          })}
        >
          <Pencil className="h-5 w-5" />
        </Button>

        {/* Spotlight toggle - hidden on mobile (not useful without mouse) */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white",
            showSpotlight ? "bg-yellow-500/50" : "bg-white/10 hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowSpotlight(!showSpotlight);
            setShowLaserPointer(false);
            setShowPenTool(false);
          }}
          title={t("presentation.toggle_spotlight", {
            defaultValue: "Toggle Spotlight (S)",
          })}
        >
          <Focus className="h-5 w-5" />
        </Button>

        {/* Auto-advance toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white",
            autoAdvance ? "bg-green-500/50" : "bg-white/10 hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setAutoAdvance(!autoAdvance);
          }}
          title={t("presentation.toggle_auto", {
            defaultValue: "Toggle Auto-advance (A)",
          })}
        >
          {autoAdvance ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Help button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white",
            showHelp ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp(!showHelp);
          }}
          title={t("presentation.help", { defaultValue: "Help (H)" })}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Exit button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
          onClick={(e) => {
            e.stopPropagation();
            exitPresentation();
          }}
          title={t("presentation.exit", { defaultValue: "Exit (ESC)" })}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Timer display */}
      {showTimer && (
        <div
          data-controls
          className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs sm:text-sm font-mono"
        >
          {formatTime(elapsedTime)}
        </div>
      )}

      {/* Page counter - bottom center */}
      <div
        data-controls
        className={cn(
          "absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-300",
          isControlsVisible ? "opacity-100" : "opacity-30",
          showThumbnailStrip && "bottom-24 sm:bottom-28"
        )}
      >
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs sm:text-sm font-medium">
          {t("presentation.page_counter", {
            current: currentPage,
            total: numPages,
            defaultValue: `${currentPage} / ${numPages}`,
          })}
        </div>
      </div>

      {/* Pen tool controls */}
      {showPenTool && (
        <div
          data-controls
          className={cn(
            "absolute bottom-16 sm:bottom-20 right-2 sm:right-4 flex flex-col gap-1 sm:gap-2 transition-opacity duration-300",
            isControlsVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Color picker */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setPenColorPicker((prev) => !prev);
              }}
              title={t("presentation.pen_color", { defaultValue: "Pen Color" })}
            >
              <div
                className="h-5 w-5 rounded-full border-2 border-white"
                style={{ backgroundColor: selectedPenColor }}
              />
            </Button>
            {penColorPicker && (
              <div
                className="absolute right-12 top-0 flex gap-1 p-2 bg-black/80 backdrop-blur-sm rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  "#ff0000",
                  "#00ff00",
                  "#0000ff",
                  "#ffff00",
                  "#ff00ff",
                  "#00ffff",
                  "#ffffff",
                ].map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      selectedPenColor === color
                        ? "border-white scale-110"
                        : "border-transparent hover:border-white/50"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedPenColor(color);
                      setPenColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              // Undo last stroke
              setPenStrokes((prev) => {
                const newMap = new Map(prev);
                const pageStrokes = newMap.get(currentPage) || [];
                if (pageStrokes.length > 0) {
                  newMap.set(currentPage, pageStrokes.slice(0, -1));
                }
                return newMap;
              });
            }}
            title={t("presentation.undo", { defaultValue: "Undo (Ctrl+Z)" })}
          >
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              // Clear all strokes on current page
              setPenStrokes((prev) => {
                const newMap = new Map(prev);
                newMap.delete(currentPage);
                return newMap;
              });
            }}
            title={t("presentation.clear", { defaultValue: "Clear (C)" })}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Thumbnail strip at bottom */}
      {showThumbnailStrip && (
        <div
          data-controls
          className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-30 px-2 sm:px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 overflow-x-auto">
            <div className="flex gap-1.5 sm:gap-2 justify-start sm:justify-center">
              {Array.from({ length: numPages }).map((_, index) => {
                const pageNum = index + 1;
                const pageObj = allPageObjs[index];
                return (
                  <button
                    key={pageNum}
                    className={cn(
                      "relative flex-shrink-0 rounded overflow-hidden border-2 transition-all",
                      currentPage === pageNum
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-transparent hover:border-white/50"
                    )}
                    onClick={() => goToPage(pageNum)}
                  >
                    <div className="w-12 h-9 sm:w-16 sm:h-12 bg-gray-800 flex items-center justify-center">
                      {pageObj ? (
                        <PDFPage
                          page={pageObj}
                          scale={0.08}
                          rotation={
                            (rotation + (pageRotations[pageNum] || 0)) % 360
                          }
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <span className="text-white/50 text-xs">{pageNum}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard hints - bottom left (hidden on mobile) */}
      <div
        data-controls
        className={cn(
          "absolute bottom-4 sm:bottom-6 left-4 sm:left-6 transition-opacity duration-300 hidden sm:block",
          isControlsVisible && !showThumbnailStrip ? "opacity-60" : "opacity-0"
        )}
      >
        <div className="text-white/70 text-xs space-y-1">
          <div>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              ←
            </kbd>{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              →
            </kbd>{" "}
            {t("presentation.navigate", { defaultValue: "Navigate" })}{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              1-9
            </kbd>{" "}
            {t("presentation.jump", { defaultValue: "Jump" })}
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              P
            </kbd>{" "}
            {t("presentation.pen", { defaultValue: "Pen" })}{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              S
            </kbd>{" "}
            {t("presentation.spotlight", { defaultValue: "Spot" })}{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              A
            </kbd>{" "}
            {t("presentation.auto", { defaultValue: "Auto" })}
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              B
            </kbd>{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              W
            </kbd>{" "}
            {t("presentation.blank_screen", { defaultValue: "Blank" })}{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              F
            </kbd>{" "}
            {t("presentation.filmstrip", { defaultValue: "Strip" })}
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              G
            </kbd>{" "}
            {t("presentation.overview", { defaultValue: "Grid" })}{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              L
            </kbd>{" "}
            {t("presentation.laser", { defaultValue: "Laser" })}{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
              ESC
            </kbd>{" "}
            {t("presentation.exit", { defaultValue: "Exit" })}
          </div>
        </div>
      </div>

      {/* Progress bar - bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-white/50 transition-all duration-300"
          style={{ width: `${(currentPage / numPages) * 100}%` }}
        />
      </div>
    </div>
  );
}
