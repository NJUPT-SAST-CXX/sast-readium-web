/**
 * Tests for AI Media hooks (hooks/use-ai-media.ts)
 */

import { renderHook, act } from "@testing-library/react";
import {
  useImageGeneration,
  useSpeechSynthesis,
  useTranscription,
  downloadImage,
  downloadAudio,
  copyToClipboard,
} from "./use-ai-media";
import { useAIChatStore } from "@/lib/ai-chat-store";
import * as aiService from "@/lib/ai-service";

// Mock the AI service
jest.mock("@/lib/ai-service", () => ({
  generateImage: jest.fn(),
  generateSpeech: jest.fn(),
  transcribeAudio: jest.fn(),
  createAudioBlobUrl: jest.fn(),
  readAudioFile: jest.fn(),
  isValidAudioFile: jest.fn(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => "blob:mock-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock Audio
const mockAudioPlay = jest.fn(() => Promise.resolve());
const mockAudioPause = jest.fn();
class MockAudio {
  src = "";
  currentTime = 0;
  onended: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onplay: (() => void) | null = null;
  play = mockAudioPlay;
  pause = mockAudioPause;
}
global.Audio = MockAudio as unknown as typeof Audio;

// Reset store before each test
beforeEach(() => {
  jest.clearAllMocks();

  useAIChatStore.setState({
    settings: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
      apiKeys: {},
      systemPrompt: "You are a helpful assistant.",
      includePDFContext: true,
      customProviders: [],
      mcpServers: [],
      enableMCPTools: false,
      enableMultiStepTools: true,
      maxToolSteps: 5,
      imageSettings: {
        model: "dall-e-3",
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      },
      speechSettings: {
        model: "tts-1",
        voice: "alloy",
        speed: 1.0,
      },
      transcriptionSettings: {
        model: "whisper-1",
        language: undefined,
      },
      quickCommands: [],
      promptTemplates: [],
      defaultTranslationLanguage: "Chinese",
    },
  });
});

describe("useImageGeneration", () => {
  describe("Initial State", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useImageGeneration());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });

    it("should have generate function", () => {
      const { result } = renderHook(() => useImageGeneration());
      expect(typeof result.current.generate).toBe("function");
    });

    it("should have clearResult function", () => {
      const { result } = renderHook(() => useImageGeneration());
      expect(typeof result.current.clearResult).toBe("function");
    });

    it("should have clearError function", () => {
      const { result } = renderHook(() => useImageGeneration());
      expect(typeof result.current.clearError).toBe("function");
    });
  });

  describe("generate", () => {
    it("should set error for empty prompt", async () => {
      const { result } = renderHook(() => useImageGeneration());

      await act(async () => {
        await result.current.generate("");
      });

      expect(result.current.error).toBe("Prompt cannot be empty");
    });

    it("should set error when API key is missing", async () => {
      const { result } = renderHook(() => useImageGeneration());

      await act(async () => {
        await result.current.generate("A beautiful sunset");
      });

      expect(result.current.error).toContain("API key");
    });

    it("should call generateImage with correct parameters", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        images: [
          { base64: "base64data", uint8Array: new Uint8Array([1, 2, 3]) },
        ],
      };
      (aiService.generateImage as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useImageGeneration());

      await act(async () => {
        await result.current.generate("A beautiful sunset");
      });

      expect(aiService.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "openai",
          apiKey: "sk-test-key",
          model: "dall-e-3",
        }),
        expect.objectContaining({
          prompt: "A beautiful sunset",
          size: "1024x1024",
        })
      );
    });

    it("should set result on success", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        images: [
          { base64: "base64data", uint8Array: new Uint8Array([1, 2, 3]) },
        ],
      };
      (aiService.generateImage as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useImageGeneration());

      await act(async () => {
        await result.current.generate("A beautiful sunset");
      });

      expect(result.current.result).toEqual(mockResult);
      expect(result.current.error).toBeNull();
    });

    it("should call onSuccess callback", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        images: [
          { base64: "base64data", uint8Array: new Uint8Array([1, 2, 3]) },
        ],
      };
      (aiService.generateImage as jest.Mock).mockResolvedValue(mockResult);

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useImageGeneration({ onSuccess }));

      await act(async () => {
        await result.current.generate("A beautiful sunset");
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });

    it("should handle errors", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      (aiService.generateImage as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      const onError = jest.fn();
      const { result } = renderHook(() => useImageGeneration({ onError }));

      await act(async () => {
        await result.current.generate("A beautiful sunset");
      });

      expect(result.current.error).toBe("API Error");
      expect(onError).toHaveBeenCalled();
    });

    it("should use custom options when provided", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        images: [
          { base64: "base64data", uint8Array: new Uint8Array([1, 2, 3]) },
        ],
      };
      (aiService.generateImage as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useImageGeneration());

      await act(async () => {
        await result.current.generate("A sunset", {
          size: "1792x1024",
          quality: "hd",
          style: "natural",
        });
      });

      expect(aiService.generateImage).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          size: "1792x1024",
          quality: "hd",
          style: "natural",
        })
      );
    });
  });

  describe("clearResult", () => {
    it("should clear result", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        images: [
          { base64: "base64data", uint8Array: new Uint8Array([1, 2, 3]) },
        ],
      };
      (aiService.generateImage as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useImageGeneration());

      await act(async () => {
        await result.current.generate("A sunset");
      });

      expect(result.current.result).not.toBeNull();

      act(() => {
        result.current.clearResult();
      });

      expect(result.current.result).toBeNull();
    });
  });

  describe("clearError", () => {
    it("should clear error", async () => {
      const { result } = renderHook(() => useImageGeneration());

      await act(async () => {
        await result.current.generate("");
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe("useSpeechSynthesis", () => {
  describe("Initial State", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      expect(result.current.isSynthesizing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.audioUrl).toBeNull();
      expect(result.current.isPlaying).toBe(false);
    });

    it("should have synthesize function", () => {
      const { result } = renderHook(() => useSpeechSynthesis());
      expect(typeof result.current.synthesize).toBe("function");
    });

    it("should have playback control functions", () => {
      const { result } = renderHook(() => useSpeechSynthesis());
      expect(typeof result.current.play).toBe("function");
      expect(typeof result.current.pause).toBe("function");
      expect(typeof result.current.stop).toBe("function");
    });
  });

  describe("synthesize", () => {
    it("should set error for empty text", async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.synthesize("");
      });

      expect(result.current.error).toBe("Text cannot be empty");
    });

    it("should set error when API key is missing", async () => {
      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.synthesize("Hello world");
      });

      expect(result.current.error).toContain("API key");
    });

    it("should call generateSpeech with correct parameters", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        audio: new Uint8Array([1, 2, 3]),
        mimeType: "audio/mpeg",
      };
      (aiService.generateSpeech as jest.Mock).mockResolvedValue(mockResult);
      (aiService.createAudioBlobUrl as jest.Mock).mockReturnValue(
        "blob:mock-url"
      );

      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.synthesize("Hello world");
      });

      expect(aiService.generateSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "openai",
          apiKey: "sk-test-key",
          model: "tts-1",
        }),
        expect.objectContaining({
          text: "Hello world",
          voice: "alloy",
          speed: 1.0,
        })
      );
    });

    it("should set result and audioUrl on success", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        audio: new Uint8Array([1, 2, 3]),
        mimeType: "audio/mpeg",
      };
      (aiService.generateSpeech as jest.Mock).mockResolvedValue(mockResult);
      (aiService.createAudioBlobUrl as jest.Mock).mockReturnValue(
        "blob:mock-url"
      );

      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.synthesize("Hello world");
      });

      expect(result.current.result).toEqual(mockResult);
      expect(result.current.audioUrl).toBe("blob:mock-url");
    });

    it("should handle errors", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      (aiService.generateSpeech as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.synthesize("Hello world");
      });

      expect(result.current.error).toBe("API Error");
    });
  });

  describe("clearResult", () => {
    it("should clear result and audioUrl", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        audio: new Uint8Array([1, 2, 3]),
        mimeType: "audio/mpeg",
      };
      (aiService.generateSpeech as jest.Mock).mockResolvedValue(mockResult);
      (aiService.createAudioBlobUrl as jest.Mock).mockReturnValue(
        "blob:mock-url"
      );

      const { result } = renderHook(() => useSpeechSynthesis());

      await act(async () => {
        await result.current.synthesize("Hello");
      });

      expect(result.current.result).not.toBeNull();

      act(() => {
        result.current.clearResult();
      });

      expect(result.current.result).toBeNull();
      expect(result.current.audioUrl).toBeNull();
    });
  });
});

