"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";
import { PDFPageProxy } from "@/lib/pdf";
import { usePDFStore } from "@/lib/pdf";
import { PDFWatermark } from "./pdf-watermark";

interface PDFPageProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onRenderSuccess?: () => void;
  width?: number;
  height?: number;
}

const PDFPageComponent = ({
  page,
  scale,
  rotation,
  className = "",
  onDoubleClick,
  onRenderSuccess,
  width,
  height,
}: PDFPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{
    cancel: () => void;
    promise: Promise<void>;
  } | null>(null);
  // Removed renderTimeoutRef as we use requestAnimationFrame now
  const [isZooming, setIsZooming] = useState(false);
  const {
    setZoom,
    zoom,
    watermarkText,
    watermarkColor,
    watermarkOpacity,
    watermarkSize,
    watermarkGapX,
    watermarkGapY,
    watermarkRotation,
  } = usePDFStore();

  const dimensions = useMemo(() => {
    if (!page) return { width: width || 0, height: height || 0 };
    const viewport = page.getViewport({ scale, rotation });
    return { width: viewport.width, height: viewport.height };
  }, [page, scale, rotation, width, height]);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!page || !canvasRef.current) {
      // ... placeholder setup ...
      if (dimensions.width > 0 && dimensions.height > 0 && canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;
      }
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", {
      // Performance optimization: disable alpha channel if not needed
      alpha: true,
      // Enable hardware acceleration
      willReadFrequently: false,
    });
    if (!context) return;

    const waitForPreviousRender = async () => {
      if (!renderTaskRef.current) return;

      const currentTask = renderTaskRef.current;
      currentTask.cancel();

      try {
        await currentTask.promise;
      } catch (error) {
        if ((error as Error)?.name !== "RenderingCancelledException") {
          console.error("Error while waiting for previous render", error);
        }
      } finally {
        if (renderTaskRef.current === currentTask) {
          renderTaskRef.current = null;
        }
      }
    };

    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Immediate rendering for first load or page change
    const renderPage = async () => {
      await waitForPreviousRender();
      if (!canvasRef.current || !page) return;

      // Get device pixel ratio for high-DPI displays (Retina, 4K, etc.)
      // Limit to 2 for performance in fit modes
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      // Calculate viewport with proper scaling
      const viewport = page.getViewport({ scale, rotation });

      // Set canvas dimensions with DPI scaling for crisp rendering
      // The canvas internal resolution is higher than its CSS size
      const outputScale = devicePixelRatio;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);

      // Set CSS size to match the logical viewport size
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      // Scale the context to match the output scale
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(outputScale, outputScale);

      // Enable image smoothing for better quality
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      // Render the page with optimized settings
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        // Enable text layer rendering for better quality
        intent: "display",
      };

      renderTaskRef.current = page.render(renderContext);

      renderTaskRef.current.promise
        .then(() => {
          // Rendering complete
          onRenderSuccess?.();
        })
        .catch((error: Error) => {
          if (error.name !== "RenderingCancelledException") {
            console.error("Error rendering page:", error);
          }
        });
    };

    // Use requestAnimationFrame to ensure canvas is ready
    rafRef.current = requestAnimationFrame(() => {
      void renderPage();
    });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    page,
    scale,
    rotation,
    onRenderSuccess,
    dimensions.width,
    dimensions.height,
  ]);

  // Handle double-click zoom
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onDoubleClick) {
      onDoubleClick(e);
      return;
    }

    // Default double-click zoom behavior
    const container = containerRef.current;
    if (!container) return;

    setIsZooming(true);

    // Cycle between zoom levels: 100% -> 150% -> 200% -> 100%
    let targetZoom: number;
    if (zoom < 1.2) {
      targetZoom = 1.5; // Zoom to 150%
    } else if (zoom < 1.8) {
      targetZoom = 2.0; // Zoom to 200%
    } else {
      targetZoom = 1.0; // Reset to 100%
    }

    // Get click position relative to the container
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate the center point as a percentage
    const xPercent = x / rect.width;
    const yPercent = y / rect.height;

    // Find the scroll container (parent with overflow)
    let scrollContainer = container.parentElement;
    while (
      scrollContainer &&
      scrollContainer.scrollHeight === scrollContainer.clientHeight
    ) {
      scrollContainer = scrollContainer.parentElement;
    }

    if (scrollContainer) {
      const beforeScrollLeft = scrollContainer.scrollLeft;
      const beforeScrollTop = scrollContainer.scrollTop;

      // Apply zoom
      setZoom(targetZoom);

      // Wait for re-render, then adjust scroll to keep the clicked point centered
      requestAnimationFrame(() => {
        setTimeout(() => {
          const newRect = container.getBoundingClientRect();
          const newX = xPercent * newRect.width;
          const newY = yPercent * newRect.height;

          const deltaX = newX - x;
          const deltaY = newY - y;

          scrollContainer.scrollLeft = beforeScrollLeft + deltaX;
          scrollContainer.scrollTop = beforeScrollTop + deltaY;

          setIsZooming(false);
        }, 100);
      });
    } else {
      setZoom(targetZoom);
      setTimeout(() => setIsZooming(false), 100);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className} ${
        isZooming ? "transition-transform duration-200" : ""
      }`}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: "default" }}
    >
      <canvas
        ref={canvasRef}
        className="mx-auto shadow-lg"
        style={{
          display: "block",
          maxWidth: "100%",
          height: "auto",
        }}
      />
      {watermarkText && dimensions.width > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <PDFWatermark
            text={watermarkText}
            color={watermarkColor}
            opacity={watermarkOpacity}
            size={watermarkSize}
            width={dimensions.width}
            height={dimensions.height}
            gapX={watermarkGapX}
            gapY={watermarkGapY}
            rotation={watermarkRotation}
          />
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render when page, scale, or rotation changes
export const PDFPage = memo(PDFPageComponent, (prevProps, nextProps) => {
  // Check if it's effectively the same page (same page index)
  const prevIndex = prevProps.page
    ? (prevProps.page as unknown as { _pageIndex: number })._pageIndex
    : -1;
  const nextIndex = nextProps.page
    ? (nextProps.page as unknown as { _pageIndex: number })._pageIndex
    : -1;

  const isSamePage =
    prevProps.page === nextProps.page ||
    (prevIndex !== -1 && nextIndex !== -1 && prevIndex === nextIndex);

  return (
    isSamePage &&
    Math.abs(prevProps.scale - nextProps.scale) < 0.001 && // Avoid re-render for tiny scale changes
    prevProps.rotation === nextProps.rotation &&
    prevProps.className === nextProps.className
  );
});
