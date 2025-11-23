"use client";

import { useRef, useState, useEffect } from "react";
import { usePDFStore } from "@/lib/pdf-store";
import { PDFPageProxy } from "@/lib/pdf-utils";
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
  const [currentPath, setCurrentPath] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // Get viewport dimensions
  const viewport = page?.getViewport({ scale, rotation });

  // Filter drawings for current page
  const currentPageDrawings = annotations.filter(
    (a) => a.pageNumber === currentPage && a.type === "drawing"
  );

  // Draw existing annotations on canvas
  useEffect(() => {
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

      drawing.path.slice(1).forEach((point) => {
        const canvasPoint = {
          x: point.x * viewport.width,
          y: point.y * viewport.height,
        };
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      });

      ctx.stroke();
    });

    // Draw current path being drawn
    if (currentPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [currentPageDrawings, currentPath, viewport, strokeColor, strokeWidth]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPath((prev) => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !viewport) {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    // Only save if there's a meaningful path
    if (currentPath.length > 2) {
      // Normalize coordinates (0-1 range)
      const normalizedPath = currentPath.map((point) => ({
        x: point.x / viewport.width,
        y: point.y / viewport.height,
      }));

      // Calculate bounding box
      const minX = Math.min(...normalizedPath.map((p) => p.x));
      const minY = Math.min(...normalizedPath.map((p) => p.y));
      const maxX = Math.max(...normalizedPath.map((p) => p.x));
      const maxY = Math.max(...normalizedPath.map((p) => p.y));

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
    setCurrentPath([]);
  };

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
