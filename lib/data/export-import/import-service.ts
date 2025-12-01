/**
 * Import Service - Handles data import functionality
 *
 * Supports both browser and Tauri desktop environments.
 * In Tauri, uses native file system for better performance and UX.
 */

import { usePDFStore, type Annotation, type Bookmark } from "@/lib/pdf";
import { useAIMemoryStore, type MemoryExportData } from "@/lib/ai/memory";
import { useAIPlanStore, type AIPlan } from "@/lib/ai/plan";
import { useFlashcardStore } from "@/lib/ai/learning/flashcard/flashcard-store";
import { useQuizStore } from "@/lib/ai/learning/quiz/quiz-store";
import { usePPTStore } from "@/lib/ai/learning/ppt/ppt-store";
import {
  isTauri,
  importDataWithDialog,
  importDataFromFile,
  getRecentExportFiles,
  type NativeFileMetadata,
} from "@/lib/platform";
import type { Presentation, SRSData } from "@/lib/ai/learning/types";
import type {
  ExportData,
  ImportOptions,
  ImportResult,
  ValidationResult,
  ConflictStrategy,
} from "./types";
import { DEFAULT_IMPORT_OPTIONS } from "./types";

/**
 * Validate export data format
 */
export function validateExportData(data: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    version: null,
    hasAnnotations: false,
    hasBookmarks: false,
    hasMemories: false,
    hasPlans: false,
    hasConversations: false,
    hasFlashcards: false,
    hasQuizzes: false,
    hasPresentations: false,
    errors: [],
    warnings: [],
  };

  // Check if data is an object
  if (!data || typeof data !== "object") {
    result.errors.push("Invalid data format: expected an object");
    return result;
  }

  const exportData = data as Partial<ExportData>;

  // Check version
  if (!exportData.version) {
    result.errors.push("Missing version field");
  } else if (
    exportData.version !== "2.0" &&
    exportData.version !== "1.1" &&
    exportData.version !== "1.0"
  ) {
    result.warnings.push(
      `Unknown version: ${exportData.version}, attempting to import anyway`
    );
  }

  // Check for legacy format (annotations only)
  if (
    exportData.annotations &&
    !exportData.version &&
    "exportDate" in (data as Record<string, unknown>)
  ) {
    result.version = "2.0";
    result.hasAnnotations = true;
    result.warnings.push("Detected legacy annotations format, will convert");
    result.isValid = true;
    return result;
  }

  result.version = (exportData.version as ValidationResult["version"]) || null;

  // Validate annotations
  if (exportData.annotations) {
    if (!Array.isArray(exportData.annotations)) {
      result.errors.push("Invalid annotations format: expected an array");
    } else {
      result.hasAnnotations = exportData.annotations.length > 0;
    }
  }

  // Validate bookmarks
  if (exportData.bookmarks) {
    if (!Array.isArray(exportData.bookmarks)) {
      result.errors.push("Invalid bookmarks format: expected an array");
    } else {
      result.hasBookmarks = exportData.bookmarks.length > 0;
    }
  }

  // Validate memories
  if (exportData.memories) {
    if (typeof exportData.memories !== "object") {
      result.errors.push("Invalid memories format: expected an object");
    } else {
      const mem = exportData.memories;
      result.hasMemories =
        (Array.isArray(mem.document) && mem.document.length > 0) ||
        (Array.isArray(mem.global) && mem.global.length > 0) ||
        (Array.isArray(mem.preferences) && mem.preferences.length > 0);
    }
  }

  // Validate plans
  if (exportData.plans) {
    if (!Array.isArray(exportData.plans)) {
      result.errors.push("Invalid plans format: expected an array");
    } else {
      result.hasPlans = exportData.plans.length > 0;
    }
  }

  // Validate conversations
  if (exportData.conversations) {
    if (!Array.isArray(exportData.conversations)) {
      result.errors.push("Invalid conversations format: expected an array");
    } else {
      result.hasConversations = exportData.conversations.length > 0;
    }
  }

  // Validate flashcards
  if (exportData.flashcards) {
    if (typeof exportData.flashcards !== "object") {
      result.errors.push("Invalid flashcards format: expected an object");
    } else {
      const fc = exportData.flashcards;
      result.hasFlashcards =
        (Array.isArray(fc.decks) && fc.decks.length > 0) ||
        (Array.isArray(fc.cards) && fc.cards.length > 0);
    }
  }

  // Validate quizzes
  if (exportData.quizzes) {
    if (typeof exportData.quizzes !== "object") {
      result.errors.push("Invalid quizzes format: expected an object");
    } else {
      const q = exportData.quizzes;
      result.hasQuizzes =
        (Array.isArray(q.quizzes) && q.quizzes.length > 0) ||
        (Array.isArray(q.attempts) && q.attempts.length > 0);
    }
  }

  // Validate presentations
  if (exportData.presentations) {
    if (!Array.isArray(exportData.presentations)) {
      result.errors.push("Invalid presentations format: expected an array");
    } else {
      result.hasPresentations = exportData.presentations.length > 0;
    }
  }

  // Check if at least some data is present
  if (
    !result.hasAnnotations &&
    !result.hasBookmarks &&
    !result.hasMemories &&
    !result.hasPlans &&
    !result.hasConversations &&
    !result.hasFlashcards &&
    !result.hasQuizzes &&
    !result.hasPresentations
  ) {
    result.warnings.push("No data found to import");
  }

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Parse import data from JSON string
 */
