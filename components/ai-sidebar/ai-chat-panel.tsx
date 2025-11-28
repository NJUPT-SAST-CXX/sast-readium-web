"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useAIChatStore, AI_MODELS } from "@/lib/ai-chat-store";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Trash2,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Brain,
  MessageSquare,
  Zap,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Paperclip,
  Settings2,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResearchPanel } from "./research-workflow";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
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
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
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
import { Loader } from "@/components/ai-elements/loader";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { cn } from "@/lib/utils";
import type { SimpleToolInvocation } from "@/lib/ai-service";
import type { BundledLanguage } from "shiki";

type ChatMode = "chat" | "research";

// Default suggestions for empty state
const DEFAULT_SUGGESTIONS = [
  "Summarize this document",
  "Explain the key concepts",
  "Translate to Chinese",
  "Create a study guide",
];

export function AIChatPanel() {
  const { t } = useTranslation();
  const conversationRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [quickCommandsOpen, setQuickCommandsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const availableModels = AI_MODELS.filter(
    (m) => m.provider === settings.provider
  );
  const currentModel = AI_MODELS.find((m) => m.id === settings.model);

  const conversation = getCurrentConversation();
  const messages = useMemo(
    () => conversation?.messages || [],
    [conversation?.messages]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationRef.current) {
      const scrollContainer = conversationRef.current.querySelector(
        "[data-conversation-content]"
      );
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
  const handleQuickCommandSelect = useCallback(
    (prompt: string) => {
      setInputValue("");
      setQuickCommandsOpen(false);
      sendMessage(prompt);
    },
    [sendMessage]
  );

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
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((msg) => msg.role === "assistant");
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

  // Handle file attachment
  const handleAttachFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setAttachments((prev) => [...prev, ...files]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Parse message content for code blocks
  const parseMessageContent = useCallback((content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{
      type: "text" | "code";
      content: string;
      language?: string;
    }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }
      // Add code block
      parts.push({
        type: "code",
        content: match[2],
        language: match[1] || "plaintext",
      });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text" as const, content }];
  }, []);

  // Extract thinking content from message
  const extractThinking = useCallback((content: string) => {
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    const thinking = thinkingMatch?.[1] || null;
    const cleanContent = content
      .replace(/<thinking>[\s\S]*?<\/thinking>/, "")
      .trim();
    return { thinking, cleanContent };
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/10">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,.pdf,.txt,.md,.json"
      />

      {/* Mode Tabs - Enhanced with gradient and better spacing */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
        <Tabs value={mode} onValueChange={(v) => setMode(v as ChatMode)}>
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger
              value="chat"
              className="text-xs gap-1.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("ai.chat")}
            </TabsTrigger>
            <TabsTrigger
              value="research"
              className="text-xs gap-1.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Brain className="h-3.5 w-3.5" />
              {t("ai.deep_research")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "chat" && (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-primary/10"
                    onClick={handleNewConversation}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("ai.new_conversation")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleNewConversation}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("ai.new_conversation")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleClearConversation}
                  disabled={messages.length === 0}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("ai.clear_conversation")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Deep Research Mode */}
      {mode === "research" ? (
        <ResearchPanel />
      ) : (
        <>
          {/* Error Alert - Enhanced styling */}
          {error && (
            <Alert
              variant="destructive"
              className="mx-4 mt-4 animate-in slide-in-from-top-2"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="h-7 px-2 hover:bg-destructive/20"
                >
                  {t("ai.dismiss")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* API Key Warning - Enhanced styling */}
          {!hasAPIKey && (
            <Alert className="mx-4 mt-4 border-amber-500/50 bg-amber-500/10 animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                {t("ai.no_api_key_warning", {
                  provider: settings.provider.toUpperCase(),
                })}
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 ml-2 text-amber-600 hover:text-amber-700"
                  onClick={() => {
                    // Switch to settings tab
                    const settingsTab = document.querySelector(
                      '[value="settings"]'
                    ) as HTMLElement;
                    settingsTab?.click();
                  }}
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  {t("ai.configure")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Context Usage Indicator - Enhanced with better visuals */}
          {hasAPIKey && messages.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs font-normal gap-1"
                >
                  <MessageSquare className="h-3 w-3" />
                  {messages.length}
                </Badge>
                {currentModel && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {currentModel.name}
                  </Badge>
                )}
              </div>
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

          {/* Conversation - Using AI Elements Conversation components */}
          <div ref={conversationRef} className="flex-1 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent className="gap-6 p-4">
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    icon={<Sparkles className="h-12 w-12" />}
                    title={t("ai.no_messages_title")}
                    description={t("ai.no_messages_description")}
                  >
                    <div className="mt-6 space-y-4">
                      <p className="text-xs text-muted-foreground">
                        {t("ai.try_these", "Try one of these:")}
                      </p>
                      <Suggestions className="justify-center">
                        {DEFAULT_SUGGESTIONS.map((suggestion, index) => (
                          <Suggestion
                            key={index}
                            suggestion={suggestion}
                            onClick={handleSuggestionClick}
                            variant="outline"
                            className="text-xs"
                          />
                        ))}
                      </Suggestions>
                    </div>
                  </ConversationEmptyState>
                ) : (
                  messages.map((message, messageIndex) => {
                    const { thinking, cleanContent } = extractThinking(
                      message.content
                    );
                    const contentParts = parseMessageContent(cleanContent);
                    const isLastMessage = messageIndex === messages.length - 1;

                    return (
                      <Message
                        key={message.id}
                        from={message.role}
                        className={cn(
                          "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                          message.role === "user" && "max-w-[85%]"
                        )}
                      >
                        <MessageContent
                          className={cn(
                            message.role === "assistant" &&
                              "bg-muted/30 rounded-lg p-4 border border-border/50"
                          )}
                        >
                          {/* Reasoning/Thinking section using Reasoning component */}
                          {message.role === "assistant" && thinking && (
                            <Reasoning
                              defaultOpen={false}
                              isStreaming={isStreaming && isLastMessage}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{thinking}</ReasoningContent>
                            </Reasoning>
                          )}

                          {/* Message content with code block support */}
                          <div className="space-y-3">
                            {contentParts.map((part, partIndex) =>
                              part.type === "code" ? (
                                <CodeBlock
                                  key={partIndex}
                                  code={part.content}
                                  language={
                                    (part.language ||
                                      "plaintext") as BundledLanguage
                                  }
                                />
                              ) : (
                                <MessageResponse key={partIndex}>
                                  {part.content}
                                </MessageResponse>
                              )
                            )}
                          </div>

                          {/* Render tool invocations with enhanced styling */}
                          {message.toolInvocations &&
                            message.toolInvocations.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {message.toolInvocations.map(
                                  (tool: SimpleToolInvocation) => {
                                    const toolState =
                                      tool.state === "result"
                                        ? ("output-available" as const)
                                        : tool.state === "error"
                                          ? ("output-error" as const)
                                          : ("input-available" as const);
                                    return (
                                      <Tool
                                        key={tool.toolCallId}
                                        defaultOpen={false}
                                      >
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
                                  }
                                )}
                              </div>
                            )}
                        </MessageContent>

                        {/* Enhanced message actions for assistant messages */}
                        {message.role === "assistant" && (
                          <MessageToolbar>
                            <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MessageAction
                                onClick={() =>
                                  handleCopyMessage(message.id, message.content)
                                }
                                tooltip={t("ai.copy")}
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </MessageAction>
                              {isLastMessage && (
                                <MessageAction
                                  onClick={retryLastMessage}
                                  tooltip={t("ai.retry")}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </MessageAction>
                              )}
                              <MessageAction tooltip={t("ai.helpful")}>
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </MessageAction>
                              <MessageAction tooltip={t("ai.not_helpful")}>
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </MessageAction>
                            </MessageActions>
                          </MessageToolbar>
                        )}
                      </Message>
                    );
                  })
                )}

                {/* Loading state with Loader and Shimmer */}
                {isLoading && (
                  <Message from="assistant" className="animate-in fade-in-0">
                    <MessageContent className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Loader size={18} className="text-primary" />
                        <Shimmer duration={1.5}>{t("ai.thinking")}</Shimmer>
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>

              {/* Scroll to bottom button */}
              <ConversationScrollButton />
            </Conversation>
          </div>

          {/* Suggestions - Enhanced with better styling */}
          {suggestions.length > 0 && !isLoading && (
            <div className="px-4 py-3 border-t border-border/50 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20">
              <p className="text-xs text-muted-foreground mb-2">
                {t("ai.suggested_replies", "Suggested replies")}
              </p>
              <Suggestions>
                {suggestions.map((suggestion, index) => (
                  <Suggestion
                    key={`${suggestion}-${index}`}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                    className="text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  />
                ))}
              </Suggestions>
            </div>
          )}

          {/* Input - Enhanced with attachments and better styling */}
          <div className="p-4 border-t border-border/50 bg-gradient-to-t from-background to-muted/10 relative">
            {/* Quick Commands Popover */}
            <QuickCommands
              open={quickCommandsOpen}
              onOpenChange={setQuickCommandsOpen}
              onSelect={handleQuickCommandSelect}
              filterText={inputValue}
            />

            <PromptInput
              onSubmit={handleSubmit}
              className="shadow-lg rounded-xl border border-border/50"
            >
              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-b border-border/50">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-xs"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <PromptInputTextarea
                placeholder={t("ai.input_placeholder")}
                disabled={isLoading || !hasAPIKey}
                rows={3}
                className="resize-none border-0 focus-visible:ring-0 bg-transparent"
                onChange={(e) => handleInputChange(e.target.value)}
              />

              <PromptInputFooter className="border-t border-border/30 bg-muted/20">
                <PromptInputTools>
                  {/* Attach File Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PromptInputButton
                          onClick={handleAttachFile}
                          disabled={!hasAPIKey}
                          className="hover:bg-primary/10"
                        >
                          <Paperclip className="h-4 w-4" />
                        </PromptInputButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("ai.attach_file", "Attach file")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Quick Commands Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PromptInputButton
                          onClick={() =>
                            setQuickCommandsOpen(!quickCommandsOpen)
                          }
                          disabled={!hasAPIKey}
                          className={cn(
                            "hover:bg-primary/10",
                            quickCommandsOpen && "bg-primary/10 text-primary"
                          )}
                        >
                          <Zap className="h-4 w-4" />
                        </PromptInputButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(
                          "ai.quick_commands.trigger_tooltip",
                          "Quick Commands (/)"
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Model Selector */}
                  <ModelSelector
                    open={modelSelectorOpen}
                    onOpenChange={setModelSelectorOpen}
                  >
                    <ModelSelectorTrigger asChild>
                      <PromptInputButton
                        className="gap-1.5 text-xs hover:bg-primary/10"
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
                        <ModelSelectorEmpty>
                          {t("ai.no_models_found")}
                        </ModelSelectorEmpty>
                        <ModelSelectorGroup
                          heading={settings.provider.toUpperCase()}
                        >
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
                              <ModelSelectorName>
                                {model.name}
                              </ModelSelectorName>
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
                  status={
                    isStreaming
                      ? "streaming"
                      : isLoading
                        ? "submitted"
                        : undefined
                  }
                  className="rounded-lg"
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </>
      )}
    </div>
  );
}
