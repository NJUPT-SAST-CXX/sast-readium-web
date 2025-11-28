/**
 * Tests for AI Service (lib/ai-service.ts)
 */

import {
  validateAPIKey,
  validateBuiltInAPIKey,
  createPDFTools,
  isValidAudioFile,
  readAudioFile,
  createAudioBlobUrl,
  type SpeechGenerationResult,
} from "./ai-service";
import type { PDFContext } from "./ai-chat-store";

// Mock the AI SDK modules
jest.mock("ai", () => ({
  streamText: jest.fn(),
  generateText: jest.fn(),
  tool: jest.fn((config) => config),
  stepCountIs: jest.fn((n) => n),
  experimental_generateImage: jest.fn(),
  experimental_generateSpeech: jest.fn(),
  experimental_transcribe: jest.fn(),
}));

// Mock the ai-providers module
jest.mock("./ai-providers", () => ({
  getLanguageModel: jest.fn(),
  getModelCapabilities: jest.fn(() => ({
    supportsVision: false,
    supportsToolCalling: true,
    supportsStreaming: true,
    maxContextWindow: 128000,
  })),
  getImageModel: jest.fn(),
  getSpeechModel: jest.fn(),
  getTranscriptionModel: jest.fn(),
}));

// Mock the mcp-client module
jest.mock("./mcp-client", () => ({
  getAllMCPTools: jest.fn(() => Promise.resolve({})),
}));

