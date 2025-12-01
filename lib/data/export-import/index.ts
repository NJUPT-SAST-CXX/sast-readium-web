/**
 * Export/Import Module - Data export and import functionality
 *
 * This module provides comprehensive data export and import functionality
 * for SAST Readium, including:
 * - PDF annotations and bookmarks
 * - AI memories (document-specific and global)
 * - AI plans
 * - Conversation history (optional)
 *
 * Usage:
 * ```typescript
 * import { downloadExport, importFromFile, validateExportData } from '@/lib/export-import';
 *
 * // Export all data
 * downloadExport({ scopes: ['all'] });
 *
 * // Export only annotations
 * downloadExport({ scopes: ['annotations'] });
 *
 * // Import from file
 * const result = await importFromFile(file, { conflictStrategy: 'merge' });
 * if (result.success) {
 *   console.log(`Imported ${result.imported.annotations} annotations`);
 * }
 * ```
 */

// Types
export * from "./types";

// Export functions
export {
  createExportData,
  exportToJSON,
  downloadExport,
  exportAnnotationsLegacy,
  exportMemories,
  downloadMemories,
  // Native export functions (Tauri)
  downloadExportNative,
  autoSaveExport,
  exportScopeNative,
  exportAnnotationsNative,
  exportBookmarksNative,
  exportMemoriesNative,
  exportFlashcardsNative,
  exportQuizzesNative,
  exportPresentationsNative,
} from "./export-service";

// Import functions
export {
  validateExportData,
  parseImportData,
  importData,
  importFromJSON,
  importFromFile,
  importAnnotationsLegacy,
  importMemoriesFromJSON,
  // Native import functions (Tauri)
  importFromDialogNative,
  importFromPathNative,
  getRecentExports,
  previewImportNative,
  type NativeImportExtendedResult,
} from "./import-service";
