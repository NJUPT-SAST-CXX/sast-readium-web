/**
 * Tests for useAIChat hook (hooks/use-ai-chat.ts)
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAIChat } from "./use-ai-chat";
import { useAIChatStore } from "@/lib/ai/core";

// Mock chatStream but keep the rest of the module
jest.mock("@/lib/ai/core", () => {
  const actual = jest.requireActual("@/lib/ai/core");
  return {
    ...actual,
    chatStream: jest.fn(),
  };
});

// Mock the platform module
jest.mock("@/lib/platform", () => ({
  getAPIKeySecurely: jest.fn(),
  isTauri: jest.fn(() => false),
}));

// Import after mocks
import * as aiCore from "@/lib/ai/core";
import * as platform from "@/lib/platform";

// Get references to mocked functions
const aiService = {
  chatStream: aiCore.chatStream as jest.MockedFunction<
    typeof aiCore.chatStream
  >,
};
const tauriBridgeAI = platform;

// Reset store before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset store to initial state
  useAIChatStore.setState({
    isSidebarOpen: false,
    isLoading: false,
    error: null,
    conversations: {},
    currentConversationId: null,
    pdfContext: null,
    sessionUsage: {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalReasoningTokens: 0,
      totalCachedTokens: 0,
      messageCount: 0,
    },
    currentResearch: null,
    researchHistory: [],
    settings: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
      apiKeys: {},
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
  });
});

describe("useAIChat", () => {
  describe("Initial State", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useAIChat());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamingMessageId).toBeNull();
    });

    it("should have sendMessage function", () => {
      const { result } = renderHook(() => useAIChat());
      expect(typeof result.current.sendMessage).toBe("function");
    });

    it("should have retryLastMessage function", () => {
      const { result } = renderHook(() => useAIChat());
      expect(typeof result.current.retryLastMessage).toBe("function");
    });

    it("should have stopStreaming function", () => {
      const { result } = renderHook(() => useAIChat());
      expect(typeof result.current.stopStreaming).toBe("function");
    });

    it("should have clearError function", () => {
      const { result } = renderHook(() => useAIChat());
      expect(typeof result.current.clearError).toBe("function");
    });
  });

  describe("API Key Loading", () => {
    it("should attempt to load API key on mount", async () => {
      (tauriBridgeAI.getAPIKeySecurely as jest.Mock).mockResolvedValue(
        "sk-test-key"
      );

      renderHook(() => useAIChat());

      await waitFor(() => {
        expect(tauriBridgeAI.getAPIKeySecurely).toHaveBeenCalledWith("openai");
      });
    });

    it("should handle API key loading error gracefully", async () => {
      (tauriBridgeAI.getAPIKeySecurely as jest.Mock).mockRejectedValue(
        new Error("Failed")
      );

      const { result } = renderHook(() => useAIChat());

      await waitFor(() => {
        expect(tauriBridgeAI.getAPIKeySecurely).toHaveBeenCalled();
      });

      // Should not crash
      expect(result.current.error).toBeNull();
    });
  });

  describe("sendMessage", () => {
    it("should set error for empty message", async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("");
      });

      expect(useAIChatStore.getState().error).toBe("Message cannot be empty");
    });

    it("should set error for whitespace-only message", async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("   ");
      });

      expect(useAIChatStore.getState().error).toBe("Message cannot be empty");
    });

    it("should set error when API key is missing", async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(useAIChatStore.getState().error).toContain("API key");
    });

    it("should create conversation if none exists", async () => {
      // Set API key
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      // Mock successful stream
      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], undefined);
          return { text: "Response", toolInvocations: [], suggestions: [] };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(useAIChatStore.getState().currentConversationId).not.toBeNull();
    });

    it("should add user message to conversation", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], undefined);
          return { text: "Response", toolInvocations: [], suggestions: [] };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      const conversation = useAIChatStore.getState().getCurrentConversation();
      expect(
        conversation?.messages.some(
          (m) => m.role === "user" && m.content === "Hello"
        )
      ).toBe(true);
    });

    it("should call chatStream with correct config", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], undefined);
          return { text: "Response", toolInvocations: [], suggestions: [] };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(aiService.chatStream).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "openai",
          model: "gpt-4o-mini",
          apiKey: "sk-test-key",
        }),
        expect.any(Object)
      );
    });

    it("should handle streaming updates", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          // Simulate streaming updates
          options.onUpdate?.("Partial", []);
          options.onUpdate?.("Partial response", []);
          options.onFinish?.("Complete response", [], [], undefined);
          return {
            text: "Complete response",
            toolInvocations: [],
            suggestions: [],
          };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      const conversation = useAIChatStore.getState().getCurrentConversation();
      const assistantMessage = conversation?.messages.find(
        (m) => m.role === "assistant"
      );
      expect(assistantMessage?.content).toBe("Complete response");
    });

    it("should handle errors from chatStream", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onError?.(new Error("API Error"));
          throw new Error("API Error");
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(useAIChatStore.getState().error).toBe("API Error");
    });

    it("should update session usage on finish", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockUsage = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
      };

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], mockUsage);
          return {
            text: "Response",
            toolInvocations: [],
            suggestions: [],
            usage: mockUsage,
          };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      const usage = useAIChatStore.getState().sessionUsage;
      expect(usage.totalInputTokens).toBe(100);
      expect(usage.totalOutputTokens).toBe(50);
    });
  });

  describe("retryLastMessage", () => {
    it("should do nothing if no conversation exists", async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.retryLastMessage();
      });

      // Should not throw or cause issues
      expect(useAIChatStore.getState().currentConversationId).toBeNull();
    });

    it("should retry last user message", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      let callCount = 0;
      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          callCount++;
          options.onFinish?.(`Response ${callCount}`, [], [], undefined);
          return {
            text: `Response ${callCount}`,
            toolInvocations: [],
            suggestions: [],
          };
        }
      );

      const { result } = renderHook(() => useAIChat());

      // Send initial message
      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      // Retry
      await act(async () => {
        await result.current.retryLastMessage();
      });

      expect(callCount).toBe(2);
    });
  });

  describe("stopStreaming", () => {
    it("should call abort on streaming", async () => {
      const { result } = renderHook(() => useAIChat());

      // The stopStreaming function should be callable without error
      act(() => {
        result.current.stopStreaming();
      });

      // After stopping, isStreaming should be false
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      useAIChatStore.getState().setError("Test error");

      const { result } = renderHook(() => useAIChat());

      act(() => {
        result.current.clearError();
      });

      expect(useAIChatStore.getState().error).toBeNull();
    });
  });

  describe("PDF Context Integration", () => {
    it("should include PDF context when enabled", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      useAIChatStore.getState().setPDFContext({
        fileName: "test.pdf",
        currentPage: 5,
        totalPages: 100,
      });

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], undefined);
          return { text: "Response", toolInvocations: [], suggestions: [] };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Summarize this page");
      });

      expect(aiService.chatStream).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          pdfContext: expect.objectContaining({
            fileName: "test.pdf",
            currentPage: 5,
          }),
        })
      );
    });

    it("should not include PDF context when disabled", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      useAIChatStore.getState().updateSettings({ includePDFContext: false });
      useAIChatStore.getState().setPDFContext({
        fileName: "test.pdf",
        currentPage: 5,
        totalPages: 100,
      });

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], undefined);
          return { text: "Response", toolInvocations: [], suggestions: [] };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(aiService.chatStream).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          pdfContext: null,
        })
      );
    });
  });

  describe("MCP Tools Integration", () => {
    it("should include enabled MCP servers", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      useAIChatStore.getState().updateSettings({ enableMCPTools: true });
      useAIChatStore.getState().addMCPServer({
        name: "Test MCP",
        type: "sse",
        url: "https://mcp.test.com",
        enabled: true,
      });

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], undefined);
          return { text: "Response", toolInvocations: [], suggestions: [] };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(aiService.chatStream).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          mcpServers: expect.arrayContaining([
            expect.objectContaining({ name: "Test MCP" }),
          ]),
        })
      );
    });

    it("should not include MCP servers when disabled", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      useAIChatStore.getState().updateSettings({ enableMCPTools: false });
      useAIChatStore.getState().addMCPServer({
        name: "Test MCP",
        type: "sse",
        url: "https://mcp.test.com",
        enabled: true,
      });

      (aiService.chatStream as jest.Mock).mockImplementation(
        async (config, options) => {
          options.onFinish?.("Response", [], [], undefined);
          return { text: "Response", toolInvocations: [], suggestions: [] };
        }
      );

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(aiService.chatStream).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          mcpServers: [],
        })
      );
    });
  });
});
