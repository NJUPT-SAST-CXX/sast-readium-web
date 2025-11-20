'use client';

import { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from '@/lib/pdf-utils';
import { cn } from '@/lib/utils';

interface PDFThumbnailProps {
  page: PDFPageProxy | null;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}

export function PDFThumbnail({ page, pageNumber, isActive, onClick }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderedPageRef, setRenderedPageRef] = useState<PDFPageProxy | null>(null);
  const isLoaded = page === renderedPageRef;

  useEffect(() => {
    if (!page || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const viewport = page.getViewport({ scale: 0.3 });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    page.render(renderContext).promise
      .then(() => {
        setRenderedPageRef(page);
      })
      .catch((error: Error) => {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering thumbnail:', error);
        }
      });
  }, [page]);

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
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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