export function parseImportData(jsonString: string): ExportData | null {
  try {
    return JSON.parse(jsonString) as ExportData;
  } catch {
    return null;
  }
}

/**
 * Import annotations
 */
function importAnnotations(
  annotations: Annotation[],
  strategy: ConflictStrategy
): { imported: number; skipped: number } {
  const pdfStore = usePDFStore.getState();
  const existingIds = new Set(pdfStore.annotations.map((a) => a.id));

  let imported = 0;
  let skipped = 0;

  if (strategy === "replace") {
    // Import legacy format which replaces
    pdfStore.importAnnotations(JSON.stringify({ annotations, bookmarks: [] }));
    imported = annotations.length;
  } else {
    // Merge or skip
    for (const annotation of annotations) {
      if (existingIds.has(annotation.id)) {
        if (strategy === "skip") {
          skipped++;
        } else {
          // Merge - update existing
          pdfStore.updateAnnotation(annotation.id, annotation);
          imported++;
        }
      } else {
        // New annotation - add it
        // We need to add with ID preservation
        const newAnnotation = {
          ...annotation,
          id: annotation.id,
          timestamp: annotation.timestamp || Date.now(),
        };
        // Use the internal addAnnotation but we need direct state access
        usePDFStore.setState((state) => ({
          annotations: [...state.annotations, newAnnotation as Annotation],
        }));
        imported++;
      }
    }
  }

  return { imported, skipped };
}

/**
 * Import bookmarks
 */
function importBookmarks(
  bookmarks: Bookmark[],
  strategy: ConflictStrategy
): { imported: number; skipped: number } {
  const pdfStore = usePDFStore.getState();
  const existingIds = new Set(pdfStore.bookmarks.map((b) => b.id));

  let imported = 0;
  let skipped = 0;

  for (const bookmark of bookmarks) {
    if (existingIds.has(bookmark.id)) {
      if (strategy === "skip") {
        skipped++;
      } else if (strategy === "replace" || strategy === "merge") {
        // Update - remove old and add new
        usePDFStore.setState((state) => ({
          bookmarks: state.bookmarks
            .filter((b) => b.id !== bookmark.id)
            .concat(bookmark),
        }));
        imported++;
      }
    } else {
      usePDFStore.setState((state) => ({
        bookmarks: [...state.bookmarks, bookmark],
      }));
      imported++;
    }
  }

  return { imported, skipped };
}

/**
 * Import AI memories
 */
