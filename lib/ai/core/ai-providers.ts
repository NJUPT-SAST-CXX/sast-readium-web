/**
 * AI Provider Registry and Management
 *
 * This module sets up a centralized provider registry using AI SDK's
 * provider management features. It supports built-in providers (OpenAI, Anthropic)
 * and custom OpenAI-compatible providers.
 *
 * Includes support for:
 * - Language models (text generation)
 * - Image models (image generation)
 * - Speech models (text-to-speech)
 * - Transcription models (speech-to-text)
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createProviderRegistry, customProvider } from "ai";
import type {
  LanguageModel,
  ImageModel,
  SpeechModel,
  TranscriptionModel,
} from "ai";
import type { CustomProvider, AIProvider } from "./ai-chat-store";

// Provider instance cache to avoid recreation
const providerCache = new Map<
  string,
  ReturnType<typeof createOpenAI> | ReturnType<typeof createAnthropic>
>();

/**
 * Create or get cached OpenAI provider instance
 */
export function getOpenAIProvider(apiKey: string, baseURL?: string) {
  const cacheKey = `openai:${apiKey}:${baseURL || "default"}`;

  if (!providerCache.has(cacheKey)) {
    const provider = createOpenAI({
      apiKey,
      ...(baseURL && { baseURL }),
    });
    providerCache.set(cacheKey, provider);
  }

  return providerCache.get(cacheKey) as ReturnType<typeof createOpenAI>;
}

/**
 * Create or get cached Anthropic provider instance
 */
export function getAnthropicProvider(apiKey: string) {
  const cacheKey = `anthropic:${apiKey}`;

  if (!providerCache.has(cacheKey)) {
    const provider = createAnthropic({ apiKey });
    providerCache.set(cacheKey, provider);
  }

  return providerCache.get(cacheKey) as ReturnType<typeof createAnthropic>;
}

/**
 * Create a custom OpenAI-compatible provider
 */
export function createCustomProvider(
  apiKey: string,
  baseURL: string,
  headers?: Record<string, string>
) {
  return createOpenAI({
    apiKey,
    baseURL,
    headers,
  });
}

/**
 * Get language model based on provider configuration
 */
