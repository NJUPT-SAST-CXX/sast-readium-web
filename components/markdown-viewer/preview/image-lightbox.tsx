"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface ImageLightboxProps {
  src: string;
  alt: string;
  images?: Array<{ src: string; alt: string }>;
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Image Lightbox Component
// ============================================================================

export function ImageLightbox({
  src,
  alt,
  images = [],
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [wasOpen, setWasOpen] = useState(false);

  // Determine if we're in gallery mode
  const hasGallery = images.length > 1;
  const currentImage = useMemo(
    () => (hasGallery ? images[currentIndex] : { src, alt }),
    [hasGallery, images, currentIndex, src, alt]
  );

  // Reset state when dialog opens (using render-time check instead of effect)
  if (open && !wasOpen) {
    setWasOpen(true);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex(initialIndex);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Rotation
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Navigation
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  // Download
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentImage.alt || "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
      // Fallback: open in new tab
      window.open(currentImage.src, "_blank");
    }
  }, [currentImage]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onOpenChange(false);
          break;
        case "ArrowLeft":
          if (hasGallery) handlePrevious();
          break;
        case "ArrowRight":
          if (hasGallery) handleNext();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          handleResetZoom();
          break;
        case "r":
        case "R":
          handleRotate();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    hasGallery,
    handlePrevious,
    handleNext,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleRotate,
    onOpenChange,
  ]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  // Drag to pan (when zoomed)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [zoom, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && zoom > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, zoom, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95 overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <DialogTitle className="sr-only">
          {currentImage.alt || "Image preview"}
        </DialogTitle>

        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleZoomOut}
              title="Zoom out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleZoomIn}
              title="Zoom in (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleResetZoom}
              title="Reset zoom (0)"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleRotate}
              title="Rotate (R)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex items-center justify-center w-full h-[90vh] select-none">
          {/* Previous button */}
          {hasGallery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 z-10 h-12 w-12 text-white hover:bg-white/20 rounded-full"
              onClick={handlePrevious}
              title="Previous (←)"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.src}
            alt={currentImage.alt || ""}
            className={cn(
              "max-w-full max-h-full object-contain transition-transform duration-200",
              zoom > 1 && isDragging
                ? "cursor-grabbing"
                : zoom > 1
                  ? "cursor-grab"
                  : "cursor-default"
            )}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
            draggable={false}
          />

          {/* Next button */}
          {hasGallery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 z-10 h-12 w-12 text-white hover:bg-white/20 rounded-full"
              onClick={handleNext}
              title="Next (→)"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>

        {/* Gallery indicator */}
        {hasGallery && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Alt text */}
        {currentImage.alt && (
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-white/80 text-sm truncate bg-black/30 px-3 py-1 rounded inline-block max-w-full">
              {currentImage.alt}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Clickable Image Component (for use in MarkdownPreview)
// ============================================================================

export interface ClickableImageProps {
  src: string;
  alt: string;
  className?: string;
  allImages?: Array<{ src: string; alt: string }>;
}

export function ClickableImage({
  src,
  alt,
  className,
  allImages = [],
}: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find current image index in gallery
  const currentIndex = allImages.findIndex((img) => img.src === src);
  const hasGallery = allImages.length > 1 && currentIndex !== -1;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ""}
        className={cn(
          "cursor-zoom-in hover:opacity-90 transition-opacity",
          className
        )}
        loading="lazy"
        onClick={() => setIsOpen(true)}
      />
      <ImageLightbox
        src={src}
        alt={alt}
        images={hasGallery ? allImages : []}
        initialIndex={hasGallery ? currentIndex : 0}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
