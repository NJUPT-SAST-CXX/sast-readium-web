/**
 * Page Rendering Shaders
 *
 * GLSL shaders for rendering PDF pages with WebGL
 */

/**
 * Vertex shader for page rendering
 * Handles position transformation and texture coordinate passing
 */
export const PAGE_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform mat3 u_transform;

varying vec2 v_texCoord;

void main() {
  // Apply transformation matrix
  vec3 position = u_transform * vec3(a_position, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);

  // Pass texture coordinates to fragment shader
  v_texCoord = a_texCoord;
}
`;

/**
 * Fragment shader for basic page rendering
 * Renders the page texture with optional opacity
 */
export const PAGE_FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_opacity;

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  gl_FragColor = vec4(color.rgb, color.a * u_opacity);
}
`;

/**
 * Fragment shader with filter support
 * Supports dark mode, sepia, and invert filters
 */
export const PAGE_FILTER_FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_opacity;
uniform int u_filterType; // 0 = none, 1 = dark, 2 = sepia, 3 = invert
uniform float u_filterStrength;

varying vec2 v_texCoord;

// Convert RGB to luminance
float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// Apply dark mode filter
vec3 darkModeFilter(vec3 color) {
  // Invert colors and reduce brightness
  vec3 inverted = vec3(1.0) - color;
  float lum = luminance(inverted);
  // Slightly reduce contrast and add blue tint for better readability
  return mix(inverted, vec3(lum * 0.9, lum * 0.92, lum * 0.98), 0.15);
}

// Apply sepia filter
vec3 sepiaFilter(vec3 color) {
  vec3 sepia;
  sepia.r = dot(color, vec3(0.393, 0.769, 0.189));
  sepia.g = dot(color, vec3(0.349, 0.686, 0.168));
  sepia.b = dot(color, vec3(0.272, 0.534, 0.131));
  return sepia;
}

// Apply invert filter
vec3 invertFilter(vec3 color) {
  return vec3(1.0) - color;
}

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  vec3 rgb = color.rgb;

  // Apply filter based on type
  if (u_filterType == 1) {
    rgb = mix(rgb, darkModeFilter(rgb), u_filterStrength);
  } else if (u_filterType == 2) {
    rgb = mix(rgb, sepiaFilter(rgb), u_filterStrength);
  } else if (u_filterType == 3) {
    rgb = mix(rgb, invertFilter(rgb), u_filterStrength);
  }

  gl_FragColor = vec4(rgb, color.a * u_opacity);
}
`;

/**
 * Vertex shader for page transitions
 * Supports slide and zoom effects
 */
export const TRANSITION_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform mat3 u_transform;
uniform float u_progress;
uniform int u_transitionType; // 0 = none, 1 = fade, 2 = slide, 3 = zoom
uniform float u_slideDirection; // -1 = left/up, 1 = right/down

varying vec2 v_texCoord;

void main() {
  vec2 position = a_position;

  // Apply transition effect
  if (u_transitionType == 2) {
    // Slide transition
    position.x += u_slideDirection * (1.0 - u_progress) * 2.0;
  } else if (u_transitionType == 3) {
    // Zoom transition
    float scale = 1.0 + (1.0 - u_progress) * 0.1;
    position *= scale;
  }

  vec3 transformed = u_transform * vec3(position, 1.0);
  gl_Position = vec4(transformed.xy, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

/**
 * Fragment shader for page transitions
 * Handles fade effect and combines with other transitions
 */
export const TRANSITION_FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_progress;
uniform int u_transitionType; // 0 = none, 1 = fade, 2 = slide, 3 = zoom

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);

  // Apply fade effect
  float alpha = color.a;
  if (u_transitionType == 1 || u_transitionType == 3) {
    // Fade or zoom transition includes fade
    alpha *= u_progress;
  }

  gl_FragColor = vec4(color.rgb, alpha);
}
`;

/**
 * Vertex shader for smooth zoom animation
 * Handles animated scaling from a focal point
 */
export const ZOOM_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform mat3 u_transform;
uniform vec2 u_focalPoint;
uniform float u_currentScale;
uniform float u_targetScale;
uniform float u_progress;

varying vec2 v_texCoord;

float easeOutCubic(float t) {
  return 1.0 - pow(1.0 - t, 3.0);
}

void main() {
  // Interpolate scale with easing
  float t = easeOutCubic(u_progress);
  float scale = mix(u_currentScale, u_targetScale, t);

  // Scale from focal point
  vec2 position = a_position;
  position = (position - u_focalPoint) * (scale / u_currentScale) + u_focalPoint;

  vec3 transformed = u_transform * vec3(position, 1.0);
  gl_Position = vec4(transformed.xy, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

/**
 * Fragment shader for zoom animation
 */
export const ZOOM_FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;

void main() {
  gl_FragColor = texture2D(u_texture, v_texCoord);
}
`;

/**
 * Shader attribute names
 */
export const SHADER_ATTRIBUTES = {
  position: "a_position",
  texCoord: "a_texCoord",
};

/**
 * Shader uniform names
 */
export const SHADER_UNIFORMS = {
  transform: "u_transform",
  texture: "u_texture",
  opacity: "u_opacity",
  filterType: "u_filterType",
  filterStrength: "u_filterStrength",
  progress: "u_progress",
  transitionType: "u_transitionType",
  slideDirection: "u_slideDirection",
  focalPoint: "u_focalPoint",
  currentScale: "u_currentScale",
  targetScale: "u_targetScale",
};