export function getLanguageModel(
  provider: AIProvider,
  model: string,
  apiKey: string,
  customProviderConfig?: CustomProvider
): LanguageModel {
  if (provider === "openai") {
    const openaiProvider = getOpenAIProvider(apiKey);
    return openaiProvider(model);
  }

  if (provider === "anthropic") {
    const anthropicProvider = getAnthropicProvider(apiKey);
    return anthropicProvider(model);
  }

  if (provider === "custom" && customProviderConfig) {
    const customHeaders = customProviderConfig.apiKeyHeader
      ? { [customProviderConfig.apiKeyHeader]: apiKey }
      : undefined;

    const customOpenAI = createCustomProvider(
      apiKey,
      customProviderConfig.baseURL,
      customHeaders
    );
    return customOpenAI(model);
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

/**
 * Create a provider registry with all configured providers
 */
export function createAIProviderRegistry(config: {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  customProviders?: Array<CustomProvider & { apiKey: string }>;
}) {
  const providers: Record<
    string,
    | ReturnType<typeof createOpenAI>
    | ReturnType<typeof createAnthropic>
    | ReturnType<typeof customProvider>
  > = {};

  // Add OpenAI if API key is available
  if (config.openaiApiKey) {
    providers.openai = getOpenAIProvider(config.openaiApiKey);
  }

  // Add Anthropic if API key is available
  if (config.anthropicApiKey) {
    providers.anthropic = getAnthropicProvider(config.anthropicApiKey);
  }

  // Add custom providers
  if (config.customProviders) {
    for (const customConfig of config.customProviders) {
      if (!customConfig.isEnabled || !customConfig.apiKey) continue;

      const customHeaders = customConfig.apiKeyHeader
        ? { [customConfig.apiKeyHeader]: customConfig.apiKey }
        : undefined;

      const customOpenAI = createCustomProvider(
        customConfig.apiKey,
        customConfig.baseURL,
        customHeaders
      );

      // Create a custom provider with model aliases
      const modelAliases = Object.fromEntries(
        customConfig.models.map((m) => [m.id, customOpenAI(m.id)])
      );

      providers[customConfig.id] = customProvider({
        languageModels: modelAliases,
        fallbackProvider: customOpenAI,
      });
    }
  }

  return createProviderRegistry(providers);
}

/**
 * Clear provider cache (useful when API keys change)
 */
export function clearProviderCache() {
  providerCache.clear();
}

/**
 * Model capability detection
 */
export interface ModelCapabilities {
  supportsVision: boolean;
  supportsToolCalling: boolean;
  supportsStreaming: boolean;
  maxContextWindow: number;
}

/**
 * Get model capabilities based on model ID
 */
export function getModelCapabilities(modelId: string): ModelCapabilities {
  // Default capabilities
  const defaults: ModelCapabilities = {
    supportsVision: false,
    supportsToolCalling: true,
    supportsStreaming: true,
    maxContextWindow: 128000,
  };

  // Vision-capable models
  const visionModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4-vision",
    "claude-3-5-sonnet",
    "claude-3-opus",
    "claude-3-haiku",
    "llama-3.2-vision",
    "gemini-pro-vision",
  ];

  // Check if model supports vision
  const supportsVision = visionModels.some((vm) =>
    modelId.toLowerCase().includes(vm.toLowerCase())
  );

  // Context window sizes for known models
  const contextWindows: Record<string, number> = {
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
    "gpt-4-turbo": 128000,
    "gpt-3.5-turbo": 16385,
    "claude-3-5-sonnet": 200000,
    "claude-3-opus": 200000,
    "claude-3-haiku": 200000,
    "deepseek-chat": 64000,
    "deepseek-coder": 64000,
  };

  // Find matching context window
  let maxContextWindow = defaults.maxContextWindow;
  for (const [model, window] of Object.entries(contextWindows)) {
    if (modelId.toLowerCase().includes(model.toLowerCase())) {
      maxContextWindow = window;
      break;
    }
  }

  return {
    ...defaults,
    supportsVision,
    maxContextWindow,
  };
}

/**
 * Validate API key format
 */
export function validateAPIKeyFormat(
  provider: AIProvider,
  apiKey: string
): boolean {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  if (provider === "openai") {
    return apiKey.startsWith("sk-");
  }

  if (provider === "anthropic") {
    return apiKey.startsWith("sk-ant-");
  }

  // Custom providers - just check minimum length
  return apiKey.length >= 8;
}

// ============================================================================
// Image Model Support
// ============================================================================

/**
 * Available image models
 */
export const IMAGE_MODELS = [
  { id: "dall-e-3", name: "DALL-E 3", provider: "openai" as const },
  { id: "dall-e-2", name: "DALL-E 2", provider: "openai" as const },
  { id: "gpt-image-1", name: "GPT Image 1", provider: "openai" as const },
] as const;

export type ImageModelId = (typeof IMAGE_MODELS)[number]["id"];

/**
 * Image size options
 */
export const IMAGE_SIZES = {
  "dall-e-3": ["1024x1024", "1792x1024", "1024x1792"] as const,
  "dall-e-2": ["256x256", "512x512", "1024x1024"] as const,
  "gpt-image-1": ["1024x1024", "1536x1024", "1024x1536", "auto"] as const,
};

export type ImageSize =
  | "256x256"
  | "512x512"
  | "1024x1024"
  | "1792x1024"
  | "1024x1792"
  | "1536x1024"
  | "1024x1536"
  | "auto";

/**
 * Image quality options
 */
export type ImageQuality = "standard" | "hd";

/**
 * Get image model based on provider configuration
 */
export function getImageModel(
  provider: AIProvider,
  model: ImageModelId,
  apiKey: string,
  customProviderConfig?: CustomProvider
): ImageModel {
  if (
    provider === "openai" ||
    (provider === "custom" && !customProviderConfig)
  ) {
    const openaiProvider = getOpenAIProvider(apiKey);
    return openaiProvider.image(model);
  }

  if (provider === "custom" && customProviderConfig) {
    const customHeaders = customProviderConfig.apiKeyHeader
      ? { [customProviderConfig.apiKeyHeader]: apiKey }
      : undefined;

    const customOpenAI = createCustomProvider(
      apiKey,
      customProviderConfig.baseURL,
      customHeaders
    );
    return customOpenAI.image(model);
  }

  throw new Error(`Image generation not supported for provider: ${provider}`);
}

// ============================================================================
// Speech Model Support (Text-to-Speech)
// ============================================================================

/**
 * Available speech models
 */
export const SPEECH_MODELS = [
  { id: "tts-1", name: "TTS-1 (Standard)", provider: "openai" as const },
  {
    id: "tts-1-hd",
    name: "TTS-1 HD (High Quality)",
    provider: "openai" as const,
  },
  {
    id: "gpt-4o-mini-tts",
    name: "GPT-4o Mini TTS",
    provider: "openai" as const,
  },
] as const;

export type SpeechModelId = (typeof SPEECH_MODELS)[number]["id"];

/**
 * Available voices for OpenAI TTS
 */
export const SPEECH_VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and clear" },
  { id: "fable", name: "Fable", description: "Expressive and dramatic" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Friendly and upbeat" },
  { id: "shimmer", name: "Shimmer", description: "Soft and gentle" },
] as const;

export type SpeechVoice = (typeof SPEECH_VOICES)[number]["id"];

/**
 * Speech output format options
 */
export type SpeechOutputFormat =
  | "mp3"
  | "opus"
  | "aac"
  | "flac"
  | "wav"
  | "pcm";

/**
 * Get speech model based on provider configuration
 */
export function getSpeechModel(
  provider: AIProvider,
  model: SpeechModelId,
  apiKey: string,
  customProviderConfig?: CustomProvider
): SpeechModel {
  if (
    provider === "openai" ||
    (provider === "custom" && !customProviderConfig)
  ) {
    const openaiProvider = getOpenAIProvider(apiKey);
    return openaiProvider.speech(model);
  }

  if (provider === "custom" && customProviderConfig) {
    const customHeaders = customProviderConfig.apiKeyHeader
      ? { [customProviderConfig.apiKeyHeader]: apiKey }
      : undefined;

    const customOpenAI = createCustomProvider(
      apiKey,
      customProviderConfig.baseURL,
      customHeaders
    );
    return customOpenAI.speech(model);
  }

  throw new Error(`Speech generation not supported for provider: ${provider}`);
}

// ============================================================================
// Transcription Model Support (Speech-to-Text)
// ============================================================================

/**
 * Available transcription models
 */
export const TRANSCRIPTION_MODELS = [
  { id: "whisper-1", name: "Whisper-1", provider: "openai" as const },
  {
    id: "gpt-4o-transcribe",
    name: "GPT-4o Transcribe",
    provider: "openai" as const,
  },
  {
    id: "gpt-4o-mini-transcribe",
    name: "GPT-4o Mini Transcribe",
    provider: "openai" as const,
  },
] as const;

export type TranscriptionModelId = (typeof TRANSCRIPTION_MODELS)[number]["id"];

/**
 * Supported audio formats for transcription
 */
export const SUPPORTED_AUDIO_FORMATS = [
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "m4a",
  "wav",
  "webm",
  "ogg",
  "flac",
] as const;

export type AudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number];

