"use client";

/**
 * WebGL Provider - React context provider for WebGL rendering
 *
 * Provides WebGL context, renderer, and texture cache to child components.
 * Handles initialization, context loss recovery, and fallback.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  WebGLContextManager,
  createWebGLContextManager,
  TextureCache,
  createTextureCache,
  WebGLRenderer,
  createWebGLRenderer,
  useWebGLStore,
  selectShouldUseWebGL,
  selectCacheMemoryLimitBytes,
} from "@/lib/ui/webgl";

/**
 * WebGL context value
 */
interface WebGLContextValue {
  /** Whether WebGL is available and initialized */
  isWebGLAvailable: boolean;
  /** Whether we're in fallback mode (Canvas 2D) */
  isFallback: boolean;
  /** The WebGL renderer instance */
  renderer: WebGLRenderer | null;
  /** The texture cache instance */
  textureCache: TextureCache | null;
  /** The context manager instance */
  contextManager: WebGLContextManager | null;
  /** Whether initialization is in progress */
  isInitializing: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Force re-initialization */
  reinitialize: () => Promise<void>;
}

const WebGLContext = createContext<WebGLContextValue | null>(null);

/**
 * WebGL Provider Props
 */
interface WebGLProviderProps {
  children: ReactNode;
  /** Canvas element to use for WebGL (optional, will create one if not provided) */
  canvas?: HTMLCanvasElement | null;
  /** Callback when WebGL initialization fails */
  onFallback?: () => void;
  /** Callback when WebGL context is lost */
  onContextLost?: () => void;
  /** Callback when WebGL context is restored */
  onContextRestored?: () => void;
}

/**
 * WebGL Provider Component
 */
export function WebGLProvider({
  children,
  canvas: externalCanvas,
  onFallback,
  onContextLost,
  onContextRestored,
}: WebGLProviderProps) {
  const [isWebGLAvailable, setIsWebGLAvailable] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contextManagerRef = useRef<WebGLContextManager | null>(null);
  const textureCacheRef = useRef<TextureCache | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Get store state
  const initializeWebGLStore = useWebGLStore((state) => state.initializeWebGL);
  const shouldUseWebGL = useWebGLStore(selectShouldUseWebGL);
  const cacheMemoryLimit = useWebGLStore(selectCacheMemoryLimitBytes);
  const updateMemoryStats = useWebGLStore((state) => state.updateMemoryStats);

  /**
   * Initialize WebGL
   */
  const initialize = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      // Initialize store first (detects capabilities)
      await initializeWebGLStore();

      // Check if we should use WebGL
      if (!shouldUseWebGL) {
        setIsFallback(true);
        setIsWebGLAvailable(false);
        setIsInitializing(false);
        onFallback?.();
        return;
      }

      // Get or create canvas
      let canvas = externalCanvas;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.style.display = "none";
        document.body.appendChild(canvas);
        internalCanvasRef.current = canvas;
      }

      // Create context manager
      const contextManager = createWebGLContextManager();
      contextManagerRef.current = contextManager;

      // Initialize context
      const state = await contextManager.initialize(canvas, {
        onContextLost: () => {
          setIsWebGLAvailable(false);
          onContextLost?.();
        },
        onContextRestored: () => {
          setIsWebGLAvailable(true);
          onContextRestored?.();
        },
        onFallback: () => {
          setIsFallback(true);
          setIsWebGLAvailable(false);
          onFallback?.();
        },
      });

      if (!state.isAvailable) {
        setError(state.errorMessage || "WebGL initialization failed");
        setIsFallback(true);
        setIsWebGLAvailable(false);
        setIsInitializing(false);
        onFallback?.();
        return;
      }

      // Create texture cache
      const textureCache = createTextureCache(contextManager, {
        maxMemoryBytes: cacheMemoryLimit,
        preloadBuffer: 2,
        halfResolutionPreload: true,
      });
      textureCacheRef.current = textureCache;

      // Create renderer
      const renderer = createWebGLRenderer(contextManager, textureCache);
      const initResult = await renderer.initialize(canvas);

      if (!initResult) {
        setError("Failed to initialize WebGL renderer");
        setIsFallback(true);
        setIsWebGLAvailable(false);
        setIsInitializing(false);
        onFallback?.();
        return;
      }

      rendererRef.current = renderer;
      setIsWebGLAvailable(true);
      setIsFallback(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setIsFallback(true);
      setIsWebGLAvailable(false);
      onFallback?.();
    } finally {
      setIsInitializing(false);
    }
  }, [
    externalCanvas,
    shouldUseWebGL,
    cacheMemoryLimit,
    initializeWebGLStore,
    onFallback,
    onContextLost,
    onContextRestored,
  ]);

  /**
   * Re-initialize WebGL
   */
  const reinitialize = useCallback(async () => {
    // Dispose existing resources
    rendererRef.current?.dispose();
    textureCacheRef.current?.clear();
    contextManagerRef.current?.dispose();

    rendererRef.current = null;
    textureCacheRef.current = null;
    contextManagerRef.current = null;

    // Remove internal canvas if it exists
    if (internalCanvasRef.current) {
      internalCanvasRef.current.remove();
      internalCanvasRef.current = null;
    }

    // Re-initialize
    await initialize();
  }, [initialize]);

  // Initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      // Cleanup on unmount
      rendererRef.current?.dispose();
      textureCacheRef.current?.clear();
      contextManagerRef.current?.dispose();

      if (internalCanvasRef.current) {
        internalCanvasRef.current.remove();
      }
    };
  }, [initialize]);

  // Update memory stats periodically
  useEffect(() => {
    if (!textureCacheRef.current) return;

    const interval = setInterval(() => {
      if (textureCacheRef.current) {
        const stats = textureCacheRef.current.getStats();
        updateMemoryStats(stats);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [updateMemoryStats]);

  const value: WebGLContextValue = {
    isWebGLAvailable,
    isFallback,
    renderer: rendererRef.current,
    textureCache: textureCacheRef.current,
    contextManager: contextManagerRef.current,
    isInitializing,
    error,
    reinitialize,
  };

  return (
    <WebGLContext.Provider value={value}>{children}</WebGLContext.Provider>
  );
}

/**
 * Hook to access WebGL context
 */
export function useWebGL(): WebGLContextValue {
  const context = useContext(WebGLContext);
  if (!context) {
    throw new Error("useWebGL must be used within a WebGLProvider");
  }
  return context;
}

/**
 * Hook to check if WebGL should be used for rendering
 */
export function useWebGLRendering(): {
  shouldUseWebGL: boolean;
  isReady: boolean;
  renderer: WebGLRenderer | null;
} {
  const { isWebGLAvailable, isFallback, isInitializing, renderer } = useWebGL();

  return {
    shouldUseWebGL: isWebGLAvailable && !isFallback,
    isReady: !isInitializing && (isWebGLAvailable || isFallback),
    renderer,
  };
}
