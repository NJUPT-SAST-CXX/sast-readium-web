/**
 * AI Service - Core AI functionality using Vercel AI SDK
 * 
 * This module provides:
 * - Text generation (streaming and non-streaming)
 * - Tool calling with PDF analysis tools
 * - MCP (Model Context Protocol) tool integration
 * - Multi-step tool execution with stopWhen
 * - Provider management
 * - Image generation
 * - Speech synthesis (Text-to-Speech)
 * - Audio transcription (Speech-to-Text)
 */

import { 
  streamText, 
  generateText, 
  tool,
  stepCountIs,
  experimental_generateImage as generateImageAI,
  experimental_generateSpeech as generateSpeechAI,
  experimental_transcribe as transcribeAI,
  type CoreMessage, 
  type LanguageModelUsage,
} from "ai";
import { z } from "zod";
import type { AIProvider, PDFContext, CustomProvider, BuiltInProvider } from "./ai-chat-store";
import { 
  getLanguageModel as getLanguageModelFromProvider, 
  getModelCapabilities,
  getImageModel,
  getSpeechModel,
  getTranscriptionModel,
  type ImageModelId,
  type ImageSize,
  type ImageQuality,
  type SpeechModelId,
  type SpeechVoice,
  type TranscriptionModelId,
} from "./ai-providers";
import { getAllMCPTools, type MCPServerConfig } from "./mcp-client";

// ============================================================================
// Types
// ============================================================================

// Simple tool invocation type for UI display
export interface SimpleToolInvocation {
  toolCallId: string;
  toolName: string;
  input: unknown;
  output?: unknown;
  state: "call" | "result" | "error";
}

// Define Message type with tool support
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  toolInvocations?: SimpleToolInvocation[];
  suggestions?: string[];
  usage?: LanguageModelUsage;
  experimental_attachments?: Array<{
    name?: string;
    contentType?: string;
    url?: string;
  }>;
}

export interface AIServiceConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  customProvider?: CustomProvider;
}

export interface ChatOptions {
  messages: Message[];
  pdfContext?: PDFContext | null;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  enableMultiStep?: boolean;
  maxSteps?: number;
  mcpServers?: MCPServerConfig[];
  onUpdate?: (text: string, toolInvocations?: SimpleToolInvocation[]) => void;
  onFinish?: (text: string, toolInvocations?: SimpleToolInvocation[], suggestions?: string[], usage?: LanguageModelUsage) => void;
  onError?: (error: Error) => void;
  onToolCall?: (toolName: string, args: unknown) => void;
  onStepFinish?: (step: { text: string; toolCalls: unknown[]; toolResults: unknown[] }) => void;
  abortSignal?: AbortSignal;
}