/**
 * Get transcription model based on provider configuration
 */
export function getTranscriptionModel(
  provider: AIProvider,
  model: TranscriptionModelId,
  apiKey: string,
  customProviderConfig?: CustomProvider
): TranscriptionModel {
  if (
    provider === "openai" ||
    (provider === "custom" && !customProviderConfig)
  ) {
    const openaiProvider = getOpenAIProvider(apiKey);
    return openaiProvider.transcription(model);
  }

  if (provider === "custom" && customProviderConfig) {
    const customHeaders = customProviderConfig.apiKeyHeader
      ? { [customProviderConfig.apiKeyHeader]: apiKey }
      : undefined;

    const customOpenAI = createCustomProvider(
      apiKey,
      customProviderConfig.baseURL,
      customHeaders
    );
    return customOpenAI.transcription(model);
  }

  throw new Error(`Transcription not supported for provider: ${provider}`);
}

/**
 * Check if a provider supports image generation
 */
export function supportsImageGeneration(provider: AIProvider): boolean {
  return provider === "openai" || provider === "custom";
}

/**
 * Check if a provider supports speech generation
 */
export function supportsSpeechGeneration(provider: AIProvider): boolean {
  return provider === "openai" || provider === "custom";
}

/**
 * Check if a provider supports transcription
 */
export function supportsTranscription(provider: AIProvider): boolean {
  return provider === "openai" || provider === "custom";
}
