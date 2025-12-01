/**
 * WebGL Types - TypeScript interfaces for WebGL PDF rendering
 */

/** WebGL capability levels */
export type WebGLVersion = "webgl2" | "webgl1" | "none";

/** Render mode selection */
export type RenderMode = "webgl" | "canvas2d" | "auto";

/** Page transition animation types */
export type TransitionType = "none" | "fade" | "slide" | "zoom";

/** Filter types for PDF rendering */
export type FilterType = "none" | "dark" | "sepia" | "invert";

/**
 * WebGL capabilities detection result
 */
export interface WebGLCapabilities {
  /** Highest supported WebGL version */
  version: WebGLVersion;
  /** Maximum texture size supported */
  maxTextureSize: number;
  /** Maximum number of texture units */
  maxTextureUnits: number;
  /** Whether float textures are supported */
  floatTexturesSupported: boolean;
  /** Whether linear filtering for float textures is supported */
  floatLinearFilteringSupported: boolean;
  /** Estimated VRAM in MB (if available) */
  estimatedVRAM: number | null;
  /** Whether context loss recovery is supported */
  contextLossRecoverySupported: boolean;
  /** GPU vendor string */
  vendor: string;
  /** GPU renderer string */
  renderer: string;
  /** WebGL extensions available */
  extensions: string[];
}

/**
 * Texture cache entry
 */
export interface TextureCacheEntry {
  /** WebGL texture object */
  texture: WebGLTexture;
  /** Page number this texture represents */
  pageNumber: number;
  /** Width of the texture */
  width: number;
  /** Height of the texture */
  height: number;
  /** Scale at which this texture was rendered */
  scale: number;
  /** Estimated memory usage in bytes */
  memoryBytes: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Whether this texture is currently being used for rendering */
  inUse: boolean;
}

/**
 * Texture cache options
 */
export interface TextureCacheOptions {
  /** Maximum memory limit in bytes (default 512MB) */
  maxMemoryBytes: number;
  /** Number of pages to preload ahead/behind visible area */
  preloadBuffer: number;
  /** Whether to use half-resolution for preloaded pages */
  halfResolutionPreload: boolean;
}

/**
 * WebGL context state
 */
export interface WebGLContextState {
  /** Whether WebGL is currently available */
  isAvailable: boolean;
  /** Current WebGL version being used */
  version: WebGLVersion;
  /** Whether the context has been lost */
  isContextLost: boolean;
  /** Whether we're in fallback mode (Canvas 2D) */
  isFallback: boolean;
  /** Error message if WebGL failed */
  errorMessage: string | null;
  /** Timestamp of last context loss */
  lastContextLoss: number | null;
  /** Number of context losses since init */
  contextLossCount: number;
}

/**
 * Shader program info
 */
export interface ShaderProgram {
  /** WebGL program object */
  program: WebGLProgram;
  /** Attribute locations */
  attributes: Record<string, number>;
  /** Uniform locations */
  uniforms: Record<string, WebGLUniformLocation | null>;
}

/**
 * Page render request
 */
export interface PageRenderRequest {
  /** Page number to render */
  pageNumber: number;
  /** Scale factor */
  scale: number;
  /** Rotation in degrees (0, 90, 180, 270) */
  rotation: number;
  /** Filter to apply */
  filter: FilterType;
  /** Priority (higher = more important) */
  priority: number;
  /** Callback when render is complete */
  onComplete?: (success: boolean) => void;
}

/**
 * Animation frame data
 */
export interface AnimationFrame {
  /** Current progress (0-1) */
  progress: number;
  /** Start timestamp */
  startTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** Easing function name */
  easing: "linear" | "ease-out" | "ease-in-out" | "ease-out-cubic";
  /** Whether animation is complete */
  isComplete: boolean;
}

/**
 * Page transition state
 */
export interface TransitionState {
  /** Type of transition */
  type: TransitionType;
  /** Animation frame data */
  animation: AnimationFrame | null;
  /** Previous page number (for transition) */
  fromPage: number | null;
  /** Target page number */
  toPage: number;
}

/**
 * WebGL renderer settings (persisted)
 */
export interface WebGLSettings {
  /** Render mode preference */
  renderMode: RenderMode;
  /** Enable smooth zoom animations */
  enableZoomAnimation: boolean;
  /** Enable page transition animations */
  enablePageTransitions: boolean;
  /** Page transition type */
  transitionType: TransitionType;
  /** Transition duration in ms */
  transitionDuration: number;
  /** Zoom animation duration in ms */
  zoomAnimationDuration: number;
  /** Maximum texture cache memory in MB */
  maxCacheMemoryMB: number;
  /** Number of pages to preload */
  preloadPages: number;
  /** Enable high-DPI rendering */
  enableHighDPI: boolean;
  /** Maximum device pixel ratio to use */
  maxDevicePixelRatio: number;
}

/**
 * Default WebGL settings
 */
export const DEFAULT_WEBGL_SETTINGS: WebGLSettings = {
  renderMode: "auto",
  enableZoomAnimation: true,
  enablePageTransitions: true,
  transitionType: "fade",
  transitionDuration: 200,
  zoomAnimationDuration: 150,
  maxCacheMemoryMB: 512,
  preloadPages: 2,
  enableHighDPI: true,
  maxDevicePixelRatio: 2,
};

/**
 * Memory statistics
 */
export interface MemoryStats {
  /** Total cache memory used in bytes */
  cacheMemoryBytes: number;
  /** Number of textures in cache */
  textureCount: number;
  /** Number of pages currently cached */
  cachedPages: number[];
  /** Estimated total VRAM available */
  estimatedVRAM: number | null;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
}

/**
 * WebGL store state
 */
export interface WebGLStoreState {
  /** Current capabilities */
  capabilities: WebGLCapabilities | null;
  /** Current context state */
  contextState: WebGLContextState;
  /** Current settings */
  settings: WebGLSettings;
  /** Memory statistics */
  memoryStats: MemoryStats;
  /** Whether WebGL is initialized */
  isInitialized: boolean;

  // Actions
  initializeWebGL: () => Promise<void>;
  updateSettings: (settings: Partial<WebGLSettings>) => void;
  resetSettings: () => void;
  forceCanvasFallback: () => void;
  retryWebGL: () => Promise<void>;
  updateMemoryStats: (stats: Partial<MemoryStats>) => void;
}

/**
 * Vertex data for a quad (two triangles)
 * Format: [x, y, u, v] for each vertex
 */
export const QUAD_VERTICES = new Float32Array([
  // Triangle 1
  -1,
  -1,
  0,
  1, // bottom-left
  1,
  -1,
  1,
  1, // bottom-right
  -1,
  1,
  0,
  0, // top-left
  // Triangle 2
  1,
  -1,
  1,
  1, // bottom-right
  1,
  1,
  1,
  0, // top-right
  -1,
  1,
  0,
  0, // top-left
]);
