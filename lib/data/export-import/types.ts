/**
 * Export/Import Types - Data structures for data export and import
 */

import type { Annotation, Bookmark } from "@/lib/pdf";
import type { AIMemory, MemoryExportData } from "@/lib/ai/memory";
import type { AIPlan } from "@/lib/ai/plan";
import type {
  FlashcardDeck,
  Flashcard,
  Quiz,
  QuizAttempt,
  Presentation,
} from "@/lib/ai/learning/types";

/**
 * Export data format version
 */
export type ExportVersion = "2.0";

/**
 * Export scope - what data to include
 */
export type ExportScope =
  | "all"
  | "annotations"
  | "bookmarks"
  | "memories"
  | "plans"
  | "conversations"
  | "flashcards"
  | "quizzes"
  | "presentations";

/**
 * Import conflict resolution strategy
 */
export type ConflictStrategy = "merge" | "replace" | "skip";

/**
 * Conversation export format (minimal)
 */
export interface ExportedConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Full export data structure
 */
export interface ExportData {
  /** Format version for compatibility */
  version: ExportVersion;
  /** Export timestamp */
  exportedAt: string;
  /** Application name and version */
  source: {
    app: string;
    version: string;
  };
  /** PDF file information (if specific to a document) */
  documentInfo?: {
    fileName: string;
    fileHash?: string;
    pageCount?: number;
  };

  /** PDF Annotations */
  annotations?: Annotation[];

  /** User Bookmarks */
  bookmarks?: Bookmark[];

  /** AI Memories */
  memories?: {
    document: AIMemory[];
    global: AIMemory[];
    preferences: AIMemory[];
  };

  /** AI Plans */
  plans?: AIPlan[];

  /** Conversation History (optional) */
  conversations?: ExportedConversation[];

  /** Learning Data - Flashcards */
  flashcards?: {
    decks: FlashcardDeck[];
    cards: Flashcard[];
    srsData: Record<
      string,
      {
        cardId: string;
        easeFactor: number;
        interval: number;
        repetitions: number;
        nextReviewDate: number;
        lastReviewDate?: number;
        totalReviews: number;
        correctReviews: number;
      }
    >;
  };

  /** Learning Data - Quizzes */
  quizzes?: {
    quizzes: Quiz[];
    attempts: QuizAttempt[];
  };

  /** Learning Data - Presentations */
  presentations?: Presentation[];

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Scopes to include */
  scopes: ExportScope[];
  /** Include only current document's data */
  currentDocumentOnly: boolean;
  /** Include conversation history */
  includeConversations: boolean;
  /** File name for export */
  fileName?: string;
  /** Pretty print JSON */
  prettyPrint: boolean;
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Conflict resolution strategy */
  conflictStrategy: ConflictStrategy;
  /** Scopes to import (if not specified, imports all present in file) */
  scopes?: ExportScope[];
  /** Validate data before import */
  validateFirst: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  imported: {
    annotations: number;
    bookmarks: number;
    memories: number;
    plans: number;
    conversations: number;
    flashcardDecks: number;
    flashcards: number;
    quizzes: number;
    quizAttempts: number;
    presentations: number;
  };
  skipped: {
    annotations: number;
    bookmarks: number;
    memories: number;
    plans: number;
    conversations: number;
    flashcardDecks: number;
    flashcards: number;
    quizzes: number;
    quizAttempts: number;
    presentations: number;
  };
  errors: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  version: ExportVersion | null;
  hasAnnotations: boolean;
  hasBookmarks: boolean;
  hasMemories: boolean;
  hasPlans: boolean;
  hasConversations: boolean;
  hasFlashcards: boolean;
  hasQuizzes: boolean;
  hasPresentations: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  scopes: ["all"],
  currentDocumentOnly: false,
  includeConversations: false,
  prettyPrint: true,
};

/**
 * Default import options
 */
export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  conflictStrategy: "merge",
  validateFirst: true,
};
