"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { usePDFStore } from "@/lib/pdf-store";
import {
  loadPDFDocument,
  searchInPDF,
  downloadPDF,
  printPDF,
  savePDF,
  PDFDocumentProxy,
  PDFPageProxy,
} from "@/lib/pdf-utils";
import { PDFToolbar } from "./pdf-toolbar";
import { PDFMobileToolbar } from "./pdf-mobile-toolbar";
import { PDFTTSReader } from "./pdf-tts-reader";
import { PDFPage } from "./pdf-page";
import { PasswordDialog } from "./password-dialog";
import { PDFDraggableThumbnail } from "./pdf-draggable-thumbnail";
import { PDFOutline } from "./pdf-outline";
import { PDFBookmarks } from "./pdf-bookmarks";
import { PDFAnnotationsList } from "./pdf-annotations-list";
import { PDFProgressBar } from "./pdf-progress-bar";
import { PDFTextLayer } from "./pdf-text-layer";
import { PDFAnnotationLayer } from "./pdf-annotation-layer";
import { PDFDrawingLayer } from "./pdf-drawing-layer";
import { PDFSelectionLayer } from "./pdf-selection-layer";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTouchGestures } from "@/hooks/use-touch-gestures";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnnotationStamp } from "@/lib/pdf-store";
import { Button } from "@/components/ui/button";
import { PDFLoadingAnimation } from "./loading-animations";
import { useTranslation } from "react-i18next";
import { revealInFileManager, isTauri, getFileTimes } from "@/lib/tauri-bridge";
import { SignatureDialog } from "./signature-dialog";
import { useDeviceOrientation } from "@/hooks/use-device-orientation";

interface PDFViewerProps {
  file: File;
  onClose: () => void;
  header?: ReactNode;
  onOpenFileFromMenu?: (file: File | File[]) => void;
  onFileUpdate?: (newFile: File) => void;
}

