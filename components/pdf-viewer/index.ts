/**
 * PDF Viewer Components - Public Exports
 *
 * This module exports all PDF viewer components organized by feature:
 * - Core: Main viewer, page, loading, watermark, TTS
 * - Annotations: Annotation layer, list, toolbar, color picker, stamps
 * - Dialogs: Settings, properties, password, shortcuts, signature, recent files
 * - Layers: Text, drawing, selection layers
 * - Navigation: Outline, bookmarks, thumbnails, tab bar, progress bar
 * - Toolbar: Main toolbar, mobile toolbar, menubar, context menu
 * - WebGL: WebGL rendering components
 */

// Core components
export { PDFViewer } from "./viewer";
export { PDFPage } from "./page";
export { PDFLoadingAnimation } from "./loading-animations";
export { PDFWatermark } from "./watermark";
export { PDFTTSReader } from "./tts-reader";
export { PresentationMode } from "./presentation";

// Annotations
export * from "./annotations";

// Dialogs
export * from "./dialogs";

// Layers
export * from "./layers";

// Navigation
export * from "./navigation";

// Toolbar
export * from "./toolbar";

// WebGL
export * from "./webgl";