function importMemories(
  memories: ExportData["memories"],
  strategy: ConflictStrategy
): { imported: number; skipped: number } {
  if (!memories) {
    return { imported: 0, skipped: 0 };
  }

  const memoryStore = useAIMemoryStore.getState();

  // Convert to MemoryExportData format
  const memoryExportData: MemoryExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    documentMemories: {},
    globalMemories: memories.global || [],
    preferences: memories.preferences || [],
  };

  // Group document memories by hash
  if (memories.document) {
    for (const memory of memories.document) {
      const hash = memory.source.pdfHash || "unknown";
      if (!memoryExportData.documentMemories[hash]) {
        memoryExportData.documentMemories[hash] = [];
      }
      memoryExportData.documentMemories[hash].push(memory);
    }
  }

  const importStrategy = strategy === "skip" ? "merge" : strategy;
  memoryStore.importMemories(
    memoryExportData,
    importStrategy as "merge" | "replace"
  );

  const totalMemories =
    (memories.document?.length || 0) +
    (memories.global?.length || 0) +
    (memories.preferences?.length || 0);

  return { imported: totalMemories, skipped: 0 };
}

/**
 * Import AI plans
 */
function importPlans(
  plans: AIPlan[],
  strategy: ConflictStrategy
): { imported: number; skipped: number } {
  const planStore = useAIPlanStore.getState();
  const existingIds = new Set(Object.keys(planStore.plans));

  let imported = 0;
  let skipped = 0;

  for (const plan of plans) {
    if (existingIds.has(plan.id)) {
      if (strategy === "skip") {
        skipped++;
      } else {
        // For merge/replace, update the existing plan
        useAIPlanStore.setState((state) => ({
          plans: { ...state.plans, [plan.id]: plan },
        }));
        imported++;
      }
    } else {
      // Add new plan directly to state
      useAIPlanStore.setState((state) => ({
        plans: { ...state.plans, [plan.id]: plan },
      }));
      imported++;
    }
  }

  return { imported, skipped };
}

/**
 * Import flashcard decks and cards
 * Note: Cards are nested inside decks, so we import decks with their cards
 */
function importFlashcards(
  flashcards: NonNullable<ExportData["flashcards"]>,
  strategy: ConflictStrategy
): {
  decksImported: number;
  cardsImported: number;
  decksSkipped: number;
  cardsSkipped: number;
} {
  const flashcardStore = useFlashcardStore.getState();
  const existingDeckIds = new Set(Object.keys(flashcardStore.decks));

  let decksImported = 0;
  let cardsImported = 0;
  let decksSkipped = 0;
  const cardsSkipped = 0; // Cards are imported with decks

  // Import decks (decks contain their cards)
  for (const deck of flashcards.decks || []) {
    if (existingDeckIds.has(deck.id)) {
      if (strategy === "skip") {
        decksSkipped++;
      } else {
        // Merge or replace - update the deck
        useFlashcardStore.setState((state) => ({
          decks: { ...state.decks, [deck.id]: deck },
        }));
        decksImported++;
        cardsImported += deck.cards.length;
      }
    } else {
      // New deck - add it
      useFlashcardStore.setState((state) => ({
        decks: { ...state.decks, [deck.id]: deck },
      }));
      decksImported++;
      cardsImported += deck.cards.length;
    }
  }

  // Import SRS data
  if (flashcards.srsData) {
    useFlashcardStore.setState((state) => ({
      srsData:
        strategy === "replace"
          ? (flashcards.srsData as Record<string, SRSData>)
          : {
              ...state.srsData,
              ...(flashcards.srsData as Record<string, SRSData>),
            },
    }));
  }

  return { decksImported, cardsImported, decksSkipped, cardsSkipped };
}

/**
 * Import quizzes and attempts
 */
function importQuizzes(
  quizzes: NonNullable<ExportData["quizzes"]>,
  strategy: ConflictStrategy
): {
  quizzesImported: number;
  attemptsImported: number;
  quizzesSkipped: number;
  attemptsSkipped: number;
} {
  const quizStore = useQuizStore.getState();
  const existingQuizIds = new Set(Object.keys(quizStore.quizzes));
  const existingAttemptIds = new Set(quizStore.attempts.map((a) => a.id));

  let quizzesImported = 0;
  let attemptsImported = 0;
  let quizzesSkipped = 0;
  let attemptsSkipped = 0;

  // Import quizzes
  for (const quiz of quizzes.quizzes || []) {
    if (existingQuizIds.has(quiz.id)) {
      if (strategy === "skip") {
        quizzesSkipped++;
      } else {
        useQuizStore.setState((state) => ({
          quizzes: { ...state.quizzes, [quiz.id]: quiz },
        }));
        quizzesImported++;
      }
    } else {
      useQuizStore.setState((state) => ({
        quizzes: { ...state.quizzes, [quiz.id]: quiz },
      }));
      quizzesImported++;
    }
  }

  // Import attempts
  for (const attempt of quizzes.attempts || []) {
    if (existingAttemptIds.has(attempt.id)) {
      if (strategy === "skip") {
        attemptsSkipped++;
      } else {
        useQuizStore.setState((state) => ({
          attempts: state.attempts.map((a) =>
            a.id === attempt.id ? attempt : a
          ),
        }));
        attemptsImported++;
      }
    } else {
      useQuizStore.setState((state) => ({
        attempts: [...state.attempts, attempt],
      }));
      attemptsImported++;
    }
  }

  return { quizzesImported, attemptsImported, quizzesSkipped, attemptsSkipped };
}

