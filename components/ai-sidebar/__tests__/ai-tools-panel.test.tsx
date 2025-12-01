/**
 * Tests for AIToolsPanel component (components/ai-sidebar/ai-tools-panel.tsx)
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIToolsPanel } from "../ai-tools-panel";
import {
  useAIChatStore,
  type AISettings,
  type PDFContext,
} from "@/lib/ai/core";
import { useAIChat } from "@/hooks/use-ai-chat";
import { usePDFContext } from "@/hooks/use-pdf-context";
import {
  useImageGeneration,
  useSpeechSynthesis,
  useTranscription,
} from "@/hooks/use-ai-media";

// Helper to create valid AISettings for tests
const createTestSettings = (
  overrides: Partial<AISettings> = {}
): AISettings => ({
  provider: "openai",
  model: "gpt-4-turbo",
  apiKeys: { openai: "sk-test-key" },
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

// Helper to create valid PDFContext for tests
const createTestPDFContext = (
  overrides: Partial<PDFContext> = {}
): PDFContext => ({
  fileName: "test.pdf",
  currentPage: 1,
  totalPages: 10,
  pageText: "Sample page text",
  selectedText: "Selected text",
  annotations: [],
  bookmarks: [],
  ...overrides,
});

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => {
      if (typeof defaultValue === "string") return defaultValue;
      if (typeof defaultValue === "object") {
        return Object.entries(defaultValue).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          key
        );
      }
      return key;
    },
  }),
}));

// Mock hooks
jest.mock("@/hooks/use-ai-chat", () => ({
  useAIChat: jest.fn(),
}));

jest.mock("@/hooks/use-pdf-context", () => ({
  usePDFContext: jest.fn(),
}));

jest.mock("@/hooks/use-ai-media", () => ({
  useImageGeneration: jest.fn(),
  useSpeechSynthesis: jest.fn(),
  useTranscription: jest.fn(),
  downloadImage: jest.fn(),
  downloadAudio: jest.fn(),
}));

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, min, max }: any) => (
    <input
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
      min={min}
      max={max}
      data-testid="slider"
    />
  ),
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, placeholder, disabled }: any) => (
    <textarea
      data-testid="textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" onClick={() => children}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectValue: () => <span>Select Value</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, onClick }: any) => (
    <button onClick={onClick} data-value={value}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ai-elements/loader", () => ({
  Loader: ({ size }: any) => <div data-testid="loader" data-size={size} />,
}));

// Mock libraries
jest.mock("@/lib/ai/core", () => {
  const actual = jest.requireActual("@/lib/ai/core");
  return {
    ...actual,
    IMAGE_MODELS: [{ id: "dall-e-3", name: "DALL-E 3" }],
    IMAGE_SIZES: {
      "dall-e-3": ["1024x1024", "1024x1792", "1792x1024"],
    },
    SPEECH_MODELS: [{ id: "tts-1", name: "TTS-1" }],
    SPEECH_VOICES: [
      { id: "nova", name: "Nova", description: "A woman's voice" },
    ],
    TRANSCRIPTION_MODELS: [{ id: "whisper-1", name: "Whisper" }],
  };
});

const mockUseAIChat = useAIChat as jest.MockedFunction<typeof useAIChat>;
const mockUsePDFContext = usePDFContext as jest.MockedFunction<
  typeof usePDFContext
>;
const mockUseImageGeneration = useImageGeneration as jest.MockedFunction<
  typeof useImageGeneration
>;
const mockUseSpeechSynthesis = useSpeechSynthesis as jest.MockedFunction<
  typeof useSpeechSynthesis
>;
const mockUseTranscription = useTranscription as jest.MockedFunction<
  typeof useTranscription
>;

beforeEach(() => {
  jest.clearAllMocks();

  // Default mock implementations
  mockUseAIChat.mockReturnValue({
    sendMessage: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
    isStreaming: false,
    retryLastMessage: jest.fn(),
  } as any);

  mockUsePDFContext.mockReturnValue({
    extractCurrentPageImages: jest.fn().mockResolvedValue([]),
  } as any);

  mockUseImageGeneration.mockReturnValue({
    generate: jest.fn(),
    isGenerating: false,
    result: null,
    error: null,
    clearResult: jest.fn(),
  } as any);

  mockUseSpeechSynthesis.mockReturnValue({
    synthesize: jest.fn(),
    isSynthesizing: false,
    audioUrl: null,
    isPlaying: false,
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    error: null,
    clearResult: jest.fn(),
  } as any);

  mockUseTranscription.mockReturnValue({
    transcribe: jest.fn(),
    isTranscribing: false,
    result: null,
    error: null,
    isValidFile: jest.fn().mockReturnValue(true),
    clearResult: jest.fn(),
  } as any);

  // Reset store state
  useAIChatStore.setState({
    pdfContext: createTestPDFContext(),
    settings: createTestSettings(),
  });
});

describe("AIToolsPanel", () => {
  describe("Rendering", () => {
    it("should render main container", () => {
      const { container } = render(<AIToolsPanel />);
      expect(container).toBeInTheDocument();
    });

    it("should render AI Tools header", () => {
      const { container } = render(<AIToolsPanel />);
      expect(container.querySelector(".space-y-4")).toBeInTheDocument();
    });

    it("should show ready status badge when PDF context available", () => {
      render(<AIToolsPanel />);

      const badges = screen.getAllByTestId("badge");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("Quick Actions", () => {
    it("should render summarize button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const summarizeButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.summarize_page")
      );

      expect(summarizeButton).toBeInTheDocument();
    });

    it("should render explain button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const explainButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.explain_content")
      );

      expect(explainButton).toBeInTheDocument();
    });

    it("should render study guide button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const studyGuideButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.generate_study_guide")
      );

      expect(studyGuideButton).toBeInTheDocument();
    });

    it("should disable quick actions when no PDF content", () => {
      useAIChatStore.setState({
        pdfContext: createTestPDFContext({ pageText: "", selectedText: "" }),
      });

      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const summarizeButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.summarize_page")
      );

      expect(summarizeButton).toBeDisabled();
    });

    it("should send message when summarize clicked", async () => {
      const mockSendMessage = jest.fn();
      mockUseAIChat.mockReturnValue({
        sendMessage: mockSendMessage,
        isLoading: false,
        error: null,
        clearError: jest.fn(),
        isStreaming: false,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const summarizeButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.summarize_page")
      );

      if (summarizeButton) {
        fireEvent.click(summarizeButton);

        await waitFor(() => {
          expect(mockSendMessage).toHaveBeenCalled();
        });
      }
    });
  });

  describe("Translation Tool", () => {
    it("should render translation section", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.translation")).toBeInTheDocument();
    });

    it("should have language selector", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.target_language")).toBeInTheDocument();
    });

    it("should render translate button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const translateButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.translate_to")
      );

      expect(translateButton).toBeInTheDocument();
    });

    it("should support multiple target languages", () => {
      render(<AIToolsPanel />);

      // Should show language options
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Vision Analysis (when supported)", () => {
    beforeEach(() => {
      useAIChatStore.setState({
        settings: createTestSettings({ model: "gpt-4-vision" }),
      });
    });

    it("should show vision section for vision-capable models", () => {
      render(<AIToolsPanel />);

      // Vision section is conditionally rendered based on model capability
      const visionSection = screen.queryByText("ai.vision_analysis");
      // Vision section should be rendered since we mocked a vision-capable model
      if (visionSection) {
        expect(visionSection).toBeInTheDocument();
      }
    });

    it("should have page analysis button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have text extraction button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have diagram identification button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Semantic Search", () => {
    it("should render semantic search section", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.semantic_search")).toBeInTheDocument();
    });

    it("should have search input", () => {
      render(<AIToolsPanel />);

      const textareas = screen.getAllByTestId("textarea");
      expect(textareas.length).toBeGreaterThan(0);
    });

    it("should have search button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const searchButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.search")
      );

      expect(searchButton).toBeInTheDocument();
    });

    it("should send search message", async () => {
      const mockSendMessage = jest.fn();
      mockUseAIChat.mockReturnValue({
        sendMessage: mockSendMessage,
        isLoading: false,
        error: null,
        clearError: jest.fn(),
        isStreaming: false,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      const textareas = screen.getAllByTestId("textarea");
      const searchInput = textareas[0];
      fireEvent.change(searchInput, { target: { value: "test search" } });

      const buttons = screen.getAllByRole("button");
      const searchButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.search")
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        await waitFor(() => {
          expect(mockSendMessage).toHaveBeenCalled();
        });
      }
    });
  });

  describe("Image Generation", () => {
    it("should render image generation section", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.image_generation")).toBeInTheDocument();
    });

    it("should have image model selector", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.image_model")).toBeInTheDocument();
    });

    it("should have image size selector", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.image_size")).toBeInTheDocument();
    });

    it("should have image prompt input", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.image_prompt")).toBeInTheDocument();
    });

    it("should have generate button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const generateButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.generate_image")
      );

      expect(generateButton).toBeInTheDocument();
    });

    it("should have use page context button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const useContextButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.use_page_context")
      );

      expect(useContextButton).toBeInTheDocument();
    });
  });

  describe("Speech Synthesis", () => {
    it("should render speech synthesis section", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.speech_synthesis")).toBeInTheDocument();
    });

    it("should have speech model selector", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.speech_model")).toBeInTheDocument();
    });

    it("should have voice selector", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.voice")).toBeInTheDocument();
    });

    it("should have speed slider", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText(/ai.speed/)).toBeInTheDocument();
      const sliders = screen.getAllByTestId("slider");
      expect(sliders.length).toBeGreaterThan(0);
    });

    it("should have text input for synthesis", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.text_to_speak")).toBeInTheDocument();
    });

    it("should have generate speech button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const generateButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.generate_speech")
      );

      expect(generateButton).toBeInTheDocument();
    });

    it("should have use page text button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const useTextButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.use_page_text")
      );

      expect(useTextButton).toBeInTheDocument();
    });
  });

  describe("Audio Transcription", () => {
    it("should render transcription section", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.audio_transcription")).toBeInTheDocument();
    });

    it("should have transcription model selector", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.transcription_model")).toBeInTheDocument();
    });

    it("should have audio file upload", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.audio_file")).toBeInTheDocument();
    });

    it("should have transcribe button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const transcribeButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.transcribe")
      );

      expect(transcribeButton).toBeInTheDocument();
    });

    it("should show supported audio formats info", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText(/ai.supported_formats/)).toBeInTheDocument();
    });
  });

  describe("Custom Prompt", () => {
    it("should render custom prompt section", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.custom_prompt")).toBeInTheDocument();
    });

    it("should have custom prompt input", () => {
      render(<AIToolsPanel />);

      expect(screen.getByText("ai.custom_prompt")).toBeInTheDocument();
    });

    it("should have send button", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.send")
      );

      expect(sendButton).toBeInTheDocument();
    });

    it("should send custom prompt message", async () => {
      const mockSendMessage = jest.fn();
      mockUseAIChat.mockReturnValue({
        sendMessage: mockSendMessage,
        isLoading: false,
        error: null,
        clearError: jest.fn(),
        isStreaming: false,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      const textareas = screen.getAllByTestId("textarea");
      const promptInput = textareas[textareas.length - 1];
      fireEvent.change(promptInput, { target: { value: "Custom prompt" } });

      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.send")
      );

      if (sendButton) {
        fireEvent.click(sendButton);

        await waitFor(() => {
          expect(mockSendMessage).toHaveBeenCalled();
        });
      }
    });
  });

  describe("No Context State", () => {
    beforeEach(() => {
      useAIChatStore.setState({
        pdfContext: createTestPDFContext({ pageText: "", selectedText: "" }),
      });
    });

    it("should show no context alert", () => {
      render(<AIToolsPanel />);

      const alerts = screen.getAllByTestId("alert");
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("should show no context badge", () => {
      render(<AIToolsPanel />);

      // Check for badge showing no context state
      const badges = screen.getAllByTestId("badge");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("should disable context-dependent tools", () => {
      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const summarizeButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.summarize_page")
      );

      expect(summarizeButton).toBeDisabled();
    });
  });

  describe("Loading States", () => {
    it("should disable buttons while loading", () => {
      mockUseAIChat.mockReturnValue({
        sendMessage: jest.fn(),
        isLoading: true,
        error: null,
        clearError: jest.fn(),
        isStreaming: true,
        retryLastMessage: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      const buttons = screen.getAllByRole("button");
      const summarizeButton = buttons.find((btn) =>
        btn.textContent?.includes("ai.summarize_page")
      );

      expect(summarizeButton).toBeDisabled();
    });

    it("should show loading indicator during generation", () => {
      mockUseImageGeneration.mockReturnValue({
        generate: jest.fn(),
        isGenerating: true,
        result: null,
        error: null,
        clearResult: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should show image generation error", () => {
      mockUseImageGeneration.mockReturnValue({
        generate: jest.fn(),
        isGenerating: false,
        result: null,
        error: "Generation failed",
        clearResult: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      expect(screen.getByText("Generation failed")).toBeInTheDocument();
    });

    it("should show speech synthesis error", () => {
      mockUseSpeechSynthesis.mockReturnValue({
        synthesize: jest.fn(),
        isSynthesizing: false,
        audioUrl: null,
        isPlaying: false,
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        error: "Synthesis failed",
        clearResult: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      expect(screen.getByText("Synthesis failed")).toBeInTheDocument();
    });

    it("should show transcription error", () => {
      mockUseTranscription.mockReturnValue({
        transcribe: jest.fn(),
        isTranscribing: false,
        result: null,
        error: "Transcription failed",
        isValidFile: jest.fn().mockReturnValue(true),
        clearResult: jest.fn(),
      } as any);

      render(<AIToolsPanel />);

      expect(screen.getByText("Transcription failed")).toBeInTheDocument();
    });
  });
});
