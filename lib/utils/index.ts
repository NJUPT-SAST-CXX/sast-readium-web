/**
 * Utils Module - General utility functions
 *
 * This module provides:
 * - Tailwind CSS class merging (cn)
 * - Archive file processing
 * - Document type detection
 */

// Core utilities
export { cn } from "./utils";

// Archive utilities
export { processArchive, type ArchiveFile } from "./archive-utils";

// Document utilities
export {
  getDocumentType,
  isPDF,
  isMarkdown,
  isSupportedDocument,
  getAcceptString,
  getDocumentTypeName,
  readMarkdownContent,
  type DocumentType,
} from "./document-utils";
