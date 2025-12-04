/**
 * Tests for Markdown AI Tools
 */

import {
  createMarkdownTools,
  buildMarkdownSystemPrompt,
  MARKDOWN_PROMPTS,
  type MarkdownContext,
} from "./markdown-ai-tools";

describe("createMarkdownTools", () => {
  it("should create all expected tools", () => {
    const tools = createMarkdownTools();

    expect(tools).toHaveProperty("summarize_markdown");
    expect(tools).toHaveProperty("improve_writing");
    expect(tools).toHaveProperty("generate_outline");
    expect(tools).toHaveProperty("translate_markdown");
    expect(tools).toHaveProperty("generate_table");
    expect(tools).toHaveProperty("generate_code");
    expect(tools).toHaveProperty("analyze_content");
    expect(tools).toHaveProperty("expand_content");
    expect(tools).toHaveProperty("simplify_content");
    expect(tools).toHaveProperty("insert_template");
  });

  it("should create tools with context", () => {
    const context: MarkdownContext = {
      content: "# Test\n\nSome content",
      fileName: "test.md",
      selectedText: "Some content",
    };

    const tools = createMarkdownTools(context);
    expect(tools).toBeDefined();
    expect(Object.keys(tools).length).toBeGreaterThan(0);
  });

  it("should have 10 tools total", () => {
    const tools = createMarkdownTools();
    expect(Object.keys(tools).length).toBe(10);
  });

  it("should create tools with null context", () => {
    const tools = createMarkdownTools(null);
    expect(tools).toBeDefined();
    expect(Object.keys(tools).length).toBe(10);
  });
});

describe("buildMarkdownSystemPrompt", () => {
  it("should return base prompt when no context", () => {
    const basePrompt = "You are a helpful assistant.";
    const result = buildMarkdownSystemPrompt(basePrompt, null);

    expect(result).toBe(basePrompt);
  });

  it("should add file name to prompt", () => {
    const basePrompt = "You are a helpful assistant.";
    const context: MarkdownContext = {
      content: "# Test",
      fileName: "document.md",
    };

    const result = buildMarkdownSystemPrompt(basePrompt, context);

    expect(result).toContain("document.md");
  });

  it("should add stats to prompt", () => {
    const basePrompt = "Base prompt";
    const context: MarkdownContext = {
      content: "# Test\n\nSome content here.",
      stats: {
        words: 10,
        characters: 50,
        lines: 3,
        headings: 1,
        codeBlocks: 0,
        links: 0,
        images: 0,
      },
    };

    const result = buildMarkdownSystemPrompt(basePrompt, context);

    expect(result).toContain("Words: 10");
    expect(result).toContain("Lines: 3");
  });

  it("should add selected text to prompt", () => {
    const basePrompt = "Base prompt";
    const context: MarkdownContext = {
      content: "Full content",
      selectedText: "Selected portion",
    };

    const result = buildMarkdownSystemPrompt(basePrompt, context);

    expect(result).toContain("Selected Text");
    expect(result).toContain("Selected portion");
  });

  it("should add document structure to prompt", () => {
    const basePrompt = "Base prompt";
    const context: MarkdownContext = {
      content: "# Main\n## Sub",
      headings: [
        { id: "main", text: "Main", level: 1 },
        { id: "sub", text: "Sub", level: 2 },
      ],
    };

    const result = buildMarkdownSystemPrompt(basePrompt, context);

    expect(result).toContain("Document Structure");
    expect(result).toContain("Main");
    expect(result).toContain("Sub");
  });
});

describe("MARKDOWN_PROMPTS", () => {
  it("should have summarize prompts for all lengths", () => {
    expect(MARKDOWN_PROMPTS.summarize).toHaveProperty("brief");
    expect(MARKDOWN_PROMPTS.summarize).toHaveProperty("standard");
    expect(MARKDOWN_PROMPTS.summarize).toHaveProperty("detailed");
  });

  it("should have improve prompts for all focus areas", () => {
    expect(MARKDOWN_PROMPTS.improve).toHaveProperty("clarity");
    expect(MARKDOWN_PROMPTS.improve).toHaveProperty("conciseness");
    expect(MARKDOWN_PROMPTS.improve).toHaveProperty("grammar");
    expect(MARKDOWN_PROMPTS.improve).toHaveProperty("style");
    expect(MARKDOWN_PROMPTS.improve).toHaveProperty("all");
  });

  it("should have tone prompts", () => {
    expect(MARKDOWN_PROMPTS.tone).toHaveProperty("formal");
    expect(MARKDOWN_PROMPTS.tone).toHaveProperty("casual");
    expect(MARKDOWN_PROMPTS.tone).toHaveProperty("technical");
    expect(MARKDOWN_PROMPTS.tone).toHaveProperty("friendly");
  });

  it("should have audience prompts", () => {
    expect(MARKDOWN_PROMPTS.audience).toHaveProperty("beginner");
    expect(MARKDOWN_PROMPTS.audience).toHaveProperty("intermediate");
    expect(MARKDOWN_PROMPTS.audience).toHaveProperty("general");
  });
});
