/**
 * AI Memory Store - Zustand store for managing AI memories
 *
 * Implements a hybrid memory model:
 * - Document-specific memories (indexed by PDF hash)
 * - Global memories (shared across all documents)
 * - User preferences (always global)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AIMemory,
  MemoryType,
  MemoryScope,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MemorySource,
  MemoryRetrievalOptions,
  MemoryRetrievalResult,
  CreateMemoryParams,
  MemoryStats,
  MemoryExportData,
} from "./types";

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Simple keyword extraction from content
function extractKeywords(content: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "of",
    "to",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "just",
    "don",
    "now",
    "and",
    "or",
    "but",
    "if",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "i",
    "you",
    "he",
    "she",
    "we",
    "they",
    "them",
    "their",
    "what",
    "which",
    "who",
  ]);

  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 10);
}

// Simple relevance scoring
function calculateRelevance(memory: AIMemory, query: string): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  let score = 0;

  // Check content match
  if (memory.content.toLowerCase().includes(queryLower)) {
    score += 0.5;
  }

  // Check keyword matches
  const matchingKeywords = memory.keywords.filter((keyword) =>
    queryWords.some((word) => keyword.includes(word) || word.includes(keyword))
  );
  score +=
    (matchingKeywords.length / Math.max(memory.keywords.length, 1)) * 0.3;

  // Factor in confidence
  score += memory.confidence * 0.1;

  // Factor in recency (memories accessed recently are more relevant)
  const daysSinceAccess =
    (Date.now() - memory.lastAccessedAt) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysSinceAccess / 30) * 0.1;
  score += recencyScore;

  return Math.min(1, score);
}

interface AIMemoryState {
  // Memory storage
  documentMemories: Record<string, AIMemory[]>;
  globalMemories: AIMemory[];
  preferences: AIMemory[];

  // Current document context
  currentDocumentHash: string | null;

  // Actions - Memory Management
  addMemory: (params: CreateMemoryParams) => string;
  updateMemory: (memoryId: string, updates: Partial<AIMemory>) => void;
  deleteMemory: (memoryId: string) => void;
  confirmMemory: (memoryId: string) => void;

  // Actions - Memory Retrieval
  retrieveMemories: (options: MemoryRetrievalOptions) => MemoryRetrievalResult;
  getMemoriesForDocument: (documentHash: string) => AIMemory[];
  getAllGlobalMemories: () => AIMemory[];
  getPreferences: () => AIMemory[];

  // Actions - Document Context
  setCurrentDocumentHash: (hash: string | null) => void;

  // Actions - Scope Management
  promoteToGlobal: (memoryId: string) => void;
  demoteToDocument: (memoryId: string, documentHash: string) => void;

  // Actions - Bulk Operations
  clearDocumentMemories: (documentHash: string) => void;
  clearAllMemories: () => void;

  // Actions - Export/Import
  exportMemories: () => MemoryExportData;
  importMemories: (
    data: MemoryExportData,
    mergeStrategy: "merge" | "replace"
  ) => void;

  // Queries
  getMemoryById: (memoryId: string) => AIMemory | null;
  getStats: () => MemoryStats;
  searchMemories: (query: string) => AIMemory[];
}

export const useAIMemoryStore = create<AIMemoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      documentMemories: {},
      globalMemories: [],
      preferences: [],
      currentDocumentHash: null,

      // Add a new memory
      addMemory: (params) => {
        const memoryId = generateId("memory");
        const now = Date.now();

        const memory: AIMemory = {
          id: memoryId,
          type: params.type,
          scope: params.scope,
          content: params.content,
          keywords: params.keywords || extractKeywords(params.content),
          source: params.source,
          confidence: params.confidence ?? 0.8,
          createdAt: now,
          lastAccessedAt: now,
          accessCount: 0,
          isUserConfirmed: params.isUserConfirmed,
          category: params.category,
          tags: params.tags,
        };

        set((state) => {
          // Handle preferences separately
          if (params.type === "preference") {
            return {
              preferences: [...state.preferences, memory],
            };
          }

          // Handle document-scoped memories
          if (params.scope === "document" && params.source.pdfHash) {
            const docHash = params.source.pdfHash;
            return {
              documentMemories: {
                ...state.documentMemories,
                [docHash]: [...(state.documentMemories[docHash] || []), memory],
              },
            };
          }

          // Handle global memories
          return {
            globalMemories: [...state.globalMemories, memory],
          };
        });

        return memoryId;
      },

      // Update an existing memory
      updateMemory: (memoryId, updates) => {
        set((state) => {
          // Check preferences
          const prefIndex = state.preferences.findIndex(
            (m) => m.id === memoryId
          );
          if (prefIndex !== -1) {
            const newPreferences = [...state.preferences];
            newPreferences[prefIndex] = {
              ...newPreferences[prefIndex],
              ...updates,
            };
            return { preferences: newPreferences };
          }

          // Check global memories
          const globalIndex = state.globalMemories.findIndex(
            (m) => m.id === memoryId
          );
          if (globalIndex !== -1) {
            const newGlobalMemories = [...state.globalMemories];
            newGlobalMemories[globalIndex] = {
              ...newGlobalMemories[globalIndex],
              ...updates,
            };
            return { globalMemories: newGlobalMemories };
          }

          // Check document memories
          for (const [docHash, memories] of Object.entries(
            state.documentMemories
          )) {
            const docIndex = memories.findIndex((m) => m.id === memoryId);
            if (docIndex !== -1) {
              const newMemories = [...memories];
              newMemories[docIndex] = { ...newMemories[docIndex], ...updates };
              return {
                documentMemories: {
                  ...state.documentMemories,
                  [docHash]: newMemories,
                },
              };
            }
          }

          return state;
        });
      },

      // Delete a memory
      deleteMemory: (memoryId) => {
        set((state) => {
          // Check preferences
          if (state.preferences.some((m) => m.id === memoryId)) {
            return {
              preferences: state.preferences.filter((m) => m.id !== memoryId),
            };
          }

          // Check global memories
          if (state.globalMemories.some((m) => m.id === memoryId)) {
            return {
              globalMemories: state.globalMemories.filter(
                (m) => m.id !== memoryId
              ),
            };
          }

          // Check document memories
          for (const [docHash, memories] of Object.entries(
            state.documentMemories
          )) {
            if (memories.some((m) => m.id === memoryId)) {
              return {
                documentMemories: {
                  ...state.documentMemories,
                  [docHash]: memories.filter((m) => m.id !== memoryId),
                },
              };
            }
          }

          return state;
        });
      },

      // Confirm a memory (user verification)
      confirmMemory: (memoryId) => {
        get().updateMemory(memoryId, { isUserConfirmed: true });
      },

      // Retrieve memories based on options
      retrieveMemories: (options) => {
        const state = get();
        const {
          query,
          scope,
          documentHash,
          maxResults = 5,
          minConfidence = 0.3,
          includePreferences = true,
          types,
          tags,
        } = options;

        let candidates: AIMemory[] = [];

        // Gather candidates based on scope
        if (scope === "document" || scope === "both") {
          const docHash = documentHash || state.currentDocumentHash;
          if (docHash && state.documentMemories[docHash]) {
            candidates.push(...state.documentMemories[docHash]);
          }
        }

        if (scope === "global" || scope === "both") {
          candidates.push(...state.globalMemories);
        }

        if (includePreferences) {
          candidates.push(...state.preferences);
        }

        // Filter by confidence
        candidates = candidates.filter((m) => m.confidence >= minConfidence);

        // Filter by types if specified
        if (types && types.length > 0) {
          candidates = candidates.filter((m) => types.includes(m.type));
        }

        // Filter by tags if specified
        if (tags && tags.length > 0) {
          candidates = candidates.filter(
            (m) => m.tags && m.tags.some((tag) => tags.includes(tag))
          );
        }

        // Score and sort by relevance
        const scored = candidates.map((memory) => ({
          memory,
          relevance: calculateRelevance(memory, query),
        }));

        scored.sort((a, b) => b.relevance - a.relevance);

        // Take top results
        const results = scored.slice(0, maxResults).map((s) => s.memory);

        // Update access time and count for retrieved memories
        results.forEach((memory) => {
          get().updateMemory(memory.id, {
            lastAccessedAt: Date.now(),
            accessCount: memory.accessCount + 1,
          });
        });

        return {
          memories: results,
          totalCount: candidates.length,
          query,
          scope,
        };
      },

      // Get all memories for a specific document
      getMemoriesForDocument: (documentHash) => {
        return get().documentMemories[documentHash] || [];
      },

      // Get all global memories
      getAllGlobalMemories: () => {
        return get().globalMemories;
      },

      // Get all preferences
      getPreferences: () => {
        return get().preferences;
      },

      // Set current document context
      setCurrentDocumentHash: (hash) => {
        set({ currentDocumentHash: hash });
      },

      // Promote a document memory to global
      promoteToGlobal: (memoryId) => {
        const state = get();

        // Find the memory in document memories
        for (const [docHash, memories] of Object.entries(
          state.documentMemories
        )) {
          const memory = memories.find((m) => m.id === memoryId);
          if (memory) {
            // Remove from document memories
            set((s) => ({
              documentMemories: {
                ...s.documentMemories,
                [docHash]: s.documentMemories[docHash].filter(
                  (m) => m.id !== memoryId
                ),
              },
              globalMemories: [
                ...s.globalMemories,
                { ...memory, scope: "global" as MemoryScope },
              ],
            }));
            return;
          }
        }
      },

      // Demote a global memory to document-specific
      demoteToDocument: (memoryId, documentHash) => {
        const state = get();
        const memory = state.globalMemories.find((m) => m.id === memoryId);
        if (memory) {
          set((s) => ({
            globalMemories: s.globalMemories.filter((m) => m.id !== memoryId),
            documentMemories: {
              ...s.documentMemories,
              [documentHash]: [
                ...(s.documentMemories[documentHash] || []),
                { ...memory, scope: "document" as MemoryScope },
              ],
            },
          }));
        }
      },

      // Clear all memories for a document
      clearDocumentMemories: (documentHash) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [documentHash]: _, ...rest } = state.documentMemories;
          return { documentMemories: rest };
        });
      },

      // Clear all memories
      clearAllMemories: () => {
        set({
          documentMemories: {},
          globalMemories: [],
          preferences: [],
        });
      },

      // Export all memories
      exportMemories: () => {
        const state = get();
        return {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          documentMemories: state.documentMemories,
          globalMemories: state.globalMemories,
          preferences: state.preferences,
        };
      },

      // Import memories
      importMemories: (data, mergeStrategy) => {
        if (mergeStrategy === "replace") {
          set({
            documentMemories: data.documentMemories,
            globalMemories: data.globalMemories,
            preferences: data.preferences,
          });
        } else {
          // Merge strategy
          set((state) => {
            const mergedDocMemories = { ...state.documentMemories };
            for (const [docHash, memories] of Object.entries(
              data.documentMemories
            )) {
              const existingIds = new Set(
                mergedDocMemories[docHash]?.map((m) => m.id) || []
              );
              const newMemories = memories.filter(
                (m) => !existingIds.has(m.id)
              );
              mergedDocMemories[docHash] = [
                ...(mergedDocMemories[docHash] || []),
                ...newMemories,
              ];
            }

            const existingGlobalIds = new Set(
              state.globalMemories.map((m) => m.id)
            );
            const newGlobalMemories = data.globalMemories.filter(
              (m) => !existingGlobalIds.has(m.id)
            );

            const existingPrefIds = new Set(state.preferences.map((m) => m.id));
            const newPreferences = data.preferences.filter(
              (m) => !existingPrefIds.has(m.id)
            );

            return {
              documentMemories: mergedDocMemories,
              globalMemories: [...state.globalMemories, ...newGlobalMemories],
              preferences: [...state.preferences, ...newPreferences],
            };
          });
        }
      },

      // Get a memory by ID
      getMemoryById: (memoryId) => {
        const state = get();

        // Check preferences
        const pref = state.preferences.find((m) => m.id === memoryId);
        if (pref) return pref;

        // Check global memories
        const global = state.globalMemories.find((m) => m.id === memoryId);
        if (global) return global;

        // Check document memories
        for (const memories of Object.values(state.documentMemories)) {
          const doc = memories.find((m) => m.id === memoryId);
          if (doc) return doc;
        }

        return null;
      },

      // Get memory statistics
      getStats: () => {
        const state = get();

        const docMemoriesCount = Object.values(state.documentMemories).reduce(
          (sum, arr) => sum + arr.length,
          0
        );

        const allMemories = [
          ...state.preferences,
          ...state.globalMemories,
          ...Object.values(state.documentMemories).flat(),
        ];

        const byType: Record<MemoryType, number> = {
          fact: 0,
          preference: 0,
          document: 0,
          global: 0,
        };

        let totalConfidence = 0;
        let confirmedCount = 0;

        allMemories.forEach((m) => {
          byType[m.type]++;
          totalConfidence += m.confidence;
          if (m.isUserConfirmed) confirmedCount++;
        });

        return {
          totalMemories: allMemories.length,
          documentMemoriesCount: docMemoriesCount,
          globalMemoriesCount: state.globalMemories.length,
          preferencesCount: state.preferences.length,
          confirmedCount,
          byType,
          averageConfidence:
            allMemories.length > 0 ? totalConfidence / allMemories.length : 0,
        };
      },

      // Simple search across all memories
      searchMemories: (query) => {
        const state = get();
        const queryLower = query.toLowerCase();

        const allMemories = [
          ...state.preferences,
          ...state.globalMemories,
          ...Object.values(state.documentMemories).flat(),
        ];

        return allMemories.filter(
          (m) =>
            m.content.toLowerCase().includes(queryLower) ||
            m.keywords.some((k) => k.includes(queryLower))
        );
      },
    }),
    {
      name: "ai-memory-storage",
      partialize: (state) => ({
        documentMemories: state.documentMemories,
        globalMemories: state.globalMemories,
        preferences: state.preferences,
      }),
    }
  )
);