export function PDFViewer({
  file,
  onClose,
  header,
  onOpenFileFromMenu,
  onFileUpdate,
}: PDFViewerProps) {
  const { t } = useTranslation();
  const {
    currentPage,
    zoom,
    rotation,
    showThumbnails,
    showOutline,
    showAnnotations,
    isDarkMode,
    themeMode,
    isFullscreen,
    showKeyboardShortcuts,
    numPages,
    viewMode,
    fitMode,
    outline,
    annotations,
    caseSensitiveSearch,
    searchQuery,
    selectedAnnotationColor,
    selectedStrokeWidth,
    setNumPages,
    setCurrentPage,
    setZoom,
    setOutline,
    setMetadata,
    setCurrentPDF,
    goToPage,
    nextPage,
    previousPage,
    addRecentFile,
    setSearchResults,
    updateReadingProgress,
    addStampAnnotation,
    addImageAnnotation,
    toggleKeyboardShortcuts,
    pageOrder,
    reorderPages,
    pageRotations,
    removePage,
    rotatePage,
    isSelectionMode,
    pdfLoadingAnimation,
    updateRecentFileByUrl,
    scrollSensitivity,
    scrollThreshold,
    scrollDebounce,
    enableSmoothScrolling,
    invertWheel,
    zoomStep,
    sidebarInitialWidth,
  } = usePDFStore();

  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(
    null
  );
  const [allPages, setAllPages] = useState<(PDFPageProxy | null)[]>([]);
  const [thumbnailPages, setThumbnailPages] = useState<(PDFPageProxy | null)[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const lastScrollTop = useRef<number>(0);
  const isScrollingProgrammatically = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastThrottleTimeRef = useRef<number>(0);
  const shouldScrollToBottomRef = useRef(false);
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageDimensionsRef = useRef<
    Map<number, { width: number; height: number }>
  >(new Map());
  const recentFileUrlRef = useRef<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    // Load saved width from localStorage or use default
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pdf-sidebar-width");
      if (saved) return parseInt(saved, 10);
      // Responsive default: smaller on mobile
      return window.innerWidth < 640 ? 200 : sidebarInitialWidth;
    }
    return sidebarInitialWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const {
    orientation,
    isMobile,
    isMobileLandscape,
  } = useDeviceOrientation();
  const [selectedAnnotationType, setSelectedAnnotationType] = useState<
    "highlight" | "comment" | "shape" | "text" | "drawing" | null
  >(null);
  const [pendingStamp, setPendingStamp] = useState<AnnotationStamp | null>(
    null
  );
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const touchContainerRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef<number>(currentPage);
  const [pageDirection, setPageDirection] = useState<
    "forward" | "backward" | "none"
  >("none");
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [extractedTextTitle, setExtractedTextTitle] = useState("");
  const [showExtractDialog, setShowExtractDialog] = useState(false);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  const handleRenderSuccess = useCallback(() => {
    if (shouldScrollToBottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for page reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pageOrder.indexOf(Number(active.id));
      const newIndex = pageOrder.indexOf(Number(over.id));

      const newOrder = arrayMove(pageOrder, oldIndex, newIndex);
      reorderPages(newOrder);
    }
  };

  const handleRevealInFileManager = () => {
    const nativePath =
      (file as File & { __nativePath?: string | null }).__nativePath ?? null;
    if (!nativePath) return;
    void revealInFileManager(nativePath);
  };

  const handlePasswordSubmit = (newPassword: string) => {
    setPassword(newPassword);
    setPasswordError(false);
  };

  // Load PDF document
  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);

        const pdf = await loadPDFDocument(
          file,
          (progress) => {
            if (mounted) {
              setLoadingProgress(
                Math.round((progress.loaded / progress.total) * 100)
              );
            }
          },
          password
        );

        if (!mounted) return;

        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPDF(file);

        // Load metadata
        try {
          const metadata = await pdf.getMetadata();
          if (metadata) {
            const nativePath =
              (file as File & { __nativePath?: string | null }).__nativePath ??
              null;
            let fileCreatedAt: string | undefined;
            let fileModifiedAt: string | undefined =
              Number.isFinite(file.lastModified)
                ? new Date(file.lastModified).toISOString()
                : undefined;

            if (isTauri() && nativePath) {
              const times = await getFileTimes(nativePath);
              if (times?.createdAt) {
                fileCreatedAt = times.createdAt;
              }
              if (times?.modifiedAt) {
                fileModifiedAt = times.modifiedAt;
              }
            }

            setMetadata({
              info: metadata.info,
              metadata: metadata.metadata,
              contentLength: file.size,
              fileCreatedAt,
              fileModifiedAt,
            });
          }
        } catch (err) {
          console.error("Error loading metadata:", err);
        }

        // Close password dialog if it was open
        setShowPasswordDialog(false);
        setPasswordError(false);

        // Initialize page order for drag-and-drop
        const { initializePageOrder: initOrder } = usePDFStore.getState();
        initOrder(pdf.numPages);

        // Add to recent files
        const url = URL.createObjectURL(file);
        recentFileUrlRef.current = url;
        const relPath = (file as File & { webkitRelativePath?: string })
          .webkitRelativePath;
        const nativePath =
          (file as File & { __nativePath?: string | null }).__nativePath ??
          null;
        const displayName = relPath && relPath.length > 0 ? relPath : file.name;
        addRecentFile({
          name: displayName,
          url,
          lastOpened: Date.now(),
          numPages: pdf.numPages,
          path: nativePath,
        });

        // Load outline/bookmarks
        try {
          const pdfOutline = await pdf.getOutline();
          if (pdfOutline) {
            // Process outline to include page numbers
            type OutlineItem = {
              title: string;
              bold?: boolean;
              italic?: boolean;
              color?: number[];
              dest?: string | unknown[];
              items?: OutlineItem[];
              pageNumber?: number;
            };

            const processOutline = async (
              items: OutlineItem[]
            ): Promise<OutlineItem[]> => {
              return Promise.all(
                items.map(async (item) => {
                  const processed: OutlineItem = {
                    title: item.title,
                    bold: item.bold,
                    italic: item.italic,
                    color: item.color,
                  };

                  // Try to get page number from destination
                  if (item.dest) {
                    try {
                      const dest =
                        typeof item.dest === "string"
                          ? await pdf.getDestination(item.dest)
                          : (item.dest as unknown[]);

                      if (dest && Array.isArray(dest) && dest[0]) {
                        const pageRef = dest[0];
                        const pageIndex = await pdf.getPageIndex(pageRef);
                        processed.pageNumber = pageIndex + 1;
                      }
                    } catch (err) {
                      console.error(
                        "Error getting page number for outline item:",
                        err
                      );
                    }
                  }

                  // Process children recursively
                  if (item.items && item.items.length > 0) {
                    processed.items = await processOutline(item.items);
                  }

                  return processed;
                })
              );
            };

            const processedOutline = await processOutline(
              pdfOutline as OutlineItem[]
            );
            setOutline(processedOutline);
          } else {
            setOutline([]);
          }
        } catch (err) {
          console.error("Error loading outline:", err);
          setOutline([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        if (mounted) {
          const errorName = (err as { name?: string }).name;
          if (errorName === "PasswordException") {
            setShowPasswordDialog(true);
            setPasswordError(!!password); // Set error if we already tried a password
            setIsLoading(false);
          } else {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to load PDF. The file may be corrupted or invalid.";
            setError(errorMessage);
            setIsLoading(false);
          }
        }
      }
    };

    loadPDF();

    return () => {
      mounted = false;
      const url = recentFileUrlRef.current;
      if (url) {
        URL.revokeObjectURL(url);
        recentFileUrlRef.current = null;
      }
    };
  }, [
    file,
    setNumPages,
    addRecentFile,
    setOutline,
    setMetadata,
    password,
    setCurrentPDF,
  ]);

  // Reset password state when file changes
  useEffect(() => {
    setPassword(undefined);
    setShowPasswordDialog(false);
    setPasswordError(false);
  }, [file]);

  // Load current page
  useEffect(() => {
    if (!pdfDocument) return;

    let mounted = true;

    const loadPage = async () => {
      try {
        const originalPageNum =
          pageOrder.length > 0 ? pageOrder[currentPage - 1] : currentPage;
        const page = await pdfDocument.getPage(originalPageNum);
        if (mounted) {
          setCurrentPageObj(page);
        }
      } catch (err) {
        console.error("Error loading page:", err);
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, [pdfDocument, currentPage, pageOrder]);

  // Load visible pages for continuous and two-page views (Lazy Loading)
  // Also enable for single view to support smooth transitions and pre-loading
  useEffect(() => {
    if (!pdfDocument) {
      setAllPages([]);
      loadedPagesRef.current.clear();
      return;
    }

    // Initialize array if needed
    setAllPages((prev) => {
      if (prev.length !== pdfDocument.numPages) {
        return new Array(pdfDocument.numPages).fill(null);
      }
      return prev;
    });

    // Determine range to load based on current page and view mode
    // For single view, load current + neighbors for smoother transitions
    const buffer =
      viewMode === "continuous" ? 4 : viewMode === "twoPage" ? 3 : 1;
    const start = Math.max(1, currentPage - buffer);
    const end = Math.min(pdfDocument.numPages, currentPage + buffer);

    const pagesToLoad: number[] = [];
    for (let i = start; i <= end; i++) {
      if (!loadedPagesRef.current.has(i)) {
        pagesToLoad.push(i);
        loadedPagesRef.current.add(i);
      }
    }

    if (pagesToLoad.length === 0) return;

    let mounted = true;

    const loadPages = async () => {
      const results = await Promise.all(
        pagesToLoad.map(async (visualPageNum) => {
          try {
            const originalPageNum =
              pageOrder.length > 0
                ? pageOrder[visualPageNum - 1]
                : visualPageNum;
            const page = await pdfDocument.getPage(originalPageNum);

            // Store page dimensions
            const viewport = page.getViewport({ scale: 1 });
            pageDimensionsRef.current.set(visualPageNum, {
              width: viewport.width,
              height: viewport.height,
            });

            return { index: visualPageNum - 1, page };
          } catch (err) {
            console.error(`Error loading page ${visualPageNum}:`, err);
            return null;
          }
        })
      );

      if (!mounted) return;

      setAllPages((prev) => {
        const updated = [...prev];
        let hasChanges = false;
        results.forEach((result) => {
          if (result) {
            updated[result.index] = result.page;
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    };

    loadPages();

    return () => {
      mounted = false;
    };
  }, [pdfDocument, viewMode, currentPage, numPages, pageOrder]);

  // Measure container width and apply fit modes with throttling for better performance
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;

    const updateContainerWidth = () => {
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.clientWidth;
        setContainerWidth(width);
      }
    };

    const throttledResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(updateContainerWidth, 150); // 150ms throttle
    };

    updateContainerWidth();
    window.addEventListener("resize", throttledResize);

    return () => {
      window.removeEventListener("resize", throttledResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [showThumbnails]);

  // Apply fit mode zoom with debouncing to prevent performance issues
  useEffect(() => {
    if (!currentPageObj || !containerWidth || fitMode === "custom") return;

    // Debounce the zoom calculation to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      const viewport = currentPageObj.getViewport({ scale: 1, rotation });
      const padding = 64; // Account for padding
      const availableWidth = containerWidth - padding;
      const availableHeight = window.innerHeight - 150; // Account for toolbar

      if (fitMode === "fitWidth") {
        const newZoom = availableWidth / viewport.width;
        setZoom(newZoom);
      } else if (fitMode === "fitPage") {
        const zoomWidth = availableWidth / viewport.width;
        const zoomHeight = availableHeight / viewport.height;
        const newZoom = Math.min(zoomWidth, zoomHeight);
        setZoom(newZoom);
      }
    }, scrollDebounce); // Reuse scroll debounce setting

    return () => clearTimeout(timeoutId);
  }, [currentPageObj, containerWidth, fitMode, rotation, setZoom, scrollDebounce]);

  // Load thumbnail pages in chunks (lazy loading)
  useEffect(() => {
    if (!pdfDocument || !showThumbnails) {
      setThumbnailPages([]);
      return;
    }

    let mounted = true;
    const CHUNK_SIZE = 5; // Load 5 thumbnails at a time
    const DELAY_BETWEEN_CHUNKS = 50; // ms delay to prevent UI freeze

    const loadThumbnailsInChunks = async () => {
      // Initialize with null placeholders
      const pages: (PDFPageProxy | null)[] = new Array(
        pdfDocument.numPages
      ).fill(null);
      setThumbnailPages(pages);

      // Load thumbnails in chunks
      for (let start = 1; start <= pdfDocument.numPages; start += CHUNK_SIZE) {
        if (!mounted) break;

        const end = Math.min(start + CHUNK_SIZE - 1, pdfDocument.numPages);
        const chunkPromises = [];

        for (let i = start; i <= end; i++) {
          chunkPromises.push(
            pdfDocument
              .getPage(i)
              .then((page) => ({ index: i - 1, page }))
              .catch((err) => {
                console.error(`Error loading thumbnail for page ${i}:`, err);
                return { index: i - 1, page: null };
              })
          );
        }

        // Load chunk in parallel
        const results = await Promise.all(chunkPromises);

        if (!mounted) break;

        // Update state with loaded pages
        setThumbnailPages((prev) => {
          const updated = [...prev];
          results.forEach(({ index, page }) => {
            updated[index] = page;
          });
          return updated;
        });

        // Small delay to prevent UI freeze
        if (end < pdfDocument.numPages) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_CHUNKS)
          );
        }
      }
    };

    loadThumbnailsInChunks();

    return () => {
      mounted = false;
    };
  }, [pdfDocument, showThumbnails]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for our shortcuts
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Home" ||
        e.key === "End"
      ) {
        e.preventDefault();
      }

      const {
        nextPage,
        previousPage,
        firstPage,
        lastPage,
        zoomIn,
        zoomOut,
        rotateClockwise,
        rotateCounterClockwise,
        toggleFullscreen,
        undoAnnotation,
        redoAnnotation,
        toggleKeyboardShortcuts,
      } = usePDFStore.getState();

      // Undo/Redo shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undoAnnotation();
          return;
        }
        if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redoAnnotation();
          return;
        }
      }

      // Help dialog shortcuts
      if (e.key === "?" || e.key.toLowerCase() === "h") {
        e.preventDefault();
        toggleKeyboardShortcuts();
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          previousPage();
          break;
        case "ArrowRight":
          nextPage();
          break;
        case "Home":
          firstPage();
          break;
        case "End":
          lastPage();
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case "r":
          if (e.shiftKey) {
            rotateCounterClockwise();
          } else {
            rotateClockwise();
          }
          break;
        case "F11":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          // Cancel any pending stamp or annotation
          if (pendingStamp) {
            setPendingStamp(null);
          }
          if (selectedAnnotationType) {
            setSelectedAnnotationType(null);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingStamp, selectedAnnotationType]);

  // Handle fullscreen
  useEffect(() => {
    if (!viewerRef.current) return;

    if (isFullscreen) {
      if (viewerRef.current.requestFullscreen) {
        viewerRef.current.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Mouse wheel zoom and page turning functionality
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let wheelTimeout: NodeJS.Timeout | null = null;
    let accumulatedDelta = 0;
    const WHEEL_THRESHOLD = scrollSensitivity; // Use user setting

    const handleWheel = (e: WheelEvent) => {
      // Skip if scrolling programmatically (during page change)
      if (isScrollingProgrammatically.current) {
        return;
      }

      // Check if Ctrl/Cmd key is pressed for zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // Get the current zoom level
        const currentZoom = zoom;

        // Determine zoom direction (negative deltaY = scroll up = zoom in)
        // Apply invertWheel if set, but usually zoom direction is standard
        // Let's apply invertWheel only to scrolling, not zooming for now unless requested
        const zoomDelta = e.deltaY > 0 ? -zoomStep : zoomStep;

        // Calculate new zoom level with limits (50% to 300%)
        const newZoom = Math.min(Math.max(currentZoom + zoomDelta, 0.5), 3.0);

        // Apply the new zoom
        setZoom(newZoom);
      }
      // In single page mode, use wheel for direct page turning
      else if (viewMode === "single") {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isAtTop = scrollTop <= 0;
        const isAtBottom =
          Math.abs(scrollHeight - clientHeight - scrollTop) < 2;
        const contentOverflows = scrollHeight > clientHeight;

        // Apply inversion if enabled
        const effectiveDeltaY = invertWheel ? -e.deltaY : e.deltaY;

        // If content overflows and we're not at the edges, let native scroll happen
        // Note: We might need to manually handle scroll if invertWheel is true and we are NOT turning pages
        if (contentOverflows && !isAtTop && !isAtBottom) {
           // If invertWheel is on, we must prevent default and scroll manually
           if (invertWheel) {
             e.preventDefault();
             scrollContainer.scrollTop += effectiveDeltaY;
           }
           return;
        }

        // If we are at top but scrolling down (positive delta), let native scroll happen
        if (isAtTop && effectiveDeltaY > 0 && contentOverflows) {
           if (invertWheel) {
             e.preventDefault();
             scrollContainer.scrollTop += effectiveDeltaY;
           }
          return;
        }

        // If we are at bottom but scrolling up (negative delta), let native scroll happen
        if (isAtBottom && effectiveDeltaY < 0 && contentOverflows) {
           if (invertWheel) {
             e.preventDefault();
             scrollContainer.scrollTop += effectiveDeltaY;
           }
          return;
        }

        e.preventDefault();

        // Accumulate wheel delta to handle trackpad/smooth scrolling
        accumulatedDelta += effectiveDeltaY;

        // Clear existing timeout
        if (wheelTimeout) {
          clearTimeout(wheelTimeout);
        }

        // Debounce the page change
        wheelTimeout = setTimeout(() => {
          if (isScrollingProgrammatically.current) return;

          if (Math.abs(accumulatedDelta) >= WHEEL_THRESHOLD) {
            if (accumulatedDelta > 0 && currentPage < numPages) {
              // Scrolling down - next page
              isScrollingProgrammatically.current = true;
              nextPage();
              // Reset scroll to top
              if (scrollContainer) scrollContainer.scrollTop = 0;

              // Reset flag after delay
              setTimeout(() => {
                isScrollingProgrammatically.current = false;
              }, 500);
            } else if (accumulatedDelta < 0 && currentPage > 1) {
              // Scrolling up - previous page
              isScrollingProgrammatically.current = true;
              shouldScrollToBottomRef.current = true;
              previousPage();

              // Reset flag after delay
              setTimeout(() => {
                isScrollingProgrammatically.current = false;
              }, 500);
            }
          }
          accumulatedDelta = 0;
        }, scrollDebounce); // Use user setting
      }
    };

    // Add event listener with passive: false to allow preventDefault
    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) {
        clearTimeout(wheelTimeout);
      }
    };
  }, [
    zoom,
    setZoom,
    viewMode,
    currentPage,
    numPages,
    nextPage,
    previousPage,
    scrollSensitivity,
    scrollDebounce,
    invertWheel,
    zoomStep,
  ]);

  // Auto page turn on vertical scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Skip if scrolling programmatically (during page change)
      if (isScrollingProgrammatically.current) {
        return;
      }

      // Continuous mode: Update current page based on scroll position
      if (viewMode === "continuous" || viewMode === "twoPage") {
        const now = Date.now();
        if (now - lastThrottleTimeRef.current >= scrollDebounce) {
          lastThrottleTimeRef.current = now;

          requestAnimationFrame(() => {
            const containerRect = scrollContainer.getBoundingClientRect();
            // Find the page that is most visible in the container
            let maxVisibleHeight = 0;
            let bestPage = currentPage;

            pageRefsMap.current.forEach((element, pageNum) => {
              const rect = element.getBoundingClientRect();

              // Calculate intersection height
              const intersectionTop = Math.max(containerRect.top, rect.top);
              const intersectionBottom = Math.min(
                containerRect.bottom,
                rect.bottom
              );
              const visibleHeight = Math.max(
                0,
                intersectionBottom - intersectionTop
              );

              if (visibleHeight > maxVisibleHeight) {
                maxVisibleHeight = visibleHeight;
                bestPage = pageNum;
              }
            });

            if (bestPage !== currentPage) {
              setCurrentPage(bestPage);
            }
          });
        }
        return;
      }

      // Skip if content fits in viewport (handleWheel takes care of this)
      if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
        return;
      }

      // Clear any existing timeout to debounce scroll events
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce the scroll handling to prevent rapid page switches
      scrollTimeoutRef.current = setTimeout(() => {
        // Double-check the flag hasn't been set during the timeout
        if (isScrollingProgrammatically.current) {
          return;
        }

        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;

        // Threshold for triggering page turn (in pixels)
        const threshold = scrollThreshold;

        // Check if scrolled to the bottom
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
          const scrollDirection = scrollTop - lastScrollTop.current;

          // Only trigger if scrolling down
          if (scrollDirection > 0 && currentPage < numPages) {
            // Set flag BEFORE any async operations
            isScrollingProgrammatically.current = true;

            // Advance to next page
            nextPage();

            // Reset scroll to top after a short delay
            setTimeout(() => {
              if (scrollContainer) {
                scrollContainer.scrollTop = 0;
                lastScrollTop.current = 0;
                // Keep flag set for a bit longer to ensure all scroll events are ignored
                setTimeout(() => {
                  isScrollingProgrammatically.current = false;
                }, 500);
              }
            }, 100);
          }
        }
        // Check if scrolled to the top
        else if (scrollTop <= threshold) {
          const scrollDirection = scrollTop - lastScrollTop.current;

          // Only trigger if scrolling up
          if (scrollDirection < 0 && currentPage > 1) {
            // Set flag BEFORE any async operations
            isScrollingProgrammatically.current = true;
            shouldScrollToBottomRef.current = true;

            // Go to previous page
            previousPage();

            // Reset scroll to bottom after a short delay
            setTimeout(() => {
              if (scrollContainer) {
                scrollContainer.scrollTop =
                  scrollContainer.scrollHeight - scrollContainer.clientHeight;
                lastScrollTop.current = scrollContainer.scrollTop;
                // Keep flag set for a bit longer to ensure all scroll events are ignored
                setTimeout(() => {
                  isScrollingProgrammatically.current = false;
                }, 500);
              }
            }, 100);
          }
        }

        // Update last scroll position
        lastScrollTop.current = scrollTop;
      }, scrollDebounce); // Use user setting
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      // Clean up timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [
    currentPage,
    numPages,
    nextPage,
    previousPage,
    viewMode,
    setCurrentPage,
    isLoading,
    scrollThreshold,
    scrollDebounce,
  ]);

  // Handle sidebar resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, 180), 500); // Min: 180px, Max: 500px
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Save to localStorage
      localStorage.setItem("pdf-sidebar-width", sidebarWidth.toString());
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Remove user-select disable
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    // Disable text selection while resizing
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Save sidebar width to localStorage when it changes
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem("pdf-sidebar-width", sidebarWidth.toString());
    }
  }, [sidebarWidth, isResizing]);

  // Update reading progress when page changes
  useEffect(() => {
    if (numPages > 0) {
      const progress = ((currentPage - 1) / (numPages - 1)) * 100;
      updateReadingProgress(progress);

      const url = recentFileUrlRef.current;
      if (url) {
        const clamped = Math.min(100, Math.max(0, progress));
        updateRecentFileByUrl(url, {
          readingProgress: clamped,
          lastOpened: Date.now(),
        });
      }
    }
  }, [currentPage, numPages, updateReadingProgress, updateRecentFileByUrl]);

  useEffect(() => {
    const previous = previousPageRef.current;
    if (currentPage > previous) {
      setPageDirection("forward");
    } else if (currentPage < previous) {
      setPageDirection("backward");
    } else {
      setPageDirection("none");
    }
    previousPageRef.current = currentPage;
  }, [currentPage]);

  useTouchGestures(touchContainerRef, {
    onSwipeLeft: () => {
      if (viewMode === "single") {
        nextPage();
      }
    },
    onSwipeRight: () => {
      if (viewMode === "single") {
        previousPage();
      }
    },
    onPinchZoom: (scale) => {
      const currentZoom = zoom;
      const newZoom = Math.min(Math.max(currentZoom * scale, 0.5), 3.0);
      setZoom(newZoom);
    },
  });

  const getVisiblePageRange = () => {
    if (numPages <= 0) {
      return { start: 1, end: 0 };
    }
    const buffer =
      viewMode === "continuous" ? 4 : viewMode === "twoPage" ? 3 : 0;
    if (!buffer) {
      return { start: 1, end: numPages };
    }
    const start = Math.max(1, currentPage - buffer);
    const end = Math.min(numPages, currentPage + buffer);
    return { start, end };
  };

  const visibleRange = getVisiblePageRange();

  const handleSearch = async (query: string) => {
    if (!pdfDocument || !query) {
      setSearchResults([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      abortControllerRef.current = new AbortController();

      const results = await searchInPDF(pdfDocument, query, {
        signal: abortControllerRef.current.signal,
        caseSensitive: caseSensitiveSearch,
        onProgress: (current, total) => {
          console.log(`Searching... ${current}/${total} pages`);
        },
      });

      setSearchResults(results);
    } catch (err) {
      if (err instanceof Error && err.message !== "Search cancelled") {
        console.error("Error searching PDF:", err);
      }
    }
  };

  const handleDownload = () => {
    if (
      annotations.length > 0 ||
      pageOrder.length > 0 ||
      Object.keys(pageRotations).length > 0
    ) {
      savePDF(file, annotations, {
        pageOrder: pageOrder.length > 0 ? pageOrder : undefined,
        pageRotations:
          Object.keys(pageRotations).length > 0 ? pageRotations : undefined,
      });
    } else {
      downloadPDF(file);
    }
  };

  const handlePrint = () => {
    printPDF(file);
  };

  const extractPageText = async (pageNumber: number) => {
    if (!pdfDocument) return;
    setIsExtractingText(true);
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => (item as { str?: string }).str || "")
        .join(" ");
      setExtractedTextTitle(
        t("viewer.extract_dialog.page_title", { page: pageNumber })
      );
      setExtractedText(text);
      setShowExtractDialog(true);
    } catch (err) {
      console.error("Error extracting page text:", err);
    } finally {
      setIsExtractingText(false);
    }
  };

  const extractAllText = async () => {
    if (!pdfDocument) return;
    setIsExtractingText(true);
    try {
      const parts: string[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item) => (item as { str?: string }).str || "")
          .join(" ");
        parts.push(`[Page ${i}]\n${text}`);
      }
      setExtractedTextTitle(t("viewer.extract_dialog.doc_title"));
      setExtractedText(parts.join("\n\n"));
      setShowExtractDialog(true);
    } catch (err) {
      console.error("Error extracting document text:", err);
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleCopyExtractedText = async () => {
    try {
      if (!extractedText) return;
      await navigator.clipboard.writeText(extractedText);
    } catch (err) {
      console.error("Failed to copy extracted text:", err);
    }
  };

  const handleBookmarkNavigate = (pageNumber: number) => {
    let targetPage = pageNumber;
    if (pageOrder.length > 0) {
      const index = pageOrder.indexOf(pageNumber);
      if (index !== -1) {
        targetPage = index + 1;
      }
    }
    goToPage(targetPage);

    if (viewMode !== "single") {
      requestAnimationFrame(() => {
        const pageElement = pageRefsMap.current.get(targetPage);
        if (pageElement && scrollContainerRef.current) {
          const containerRect =
            scrollContainerRef.current.getBoundingClientRect();
          const pageRect = pageElement.getBoundingClientRect();
          const scrollTop = scrollContainerRef.current.scrollTop;
          const offset = pageRect.top - containerRect.top + scrollTop - 20;

          scrollContainerRef.current.scrollTo({
            top: Math.max(0, offset),
            behavior: "smooth",
          });
        }
      });
    }
  };

  const handleAnnotationNavigate = (pageNumber: number) => {
    let targetPage = pageNumber;
    if (pageOrder.length > 0) {
      const index = pageOrder.indexOf(pageNumber);
      if (index !== -1) {
        targetPage = index + 1;
      }
    }
    goToPage(targetPage);

    if (viewMode !== "single") {
      requestAnimationFrame(() => {
        const pageElement = pageRefsMap.current.get(targetPage);
        if (pageElement && scrollContainerRef.current) {
          const containerRect =
            scrollContainerRef.current.getBoundingClientRect();
          const pageRect = pageElement.getBoundingClientRect();
          const scrollTop = scrollContainerRef.current.scrollTop;
          const offset = pageRect.top - containerRect.top + scrollTop - 20;

          scrollContainerRef.current.scrollTo({
            top: Math.max(0, offset),
            behavior: "smooth",
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm">
            <PDFLoadingAnimation
              type={pdfLoadingAnimation}
              progress={loadingProgress}
            />
          </div>
          <p className="mt-4 text-lg font-medium">{t("viewer.loading")}</p>
          {loadingProgress > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {loadingProgress}%
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error || t("viewer.error")}
          </p>
          <Button onClick={onClose} className="mt-4">
            {t("viewer.go_back")}
          </Button>
        </div>
      </div>
    );
  }

  const getOriginalPageNumber = (visualPageNumber: number) => {
    return pageOrder.length > 0
      ? pageOrder[visualPageNumber - 1]
      : visualPageNumber;
  };

  const contentBottomPadding = isMobile
    ? isMobileLandscape
      ? "pb-12"
      : "pb-20"
    : "pb-16";

  return (
    <div
      ref={viewerRef}
      className={cn(
        "flex h-screen flex-col bg-background",
        isDarkMode && "dark",
        themeMode === "sepia" && "sepia"
      )}
      data-orientation={orientation}
    >
      {header}
      <PDFToolbar
        onDownload={handleDownload}
        onPrint={handlePrint}
        onSearch={handleSearch}
        onClose={onClose}
        onToggleBookmarks={() => setShowBookmarksPanel(!showBookmarksPanel)}
        onAnnotationTypeSelect={setSelectedAnnotationType}
        selectedAnnotationType={selectedAnnotationType}
        onStampSelect={(stamp) => {
          setPendingStamp(stamp);
          setSelectedAnnotationType(null);
        }}
        onExtractCurrentPageText={() =>
          extractPageText(getOriginalPageNumber(currentPage))
        }
        onExtractAllText={extractAllText}
        onOpenFileFromMenu={onOpenFileFromMenu}
        onRevealInFileManager={handleRevealInFileManager}
        showSearch={showSearch}
        onShowSearchChange={setShowSearch}
        showSettings={showSettings}
        onShowSettingsChange={setShowSettings}
        onOpenSignatureDialog={() => setShowSignatureDialog(true)}
        onFileUpdate={onFileUpdate}
      />

      <PDFTTSReader currentPageObj={currentPageObj} />

      <KeyboardShortcutsDialog
        open={showKeyboardShortcuts}
        onOpenChange={(open) => {
          if (open !== showKeyboardShortcuts) {
            toggleKeyboardShortcuts();
          }
        }}
      />

      <SignatureDialog
        open={showSignatureDialog}
        onSelect={(signature) => {
          setPendingImage(signature);
          setShowSignatureDialog(false);
        }}
        onOpenChange={setShowSignatureDialog}
      />

      <PasswordDialog
        open={showPasswordDialog}
        fileName={file.name}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setShowPasswordDialog(false);
          onClose();
        }}
        error={passwordError}
      />

      <Dialog open={showExtractDialog} onOpenChange={setShowExtractDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {extractedTextTitle || t("viewer.extract_dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {isExtractingText
                ? t("viewer.extract_dialog.extracting")
                : t("viewer.extract_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyExtractedText}
                disabled={!extractedText}
              >
                {t("viewer.extract_dialog.copy_all")}
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-auto rounded border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {extractedText}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn("flex flex-1 overflow-hidden", contentBottomPadding)}>
        <div
          className={cn(
            "relative flex flex-col bg-muted/30 overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
            showThumbnails
              ? "border-r border-border opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2 pointer-events-none",
            // Mobile: Absolute positioning to overlay content
            "sm:relative absolute h-full shadow-xl sm:shadow-none"
          )}
          style={{ width: showThumbnails ? `${sidebarWidth}px` : 0 }}
        >
          <ScrollArea className="flex-1 h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={
                  pageOrder.length > 0
                    ? pageOrder
                    : thumbnailPages.map((_, i) => i + 1)
                }
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 p-2">
                  {(pageOrder.length > 0
                    ? pageOrder
                    : thumbnailPages.map((_, i) => i + 1)
                  ).map((pageNum, i) => {
                    const page = thumbnailPages[pageNum - 1];
                    return (
                      <PDFDraggableThumbnail
                        key={pageNum}
                        page={page}
                        pageNumber={pageNum}
                        isActive={currentPage === pageNum}
                        onClick={() => setCurrentPage(i + 1)}
                        isDragEnabled={true}
                        onRemove={() => {
                          if (window.confirm(t("viewer.confirm_delete_page"))) {
                            removePage(i);
                          }
                        }}
                        onRotate={() => rotatePage(pageNum)}
                        rotation={
                          (rotation + (pageRotations[pageNum] || 0)) % 360
                        }
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>

          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
          </div>
        </div>

        <div
          className={cn(
            "relative bg-muted/30 flex flex-col overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
            showOutline
              ? "border-r border-border opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2 pointer-events-none",
            // Mobile: Absolute positioning to overlay content
            "sm:relative absolute h-full shadow-xl sm:shadow-none"
          )}
          style={{ width: showOutline ? `${sidebarWidth}px` : 0 }}
        >
          <PDFOutline
            outline={outline}
            onNavigate={handleBookmarkNavigate}
            currentPage={currentPage}
          />

          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
          </div>
        </div>

        <div
          className={cn(
            "relative border-border bg-muted/30 flex flex-col overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
            showBookmarksPanel
              ? "border-r opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2 pointer-events-none",
            // Mobile: Absolute positioning to overlay content
            "sm:relative absolute h-full shadow-xl sm:shadow-none"
          )}
          style={{ width: showBookmarksPanel ? `${sidebarWidth}px` : 0 }}
        >
          <PDFBookmarks
            onNavigate={handleBookmarkNavigate}
            currentPage={currentPage}
          />

          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
          </div>
        </div>

        <div
          className={cn(
            "relative border-border bg-muted/30 flex flex-col overflow-hidden transition-[width,opacity,transform] duration-250 ease-out will-change-transform",
            showAnnotations
              ? "border-r opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2 pointer-events-none"
          )}
          style={{ width: showAnnotations ? `${sidebarWidth}px` : 0 }}
        >
          <PDFAnnotationsList
            onNavigate={handleAnnotationNavigate}
            currentPage={currentPage}
          />

          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
          </div>
        </div>

        <div
          ref={(el) => {
            if (el) {
              (
                scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
              (
                touchContainerRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
            }
          }}
          className="flex-1 overflow-auto bg-muted/50"
          style={{ scrollBehavior: enableSmoothScrolling ? "smooth" : "auto" }}
        >
          {viewMode === "single" && (
            <div
              className="flex min-h-full items-center justify-center p-8 transition-all duration-300 ease-in-out"
              onClick={(e) => {
                if (currentPageObj) {
                  const viewport = currentPageObj.getViewport({
                    scale: zoom,
                    rotation,
                  });
                  const rect = (
                    e.currentTarget.querySelector("canvas") as HTMLCanvasElement
                  )?.getBoundingClientRect();

                  if (rect) {
                    const x = (e.clientX - rect.left) / viewport.width;
                    const y = (e.clientY - rect.top) / viewport.height;

                    if (pendingStamp) {
                      addStampAnnotation(pendingStamp, currentPage, { x, y });
                      setPendingStamp(null);
                    } else if (pendingImage) {
                      // Default width/height for signatures/images
                      // We'll assume a reasonable default size, e.g., 150x75 in PDF units
                      // Since x,y are normalized (0-1), we need to normalize width/height too
                      const w = 150 / viewport.width;
                      const h = 75 / viewport.height;

                      addImageAnnotation(pendingImage, currentPage, {
                        x,
                        y,
                        width: w,
                        height: h,
                      });
                      setPendingImage(null);
                    }
                  }
                }
              }}
            >
              <div
                key={currentPage}
                className={cn(
                  "relative animate-in fade-in zoom-in-95 duration-500 ease-in-out",
                  pageDirection === "forward" && "slide-in-from-right-8",
                  pageDirection === "backward" && "slide-in-from-left-8"
                )}
              >
                <PDFPage
                  page={allPages[currentPage - 1] || currentPageObj}
                  scale={zoom}
                  rotation={
                    (rotation + (pageRotations[currentPage] || 0)) % 360
                  }
                  className="max-w-full"
                  onRenderSuccess={handleRenderSuccess}
                />
                <PDFTextLayer
                  page={allPages[currentPage - 1] || currentPageObj}
                  scale={zoom}
                  rotation={
                    (rotation + (pageRotations[currentPage] || 0)) % 360
                  }
                  searchQuery={searchQuery}
                  caseSensitive={caseSensitiveSearch}
                  pageNumber={currentPage}
                />
                <PDFAnnotationLayer
                  page={allPages[currentPage - 1] || currentPageObj}
                  scale={zoom}
                  rotation={
                    (rotation + (pageRotations[currentPage] || 0)) % 360
                  }
                  selectedAnnotationType={
                    selectedAnnotationType === "drawing"
                      ? null
                      : selectedAnnotationType
                  }
                />
                {selectedAnnotationType === "drawing" && (
                  <PDFDrawingLayer
                    page={allPages[currentPage - 1] || currentPageObj}
                    scale={zoom}
                    rotation={
                      (rotation + (pageRotations[currentPage] || 0)) % 360
                    }
                    isDrawingMode={true}
                    strokeColor={selectedAnnotationColor}
                    strokeWidth={selectedStrokeWidth}
                  />
                )}
                {isSelectionMode && (
                  <PDFSelectionLayer
                    page={allPages[currentPage - 1] || currentPageObj}
                    scale={zoom}
                    rotation={
                      (rotation + (pageRotations[currentPage] || 0)) % 360
                    }
                    pageNumber={currentPage}
                  />
                )}
              </div>
            </div>
          )}

          {viewMode === "continuous" && (
            <div className="flex flex-col items-center gap-4 p-8">
              {Array.from({ length: numPages }).map((_, index) => {
                const pageNumber = index + 1;
                const page = allPages[index];
                const dimensions = pageDimensionsRef.current.get(pageNumber);

                // If page is not loaded and we don't have dimensions, and it's not in visible range, skip it
                // But if we HAVE dimensions, render a placeholder to maintain scroll height
                if (
                  !page &&
                  !dimensions &&
                  (pageNumber < visibleRange.start ||
                    pageNumber > visibleRange.end)
                ) {
                  return null;
                }

                // If we have dimensions but page is not loaded, render placeholder
                // If page is loaded (page variable is truthy), render normally
                // If page is not loaded but in visible range (loading...), render normally (PDFPage handles null)

                return (
                  <div
                    key={pageNumber}
                    ref={(el) => {
                      if (el) {
                        pageRefsMap.current.set(pageNumber, el);
                      } else {
                        pageRefsMap.current.delete(pageNumber);
                      }
                    }}
                    data-page={pageNumber}
                    className={cn(
                      "transition-all duration-300 ease-in-out",
                      currentPage === pageNumber &&
                        "ring-2 ring-primary rounded scale-[1.02]"
                    )}
                  >
                    <div className="relative">
                      <PDFPage
                        page={page}
                        scale={zoom}
                        rotation={
                          (rotation + (pageRotations[pageNumber] || 0)) % 360
                        }
                        className="shadow-lg"
                        width={dimensions ? dimensions.width * zoom : undefined}
                        height={
                          dimensions ? dimensions.height * zoom : undefined
                        }
                      />
                      <PDFTextLayer
                        page={page}
                        scale={zoom}
                        rotation={
                          (rotation + (pageRotations[pageNumber] || 0)) % 360
                        }
                        searchQuery={searchQuery}
                        caseSensitive={caseSensitiveSearch}
                        pageNumber={pageNumber}
                      />
                      <PDFAnnotationLayer
                        page={page}
                        scale={zoom}
                        rotation={
                          (rotation + (pageRotations[pageNumber] || 0)) % 360
                        }
                        selectedAnnotationType={
                          selectedAnnotationType === "drawing"
                            ? null
                            : selectedAnnotationType
                        }
                      />
                      {selectedAnnotationType === "drawing" &&
                        pageNumber === currentPage && (
                          <PDFDrawingLayer
                            page={page}
                            scale={zoom}
                            rotation={
                              (rotation + (pageRotations[pageNumber] || 0)) %
                              360
                            }
                            isDrawingMode={true}
                            strokeColor={selectedAnnotationColor}
                            strokeWidth={selectedStrokeWidth}
                          />
                        )}
                      {isSelectionMode && (
                        <PDFSelectionLayer
                          page={page}
                          scale={zoom}
                          rotation={
                            (rotation + (pageRotations[pageNumber] || 0)) % 360
                          }
                          pageNumber={pageNumber}
                        />
                      )}
                    </div>
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                      {t("viewer.page_n_of_m", {
                        current: pageNumber,
                        total: numPages,
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "twoPage" && (
            <div className="flex flex-col items-center gap-4 p-8">
              {Array.from({ length: Math.ceil(numPages / 2) }).map(
                (_, pairIndex) => {
                  const leftPageNumber = pairIndex * 2 + 1;
                  const rightPageNumber = leftPageNumber + 1;

                  const leftPage = allPages[leftPageNumber - 1];
                  const rightPage = allPages[rightPageNumber - 1];

                  const leftDim = pageDimensionsRef.current.get(leftPageNumber);
                  const rightDim =
                    pageDimensionsRef.current.get(rightPageNumber);

                  // Check visibility
                  const isLeftVisible =
                    leftPageNumber >= visibleRange.start &&
                    leftPageNumber <= visibleRange.end;
                  const isRightVisible =
                    rightPageNumber >= visibleRange.start &&
                    rightPageNumber <= visibleRange.end;

                  // If neither page is visible AND neither has dimensions, skip
                  if (
                    !isLeftVisible &&
                    !isRightVisible &&
                    !leftDim &&
                    !rightDim
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={pairIndex}
                      className="flex gap-4 transition-all duration-300 ease-in-out"
                    >
                      {(leftPage || leftDim || isLeftVisible) && (
                        <div
                          ref={(el) => {
                            if (el) {
                              pageRefsMap.current.set(leftPageNumber, el);
                            } else {
                              pageRefsMap.current.delete(leftPageNumber);
                            }
                          }}
                          data-page={leftPageNumber}
                          className={cn(
                            "transition-all duration-300 ease-in-out",
                            currentPage === leftPageNumber &&
                              "ring-2 ring-primary rounded scale-[1.02]"
                          )}
                        >
                          <div className="relative">
                            <PDFPage
                              page={leftPage}
                              scale={zoom}
                              rotation={
                                (rotation +
                                  (pageRotations[
                                    getOriginalPageNumber(leftPageNumber)
                                  ] || 0)) %
                                360
                              }
                              className="shadow-lg"
                              width={leftDim ? leftDim.width * zoom : undefined}
                              height={
                                leftDim ? leftDim.height * zoom : undefined
                              }
                            />
                            <PDFTextLayer
                              page={leftPage}
                              scale={zoom}
                              rotation={
                                (rotation +
                                  (pageRotations[
                                    getOriginalPageNumber(leftPageNumber)
                                  ] || 0)) %
                                360
                              }
                              searchQuery={searchQuery}
                              caseSensitive={caseSensitiveSearch}
                              pageNumber={getOriginalPageNumber(leftPageNumber)}
                            />
                            <PDFAnnotationLayer
                              page={leftPage}
                              scale={zoom}
                              rotation={
                                (rotation +
                                  (pageRotations[
                                    getOriginalPageNumber(leftPageNumber)
                                  ] || 0)) %
                                360
                              }
                              selectedAnnotationType={selectedAnnotationType}
                            />
                            {isSelectionMode && (
                              <PDFSelectionLayer
                                page={leftPage}
                                scale={zoom}
                                rotation={
                                  (rotation +
                                    (pageRotations[
                                      getOriginalPageNumber(leftPageNumber)
                                    ] || 0)) %
                                  360
                                }
                                pageNumber={getOriginalPageNumber(
                                  leftPageNumber
                                )}
                              />
                            )}
                          </div>
                          <div className="mt-2 text-center text-sm text-muted-foreground">
                            {t("viewer.page_n_of_m", {
                              current: leftPageNumber,
                              total: numPages,
                            })}
                          </div>
                        </div>
                      )}

                      {(rightPage || rightDim || isRightVisible) &&
                        rightPageNumber <= numPages && (
                          <div
                            ref={(el) => {
                              if (el) {
                                pageRefsMap.current.set(rightPageNumber, el);
                              } else {
                                pageRefsMap.current.delete(rightPageNumber);
                              }
                            }}
                            data-page={rightPageNumber}
                            className={cn(
                              "transition-all duration-300 ease-in-out",
                              currentPage === rightPageNumber &&
                                "ring-2 ring-primary rounded scale-[1.02]"
                            )}
                          >
                            <div className="relative">
                              <PDFPage
                                page={rightPage}
                                scale={zoom}
                                rotation={
                                  (rotation +
                                    (pageRotations[
                                      getOriginalPageNumber(rightPageNumber)
                                    ] || 0)) %
                                  360
                                }
                                className="shadow-lg"
                                width={
                                  rightDim ? rightDim.width * zoom : undefined
                                }
                                height={
                                  rightDim ? rightDim.height * zoom : undefined
                                }
                              />
                              <PDFTextLayer
                                page={rightPage}
                                scale={zoom}
                                rotation={
                                  (rotation +
                                    (pageRotations[
                                      getOriginalPageNumber(rightPageNumber)
                                    ] || 0)) %
                                  360
                                }
                                searchQuery={searchQuery}
                                caseSensitive={caseSensitiveSearch}
                                pageNumber={getOriginalPageNumber(
                                  rightPageNumber
                                )}
                              />
                              <PDFAnnotationLayer
                                page={rightPage}
                                scale={zoom}
                                rotation={
                                  (rotation +
                                    (pageRotations[
                                      getOriginalPageNumber(rightPageNumber)
                                    ] || 0)) %
                                  360
                                }
                                selectedAnnotationType={selectedAnnotationType}
                              />
                              {isSelectionMode && (
                                <PDFSelectionLayer
                                  page={rightPage}
                                  scale={zoom}
                                  rotation={
                                    (rotation +
                                      (pageRotations[
                                        getOriginalPageNumber(rightPageNumber)
                                      ] || 0)) %
                                    360
                                  }
                                  pageNumber={getOriginalPageNumber(
                                    rightPageNumber
                                  )}
                                />
                              )}
                            </div>
                            <div className="mt-2 text-center text-sm text-muted-foreground">
                              {t("viewer.page_n_of_m", {
                                current: rightPageNumber,
                                total: numPages,
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      <PDFMobileToolbar
        onSearch={() => setShowSearch(true)}
        onOpenSettings={() => setShowSettings(true)}
        orientation={orientation}
      />
      <PDFProgressBar alwaysShow={isMobileLandscape || !isMobile} />
    </div>
  );
}
