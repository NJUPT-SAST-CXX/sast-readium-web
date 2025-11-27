import { useState, useCallback, useEffect } from "react";
import { useAIChatStore, type Message } from "@/lib/ai-chat-store";
import { chatStream, type AIServiceConfig } from "@/lib/ai-service";
import { getAPIKeySecurely } from "@/lib/tauri-bridge-ai";

export function useAIChat() {
  const {
    settings,
    isLoading,
    error,
    setLoading,
    setError,
    addMessage,
    updateMessage,
    getCurrentConversation,
    createConversation,
    currentConversationId,
    pdfContext,
  } = useAIChatStore();

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Load API key from secure storage on mount
  useEffect(() => {
    const loadAPIKey = async () => {
      try {
        const apiKey = await getAPIKeySecurely(settings.provider);
        const currentKey = settings.apiKeys[settings.provider];
        if (apiKey && apiKey !== currentKey) {
          useAIChatStore.getState().setAPIKey(settings.provider, apiKey);
        }
      } catch (error) {
        console.error("Failed to load API key:", error);
      }
    };

    loadAPIKey();
  }, [settings.provider, settings.apiKeys]);

  /**
   * Send a message to the AI
   */
  const sendMessage = useCallback(
    async (content: string) => {
      // Validation
      if (!content.trim()) {
        setError("Message cannot be empty");
        return;
      }

      const apiKey = settings.apiKeys[settings.provider];
      if (!apiKey) {
        setError(`Please set your ${settings.provider.toUpperCase()} API key in settings`);
        return;
      }

      // Create conversation if none exists
      if (!currentConversationId) {
        createConversation();
      }

      setLoading(true);
      setError(null);

      // Add user message
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        content,
      };
      addMessage(userMessage);

      // Create assistant message placeholder
      const assistantMessageId = `assistant_${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      };
      addMessage(assistantMessage);
      setStreamingMessageId(assistantMessageId);

      try {
        // Get current conversation messages
        const conversation = getCurrentConversation();
        const messages = conversation?.messages || [userMessage];

        // Prepare AI config
        const config: AIServiceConfig = {
          provider: settings.provider,
          model: settings.model,
          apiKey,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt,
        };

        // Get enabled MCP servers
        const enabledMCPServers = settings.enableMCPTools
          ? settings.mcpServers.filter(s => s.enabled)
          : [];

        // Stream the response with tool calling and MCP support
        await chatStream(config, {
          messages,
          pdfContext: settings.includePDFContext ? pdfContext : null,
          systemPrompt: settings.systemPrompt,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          enableTools: true,
          enableMultiStep: settings.enableMultiStepTools,
          maxSteps: settings.maxToolSteps,
          mcpServers: enabledMCPServers,
          onUpdate: (text, toolInvocations) => {
            updateMessage(assistantMessageId, {
              content: text,
              toolInvocations,
            });
          },
          onFinish: (text, toolInvocations, suggestions, usage) => {
            updateMessage(assistantMessageId, {
              content: text,
              toolInvocations,
              suggestions,
              usage,
            });
            // Update session usage if available
            if (usage) {
              useAIChatStore.getState().updateSessionUsage(usage);
            }
            setLoading(false);
            setStreamingMessageId(null);
          },
          onError: (error) => {
            setError(error.message);
            setLoading(false);
            setStreamingMessageId(null);
            // Remove the failed message
            useAIChatStore.getState().deleteMessage(assistantMessageId);
          },
          onToolCall: (toolName, args) => {
            console.log("Tool called:", toolName, args);
          },
          onStepFinish: (step) => {
            console.log("Step finished:", step);
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to send message";
        setError(errorMessage);
        setLoading(false);
        setStreamingMessageId(null);
        // Remove the failed message
        useAIChatStore.getState().deleteMessage(assistantMessageId);
      }
    },
    [
      settings,
      currentConversationId,
      pdfContext,
      createConversation,
      addMessage,
      updateMessage,
      setLoading,
      setError,
      getCurrentConversation,
    ]
  );

  /**
   * Retry the last failed message
   */
  const retryLastMessage = useCallback(async () => {
    const conversation = getCurrentConversation();
    if (!conversation || conversation.messages.length === 0) {
      return;
    }

    const lastUserMessage = [...conversation.messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content);
    }
  }, [getCurrentConversation, sendMessage]);

  /**
   * Stop the current streaming response
   */
  const stopStreaming = useCallback(() => {
    if (streamingMessageId) {
      setStreamingMessageId(null);
      setLoading(false);
    }
  }, [streamingMessageId, setLoading]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    sendMessage,
    retryLastMessage,
    stopStreaming,
    clearError,
    isLoading,
    error,
    isStreaming: streamingMessageId !== null,
    streamingMessageId,
  };
}
