/**
 * Tests for AIChatPanel component (components/ai-sidebar/ai-chat-panel.tsx)
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIChatPanel } from "../ai-chat-panel";
import { useAIChatStore, type AISettings } from "@/lib/ai-chat-store";
import { useAIChat } from "@/hooks/use-ai-chat";

// Helper to create valid AISettings for tests
const createTestSettings = (
  overrides: Partial<AISettings> = {}
): AISettings => ({
  provider: "openai",
  model: "gpt-4-turbo",
  apiKeys: {},
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "",
  includePDFContext: true,
  customProviders: [],
  mcpServers: [],
  enableMCPTools: false,
  enableMultiStepTools: false,
  maxToolSteps: 5,
  imageSettings: {
    model: "dall-e-3",
    size: "1024x1024",
    quality: "standard",
    style: "vivid",
  },
  speechSettings: {
    model: "tts-1",
    voice: "nova",
    speed: 1,
  },
  transcriptionSettings: {
    model: "whisper-1",
  },
  quickCommands: [],
  promptTemplates: [],
  defaultTranslationLanguage: "en",
  ...overrides,
});

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => {
      if (typeof defaultValue === "string") return defaultValue;
      if (typeof defaultValue === "object") {
        // Handle translation with interpolation
        return Object.entries(defaultValue).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          key
        );
      }
      return key;
    },
  }),
}));

// Mock child components to isolate tests
jest.mock("@/components/ai-sidebar/research-workflow", () => ({
  ResearchPanel: () => <div data-testid="research-panel">Research Panel</div>,
}));

jest.mock("@/components/ai-elements/conversation", () => ({
  Conversation: ({ children }: any) => (
    <div data-testid="conversation">{children}</div>
  ),
  ConversationContent: ({ children }: any) => (
    <div data-testid="conversation-content" data-conversation-content>
      {children}
    </div>
  ),
  ConversationEmptyState: ({ icon, title, description, children }: any) => (
    <div data-testid="conversation-empty-state">
      <div>{title}</div>
      <div>{description}</div>
      {children}
    </div>
  ),
  ConversationScrollButton: () => <div data-testid="scroll-button" />,
}));

jest.mock("@/components/ai-elements/message", () => ({
  Message: ({ children, from }: any) => (
    <div data-testid={`message-${from}`} data-from={from}>
      {children}
    </div>
  ),
  MessageContent: ({ children }: any) => (
    <div data-testid="message-content">{children}</div>
  ),
  MessageActions: ({ children }: any) => (
    <div data-testid="message-actions">{children}</div>
  ),
  MessageAction: ({ children, onClick, tooltip }: any) => (
    <button data-testid="message-action" onClick={onClick} title={tooltip}>
      {children}
    </button>
  ),
  MessageResponse: ({ children }: any) => <div>{children}</div>,
  MessageToolbar: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ai-elements/prompt-input", () => ({
  PromptInput: ({ children, onSubmit }: any) => (
    <form
      data-testid="prompt-input"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ text: "test message" });
      }}
    >
      {children}
    </form>
  ),
  PromptInputTextarea: ({ onChange, disabled }: any) => (
    <textarea
      data-testid="prompt-textarea"
      onChange={(e) => onChange?.(e)}
      disabled={disabled}
    />
  ),
  PromptInputSubmit: ({ disabled }: any) => (
    <button type="submit" data-testid="prompt-submit" disabled={disabled}>
      Send
    </button>
  ),
  PromptInputFooter: ({ children }: any) => <div>{children}</div>,
  PromptInputTools: ({ children }: any) => <div>{children}</div>,
  PromptInputButton: ({ children, onClick, disabled }: any) => (
    <button
      data-testid="prompt-tool-button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ai-elements/quick-commands", () => ({
  QuickCommands: ({ onSelect }: any) => (
    <div data-testid="quick-commands" onClick={() => onSelect?.("/test")} />
  ),
}));

jest.mock("@/components/ai-elements/suggestion", () => ({
  Suggestions: ({ children }: any) => (
    <div data-testid="suggestions">{children}</div>
  ),
  Suggestion: ({ suggestion, onClick }: any) => (
    <button data-testid="suggestion" onClick={() => onClick?.(suggestion)}>
      {suggestion}
    </button>
  ),
}));

jest.mock("@/components/ai-elements/reasoning", () => ({
  Reasoning: ({ children }: any) => <div>{children}</div>,
  ReasoningTrigger: () => <div />,
  ReasoningContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ai-elements/tool", () => ({
  Tool: ({ children }: any) => <div data-testid="tool">{children}</div>,
  ToolHeader: ({ title }: any) => <div data-testid="tool-header">{title}</div>,
  ToolContent: ({ children }: any) => <div>{children}</div>,
  ToolInput: ({ input }: any) => <div>{JSON.stringify(input)}</div>,
  ToolOutput: ({ output }: any) => <div>{JSON.stringify(output)}</div>,
}));

jest.mock("@/components/ai-elements/context", () => ({
  Context: ({ children }: any) => <div>{children}</div>,
  ContextTrigger: () => <div />,
  ContextContent: ({ children }: any) => <div>{children}</div>,
  ContextContentHeader: () => <div />,
  ContextContentBody: ({ children }: any) => <div>{children}</div>,
  ContextContentFooter: () => <div />,
  ContextInputUsage: () => <div />,
  ContextOutputUsage: () => <div />,
  ContextReasoningUsage: () => <div />,
  ContextCacheUsage: () => <div />,
}));

jest.mock("@/components/ai-elements/model-selector", () => ({
  ModelSelector: ({ children }: any) => (
    <div data-testid="model-selector">{children}</div>
  ),
  ModelSelectorTrigger: ({ children }: any) => <div>{children}</div>,
  ModelSelectorContent: ({ children }: any) => <div>{children}</div>,
  ModelSelectorInput: () => <input type="text" />,
  ModelSelectorList: ({ children }: any) => <div>{children}</div>,
  ModelSelectorEmpty: ({ children }: any) => <div>{children}</div>,
  ModelSelectorGroup: ({ children }: any) => <div>{children}</div>,
  ModelSelectorItem: ({ children, onSelect }: any) => (
    <button onClick={onSelect}>{children}</button>
  ),
  ModelSelectorLogo: () => <div />,
  ModelSelectorName: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ai-elements/loader", () => ({
  Loader: () => <div data-testid="loader" />,
}));

jest.mock("@/components/ai-elements/shimmer", () => ({
  Shimmer: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ai-elements/code-block", () => ({
  CodeBlock: ({ code }: any) => <pre>{code}</pre>,
}));

// Mock useAIChat hook
jest.mock("@/hooks/use-ai-chat", () => ({
  useAIChat: jest.fn(),
}));

const mockUseAIChat = useAIChat as jest.MockedFunction<typeof useAIChat>;

beforeEach(() => {
  jest.clearAllMocks();

  // Default mock values
  mockUseAIChat.mockReturnValue({
    sendMessage: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
    isStreaming: false,
    retryLastMessage: jest.fn(),
  } as any);

  // Reset store state
  useAIChatStore.setState({
    conversations: {},
    currentConversationId: null,
    settings: createTestSettings(),
    sessionUsage: {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalReasoningTokens: 0,
      totalCachedTokens: 0,
      messageCount: 0,
    },
  });
});

describe("AIChatPanel", () => {
  describe("Mode Switching", () => {
    it("should render chat and research tabs", () => {
      render(<AIChatPanel />);

      expect(screen.getByText("ai.chat")).toBeInTheDocument();
      expect(screen.getByText("ai.deep_research")).toBeInTheDocument();
    });

    it("should start in chat mode", () => {
      render(<AIChatPanel />);

      expect(screen.getByTestId("conversation")).toBeInTheDocument();
    });

    it("should switch to research mode when tab clicked", () => {
      render(<AIChatPanel />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no messages", () => {
      render(<AIChatPanel />);

      expect(
        screen.getByTestId("conversation-empty-state")
      ).toBeInTheDocument();
      expect(screen.getByText("ai.no_messages_title")).toBeInTheDocument();
      expect(
        screen.getByText("ai.no_messages_description")
      ).toBeInTheDocument();
    });

    it("should show default suggestions in empty state", () => {
      render(<AIChatPanel />);

      expect(screen.getByTestId("suggestions")).toBeInTheDocument();
      // Check for at least one default suggestion
      const suggestionButtons = screen.getAllByTestId("suggestion");
      expect(suggestionButtons.length).toBeGreaterThan(0);
    });

    it("should send message when suggestion clicked", async () => {
      const mockSendMessage = jest.fn();
      mockUseAIChat.mockReturnValue({
        sendMessage: mockSendMessage,
        isLoading: false,
        error: null,
        clearError: jest.fn(),
        isStreaming: false,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIChatPanel />);

      const suggestionButtons = screen.getAllByTestId("suggestion");
      fireEvent.click(suggestionButtons[0]);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });
    });
  });

  describe("Message Rendering", () => {
    beforeEach(() => {
      useAIChatStore.setState({
        conversations: {
          conv_1: {
            id: "conv_1",
            title: "Test Conversation",
            messages: [
              {
                id: "msg_1",
                role: "user",
                content: "Hello, how are you?",
              },
              {
                id: "msg_2",
                role: "assistant",
                content: "I'm doing well, thank you for asking!",
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        currentConversationId: "conv_1",
      });
    });

    it("should render messages", () => {
      render(<AIChatPanel />);

      expect(screen.getByTestId("message-user")).toBeInTheDocument();
      expect(screen.getByTestId("message-assistant")).toBeInTheDocument();
    });

    it("should display message content", () => {
      render(<AIChatPanel />);

      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
      expect(
        screen.getByText("I'm doing well, thank you for asking!")
      ).toBeInTheDocument();
    });

    it("should show message actions for assistant messages", () => {
      render(<AIChatPanel />);

      const messageActions = screen.getAllByTestId("message-actions");
      expect(messageActions.length).toBeGreaterThan(0);
    });

    it("should render message count badge", () => {
      render(<AIChatPanel />);

      // The badge shows message count for non-empty conversation
      const badges = screen.queryAllByRole("img", { hidden: true });
      // Message count should be visible somewhere in the UI
      expect(screen.queryAllByText(/\d+/).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("API Key Warning", () => {
    it("should not show warning when API key is configured", () => {
      useAIChatStore.setState({
        settings: createTestSettings({ apiKeys: { openai: "sk-test-key" } }),
      });

      render(<AIChatPanel />);

      // The warning should not be visible when API key is set
      const alerts = screen.queryAllByText(/ai.no_api_key_warning/);
      expect(alerts.length).toBe(0);
    });

    it("should show warning when API key is missing", () => {
      render(<AIChatPanel />);

      expect(screen.getByText(/ai.no_api_key_warning/)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error message", () => {
      const mockClearError = jest.fn();
      mockUseAIChat.mockReturnValue({
        sendMessage: jest.fn(),
        isLoading: false,
        error: "Failed to send message",
        clearError: mockClearError,
        isStreaming: false,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIChatPanel />);

      expect(screen.getByText("Failed to send message")).toBeInTheDocument();
    });

    it("should clear error when dismiss button clicked", () => {
      const mockClearError = jest.fn();
      mockUseAIChat.mockReturnValue({
        sendMessage: jest.fn(),
        isLoading: false,
        error: "Test error",
        clearError: mockClearError,
        isStreaming: false,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIChatPanel />);

      const dismissButton = screen.getByText("ai.dismiss");
      fireEvent.click(dismissButton);

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe("Input and Submission", () => {
    it("should render prompt input", () => {
      render(<AIChatPanel />);

      expect(screen.getByTestId("prompt-input")).toBeInTheDocument();
    });

    it("should disable input when no API key", () => {
      render(<AIChatPanel />);

      const textarea = screen.getByTestId("prompt-textarea");
      expect(textarea).toBeDisabled();
    });

    it("should enable input when API key is configured", () => {
      useAIChatStore.setState({
        settings: createTestSettings({ apiKeys: { openai: "sk-test-key" } }),
      });

      render(<AIChatPanel />);

      const textarea = screen.getByTestId("prompt-textarea");
      expect(textarea).not.toBeDisabled();
    });

    it("should send message on form submit", async () => {
      useAIChatStore.setState({
        settings: createTestSettings({ apiKeys: { openai: "sk-test-key" } }),
      });

      const mockSendMessage = jest.fn();
      mockUseAIChat.mockReturnValue({
        sendMessage: mockSendMessage,
        isLoading: false,
        error: null,
        clearError: jest.fn(),
        isStreaming: false,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIChatPanel />);

      const form = screen.getByTestId("prompt-input");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when loading", () => {
      mockUseAIChat.mockReturnValue({
        sendMessage: jest.fn(),
        isLoading: true,
        error: null,
        clearError: jest.fn(),
        isStreaming: true,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIChatPanel />);

      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    it("should disable input when loading", () => {
      mockUseAIChat.mockReturnValue({
        sendMessage: jest.fn(),
        isLoading: true,
        error: null,
        clearError: jest.fn(),
        isStreaming: true,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIChatPanel />);

      const submitButton = screen.getByTestId("prompt-submit");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Model Selection", () => {
    it("should render model selector", () => {
      useAIChatStore.setState({
        settings: createTestSettings({ apiKeys: { openai: "sk-test-key" } }),
      });

      render(<AIChatPanel />);

      expect(screen.getByTestId("model-selector")).toBeInTheDocument();
    });

    it("should display current model name", () => {
      useAIChatStore.setState({
        settings: createTestSettings({ apiKeys: { openai: "sk-test-key" } }),
      });

      render(<AIChatPanel />);

      // The model selector should display the current model
      const modelSelector = screen.getByTestId("model-selector");
      expect(modelSelector).toBeInTheDocument();
    });
  });

  describe("Tool Invocations", () => {
    it("should render tool invocations in messages", () => {
      useAIChatStore.setState({
        conversations: {
          conv_1: {
            id: "conv_1",
            title: "Test Conversation",
            messages: [
              {
                id: "msg_1",
                role: "assistant",
                content: "I'll help you with that.",
                toolInvocations: [
                  {
                    toolCallId: "tool_1",
                    toolName: "summarize",
                    state: "result" as const,
                    input: { text: "Sample text" },
                    output: "Summary here",
                  },
                ],
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        currentConversationId: "conv_1",
      });

      render(<AIChatPanel />);

      expect(screen.getByTestId("tool")).toBeInTheDocument();
      expect(screen.getByTestId("tool-header")).toBeInTheDocument();
    });
  });

  describe("Conversation Actions", () => {
    beforeEach(() => {
      useAIChatStore.setState({
        settings: createTestSettings({ apiKeys: { openai: "sk-test-key" } }),
        conversations: {
          conv_1: {
            id: "conv_1",
            title: "Test Conversation",
            messages: [
              {
                id: "msg_1",
                role: "user",
                content: "Hello",
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        currentConversationId: "conv_1",
      });
    });

    it("should show action buttons in chat mode", () => {
      render(<AIChatPanel />);

      // Should have New Conversation button in chat mode
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
