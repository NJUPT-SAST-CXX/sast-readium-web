/**
 * WebGL Store - Zustand store for WebGL state management
 *
 * Manages WebGL settings, capabilities, and context state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WebGLStoreState,
  WebGLSettings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  WebGLCapabilities,
  WebGLContextState,
  MemoryStats,
} from "./types";
import { DEFAULT_WEBGL_SETTINGS } from "./types";
import {
  detectWebGLCapabilities,
  shouldUseWebGL,
  getRecommendedSettings,
} from "./webgl-capabilities";

/**
 * Initial context state
 */
const INITIAL_CONTEXT_STATE: WebGLContextState = {
  isAvailable: false,
  version: "none",
  isContextLost: false,
  isFallback: false,
  errorMessage: null,
  lastContextLoss: null,
  contextLossCount: 0,
};

/**
 * Initial memory stats
 */
const INITIAL_MEMORY_STATS: MemoryStats = {
  cacheMemoryBytes: 0,
  textureCount: 0,
  cachedPages: [],
  estimatedVRAM: null,
  cacheHitRate: 0,
};

/**
 * Create WebGL store
 */
export const useWebGLStore = create<WebGLStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      capabilities: null,
      contextState: INITIAL_CONTEXT_STATE,
      settings: DEFAULT_WEBGL_SETTINGS,
      memoryStats: INITIAL_MEMORY_STATS,
      isInitialized: false,

      // Initialize WebGL
      initializeWebGL: async () => {
        // Detect capabilities
        const capabilities = detectWebGLCapabilities();

        // Determine if WebGL should be used
        const shouldUse = shouldUseWebGL(capabilities);

        // Get recommended settings based on capabilities
        const recommended = getRecommendedSettings(capabilities);

        // Merge recommended settings with current settings
        const currentSettings = get().settings;
        const newSettings: WebGLSettings = {
          ...currentSettings,
          maxCacheMemoryMB: recommended.maxCacheMemoryMB,
          preloadPages: recommended.preloadPages,
          maxDevicePixelRatio: recommended.maxDevicePixelRatio,
        };

        // Update state
        set({
          capabilities,
          settings: newSettings,
          memoryStats: {
            ...INITIAL_MEMORY_STATS,
            estimatedVRAM: capabilities.estimatedVRAM,
          },
          contextState: {
            ...INITIAL_CONTEXT_STATE,
            isAvailable: shouldUse,
            version: capabilities.version,
            isFallback: !shouldUse,
            errorMessage: shouldUse
              ? null
              : "WebGL not available or not recommended",
          },
          isInitialized: true,
        });
      },

      // Update settings
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      // Reset settings to defaults
      resetSettings: () => {
        const capabilities = get().capabilities;
        if (capabilities) {
          const recommended = getRecommendedSettings(capabilities);
          set({
            settings: {
              ...DEFAULT_WEBGL_SETTINGS,
              maxCacheMemoryMB: recommended.maxCacheMemoryMB,
              preloadPages: recommended.preloadPages,
              maxDevicePixelRatio: recommended.maxDevicePixelRatio,
            },
          });
        } else {
          set({ settings: DEFAULT_WEBGL_SETTINGS });
        }
      },

      // Force Canvas 2D fallback
      forceCanvasFallback: () => {
        set((state) => ({
          contextState: {
            ...state.contextState,
            isAvailable: false,
            isFallback: true,
            errorMessage: "Forced Canvas 2D fallback",
          },
          settings: {
            ...state.settings,
            renderMode: "canvas2d",
          },
        }));
      },

      // Retry WebGL initialization
      retryWebGL: async () => {
        // Reset context state
        set({
          contextState: INITIAL_CONTEXT_STATE,
          isInitialized: false,
        });

        // Re-initialize
        await get().initializeWebGL();
      },

      // Update memory stats
      updateMemoryStats: (stats) => {
        set((state) => ({
          memoryStats: { ...state.memoryStats, ...stats },
        }));
      },
    }),
    {
      name: "webgl-settings-storage",
      partialize: (state) => ({
        // Only persist user settings
        settings: state.settings,
      }),
    }
  )
);

/**
 * Selector: Should use WebGL for rendering
 */
export function selectShouldUseWebGL(state: WebGLStoreState): boolean {
  if (!state.isInitialized) return false;
  if (state.settings.renderMode === "canvas2d") return false;
  if (state.settings.renderMode === "webgl")
    return state.contextState.isAvailable;
  // Auto mode
  return state.contextState.isAvailable && !state.contextState.isFallback;
}

/**
 * Selector: Get effective device pixel ratio
 */
export function selectEffectiveDevicePixelRatio(
  state: WebGLStoreState
): number {
  if (!state.settings.enableHighDPI) return 1;
  const systemDPR = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  return Math.min(systemDPR, state.settings.maxDevicePixelRatio);
}

/**
 * Selector: Get cache memory limit in bytes
 */
export function selectCacheMemoryLimitBytes(state: WebGLStoreState): number {
  return state.settings.maxCacheMemoryMB * 1024 * 1024;
}