describe("useTranscription", () => {
  describe("Initial State", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useTranscription());

      expect(result.current.isTranscribing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });

    it("should have transcribe function", () => {
      const { result } = renderHook(() => useTranscription());
      expect(typeof result.current.transcribe).toBe("function");
    });

    it("should have transcribeFromUrl function", () => {
      const { result } = renderHook(() => useTranscription());
      expect(typeof result.current.transcribeFromUrl).toBe("function");
    });

    it("should have isValidFile function", () => {
      const { result } = renderHook(() => useTranscription());
      expect(typeof result.current.isValidFile).toBe("function");
    });
  });

  describe("transcribe", () => {
    it("should set error for invalid file format", async () => {
      (aiService.isValidAudioFile as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useTranscription());
      const file = new File([""], "test.txt", { type: "text/plain" });

      await act(async () => {
        await result.current.transcribe(file);
      });

      expect(result.current.error).toContain("Invalid audio file format");
    });

    it("should set error when API key is missing", async () => {
      (aiService.isValidAudioFile as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useTranscription());
      const file = new File([""], "test.mp3", { type: "audio/mpeg" });

      await act(async () => {
        await result.current.transcribe(file);
      });

      expect(result.current.error).toContain("API key");
    });

    it("should call transcribeAudio with correct parameters", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      (aiService.isValidAudioFile as jest.Mock).mockReturnValue(true);
      (aiService.readAudioFile as jest.Mock).mockResolvedValue(
        new Uint8Array([1, 2, 3])
      );

      const mockResult = {
        text: "Hello world",
        language: "en",
      };
      (aiService.transcribeAudio as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useTranscription());
      const file = new File([""], "test.mp3", { type: "audio/mpeg" });

      await act(async () => {
        await result.current.transcribe(file);
      });

      expect(aiService.transcribeAudio).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "openai",
          apiKey: "sk-test-key",
          model: "whisper-1",
        }),
        expect.objectContaining({
          audio: expect.any(Uint8Array),
        })
      );
    });

    it("should set result on success", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      (aiService.isValidAudioFile as jest.Mock).mockReturnValue(true);
      (aiService.readAudioFile as jest.Mock).mockResolvedValue(
        new Uint8Array([1, 2, 3])
      );

      const mockResult = {
        text: "Hello world",
        language: "en",
      };
      (aiService.transcribeAudio as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useTranscription());
      const file = new File([""], "test.mp3", { type: "audio/mpeg" });

      await act(async () => {
        await result.current.transcribe(file);
      });

      expect(result.current.result).toEqual(mockResult);
    });

    it("should handle errors", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      (aiService.isValidAudioFile as jest.Mock).mockReturnValue(true);
      (aiService.readAudioFile as jest.Mock).mockResolvedValue(
        new Uint8Array([1, 2, 3])
      );
      (aiService.transcribeAudio as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      const { result } = renderHook(() => useTranscription());
      const file = new File([""], "test.mp3", { type: "audio/mpeg" });

      await act(async () => {
        await result.current.transcribe(file);
      });

      expect(result.current.error).toBe("API Error");
    });
  });

  describe("transcribeFromUrl", () => {
    it("should set error when API key is missing", async () => {
      const { result } = renderHook(() => useTranscription());

      await act(async () => {
        await result.current.transcribeFromUrl("https://example.com/audio.mp3");
      });

      expect(result.current.error).toContain("API key");
    });

    it("should call transcribeAudio with URL", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");

      const mockResult = {
        text: "Hello world",
        language: "en",
      };
      (aiService.transcribeAudio as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useTranscription());

      await act(async () => {
        await result.current.transcribeFromUrl("https://example.com/audio.mp3");
      });

      expect(aiService.transcribeAudio).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          audio: expect.any(URL),
        })
      );
    });
  });

  describe("clearResult", () => {
    it("should clear result", async () => {
      useAIChatStore.getState().setAPIKey("openai", "sk-test-key");
      (aiService.isValidAudioFile as jest.Mock).mockReturnValue(true);
      (aiService.readAudioFile as jest.Mock).mockResolvedValue(
        new Uint8Array([1, 2, 3])
      );

      const mockResult = { text: "Hello", language: "en" };
      (aiService.transcribeAudio as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useTranscription());
      const file = new File([""], "test.mp3", { type: "audio/mpeg" });

      await act(async () => {
        await result.current.transcribe(file);
      });

      expect(result.current.result).not.toBeNull();

      act(() => {
        result.current.clearResult();
      });

      expect(result.current.result).toBeNull();
    });
  });
});

