/**
 * WebGL Capabilities Detection
 *
 * Detects WebGL support level and hardware capabilities
 */

import type { WebGLCapabilities, WebGLVersion } from "./types";

/** Cached capabilities result */
let cachedCapabilities: WebGLCapabilities | null = null;

/**
 * Detect WebGL capabilities of the current browser/device
 */
export function detectWebGLCapabilities(): WebGLCapabilities {
  // Return cached result if available
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  // Create test canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  // Try WebGL 2 first
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let version: WebGLVersion = "none";

  try {
    gl = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: true,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null;

    if (gl) {
      version = "webgl2";
    }
  } catch {
    // WebGL 2 not available
  }

  // Fall back to WebGL 1
  if (!gl) {
    try {
      gl = canvas.getContext("webgl", {
        failIfMajorPerformanceCaveat: true,
        powerPreference: "high-performance",
      }) as WebGLRenderingContext | null;

      if (gl) {
        version = "webgl1";
      }
    } catch {
      // WebGL 1 not available
    }
  }

  // Try without performance caveat check as last resort
  if (!gl) {
    try {
      gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
      if (gl) version = "webgl2";
    } catch {
      // Ignore
    }
  }

  if (!gl) {
    try {
      gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
      if (gl) version = "webgl1";
    } catch {
      // Ignore
    }
  }

  // No WebGL support
  if (!gl) {
    cachedCapabilities = {
      version: "none",
      maxTextureSize: 0,
      maxTextureUnits: 0,
      floatTexturesSupported: false,
      floatLinearFilteringSupported: false,
      estimatedVRAM: null,
      contextLossRecoverySupported: false,
      vendor: "",
      renderer: "",
      extensions: [],
    };
    return cachedCapabilities;
  }

  // Gather capabilities
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number;

  // Check for float texture support
  let floatTexturesSupported = false;
  let floatLinearFilteringSupported = false;

  if (version === "webgl2") {
    floatTexturesSupported = true;
    const extLinear = gl.getExtension("OES_texture_float_linear");
    floatLinearFilteringSupported = !!extLinear;
  } else {
    const extFloat = gl.getExtension("OES_texture_float");
    floatTexturesSupported = !!extFloat;
    if (floatTexturesSupported) {
      const extLinear = gl.getExtension("OES_texture_float_linear");
      floatLinearFilteringSupported = !!extLinear;
    }
  }

  // Get GPU info
  let vendor = "Unknown";
  let renderer = "Unknown";

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string;
    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
  }

  // Estimate VRAM (very rough, based on renderer string)
  const estimatedVRAM = estimateVRAM(renderer);

  // Get available extensions
  const extensions = gl.getSupportedExtensions() || [];

  // Check context loss recovery support
  const contextLossRecoverySupported =
    extensions.includes("WEBGL_lose_context");

  // Clean up
  const loseContext = gl.getExtension("WEBGL_lose_context");
  if (loseContext) {
    loseContext.loseContext();
  }

  cachedCapabilities = {
    version,
    maxTextureSize,
    maxTextureUnits,
    floatTexturesSupported,
    floatLinearFilteringSupported,
    estimatedVRAM,
    contextLossRecoverySupported,
    vendor,
    renderer,
    extensions,
  };

  return cachedCapabilities;
}

/**
 * Estimate VRAM based on GPU renderer string
 * This is a rough heuristic and not accurate
 */
function estimateVRAM(renderer: string): number | null {
  const lowerRenderer = renderer.toLowerCase();

  // Known integrated GPUs (usually share system RAM)
  if (
    lowerRenderer.includes("intel") ||
    lowerRenderer.includes("integrated") ||
    lowerRenderer.includes("adreno") ||
    lowerRenderer.includes("mali") ||
    lowerRenderer.includes("powervr")
  ) {
    return 512; // Assume 512MB for integrated
  }

  // NVIDIA GPUs
  if (lowerRenderer.includes("nvidia") || lowerRenderer.includes("geforce")) {
    // Try to extract model number
    const match = lowerRenderer.match(/(\d{3,4})/);
    if (match) {
      const model = parseInt(match[1], 10);
      if (model >= 4000) return 16384; // RTX 40 series
      if (model >= 3000) return 12288; // RTX 30 series
      if (model >= 2000) return 8192; // RTX 20 series
      if (model >= 1000) return 8192; // GTX 10 series
      return 4096;
    }
    return 4096;
  }

  // AMD GPUs
  if (
    lowerRenderer.includes("amd") ||
    lowerRenderer.includes("radeon") ||
    lowerRenderer.includes("rx ")
  ) {
    const match = lowerRenderer.match(/rx\s*(\d{4})/i);
    if (match) {
      const model = parseInt(match[1], 10);
      if (model >= 7000) return 16384; // RX 7000 series
      if (model >= 6000) return 12288; // RX 6000 series
      if (model >= 5000) return 8192; // RX 5000 series
      return 8192;
    }
    return 4096;
  }

  // Apple Silicon
  if (
    lowerRenderer.includes("apple") ||
    lowerRenderer.includes("m1") ||
    lowerRenderer.includes("m2") ||
    lowerRenderer.includes("m3")
  ) {
    return 8192; // Shared memory, but generous
  }

  return null; // Unknown
}

/**
 * Check if WebGL should be used based on capabilities
 */
export function shouldUseWebGL(capabilities: WebGLCapabilities): boolean {
  // No WebGL support
  if (capabilities.version === "none") {
    return false;
  }

  // Check minimum texture size (need at least 4096 for most PDFs)
  if (capabilities.maxTextureSize < 4096) {
    return false;
  }

  // Prefer WebGL 2, but WebGL 1 is also acceptable
  return true;
}

/**
 * Get recommended settings based on capabilities
 */
export function getRecommendedSettings(capabilities: WebGLCapabilities): {
  maxCacheMemoryMB: number;
  preloadPages: number;
  maxDevicePixelRatio: number;
} {
  const vram = capabilities.estimatedVRAM || 512;

  // Adjust cache size based on available VRAM
  let maxCacheMemoryMB: number;
  if (vram >= 8192) {
    maxCacheMemoryMB = 1024;
  } else if (vram >= 4096) {
    maxCacheMemoryMB = 512;
  } else if (vram >= 2048) {
    maxCacheMemoryMB = 256;
  } else {
    maxCacheMemoryMB = 128;
  }

  // Adjust preload pages based on cache size
  const preloadPages = maxCacheMemoryMB >= 512 ? 3 : 2;

  // Adjust DPI based on GPU capabilities
  let maxDevicePixelRatio: number;
  if (capabilities.version === "webgl2" && vram >= 4096) {
    maxDevicePixelRatio = 2;
  } else if (capabilities.version === "webgl2") {
    maxDevicePixelRatio = 1.5;
  } else {
    maxDevicePixelRatio = 1;
  }

  return {
    maxCacheMemoryMB,
    preloadPages,
    maxDevicePixelRatio,
  };
}

/**
 * Clear cached capabilities (useful for testing)
 */
export function clearCapabilitiesCache(): void {
  cachedCapabilities = null;
}
