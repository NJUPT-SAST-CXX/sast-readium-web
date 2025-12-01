/**
 * Tests for AI Chat Store (lib/ai-chat-store.ts)
 */

import { act } from "@testing-library/react";
import {
  useAIChatStore,
  AI_MODELS,
  PRESET_PROVIDERS,
  BUILTIN_QUICK_COMMANDS,
  BUILTIN_PROMPT_TEMPLATES,
  SYSTEM_PROMPT_PRESETS,
  TEMPLATE_VARIABLES,
  type Message,
  type PDFContext,
  type CustomProvider,
} from "./ai-chat-store";

// Reset store before each test
beforeEach(() => {
  const store = useAIChatStore.getState();
  // Reset to initial state
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
      ...store.settings,
      apiKeys: {},
      customProviders: [],
      mcpServers: [],
    },
  });
});

describe("AI Chat Store", () => {
  describe("Constants and Presets", () => {
    it("should have AI_MODELS defined", () => {
      expect(AI_MODELS).toBeDefined();
      expect(AI_MODELS.length).toBeGreaterThan(0);
      expect(AI_MODELS[0]).toHaveProperty("id");
      expect(AI_MODELS[0]).toHaveProperty("name");
      expect(AI_MODELS[0]).toHaveProperty("provider");
      expect(AI_MODELS[0]).toHaveProperty("contextWindow");
    });

    it("should have PRESET_PROVIDERS defined", () => {
      expect(PRESET_PROVIDERS).toBeDefined();
      expect(PRESET_PROVIDERS.length).toBeGreaterThan(0);
      expect(PRESET_PROVIDERS[0]).toHaveProperty("name");
      expect(PRESET_PROVIDERS[0]).toHaveProperty("baseURL");
      expect(PRESET_PROVIDERS[0]).toHaveProperty("models");
    });

    it("should have BUILTIN_QUICK_COMMANDS defined", () => {
      expect(BUILTIN_QUICK_COMMANDS).toBeDefined();
      expect(BUILTIN_QUICK_COMMANDS.length).toBeGreaterThan(0);
      expect(BUILTIN_QUICK_COMMANDS[0]).toHaveProperty("name");
      expect(BUILTIN_QUICK_COMMANDS[0]).toHaveProperty("prompt");
    });

    it("should have BUILTIN_PROMPT_TEMPLATES defined", () => {
      expect(BUILTIN_PROMPT_TEMPLATES).toBeDefined();
      expect(BUILTIN_PROMPT_TEMPLATES.length).toBeGreaterThan(0);
    });

    it("should have SYSTEM_PROMPT_PRESETS defined", () => {
      expect(SYSTEM_PROMPT_PRESETS).toBeDefined();
      expect(SYSTEM_PROMPT_PRESETS.length).toBeGreaterThan(0);
      expect(SYSTEM_PROMPT_PRESETS[0]).toHaveProperty("id");
      expect(SYSTEM_PROMPT_PRESETS[0]).toHaveProperty("name");
      expect(SYSTEM_PROMPT_PRESETS[0]).toHaveProperty("prompt");
    });

    it("should have TEMPLATE_VARIABLES defined", () => {
      expect(TEMPLATE_VARIABLES).toBeDefined();
      expect(TEMPLATE_VARIABLES.length).toBeGreaterThan(0);
      expect(TEMPLATE_VARIABLES[0]).toHaveProperty("key");
      expect(TEMPLATE_VARIABLES[0]).toHaveProperty("description");
    });
  });

  describe("UI State Actions", () => {
    it("should toggle sidebar", () => {
      const store = useAIChatStore.getState();
      expect(store.isSidebarOpen).toBe(false);

      act(() => {
        store.toggleSidebar();
      });
      expect(useAIChatStore.getState().isSidebarOpen).toBe(true);

      act(() => {
        store.toggleSidebar();
      });
      expect(useAIChatStore.getState().isSidebarOpen).toBe(false);
    });

    it("should set sidebar open state", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setSidebarOpen(true);
      });
      expect(useAIChatStore.getState().isSidebarOpen).toBe(true);

      act(() => {
        store.setSidebarOpen(false);
      });
      expect(useAIChatStore.getState().isSidebarOpen).toBe(false);
    });

    it("should set loading state", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setLoading(true);
      });
      expect(useAIChatStore.getState().isLoading).toBe(true);

      act(() => {
        store.setLoading(false);
      });
      expect(useAIChatStore.getState().isLoading).toBe(false);
    });

    it("should set error state", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setError("Test error");
      });
      expect(useAIChatStore.getState().error).toBe("Test error");

      act(() => {
        store.setError(null);
      });
      expect(useAIChatStore.getState().error).toBeNull();
    });
  });

  describe("Conversation Actions", () => {
    it("should create a new conversation", () => {
      const store = useAIChatStore.getState();

      let convId: string;
      act(() => {
        convId = store.createConversation("Test Conversation");
      });

      const state = useAIChatStore.getState();
      expect(state.currentConversationId).toBe(convId!);
      expect(state.conversations[convId!]).toBeDefined();
      expect(state.conversations[convId!].title).toBe("Test Conversation");
      expect(state.conversations[convId!].messages).toEqual([]);
    });

    it("should create conversation with PDF context title", () => {
      const store = useAIChatStore.getState();

      // Set PDF context first
      act(() => {
        store.setPDFContext({
          fileName: "test.pdf",
          currentPage: 1,
          totalPages: 10,
        });
      });

      let convId: string;
      act(() => {
        convId = store.createConversation();
      });

      const state = useAIChatStore.getState();
      expect(state.conversations[convId!].title).toBe("Chat: test.pdf");
    });

    it("should delete a conversation", () => {
      const store = useAIChatStore.getState();

      let convId: string;
      act(() => {
        convId = store.createConversation("To Delete");
      });

      expect(useAIChatStore.getState().conversations[convId!]).toBeDefined();

      act(() => {
        store.deleteConversation(convId!);
      });

      const state = useAIChatStore.getState();
      expect(state.conversations[convId!]).toBeUndefined();
      expect(state.currentConversationId).toBeNull();
    });

    it("should update conversation title", () => {
      const store = useAIChatStore.getState();

      let convId: string;
      act(() => {
        convId = store.createConversation("Original Title");
      });

      act(() => {
        store.updateConversationTitle(convId!, "Updated Title");
      });

      expect(useAIChatStore.getState().conversations[convId!].title).toBe(
        "Updated Title"
      );
    });

    it("should add message to conversation", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.createConversation("Test");
      });

      const message: Message = {
        id: "msg_1",
        role: "user",
        content: "Hello",
      };

      act(() => {
        store.addMessage(message);
      });

      const conv = useAIChatStore.getState().getCurrentConversation();
      expect(conv?.messages).toHaveLength(1);
      expect(conv?.messages[0].content).toBe("Hello");
    });

    it("should update message in conversation", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.createConversation("Test");
      });

      const message: Message = {
        id: "msg_1",
        role: "assistant",
        content: "Initial",
      };

      act(() => {
        store.addMessage(message);
      });

      act(() => {
        store.updateMessage("msg_1", { content: "Updated content" });
      });

      const conv = useAIChatStore.getState().getCurrentConversation();
      expect(conv?.messages[0].content).toBe("Updated content");
    });

    it("should clear messages in conversation", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.createConversation("Test");
      });

      act(() => {
        store.addMessage({ id: "msg_1", role: "user", content: "Hello" });
        store.addMessage({ id: "msg_2", role: "assistant", content: "Hi" });
      });

      expect(
        useAIChatStore.getState().getCurrentConversation()?.messages
      ).toHaveLength(2);

      act(() => {
        store.clearMessages();
      });

      expect(
        useAIChatStore.getState().getCurrentConversation()?.messages
      ).toHaveLength(0);
    });

    it("should delete specific message", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.createConversation("Test");
      });

      act(() => {
        store.addMessage({ id: "msg_1", role: "user", content: "Hello" });
        store.addMessage({ id: "msg_2", role: "assistant", content: "Hi" });
      });

      act(() => {
        store.deleteMessage("msg_1");
      });

      const conv = useAIChatStore.getState().getCurrentConversation();
      expect(conv?.messages).toHaveLength(1);
      expect(conv?.messages[0].id).toBe("msg_2");
    });

    it("should get conversation list sorted by updatedAt", () => {
      const store = useAIChatStore.getState();

      // Create first conversation
      act(() => {
        store.createConversation("First");
      });

      // Create second conversation
      act(() => {
        store.createConversation("Second");
      });

      const list = useAIChatStore.getState().getConversationList();
      expect(list).toHaveLength(2);
      // Both conversations should be in the list
      const titles = list.map((c) => c.title);
      expect(titles).toContain("First");
      expect(titles).toContain("Second");
    });
  });

  describe("Settings Actions", () => {
    it("should update settings", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateSettings({ temperature: 0.5, maxTokens: 2048 });
      });

      const state = useAIChatStore.getState();
      expect(state.settings.temperature).toBe(0.5);
      expect(state.settings.maxTokens).toBe(2048);
    });

    it("should set API key", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setAPIKey("openai", "sk-test-key");
      });

      expect(useAIChatStore.getState().settings.apiKeys.openai).toBe(
        "sk-test-key"
      );
    });

    it("should check if API key exists", () => {
      const store = useAIChatStore.getState();

      expect(store.hasAPIKey("openai")).toBe(false);

      act(() => {
        store.setAPIKey("openai", "sk-test-key");
      });

      expect(useAIChatStore.getState().hasAPIKey("openai")).toBe(true);
    });
  });

  describe("PDF Context Actions", () => {
    it("should set PDF context", () => {
      const store = useAIChatStore.getState();

      const context: PDFContext = {
        fileName: "test.pdf",
        currentPage: 5,
        totalPages: 100,
        pageText: "Sample text",
        selectedText: "Selected",
      };

      act(() => {
        store.setPDFContext(context);
      });

      expect(useAIChatStore.getState().pdfContext).toEqual(context);
    });

    it("should update PDF context partially", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setPDFContext({
          fileName: "test.pdf",
          currentPage: 1,
          totalPages: 10,
        });
      });

      act(() => {
        store.updatePDFContext({
          currentPage: 5,
          selectedText: "New selection",
        });
      });

      const context = useAIChatStore.getState().pdfContext;
      expect(context?.currentPage).toBe(5);
      expect(context?.selectedText).toBe("New selection");
      expect(context?.fileName).toBe("test.pdf");
    });

    it("should clear PDF context", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setPDFContext({
          fileName: "test.pdf",
          currentPage: 1,
          totalPages: 10,
        });
      });

      act(() => {
        store.setPDFContext(null);
      });

      expect(useAIChatStore.getState().pdfContext).toBeNull();
    });
  });

  describe("Token Usage Actions", () => {
    it("should update session usage", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateSessionUsage({
          inputTokens: 100,
          outputTokens: 50,
          reasoningTokens: 10,
          cachedInputTokens: 5,
          totalTokens: 165,
        });
      });

      const usage = useAIChatStore.getState().sessionUsage;
      expect(usage.totalInputTokens).toBe(100);
      expect(usage.totalOutputTokens).toBe(50);
      expect(usage.totalReasoningTokens).toBe(10);
      expect(usage.totalCachedTokens).toBe(5);
      expect(usage.messageCount).toBe(1);
    });

    it("should accumulate session usage", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateSessionUsage({
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        });
      });

      act(() => {
        store.updateSessionUsage({
          inputTokens: 200,
          outputTokens: 100,
          totalTokens: 300,
        });
      });

      const usage = useAIChatStore.getState().sessionUsage;
      expect(usage.totalInputTokens).toBe(300);
      expect(usage.totalOutputTokens).toBe(150);
      expect(usage.messageCount).toBe(2);
    });

    it("should reset session usage", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateSessionUsage({
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        });
      });

      act(() => {
        store.resetSessionUsage();
      });

      const usage = useAIChatStore.getState().sessionUsage;
      expect(usage.totalInputTokens).toBe(0);
      expect(usage.totalOutputTokens).toBe(0);
      expect(usage.messageCount).toBe(0);
    });

    it("should get total used tokens", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateSessionUsage({
          inputTokens: 100,
          outputTokens: 50,
          reasoningTokens: 25,
          totalTokens: 175,
        });
      });

      expect(useAIChatStore.getState().getTotalUsedTokens()).toBe(175);
    });

    it("should get context window size", () => {
      const store = useAIChatStore.getState();
      const contextWindow = store.getContextWindowSize();
      expect(contextWindow).toBeGreaterThan(0);
    });
  });

  describe("Custom Provider Actions", () => {
    it("should add custom provider", () => {
      const store = useAIChatStore.getState();

      const provider: Omit<CustomProvider, "id"> = {
        name: "Test Provider",
        baseURL: "https://api.test.com/v1",
        models: [
          {
            id: "test-model",
            name: "Test Model",
            contextWindow: 8000,
            supportsVision: false,
          },
        ],
        isEnabled: true,
      };

      let providerId: string;
      act(() => {
        providerId = store.addCustomProvider(provider);
      });

      const customProviders =
        useAIChatStore.getState().settings.customProviders;
      expect(customProviders).toHaveLength(1);
      expect(customProviders[0].id).toBe(providerId!);
      expect(customProviders[0].name).toBe("Test Provider");
    });

    it("should update custom provider", () => {
      const store = useAIChatStore.getState();

      let providerId: string;
      act(() => {
        providerId = store.addCustomProvider({
          name: "Original",
          baseURL: "https://api.test.com/v1",
          models: [],
          isEnabled: true,
        });
      });

      act(() => {
        store.updateCustomProvider(providerId!, { name: "Updated" });
      });

      const provider = useAIChatStore.getState().settings.customProviders[0];
      expect(provider.name).toBe("Updated");
    });

    it("should delete custom provider", () => {
      const store = useAIChatStore.getState();

      let providerId: string;
      act(() => {
        providerId = store.addCustomProvider({
          name: "To Delete",
          baseURL: "https://api.test.com/v1",
          models: [],
          isEnabled: true,
        });
      });

      act(() => {
        store.deleteCustomProvider(providerId!);
      });

      expect(useAIChatStore.getState().settings.customProviders).toHaveLength(
        0
      );
    });

    it("should add preset provider", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.addPresetProvider(0); // First preset (DeepSeek)
      });

      const customProviders =
        useAIChatStore.getState().settings.customProviders;
      expect(customProviders).toHaveLength(1);
      expect(customProviders[0].name).toBe(PRESET_PROVIDERS[0].name);
    });
  });

  describe("MCP Server Actions", () => {
    it("should add MCP server", () => {
      const store = useAIChatStore.getState();

      let serverId: string;
      act(() => {
        serverId = store.addMCPServer({
          name: "Test MCP",
          type: "sse",
          url: "https://mcp.test.com",
          enabled: true,
        });
      });

      const servers = useAIChatStore.getState().settings.mcpServers;
      expect(servers).toHaveLength(1);
      expect(servers[0].id).toBe(serverId!);
      expect(servers[0].name).toBe("Test MCP");
    });

    it("should toggle MCP server", () => {
      const store = useAIChatStore.getState();

      let serverId: string;
      act(() => {
        serverId = store.addMCPServer({
          name: "Test MCP",
          type: "sse",
          url: "https://mcp.test.com",
          enabled: true,
        });
      });

      act(() => {
        store.toggleMCPServer(serverId!);
      });

      expect(useAIChatStore.getState().settings.mcpServers[0].enabled).toBe(
        false
      );
    });

    it("should get enabled MCP servers", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.addMCPServer({
          name: "Enabled",
          type: "sse",
          url: "https://mcp1.test.com",
          enabled: true,
        });
        store.addMCPServer({
          name: "Disabled",
          type: "sse",
          url: "https://mcp2.test.com",
          enabled: false,
        });
      });

      const enabled = useAIChatStore.getState().getEnabledMCPServers();
      expect(enabled).toHaveLength(1);
      expect(enabled[0].name).toBe("Enabled");
    });
  });

  describe("Quick Commands Actions", () => {
    it("should have default quick commands", () => {
      const store = useAIChatStore.getState();
      expect(store.settings.quickCommands.length).toBeGreaterThan(0);
    });

    it("should add custom quick command", () => {
      const store = useAIChatStore.getState();
      const initialCount = store.settings.quickCommands.length;

      let cmdId: string;
      act(() => {
        cmdId = store.addQuickCommand({
          name: "Custom Command",
          description: "Test command",
          prompt: "Do something with {{selection}}",
          category: "custom",
          enabled: true,
        });
      });

      const commands = useAIChatStore.getState().settings.quickCommands;
      expect(commands.length).toBe(initialCount + 1);
      expect(commands.find((c) => c.id === cmdId!)?.name).toBe(
        "Custom Command"
      );
    });

    it("should toggle quick command", () => {
      const store = useAIChatStore.getState();
      const firstCmd = store.settings.quickCommands[0];
      const initialEnabled = firstCmd.enabled;

      act(() => {
        store.toggleQuickCommand(firstCmd.id);
      });

      const updated = useAIChatStore
        .getState()
        .settings.quickCommands.find((c) => c.id === firstCmd.id);
      expect(updated?.enabled).toBe(!initialEnabled);
    });

    it("should get enabled quick commands", () => {
      const store = useAIChatStore.getState();
      const enabled = store.getEnabledQuickCommands();
      expect(enabled.every((c) => c.enabled)).toBe(true);
    });

    it("should reset quick commands to defaults", () => {
      const store = useAIChatStore.getState();

      // Add a custom command
      act(() => {
        store.addQuickCommand({
          name: "Custom",
          description: "Test",
          prompt: "Test",
          category: "custom",
          enabled: true,
        });
      });

      act(() => {
        store.resetQuickCommands();
      });

      const commands = useAIChatStore.getState().settings.quickCommands;
      expect(commands.every((c) => c.category === "builtin")).toBe(true);
    });
  });

  describe("Prompt Templates Actions", () => {
    it("should have default prompt templates", () => {
      const store = useAIChatStore.getState();
      expect(store.settings.promptTemplates.length).toBeGreaterThan(0);
    });

    it("should add custom prompt template", () => {
      const store = useAIChatStore.getState();
      const initialCount = store.settings.promptTemplates.length;

      let tplId: string;
      act(() => {
        tplId = store.addPromptTemplate({
          name: "Custom Template",
          description: "Test template",
          content: "Template content {{selection}}",
          category: "Custom",
          isBuiltin: false,
        });
      });

      const templates = useAIChatStore.getState().settings.promptTemplates;
      expect(templates.length).toBe(initialCount + 1);
      expect(templates.find((t) => t.id === tplId!)?.name).toBe(
        "Custom Template"
      );
    });

    it("should get templates by category", () => {
      const store = useAIChatStore.getState();
      const academic = store.getPromptTemplatesByCategory("Academic");
      expect(academic.every((t) => t.category === "Academic")).toBe(true);
    });

    it("should reset prompt templates to defaults", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.addPromptTemplate({
          name: "Custom",
          description: "Test",
          content: "Test",
          category: "Custom",
          isBuiltin: false,
        });
      });

      act(() => {
        store.resetPromptTemplates();
      });

      const templates = useAIChatStore.getState().settings.promptTemplates;
      expect(templates.every((t) => t.isBuiltin)).toBe(true);
    });
  });

  describe("Template Processing", () => {
    it("should process template with PDF context", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setPDFContext({
          fileName: "test.pdf",
          currentPage: 5,
          totalPages: 100,
          selectedText: "Selected text here",
          pageText: "Full page text",
        });
      });

      const result = store.processTemplate(
        "File: {{fileName}}, Page: {{page}}/{{totalPages}}, Selection: {{selection}}"
      );

      expect(result).toContain("test.pdf");
      expect(result).toContain("5");
      expect(result).toContain("100");
      expect(result).toContain("Selected text here");
    });

    it("should process template with extra variables", () => {
      const store = useAIChatStore.getState();

      const result = store.processTemplate("Translate to {{language}}", {
        language: "Spanish",
      });

      expect(result).toContain("Spanish");
    });

    it("should use default values when context is missing", () => {
      const store = useAIChatStore.getState();

      const result = store.processTemplate(
        "Page: {{page}}, File: {{fileName}}"
      );

      expect(result).toContain("1"); // Default page
      expect(result).toContain("Document"); // Default filename
    });
  });

  describe("Deep Research Actions", () => {
    it("should start research workflow", () => {
      const store = useAIChatStore.getState();

      let researchId: string;
      act(() => {
        researchId = store.startResearch("Test research query");
      });

      const research = useAIChatStore.getState().currentResearch;
      expect(research).not.toBeNull();
      expect(research?.id).toBe(researchId!);
      expect(research?.query).toBe("Test research query");
      expect(research?.status).toBe("planning");
    });

    it("should add research step", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.startResearch("Test query");
      });

      let stepId: string;
      act(() => {
        stepId = store.addResearchStep({
          type: "search",
          status: "running",
          title: "Searching documents",
        });
      });

      const research = useAIChatStore.getState().currentResearch;
      expect(research?.steps).toHaveLength(1);
      expect(research?.steps[0].id).toBe(stepId!);
    });

    it("should update research step", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.startResearch("Test query");
      });

      let stepId: string;
      act(() => {
        stepId = store.addResearchStep({
          type: "search",
          status: "running",
          title: "Searching",
        });
      });

      act(() => {
        store.updateResearchStep(stepId!, {
          status: "complete",
          result: "Found results",
        });
      });

      const step = useAIChatStore.getState().currentResearch?.steps[0];
      expect(step?.status).toBe("complete");
      expect(step?.result).toBe("Found results");
    });

    it("should complete research", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.startResearch("Test query");
      });

      act(() => {
        store.completeResearch("Final research report");
      });

      const state = useAIChatStore.getState();
      expect(state.currentResearch?.status).toBe("complete");
      expect(state.currentResearch?.finalReport).toBe("Final research report");
      expect(state.researchHistory).toHaveLength(1);
    });

    it("should cancel research", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.startResearch("Test query");
      });

      act(() => {
        store.cancelResearch();
      });

      expect(useAIChatStore.getState().currentResearch?.status).toBe(
        "cancelled"
      );
    });

    it("should clear current research", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.startResearch("Test query");
      });

      act(() => {
        store.clearCurrentResearch();
      });

      expect(useAIChatStore.getState().currentResearch).toBeNull();
    });
  });

  describe("Media Settings Actions", () => {
    it("should update image settings", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateImageSettings({ model: "dall-e-2", size: "512x512" });
      });

      const settings = useAIChatStore.getState().settings.imageSettings;
      expect(settings.model).toBe("dall-e-2");
      expect(settings.size).toBe("512x512");
    });

    it("should update speech settings", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateSpeechSettings({ voice: "nova", speed: 1.5 });
      });

      const settings = useAIChatStore.getState().settings.speechSettings;
      expect(settings.voice).toBe("nova");
      expect(settings.speed).toBe(1.5);
    });

    it("should update transcription settings", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.updateTranscriptionSettings({ language: "en" });
      });

      const settings = useAIChatStore.getState().settings.transcriptionSettings;
      expect(settings.language).toBe("en");
    });
  });

  describe("Helper Functions", () => {
    it("should get all models including custom", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.addCustomProvider({
          name: "Custom Provider",
          baseURL: "https://api.custom.com/v1",
          models: [
            {
              id: "custom-model",
              name: "Custom Model",
              contextWindow: 8000,
              supportsVision: false,
            },
          ],
          isEnabled: true,
        });
      });

      const allModels = useAIChatStore.getState().getAllModels();
      expect(allModels.length).toBeGreaterThan(AI_MODELS.length);
      expect(allModels.some((m) => m.id === "custom-model")).toBe(true);
    });

    it("should get provider API key", () => {
      const store = useAIChatStore.getState();

      act(() => {
        store.setAPIKey("openai", "sk-test-key");
      });

      expect(store.getProviderAPIKey("openai")).toBe("sk-test-key");
    });
  });
});
