"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { usePDFStore } from "@/lib/pdf";
import { PDFPageProxy } from "@/lib/pdf";
import { cn } from "@/lib/utils";

interface PDFDrawingLayerProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  isDrawingMode: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export function PDFDrawingLayer({
  page,
  scale,
  rotation,
  isDrawingMode,
  strokeColor,
  strokeWidth,
}: PDFDrawingLayerProps) {
  const { addAnnotation, currentPage, annotations } = usePDFStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Use refs for performance-critical data to avoid triggering re-renders
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const cachedRectRef = useRef<DOMRect | null>(null);

  // Get viewport dimensions
  const viewport = page?.getViewport({ scale, rotation });

  // Memoize filtered drawings for current page
  const currentPageDrawings = useMemo(
    () =>
      annotations.filter(
        (a) => a.pageNumber === currentPage && a.type === "drawing"
      ),
    [annotations, currentPage]
  );

  // Draw a single line segment incrementally (for real-time drawing)
  const drawLineSegment = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number }
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [strokeColor, strokeWidth]
  );

  // Draw all existing annotations (called when page loads or annotations change)
  const drawAllAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewport) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all existing drawing annotations
    currentPageDrawings.forEach((drawing) => {
      if (!drawing.path || drawing.path.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.strokeWidth || 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Convert normalized coordinates to canvas coordinates
      const startPoint = {
        x: drawing.path[0].x * viewport.width,
        y: drawing.path[0].y * viewport.height,
      };
      ctx.moveTo(startPoint.x, startPoint.y);

      for (let i = 1; i < drawing.path.length; i++) {
        const canvasPoint = {
          x: drawing.path[i].x * viewport.width,
          y: drawing.path[i].y * viewport.height,
        };
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      }

      ctx.stroke();
    });

    // Also redraw current path if drawing
    const path = currentPathRef.current;
    if (path.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  }, [currentPageDrawings, viewport, strokeColor, strokeWidth]);

  // Effect to redraw when annotations or viewport changes
  useEffect(() => {
    drawAllAnnotations();
  }, [drawAllAnnotations]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingMode || !canvasRef.current) return;

      // Cache the rect for the duration of the drawing
      cachedRectRef.current = canvasRef.current.getBoundingClientRect();
      const rect = cachedRectRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      currentPathRef.current = [{ x, y }];
      lastPointRef.current = { x, y };
      setIsDrawing(true);
    },
    [isDrawingMode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !canvasRef.current || !cachedRectRef.current) return;

      const rect = cachedRectRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newPoint = { x, y };

      // Add point to path ref (no state update)
      currentPathRef.current.push(newPoint);

      // Use requestAnimationFrame for throttled rendering
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          const lastPoint = lastPointRef.current;

          if (ctx && lastPoint) {
            // Draw only the new line segment (incremental drawing)
            drawLineSegment(ctx, lastPoint, newPoint);
            lastPointRef.current = newPoint;
          }

          rafIdRef.current = null;
        });
      }
    },
    [isDrawing, drawLineSegment]
  );

  const handleMouseUp = useCallback(() => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (!isDrawing || !viewport) {
      setIsDrawing(false);
      currentPathRef.current = [];
      lastPointRef.current = null;
      cachedRectRef.current = null;
      return;
    }

    const currentPath = currentPathRef.current;

    // Only save if there's a meaningful path
    if (currentPath.length > 2) {
      // Normalize coordinates (0-1 range)
      const normalizedPath = currentPath.map((point) => ({
        x: point.x / viewport.width,
        y: point.y / viewport.height,
      }));

      // Calculate bounding box using reduce for better performance
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of normalizedPath) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }

      addAnnotation({
        type: "drawing",
        pageNumber: currentPage,
        color: strokeColor,
        position: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
        path: normalizedPath,
        strokeWidth,
      });
    }

    setIsDrawing(false);
    currentPathRef.current = [];
    lastPointRef.current = null;
    cachedRectRef.current = null;
  }, [
    isDrawing,
    viewport,
    addAnnotation,
    currentPage,
    strokeColor,
    strokeWidth,
  ]);

  if (!viewport) return null;

  return (
    <canvas
      ref={canvasRef}
      width={viewport.width}
      height={viewport.height}
      className={cn(
        "absolute inset-0 pointer-events-auto",
        isDrawingMode && "cursor-crosshair"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
      }}
    />
  );
}
