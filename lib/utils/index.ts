/**
 * Utils Module - General utility functions
 *
 * This module provides:
 * - Tailwind CSS class merging (cn)
 * - Archive file processing
 * - Document type detection
 * - Markdown processing utilities
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

// Markdown utilities
export {
  // Core parsing
  slugify,
  extractHeadings,
  parseAdmonitions,
  processKeyboardShortcuts,
  getContentStats,
  searchInContent,
  validateMarkdown,
  normalizeLineEndings,
  ADMONITION_TYPES,
  // Text formatting
  wrapTextWithMarkers,
  insertTextAtCursor,
  toggleLinePrefix,
  // Markdown generation
  generateMarkdownTable,
  generateCodeBlock,
  generateMarkdownLink,
  generateMarkdownImage,
  // Content extraction
  extractPlainText,
  getCurrentLine,
  isInsideCodeBlock,
  // Types
  type TOCItem,
  type ParsedAdmonition,
  type AdmonitionParseResult,
  type ContentStats,
  type SearchResult,
  type ValidationIssue,
} from "./markdown-utils";