export interface StreamResult {
  text: string;
  toolInvocations: SimpleToolInvocation[];
  suggestions: string[];
  usage?: LanguageModelUsage;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Get the appropriate language model based on provider and configuration
 */
function getLanguageModel(config: AIServiceConfig) {
  return getLanguageModelFromProvider(
    config.provider,
    config.model,
    config.apiKey,
    config.customProvider
  );
}

/**
 * Convert Message array to CoreMessage array
 */
function convertToCoreMessages(messages: Message[]): CoreMessage[] {
  return messages.map((msg): CoreMessage => {
    if (msg.role === 'system') {
      return { role: 'system' as const, content: msg.content };
    } else if (msg.role === 'assistant') {
      return { role: 'assistant' as const, content: msg.content };
    } else {
      return { role: 'user' as const, content: msg.content };
    }
  });
}

/**
 * Build system prompt with PDF context
 */
function buildSystemPrompt(
  basePrompt: string,
  pdfContext?: PDFContext | null
): string {
  if (!pdfContext) {
    return basePrompt;
  }

  const capabilities = getModelCapabilities('');
  let contextInfo = `\n\n## Current Document Context:\n`;
  contextInfo += `- File: ${pdfContext.fileName}\n`;
  contextInfo += `- Current Page: ${pdfContext.currentPage} of ${pdfContext.totalPages}\n`;

  if (capabilities.supportsVision && pdfContext.pageImages && pdfContext.pageImages.length > 0) {
    contextInfo += `\n### Visual Context:\nPage images are included for visual analysis.\n`;
  }

  if (pdfContext.selectedText) {
    contextInfo += `\n### Selected Text:\n${pdfContext.selectedText}\n`;
  }

  if (pdfContext.pageText) {
    const maxLength = 4000;
    contextInfo += `\n### Current Page Content:\n${pdfContext.pageText.slice(0, maxLength)}${pdfContext.pageText.length > maxLength ? "..." : ""}\n`;
  }

  if (pdfContext.annotations && pdfContext.annotations.length > 0) {
    contextInfo += `\n### User Annotations (on current page):\n`;
    pdfContext.annotations.forEach((ann, i) => {
      contextInfo += `${i + 1}. [${ann.type}] ${ann.text}\n`;
    });
  }

  if (pdfContext.bookmarks && pdfContext.bookmarks.length > 0) {
    contextInfo += `\n### User Bookmarks:\n`;
    pdfContext.bookmarks.forEach((bm, i) => {
      contextInfo += `${i + 1}. ${bm.title} (Page ${bm.pageNumber})\n`;
    });
  }

  return basePrompt + contextInfo;
}

// ============================================================================
// PDF Analysis Tools
// ============================================================================

// Define schemas for tools
const summarizeSchema = z.object({
  text: z.string().describe('The text to summarize'),
  length: z.enum(['short', 'medium', 'long']).describe('Desired summary length'),
});

const translateSchema = z.object({
  text: z.string().describe('The text to translate'),
  targetLanguage: z.string().describe('Target language (e.g., "Chinese", "Spanish")'),
  preserveFormatting: z.boolean().default(true).describe('Whether to preserve formatting'),
});

const explainSchema = z.object({
  term: z.string().describe('The term or concept to explain'),
  context: z.string().optional().describe('Additional context from the document'),
  level: z.enum(['simple', 'intermediate', 'advanced']).describe('Explanation complexity level'),
});

const findInfoSchema = z.object({
  query: z.string().describe('What to search for'),
  includePageNumbers: z.boolean().default(true).describe('Include page number citations'),
});

const pageInfoSchema = z.object({
  pageNumber: z.number().optional().describe('Page number to get info for (defaults to current page)'),
});

const studyNotesSchema = z.object({
  format: z.enum(['outline', 'flashcards', 'summary']).describe('Output format'),
  includePageReferences: z.boolean().default(true).describe('Include page references'),
});

/**
 * Create PDF analysis tools with proper AI SDK tool() helper
 */
export function createPDFTools(pdfContext?: PDFContext | null) {
  return {
    summarize_text: tool({
      description: 'Summarize a piece of text from the PDF document',
      inputSchema: summarizeSchema,
      execute: async ({ text, length }: z.infer<typeof summarizeSchema>) => {
        const lengthGuide: Record<string, string> = {
          short: '2-3 sentences',
          medium: '1 paragraph',
          long: '2-3 paragraphs with key points',
        };
        return {
          summary: `Please provide a ${lengthGuide[length]} summary of: ${text.slice(0, 500)}...`,
          originalLength: text.length,
          requestedLength: length,
        };
      },
    }),

    translate_text: tool({
      description: 'Translate text to a target language',
      inputSchema: translateSchema,
      execute: async ({ text, targetLanguage, preserveFormatting }: z.infer<typeof translateSchema>) => {
        return {
          originalText: text.slice(0, 200),
          targetLanguage,
          preserveFormatting,
          note: `Translation to ${targetLanguage} requested`,
        };
      },
    }),

    explain_term: tool({
      description: 'Explain a technical term or concept from the document',
      inputSchema: explainSchema,
      execute: async ({ term, context, level }: z.infer<typeof explainSchema>) => {
        return {
          term,
          context: context?.slice(0, 200),
          level,
          documentPage: pdfContext?.currentPage,
        };
      },
    }),

    find_information: tool({
      description: 'Search for specific information within the current PDF document',
      inputSchema: findInfoSchema,
      execute: async ({ query, includePageNumbers }: z.infer<typeof findInfoSchema>) => {
        const results: Array<{ page: number; found: boolean; snippet: string }> = [];
        if (pdfContext?.pageText) {
          const lowerQuery = query.toLowerCase();
          const lowerText = pdfContext.pageText.toLowerCase();
          if (lowerText.includes(lowerQuery)) {
            results.push({
              page: pdfContext.currentPage,
              found: true,
              snippet: pdfContext.pageText.slice(0, 200),
            });
          }
        }
        return {
          query,
          results,
          totalPages: pdfContext?.totalPages || 0,
          currentPage: pdfContext?.currentPage || 0,
          includePageNumbers,
        };
      },
    }),

    get_page_info: tool({
      description: 'Get information about the current page or a specific page',
      inputSchema: pageInfoSchema,
      execute: async ({ pageNumber }: z.infer<typeof pageInfoSchema>) => {
        const targetPage = pageNumber || pdfContext?.currentPage || 1;
        return {
          pageNumber: targetPage,
          totalPages: pdfContext?.totalPages || 0,
          fileName: pdfContext?.fileName || 'Unknown',
          hasSelectedText: !!pdfContext?.selectedText,
          selectedText: pdfContext?.selectedText?.slice(0, 100),
          annotationCount: pdfContext?.annotations?.length || 0,
          bookmarkCount: pdfContext?.bookmarks?.length || 0,
        };
      },
    }),

    generate_study_notes: tool({
      description: 'Generate study notes or flashcards from annotations and highlights',
      inputSchema: studyNotesSchema,
      execute: async ({ format, includePageReferences }: z.infer<typeof studyNotesSchema>) => {
        const annotations = pdfContext?.annotations || [];
        const bookmarks = pdfContext?.bookmarks || [];
        
        return {
          format,
          includePageReferences,
          annotationCount: annotations.length,
          bookmarkCount: bookmarks.length,
          annotations: annotations.slice(0, 5).map(a => ({
            type: a.type,
            text: a.text.slice(0, 100),
            page: a.pageNumber,
          })),
          bookmarks: bookmarks.slice(0, 5).map(b => ({
            title: b.title,
            page: b.pageNumber,
          })),
        };
      },
    }),
  };
}

/**
 * Chat with AI using streaming response with tool calling and MCP support
 */
export async function chatStream(config: AIServiceConfig, options: ChatOptions): Promise<StreamResult> {
  const {
    messages,
    pdfContext,
    systemPrompt,
    temperature,
    maxTokens,
    enableTools = true,
    enableMultiStep = true,
    maxSteps = 5,
    mcpServers = [],
    onUpdate,
    onFinish,
    onError,
    onToolCall,
    onStepFinish,
    abortSignal,
  } = options;

  try {
    const model = getLanguageModel(config);
    const coreMessages = convertToCoreMessages(messages);
    const finalSystemPrompt = buildSystemPrompt(
      systemPrompt || config.systemPrompt || "",
      pdfContext
    );

    // Combine PDF tools with MCP tools
    let tools = enableTools ? createPDFTools(pdfContext) : undefined;
    
    // Add MCP tools if configured
    if (enableTools && mcpServers.length > 0) {
      try {
        const mcpTools = await getAllMCPTools(mcpServers);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools = { ...tools, ...mcpTools } as any;
      } catch (error) {
        console.warn("Failed to load MCP tools:", error);
      }
    }

    // Configure multi-step behavior
    const stopCondition = enableMultiStep ? stepCountIs(maxSteps) : stepCountIs(1);

    const result = streamText({
      model,
      messages: coreMessages,
      system: finalSystemPrompt,
      temperature: temperature ?? config.temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? config.maxTokens ?? 4096,
      tools,
      stopWhen: stopCondition,
      abortSignal,
      onStepFinish: (step) => {
        onStepFinish?.({
          text: step.text,
          toolCalls: step.toolCalls,
          toolResults: step.toolResults,
        });
      },
    });

    let fullText = "";
    const toolInvocations: SimpleToolInvocation[] = [];
    let finalUsage: LanguageModelUsage | undefined;

    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case "text-delta":
          fullText += chunk.text;
          onUpdate?.(fullText, toolInvocations);
          break;

        case "tool-call": {
          const toolInvocation: SimpleToolInvocation = {
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            input: chunk.input,
            state: "call",
          };
          toolInvocations.push(toolInvocation);
          onToolCall?.(chunk.toolName, chunk.input);
          onUpdate?.(fullText, toolInvocations);
          break;
        }

        case "tool-result": {
          const invocation = toolInvocations.find(
            (inv) => inv.toolCallId === chunk.toolCallId
          );
          if (invocation) {
            invocation.output = chunk.output;
            invocation.state = "result";
            onUpdate?.(fullText, toolInvocations);
          }
          break;
        }

        case "finish":
          finalUsage = chunk.totalUsage as LanguageModelUsage;
          break;

        case "error": {
          const errorInv = toolInvocations.find(inv => inv.state === "call");
          if (errorInv) {
            errorInv.state = "error";
            errorInv.output = { error: "Tool execution failed" };
          }
          break;
        }
      }
    }

