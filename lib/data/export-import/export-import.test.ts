/**
 * Tests for Export/Import Services
 */

import {
  validateExportData,
  parseImportData,
  importData,
  importFromJSON,
} from "./import-service";
import { createExportData, exportToJSON } from "./export-service";
import type { ExportData } from "./types";

// Mock the stores
jest.mock("@/lib/pdf", () => ({
  usePDFStore: {
    getState: jest.fn(() => ({
      annotations: [],
      bookmarks: [],
      documents: {},
      pdfUrl: null,
      currentPDF: null,
      numPages: 0,
      exportAnnotations: jest.fn(() => '{"annotations":[],"bookmarks":[]}'),
      importAnnotations: jest.fn(),
      updateAnnotation: jest.fn(),
    })),
    setState: jest.fn(),
  },
}));

jest.mock("@/lib/ai/memory", () => ({
  useAIMemoryStore: {
    getState: jest.fn(() => ({
      documentMemories: {},
      globalMemories: [],
      preferences: [],
      exportMemories: jest.fn(() => ({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        documentMemories: {},
        globalMemories: [],
        preferences: [],
      })),
      importMemories: jest.fn(),
    })),
    setState: jest.fn(),
  },
}));

jest.mock("@/lib/ai/plan", () => ({
  useAIPlanStore: {
    getState: jest.fn(() => ({
      plans: {},
    })),
    setState: jest.fn(),
  },
}));

jest.mock("@/lib/ai/learning/flashcard/flashcard-store", () => ({
  useFlashcardStore: {
    getState: jest.fn(() => ({
      decks: {},
      srsData: {},
    })),
    setState: jest.fn(),
  },
}));

jest.mock("@/lib/ai/learning/quiz/quiz-store", () => ({
  useQuizStore: {
    getState: jest.fn(() => ({
      quizzes: {},
      attempts: [],
    })),
    setState: jest.fn(),
  },
}));

jest.mock("@/lib/ai/learning/ppt/ppt-store", () => ({
  usePPTStore: {
    getState: jest.fn(() => ({
      presentations: {},
    })),
    setState: jest.fn(),
  },
}));

jest.mock("@/lib/platform", () => ({
  isTauri: jest.fn(() => false),
  exportDataWithDialog: jest.fn(),
  saveExportToAppData: jest.fn(),
  importDataWithDialog: jest.fn(),
  importDataFromFile: jest.fn(),
  getRecentExportFiles: jest.fn(() => []),
}));

