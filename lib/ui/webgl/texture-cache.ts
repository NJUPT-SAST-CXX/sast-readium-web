/**
 * Texture Cache - LRU cache for WebGL textures
 *
 * Implements an LRU (Least Recently Used) cache for WebGL textures
 * with configurable memory limits and automatic eviction.
 */

import type {
  TextureCacheEntry,
  TextureCacheOptions,
  MemoryStats,
} from "./types";
import type { WebGLContextManager } from "./webgl-context";

/** Default cache options */
const DEFAULT_OPTIONS: TextureCacheOptions = {
  maxMemoryBytes: 512 * 1024 * 1024, // 512 MB
  preloadBuffer: 2,
  halfResolutionPreload: true,
};

/**
 * Texture Cache Class
 */
export class TextureCache {
  private contextManager: WebGLContextManager;
  private options: TextureCacheOptions;
  private cache: Map<string, TextureCacheEntry> = new Map();
  private currentMemoryBytes = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    contextManager: WebGLContextManager,
    options?: Partial<TextureCacheOptions>
  ) {
    this.contextManager = contextManager;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate cache key for a page
   */
  private getCacheKey(pageNumber: number, scale: number): string {
    // Round scale to 2 decimal places to avoid too many cache entries
    const roundedScale = Math.round(scale * 100) / 100;
    return `page_${pageNumber}_scale_${roundedScale}`;
  }

  /**
   * Get a texture from the cache
   */
  get(pageNumber: number, scale: number): TextureCacheEntry | null {
    const key = this.getCacheKey(pageNumber, scale);
    const entry = this.cache.get(key);

    if (entry) {
      // Update last accessed time
      entry.lastAccessed = Date.now();
      this.cacheHits++;
      return entry;
    }

    this.cacheMisses++;
    return null;
  }

  /**
   * Check if a page is in the cache
   */
  has(pageNumber: number, scale: number): boolean {
    const key = this.getCacheKey(pageNumber, scale);
    return this.cache.has(key);
  }

  /**
   * Add or update a texture in the cache
   */
  set(
    pageNumber: number,
    scale: number,
    texture: WebGLTexture,
    width: number,
    height: number
  ): TextureCacheEntry {
    const key = this.getCacheKey(pageNumber, scale);

    // Calculate memory usage (RGBA = 4 bytes per pixel)
    const memoryBytes = width * height * 4;

    // Check if we need to evict entries to make room
    while (
      this.currentMemoryBytes + memoryBytes >
      this.options.maxMemoryBytes
    ) {
      if (!this.evictLRU()) {
        // Can't evict any more entries (all in use or empty cache)
        break;
      }
    }

    // Remove existing entry for this key if it exists
    const existing = this.cache.get(key);
    if (existing) {
      this.contextManager.deleteTexture(existing.texture);
      this.currentMemoryBytes -= existing.memoryBytes;
    }

    // Create new entry
    const entry: TextureCacheEntry = {
      texture,
      pageNumber,
      width,
      height,
      scale,
      memoryBytes,
      lastAccessed: Date.now(),
      inUse: false,
    };

    this.cache.set(key, entry);
    this.currentMemoryBytes += memoryBytes;

    return entry;
  }

  /**
   * Mark a texture as in use (prevents eviction)
   */
  markInUse(pageNumber: number, scale: number, inUse: boolean): void {
    const key = this.getCacheKey(pageNumber, scale);
    const entry = this.cache.get(key);
    if (entry) {
      entry.inUse = inUse;
      if (inUse) {
        entry.lastAccessed = Date.now();
      }
    }
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): boolean {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find the oldest entry that is not in use
    for (const [key, entry] of this.cache) {
      if (!entry.inUse && entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.remove(oldestKey);
      return true;
    }

    return false;
  }

  /**
   * Remove an entry from the cache
   */
  private remove(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.contextManager.deleteTexture(entry.texture);
      this.currentMemoryBytes -= entry.memoryBytes;
      this.cache.delete(key);
    }
  }

  /**
   * Remove all textures for a specific page
   */
  removePage(pageNumber: number): void {
    const keysToRemove: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`page_${pageNumber}_`)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.remove(key);
    }
  }

  /**
   * Preload pages around the visible area
   */
  async preloadPages(
    visiblePageNumbers: number[],
    renderPage: (
      pageNumber: number,
      scale: number
    ) => Promise<ImageData | null>,
    scale: number
  ): Promise<void> {
    const { preloadBuffer, halfResolutionPreload } = this.options;

    // Determine pages to preload
    const minPage = Math.min(...visiblePageNumbers);
    const maxPage = Math.max(...visiblePageNumbers);

    const pagesToPreload: number[] = [];
    for (let i = 1; i <= preloadBuffer; i++) {
      if (minPage - i >= 1) {
        pagesToPreload.push(minPage - i);
      }
      pagesToPreload.push(maxPage + i);
    }

    // Use half resolution for preloaded pages if enabled
    const preloadScale = halfResolutionPreload ? scale * 0.5 : scale;

    // Preload in the background
    for (const pageNumber of pagesToPreload) {
      if (!this.has(pageNumber, preloadScale)) {
        try {
          const imageData = await renderPage(pageNumber, preloadScale);
          if (imageData) {
            const texture = this.contextManager.createTexture(imageData);
            if (texture) {
              this.set(
                pageNumber,
                preloadScale,
                texture,
                imageData.width,
                imageData.height
              );
            }
          }
        } catch {
          // Silently ignore preload failures
        }
      }
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const cachedPages = Array.from(this.cache.values()).map(
      (e) => e.pageNumber
    );
    const uniquePages = [...new Set(cachedPages)];
    const totalRequests = this.cacheHits + this.cacheMisses;

    return {
      cacheMemoryBytes: this.currentMemoryBytes,
      textureCount: this.cache.size,
      cachedPages: uniquePages,
      estimatedVRAM: null, // This is set by the store
      cacheHitRate: totalRequests > 0 ? this.cacheHits / totalRequests : 0,
    };
  }

  /**
   * Update cache options
   */
  updateOptions(options: Partial<TextureCacheOptions>): void {
    this.options = { ...this.options, ...options };

    // If memory limit decreased, evict entries
    while (this.currentMemoryBytes > this.options.maxMemoryBytes) {
      if (!this.evictLRU()) break;
    }
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      this.contextManager.deleteTexture(entry.texture);
    }
    this.cache.clear();
    this.currentMemoryBytes = 0;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): { used: number; max: number; percentage: number } {
    return {
      used: this.currentMemoryBytes,
      max: this.options.maxMemoryBytes,
      percentage: (this.currentMemoryBytes / this.options.maxMemoryBytes) * 100,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

/**
 * Create a texture cache
 */
export function createTextureCache(
  contextManager: WebGLContextManager,
  options?: Partial<TextureCacheOptions>
): TextureCache {
  return new TextureCache(contextManager, options);
}
