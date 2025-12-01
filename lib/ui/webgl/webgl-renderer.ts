/**
 * WebGL Renderer - High-performance PDF page rendering
 *
 * Handles WebGL-based rendering of PDF pages with support for:
 * - GPU-accelerated rendering
 * - Smooth zoom and pan animations
 * - Page transitions
 * - Filters (dark mode, sepia)
 * - Automatic fallback to Canvas 2D
 */

import type {
  FilterType,
  AnimationFrame,
  TransitionState,
  TransitionType,
} from "./types";
import { QUAD_VERTICES } from "./types";
import { WebGLContextManager } from "./webgl-context";
import { TextureCache } from "./texture-cache";
import {
  PAGE_VERTEX_SHADER,
  PAGE_FILTER_FRAGMENT_SHADER,
  TRANSITION_VERTEX_SHADER,
  TRANSITION_FRAGMENT_SHADER,
  SHADER_ATTRIBUTES,
  SHADER_UNIFORMS,
} from "./shaders";

/** Filter type to shader uniform value mapping */
const FILTER_TYPE_MAP: Record<FilterType, number> = {
  none: 0,
  dark: 1,
  sepia: 2,
  invert: 3,
};

/** Transition type to shader uniform value mapping */
const TRANSITION_TYPE_MAP: Record<TransitionType, number> = {
  none: 0,
  fade: 1,
  slide: 2,
  zoom: 3,
};

/**
 * Easing functions for animations
 */
