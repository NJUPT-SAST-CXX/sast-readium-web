'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { usePDFStore } from '@/lib/pdf-store';
import { loadPDFDocument, searchInPDF, downloadPDF, printPDF, PDFDocumentProxy, PDFPageProxy } from '@/lib/pdf-utils';
import { PDFToolbar } from './pdf-toolbar';
import { PDFPage } from './pdf-page';
import { PDFThumbnail } from './pdf-thumbnail';
import { PDFOutline } from './pdf-outline';
import { PDFBookmarks } from './pdf-bookmarks';
import { PDFAnnotationsList } from './pdf-annotations-list';
import { PDFProgressBar } from './pdf-progress-bar';
import { PDFAnnotationsToolbar } from './pdf-annotations-toolbar';
import { PDFTextLayer } from './pdf-text-layer';
import { PDFAnnotationLayer } from './pdf-annotation-layer';
import { PDFDrawingLayer } from './pdf-drawing-layer';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTouchGestures } from '@/hooks/use-touch-gestures';
import { AnnotationStamp } from '@/lib/pdf-store';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface PDFViewerProps {
  file: File;
  onClose: () => void;
  header?: ReactNode;
}

export function PDFViewer({ file, onClose, header }: PDFViewerProps) {
  const {
    currentPage,
    zoom,
    rotation,
    showThumbnails,
    showOutline,
    showAnnotations,
    isDarkMode,
    isFullscreen,
    isPresentationMode,
    showKeyboardShortcuts,
    numPages,
    viewMode,
    fitMode,
    outline,
    caseSensitiveSearch,
    searchQuery,
    selectedAnnotationColor,
    selectedStrokeWidth,
    setNumPages,
    setCurrentPage,
    setZoom,
    setOutline,
    goToPage,
    nextPage,
    previousPage,
    addRecentFile,
    setSearchResults,
    updateReadingProgress,
    addStampAnnotation,
    toggleKeyboardShortcuts,
  } = usePDFStore();

  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(null);
  const [allPages, setAllPages] = useState<(PDFPageProxy | null)[]>([]);
  const [thumbnailPages, setThumbnailPages] = useState<(PDFPageProxy | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScrollTop = useRef<number>(0);
  const isScrollingProgrammatically = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    // Load saved width from localStorage or use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdf-sidebar-width');
      return saved ? parseInt(saved, 10) : 240;
    }
    return 240;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [selectedAnnotationType, setSelectedAnnotationType] = useState<'highlight' | 'comment' | 'shape' | 'text' | 'drawing' | null>(null);
  const [pendingStamp, setPendingStamp] = useState<AnnotationStamp | null>(null);
  const touchContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);
        
        const pdf = await loadPDFDocument(file, (progress) => {
          if (mounted) {
            setLoadingProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });
        
        if (!mounted) return;

        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        
        // Add to recent files
        const url = URL.createObjectURL(file);
        addRecentFile({
          name: file.name,
          url,
          lastOpened: Date.now(),
          numPages: pdf.numPages,
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

            const processOutline = async (items: OutlineItem[]): Promise<OutlineItem[]> => {
              return Promise.all(items.map(async (item) => {
                const processed: OutlineItem = {
                  title: item.title,
                  bold: item.bold,
                  italic: item.italic,
                  color: item.color,
                };

                // Try to get page number from destination
                if (item.dest) {
                  try {
                    const dest = typeof item.dest === 'string'
                      ? await pdf.getDestination(item.dest)
                      : item.dest as unknown[];
                    
                    if (dest && Array.isArray(dest) && dest[0]) {
                      const pageRef = dest[0];
                      const pageIndex = await pdf.getPageIndex(pageRef);
                      processed.pageNumber = pageIndex + 1;
                    }
                  } catch (err) {
                    console.error('Error getting page number for outline item:', err);
                  }
                }

                // Process children recursively
                if (item.items && item.items.length > 0) {
                  processed.items = await processOutline(item.items);
                }

                return processed;
              }));
            };

            const processedOutline = await processOutline(pdfOutline as OutlineItem[]);
            setOutline(processedOutline);
          } else {
            setOutline([]);
          }
        } catch (err) {
          console.error('Error loading outline:', err);
          setOutline([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF. The file may be corrupted or invalid.';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      mounted = false;
    };
  }, [file, setNumPages, addRecentFile, setOutline]);

  // Load current page
  useEffect(() => {
    if (!pdfDocument) return;

    let mounted = true;

    const loadPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        if (mounted) {
          setCurrentPageObj(page);
        }
      } catch (err) {
        console.error('Error loading page:', err);
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, [pdfDocument, currentPage]);

  // Load all pages for continuous and two-page views
  useEffect(() => {
    if (!pdfDocument || viewMode === 'single') {
      setAllPages([]);
      return;
    }

    let mounted = true;
    const CHUNK_SIZE = 3;

    const loadAllPages = async () => {
      const pages: (PDFPageProxy | null)[] = new Array(pdfDocument.numPages).fill(null);
      setAllPages(pages);

      for (let start = 1; start <= pdfDocument.numPages; start += CHUNK_SIZE) {
        if (!mounted) break;

        const end = Math.min(start + CHUNK_SIZE - 1, pdfDocument.numPages);
        const chunkPromises = [];

        for (let i = start; i <= end; i++) {
          chunkPromises.push(
            pdfDocument.getPage(i)
              .then((page) => ({ index: i - 1, page }))
              .catch((err) => {
                console.error(`Error loading page ${i}:`, err);
                return { index: i - 1, page: null };
              })
          );
        }

        const results = await Promise.all(chunkPromises);
        
        if (!mounted) break;

        setAllPages((prev) => {
          const updated = [...prev];
          results.forEach(({ index, page }) => {
            updated[index] = page;
          });
          return updated;
        });

        if (end < pdfDocument.numPages) {
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
      }
    };

    loadAllPages();

    return () => {
      mounted = false;
    };
  }, [pdfDocument, viewMode]);

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
    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('resize', throttledResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [showThumbnails]);

  // Apply fit mode zoom with debouncing to prevent performance issues
  useEffect(() => {
    if (!currentPageObj || !containerWidth || fitMode === 'custom') return;

    // Debounce the zoom calculation to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      const viewport = currentPageObj.getViewport({ scale: 1, rotation });
      const padding = 64; // Account for padding
      const availableWidth = containerWidth - padding;
      const availableHeight = window.innerHeight - 150; // Account for toolbar

      if (fitMode === 'fitWidth') {
        const newZoom = availableWidth / viewport.width;
        setZoom(newZoom);
      } else if (fitMode === 'fitPage') {
        const zoomWidth = availableWidth / viewport.width;
        const zoomHeight = availableHeight / viewport.height;
        const newZoom = Math.min(zoomWidth, zoomHeight);
        setZoom(newZoom);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentPageObj, containerWidth, fitMode, rotation, setZoom]);

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
      const pages: (PDFPageProxy | null)[] = new Array(pdfDocument.numPages).fill(null);
      setThumbnailPages(pages);

      // Load thumbnails in chunks
      for (let start = 1; start <= pdfDocument.numPages; start += CHUNK_SIZE) {
        if (!mounted) break;

        const end = Math.min(start + CHUNK_SIZE - 1, pdfDocument.numPages);
        const chunkPromises = [];

        for (let i = start; i <= end; i++) {
          chunkPromises.push(
            pdfDocument.getPage(i)
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
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
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
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
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
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undoAnnotation();
          return;
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redoAnnotation();
          return;
        }
      }

      // Help dialog shortcuts
      if (e.key === '?' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        toggleKeyboardShortcuts();
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          previousPage();
          break;
        case 'ArrowRight':
          nextPage();
          break;
        case 'Home':
          firstPage();
          break;
        case 'End':
          lastPage();
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case 'r':
          if (e.shiftKey) {
            rotateCounterClockwise();
          } else {
            rotateClockwise();
          }
          break;
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Mouse wheel zoom functionality
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if Ctrl/Cmd key is pressed for zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // Get the current zoom level
        const currentZoom = zoom;

        // Determine zoom direction (negative deltaY = scroll up = zoom in)
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;

        // Calculate new zoom level with limits (50% to 300%)
        const newZoom = Math.min(Math.max(currentZoom + zoomDelta, 0.5), 3.0);

        // Apply the new zoom
        setZoom(newZoom);
      }
    };

    // Add event listener with passive: false to allow preventDefault
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, setZoom]);

  // Auto page turn on vertical scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Skip if scrolling programmatically (during page change)
      if (isScrollingProgrammatically.current) {
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
        const threshold = 50;

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
                }, 150);
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

            // Go to previous page
            previousPage();

            // Reset scroll to bottom after a short delay
            setTimeout(() => {
              if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                lastScrollTop.current = scrollContainer.scrollTop;
                // Keep flag set for a bit longer to ensure all scroll events are ignored
                setTimeout(() => {
                  isScrollingProgrammatically.current = false;
                }, 150);
              }
            }, 100);
          }
        }

        // Update last scroll position
        lastScrollTop.current = scrollTop;
      }, 50); // 50ms debounce delay
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      // Clean up timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentPage, numPages, nextPage, previousPage]);

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
      localStorage.setItem('pdf-sidebar-width', sidebarWidth.toString());
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Remove user-select disable
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    // Disable text selection while resizing
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Save sidebar width to localStorage when it changes
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('pdf-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth, isResizing]);

  // Update reading progress when page changes
  useEffect(() => {
    if (numPages > 0) {
      const progress = ((currentPage - 1) / (numPages - 1)) * 100;
      updateReadingProgress(progress);
    }
  }, [currentPage, numPages, updateReadingProgress]);

  // Touch gestures support
  useTouchGestures(touchContainerRef, {
    onSwipeLeft: () => {
      if (viewMode === 'single') {
        nextPage();
      }
    },
    onSwipeRight: () => {
      if (viewMode === 'single') {
        previousPage();
      }
    },
    onPinchZoom: (scale) => {
      const currentZoom = zoom;
      const newZoom = Math.min(Math.max(currentZoom * scale, 0.5), 3.0);
      setZoom(newZoom);
    },
  });

  const handleSearch = async (query: string) => {
    if (!pdfDocument || !query) {
      setSearchResults([]);
      return;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      // Create new abort controller for this search
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
      if (err instanceof Error && err.message !== 'Search cancelled') {
        console.error('Error searching PDF:', err);
      }
    }
  };

  const handleDownload = () => {
    downloadPDF(file);
  };

  const handlePrint = () => {
    printPDF(file);
  };

  /**
   * Handle bookmark navigation with proper scrolling for continuous and two-page modes
   */
  const handleBookmarkNavigate = (pageNumber: number) => {
    goToPage(pageNumber);
    
    // For continuous and two-page modes, scroll to the specific page
    if (viewMode !== 'single') {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        const pageElement = pageRefsMap.current.get(pageNumber);
        if (pageElement && scrollContainerRef.current) {
          // Calculate the scroll position with some offset for better visibility
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          const pageRect = pageElement.getBoundingClientRect();
          const scrollTop = scrollContainerRef.current.scrollTop;
          const offset = pageRect.top - containerRect.top + scrollTop - 20; // 20px offset from top
          
          // Smooth scroll to the page
          scrollContainerRef.current.scrollTo({
            top: Math.max(0, offset),
            behavior: 'smooth'
          });
        }
      });
    }
  };

  /**
   * Handle annotation navigation - navigates to the page containing the annotation
   * and scrolls to it in continuous/two-page modes
   */
  const handleAnnotationNavigate = (pageNumber: number, annotationId: string) => {
    goToPage(pageNumber);
    
    // For continuous and two-page modes, scroll to the specific page
    if (viewMode !== 'single') {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        const pageElement = pageRefsMap.current.get(pageNumber);
        if (pageElement && scrollContainerRef.current) {
          // Calculate the scroll position with some offset for better visibility
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          const pageRect = pageElement.getBoundingClientRect();
          const scrollTop = scrollContainerRef.current.scrollTop;
          const offset = pageRect.top - containerRect.top + scrollTop - 20; // 20px offset from top
          
          // Smooth scroll to the page
          scrollContainerRef.current.scrollTo({
            top: Math.max(0, offset),
            behavior: 'smooth'
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="mx-auto h-12 w-12" />
          <p className="mt-4 text-lg font-medium">Loading PDF...</p>
          {loadingProgress > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">{loadingProgress}%</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button onClick={onClose} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewerRef}
      className={cn(
        'flex h-screen flex-col bg-background',
        isDarkMode && 'dark'
      )}
    >
      {header}
      <PDFToolbar
        onDownload={handleDownload}
        onPrint={handlePrint}
        onSearch={handleSearch}
        onClose={onClose}
        onToggleBookmarks={() => setShowBookmarksPanel(!showBookmarksPanel)}
      />
      
      {/* Annotations Toolbar */}
      {!isPresentationMode && (
        <PDFAnnotationsToolbar
          onAnnotationTypeSelect={setSelectedAnnotationType}
          selectedType={selectedAnnotationType}
          onStampSelect={(stamp) => {
            setPendingStamp(stamp);
            setSelectedAnnotationType(null);
          }}
        />
      )}
      
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showKeyboardShortcuts}
        onOpenChange={(open) => {
          if (open !== showKeyboardShortcuts) {
            toggleKeyboardShortcuts();
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden pb-16 sm:pb-20">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <div
            className="relative flex flex-col border-r border-border bg-muted/30 overflow-hidden"
            style={{ width: `${sidebarWidth}px` }}
          >
            <ScrollArea className="flex-1 h-full">
              <div className="space-y-2 p-2">
                {thumbnailPages.map((page, index) => (
                  <PDFThumbnail
                    key={index}
                    page={page}
                    pageNumber={index + 1}
                    isActive={currentPage === index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>
        )}

        {/* Outline Sidebar */}
        {showOutline && (
          <div
            className="relative border-r border-border bg-muted/30 flex flex-col overflow-hidden"
            style={{ width: `${sidebarWidth}px` }}
          >
            <PDFOutline
              outline={outline}
              onNavigate={handleBookmarkNavigate}
              currentPage={currentPage}
            />

            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>
        )}

        {/* User Bookmarks Panel */}
        {showBookmarksPanel && (
          <div
            className="relative border-r border-border bg-muted/30 flex flex-col overflow-hidden"
            style={{ width: `${sidebarWidth}px` }}
          >
            <PDFBookmarks
              onNavigate={handleBookmarkNavigate}
              currentPage={currentPage}
            />

            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>
        )}

        {/* Annotations Panel */}
        {showAnnotations && (
          <div
            className="relative border-r border-border bg-muted/30 flex flex-col overflow-hidden"
            style={{ width: `${sidebarWidth}px` }}
          >
            <PDFAnnotationsList
              onNavigate={handleAnnotationNavigate}
              currentPage={currentPage}
            />

            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>
        )}

        {/* Main PDF Viewer */}
        <div
          ref={(el) => {
            if (el) {
              (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
              (touchContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }
          }}
          className="flex-1 overflow-auto bg-muted/50"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Single Page View */}
          {viewMode === 'single' && (
            <div
              className="flex min-h-full items-center justify-center p-8"
              onClick={(e) => {
                if (pendingStamp && currentPageObj) {
                  const viewport = currentPageObj.getViewport({ scale: zoom, rotation });
                  const rect = (e.currentTarget.querySelector('canvas') as HTMLCanvasElement)?.getBoundingClientRect();
                  if (rect) {
                    const x = (e.clientX - rect.left) / viewport.width;
                    const y = (e.clientY - rect.top) / viewport.height;
                    addStampAnnotation(pendingStamp, currentPage, { x, y });
                    setPendingStamp(null);
                  }
                }
              }}
            >
              <div className="relative">
                <PDFPage
                  page={currentPageObj}
                  scale={zoom}
                  rotation={rotation}
                  className="max-w-full"
                />
                <PDFTextLayer
                  page={currentPageObj}
                  scale={zoom}
                  rotation={rotation}
                  searchQuery={searchQuery}
                  caseSensitive={caseSensitiveSearch}
                />
                <PDFAnnotationLayer
                  page={currentPageObj}
                  scale={zoom}
                  rotation={rotation}
                  selectedAnnotationType={selectedAnnotationType === 'drawing' ? null : selectedAnnotationType}
                />
                {selectedAnnotationType === 'drawing' && (
                  <PDFDrawingLayer
                    page={currentPageObj}
                    scale={zoom}
                    rotation={rotation}
                    isDrawingMode={true}
                    strokeColor={selectedAnnotationColor}
                    strokeWidth={selectedStrokeWidth}
                  />
                )}
              </div>
            </div>
          )}

          {/* Continuous Scroll View */}
          {viewMode === 'continuous' && (
            <div className="flex flex-col items-center gap-4 p-8">
              {allPages.map((page, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) {
                      pageRefsMap.current.set(index + 1, el);
                    } else {
                      pageRefsMap.current.delete(index + 1);
                    }
                  }}
                  data-page={index + 1}
                  className={cn(
                    'transition-opacity',
                    currentPage === index + 1 && 'ring-2 ring-primary rounded'
                  )}
                >
                  <div className="relative">
                    <PDFPage
                      page={page}
                      scale={zoom}
                      rotation={rotation}
                      className="shadow-lg"
                    />
                    <PDFTextLayer
                      page={page}
                      scale={zoom}
                      rotation={rotation}
                      searchQuery={searchQuery}
                      caseSensitive={caseSensitiveSearch}
                    />
                    <PDFAnnotationLayer
                      page={page}
                      scale={zoom}
                      rotation={rotation}
                      selectedAnnotationType={selectedAnnotationType === 'drawing' ? null : selectedAnnotationType}
                    />
                    {selectedAnnotationType === 'drawing' && index + 1 === currentPage && (
                      <PDFDrawingLayer
                        page={page}
                        scale={zoom}
                        rotation={rotation}
                        isDrawingMode={true}
                        strokeColor={selectedAnnotationColor}
                        strokeWidth={selectedStrokeWidth}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    Page {index + 1} of {numPages}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Two Page View */}
          {viewMode === 'twoPage' && (
            <div className="flex flex-col items-center gap-4 p-8">
              {Array.from({ length: Math.ceil(numPages / 2) }).map((_, pairIndex) => (
                <div
                  key={pairIndex}
                  className="flex gap-4"
                >
                  {/* Left page */}
                  {allPages[pairIndex * 2] && (
                    <div
                      ref={(el) => {
                        if (el) {
                          pageRefsMap.current.set(pairIndex * 2 + 1, el);
                        } else {
                          pageRefsMap.current.delete(pairIndex * 2 + 1);
                        }
                      }}
                      data-page={pairIndex * 2 + 1}
                      className={cn(
                        'transition-opacity',
                        currentPage === pairIndex * 2 + 1 && 'ring-2 ring-primary rounded'
                      )}
                    >
                      <div className="relative">
                        <PDFPage
                          page={allPages[pairIndex * 2]}
                          scale={zoom}
                          rotation={rotation}
                          className="shadow-lg"
                        />
                        <PDFTextLayer
                          page={allPages[pairIndex * 2]}
                          scale={zoom}
                          rotation={rotation}
                          searchQuery={searchQuery}
                          caseSensitive={caseSensitiveSearch}
                        />
                        <PDFAnnotationLayer
                          page={allPages[pairIndex * 2]}
                          scale={zoom}
                          rotation={rotation}
                          selectedAnnotationType={selectedAnnotationType}
                        />
                      </div>
                      <div className="mt-2 text-center text-sm text-muted-foreground">
                        Page {pairIndex * 2 + 1}
                      </div>
                    </div>
                  )}
                  
                  {/* Right page */}
                  {allPages[pairIndex * 2 + 1] && (
                    <div
                      ref={(el) => {
                        if (el) {
                          pageRefsMap.current.set(pairIndex * 2 + 2, el);
                        } else {
                          pageRefsMap.current.delete(pairIndex * 2 + 2);
                        }
                      }}
                      data-page={pairIndex * 2 + 2}
                      className={cn(
                        'transition-opacity',
                        currentPage === pairIndex * 2 + 2 && 'ring-2 ring-primary rounded'
                      )}
                    >
                      <div className="relative">
                        <PDFPage
                          page={allPages[pairIndex * 2 + 1]}
                          scale={zoom}
                          rotation={rotation}
                          className="shadow-lg"
                        />
                        <PDFTextLayer
                          page={allPages[pairIndex * 2 + 1]}
                          scale={zoom}
                          rotation={rotation}
                          searchQuery={searchQuery}
                          caseSensitive={caseSensitiveSearch}
                        />
                        <PDFAnnotationLayer
                          page={allPages[pairIndex * 2 + 1]}
                          scale={zoom}
                          rotation={rotation}
                          selectedAnnotationType={selectedAnnotationType}
                        />
                      </div>
                      <div className="mt-2 text-center text-sm text-muted-foreground">
                        Page {pairIndex * 2 + 2}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Reading Progress Bar - Fixed at bottom */}
      <PDFProgressBar />
    </div>
  );
}

