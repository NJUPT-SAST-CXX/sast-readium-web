/**
 * Tests for useReportTemplate hook
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useReportTemplate, REPORT_TEMPLATES } from "./use-report-template";

// Mock dependencies
jest.mock("@/lib/ai/core", () => ({
  useAIChatStore: jest.fn(() => ({
    settings: {
      provider: "openai",
      model: "gpt-4",
      apiKeys: { openai: "test-key" },
    },
  })),
  chatStream: jest.fn(),
}));

jest.mock("@/lib/platform", () => ({
  getAPIKeySecurely: jest.fn().mockResolvedValue("test-api-key"),
}));

import { chatStream, type StreamResult } from "@/lib/ai/core";

const mockChatStream = chatStream as jest.MockedFunction<typeof chatStream>;

const createStreamResult = (text: string): StreamResult => ({
  text,
  toolInvocations: [],
  suggestions: [],
});

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe("useReportTemplate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useReportTemplate());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.streamingContent).toBe("");
    });

    it("should provide all templates", () => {
      const { result } = renderHook(() => useReportTemplate());

      expect(result.current.templates).toEqual(REPORT_TEMPLATES);
      expect(result.current.templates.length).toBeGreaterThan(0);
    });
  });

  describe("REPORT_TEMPLATES", () => {
    it("should have all expected template types", () => {
      const templateIds = REPORT_TEMPLATES.map((t) => t.id);

      expect(templateIds).toContain("meeting_notes");
      expect(templateIds).toContain("research_summary");
      expect(templateIds).toContain("business_report");
      expect(templateIds).toContain("literature_review");
      expect(templateIds).toContain("executive_summary");
      expect(templateIds).toContain("action_items");
      expect(templateIds).toContain("comparison_analysis");
      expect(templateIds).toContain("custom");
    });

    it("should have required fields for each template", () => {
      for (const template of REPORT_TEMPLATES) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.icon).toBeDefined();
        expect(template.systemPrompt).toBeDefined();
        expect(template.outputFormat).toBeDefined();
      }
    });
  });

  describe("generate", () => {
    it("should set error when content is empty", async () => {
      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("", "meeting_notes");
      });

      expect(result.current.error).toBe(
        "No content provided for report generation"
      );
      expect(result.current.isGenerating).toBe(false);
    });

    it("should set error when content is only whitespace", async () => {
      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("   ", "research_summary");
      });

      expect(result.current.error).toBe(
        "No content provided for report generation"
      );
    });

    it("should generate report with streaming", async () => {
      const mockMarkdown = `# Meeting Notes: Team Sync

## Summary
Brief overview of the meeting.

## Key Decisions
- Decision 1
- Decision 2

## Action Items
- [ ] Task 1 - John - Friday
- [ ] Task 2 - Jane - Monday`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onUpdate?.(mockMarkdown.slice(0, 50));
        options.onFinish?.(mockMarkdown);
        return {
          text: mockMarkdown,
          toolInvocations: [],
          suggestions: [],
        };
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Meeting content here", "meeting_notes");
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.result).not.toBeNull();
      expect(result.current.result?.templateType).toBe("meeting_notes");
      expect(result.current.result?.markdown).toBe(mockMarkdown);
    });

    it("should extract title from markdown", async () => {
      const mockMarkdown = `# Research Summary: AI in Healthcare

## Abstract
This is the abstract.`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return {
          text: mockMarkdown,
          toolInvocations: [],
          suggestions: [],
        };
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Research content", "research_summary");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(result.current.result?.title).toBe(
        "Research Summary: AI in Healthcare"
      );
    });

    it("should extract summary from markdown", async () => {
      const mockMarkdown = `# Report

## Summary
This is the summary of the report.

## Details
More content here.`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return {
          text: mockMarkdown,
          toolInvocations: [],
          suggestions: [],
        };
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "business_report");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(result.current.result?.summary).toContain("This is the summary");
    });

    it("should extract sections from markdown", async () => {
      const mockMarkdown = `# Report

## Section One
Content for section one.

## Section Two
Content for section two.
- Bullet 1
- Bullet 2`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return {
          text: mockMarkdown,
          toolInvocations: [],
          suggestions: [],
        };
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "executive_summary");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(result.current.result?.sections.length).toBe(2);
      expect(result.current.result?.sections[0].title).toBe("Section One");
      expect(result.current.result?.sections[1].title).toBe("Section Two");
    });

    it("should extract key points from markdown", async () => {
      const mockMarkdown = `# Report

## Key Points
- Point 1
- Point 2
- Point 3`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return {
          text: mockMarkdown,
          toolInvocations: [],
          suggestions: [],
        };
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "action_items");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(result.current.result?.keyPoints).toContain("Point 1");
      expect(result.current.result?.keyPoints).toContain("Point 2");
    });

    it("should extract action items from markdown", async () => {
      const mockMarkdown = `# Report

## Action Items
- [ ] Task 1
- [x] Task 2 completed
- Task 3 without checkbox`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return createStreamResult(mockMarkdown);
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "action_items");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(result.current.result?.actionItems).toBeDefined();
      expect(result.current.result?.actionItems?.length).toBeGreaterThan(0);
    });

    it("should handle custom template with instructions", async () => {
      const mockMarkdown = `# Custom Report

## Custom Section
Custom content.`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return createStreamResult(mockMarkdown);
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate(
          "Content",
          "custom",
          "Create a custom analysis"
        );
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(result.current.result?.templateType).toBe("custom");
    });

    it("should calculate word count", async () => {
      const mockMarkdown = `# Report

This is a report with some words in it.`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return createStreamResult(mockMarkdown);
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "meeting_notes");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(result.current.result?.metadata.wordCount).toBeGreaterThan(0);
    });

    it("should set generatedAt timestamp", async () => {
      const mockMarkdown = `# Report`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return createStreamResult(mockMarkdown);
      });

      const { result } = renderHook(() => useReportTemplate());
      const before = Date.now();

      await act(async () => {
        await result.current.generate("Content", "meeting_notes");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      expect(
        result.current.result?.metadata.generatedAt
      ).toBeGreaterThanOrEqual(before);
    });

    it("should handle API error", async () => {
      mockChatStream.mockImplementation(async (config, options) => {
        options.onError?.(new Error("API Error"));
        throw new Error("API Error");
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "meeting_notes");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("API Error");
      });
    });

    it("should update streaming content during generation", async () => {
      const streamingUpdates: string[] = [];

      mockChatStream.mockImplementation(async (config, options) => {
        options.onUpdate?.("Part 1");
        streamingUpdates.push("Part 1");
        options.onUpdate?.("Part 1 Part 2");
        streamingUpdates.push("Part 1 Part 2");
        options.onFinish?.("Part 1 Part 2 Part 3");
        return {
          text: "Part 1 Part 2 Part 3",
          toolInvocations: [],
          suggestions: [],
        };
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "meeting_notes");
      });

      expect(streamingUpdates.length).toBe(2);
    });
  });

  describe("clearResult", () => {
    it("should clear result and error", async () => {
      const mockMarkdown = `# Report`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return createStreamResult(mockMarkdown);
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "meeting_notes");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      act(() => {
        result.current.clearResult();
      });

      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.streamingContent).toBe("");
    });
  });

  describe("copyAsMarkdown", () => {
    it("should copy markdown to clipboard", async () => {
      const mockMarkdown = `# Report Content`;

      mockChatStream.mockImplementation(async (config, options) => {
        options.onFinish?.(mockMarkdown);
        return createStreamResult(mockMarkdown);
      });

      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.generate("Content", "meeting_notes");
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      await act(async () => {
        await result.current.copyAsMarkdown();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMarkdown);
    });

    it("should not copy if no result", async () => {
      const { result } = renderHook(() => useReportTemplate());

      await act(async () => {
        await result.current.copyAsMarkdown();
      });

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });
});
