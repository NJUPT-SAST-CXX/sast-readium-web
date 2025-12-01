/**
 * Tests for AI Provider Registry and Management
 */

import {
  getOpenAIProvider,
  getAnthropicProvider,
  createCustomProvider,
  getLanguageModel,
  createAIProviderRegistry,
  clearProviderCache,
  getModelCapabilities,
  validateAPIKeyFormat,
  IMAGE_MODELS,
  IMAGE_SIZES,
  SPEECH_MODELS,
  SPEECH_VOICES,
  TRANSCRIPTION_MODELS,
} from "./ai-providers";

// Mock AI SDK modules
jest.mock("@ai-sdk/openai", () => ({
  createOpenAI: jest.fn(() => {
    const mockProvider = Object.assign(
      jest.fn((model: string) => ({
        modelId: model,
        provider: "openai",
      })),
      {
        image: jest.fn((model: string) => ({
          modelId: model,
          type: "image",
        })),
        speech: jest.fn((model: string) => ({
          modelId: model,
          type: "speech",
        })),
        transcription: jest.fn((model: string) => ({
          modelId: model,
          type: "transcription",
        })),
      }
    );
    return mockProvider;
  }),
}));

jest.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: jest.fn(() => {
    const mockProvider = jest.fn((model: string) => ({
      modelId: model,
      provider: "anthropic",
    }));
    return mockProvider;
  }),
}));

jest.mock("ai", () => ({
  createProviderRegistry: jest.fn((providers) => ({
    providers,
    languageModel: jest.fn(),
  })),
  customProvider: jest.fn((config) => ({
    ...config,
    type: "custom",
  })),
}));