    const suggestions = generateSuggestions(pdfContext);
    onFinish?.(fullText, toolInvocations, suggestions, finalUsage);
    
    return { text: fullText, toolInvocations, suggestions, usage: finalUsage };
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(err);
    throw err;
  }
}

/**
 * Chat with AI using non-streaming response (for simple use cases)
 */
export async function chat(config: AIServiceConfig, options: Omit<ChatOptions, "onUpdate" | "onFinish">) {
  const { messages, pdfContext, systemPrompt, temperature, maxTokens } = options;

  try {
    const model = getLanguageModel(config);
    const coreMessages = convertToCoreMessages(messages);
    const finalSystemPrompt = buildSystemPrompt(
      systemPrompt || config.systemPrompt || "",
      pdfContext
    );

    const result = await generateText({
      model,
      messages: coreMessages,
      system: finalSystemPrompt,
      temperature: temperature ?? config.temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? config.maxTokens ?? 4096,
    });

    return result.text;
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error occurred");
    throw err;
  }
}

/**
 * Get PDF analysis tools (legacy wrapper for backward compatibility)
 */
export function getPDFTools(pdfContext?: PDFContext | null) {
  return createPDFTools(pdfContext);
}

// Tool parameter types for external use
export const ToolParamSchemas = {
  summarize: z.object({
    text: z.string(),
    length: z.enum(["short", "medium", "long"]),
  }),
  translate: z.object({
    text: z.string(),
    targetLanguage: z.string(),
    preserveFormatting: z.boolean().default(true),
  }),
  explain: z.object({
    term: z.string(),
    context: z.string().optional(),
    level: z.enum(["simple", "intermediate", "advanced"]),
  }),
  findInformation: z.object({
    query: z.string(),
    includePageNumbers: z.boolean().default(true),
  }),
  generateStudyGuide: z.object({
    annotations: z.array(z.object({
      text: z.string(),
      pageNumber: z.number(),
    })),
    format: z.enum(["outline", "flashcards", "summary"]),
  }),
};

