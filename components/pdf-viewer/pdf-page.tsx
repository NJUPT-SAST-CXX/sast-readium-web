'use client';

import { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from '@/lib/pdf-utils';
import { usePDFStore } from '@/lib/pdf-store';

interface PDFPageProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function PDFPage({ page, scale, rotation, className = '', onDoubleClick }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const previousZoomRef = useRef<number>(scale);
  const { setZoom, zoom } = usePDFStore();

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

    let isMounted = true;

    // Get device pixel ratio for high-DPI displays (Retina, 4K, etc.)
    const devicePixelRatio = window.devicePixelRatio || 1;

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
        }
      })
      .catch((error: Error) => {
        if (isMounted && error.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', error);
        }
      });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [page, scale, rotation]);

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

    // Toggle between current zoom and 2x zoom
    const targetZoom = zoom < 1.8 ? 2.0 : 1.0;

    // Get click position relative to the container
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate the center point as a percentage
    const xPercent = x / rect.width;
    const yPercent = y / rect.height;

    // Store the click position for potential scroll adjustment
    const scrollContainer = container.closest('.pdf-scroll-container');
    if (scrollContainer) {
      const beforeScrollLeft = scrollContainer.scrollLeft;
      const beforeScrollTop = scrollContainer.scrollTop;

      // Apply zoom
      setZoom(targetZoom);

      // Wait for re-render, then adjust scroll to keep the clicked point centered
      setTimeout(() => {
        const newRect = container.getBoundingClientRect();
        const newX = xPercent * newRect.width;
        const newY = yPercent * newRect.height;

        const deltaX = newX - x;
        const deltaY = newY - y;

        scrollContainer.scrollLeft = beforeScrollLeft + deltaX;
        scrollContainer.scrollTop = beforeScrollTop + deltaY;

        setIsZooming(false);
      }, 50);
    } else {
      setZoom(targetZoom);
      setTimeout(() => setIsZooming(false), 50);
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
    </div>
  );
}

