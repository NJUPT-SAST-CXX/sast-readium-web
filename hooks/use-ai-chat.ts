import { useState, useCallback, useEffect, useRef } from "react";
import { useAIChatStore, type Message } from "@/lib/ai-chat-store";
import {
  chatStream,
  type AIServiceConfig,
  type SimpleToolInvocation,
} from "@/lib/ai-service";
import { getAPIKeySecurely } from "@/lib/tauri-bridge-ai";

// Debounce interval for streaming updates (ms)
const STREAMING_UPDATE_INTERVAL = 50;

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

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  // Refs for debounced streaming updates
  const pendingUpdateRef = useRef<{
    text: string;
    toolInvocations?: SimpleToolInvocation[];
  } | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

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
        setError(
          `Please set your ${settings.provider.toUpperCase()} API key in settings`
        );
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
          ? settings.mcpServers.filter((s) => s.enabled)
          : [];

        // Helper to flush pending updates
        const flushPendingUpdate = () => {
          if (pendingUpdateRef.current) {
            updateMessage(assistantMessageId, {
              content: pendingUpdateRef.current.text,
              toolInvocations: pendingUpdateRef.current.toolInvocations,
            });
            lastUpdateTimeRef.current = Date.now();
          }
        };

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
            // Store the latest content in ref
            pendingUpdateRef.current = { text, toolInvocations };

            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

            // If enough time has passed, update immediately
            if (timeSinceLastUpdate >= STREAMING_UPDATE_INTERVAL) {
              // Clear any pending timeout
              if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
                updateTimeoutRef.current = null;
              }
              flushPendingUpdate();
            } else if (!updateTimeoutRef.current) {
              // Schedule a deferred update
              updateTimeoutRef.current = setTimeout(() => {
                updateTimeoutRef.current = null;
                flushPendingUpdate();
              }, STREAMING_UPDATE_INTERVAL - timeSinceLastUpdate);
            }
            // If there's already a pending timeout, the update will be applied when it fires
          },
          onFinish: (text, toolInvocations, suggestions, usage) => {
            // Clear any pending timeout
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
              updateTimeoutRef.current = null;
            }
            pendingUpdateRef.current = null;

            // Final update with all data
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
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message";
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
