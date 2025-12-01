/**
 * AI Memory Types - Data structures for AI memory functionality
 *
 * Supports a hybrid memory model with:
 * - Document-specific memories (indexed by PDF hash)
 * - Global memories (shared across all documents)
 * - User preferences (always global)
 */

// Memory type categories
export type MemoryType = "fact" | "preference" | "document" | "global";

// Memory scope
export type MemoryScope = "document" | "global";

/**
 * Source information for a memory
 */
export interface MemorySource {
  /** The conversation ID where this memory was extracted */
  conversationId: string;
  /** The message ID where this memory was extracted */
  messageId: string;
  /** The PDF file name (if document-scoped) */
  pdfFileName?: string;
  /** Hash of the PDF content for unique identification */
  pdfHash?: string;
  /** Page number where the memory was created */
  pageNumber?: number;
}

/**
 * A single memory entry
 */
export interface AIMemory {
  id: string;
  /** Type of memory */
  type: MemoryType;
  /** Scope: document-specific or global */
  scope: MemoryScope;
  /** The actual content of the memory */
  content: string;
  /** Keywords for retrieval (extracted from content) */
  keywords: string[];
  /** Source information */
  source: MemorySource;
  /** Confidence score (0-1) */
  confidence: number;
  /** When the memory was created */
  createdAt: number;
  /** When the memory was last accessed */
  lastAccessedAt: number;
  /** Number of times this memory has been accessed */
  accessCount: number;
  /** Whether the user has explicitly confirmed this memory */
  isUserConfirmed?: boolean;
  /** Optional category for organization */
  category?: string;
  /** Optional tags for filtering */
  tags?: string[];
}

/**
 * Memory store structure for persistence
 */
export interface AIMemoryStore {
  /** Document-specific memories, indexed by PDF hash */
  documentMemories: Record<string, AIMemory[]>;
  /** Global memories shared across all documents */
  globalMemories: AIMemory[];
  /** User preferences (always global) */
  preferences: AIMemory[];
}

/**
 * Options for retrieving memories
 */
export interface MemoryRetrievalOptions {
  /** Search query */
  query: string;
  /** Scope of retrieval */
  scope: "document" | "global" | "both";
  /** Current document hash (for document-scoped retrieval) */
  documentHash?: string;
  /** Maximum number of results */
  maxResults?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Whether to include preferences in results */
  includePreferences?: boolean;
  /** Filter by memory type */
  types?: MemoryType[];
  /** Filter by tags */
  tags?: string[];
}

/**
 * Result of memory retrieval
 */
export interface MemoryRetrievalResult {
  memories: AIMemory[];
  totalCount: number;
  query: string;
  scope: string;
}

/**
 * Parameters for creating a new memory
 */
export interface CreateMemoryParams {
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  source: MemorySource;
  confidence?: number;
  keywords?: string[];
  tags?: string[];
  category?: string;
  isUserConfirmed?: boolean;
}

/**
 * Memory extraction result from AI conversation
 */
export interface MemoryExtractionResult {
  memories: CreateMemoryParams[];
  extractedFrom: {
    conversationId: string;
    messageId: string;
    content: string;
  };
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  totalMemories: number;
  documentMemoriesCount: number;
  globalMemoriesCount: number;
  preferencesCount: number;
  confirmedCount: number;
  byType: Record<MemoryType, number>;
  averageConfidence: number;
}

/**
 * Export format for memories
 */
export interface MemoryExportData {
  version: string;
  exportedAt: string;
  documentMemories: Record<string, AIMemory[]>;
  globalMemories: AIMemory[];
  preferences: AIMemory[];
}