/**
 * Tool execution handlers
 */
export const toolHandlers = {
  summarize: async (config: AIServiceConfig, params: z.infer<typeof ToolParamSchemas.summarize>) => {
    const lengthInstructions: Record<string, string> = {
      short: "Provide a brief 2-3 sentence summary.",
      medium: "Provide a comprehensive paragraph summary.",
      long: "Provide a detailed multi-paragraph summary with key points.",
    };

    const result = await chat(config, {
      messages: [
        {
          id: "tool-summarize",
          role: "user",
          content: `${lengthInstructions[params.length]}\n\nText to summarize:\n${params.text}`,
        },
      ],
    });

    return result;
  },

  translate: async (config: AIServiceConfig, params: z.infer<typeof ToolParamSchemas.translate>) => {
    const formatInstruction = params.preserveFormatting
      ? "Preserve all formatting, line breaks, and structure."
      : "";

    const result = await chat(config, {
      messages: [
        {
          id: "tool-translate",
          role: "user",
          content: `Translate the following text to ${params.targetLanguage}. ${formatInstruction}\n\nText:\n${params.text}`,
        },
      ],
    });

    return result;
  },

  explain: async (config: AIServiceConfig, params: z.infer<typeof ToolParamSchemas.explain>) => {
    const levelInstructions: Record<string, string> = {
      simple: "Explain in simple terms suitable for beginners.",
      intermediate: "Provide a detailed explanation with examples.",
      advanced: "Provide an in-depth technical explanation.",
    };

    const contextText = params.context ? `\n\nContext: ${params.context}` : "";

    const result = await chat(config, {
      messages: [
        {
          id: "tool-explain",
          role: "user",
          content: `${levelInstructions[params.level]}\n\nExplain: ${params.term}${contextText}`,
        },
      ],
    });

    return result;
  },

  findInformation: async (
    config: AIServiceConfig,
    params: z.infer<typeof ToolParamSchemas.findInformation>,
    pdfContext?: PDFContext
  ) => {
    const pageInstruction = params.includePageNumbers
      ? "Include page numbers in your citations."
      : "";

    const result = await chat(config, {
      messages: [
        {
          id: "tool-find",
          role: "user",
          content: `Find information about: ${params.query}\n\n${pageInstruction}`,
        },
      ],
      pdfContext,
    });

    return result;
  },

  generateStudyGuide: async (
    config: AIServiceConfig,
    params: z.infer<typeof ToolParamSchemas.generateStudyGuide>
  ) => {
    const formatInstructions: Record<string, string> = {
      outline: "Create a structured outline with main topics and subtopics.",
      flashcards: "Generate question-answer pairs suitable for flashcards.",
      summary: "Create a comprehensive summary organized by topics.",
    };

    const annotationsText = params.annotations
      .map((ann) => `[Page ${ann.pageNumber}] ${ann.text}`)
      .join("\n");

    const result = await chat(config, {
      messages: [
        {
          id: "tool-study-guide",
          role: "user",
          content: `${formatInstructions[params.format]}\n\nBased on these annotations:\n${annotationsText}`,
        },
      ],
    });

    return result;
  },
};

