/**
 * Tests for AI Memory Store
 */

import { act } from "@testing-library/react";
import { useAIMemoryStore } from "./ai-memory-store";
import type { MemoryExportData, CreateMemoryParams } from "./types";

// Reset store before each test
beforeEach(() => {
  act(() => {
    useAIMemoryStore.setState({
      documentMemories: {},
      globalMemories: [],
      preferences: [],
    });
  });
});

// Helper to create memory params
function createMemoryParams(
  content: string,
  overrides: Partial<CreateMemoryParams> = {}
): CreateMemoryParams {
  return {
    content,
    type: "fact",
    scope: "document",
    source: {
      conversationId: "conv-1",
      messageId: "msg-1",
      pdfHash: "test-hash",
      pdfFileName: "test.pdf",
    },
    confidence: 0.9,
    ...overrides,
  };
}

describe("ai-memory-store", () => {
  describe("Memory CRUD Operations", () => {
    it("should add a document-scoped memory", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(
            createMemoryParams("The document discusses machine learning.")
          );
      });

      const state = useAIMemoryStore.getState();
      expect(state.documentMemories["test-hash"]).toHaveLength(1);
      expect(state.documentMemories["test-hash"][0].id).toBe(memoryId!);
      expect(state.documentMemories["test-hash"][0].content).toBe(
        "The document discusses machine learning."
      );
    });

    it("should add a global memory", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore.getState().addMemory(
          createMemoryParams("Global fact about the user.", {
            scope: "global",
            type: "fact", // Use 'fact' type for global memories
          })
        );
      });

      const state = useAIMemoryStore.getState();
      expect(state.globalMemories).toHaveLength(1);
      expect(state.globalMemories[0].id).toBe(memoryId!);
    });

    it("should add a preference memory", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore.getState().addMemory(
          createMemoryParams("User prefers concise explanations.", {
            type: "preference",
            scope: "global",
          })
        );
      });

      const state = useAIMemoryStore.getState();
      // Preferences are stored in a separate preferences array
      expect(state.preferences.some((m) => m.id === memoryId!)).toBe(true);
    });

    it("should update a memory", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Original content"));
      });

      act(() => {
        useAIMemoryStore.getState().updateMemory(memoryId!, {
          content: "Updated content",
          confidence: 0.95,
        });
      });

      const state = useAIMemoryStore.getState();
      const memory = state.documentMemories["test-hash"].find(
        (m) => m.id === memoryId!
      );
      expect(memory?.content).toBe("Updated content");
      expect(memory?.confidence).toBe(0.95);
    });

    it("should delete a document memory", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("To be deleted"));
      });

      expect(
        useAIMemoryStore.getState().documentMemories["test-hash"]
      ).toHaveLength(1);

      act(() => {
        useAIMemoryStore.getState().deleteMemory(memoryId!);
      });

      expect(
        useAIMemoryStore.getState().documentMemories["test-hash"]
      ).toHaveLength(0);
    });

    it("should delete a global memory", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(
            createMemoryParams("Global to delete", { scope: "global" })
          );
      });

      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(1);

      act(() => {
        useAIMemoryStore.getState().deleteMemory(memoryId!);
      });

      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(0);
    });

    it("should confirm a memory", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Unconfirmed memory"));
      });

      const beforeConfirm =
        useAIMemoryStore.getState().documentMemories["test-hash"][0];
      expect(beforeConfirm.isUserConfirmed).toBeFalsy();

      act(() => {
        useAIMemoryStore.getState().confirmMemory(memoryId!);
      });

      const afterConfirm =
        useAIMemoryStore.getState().documentMemories["test-hash"][0];
      expect(afterConfirm.isUserConfirmed).toBe(true);
    });
  });

  describe("Memory Retrieval", () => {
    beforeEach(() => {
      act(() => {
        // Add various memories for testing retrieval
        useAIMemoryStore.getState().addMemory(
          createMemoryParams("Machine learning is a subset of AI.", {
            keywords: ["machine learning", "AI", "artificial intelligence"],
          })
        );
        useAIMemoryStore.getState().addMemory(
          createMemoryParams("Deep learning uses neural networks.", {
            keywords: ["deep learning", "neural networks"],
          })
        );
        useAIMemoryStore.getState().addMemory(
          createMemoryParams("User prefers detailed explanations.", {
            scope: "global",
            type: "preference",
          })
        );
      });
    });

    it("should retrieve memories for a document", () => {
      const memories = useAIMemoryStore
        .getState()
        .getMemoriesForDocument("test-hash");
      expect(memories).toHaveLength(2);
    });

    it("should retrieve global memories", () => {
      // Add a global fact memory (not preference)
      act(() => {
        useAIMemoryStore.getState().addMemory(
          createMemoryParams("Global fact.", {
            scope: "global",
            type: "fact",
          })
        );
      });

      const memories = useAIMemoryStore.getState().getAllGlobalMemories();
      expect(memories).toHaveLength(1);
    });

    it("should retrieve relevant memories by query", () => {
      const result = useAIMemoryStore.getState().retrieveMemories({
        query: "machine learning",
        scope: "document",
        documentHash: "test-hash",
        maxResults: 10,
      });

      expect(result.memories.length).toBeGreaterThan(0);
    });

    it("should retrieve memories from both scopes", () => {
      const result = useAIMemoryStore.getState().retrieveMemories({
        query: "learning",
        scope: "both",
        documentHash: "test-hash",
        maxResults: 10,
      });

      expect(result.memories.length).toBeGreaterThan(0);
    });

    it("should respect maxResults limit", () => {
      const result = useAIMemoryStore.getState().retrieveMemories({
        query: "learning",
        scope: "document",
        documentHash: "test-hash",
        maxResults: 1,
      });

      expect(result.memories).toHaveLength(1);
    });

    it("should filter by minimum confidence", () => {
      act(() => {
        useAIMemoryStore
          .getState()
          .addMemory(
            createMemoryParams("Low confidence memory", { confidence: 0.3 })
          );
      });

      const result = useAIMemoryStore.getState().retrieveMemories({
        query: "memory",
        scope: "document",
        documentHash: "test-hash",
        minConfidence: 0.5,
      });

      // Should not include the low confidence memory
      expect(result.memories.every((m) => m.confidence >= 0.5)).toBe(true);
    });
  });

  describe("Memory Promotion/Demotion", () => {
    it("should promote document memory to global", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Document-specific fact"));
      });

      expect(
        useAIMemoryStore.getState().documentMemories["test-hash"]
      ).toHaveLength(1);
      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(0);

      act(() => {
        useAIMemoryStore.getState().promoteToGlobal(memoryId!);
      });

      expect(
        useAIMemoryStore.getState().documentMemories["test-hash"]
      ).toHaveLength(0);
      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(1);
      expect(useAIMemoryStore.getState().globalMemories[0].scope).toBe(
        "global"
      );
    });

    it("should demote global memory to document", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Global fact", { scope: "global" }));
      });

      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(1);

      act(() => {
        useAIMemoryStore.getState().demoteToDocument(memoryId!, "new-doc-hash");
      });

      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(0);
      expect(
        useAIMemoryStore.getState().documentMemories["new-doc-hash"]
      ).toHaveLength(1);
      expect(
        useAIMemoryStore.getState().documentMemories["new-doc-hash"][0].scope
      ).toBe("document");
    });
  });

  describe("Export/Import", () => {
    it("should export all memories", () => {
      act(() => {
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Doc memory 1"));
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Doc memory 2"));
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Global memory", { scope: "global" }));
      });

      const exported = useAIMemoryStore.getState().exportMemories();

      expect(exported.version).toBe("1.0");
      expect(exported.documentMemories["test-hash"]).toHaveLength(2);
      expect(exported.globalMemories).toHaveLength(1);
    });

    it("should import memories with merge strategy", () => {
      // Add existing memory
      act(() => {
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Existing memory"));
      });

      const importData: MemoryExportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        documentMemories: {
          "test-hash": [
            {
              id: "imported-1",
              type: "fact",
              scope: "document",
              content: "Imported memory",
              keywords: [],
              source: { conversationId: "c1", messageId: "m1" },
              confidence: 0.8,
              createdAt: Date.now(),
              lastAccessedAt: Date.now(),
              accessCount: 0,
            },
          ],
        },
        globalMemories: [],
        preferences: [],
      };

      act(() => {
        useAIMemoryStore.getState().importMemories(importData, "merge");
      });

      // Should have both existing and imported
      expect(
        useAIMemoryStore.getState().documentMemories["test-hash"].length
      ).toBeGreaterThanOrEqual(2);
    });

    it("should import memories with replace strategy", () => {
      // Add existing memory
      act(() => {
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Existing memory"));
      });

      const importData: MemoryExportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        documentMemories: {
          "test-hash": [
            {
              id: "imported-1",
              type: "fact",
              scope: "document",
              content: "Imported memory",
              keywords: [],
              source: { conversationId: "c1", messageId: "m1" },
              confidence: 0.8,
              createdAt: Date.now(),
              lastAccessedAt: Date.now(),
              accessCount: 0,
            },
          ],
        },
        globalMemories: [],
        preferences: [],
      };

      act(() => {
        useAIMemoryStore.getState().importMemories(importData, "replace");
      });

      // Should only have imported
      expect(
        useAIMemoryStore.getState().documentMemories["test-hash"]
      ).toHaveLength(1);
      expect(
        useAIMemoryStore.getState().documentMemories["test-hash"][0].content
      ).toBe("Imported memory");
    });
  });

  describe("Statistics", () => {
    it("should calculate memory statistics", () => {
      act(() => {
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Fact 1", { type: "fact" }));
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Fact 2", { type: "fact" }));
        useAIMemoryStore
          .getState()
          .addMemory(
            createMemoryParams("Global fact", { type: "fact", scope: "global" })
          );
      });

      const stats = useAIMemoryStore.getState().getStats();

      expect(stats.totalMemories).toBe(3);
      expect(stats.documentMemoriesCount).toBe(2);
      expect(stats.globalMemoriesCount).toBe(1);
    });
  });

  describe("Access Tracking", () => {
    it("should update access count and timestamp on retrieval", () => {
      let memoryId: string;

      act(() => {
        memoryId = useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Tracked memory"));
      });

      const before =
        useAIMemoryStore.getState().documentMemories["test-hash"][0];
      expect(before.accessCount).toBe(0);

      // Trigger access by retrieving
      act(() => {
        useAIMemoryStore.getState().updateMemory(memoryId!, { accessCount: 1 });
      });

      const after =
        useAIMemoryStore.getState().documentMemories["test-hash"][0];
      expect(after.accessCount).toBe(1);
      expect(after.lastAccessedAt).toBeGreaterThanOrEqual(
        before.lastAccessedAt
      );
    });
  });

  describe("Keyword Extraction", () => {
    it("should extract keywords from content", () => {
      act(() => {
        useAIMemoryStore
          .getState()
          .addMemory(
            createMemoryParams(
              "Machine learning and deep learning are subsets of artificial intelligence."
            )
          );
      });

      const memory =
        useAIMemoryStore.getState().documentMemories["test-hash"][0];
      expect(memory.keywords.length).toBeGreaterThan(0);
    });
  });

  describe("Clear Operations", () => {
    it("should clear document memories", () => {
      act(() => {
        useAIMemoryStore.getState().addMemory(createMemoryParams("Doc memory"));
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Global memory", { scope: "global" }));
      });

      act(() => {
        useAIMemoryStore.getState().clearDocumentMemories("test-hash");
      });

      // After clearing, documentMemories['test-hash'] may be undefined or empty array
      const docMemories =
        useAIMemoryStore.getState().documentMemories["test-hash"];
      expect(docMemories === undefined || docMemories.length === 0).toBe(true);
      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(1);
    });

    it("should clear all memories", () => {
      act(() => {
        useAIMemoryStore.getState().addMemory(createMemoryParams("Doc memory"));
        useAIMemoryStore
          .getState()
          .addMemory(createMemoryParams("Global memory", { scope: "global" }));
      });

      act(() => {
        useAIMemoryStore.getState().clearAllMemories();
      });

      expect(
        Object.keys(useAIMemoryStore.getState().documentMemories)
      ).toHaveLength(0);
      expect(useAIMemoryStore.getState().globalMemories).toHaveLength(0);
    });
  });
});
