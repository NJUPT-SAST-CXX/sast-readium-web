/**
 * WebGL Context Manager
 *
 * Manages WebGL context lifecycle including:
 * - Context creation and initialization
 * - Context loss detection and recovery
 * - Graceful fallback to Canvas 2D
 */

import type { WebGLContextState, WebGLVersion, ShaderProgram } from "./types";
import { detectWebGLCapabilities } from "./webgl-capabilities";

/** Maximum time to wait for context recovery (ms) */
const CONTEXT_RECOVERY_TIMEOUT = 5000;

/** Maximum context loss count before permanent fallback */
const MAX_CONTEXT_LOSSES = 3;

/**
 * WebGL Context Manager Class
 */
export class WebGLContextManager {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private version: WebGLVersion = "none";
  private isContextLost = false;
  private contextLossCount = 0;
  private lastContextLoss: number | null = null;
  private recoveryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private programs: Map<string, ShaderProgram> = new Map();
  private onContextLost?: () => void;
  private onContextRestored?: () => void;
  private onFallback?: () => void;

  /**
   * Initialize WebGL context
   */
  async initialize(
    canvas: HTMLCanvasElement,
    options?: {
      onContextLost?: () => void;
      onContextRestored?: () => void;
      onFallback?: () => void;
    }
  ): Promise<WebGLContextState> {
    this.canvas = canvas;
    this.onContextLost = options?.onContextLost;
    this.onContextRestored = options?.onContextRestored;
    this.onFallback = options?.onFallback;

    // Detect capabilities
    const capabilities = detectWebGLCapabilities();

    if (capabilities.version === "none") {
      return this.createFallbackState("WebGL is not supported");
    }

    // Try to create context
    const contextOptions: WebGLContextAttributes = {
      alpha: true,
      antialias: false, // We handle our own anti-aliasing
      depth: false, // Not needed for 2D rendering
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
    };

    try {
      // Try WebGL 2 first
      if (capabilities.version === "webgl2") {
        this.gl = canvas.getContext(
          "webgl2",
          contextOptions
        ) as WebGL2RenderingContext | null;
        if (this.gl) {
          this.version = "webgl2";
        }
      }

      // Fall back to WebGL 1
      if (!this.gl) {
        this.gl = canvas.getContext(
          "webgl",
          contextOptions
        ) as WebGLRenderingContext | null;
        if (this.gl) {
          this.version = "webgl1";
        }
      }

      if (!this.gl) {
        return this.createFallbackState("Failed to create WebGL context");
      }

      // Set up context loss handlers
      canvas.addEventListener("webglcontextlost", this.handleContextLost);
      canvas.addEventListener(
        "webglcontextrestored",
        this.handleContextRestored
      );

      // Initialize WebGL state
      this.initializeGLState();

      return {
        isAvailable: true,
        version: this.version,
        isContextLost: false,
        isFallback: false,
        errorMessage: null,
        lastContextLoss: null,
        contextLossCount: 0,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating WebGL context";
      return this.createFallbackState(message);
    }
  }

  /**
   * Initialize WebGL state
   */
  private initializeGLState(): void {
    if (!this.gl) return;

    const gl = this.gl;

    // Set clear color (transparent)
    gl.clearColor(0, 0, 0, 0);

    // Enable blending for proper alpha handling
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Disable features we don't need
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.STENCIL_TEST);

    // Set pixel store settings
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  }

  /**
   * Handle WebGL context lost event
   */
  private handleContextLost = (event: Event): void => {
    event.preventDefault();

    this.isContextLost = true;
    this.contextLossCount++;
    this.lastContextLoss = Date.now();

    // Clear programs
    this.programs.clear();

    // Notify listener
    this.onContextLost?.();

    // Check if we should fall back permanently
    if (this.contextLossCount >= MAX_CONTEXT_LOSSES) {
      this.forceFallback("Too many context losses");
      return;
    }

    // Set recovery timeout
    this.recoveryTimeoutId = setTimeout(() => {
      if (this.isContextLost) {
        this.forceFallback("Context recovery timeout");
      }
    }, CONTEXT_RECOVERY_TIMEOUT);
  };

