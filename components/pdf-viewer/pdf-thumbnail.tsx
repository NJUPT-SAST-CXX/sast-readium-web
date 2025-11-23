'use client';

import { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from '@/lib/pdf-utils';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface PDFThumbnailProps {
  page: PDFPageProxy | null;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
  rotation?: number;
}

export function PDFThumbnail({ page, pageNumber, isActive, onClick, rotation = 0 }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderedState, setRenderedState] = useState<{ page: PDFPageProxy | null; rotation: number }>({ page: null, rotation: 0 });
  const isLoaded = page === renderedState.page && rotation === renderedState.rotation;

  useEffect(() => {
    if (!page || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', {
      // Performance optimization for thumbnails
      alpha: false,
      willReadFrequently: false,
    });
    if (!context) return;

    // Use lower scale for thumbnails to improve performance
    const thumbnailScale = 0.3;
    const viewport = page.getViewport({ scale: thumbnailScale, rotation });

    // For thumbnails, we can use lower DPI to improve performance
    // Still apply some DPI scaling for clarity on high-DPI displays
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const outputScale = devicePixelRatio;

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);

    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    context.scale(outputScale, outputScale);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      intent: 'display',
    };

    page.render(renderContext).promise
      .then(() => {
        setRenderedState({ page, rotation });
      })
      .catch((error: Error) => {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering thumbnail:', error);
        }
      });
  }, [page, rotation]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all hover:bg-accent',
        isActive
          ? 'border-primary bg-accent'
          : 'border-transparent hover:border-border'
      )}
    >
      <div className="relative overflow-hidden rounded bg-white">
        {!page || !isLoaded ? (
          <div className="flex h-32 w-24 items-center justify-center bg-muted">
            {page && !isLoaded && (
              <Spinner className="h-4 w-4" />
            )}
            {!page && (
              <div className="text-xs text-muted-foreground">...</div>
            )}
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          className={cn(
            'transition-opacity',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {pageNumber}
      </span>
    </button>
  );
}

