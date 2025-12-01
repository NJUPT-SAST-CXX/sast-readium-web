/**
 * Export Service - Handles data export functionality
 *
 * Supports both browser and Tauri desktop environments.
 * In Tauri, uses native file system for better performance and UX.
 */

import { usePDFStore, type Annotation, type Bookmark } from "@/lib/pdf";
import { useAIMemoryStore } from "@/lib/ai/memory";
import { useAIPlanStore } from "@/lib/ai/plan";
import { useFlashcardStore } from "@/lib/ai/learning/flashcard/flashcard-store";
import { useQuizStore } from "@/lib/ai/learning/quiz/quiz-store";
import { usePPTStore } from "@/lib/ai/learning/ppt/ppt-store";
import {
  isTauri,
  exportDataWithDialog,
  saveExportToAppData,
  type NativeExportResult,
} from "@/lib/platform";
import type { ExportData, ExportOptions, ExportScope } from "./types";
import { DEFAULT_EXPORT_OPTIONS } from "./types";

/**
 * Get current app version from package.json or fallback
 */
function getAppVersion(): string {
  // In browser context, we may not have direct access to package.json
  // Return a default version
  return "0.1.0";
}

/**
 * Collect annotations from the store
 */
function collectAnnotations(currentDocumentOnly: boolean): Annotation[] {
  const pdfStore = usePDFStore.getState();

  if (currentDocumentOnly) {
    return pdfStore.annotations;
  }

  // Collect from all document sessions
  const allAnnotations: Annotation[] = [...pdfStore.annotations];
  for (const doc of Object.values(pdfStore.documents)) {
    if (doc.annotations && doc.annotations.length > 0) {
      allAnnotations.push(...doc.annotations);
    }
  }

  // Remove duplicates by ID
  const uniqueMap = new Map(allAnnotations.map((a) => [a.id, a]));
  return Array.from(uniqueMap.values());
}

/**
 * Collect bookmarks from the store
 */
function collectBookmarks(currentDocumentOnly: boolean): Bookmark[] {
  const pdfStore = usePDFStore.getState();

  if (currentDocumentOnly) {
    return pdfStore.bookmarks;
  }

  // Collect from all document sessions
  const allBookmarks: Bookmark[] = [...pdfStore.bookmarks];
  for (const doc of Object.values(pdfStore.documents)) {
    if (doc.bookmarks && doc.bookmarks.length > 0) {
      allBookmarks.push(...doc.bookmarks);
    }
  }

  // Remove duplicates by ID
  const uniqueMap = new Map(allBookmarks.map((b) => [b.id, b]));
  return Array.from(uniqueMap.values());
}

/**
 * Collect AI memories from the store
 */
function collectMemories(currentDocumentOnly: boolean) {
  const memoryStore = useAIMemoryStore.getState();
  const pdfStore = usePDFStore.getState();

  if (currentDocumentOnly && pdfStore.pdfUrl) {
    // Only return document-specific memories for current PDF
    // We'd need the PDF hash here, but for simplicity we'll export all
    const documentHash = pdfStore.pdfUrl; // Simplified - should use actual hash
    return {
      document: memoryStore.documentMemories[documentHash] || [],
      global: [],
      preferences: [],
    };
  }

  return {
    document: Object.values(memoryStore.documentMemories).flat(),
    global: memoryStore.globalMemories,
    preferences: memoryStore.preferences,
  };
}

/**
 * Collect AI plans from the store
 */
function collectPlans() {
  const planStore = useAIPlanStore.getState();
  // Convert from Record<string, AIPlan> to AIPlan[]
  return Object.values(planStore.plans);
}

/**
 * Collect flashcard data from the store
 */
function collectFlashcards() {
  const flashcardStore = useFlashcardStore.getState();
  // Convert Record to arrays for export
  const decks = Object.values(flashcardStore.decks);
  // Cards are nested inside decks, so collect them all
  const cards = decks.flatMap((deck) => deck.cards);
  return {
    decks,
    cards,
    srsData: flashcardStore.srsData,
  };
}

/**
 * Collect quiz data from the store
 */
function collectQuizzes() {
  const quizStore = useQuizStore.getState();
  // Convert Record to arrays for export
  return {
    quizzes: Object.values(quizStore.quizzes),
    attempts: quizStore.attempts,
  };
}

/**
 * Collect presentation data from the store
 */
function collectPresentations() {
  const pptStore = usePPTStore.getState();
  // Convert Record to array for export
  return Object.values(pptStore.presentations);
}

/**
 * Check if a scope should be included
 */
function shouldIncludeScope(
  scopes: ExportScope[],
  scope: ExportScope
): boolean {
  return scopes.includes("all") || scopes.includes(scope);
}

/**
 * Create export data
 */