const EASING = {
  linear: (t: number) => t,
  "ease-out": (t: number) => 1 - Math.pow(1 - t, 2),
  "ease-in-out": (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  "ease-out-cubic": (t: number) => 1 - Math.pow(1 - t, 3),
};

/**
 * WebGL Renderer Class
 */
export class WebGLRenderer {
  private contextManager: WebGLContextManager;
  private textureCache: TextureCache;
  private canvas: HTMLCanvasElement | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private currentAnimation: AnimationFrame | null = null;
  private currentTransition: TransitionState | null = null;
  private animationFrameId: number | null = null;
  private isInitialized = false;

  constructor(contextManager: WebGLContextManager, textureCache: TextureCache) {
    this.contextManager = contextManager;
    this.textureCache = textureCache;
  }

  /**
   * Initialize the renderer
   */
  async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    this.canvas = canvas;

    // Initialize WebGL context
    const state = await this.contextManager.initialize(canvas, {
      onContextLost: () => this.handleContextLost(),
      onContextRestored: () => this.handleContextRestored(),
      onFallback: () => this.handleFallback(),
    });

    if (!state.isAvailable) {
      return false;
    }

    // Create shader programs
    if (!this.createShaderPrograms()) {
      return false;
    }

    // Create vertex buffer
    if (!this.createVertexBuffer()) {
      return false;
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Create shader programs
   */
  private createShaderPrograms(): boolean {
    // Create page rendering program
    const pageProgram = this.contextManager.createProgram(
      "page",
      PAGE_VERTEX_SHADER,
      PAGE_FILTER_FRAGMENT_SHADER,
      [SHADER_ATTRIBUTES.position, SHADER_ATTRIBUTES.texCoord],
      [
        SHADER_UNIFORMS.transform,
        SHADER_UNIFORMS.texture,
        SHADER_UNIFORMS.opacity,
        SHADER_UNIFORMS.filterType,
        SHADER_UNIFORMS.filterStrength,
      ]
    );

    if (!pageProgram) {
      console.error("Failed to create page shader program");
      return false;
    }

    // Create transition program
    const transitionProgram = this.contextManager.createProgram(
      "transition",
      TRANSITION_VERTEX_SHADER,
      TRANSITION_FRAGMENT_SHADER,
      [SHADER_ATTRIBUTES.position, SHADER_ATTRIBUTES.texCoord],
      [
        SHADER_UNIFORMS.transform,
        SHADER_UNIFORMS.texture,
        SHADER_UNIFORMS.progress,
        SHADER_UNIFORMS.transitionType,
        SHADER_UNIFORMS.slideDirection,
      ]
    );

    if (!transitionProgram) {
      console.error("Failed to create transition shader program");
      return false;
    }

    return true;
  }

  /**
   * Create vertex buffer for quad rendering
   */
  private createVertexBuffer(): boolean {
    const gl = this.contextManager.getContext();
    if (!gl) return false;

    this.vertexBuffer = gl.createBuffer();
    if (!this.vertexBuffer) return false;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);

    return true;
  }

  /**
   * Render a page
   */
  renderPage(
    texture: WebGLTexture,
    width: number,
    height: number,
    options: {
      filter?: FilterType;
      filterStrength?: number;
      opacity?: number;
      rotation?: number;
    } = {}
  ): void {
    const gl = this.contextManager.getContext();
    if (!gl || !this.canvas || !this.vertexBuffer) return;

    const {
      filter = "none",
      filterStrength = 1.0,
      opacity = 1.0,
      rotation = 0,
    } = options;

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Set viewport
    gl.viewport(0, 0, width, height);

    // Clear
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Get page program
    const program = this.contextManager.getProgram("page");
    if (!program) return;

    gl.useProgram(program.program);

    // Set up vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    // Position attribute
    const positionLoc = program.attributes[SHADER_ATTRIBUTES.position];
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

    // TexCoord attribute
    const texCoordLoc = program.attributes[SHADER_ATTRIBUTES.texCoord];
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

    // Set uniforms
    const transformMatrix = this.createTransformMatrix(rotation);
    gl.uniformMatrix3fv(
      program.uniforms[SHADER_UNIFORMS.transform],
      false,
      transformMatrix
    );
    gl.uniform1f(program.uniforms[SHADER_UNIFORMS.opacity], opacity);
    gl.uniform1i(
      program.uniforms[SHADER_UNIFORMS.filterType],
      FILTER_TYPE_MAP[filter]
    );
    gl.uniform1f(
      program.uniforms[SHADER_UNIFORMS.filterStrength],
      filterStrength
    );

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.uniforms[SHADER_UNIFORMS.texture], 0);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Clean up
    gl.disableVertexAttribArray(positionLoc);
    gl.disableVertexAttribArray(texCoordLoc);
  }

  /**
   * Render a page transition
   */
  renderTransition(
    fromTexture: WebGLTexture | null,
    toTexture: WebGLTexture,
    width: number,
    height: number,
    progress: number,
    transitionType: TransitionType,
    direction: number = 1
  ): void {
    const gl = this.contextManager.getContext();
    if (!gl || !this.canvas || !this.vertexBuffer) return;

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Set viewport
    gl.viewport(0, 0, width, height);

    // Clear
    gl.clear(gl.COLOR_BUFFER_BIT);

    const program = this.contextManager.getProgram("transition");
    if (!program) return;

    gl.useProgram(program.program);

    // Set up vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    const positionLoc = program.attributes[SHADER_ATTRIBUTES.position];
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

    const texCoordLoc = program.attributes[SHADER_ATTRIBUTES.texCoord];
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

    const transformMatrix = this.createTransformMatrix(0);
    gl.uniformMatrix3fv(
      program.uniforms[SHADER_UNIFORMS.transform],
      false,
      transformMatrix
    );
    gl.uniform1i(
      program.uniforms[SHADER_UNIFORMS.transitionType],
      TRANSITION_TYPE_MAP[transitionType]
    );
    gl.uniform1f(program.uniforms[SHADER_UNIFORMS.slideDirection], direction);

    // Draw outgoing page (if exists and not fade-only)
    if (fromTexture && transitionType !== "fade") {
      gl.uniform1f(program.uniforms[SHADER_UNIFORMS.progress], 1 - progress);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fromTexture);
      gl.uniform1i(program.uniforms[SHADER_UNIFORMS.texture], 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Draw incoming page
    gl.uniform1f(program.uniforms[SHADER_UNIFORMS.progress], progress);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, toTexture);
    gl.uniform1i(program.uniforms[SHADER_UNIFORMS.texture], 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Clean up
    gl.disableVertexAttribArray(positionLoc);
    gl.disableVertexAttribArray(texCoordLoc);
  }

  /**
   * Start a transition animation
   */
  startTransition(
    fromPage: number | null,
    toPage: number,
    transitionType: TransitionType,
    duration: number,
    onComplete?: () => void
  ): void {
    // Cancel existing animation
    this.cancelAnimation();

    this.currentTransition = {
      type: transitionType,
      fromPage,
      toPage,
      animation: {
        progress: 0,
        startTime: performance.now(),
        duration,
        easing: "ease-out-cubic",
        isComplete: false,
      },
    };

    this.runTransitionAnimation(onComplete);
  }

  /**
   * Run transition animation loop
   */
  private runTransitionAnimation(onComplete?: () => void): void {
    const animate = () => {
      if (!this.currentTransition?.animation) return;

      const { animation } = this.currentTransition;
      const elapsed = performance.now() - animation.startTime;
      const rawProgress = Math.min(elapsed / animation.duration, 1);
      const easedProgress = EASING[animation.easing](rawProgress);

      animation.progress = easedProgress;
      animation.isComplete = rawProgress >= 1;

      if (animation.isComplete) {
        this.currentTransition = null;
        onComplete?.();
      } else {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Start a zoom animation
   */
  startZoomAnimation(
    fromScale: number,
    toScale: number,
    focalPoint: { x: number; y: number },
    duration: number,
    onProgress?: (progress: number, currentScale: number) => void,
    onComplete?: () => void
  ): void {
    // Cancel existing animation
    this.cancelAnimation();

    this.currentAnimation = {
      progress: 0,
      startTime: performance.now(),
      duration,
      easing: "ease-out-cubic",
      isComplete: false,
    };

    const animate = () => {
      if (!this.currentAnimation) return;

      const elapsed = performance.now() - this.currentAnimation.startTime;
      const rawProgress = Math.min(elapsed / this.currentAnimation.duration, 1);
      const easedProgress = EASING[this.currentAnimation.easing](rawProgress);

      this.currentAnimation.progress = easedProgress;
      this.currentAnimation.isComplete = rawProgress >= 1;

      const currentScale = fromScale + (toScale - fromScale) * easedProgress;
      onProgress?.(easedProgress, currentScale);

      if (this.currentAnimation.isComplete) {
        this.currentAnimation = null;
        onComplete?.();
      } else {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Cancel any running animation
   */
  cancelAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.currentAnimation = null;
    this.currentTransition = null;
  }

  /**
   * Create a transformation matrix for rotation
   */
  private createTransformMatrix(rotation: number): Float32Array {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Column-major 3x3 matrix
    return new Float32Array([cos, sin, 0, -sin, cos, 0, 0, 0, 1]);
  }

  /**
   * Handle context lost
   */
  private handleContextLost(): void {
    this.cancelAnimation();
    this.textureCache.clear();
    this.vertexBuffer = null;
    this.isInitialized = false;
  }

  /**
   * Handle context restored
   */
  private handleContextRestored(): void {
    // Re-create shader programs
    this.createShaderPrograms();
    // Re-create vertex buffer
    this.createVertexBuffer();
    this.isInitialized = true;
  }

  /**
   * Handle fallback to Canvas 2D
   */
  private handleFallback(): void {
    this.dispose();
  }

  /**
   * Check if renderer is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.contextManager.getContext() !== null;
  }

  /**
   * Get current transition state
   */
  getTransitionState(): TransitionState | null {
    return this.currentTransition;
  }

  /**
   * Get current animation state
   */
  getAnimationState(): AnimationFrame | null {
    return this.currentAnimation;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.cancelAnimation();
    this.textureCache.clear();

    const gl = this.contextManager.getContext();
    if (gl && this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
    }

    this.vertexBuffer = null;
    this.canvas = null;
    this.isInitialized = false;

    this.contextManager.dispose();
  }
}

/**
 * Create a WebGL renderer
 */
export function createWebGLRenderer(
  contextManager: WebGLContextManager,
  textureCache: TextureCache
): WebGLRenderer {
  return new WebGLRenderer(contextManager, textureCache);
}
