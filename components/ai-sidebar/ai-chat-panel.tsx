"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useAIChatStore, AI_MODELS } from "@/lib/ai-chat-store";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Trash2, Plus, Copy, Check, RotateCcw, Brain, MessageSquare, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResearchPanel } from "./research-workflow";
import { Conversation } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageActions, MessageAction, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { QuickCommands } from "@/components/ai-elements/quick-commands";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from "@/components/ai-elements/context";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import type { SimpleToolInvocation } from "@/lib/ai-service";

type ChatMode = "chat" | "research";

export function AIChatPanel() {
  const { t } = useTranslation();
  const conversationRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [quickCommandsOpen, setQuickCommandsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const {
    getCurrentConversation,
    createConversation,
    clearMessages,
    settings,
    updateSettings,
    sessionUsage,
    getContextWindowSize,
    getTotalUsedTokens,
  } = useAIChatStore();

  const {
    sendMessage,
    isLoading,
    error,
    clearError,
    isStreaming,
    retryLastMessage,
  } = useAIChat();

  // Get models for current provider
  const availableModels = AI_MODELS.filter((m) => m.provider === settings.provider);
  const currentModel = AI_MODELS.find((m) => m.id === settings.model);

  const conversation = getCurrentConversation();
  const messages = useMemo(() => conversation?.messages || [], [conversation?.messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationRef.current) {
      const scrollContainer = conversationRef.current.querySelector("[data-conversation-content]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text.trim() || isLoading) {
      return;
    }
    
    // Close quick commands if open
    setQuickCommandsOpen(false);
    setInputValue("");
    await sendMessage(message.text);
  };
  
  // Handle quick command selection
  const handleQuickCommandSelect = useCallback((prompt: string) => {
    setInputValue("");
    setQuickCommandsOpen(false);
    sendMessage(prompt);
  }, [sendMessage]);
  
  // Handle input change to detect slash commands
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (value.startsWith("/")) {
      setQuickCommandsOpen(true);
    } else {
      setQuickCommandsOpen(false);
    }
  }, []);

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    await sendMessage(suggestion);
  };

  // Get the last assistant message with suggestions
  const lastAssistantMessage = [...messages].reverse().find(
    (msg) => msg.role === "assistant"
  );
  const suggestions = lastAssistantMessage?.suggestions || [];

  const handleClearConversation = () => {
    if (confirm(t("ai.confirm_clear"))) {
      clearMessages();
    }
  };

  const handleNewConversation = () => {
    createConversation();
  };

  // Check if API key is configured (safe access for backwards compatibility)
  const hasAPIKey = settings.apiKeys?.[settings.provider];

  // Copy message to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Context window data
  const contextWindowSize = getContextWindowSize();
  const usedTokens = getTotalUsedTokens();

  return (
    <div className="h-full flex flex-col">
      {/* Mode Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <Tabs value={mode} onValueChange={(v) => setMode(v as ChatMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="chat" className="text-xs gap-1.5 px-2">
              <MessageSquare className="h-3.5 w-3.5" />
              {t("ai.chat")}
            </TabsTrigger>
            <TabsTrigger value="research" className="text-xs gap-1.5 px-2">
              <Brain className="h-3.5 w-3.5" />
              {t("ai.deep_research")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "chat" && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNewConversation}
              title={t("ai.new_conversation")}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleClearConversation}
              disabled={messages.length === 0}
              title={t("ai.clear_conversation")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Deep Research Mode */}
      {mode === "research" ? (
        <ResearchPanel />
      ) : (
        <>
          {/* Error Alert */}
          {error && (
        <Alert variant="destructive" className="m-4 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              {t("ai.dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* API Key Warning */}
      {!hasAPIKey && (
        <Alert className="m-4 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("ai.no_api_key_warning", {
              provider: settings.provider.toUpperCase(),
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Context Usage Indicator */}
      {hasAPIKey && messages.length > 0 && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-border bg-muted/30">
          <Context
            usedTokens={usedTokens}
            maxTokens={contextWindowSize}
            usage={{
              inputTokens: sessionUsage.totalInputTokens,
              outputTokens: sessionUsage.totalOutputTokens,
              reasoningTokens: sessionUsage.totalReasoningTokens,
              cachedInputTokens: sessionUsage.totalCachedTokens,
              totalTokens: usedTokens,
            }}
            modelId={settings.model}
          >
            <ContextTrigger />
            <ContextContent>
              <ContextContentHeader />
              <ContextContentBody className="space-y-1">
                <ContextInputUsage />
                <ContextOutputUsage />
                <ContextReasoningUsage />
                <ContextCacheUsage />
              </ContextContentBody>
              <ContextContentFooter />
            </ContextContent>
          </Context>
        </div>
      )}

      {/* Conversation */}
      <div ref={conversationRef} className="flex-1 overflow-hidden">
        <Conversation>
          <div
            data-conversation-content
            className="h-full overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("ai.no_messages_title")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t("ai.no_messages_description")}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.role === "assistant" && message.content.includes("<thinking>") ? (
                      <ChainOfThought defaultOpen={false}>
                        <ChainOfThoughtHeader>
                          {t("ai.reasoning_process")}
                        </ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          <ChainOfThoughtStep
                            label={t("ai.thinking")}
                            status="complete"
                          >
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {message.content.match(/<thinking>([\s\S]*?)<\/thinking>/)?.[1] || ""}
                            </div>
                          </ChainOfThoughtStep>
                        </ChainOfThoughtContent>
                        <MessageResponse>
                          {message.content.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim()}
                        </MessageResponse>
                      </ChainOfThought>
                    ) : (
                      <MessageResponse>
                        {message.content}
                      </MessageResponse>
                    )}

                    {/* Render tool invocations */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.toolInvocations.map((tool: SimpleToolInvocation) => {
                          const toolState = tool.state === "result" 
                            ? "output-available" as const
                            : tool.state === "error" 
                              ? "output-error" as const
                              : "input-available" as const;
                          return (
                            <Tool key={tool.toolCallId} defaultOpen={false}>
                              <ToolHeader
                                title={tool.toolName}
                                type={`tool-${tool.toolName}`}
                                state={toolState}
                              />
                              <ToolContent>
                                <ToolInput input={tool.input} />
                                <ToolOutput
                                  output={tool.output}
                                  errorText={undefined}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        })}
                      </div>
                    )}
                  </MessageContent>

                  {message.role === "assistant" && (
                    <MessageActions>
                      <MessageAction
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        tooltip={t("ai.copy")}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </MessageAction>
                      <MessageAction
                        onClick={retryLastMessage}
                        tooltip={t("ai.retry")}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
                </Message>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t("ai.thinking")}</span>
              </div>
            )}
          </div>
        </Conversation>
      </div>

      {/* Action Bar */}
      {messages.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("ai.new_conversation")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearConversation}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t("ai.clear")}
          </Button>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <Suggestions>
            {suggestions.map((suggestion, index) => (
              <Suggestion
                key={`${suggestion}-${index}`}
                suggestion={suggestion}
                onClick={handleSuggestionClick}
              />
            ))}
          </Suggestions>
        </div>
      )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-background relative">
            {/* Quick Commands Popover */}
            <QuickCommands
              open={quickCommandsOpen}
              onOpenChange={setQuickCommandsOpen}
              onSelect={handleQuickCommandSelect}
              filterText={inputValue}
            />
            
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                placeholder={t("ai.input_placeholder")}
                disabled={isLoading || !hasAPIKey}
                rows={3}
                className="resize-none"
                onChange={(e) => handleInputChange(e.target.value)}
              />
              <PromptInputFooter>
                <PromptInputTools>
                  {/* Quick Commands Button */}
                  <PromptInputButton
                    onClick={() => setQuickCommandsOpen(!quickCommandsOpen)}
                    title={t("ai.quick_commands.trigger_tooltip", "Quick Commands (/)")}
                    disabled={!hasAPIKey}
                  >
                    <Zap className="h-4 w-4" />
                  </PromptInputButton>
                  
                  {/* Model Selector */}
                  <ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
                    <ModelSelectorTrigger asChild>
                      <PromptInputButton
                        className="gap-1.5 text-xs"
                        disabled={!hasAPIKey}
                      >
                        <ModelSelectorLogo provider={settings.provider} />
                        <span className="hidden sm:inline truncate max-w-[100px]">
                          {currentModel?.name || settings.model}
                        </span>
                      </PromptInputButton>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent>
                      <ModelSelectorInput placeholder={t("ai.search_models")} />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>{t("ai.no_models_found")}</ModelSelectorEmpty>
                        <ModelSelectorGroup heading={settings.provider.toUpperCase()}>
                          {availableModels.map((model) => (
                            <ModelSelectorItem
                              key={model.id}
                              value={model.id}
                              onSelect={() => {
                                updateSettings({ model: model.id });
                                setModelSelectorOpen(false);
                              }}
                            >
                              <ModelSelectorLogo provider={model.provider} />
                              <ModelSelectorName>{model.name}</ModelSelectorName>
                              {model.id === settings.model && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </ModelSelectorItem>
                          ))}
                        </ModelSelectorGroup>
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                </PromptInputTools>
                <PromptInputSubmit
                  disabled={isLoading || !hasAPIKey}
                  status={isStreaming ? "streaming" : isLoading ? "submitted" : undefined}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </>
      )}
    </div>
  );
}
