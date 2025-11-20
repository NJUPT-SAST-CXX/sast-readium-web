'use client';

import { useEffect, useState, useRef } from 'react';
import { usePDFStore } from '@/lib/pdf-store';
import { loadPDFDocument, searchInPDF, downloadPDF, printPDF, PDFDocumentProxy, PDFPageProxy } from '@/lib/pdf-utils';
import { PDFToolbar } from './pdf-toolbar';
import { PDFPage } from './pdf-page';
import { PDFThumbnail } from './pdf-thumbnail';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  file: File;
  onClose: () => void;
}

export function PDFViewer({ file, onClose }: PDFViewerProps) {
  const {
    currentPage,
    zoom,
    rotation,
    showThumbnails,
    isDarkMode,
    isFullscreen,
    numPages,
    setNumPages,
    setCurrentPage,
    setZoom,
    nextPage,
    previousPage,
    addRecentFile,
    setSearchResults,
  } = usePDFStore();

  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(null);
  const [thumbnailPages, setThumbnailPages] = useState<(PDFPageProxy | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScrollTop = useRef<number>(0);
  const isScrollingProgrammatically = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    // Load saved width from localStorage or use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdf-sidebar-width');
      return saved ? parseInt(saved, 10) : 240;
    }
    return 240;
  });
  const [isResizing, setIsResizing] = useState(false);

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
  }, [file, setNumPages, addRecentFile]);

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
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }

      const { nextPage, previousPage, zoomIn, zoomOut, rotateClockwise, rotateCounterClockwise, toggleFullscreen } = usePDFStore.getState();

      switch (e.key) {
        case 'ArrowLeft':
          previousPage();
          break;
        case 'ArrowRight':
          nextPage();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <button
            onClick={onClose}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Go Back
          </button>
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
      <PDFToolbar
        onDownload={handleDownload}
        onPrint={handlePrint}
        onSearch={handleSearch}
        onClose={onClose}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <div
            className="relative border-r border-border bg-muted/30"
            style={{ width: `${sidebarWidth}px` }}
          >
            <ScrollArea className="h-full">
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

        {/* Main PDF Viewer */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-muted/50"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex min-h-full items-center justify-center p-8">
            <PDFPage
              page={currentPageObj}
              scale={zoom}
              rotation={rotation}
              className="max-w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

