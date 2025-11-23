'use client';

import { useEffect, useRef, useState, memo, useMemo } from 'react';
import { PDFPageProxy } from '@/lib/pdf-utils';
import { usePDFStore } from '@/lib/pdf-store';
import { PDFWatermark } from './pdf-watermark';

interface PDFPageProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onRenderSuccess?: () => void;
}

const PDFPageComponent = ({ page, scale, rotation, className = '', onDoubleClick, onRenderSuccess }: PDFPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const { setZoom, zoom, watermarkText, watermarkColor, watermarkOpacity, watermarkSize } = usePDFStore();
  
  const dimensions = useMemo(() => {
    if (!page) return { width: 0, height: 0 };
    const viewport = page.getViewport({ scale, rotation });
    return { width: viewport.width, height: viewport.height };
  }, [page, scale, rotation]);

  useEffect(() => {
    if (!page || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', {
      // Performance optimization: disable alpha channel if not needed
      alpha: false,
      // Enable hardware acceleration
      willReadFrequently: false,
    });
    if (!context) return;

    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    // Clear any pending timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    let isMounted = true;

    // Throttle rendering to prevent excessive re-renders during scale/rotation changes
    renderTimeoutRef.current = setTimeout(() => {
      if (!isMounted || !canvasRef.current) return;

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
      context.scale(outputScale, outputScale);

      // Enable image smoothing for better quality
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Render the page with optimized settings
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        // Enable text layer rendering for better quality
        intent: 'display',
      };

      renderTaskRef.current = page.render(renderContext);

      renderTaskRef.current.promise
        .then(() => {
          if (isMounted) {
            // Rendering complete
            onRenderSuccess?.();
          }
        })
        .catch((error: Error) => {
          if (isMounted && error.name !== 'RenderingCancelledException') {
            console.error('Error rendering page:', error);
          }
        });
    }, 50); // 50ms throttle for rendering

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [page, scale, rotation, onRenderSuccess]);

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
    while (scrollContainer && scrollContainer.scrollHeight === scrollContainer.clientHeight) {
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
      className={`relative ${className} ${isZooming ? 'transition-transform duration-200' : ''}`}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: 'default' }}
    >
      <canvas
        ref={canvasRef}
        className="mx-auto shadow-lg"
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      {watermarkText && dimensions.width > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ width: dimensions.width, height: dimensions.height, left: '50%', transform: 'translateX(-50%)' }}>
          <PDFWatermark
            text={watermarkText}
            color={watermarkColor}
            opacity={watermarkOpacity}
            size={watermarkSize}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render when page, scale, or rotation changes
export const PDFPage = memo(PDFPageComponent, (prevProps, nextProps) => {
  return (
    prevProps.page === nextProps.page &&
    Math.abs(prevProps.scale - nextProps.scale) < 0.001 && // Avoid re-render for tiny scale changes
    prevProps.rotation === nextProps.rotation &&
    prevProps.className === nextProps.className
  );
});