export function createExportData(
  options: Partial<ExportOptions> = {}
): ExportData {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const pdfStore = usePDFStore.getState();

  const exportData: ExportData = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    source: {
      app: "SAST Readium",
      version: getAppVersion(),
    },
  };

  // Add document info if exporting for current document
  if (opts.currentDocumentOnly && pdfStore.pdfUrl) {
    const currentPdf = pdfStore.currentPDF;
    exportData.documentInfo = {
      fileName: currentPdf?.name || "Unknown",
      pageCount: pdfStore.numPages,
    };
  }

  // Collect data based on scopes
  if (shouldIncludeScope(opts.scopes, "annotations")) {
    exportData.annotations = collectAnnotations(opts.currentDocumentOnly);
  }

  if (shouldIncludeScope(opts.scopes, "bookmarks")) {
    exportData.bookmarks = collectBookmarks(opts.currentDocumentOnly);
  }

  if (shouldIncludeScope(opts.scopes, "memories")) {
    exportData.memories = collectMemories(opts.currentDocumentOnly);
  }

  if (shouldIncludeScope(opts.scopes, "plans")) {
    exportData.plans = collectPlans();
  }

  // Conversations are optional and require explicit inclusion
  if (
    opts.includeConversations &&
    shouldIncludeScope(opts.scopes, "conversations")
  ) {
    // Note: Conversations would need to be collected from ai-chat-store
    // For now, we'll leave this empty as the conversation store structure may vary
    exportData.conversations = [];
  }

  // Learning data - Flashcards
  if (shouldIncludeScope(opts.scopes, "flashcards")) {
    exportData.flashcards = collectFlashcards();
  }

  // Learning data - Quizzes
  if (shouldIncludeScope(opts.scopes, "quizzes")) {
    exportData.quizzes = collectQuizzes();
  }

  // Learning data - Presentations
  if (shouldIncludeScope(opts.scopes, "presentations")) {
    exportData.presentations = collectPresentations();
  }

  return exportData;
}

/**
 * Export data to JSON string
 */
export function exportToJSON(options: Partial<ExportOptions> = {}): string {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const exportData = createExportData(opts);

  return opts.prettyPrint
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);
}

/**
 * Export data and trigger file download
 */
export function downloadExport(options: Partial<ExportOptions> = {}): void {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const jsonString = exportToJSON(opts);

  // Generate file name
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = opts.fileName || `sast-readium-export-${timestamp}.json`;

  // Create blob and download
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export annotations only (legacy format)
 */
export function exportAnnotationsLegacy(): string {
  const pdfStore = usePDFStore.getState();
  return pdfStore.exportAnnotations();
}

/**
 * Export AI memories
 */
export function exportMemories(): string {
  const memoryStore = useAIMemoryStore.getState();
  const exportData = memoryStore.exportMemories();
  return JSON.stringify(exportData, null, 2);
}

/**
 * Download memories as JSON file
 */
export function downloadMemories(): void {
  const jsonString = exportMemories();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `sast-readium-memories-${timestamp}.json`;

  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Native Export Functions (Tauri Desktop)
// ============================================================================

/**
 * Export data using native file dialog (Tauri only)
 * Falls back to browser download if not in Tauri
 */
export async function downloadExportNative(
  options: Partial<ExportOptions> = {}
): Promise<NativeExportResult> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const jsonString = exportToJSON(opts);

  // Generate file name
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = opts.fileName || `sast-readium-export-${timestamp}.json`;

  // Try native export first
  if (isTauri()) {
    return exportDataWithDialog(jsonString, fileName, opts.prettyPrint);
  }

  // Fallback to browser download
  downloadExport(options);
  return {
    success: true,
    filePath: null,
    bytesWritten: jsonString.length,
    error: null,
  };
}

/**
 * Auto-save export to app data directory (Tauri only)
 * Useful for automatic backups
 */
export async function autoSaveExport(
  options: Partial<ExportOptions> = {},
  prefix: string = "auto-backup"
): Promise<NativeExportResult> {
  if (!isTauri()) {
    return {
      success: false,
      filePath: null,
      bytesWritten: null,
      error: "Auto-save only available in desktop app",
    };
  }

  const jsonString = exportToJSON(options);
  return saveExportToAppData(jsonString, prefix);
}

/**
 * Export specific scope with native dialog
 */
export async function exportScopeNative(
  scope: ExportScope,
  options: Partial<ExportOptions> = {}
): Promise<NativeExportResult> {
  const opts: Partial<ExportOptions> = {
    ...options,
    scopes: [scope],
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const scopeName = scope === "all" ? "full" : scope;
  opts.fileName = `sast-readium-${scopeName}-${timestamp}.json`;

  return downloadExportNative(opts);
}

/**
 * Export annotations with native dialog
 */
export async function exportAnnotationsNative(): Promise<NativeExportResult> {
  return exportScopeNative("annotations");
}

/**
 * Export bookmarks with native dialog
 */
export async function exportBookmarksNative(): Promise<NativeExportResult> {
  return exportScopeNative("bookmarks");
}

/**
 * Export memories with native dialog
 */
export async function exportMemoriesNative(): Promise<NativeExportResult> {
  return exportScopeNative("memories");
}

/**
 * Export flashcards with native dialog
 */
export async function exportFlashcardsNative(): Promise<NativeExportResult> {
  return exportScopeNative("flashcards");
}

/**
 * Export quizzes with native dialog
 */
export async function exportQuizzesNative(): Promise<NativeExportResult> {
  return exportScopeNative("quizzes");
}

/**
 * Export presentations with native dialog
 */
export async function exportPresentationsNative(): Promise<NativeExportResult> {
  return exportScopeNative("presentations");
}