/**
 * Validate API key format (basic check)
 */
export function validateAPIKey(provider: AIProvider, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  if (provider === "openai") {
    return apiKey.startsWith("sk-");
  } else if (provider === "anthropic") {
    return apiKey.startsWith("sk-ant-");
  } else if (provider === "custom") {
    // For custom providers, just check it's not empty
    return apiKey.length >= 8;
  }

  return false;
}

/**
 * Validate API key for a specific built-in provider
 */
export function validateBuiltInAPIKey(provider: BuiltInProvider, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  if (provider === "openai") {
    return apiKey.startsWith("sk-");
  } else if (provider === "anthropic") {
    return apiKey.startsWith("sk-ant-");
  }

  return false;
}

/**
 * Generate contextual suggestions based on PDF context and conversation
 */
function generateSuggestions(
  pdfContext?: PDFContext | null
): string[] {
  const suggestions: string[] = [];

  if (pdfContext) {
    // Add page-specific suggestions
    suggestions.push(`Summarize page ${pdfContext.currentPage}`);

    if (pdfContext.selectedText) {
      suggestions.push("Explain the selected text");
      suggestions.push("Translate this selection");
    }

    if (pdfContext.annotations && pdfContext.annotations.length > 0) {
      suggestions.push("Generate study notes from my highlights");
    }

    // Add navigation suggestions
    if (pdfContext.currentPage < pdfContext.totalPages) {
      suggestions.push("What's on the next page?");
    }
  }

  // Add general suggestions
  suggestions.push("Find key insights");
  suggestions.push("Explain technical terms");

  // Limit to 5 suggestions
  return suggestions.slice(0, 5);
}

/**
 * Test API connection
 */
