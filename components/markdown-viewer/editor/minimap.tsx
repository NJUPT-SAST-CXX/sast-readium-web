"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface MinimapProps {
  content: string;
  scrollPercentage: number;
  viewportHeight: number;
  totalHeight: number;
  onSeek: (percentage: number) => void;
  className?: string;
}

export function Minimap({
  content,
  scrollPercentage,
  viewportHeight,
  totalHeight,
  onSeek,
  className,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate minimap dimensions
  const minimapHeight = 200;
  const minimapWidth = 80;
  const scale = minimapHeight / totalHeight;
  const viewportIndicatorHeight = Math.max(20, viewportHeight * scale);

  // Parse content into lines with metadata
  const lines = useMemo(() => {
    return content.split("\n").map((line, index) => {
      let type: "heading" | "code" | "list" | "quote" | "normal" = "normal";
      let level = 0;

      if (/^#{1,6}\s/.test(line)) {
        type = "heading";
        level = line.match(/^(#{1,6})/)?.[1].length || 1;
      } else if (/^```/.test(line)) {
        type = "code";
      } else if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
        type = "list";
      } else if (/^>\s/.test(line)) {
        type = "quote";
      }

      return {
        index,
        type,
        level,
        length: line.length,
      };
    });
  }, [content]);

  // Draw minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = minimapWidth;
    canvas.height = minimapHeight;

    // Clear canvas
    ctx.clearRect(0, 0, minimapWidth, minimapHeight);

    // Calculate line positions
    const totalLines = lines.length;
    const linesPerPixel = totalLines / minimapHeight;

    // Draw lines
    for (let y = 0; y < minimapHeight; y++) {
      const startLine = Math.floor(y * linesPerPixel);
      const endLine = Math.min(Math.ceil((y + 1) * linesPerPixel), totalLines);

      let maxLength = 0;
      let dominantType: "heading" | "code" | "list" | "quote" | "normal" =
        "normal";

      for (let i = startLine; i < endLine; i++) {
        const line = lines[i];
        if (line) {
          maxLength = Math.max(maxLength, line.length);
          if (line.type !== "normal") {
            dominantType = line.type;
          }
        }
      }

      // Set color based on type
      switch (dominantType) {
        case "heading":
          ctx.fillStyle = "rgba(59, 130, 246, 0.8)"; // blue
          break;
        case "code":
          ctx.fillStyle = "rgba(34, 197, 94, 0.6)"; // green
          break;
        case "list":
          ctx.fillStyle = "rgba(168, 85, 247, 0.5)"; // purple
          break;
        case "quote":
          ctx.fillStyle = "rgba(249, 115, 22, 0.5)"; // orange
          break;
        default:
          ctx.fillStyle = "rgba(148, 163, 184, 0.4)"; // gray
      }

      // Draw line (width based on content length)
      const width = Math.min(
        minimapWidth - 4,
        (maxLength / 80) * (minimapWidth - 4)
      );
      if (width > 0) {
        ctx.fillRect(2, y, width, 1);
      }
    }
  }, [lines, minimapHeight, minimapWidth]);

  // Handle click/drag
  const handleInteraction = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const y = clientY - rect.top;
      const percentage = Math.max(0, Math.min(1, y / minimapHeight));
      onSeek(percentage);
    },
    [onSeek, minimapHeight]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleInteraction(e.clientY);
    },
    [handleInteraction]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        handleInteraction(e.clientY);
      }
    },
    [isDragging, handleInteraction]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={cn("relative cursor-pointer select-none", className)}
      style={{ width: minimapWidth, height: minimapHeight }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Canvas for content visualization */}
      <canvas ref={canvasRef} className="rounded bg-muted/30" />

      {/* Viewport indicator */}
      <div
        className="absolute left-0 right-0 bg-primary/20 border border-primary/40 rounded pointer-events-none"
        style={{
          top: scrollPercentage * (minimapHeight - viewportIndicatorHeight),
          height: viewportIndicatorHeight,
        }}
      />
    </div>
  );
}