describe("AI Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearProviderCache();
  });

  describe("getOpenAIProvider", () => {
    it("should create OpenAI provider with API key", () => {
      const provider = getOpenAIProvider("sk-test-key");
      expect(provider).toBeDefined();
    });

    it("should cache provider instances", () => {
      const provider1 = getOpenAIProvider("sk-test-key");
      const provider2 = getOpenAIProvider("sk-test-key");
      expect(provider1).toBe(provider2);
    });

    it("should create different instances for different API keys", () => {
      const provider1 = getOpenAIProvider("sk-key-1");
      const provider2 = getOpenAIProvider("sk-key-2");
      expect(provider1).not.toBe(provider2);
    });

    it("should support custom base URL", () => {
      const provider = getOpenAIProvider(
        "sk-test-key",
        "https://custom.api.com"
      );
      expect(provider).toBeDefined();
    });

    it("should cache providers with different base URLs separately", () => {
      const provider1 = getOpenAIProvider("sk-test-key", "https://api1.com");
      const provider2 = getOpenAIProvider("sk-test-key", "https://api2.com");
      expect(provider1).not.toBe(provider2);
    });
  });

  describe("getAnthropicProvider", () => {
    it("should create Anthropic provider with API key", () => {
      const provider = getAnthropicProvider("sk-ant-test-key");
      expect(provider).toBeDefined();
    });

    it("should cache provider instances", () => {
      const provider1 = getAnthropicProvider("sk-ant-test-key");
      const provider2 = getAnthropicProvider("sk-ant-test-key");
      expect(provider1).toBe(provider2);
    });
  });

  describe("createCustomProvider", () => {
    it("should create custom OpenAI-compatible provider", () => {
      const provider = createCustomProvider(
        "custom-api-key",
        "https://custom.api.com/v1"
      );
      expect(provider).toBeDefined();
    });

    it("should support custom headers", () => {
      const provider = createCustomProvider(
        "custom-api-key",
        "https://custom.api.com/v1",
        { "X-Custom-Header": "value" }
      );
      expect(provider).toBeDefined();
    });
  });

  describe("getLanguageModel", () => {
    it("should get OpenAI language model", () => {
      const model = getLanguageModel("openai", "gpt-4", "sk-test-key");
      expect(model).toBeDefined();
    });

    it("should get Anthropic language model", () => {
      const model = getLanguageModel(
        "anthropic",
        "claude-3-sonnet",
        "sk-ant-key"
      );
      expect(model).toBeDefined();
    });

    it("should get custom provider language model", () => {
      const customConfig = {
        id: "custom-provider",
        name: "Custom Provider",
        baseURL: "https://custom.api.com/v1",
        models: [
          {
            id: "custom-model",
            name: "Custom Model",
            contextWindow: 8000,
            supportsVision: false,
          },
        ],
        isEnabled: true,
      };
      const model = getLanguageModel(
        "custom",
        "custom-model",
        "api-key",
        customConfig as any
      );
      expect(model).toBeDefined();
    });

    it("should throw error for unsupported provider", () => {
      expect(() => {
        getLanguageModel("unsupported" as any, "model", "key");
      }).toThrow("Unsupported AI provider: unsupported");
    });
  });

  describe("createAIProviderRegistry", () => {
    it("should create registry with OpenAI provider", () => {
      const registry = createAIProviderRegistry({
        openaiApiKey: "sk-test-key",
      });
      expect(registry).toBeDefined();
      expect((registry as any).providers).toHaveProperty("openai");
    });

    it("should create registry with Anthropic provider", () => {
      const registry = createAIProviderRegistry({
        anthropicApiKey: "sk-ant-test-key",
      });
      expect(registry).toBeDefined();
      expect((registry as any).providers).toHaveProperty("anthropic");
    });

    it("should create registry with both providers", () => {
      const registry = createAIProviderRegistry({
        openaiApiKey: "sk-test-key",
        anthropicApiKey: "sk-ant-test-key",
      });
      expect((registry as any).providers).toHaveProperty("openai");
      expect((registry as any).providers).toHaveProperty("anthropic");
    });

    it("should add custom providers", () => {
      const registry = createAIProviderRegistry({
        customProviders: [
          {
            id: "custom-1",
            name: "Custom 1",
            baseURL: "https://custom1.api.com",
            models: [
              {
                id: "model-1",
                name: "Model 1",
                contextWindow: 8000,
                supportsVision: false,
              },
            ],
            isEnabled: true,
            apiKey: "custom-key-1",
          },
        ],
      });
      expect((registry as any).providers).toHaveProperty("custom-1");
    });

    it("should skip disabled custom providers", () => {
      const registry = createAIProviderRegistry({
        customProviders: [
          {
            id: "disabled-provider",
            name: "Disabled",
            baseURL: "https://disabled.api.com",
            models: [],
            isEnabled: false,
            apiKey: "key",
          },
        ],
      });
      expect((registry as any).providers).not.toHaveProperty(
        "disabled-provider"
      );
    });

    it("should skip custom providers without API key", () => {
      const registry = createAIProviderRegistry({
        customProviders: [
          {
            id: "no-key-provider",
            name: "No Key",
            baseURL: "https://nokey.api.com",
            models: [],
            isEnabled: true,
            apiKey: "",
          },
        ],
      });
      expect((registry as any).providers).not.toHaveProperty("no-key-provider");
    });
  });

  describe("clearProviderCache", () => {
    it("should clear cached providers", () => {
      const provider1 = getOpenAIProvider("sk-test-key");
      clearProviderCache();
      const provider2 = getOpenAIProvider("sk-test-key");
      expect(provider1).not.toBe(provider2);
    });
  });

  describe("getModelCapabilities", () => {
    it("should return default capabilities for unknown model", () => {
      const capabilities = getModelCapabilities("unknown-model");
      expect(capabilities).toEqual({
        supportsVision: false,
        supportsToolCalling: true,
        supportsStreaming: true,
        maxContextWindow: 128000,
      });
    });

    it("should detect vision support for GPT-4o", () => {
      const capabilities = getModelCapabilities("gpt-4o");
      expect(capabilities.supportsVision).toBe(true);
    });

    it("should detect vision support for GPT-4o-mini", () => {
      const capabilities = getModelCapabilities("gpt-4o-mini");
      expect(capabilities.supportsVision).toBe(true);
    });

    it("should detect vision support for Claude models", () => {
      const capabilities = getModelCapabilities("claude-3-5-sonnet-20241022");
      expect(capabilities.supportsVision).toBe(true);
    });

    it("should return correct context window for GPT-3.5-turbo", () => {
      const capabilities = getModelCapabilities("gpt-3.5-turbo");
      expect(capabilities.maxContextWindow).toBe(16385);
    });

    it("should return correct context window for Claude models", () => {
      const capabilities = getModelCapabilities("claude-3-opus");
      expect(capabilities.maxContextWindow).toBe(200000);
    });

    it("should return correct context window for DeepSeek models", () => {
      const capabilities = getModelCapabilities("deepseek-chat");
      expect(capabilities.maxContextWindow).toBe(64000);
    });
  });

  describe("validateAPIKeyFormat", () => {
    it("should validate OpenAI API key format", () => {
      expect(validateAPIKeyFormat("openai", "sk-test-key")).toBe(true);
      expect(validateAPIKeyFormat("openai", "invalid-key")).toBe(false);
    });

    it("should validate Anthropic API key format", () => {
      expect(validateAPIKeyFormat("anthropic", "sk-ant-test-key")).toBe(true);
      expect(validateAPIKeyFormat("anthropic", "sk-wrong-format")).toBe(false);
    });

    it("should validate custom provider API key (minimum length)", () => {
      expect(validateAPIKeyFormat("custom", "12345678")).toBe(true);
      expect(validateAPIKeyFormat("custom", "short")).toBe(false);
    });

    it("should reject empty API keys", () => {
      expect(validateAPIKeyFormat("openai", "")).toBe(false);
      expect(validateAPIKeyFormat("openai", "   ")).toBe(false);
    });
  });

  describe("Image Models", () => {
    it("should have DALL-E 3 in IMAGE_MODELS", () => {
      const dallE3 = IMAGE_MODELS.find((m) => m.id === "dall-e-3");
      expect(dallE3).toBeDefined();
      expect(dallE3?.provider).toBe("openai");
    });

    it("should have correct sizes for DALL-E 3", () => {
      expect(IMAGE_SIZES["dall-e-3"]).toContain("1024x1024");
      expect(IMAGE_SIZES["dall-e-3"]).toContain("1792x1024");
    });

    it("should have correct sizes for DALL-E 2", () => {
      expect(IMAGE_SIZES["dall-e-2"]).toContain("256x256");
      expect(IMAGE_SIZES["dall-e-2"]).toContain("512x512");
    });
  });

  describe("Speech Models", () => {
    it("should have TTS-1 in SPEECH_MODELS", () => {
      const tts1 = SPEECH_MODELS.find((m) => m.id === "tts-1");
      expect(tts1).toBeDefined();
    });

    it("should have TTS-1-HD in SPEECH_MODELS", () => {
      const tts1hd = SPEECH_MODELS.find((m) => m.id === "tts-1-hd");
      expect(tts1hd).toBeDefined();
    });

    it("should have multiple voice options", () => {
      expect(SPEECH_VOICES.length).toBeGreaterThan(0);
      const voiceIds = SPEECH_VOICES.map((v) => v.id);
      expect(voiceIds).toContain("alloy");
      expect(voiceIds).toContain("nova");
    });
  });

  describe("Transcription Models", () => {
    it("should have Whisper-1 in TRANSCRIPTION_MODELS", () => {
      const whisper = TRANSCRIPTION_MODELS.find((m) => m.id === "whisper-1");
      expect(whisper).toBeDefined();
    });
  });
});