describe("Utility Functions", () => {
  describe("downloadImage", () => {
    it("should create and click download link", () => {
      const mockClick = jest.fn();
      const mockAppendChild = jest
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => null as unknown as Node);
      const mockRemoveChild = jest
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => null as unknown as Node);

      const mockLink = {
        href: "",
        download: "",
        click: mockClick,
      };
      jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      downloadImage("base64data", "test-image.png");

      expect(mockLink.href).toContain("data:image/png;base64,base64data");
      expect(mockLink.download).toBe("test-image.png");
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();

      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });

  describe("downloadAudio", () => {
    it("should create and click download link", () => {
      const mockClick = jest.fn();
      const mockAppendChild = jest
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => null as unknown as Node);
      const mockRemoveChild = jest
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => null as unknown as Node);

      const mockLink = {
        href: "",
        download: "",
        click: mockClick,
      };
      jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      downloadAudio("blob:mock-url", "test-audio.mp3");

      expect(mockLink.href).toBe("blob:mock-url");
      expect(mockLink.download).toBe("test-audio.mp3");
      expect(mockClick).toHaveBeenCalled();

      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });

  describe("copyToClipboard", () => {
    it("should copy text to clipboard", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      });

      const result = await copyToClipboard("Hello world");

      expect(mockWriteText).toHaveBeenCalledWith("Hello world");
      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error("Failed"));
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      });

      const result = await copyToClipboard("Hello world");

      expect(result).toBe(false);
    });
  });
});