  /**
   * Handle WebGL context restored event
   */
  private handleContextRestored = (): void => {
    // Clear recovery timeout
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId);
      this.recoveryTimeoutId = null;
    }

    this.isContextLost = false;

    // Re-initialize GL state
    this.initializeGLState();

    // Notify listener
    this.onContextRestored?.();
  };

  /**
   * Force fallback to Canvas 2D
   */
  private forceFallback(reason: string): void {
    this.dispose();
    this.onFallback?.();
    console.warn(`WebGL fallback: ${reason}`);
  }

  /**
   * Create fallback state
   */
  private createFallbackState(errorMessage: string): WebGLContextState {
    return {
      isAvailable: false,
      version: "none",
      isContextLost: false,
      isFallback: true,
      errorMessage,
      lastContextLoss: null,
      contextLossCount: 0,
    };
  }

  /**
   * Get the WebGL context
   */
  getContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
    return this.isContextLost ? null : this.gl;
  }

  /**
   * Get WebGL version
   */
  getVersion(): WebGLVersion {
    return this.version;
  }

  /**
   * Check if WebGL 2 is available
   */
  isWebGL2(): boolean {
    return this.version === "webgl2";
  }

  /**
   * Get current context state
   */
  getState(): WebGLContextState {
    return {
      isAvailable: this.gl !== null && !this.isContextLost,
      version: this.version,
      isContextLost: this.isContextLost,
      isFallback: this.gl === null,
      errorMessage: null,
      lastContextLoss: this.lastContextLoss,
      contextLossCount: this.contextLossCount,
    };
  }

  /**
   * Compile and link a shader program
   */
  createProgram(
    name: string,
    vertexSource: string,
    fragmentSource: string,
    attributeNames: string[],
    uniformNames: string[]
  ): ShaderProgram | null {
    const gl = this.gl;
    if (!gl) return null;

    // Check if program already exists
    const existing = this.programs.get(name);
    if (existing) {
      return existing;
    }

    // Compile vertex shader
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    if (!vertexShader) return null;

    // Compile fragment shader
    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      fragmentSource
    );
    if (!fragmentShader) {
      gl.deleteShader(vertexShader);
      return null;
    }

    // Link program
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Clean up shaders (they're now part of the program)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // Check for link errors
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      console.error("Failed to link shader program:", info);
      gl.deleteProgram(program);
      return null;
    }

    // Get attribute locations
    const attributes: Record<string, number> = {};
    for (const attr of attributeNames) {
      attributes[attr] = gl.getAttribLocation(program, attr);
    }

    // Get uniform locations
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const uniform of uniformNames) {
      uniforms[uniform] = gl.getUniformLocation(program, uniform);
    }

    const shaderProgram: ShaderProgram = {
      program,
      attributes,
      uniforms,
    };

    this.programs.set(name, shaderProgram);
    return shaderProgram;
  }

  /**
   * Compile a shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;

    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      const typeStr = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
      console.error(`Failed to compile ${typeStr} shader:`, info);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Get a cached program
   */
  getProgram(name: string): ShaderProgram | null {
    return this.programs.get(name) || null;
  }

  /**
   * Create a texture from ImageData
   */
  createTexture(imageData: ImageData): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;

    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload texture data
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imageData
    );

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  }

  /**
   * Update an existing texture with new ImageData
   */
  updateTexture(texture: WebGLTexture, imageData: ImageData): void {
    const gl = this.gl;
    if (!gl) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imageData
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Delete a texture
   */
  deleteTexture(texture: WebGLTexture): void {
    this.gl?.deleteTexture(texture);
  }

  /**
   * Set viewport
   */
  setViewport(x: number, y: number, width: number, height: number): void {
    this.gl?.viewport(x, y, width, height);
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.gl?.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Clear recovery timeout
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId);
      this.recoveryTimeoutId = null;
    }

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener(
        "webglcontextlost",
        this.handleContextLost
      );
      this.canvas.removeEventListener(
        "webglcontextrestored",
        this.handleContextRestored
      );
    }

    // Delete all programs
    if (this.gl) {
      for (const program of this.programs.values()) {
        this.gl.deleteProgram(program.program);
      }
    }
    this.programs.clear();

    // Lose context intentionally (helps with memory cleanup)
    if (this.gl) {
      const loseContext = this.gl.getExtension("WEBGL_lose_context");
      if (loseContext) {
        loseContext.loseContext();
      }
    }

    this.gl = null;
    this.canvas = null;
    this.version = "none";
    this.isContextLost = false;
  }
}

/**
 * Create a WebGL context manager
 */
export function createWebGLContextManager(): WebGLContextManager {
  return new WebGLContextManager();
}
