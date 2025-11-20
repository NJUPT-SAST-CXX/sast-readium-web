'use client';

import { useEffect, useRef, useState } from 'react';
import { PDFPageProxy, PDFPageViewport } from '@/lib/pdf-utils';

interface PDFPageProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  className?: string;
}

export function PDFPage({ page, scale, rotation, className = '' }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!page || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    setIsRendering(true);

    const viewport = page.getViewport({ scale, rotation });
    
    // Set canvas dimensions
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    renderTaskRef.current = page.render(renderContext);
    
    renderTaskRef.current.promise
      .then(() => {
        setIsRendering(false);
      })
      .catch((error: any) => {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', error);
        }
        setIsRendering(false);
      });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [page, scale, rotation]);

  return (
    <div className={`relative ${className}`}>
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
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

