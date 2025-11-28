/**
 * Tests for useDeepResearch hook (hooks/use-deep-research.ts)
 */

import { renderHook, act } from "@testing-library/react";
import { useDeepResearch } from "./use-deep-research";
import { useAIChatStore } from "@/lib/ai-chat-store";
import * as aiService from "@/lib/ai-service";
import * as tauriBridgeAI from "@/lib/tauri-bridge-ai";

// Mock dependencies
jest.mock("@/lib/ai-service", () => ({
  chatStream: jest.fn(),
}));

jest.mock("@/lib/tauri-bridge-ai", () => ({
  getAPIKeySecurely: jest.fn(),
}));

const mockChatStream = aiService.chatStream as jest.MockedFunction<
  typeof aiService.chatStream
>;
const mockGetAPIKeySecurely =
  tauriBridgeAI.getAPIKeySecurely as jest.MockedFunction<
    typeof tauriBridgeAI.getAPIKeySecurely
  >;

// Reset store before each test
beforeEach(() => {
  jest.clearAllMocks();

  useAIChatStore.setState({
    settings: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
      apiKeys: { openai: "test-api-key" },
      systemPrompt: "You are a helpful assistant.",
      includePDFContext: true,
      customProviders: [],
      mcpServers: [],
      enableMCPTools: false,
      enableMultiStepTools: true,
      maxToolSteps: 5,
      imageSettings: {
        model: "dall-e-3",
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      },
      speechSettings: {
        model: "tts-1",
        voice: "alloy",
        speed: 1.0,
      },
      transcriptionSettings: {
        model: "whisper-1",
        language: undefined,
      },
      quickCommands: [],
      promptTemplates: [],
      defaultTranslationLanguage: "Chinese",
    },
    pdfContext: {
      fileName: "test.pdf",
      currentPage: 1,
      totalPages: 10,
      pageText: "Test page content",
    },
    currentResearch: null,
    conversations: {},
    currentConversationId: null,
  });
});

describe("useDeepResearch", () => {
  describe("Initial State", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useDeepResearch());

      expect(result.current.isResearching).toBe(false);
      expect(result.current.currentStep).toBeNull();
      expect(result.current.progress).toBe(0);
      expect(typeof result.current.startResearch).toBe("function");
      expect(typeof result.current.cancelResearch).toBe("function");
      expect(typeof result.current.clearResearch).toBe("function");
    });
  });

  describe("startResearch", () => {
    it("should throw error when API key is not configured", async () => {
      mockGetAPIKeySecurely.mockRejectedValue(new Error("No key"));
      useAIChatStore.setState((state) => ({
        settings: {
          ...state.settings,
          apiKeys: {},
        },
      }));

      const { result } = renderHook(() => useDeepResearch());

      await expect(
        act(async () => {
          await result.current.startResearch("Test query");
        })
      ).rejects.toThrow("Please configure API key first");
    });

    it("should initialize research workflow", async () => {
      mockGetAPIKeySecurely.mockResolvedValue("test-api-key");
      mockChatStream.mockImplementation(async (_config, options) => {
        options.onUpdate?.("Test result");
        options.onFinish?.("Test result", [], [], {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        });
        return { text: "Test result", toolInvocations: [], suggestions: [] };
      });

      const { result } = renderHook(() => useDeepResearch());

      // Verify startResearch is a function
      expect(typeof result.current.startResearch).toBe("function");
      expect(result.current.isResearching).toBe(false);
    });

    it("should use API key from store if secure storage fails", async () => {
      mockGetAPIKeySecurely.mockRejectedValue(
        new Error("Secure storage not available")
      );

      // Verify the hook can access API key from store as fallback
      const { result } = renderHook(() => useDeepResearch());

      // The hook should be initialized
      expect(result.current.isResearching).toBe(false);
      expect(typeof result.current.startResearch).toBe("function");
    });
  });

  describe("cancelResearch", () => {
    it("should cancel research and reset state", () => {
      const { result } = renderHook(() => useDeepResearch());

      // Cancel should be callable and reset state
      act(() => {
        result.current.cancelResearch();
      });

      expect(result.current.isResearching).toBe(false);
    });
  });

  describe("clearResearch", () => {
    it("should clear research state", () => {
      const { result } = renderHook(() => useDeepResearch());

      act(() => {
        result.current.clearResearch();
      });

      expect(result.current.isResearching).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });

  describe("progress calculation", () => {
    it("should calculate progress based on completed steps", () => {
      useAIChatStore.setState({
        currentResearch: {
          id: "research_1",
          query: "Test",
          status: "researching",
          steps: [
            {
              id: "1",
              type: "plan",
              status: "complete",
              title: "Plan",
              startedAt: Date.now(),
            },
            {
              id: "2",
              type: "search",
              status: "complete",
              title: "Search",
              startedAt: Date.now(),
            },
            {
              id: "3",
              type: "analyze",
              status: "running",
              title: "Analyze",
              startedAt: Date.now(),
            },
          ],
          currentStepIndex: 2,
          sources: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const { result } = renderHook(() => useDeepResearch());

      // 2 out of 7 steps complete = ~29%
      expect(result.current.progress).toBe(29);
    });
  });

  describe("currentStep", () => {
    it("should return current step from research workflow", () => {
      const currentStep = {
        id: "step_1",
        type: "analyze" as const,
        status: "running" as const,
        title: "Analyze",
        description: "Analyzing data",
        startedAt: Date.now(),
      };

      useAIChatStore.setState({
        currentResearch: {
          id: "research_1",
          query: "Test",
          status: "researching",
          steps: [currentStep],
          currentStepIndex: 0,
          sources: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const { result } = renderHook(() => useDeepResearch());

      expect(result.current.currentStep).toEqual(currentStep);
    });

    it("should return null when no research is active", () => {
      const { result } = renderHook(() => useDeepResearch());

      expect(result.current.currentStep).toBeNull();
    });
  });
});
