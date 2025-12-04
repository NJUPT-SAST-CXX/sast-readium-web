/**
 * useMarkdownAI Hook - AI-powered markdown editing assistance
 *
 * This hook provides AI-powered features for markdown editing:
 * - Smart summarization
 * - Content improvement
 * - Translation
 * - Outline generation
 * - Content analysis
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useAIChatStore } from "@/lib/ai/core";
import { useAIChat } from "@/hooks/use-ai-chat";
import { type MarkdownContext, MARKDOWN_PROMPTS } from "@/lib/ai/markdown";
import {
  extractHeadings,
  getContentStats,
  validateMarkdown,
  extractPlainText,
} from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface UseMarkdownAIOptions {
  content: string;
  fileName?: string;
  selectedText?: string;
  cursorPosition?: number;
}

export interface MarkdownAIResult {
  text: string;
  isLoading: boolean;
  error: string | null;
}

export interface UseMarkdownAIReturn {
  // Context
  context: MarkdownContext;

  // Actions
  summarize: (length?: "brief" | "standard" | "detailed") => Promise<void>;
  improve: (
    focus?: "clarity" | "conciseness" | "grammar" | "style" | "all"
  ) => Promise<void>;
  translate: (targetLanguage: string) => Promise<void>;
  generateOutline: (topic: string, depth?: number) => Promise<void>;
  expand: (addExamples?: boolean) => Promise<void>;
  simplify: (
    targetAudience?: "beginner" | "intermediate" | "general"
  ) => Promise<void>;
  analyze: () => Promise<void>;
  generateTable: (
    description: string,
    rows?: number,
    cols?: number
  ) => Promise<void>;
  generateCode: (description: string, language: string) => Promise<void>;
  askAboutContent: (question: string) => Promise<void>;

  // State
  isLoading: boolean;
  lastResult: MarkdownAIResult | null;

  // Utilities
  getPlainText: () => string;
  getHeadings: () => ReturnType<typeof extractHeadings>;
  getStats: () => ReturnType<typeof getContentStats>;
  getIssues: () => ReturnType<typeof validateMarkdown>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMarkdownAI(
  options: UseMarkdownAIOptions
): UseMarkdownAIReturn {
  const { content, fileName, selectedText, cursorPosition } = options;

  const { sendMessage, isLoading: chatLoading } = useAIChat();
  // Settings can be used for future enhancements like model-specific prompts
  useAIChatStore();

  const [lastResult, setLastResult] = useState<MarkdownAIResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Build markdown context
  const context = useMemo<MarkdownContext>(() => {
    const stats = getContentStats(content);
    const headings = extractHeadings(content);

    return {
      content,
      fileName,
      selectedText,
      cursorPosition,
      headings,
      stats,
    };
  }, [content, fileName, selectedText, cursorPosition]);

  // Helper to send AI request
  const sendAIRequest = useCallback(
    async (prompt: string) => {
      setIsProcessing(true);
      setLastResult({ text: "", isLoading: true, error: null });

      try {
        await sendMessage(prompt);
        setLastResult((prev) => (prev ? { ...prev, isLoading: false } : null));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setLastResult({
          text: "",
          isLoading: false,
          error: errorMessage,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [sendMessage]
  );

  // Summarize content
  const summarize = useCallback(
    async (length: "brief" | "standard" | "detailed" = "standard") => {
      const textToSummarize = selectedText || content;
      const instruction = MARKDOWN_PROMPTS.summarize[length];

      const prompt = `${instruction}

Content to summarize:
${textToSummarize.slice(0, 4000)}${textToSummarize.length > 4000 ? "\n\n[Content truncated...]" : ""}`;

      await sendAIRequest(prompt);
    },
    [content, selectedText, sendAIRequest]
  );

  // Improve writing
  const improve = useCallback(
    async (
      focus: "clarity" | "conciseness" | "grammar" | "style" | "all" = "all"
    ) => {
      const textToImprove = selectedText || content;
      const instruction = MARKDOWN_PROMPTS.improve[focus];

      const prompt = `Please improve the following markdown content. ${instruction}

Provide the improved version in markdown format.

Original content:
${textToImprove.slice(0, 3000)}${textToImprove.length > 3000 ? "\n\n[Content truncated...]" : ""}`;

      await sendAIRequest(prompt);
    },
    [content, selectedText, sendAIRequest]
  );

  // Translate content
  const translate = useCallback(
    async (targetLanguage: string) => {
      const textToTranslate = selectedText || content;

      const prompt = `Translate the following markdown content to ${targetLanguage}. 
Preserve all markdown formatting, including:
- Headings
- Lists
- Code blocks (keep code unchanged, only translate comments)
- Links (translate link text, keep URLs)
- Bold/italic formatting

Content to translate:
${textToTranslate.slice(0, 3000)}${textToTranslate.length > 3000 ? "\n\n[Content truncated...]" : ""}`;

      await sendAIRequest(prompt);
    },
    [content, selectedText, sendAIRequest]
  );

  // Generate outline
  const generateOutline = useCallback(
    async (topic: string, depth: number = 3) => {
      const prompt = `Create a detailed markdown outline for the following topic.
Use heading levels from H1 to H${depth + 1}.
Include brief descriptions under each section.

Topic: ${topic}

${context.content ? `Context from current document:\n${extractPlainText(context.content).slice(0, 1000)}` : ""}`;

      await sendAIRequest(prompt);
    },
    [context.content, sendAIRequest]
  );

  // Expand content
  const expand = useCallback(
    async (addExamples: boolean = true) => {
      const textToExpand = selectedText || content;

      const prompt = `Expand and elaborate on the following content. 
${addExamples ? "Include relevant examples to illustrate key points." : ""}
Add more details and explanations while maintaining the original structure.
Output in markdown format.

Content to expand:
${textToExpand.slice(0, 2000)}${textToExpand.length > 2000 ? "\n\n[Content truncated...]" : ""}`;

      await sendAIRequest(prompt);
    },
    [content, selectedText, sendAIRequest]
  );

  // Simplify content
  const simplify = useCallback(
    async (
      targetAudience: "beginner" | "intermediate" | "general" = "general"
    ) => {
      const textToSimplify = selectedText || content;
      const audienceInstruction = MARKDOWN_PROMPTS.audience[targetAudience];

      const prompt = `Simplify the following content for easier understanding.
${audienceInstruction}
Maintain markdown formatting but use simpler language and shorter sentences.

Content to simplify:
${textToSimplify.slice(0, 3000)}${textToSimplify.length > 3000 ? "\n\n[Content truncated...]" : ""}`;

      await sendAIRequest(prompt);
    },
    [content, selectedText, sendAIRequest]
  );

  // Analyze content
  const analyze = useCallback(async () => {
    const stats = getContentStats(content);
    const issues = validateMarkdown(content);
    const headings = extractHeadings(content);

    const prompt = `Analyze the following markdown document and provide feedback on:
1. Structure and organization
2. Writing quality
3. Potential improvements
4. Any issues found

Document stats:
- Words: ${stats.words}
- Lines: ${stats.lines}
- Headings: ${stats.headings}
- Code blocks: ${stats.codeBlocks}
- Links: ${stats.links}
- Images: ${stats.images}

Validation issues found: ${issues.length > 0 ? issues.map((i) => `${i.type}: ${i.message} (line ${i.line})`).join(", ") : "None"}

Document structure:
${headings.map((h) => `${"  ".repeat(h.level - 1)}- ${h.text}`).join("\n")}

Content preview:
${content.slice(0, 2000)}${content.length > 2000 ? "\n\n[Content truncated...]" : ""}`;

    await sendAIRequest(prompt);
  }, [content, sendAIRequest]);

  // Generate table
  const generateTable = useCallback(
    async (description: string, rows: number = 3, cols: number = 3) => {
      const prompt = `Generate a markdown table based on this description:
"${description}"

The table should have ${rows} data rows and ${cols} columns.
Include appropriate headers and fill in realistic sample data.
Output only the markdown table.`;

      await sendAIRequest(prompt);
    },
    [sendAIRequest]
  );

  // Generate code
  const generateCode = useCallback(
    async (description: string, language: string) => {
      const prompt = `Generate ${language} code based on this description:
"${description}"

Include helpful comments explaining the code.
Output as a markdown code block with the language specified.`;

      await sendAIRequest(prompt);
    },
    [sendAIRequest]
  );

  // Ask about content
  const askAboutContent = useCallback(
    async (question: string) => {
      const textContext = selectedText || content;

      const prompt = `Based on the following markdown content, please answer this question:
"${question}"

Content:
${textContext.slice(0, 3000)}${textContext.length > 3000 ? "\n\n[Content truncated...]" : ""}`;

      await sendAIRequest(prompt);
    },
    [content, selectedText, sendAIRequest]
  );

  // Utility functions
  const getPlainText = useCallback(() => extractPlainText(content), [content]);

  const getHeadings = useCallback(() => extractHeadings(content), [content]);

  const getStats = useCallback(() => getContentStats(content), [content]);

  const getIssues = useCallback(() => validateMarkdown(content), [content]);

  return {
    context,
    summarize,
    improve,
    translate,
    generateOutline,
    expand,
    simplify,
    analyze,
    generateTable,
    generateCode,
    askAboutContent,
    isLoading: chatLoading || isProcessing,
    lastResult,
    getPlainText,
    getHeadings,
    getStats,
    getIssues,
  };
}
