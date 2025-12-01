/**
 * WebGL Module - PDF rendering with WebGL acceleration
 *
 * This module provides high-performance PDF page rendering using WebGL,
 * with automatic fallback to Canvas 2D when WebGL is not available.
 *
 * Features:
 * - GPU-accelerated page rendering
 * - Texture caching with LRU eviction
 * - Smooth zoom and page transition animations
 * - Filter support (dark mode, sepia, invert)
 * - Automatic capability detection and fallback
 *
 * Usage:
 * ```typescript
 * import { useWebGLStore, createWebGLContextManager, createTextureCache, createWebGLRenderer } from '@/lib/webgl';
 *
 * // Initialize in component
 * const { initializeWebGL, settings } = useWebGLStore();
 *
 * useEffect(() => {
 *   initializeWebGL();
 * }, []);
 * ```
 */

// Types
export * from "./types";

// Capabilities detection
export {
  detectWebGLCapabilities,
  shouldUseWebGL,
  getRecommendedSettings,
  clearCapabilitiesCache,
} from "./webgl-capabilities";

// Context management
export {
  WebGLContextManager,
  createWebGLContextManager,
} from "./webgl-context";

// Texture cache
export { TextureCache, createTextureCache } from "./texture-cache";

// Renderer
export { WebGLRenderer, createWebGLRenderer } from "./webgl-renderer";

// State management
export {
  useWebGLStore,
  selectShouldUseWebGL,
  selectEffectiveDevicePixelRatio,
  selectCacheMemoryLimitBytes,
} from "./webgl-store";

// Shaders (for advanced usage)
export * from "./shaders";
