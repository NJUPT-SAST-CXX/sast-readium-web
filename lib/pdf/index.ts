/**
 * PDF Module - PDF viewer state management and utilities
 *
 * This module provides:
 * - PDF state management (Zustand store)
 * - PDF loading and rendering utilities
 * - Search functionality
 * - Annotation management
 * - Metadata handling
 */

// PDF Store
export {
  usePDFStore,
  type PDFMetadata,
  type RecentFile,
  type SearchResult,
  type AnnotationMetadata,
  type Annotation,
  type AnnotationHistory,
  type Bookmark,
  type PDFOutlineNode,
  type ViewMode,
  type FitMode,
  type AnnotationStamp,
} from "./pdf-store";

// PDF Utilities
export {
  loadPDFDocument,
  unloadPDFDocument,
  searchInPDF,
  downloadPDF,
  printPDF,
  savePDF,
  updatePDFMetadata,
  type PDFDocumentProxy,
  type PDFPageProxy,
  type PDFPageViewport,
  type PDFRenderTask,
  type TextContent,
  type TextItem,
  type PDFAnnotationData,
  type PDFMetadataUpdate,
} from "./pdf-utils";

// Re-export PDFOutlineNode from pdf-utils for backward compatibility
export type { PDFOutlineNode as PDFOutlineNodeUtils } from "./pdf-utils";