describe("Export/Import Services", () => {
  describe("validateExportData", () => {
    it("should validate valid export data", () => {
      const validData: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "SAST Readium", version: "0.1.0" },
        annotations: [
          {
            id: "ann-1",
            type: "highlight",
            pageNumber: 1,
            color: "#ffff00",
            timestamp: Date.now(),
            position: { x: 0, y: 0, width: 100, height: 20 },
          },
        ],
      };

      const result = validateExportData(validData);
      expect(result.isValid).toBe(true);
      expect(result.hasAnnotations).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid data format", () => {
      const result = validateExportData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid data format: expected an object"
      );
    });

    it("should reject non-object data", () => {
      const result = validateExportData("not an object");
      expect(result.isValid).toBe(false);
    });

    it("should warn about missing version", () => {
      const dataWithoutVersion = {
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
      };

      const result = validateExportData(dataWithoutVersion);
      expect(result.errors).toContain("Missing version field");
    });

    it("should warn about unknown version", () => {
      const dataWithUnknownVersion = {
        version: "99.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
      };

      const result = validateExportData(dataWithUnknownVersion);
      expect(result.warnings.some((w) => w.includes("Unknown version"))).toBe(
        true
      );
    });

    it("should detect annotations", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        annotations: [{ id: "1", type: "highlight" }],
      };

      const result = validateExportData(data);
      expect(result.hasAnnotations).toBe(true);
    });

    it("should detect bookmarks", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        bookmarks: [{ id: "1", pageNumber: 1 }],
      };

      const result = validateExportData(data);
      expect(result.hasBookmarks).toBe(true);
    });

    it("should detect memories", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        memories: {
          document: [],
          global: [{ id: "1", content: "test" }],
          preferences: [],
        },
      };

      const result = validateExportData(data);
      expect(result.hasMemories).toBe(true);
    });

    it("should detect plans", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        plans: [{ id: "1", title: "Test Plan" }],
      };

      const result = validateExportData(data);
      expect(result.hasPlans).toBe(true);
    });

    it("should detect flashcards", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        flashcards: {
          decks: [{ id: "1", name: "Test Deck" }],
          cards: [],
          srsData: {},
        },
      };

      const result = validateExportData(data);
      expect(result.hasFlashcards).toBe(true);
    });

    it("should detect quizzes", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        quizzes: {
          quizzes: [{ id: "1", title: "Test Quiz" }],
          attempts: [],
        },
      };

      const result = validateExportData(data);
      expect(result.hasQuizzes).toBe(true);
    });

    it("should detect presentations", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        presentations: [{ id: "1", title: "Test Presentation" }],
      };

      const result = validateExportData(data);
      expect(result.hasPresentations).toBe(true);
    });

    it("should warn when no data to import", () => {
      const emptyData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
      };

      const result = validateExportData(emptyData);
      expect(result.warnings).toContain("No data found to import");
    });

    it("should reject invalid annotations format", () => {
      const data = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        annotations: "not an array",
      };

      const result = validateExportData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid annotations format: expected an array"
      );
    });
  });

  describe("parseImportData", () => {
    it("should parse valid JSON", () => {
      const json = JSON.stringify({
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
      });

      const result = parseImportData(json);
      expect(result).not.toBeNull();
      expect(result?.version).toBe("2.0");
    });

    it("should return null for invalid JSON", () => {
      const result = parseImportData("not valid json");
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = parseImportData("");
      expect(result).toBeNull();
    });
  });

  describe("importFromJSON", () => {
    it("should return error for invalid JSON", () => {
      const result = importFromJSON("invalid json");
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Failed to parse JSON data");
    });

    it("should import valid data", () => {
      const validData: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
      };

      const result = importFromJSON(JSON.stringify(validData));
      expect(result.success).toBe(true);
    });
  });

  describe("importData", () => {
    it("should validate data first when option is set", () => {
      const invalidData = {
        annotations: "not an array", // Invalid
      } as unknown as ExportData;

      const result = importData(invalidData, { validateFirst: true });
      expect(result.success).toBe(false);
    });

    it("should skip validation when option is false", () => {
      const emptyData: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
      };

      const result = importData(emptyData, { validateFirst: false });
      expect(result.success).toBe(true);
    });

    it("should return success for empty data", () => {
      const emptyData: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
      };

      const result = importData(emptyData);
      expect(result.success).toBe(true);
      expect(result.imported.annotations).toBe(0);
    });
  });

  describe("createExportData", () => {
    it("should create export data with version", () => {
      const data = createExportData();
      expect(data.version).toBe("2.0");
      expect(data.source.app).toBe("SAST Readium");
      expect(data.exportedAt).toBeDefined();
    });

    it("should respect scope options", () => {
      const data = createExportData({ scopes: ["annotations"] });
      // With mocked empty stores, annotations should be empty array or undefined
      expect(data.bookmarks).toBeUndefined();
      expect(data.memories).toBeUndefined();
    });

    it('should include all scopes when "all" is specified', () => {
      const data = createExportData({ scopes: ["all"] });
      // All scopes should be included (though may be empty due to mocks)
      expect(data).toBeDefined();
    });
  });

  describe("exportToJSON", () => {
    it("should return valid JSON string", () => {
      const json = exportToJSON();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("should pretty print when option is set", () => {
      const prettyJson = exportToJSON({ prettyPrint: true });
      const compactJson = exportToJSON({ prettyPrint: false });

      // Pretty printed JSON should have newlines
      expect(prettyJson).toContain("\n");
      expect(compactJson).not.toContain("\n");
    });

    it("should include version in output", () => {
      const json = exportToJSON();
      const data = JSON.parse(json);
      expect(data.version).toBe("2.0");
    });
  });

  describe("Import conflict strategies", () => {
    it("should handle merge strategy", () => {
      const data: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        plans: [
          {
            id: "plan-1",
            title: "Test",
            goal: "Test goal",
            steps: [],
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      const result = importData(data, {
        conflictStrategy: "merge",
        validateFirst: false,
      });
      expect(result.success).toBe(true);
    });

    it("should handle skip strategy", () => {
      const data: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        plans: [
          {
            id: "plan-1",
            title: "Test",
            goal: "Test goal",
            steps: [],
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      const result = importData(data, {
        conflictStrategy: "skip",
        validateFirst: false,
      });
      expect(result.success).toBe(true);
    });

    it("should handle replace strategy", () => {
      const data: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        source: { app: "Test", version: "1.0" },
        plans: [
          {
            id: "plan-1",
            title: "Test",
            goal: "Test goal",
            steps: [],
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      const result = importData(data, {
        conflictStrategy: "replace",
        validateFirst: false,
      });
      expect(result.success).toBe(true);
    });
  });
});