/**
 * Import presentations
 */
function importPresentations(
  presentations: Presentation[],
  strategy: ConflictStrategy
): { imported: number; skipped: number } {
  const pptStore = usePPTStore.getState();
  const existingIds = new Set(Object.keys(pptStore.presentations));

  let imported = 0;
  let skipped = 0;

  for (const presentation of presentations) {
    if (existingIds.has(presentation.id)) {
      if (strategy === "skip") {
        skipped++;
      } else {
        usePPTStore.setState((state) => ({
          presentations: {
            ...state.presentations,
            [presentation.id]: presentation,
          },
        }));
        imported++;
      }
    } else {
      usePPTStore.setState((state) => ({
        presentations: {
          ...state.presentations,
          [presentation.id]: presentation,
        },
      }));
      imported++;
    }
  }

  return { imported, skipped };
}

/**
 * Import data from ExportData object
 */
export function importData(
  data: ExportData,
  options: Partial<ImportOptions> = {}
): ImportResult {
  const opts = { ...DEFAULT_IMPORT_OPTIONS, ...options };
  const result: ImportResult = {
    success: false,
    imported: {
      annotations: 0,
      bookmarks: 0,
      memories: 0,
      plans: 0,
      conversations: 0,
      flashcardDecks: 0,
      flashcards: 0,
      quizzes: 0,
      quizAttempts: 0,
      presentations: 0,
    },
    skipped: {
      annotations: 0,
      bookmarks: 0,
      memories: 0,
      plans: 0,
      conversations: 0,
      flashcardDecks: 0,
      flashcards: 0,
      quizzes: 0,
      quizAttempts: 0,
      presentations: 0,
    },
    errors: [],
  };

  // Validate if requested
  if (opts.validateFirst) {
    const validation = validateExportData(data);
    if (!validation.isValid) {
      result.errors = validation.errors;
      return result;
    }
  }

  try {
    // Import annotations
    if (data.annotations && data.annotations.length > 0) {
      const annotationResult = importAnnotations(
        data.annotations,
        opts.conflictStrategy
      );
      result.imported.annotations = annotationResult.imported;
      result.skipped.annotations = annotationResult.skipped;
    }

    // Import bookmarks
    if (data.bookmarks && data.bookmarks.length > 0) {
      const bookmarkResult = importBookmarks(
        data.bookmarks,
        opts.conflictStrategy
      );
      result.imported.bookmarks = bookmarkResult.imported;
      result.skipped.bookmarks = bookmarkResult.skipped;
    }

    // Import memories
    if (data.memories) {
      const memoryResult = importMemories(data.memories, opts.conflictStrategy);
      result.imported.memories = memoryResult.imported;
      result.skipped.memories = memoryResult.skipped;
    }

    // Import plans
    if (data.plans && data.plans.length > 0) {
      const planResult = importPlans(data.plans, opts.conflictStrategy);
      result.imported.plans = planResult.imported;
      result.skipped.plans = planResult.skipped;
    }

    // Import flashcards
    if (data.flashcards) {
      const flashcardResult = importFlashcards(
        data.flashcards,
        opts.conflictStrategy
      );
      result.imported.flashcardDecks = flashcardResult.decksImported;
      result.imported.flashcards = flashcardResult.cardsImported;
      result.skipped.flashcardDecks = flashcardResult.decksSkipped;
      result.skipped.flashcards = flashcardResult.cardsSkipped;
    }

    // Import quizzes
    if (data.quizzes) {
      const quizResult = importQuizzes(data.quizzes, opts.conflictStrategy);
      result.imported.quizzes = quizResult.quizzesImported;
      result.imported.quizAttempts = quizResult.attemptsImported;
      result.skipped.quizzes = quizResult.quizzesSkipped;
      result.skipped.quizAttempts = quizResult.attemptsSkipped;
    }

    // Import presentations
    if (data.presentations && data.presentations.length > 0) {
      const presentationResult = importPresentations(
        data.presentations,
        opts.conflictStrategy
      );
      result.imported.presentations = presentationResult.imported;
      result.skipped.presentations = presentationResult.skipped;
    }

    // Conversations import would go here
    // For now, we skip conversation import as it's complex

    result.success = true;
  } catch (error) {
    result.errors.push(
      `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * Import from JSON string
 */
export function importFromJSON(
  jsonString: string,
  options: Partial<ImportOptions> = {}
): ImportResult {
  const data = parseImportData(jsonString);

  if (!data) {
    return {
      success: false,
      imported: {
        annotations: 0,
        bookmarks: 0,
        memories: 0,
        plans: 0,
        conversations: 0,
        flashcardDecks: 0,
        flashcards: 0,
        quizzes: 0,
        quizAttempts: 0,
        presentations: 0,
      },
      skipped: {
        annotations: 0,
        bookmarks: 0,
        memories: 0,
        plans: 0,
        conversations: 0,
        flashcardDecks: 0,
        flashcards: 0,
        quizzes: 0,
        quizAttempts: 0,
        presentations: 0,
      },
      errors: ["Failed to parse JSON data"],
    };
  }

  return importData(data, options);
}

/**
 * Import from file
 */
export function importFromFile(
  file: File,
  options: Partial<ImportOptions> = {}
): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") {
        resolve({
          success: false,
          imported: {
            annotations: 0,
            bookmarks: 0,
            memories: 0,
            plans: 0,
            conversations: 0,
            flashcardDecks: 0,
            flashcards: 0,
            quizzes: 0,
            quizAttempts: 0,
            presentations: 0,
          },
          skipped: {
            annotations: 0,
            bookmarks: 0,
            memories: 0,
            plans: 0,
            conversations: 0,
            flashcardDecks: 0,
            flashcards: 0,
            quizzes: 0,
            quizAttempts: 0,
            presentations: 0,
          },
          errors: ["Failed to read file content"],
        });
        return;
      }

      resolve(importFromJSON(content, options));
    };

    reader.onerror = () => {
      resolve({
        success: false,
        imported: {
          annotations: 0,
          bookmarks: 0,
          memories: 0,
          plans: 0,
          conversations: 0,
          flashcardDecks: 0,
          flashcards: 0,
          quizzes: 0,
          quizAttempts: 0,
          presentations: 0,
        },
        skipped: {
          annotations: 0,
          bookmarks: 0,
          memories: 0,
          plans: 0,
          conversations: 0,
          flashcardDecks: 0,
          flashcards: 0,
          quizzes: 0,
          quizAttempts: 0,
          presentations: 0,
        },
        errors: ["Failed to read file"],
      });
    };

    reader.readAsText(file);
  });
}

/**
 * Import legacy annotations format
 */
export function importAnnotationsLegacy(jsonString: string): boolean {
  try {
    const pdfStore = usePDFStore.getState();
    pdfStore.importAnnotations(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Import AI memories from JSON string
 */
export function importMemoriesFromJSON(
  jsonString: string,
  strategy: "merge" | "replace" = "merge"
): boolean {
  try {
    const data = JSON.parse(jsonString) as MemoryExportData;
    const memoryStore = useAIMemoryStore.getState();
    memoryStore.importMemories(data, strategy);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Native Import Functions (Tauri Desktop)
// ============================================================================

/**
 * Extended import result with native file info
 */
export interface NativeImportExtendedResult extends ImportResult {
  filePath: string | null;
  bytesRead: number | null;
}

/**
 * Import data using native file dialog (Tauri only)
 * Falls back to returning null if not in Tauri (use importFromFile for browser)
 */
export async function importFromDialogNative(
  options: Partial<ImportOptions> = {}
): Promise<NativeImportExtendedResult | null> {
  if (!isTauri()) {
    return null;
  }

  const nativeResult = await importDataWithDialog();

  if (!nativeResult.success || !nativeResult.data) {
    return {
      success: false,
      imported: {
        annotations: 0,
        bookmarks: 0,
        memories: 0,
        plans: 0,
        conversations: 0,
        flashcardDecks: 0,
        flashcards: 0,
        quizzes: 0,
        quizAttempts: 0,
        presentations: 0,
      },
      skipped: {
        annotations: 0,
        bookmarks: 0,
        memories: 0,
        plans: 0,
        conversations: 0,
        flashcardDecks: 0,
        flashcards: 0,
        quizzes: 0,
        quizAttempts: 0,
        presentations: 0,
      },
      errors: [nativeResult.error || "Failed to read file"],
      filePath: nativeResult.filePath,
      bytesRead: nativeResult.bytesRead,
    };
  }

  const importResult = importFromJSON(nativeResult.data, options);

  return {
    ...importResult,
    filePath: nativeResult.filePath,
    bytesRead: nativeResult.bytesRead,
  };
}

/**
 * Import data from a specific file path (Tauri only)
 */
export async function importFromPathNative(
  filePath: string,
  options: Partial<ImportOptions> = {}
): Promise<NativeImportExtendedResult | null> {
  if (!isTauri()) {
    return null;
  }

  const nativeResult = await importDataFromFile(filePath);

  if (!nativeResult.success || !nativeResult.data) {
    return {
      success: false,
      imported: {
        annotations: 0,
        bookmarks: 0,
        memories: 0,
        plans: 0,
        conversations: 0,
        flashcardDecks: 0,
        flashcards: 0,
        quizzes: 0,
        quizAttempts: 0,
        presentations: 0,
      },
      skipped: {
        annotations: 0,
        bookmarks: 0,
        memories: 0,
        plans: 0,
        conversations: 0,
        flashcardDecks: 0,
        flashcards: 0,
        quizzes: 0,
        quizAttempts: 0,
        presentations: 0,
      },
      errors: [nativeResult.error || "Failed to read file"],
      filePath: nativeResult.filePath,
      bytesRead: nativeResult.bytesRead,
    };
  }

  const importResult = importFromJSON(nativeResult.data, options);

  return {
    ...importResult,
    filePath: nativeResult.filePath,
    bytesRead: nativeResult.bytesRead,
  };
}

/**
 * Get list of recent export files (Tauri only)
 * Useful for showing a "recent imports" list
 */
export async function getRecentExports(): Promise<NativeFileMetadata[]> {
  if (!isTauri()) {
    return [];
  }

  return getRecentExportFiles();
}

/**
 * Preview import data without actually importing
 * Returns validation result with data summary
 */
export async function previewImportNative(): Promise<{
  validation: ValidationResult;
  filePath: string | null;
} | null> {
  if (!isTauri()) {
    return null;
  }

  const nativeResult = await importDataWithDialog();

  if (!nativeResult.success || !nativeResult.data) {
    return {
      validation: {
        isValid: false,
        version: null,
        hasAnnotations: false,
        hasBookmarks: false,
        hasMemories: false,
        hasPlans: false,
        hasConversations: false,
        hasFlashcards: false,
        hasQuizzes: false,
        hasPresentations: false,
        errors: [nativeResult.error || "Failed to read file"],
        warnings: [],
      },
      filePath: nativeResult.filePath,
    };
  }

  const data = parseImportData(nativeResult.data);
  if (!data) {
    return {
      validation: {
        isValid: false,
        version: null,
        hasAnnotations: false,
        hasBookmarks: false,
        hasMemories: false,
        hasPlans: false,
        hasConversations: false,
        hasFlashcards: false,
        hasQuizzes: false,
        hasPresentations: false,
        errors: ["Invalid JSON data"],
        warnings: [],
      },
      filePath: nativeResult.filePath,
    };
  }

  return {
    validation: validateExportData(data),
    filePath: nativeResult.filePath,
  };
}
