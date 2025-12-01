"use client";

/**
 * WebGL Page Component - High-performance PDF page rendering with WebGL
 *
 * This component renders a single PDF page using WebGL when available,
 * with automatic fallback to Canvas 2D rendering.
 */

import { useEffect, useRef, useState, memo, useMemo, useCallback } from "react";
import type { PDFPageProxy } from "@/lib/pdf";
import { usePDFStore } from "@/lib/pdf";
import {
  useWebGLStore,
  selectShouldUseWebGL,
  type FilterType,
} from "@/lib/ui/webgl";
import { useWebGL } from "./webgl-provider";
import { PDFWatermark } from "../pdf-watermark";

interface WebGLPageProps {
  page: PDFPageProxy | null;
  scale: number;
  rotation: number;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onRenderSuccess?: () => void;
  width?: number;
  height?: number;
}

/**
 * WebGL Page Component
 */
const WebGLPageComponent = ({
  page,
  scale,
  rotation,
  className = "",
  onDoubleClick,
  onRenderSuccess,
  width,
  height,
}: WebGLPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{
    cancel: () => void;
    promise: Promise<void>;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isZooming, setIsZooming] = useState(false);

  // Get PDF store state
  const {
    setZoom,
    zoom,
    themeMode,
    watermarkText,
    watermarkColor,
    watermarkOpacity,
    watermarkSize,
    watermarkGapX,
    watermarkGapY,
    watermarkRotation,
  } = usePDFStore();

  // Get WebGL state
  const { isWebGLAvailable, isFallback, renderer, textureCache } = useWebGL();
  const shouldUseWebGL = useWebGLStore(selectShouldUseWebGL);
  const settings = useWebGLStore((state) => state.settings);

  // Determine if we should use WebGL for this render
  const useWebGLRendering =
    isWebGLAvailable && !isFallback && shouldUseWebGL && renderer;

  // Calculate dimensions
  const dimensions = useMemo(() => {
    if (!page) return { width: width || 0, height: height || 0 };
    const viewport = page.getViewport({ scale, rotation });
    return { width: viewport.width, height: viewport.height };
  }, [page, scale, rotation, width, height]);

  // Map theme mode to filter type
  const filterType = useMemo((): FilterType => {
    switch (themeMode) {
      case "dark":
        return "dark";
      case "sepia":
        return "sepia";
      default:
        return "none";
    }
  }, [themeMode]);

  /**
   * Wait for previous render to complete
   */
  const waitForPreviousRender = useCallback(async () => {
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
  }, []);

  /**
   * Render page with Canvas 2D (fallback)
   */
  const renderWithCanvas2D = useCallback(async () => {
    if (!page || !canvasRef.current) return;

    await waitForPreviousRender();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: false,
    });
    if (!context) return;

    // Get device pixel ratio
    const devicePixelRatio = Math.min(
      window.devicePixelRatio || 1,
      settings.maxDevicePixelRatio
    );

    // Calculate viewport
    const viewport = page.getViewport({ scale, rotation });

    // Set canvas dimensions with DPI scaling
    const outputScale = settings.enableHighDPI ? devicePixelRatio : 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);

    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    // Scale context
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(outputScale, outputScale);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // Render
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      intent: "display",
    };

    renderTaskRef.current = page.render(renderContext);

    try {
      await renderTaskRef.current.promise;
      onRenderSuccess?.();
    } catch (error) {
      if ((error as Error)?.name !== "RenderingCancelledException") {
        console.error("Error rendering page:", error);
      }
    }
  }, [page, scale, rotation, settings, waitForPreviousRender, onRenderSuccess]);

  /**
   * Render page with WebGL
   */
  const renderWithWebGL = useCallback(async () => {
    if (!page || !canvasRef.current || !renderer || !textureCache) return;

    await waitForPreviousRender();

    const canvas = canvasRef.current;
    const pageNumber =
      (page as unknown as { _pageIndex: number })._pageIndex + 1;

    // Check cache first
    let cacheEntry = textureCache.get(pageNumber, scale);

    if (!cacheEntry) {
      // Need to render the page to a texture
      const offscreenCanvas = document.createElement("canvas");
      const offscreenContext = offscreenCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: true, // We'll read the image data
      });

      if (!offscreenContext) {
        // Fall back to Canvas 2D
        await renderWithCanvas2D();
        return;
      }

      // Get device pixel ratio
      const devicePixelRatio = Math.min(
        window.devicePixelRatio || 1,
        settings.maxDevicePixelRatio
      );

      const viewport = page.getViewport({ scale, rotation });
      const outputScale = settings.enableHighDPI ? devicePixelRatio : 1;

      offscreenCanvas.width = Math.floor(viewport.width * outputScale);
      offscreenCanvas.height = Math.floor(viewport.height * outputScale);

      offscreenContext.setTransform(1, 0, 0, 1, 0, 0);
      offscreenContext.scale(outputScale, outputScale);
      offscreenContext.imageSmoothingEnabled = true;
      offscreenContext.imageSmoothingQuality = "high";

      const renderContext = {
        canvasContext: offscreenContext,
        viewport: viewport,
        intent: "display",
      };

      renderTaskRef.current = page.render(renderContext);

      try {
        await renderTaskRef.current.promise;
      } catch (error) {
        if ((error as Error)?.name !== "RenderingCancelledException") {
          console.error("Error rendering page for WebGL:", error);
        }
        return;
      }

      // Get image data
      const imageData = offscreenContext.getImageData(
        0,
        0,
        offscreenCanvas.width,
        offscreenCanvas.height
      );

      // Create texture
      const contextManager = renderer["contextManager"];
      const texture = contextManager.createTexture(imageData);

      if (texture) {
        cacheEntry = textureCache.set(
          pageNumber,
          scale,
          texture,
          offscreenCanvas.width,
          offscreenCanvas.height
        );
      } else {
        // Texture creation failed, fall back
        await renderWithCanvas2D();
        return;
      }
    }

    // Mark as in use
    textureCache.markInUse(pageNumber, scale, true);

    // Set canvas size
    canvas.width = cacheEntry.width;
    canvas.height = cacheEntry.height;
    canvas.style.width = `${Math.floor(dimensions.width)}px`;
    canvas.style.height = `${Math.floor(dimensions.height)}px`;

    // Render with WebGL
    renderer.renderPage(
      cacheEntry.texture,
      cacheEntry.width,
      cacheEntry.height,
      {
        filter: filterType,
        filterStrength: 1.0,
        opacity: 1.0,
        rotation: 0, // Rotation is already applied in viewport
      }
    );

    // Mark as no longer in use
    textureCache.markInUse(pageNumber, scale, false);

    onRenderSuccess?.();
  }, [
    page,
    scale,
    rotation,
    renderer,
    textureCache,
    settings,
    dimensions,
    filterType,
    waitForPreviousRender,
    renderWithCanvas2D,
    onRenderSuccess,
  ]);

  /**
   * Main render effect
   */
  useEffect(() => {
    if (!page || !canvasRef.current) {
      // Set placeholder dimensions
      if (dimensions.width > 0 && dimensions.height > 0 && canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;
      }
      return;
    }

    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use RAF to ensure canvas is ready
    rafRef.current = requestAnimationFrame(() => {
      if (useWebGLRendering) {
        void renderWithWebGL();
      } else {
        void renderWithCanvas2D();
      }
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
    useWebGLRendering,
    renderWithWebGL,
    renderWithCanvas2D,
    dimensions.width,
    dimensions.height,
  ]);

  /**
   * Handle double-click zoom
   */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (onDoubleClick) {
        onDoubleClick(e);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      setIsZooming(true);

      // Cycle between zoom levels
      let targetZoom: number;
      if (zoom < 1.2) {
        targetZoom = 1.5;
      } else if (zoom < 1.8) {
        targetZoom = 2.0;
      } else {
        targetZoom = 1.0;
      }

      // Get click position
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xPercent = x / rect.width;
      const yPercent = y / rect.height;

      // Find scroll container
      let scrollContainer = container.parentElement;
      while (
        scrollContainer &&
        scrollContainer.scrollHeight === scrollContainer.clientHeight
      ) {
        scrollContainer = scrollContainer.parentElement;
      }

      // Animate zoom if WebGL is available and animations are enabled
      if (useWebGLRendering && renderer && settings.enableZoomAnimation) {
        const beforeScrollLeft = scrollContainer?.scrollLeft || 0;
        const beforeScrollTop = scrollContainer?.scrollTop || 0;

        renderer.startZoomAnimation(
          zoom,
          targetZoom,
          { x: xPercent, y: yPercent },
          settings.zoomAnimationDuration,
          (progress, currentScale) => {
            setZoom(currentScale);
          },
          () => {
            setIsZooming(false);
            // Adjust scroll position
            if (scrollContainer) {
              const newRect = container.getBoundingClientRect();
              const newX = xPercent * newRect.width;
              const newY = yPercent * newRect.height;
              const deltaX = newX - x;
              const deltaY = newY - y;
              scrollContainer.scrollLeft = beforeScrollLeft + deltaX;
              scrollContainer.scrollTop = beforeScrollTop + deltaY;
            }
          }
        );
      } else {
        // Non-animated zoom
        if (scrollContainer) {
          const beforeScrollLeft = scrollContainer.scrollLeft;
          const beforeScrollTop = scrollContainer.scrollTop;

          setZoom(targetZoom);

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
      }
    },
    [
      onDoubleClick,
      zoom,
      setZoom,
      useWebGLRendering,
      renderer,
      settings.enableZoomAnimation,
      settings.zoomAnimationDuration,
    ]
  );

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

/**
 * Memoized WebGL Page Component
 */
export const WebGLPage = memo(WebGLPageComponent, (prevProps, nextProps) => {
  // Check if it's effectively the same page
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
    Math.abs(prevProps.scale - nextProps.scale) < 0.001 &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.className === nextProps.className
  );
});