describe("AI Service", () => {
  describe("validateAPIKey", () => {
    it("should return false for empty API key", () => {
      expect(validateAPIKey("openai", "")).toBe(false);
      expect(validateAPIKey("openai", "   ")).toBe(false);
    });

    it("should validate OpenAI API key format", () => {
      expect(validateAPIKey("openai", "sk-test123")).toBe(true);
      expect(validateAPIKey("openai", "invalid-key")).toBe(false);
    });

    it("should validate Anthropic API key format", () => {
      expect(validateAPIKey("anthropic", "sk-ant-test123")).toBe(true);
      expect(validateAPIKey("anthropic", "sk-test123")).toBe(false);
    });

    it("should validate custom provider API key", () => {
      expect(validateAPIKey("custom", "any-key-12345")).toBe(true);
      expect(validateAPIKey("custom", "short")).toBe(false);
    });
  });

  describe("validateBuiltInAPIKey", () => {
    it("should return false for empty API key", () => {
      expect(validateBuiltInAPIKey("openai", "")).toBe(false);
    });

    it("should validate OpenAI API key", () => {
      expect(validateBuiltInAPIKey("openai", "sk-test123")).toBe(true);
      expect(validateBuiltInAPIKey("openai", "invalid")).toBe(false);
    });

    it("should validate Anthropic API key", () => {
      expect(validateBuiltInAPIKey("anthropic", "sk-ant-test123")).toBe(true);
      expect(validateBuiltInAPIKey("anthropic", "sk-test123")).toBe(false);
    });
  });

  describe("createPDFTools", () => {
    it("should create PDF tools without context", () => {
      const tools = createPDFTools();

      expect(tools).toHaveProperty("summarize_text");
      expect(tools).toHaveProperty("translate_text");
      expect(tools).toHaveProperty("explain_term");
      expect(tools).toHaveProperty("find_information");
      expect(tools).toHaveProperty("get_page_info");
      expect(tools).toHaveProperty("generate_study_notes");
    });

    it("should create PDF tools with context", () => {
      const context: PDFContext = {
        fileName: "test.pdf",
        currentPage: 5,
        totalPages: 100,
        pageText: "Sample page text",
        selectedText: "Selected text",
        annotations: [{ type: "highlight", text: "Important", pageNumber: 5 }],
        bookmarks: [{ title: "Chapter 1", pageNumber: 1 }],
      };

      const tools = createPDFTools(context);

      expect(tools).toHaveProperty("summarize_text");
      expect(tools).toHaveProperty("translate_text");
      expect(tools).toHaveProperty("explain_term");
      expect(tools).toHaveProperty("find_information");
      expect(tools).toHaveProperty("get_page_info");
      expect(tools).toHaveProperty("generate_study_notes");
    });

    it("should have proper tool structure", () => {
      const tools = createPDFTools();

      // Each tool should have description and inputSchema
      expect(tools.summarize_text).toHaveProperty("description");
      expect(tools.summarize_text).toHaveProperty("inputSchema");
      expect(tools.summarize_text).toHaveProperty("execute");
    });
  });

  describe("Tool Execution", () => {
    const mockContext: PDFContext = {
      fileName: "test.pdf",
      currentPage: 5,
      totalPages: 100,
      pageText: "This is sample page text with some content to search.",
      selectedText: "selected portion",
      annotations: [
        { type: "highlight", text: "Important note", pageNumber: 5 },
      ],
      bookmarks: [{ title: "Chapter 1", pageNumber: 1 }],
    };

    it("should execute summarize_text tool", async () => {
      const tools = createPDFTools(mockContext);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const execute = (tools.summarize_text as any).execute;
      expect(execute).toBeDefined();

      const result = await execute({
        text: "Long text to summarize",
        length: "short",
      });

      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("originalLength");
      expect(result).toHaveProperty("requestedLength", "short");
    });

    it("should execute translate_text tool", async () => {
      const tools = createPDFTools(mockContext);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const execute = (tools.translate_text as any).execute;
      expect(execute).toBeDefined();

      const result = await execute({
        text: "Text to translate",
        targetLanguage: "Chinese",
        preserveFormatting: true,
      });

      expect(result).toHaveProperty("originalText");
      expect(result).toHaveProperty("targetLanguage", "Chinese");
      expect(result).toHaveProperty("preserveFormatting", true);
    });

    it("should execute explain_term tool", async () => {
      const tools = createPDFTools(mockContext);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const execute = (tools.explain_term as any).execute;
      expect(execute).toBeDefined();

      const result = await execute({
        term: "API",
        context: "Software development",
        level: "intermediate",
      });

      expect(result).toHaveProperty("term", "API");
      expect(result).toHaveProperty("level", "intermediate");
      expect(result).toHaveProperty("documentPage", 5);
    });

    it("should execute find_information tool", async () => {
      const tools = createPDFTools(mockContext);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const execute = (tools.find_information as any).execute;
      expect(execute).toBeDefined();

      const result = await execute({
        query: "sample",
        includePageNumbers: true,
      });

      expect(result).toHaveProperty("query", "sample");
      expect(result).toHaveProperty("results");
      expect(result).toHaveProperty("totalPages", 100);
      expect(result).toHaveProperty("currentPage", 5);
      // Should find "sample" in the page text
      expect(result.results.length).toBeGreaterThan(0);
    });

    it("should execute get_page_info tool", async () => {
      const tools = createPDFTools(mockContext);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const execute = (tools.get_page_info as any).execute;
      expect(execute).toBeDefined();

      const result = await execute({});

      expect(result).toHaveProperty("pageNumber", 5);
      expect(result).toHaveProperty("totalPages", 100);
      expect(result).toHaveProperty("fileName", "test.pdf");
      expect(result).toHaveProperty("hasSelectedText", true);
      expect(result).toHaveProperty("annotationCount", 1);
      expect(result).toHaveProperty("bookmarkCount", 1);
    });

    it("should execute generate_study_notes tool", async () => {
      const tools = createPDFTools(mockContext);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const execute = (tools.generate_study_notes as any).execute;
      expect(execute).toBeDefined();

      const result = await execute({
        format: "outline",
        includePageReferences: true,
      });

      expect(result).toHaveProperty("format", "outline");
      expect(result).toHaveProperty("includePageReferences", true);
      expect(result).toHaveProperty("annotationCount", 1);
      expect(result).toHaveProperty("bookmarkCount", 1);
    });
  });

  describe("Audio File Validation", () => {
    it("should validate supported audio formats by MIME type", () => {
      const validFile = new File([""], "test.mp3", { type: "audio/mpeg" });
      expect(isValidAudioFile(validFile)).toBe(true);

      const mp4File = new File([""], "test.mp4", { type: "audio/mp4" });
      expect(isValidAudioFile(mp4File)).toBe(true);

      const wavFile = new File([""], "test.wav", { type: "audio/wav" });
      expect(isValidAudioFile(wavFile)).toBe(true);
    });

    it("should validate supported audio formats by extension", () => {
      const mp3File = new File([""], "test.mp3", { type: "" });
      expect(isValidAudioFile(mp3File)).toBe(true);

      const flacFile = new File([""], "test.flac", { type: "" });
      expect(isValidAudioFile(flacFile)).toBe(true);

      const oggFile = new File([""], "test.ogg", { type: "" });
      expect(isValidAudioFile(oggFile)).toBe(true);
    });

    it("should reject unsupported audio formats", () => {
      const txtFile = new File([""], "test.txt", { type: "text/plain" });
      expect(isValidAudioFile(txtFile)).toBe(false);

      const pdfFile = new File([""], "test.pdf", { type: "application/pdf" });
      expect(isValidAudioFile(pdfFile)).toBe(false);
    });
  });

  describe("readAudioFile", () => {
    it("should read audio file as Uint8Array", async () => {
      const content = new Uint8Array([1, 2, 3, 4, 5]);
      const file = new File([content], "test.mp3", { type: "audio/mpeg" });

      const result = await readAudioFile(file);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
    });
  });

  describe("createAudioBlobUrl", () => {
    it("should create blob URL from speech result", () => {
      // Mock URL.createObjectURL
      const mockUrl = "blob:http://localhost/test-audio";
      global.URL.createObjectURL = jest.fn(() => mockUrl);

      const result: SpeechGenerationResult = {
        audio: new Uint8Array([1, 2, 3, 4, 5]),
        mimeType: "audio/mpeg",
      };

      const url = createAudioBlobUrl(result);

      expect(url).toBe(mockUrl);
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it("should use default MIME type if not provided", () => {
      const mockUrl = "blob:http://localhost/test-audio";
      global.URL.createObjectURL = jest.fn(() => mockUrl);

      const result: SpeechGenerationResult = {
        audio: new Uint8Array([1, 2, 3]),
      };

      const url = createAudioBlobUrl(result);

      expect(url).toBe(mockUrl);
    });
  });
});

describe("AI Service - Tool Parameter Schemas", () => {
  // Import the schemas
  const { ToolParamSchemas } = jest.requireActual("./ai-service");

  it("should have valid summarize schema", () => {
    expect(ToolParamSchemas.summarize).toBeDefined();

    // Valid input
    const validResult = ToolParamSchemas.summarize.safeParse({
      text: "Some text",
      length: "short",
    });
    expect(validResult.success).toBe(true);

    // Invalid length
    const invalidResult = ToolParamSchemas.summarize.safeParse({
      text: "Some text",
      length: "invalid",
    });
    expect(invalidResult.success).toBe(false);
  });

  it("should have valid translate schema", () => {
    expect(ToolParamSchemas.translate).toBeDefined();

    const validResult = ToolParamSchemas.translate.safeParse({
      text: "Hello",
      targetLanguage: "Chinese",
    });
    expect(validResult.success).toBe(true);
  });

  it("should have valid explain schema", () => {
    expect(ToolParamSchemas.explain).toBeDefined();

    const validResult = ToolParamSchemas.explain.safeParse({
      term: "API",
      level: "simple",
    });
    expect(validResult.success).toBe(true);

    // With optional context
    const withContext = ToolParamSchemas.explain.safeParse({
      term: "API",
      context: "Software development",
      level: "advanced",
    });
    expect(withContext.success).toBe(true);
  });

  it("should have valid findInformation schema", () => {
    expect(ToolParamSchemas.findInformation).toBeDefined();

    const validResult = ToolParamSchemas.findInformation.safeParse({
      query: "search term",
    });
    expect(validResult.success).toBe(true);
  });

  it("should have valid generateStudyGuide schema", () => {
    expect(ToolParamSchemas.generateStudyGuide).toBeDefined();

    const validResult = ToolParamSchemas.generateStudyGuide.safeParse({
      annotations: [{ text: "Note 1", pageNumber: 1 }],
      format: "outline",
    });
    expect(validResult.success).toBe(true);
  });
});