export async function testConnection(config: AIServiceConfig): Promise<boolean> {
  try {
    await chat(config, {
      messages: [
        {
          id: "test",
          role: "user",
          content: "Hello",
        },
      ],
      maxTokens: 10,
      enableTools: false,
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Image Generation
// ============================================================================

export interface ImageGenerationConfig {
  provider: AIProvider;
  apiKey: string;
  model?: ImageModelId;
  customProvider?: CustomProvider;
}

export interface ImageGenerationOptions {
  prompt: string;
  size?: ImageSize;
  quality?: ImageQuality;
  n?: number;
  style?: "vivid" | "natural";
  abortSignal?: AbortSignal;
}

export interface GeneratedImage {
  base64: string;
  uint8Array: Uint8Array;
  mimeType?: string;
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  warnings?: Array<{ type: string; message: string }>;
}

/**
 * Generate images from a text prompt
 */
export async function generateImage(
  config: ImageGenerationConfig,
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const { provider, apiKey, model = "dall-e-3", customProvider } = config;
  const { prompt, size = "1024x1024", quality, n = 1, style, abortSignal } = options;

  try {
    const imageModel = getImageModel(provider, model, apiKey, customProvider);

    // Handle "auto" size by defaulting to 1024x1024
    const resolvedSize = size === "auto" ? "1024x1024" : size;

    const result = await generateImageAI({
      model: imageModel,
      prompt,
      size: resolvedSize as `${number}x${number}`,
      n,
      providerOptions: {
        openai: {
          ...(quality && { quality }),
          ...(style && { style }),
        },
      },
      abortSignal,
    });

    const images: GeneratedImage[] = result.images.map((img) => ({
      base64: img.base64,
      uint8Array: img.uint8Array,
      mimeType: "image/png", // Default to PNG for generated images
    }));

    return {
      images,
      warnings: result.warnings?.map((w) => ({ type: w.type, message: "details" in w ? (w.details || w.type) : ("message" in w ? w.message : w.type) })),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Image generation failed");
    throw err;
  }
}

// ============================================================================
// Speech Generation (Text-to-Speech)
// ============================================================================

export interface SpeechGenerationConfig {
  provider: AIProvider;
  apiKey: string;
  model?: SpeechModelId;
  customProvider?: CustomProvider;
}

export interface SpeechGenerationOptions {
  text: string;
  voice?: SpeechVoice;
  speed?: number;
  language?: string;
  abortSignal?: AbortSignal;
}

export interface SpeechGenerationResult {
  audio: Uint8Array;
  mimeType?: string;
  warnings?: Array<{ type: string; message: string }>;
}

/**
 * Generate speech from text
 */
export async function generateSpeech(
  config: SpeechGenerationConfig,
  options: SpeechGenerationOptions
): Promise<SpeechGenerationResult> {
  const { provider, apiKey, model = "tts-1", customProvider } = config;
  const { text, voice = "alloy", speed = 1.0, abortSignal } = options;

  try {
    const speechModel = getSpeechModel(provider, model, apiKey, customProvider);

    const result = await generateSpeechAI({
      model: speechModel,
      text,
      voice,
      providerOptions: {
        openai: {
          speed,
        },
      },
      abortSignal,
    });

    return {
      audio: result.audio.uint8Array,
      mimeType: "audio/mpeg", // Default to mp3 format
      warnings: result.warnings?.map((w) => ({ type: w.type, message: "details" in w ? (w.details || w.type) : w.type })),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Speech generation failed");
    throw err;
  }
}

/**
 * Create an audio Blob URL from speech generation result
 */
export function createAudioBlobUrl(result: SpeechGenerationResult): string {
  // Create a new ArrayBuffer copy to ensure compatibility with Blob
  const arrayBuffer = new ArrayBuffer(result.audio.length);
  const view = new Uint8Array(arrayBuffer);
  view.set(result.audio);
  const blob = new Blob([arrayBuffer], { type: result.mimeType || "audio/mpeg" });
  return URL.createObjectURL(blob);
}

// ============================================================================
// Audio Transcription (Speech-to-Text)
// ============================================================================

export interface TranscriptionConfig {
  provider: AIProvider;
  apiKey: string;
  model?: TranscriptionModelId;
  customProvider?: CustomProvider;
}

export interface TranscriptionOptions {
  audio: Uint8Array | ArrayBuffer | string | URL;
  language?: string;
  prompt?: string;
  abortSignal?: AbortSignal;
}

export interface TranscriptionSegment {
  text: string;
  startSecond: number;
  endSecond: number;
}

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[];
  language?: string;
  durationInSeconds?: number;
  warnings?: Array<{ type: string; message: string }>;
}

/**
 * Transcribe audio to text
 */
export async function transcribeAudio(
  config: TranscriptionConfig,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const { provider, apiKey, model = "whisper-1", customProvider } = config;
  const { audio, language, prompt, abortSignal } = options;

  try {
    const transcriptionModel = getTranscriptionModel(provider, model, apiKey, customProvider);

    const result = await transcribeAI({
      model: transcriptionModel,
      audio,
      providerOptions: {
        openai: {
          ...(language && { language }),
          ...(prompt && { prompt }),
          timestampGranularities: ["segment"],
        },
      },
      abortSignal,
    });

    return {
      text: result.text,
      segments: result.segments?.map((seg) => ({
        text: seg.text,
        startSecond: seg.startSecond,
        endSecond: seg.endSecond,
      })),
      language: result.language,
      durationInSeconds: result.durationInSeconds,
      warnings: result.warnings?.map((w) => ({ type: w.type, message: "details" in w ? (w.details || w.type) : w.type })),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Transcription failed");
    throw err;
  }
}

/**
 * Read audio file and convert to Uint8Array
 */
export async function readAudioFile(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error("Failed to read audio file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate audio file format
 */
export function isValidAudioFile(file: File): boolean {
  const validTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/flac",
    "audio/x-flac",
  ];
  
  const validExtensions = [".mp3", ".mp4", ".m4a", ".wav", ".webm", ".ogg", ".flac", ".mpeg", ".mpga"];
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  
  return validTypes.includes(file.type) || validExtensions.includes(extension);
}
