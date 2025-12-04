/**
 * Tests for markdown utility functions
 */

import {
  slugify,
  extractHeadings,
  parseAdmonitions,
  processKeyboardShortcuts,
  getContentStats,
  searchInContent,
  validateMarkdown,
  normalizeLineEndings,
  ADMONITION_TYPES,
  wrapTextWithMarkers,
  insertTextAtCursor,
  toggleLinePrefix,
  generateMarkdownTable,
  generateCodeBlock,
  generateMarkdownLink,
  generateMarkdownImage,
  extractPlainText,
  getCurrentLine,
  isInsideCodeBlock,
} from "./markdown-utils";

describe("slugify", () => {
  it("should convert text to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("hello world test")).toBe("hello-world-test");
  });

  it("should remove special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("should handle leading and trailing spaces", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("should preserve CJK characters", () => {
    expect(slugify("你好世界")).toBe("你好世界");
    expect(slugify("Hello 世界")).toBe("hello-世界");
  });

  it("should preserve Japanese characters", () => {
    expect(slugify("こんにちは")).toBe("こんにちは");
    expect(slugify("テスト")).toBe("テスト");
  });

  it("should preserve Korean characters", () => {
    expect(slugify("안녕하세요")).toBe("안녕하세요");
  });

  it("should handle empty string", () => {
    expect(slugify("")).toBe("heading");
  });

  it("should handle string with only special characters", () => {
    expect(slugify("!@#$%")).toBe("heading");
  });

  it("should handle duplicates with existingSlugs", () => {
    const existingSlugs = new Set<string>();
    expect(slugify("test", existingSlugs)).toBe("test");
    expect(slugify("test", existingSlugs)).toBe("test-1");
    expect(slugify("test", existingSlugs)).toBe("test-2");
  });

  it("should not modify existingSlugs when not provided", () => {
    expect(slugify("test")).toBe("test");
    expect(slugify("test")).toBe("test");
  });
});

describe("extractHeadings", () => {
  it("should extract ATX-style headings", () => {
    const markdown = `# Heading 1
## Heading 2
### Heading 3`;
    const headings = extractHeadings(markdown);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({
      id: "heading-1",
      text: "Heading 1",
      level: 1,
    });
    expect(headings[1]).toEqual({
      id: "heading-2",
      text: "Heading 2",
      level: 2,
    });
    expect(headings[2]).toEqual({
      id: "heading-3",
      text: "Heading 3",
      level: 3,
    });
  });

  it("should handle all heading levels", () => {
    const markdown = `# H1
## H2
### H3
#### H4
##### H5
###### H6`;
    const headings = extractHeadings(markdown);
    expect(headings).toHaveLength(6);
    expect(headings.map((h) => h.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("should remove inline formatting from heading text", () => {
    const markdown = `# **Bold** Heading
## *Italic* Heading
### \`Code\` Heading
#### ~~Strikethrough~~ Heading`;
    const headings = extractHeadings(markdown);
    expect(headings[0].text).toBe("Bold Heading");
    expect(headings[1].text).toBe("Italic Heading");
    expect(headings[2].text).toBe("Code Heading");
    expect(headings[3].text).toBe("Strikethrough Heading");
  });

  it("should remove links from heading text", () => {
    const markdown = "# [Link Text](https://example.com) Heading";
    const headings = extractHeadings(markdown);
    expect(headings[0].text).toBe("Link Text Heading");
  });

  it("should handle duplicate headings with unique IDs", () => {
    const markdown = `# Test
## Test
### Test`;
    const headings = extractHeadings(markdown);
    expect(headings[0].id).toBe("test");
    expect(headings[1].id).toBe("test-1");
    expect(headings[2].id).toBe("test-2");
  });

  it("should handle CJK headings", () => {
    const markdown = "# 中文标题";
    const headings = extractHeadings(markdown);
    expect(headings[0]).toEqual({ id: "中文标题", text: "中文标题", level: 1 });
  });

  it("should return empty array for content without headings", () => {
    const markdown = "Just some text\nNo headings here";
    const headings = extractHeadings(markdown);
    expect(headings).toHaveLength(0);
  });

  it("should not match headings without space after #", () => {
    const markdown = "#NoSpace\n#Also no space";
    const headings = extractHeadings(markdown);
    expect(headings).toHaveLength(0);
  });
});

describe("parseAdmonitions", () => {
  it("should parse basic admonition", () => {
    const markdown = `!!! note
    This is a note.`;
    const result = parseAdmonitions(markdown);
    expect(result.admonitions).toHaveLength(1);
    expect(result.admonitions[0].type).toBe("note");
    expect(result.admonitions[0].title).toBe("Note");
    expect(result.admonitions[0].content).toBe("This is a note.");
  });

  it("should parse admonition with custom title", () => {
    const markdown = `!!! warning "Custom Warning Title"
    Warning content here.`;
    const result = parseAdmonitions(markdown);
    expect(result.admonitions[0].title).toBe("Custom Warning Title");
  });

  it("should parse multiple admonitions", () => {
    const markdown = `!!! note
    Note content.

!!! tip
    Tip content.`;
    const result = parseAdmonitions(markdown);
    expect(result.admonitions).toHaveLength(2);
    expect(result.admonitions[0].type).toBe("note");
    expect(result.admonitions[1].type).toBe("tip");
  });

  it("should handle multi-line admonition content", () => {
    const markdown = `!!! info
    Line 1
    Line 2
    Line 3`;
    const result = parseAdmonitions(markdown);
    expect(result.admonitions[0].content).toBe("Line 1\nLine 2\nLine 3");
  });

  it("should handle tab indentation", () => {
    const markdown = `!!! note
\tTabbed content.`;
    const result = parseAdmonitions(markdown);
    expect(result.admonitions[0].content).toBe("Tabbed content.");
  });

  it("should handle collapsible admonitions (???)", () => {
    const markdown = `??? tip "Collapsible Tip"
    Hidden content.`;
    const result = parseAdmonitions(markdown);
    expect(result.admonitions).toHaveLength(1);
    expect(result.admonitions[0].type).toBe("tip");
    expect(result.admonitions[0].title).toBe("Collapsible Tip");
  });

  it("should replace admonitions with placeholders", () => {
    const markdown = `Before

!!! note
    Content

After`;
    const result = parseAdmonitions(markdown);
    expect(result.processed).toContain("__ADMONITION_0__");
    expect(result.processed).toContain("Before");
    expect(result.processed).toContain("After");
  });

  it("should handle empty content", () => {
    const markdown = "";
    const result = parseAdmonitions(markdown);
    expect(result.admonitions).toHaveLength(0);
    expect(result.processed).toBe("");
  });

  it("should handle content without admonitions", () => {
    const markdown = "Just regular content\nNo admonitions here";
    const result = parseAdmonitions(markdown);
    expect(result.admonitions).toHaveLength(0);
    expect(result.processed).toBe(markdown);
  });

  it("should use type as title for unknown types", () => {
    const markdown = `!!! customtype
    Content`;
    const result = parseAdmonitions(markdown);
    expect(result.admonitions[0].title).toBe("customtype");
  });
});

describe("processKeyboardShortcuts", () => {
  it("should convert single key shortcut", () => {
    const result = processKeyboardShortcuts("Press ++Enter++ to continue");
    expect(result).toBe("Press <kbd>Enter</kbd> to continue");
  });

  it("should convert compound shortcuts", () => {
    const result = processKeyboardShortcuts("Press ++Ctrl+S++ to save");
    expect(result).toBe("Press <kbd>Ctrl</kbd>+<kbd>S</kbd> to save");
  });

  it("should convert multiple shortcuts in same line", () => {
    const result = processKeyboardShortcuts(
      "++Ctrl+C++ to copy, ++Ctrl+V++ to paste"
    );
    expect(result).toBe(
      "<kbd>Ctrl</kbd>+<kbd>C</kbd> to copy, <kbd>Ctrl</kbd>+<kbd>V</kbd> to paste"
    );
  });

  it("should handle three-key combinations", () => {
    const result = processKeyboardShortcuts("++Ctrl+Shift+P++");
    expect(result).toBe("<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>");
  });

  it("should not modify text without shortcuts", () => {
    const text = "Regular text without shortcuts";
    expect(processKeyboardShortcuts(text)).toBe(text);
  });

  it("should handle spaces around keys", () => {
    const result = processKeyboardShortcuts("++ Ctrl + S ++");
    expect(result).toBe("<kbd>Ctrl</kbd>+<kbd>S</kbd>");
  });
});

describe("getContentStats", () => {
  it("should count words correctly", () => {
    const stats = getContentStats("Hello world this is a test");
    expect(stats.words).toBe(6);
  });

  it("should count characters correctly", () => {
    const stats = getContentStats("Hello");
    expect(stats.characters).toBe(5);
  });

  it("should count lines correctly", () => {
    const stats = getContentStats("Line 1\nLine 2\nLine 3");
    expect(stats.lines).toBe(3);
  });

  it("should count headings correctly", () => {
    const stats = getContentStats("# H1\n## H2\nText\n### H3");
    expect(stats.headings).toBe(3);
  });

  it("should count code blocks correctly", () => {
    const stats = getContentStats(
      "```js\ncode\n```\n\n```python\nmore code\n```"
    );
    expect(stats.codeBlocks).toBe(2);
  });

  it("should count links correctly", () => {
    const stats = getContentStats("[Link 1](url1) and [Link 2](url2)");
    expect(stats.links).toBe(2);
  });

  it("should count images correctly", () => {
    const stats = getContentStats("![Alt 1](img1.png) and ![Alt 2](img2.png)");
    expect(stats.images).toBe(2);
  });

  it("should not count images as links", () => {
    const stats = getContentStats("![Image](img.png) [Link](url)");
    expect(stats.links).toBe(1);
    expect(stats.images).toBe(1);
  });

  it("should handle empty content", () => {
    const stats = getContentStats("");
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.lines).toBe(1); // Empty string still has one "line"
  });
});

describe("searchInContent", () => {
  it("should find matches in content", () => {
    const results = searchInContent("Hello world, hello again", "hello");
    expect(results).toHaveLength(2);
  });

  it("should be case-insensitive by default", () => {
    const results = searchInContent("Hello HELLO hello", "hello");
    expect(results).toHaveLength(3);
  });

  it("should support case-sensitive search", () => {
    const results = searchInContent("Hello HELLO hello", "hello", true);
    expect(results).toHaveLength(1);
  });

  it("should include context in results", () => {
    const results = searchInContent(
      "This is a test string with test word",
      "test"
    );
    expect(results[0].context).toContain("test");
  });

  it("should include line numbers", () => {
    const results = searchInContent(
      "Line 1\nLine 2 with match\nLine 3",
      "match"
    );
    expect(results[0].lineNumber).toBe(2);
  });

  it("should return empty array for empty query", () => {
    const results = searchInContent("Some content", "");
    expect(results).toHaveLength(0);
  });

  it("should return empty array for whitespace-only query", () => {
    const results = searchInContent("Some content", "   ");
    expect(results).toHaveLength(0);
  });

  it("should handle no matches", () => {
    const results = searchInContent("Hello world", "xyz");
    expect(results).toHaveLength(0);
  });
});

describe("validateMarkdown", () => {
  it("should detect trailing whitespace", () => {
    const issues = validateMarkdown("Hello world   ");
    expect(issues.some((i) => i.message === "Trailing whitespace")).toBe(true);
  });

  it("should detect empty link URLs", () => {
    const issues = validateMarkdown("[Link text]()");
    expect(issues.some((i) => i.message === "Empty link URL")).toBe(true);
  });

  it("should detect empty image URLs", () => {
    const issues = validateMarkdown("![Alt text]()");
    expect(issues.some((i) => i.message === "Empty image URL")).toBe(true);
  });

  it("should detect unclosed code blocks", () => {
    const issues = validateMarkdown("```js\ncode here");
    expect(issues.some((i) => i.message === "Unclosed code block")).toBe(true);
  });

  it("should detect unclosed inline code", () => {
    const issues = validateMarkdown("This has `unclosed code");
    expect(
      issues.some((i) => i.message === "Possibly unclosed inline code")
    ).toBe(true);
  });

  it("should not report issues inside code blocks", () => {
    const issues = validateMarkdown("```\n[broken]()   \n```");
    // Should not detect trailing whitespace or empty link inside code block
    expect(issues.filter((i) => i.type === "error")).toHaveLength(0);
  });

  it("should return empty array for valid markdown", () => {
    const issues = validateMarkdown("# Valid Heading\n\nSome text [link](url)");
    expect(issues).toHaveLength(0);
  });

  it("should include line numbers in issues", () => {
    const issues = validateMarkdown("Line 1\n[broken]()");
    const brokenLink = issues.find((i) => i.message === "Empty link URL");
    expect(brokenLink?.line).toBe(2);
  });
});

describe("normalizeLineEndings", () => {
  it("should convert CRLF to LF", () => {
    expect(normalizeLineEndings("line1\r\nline2")).toBe("line1\nline2");
  });

  it("should convert CR to LF", () => {
    expect(normalizeLineEndings("line1\rline2")).toBe("line1\nline2");
  });

  it("should preserve LF", () => {
    expect(normalizeLineEndings("line1\nline2")).toBe("line1\nline2");
  });

  it("should handle mixed line endings", () => {
    expect(normalizeLineEndings("line1\r\nline2\rline3\nline4")).toBe(
      "line1\nline2\nline3\nline4"
    );
  });

  it("should handle empty string", () => {
    expect(normalizeLineEndings("")).toBe("");
  });
});

describe("ADMONITION_TYPES", () => {
  it("should have all expected types", () => {
    expect(ADMONITION_TYPES).toHaveProperty("note");
    expect(ADMONITION_TYPES).toHaveProperty("info");
    expect(ADMONITION_TYPES).toHaveProperty("tip");
    expect(ADMONITION_TYPES).toHaveProperty("warning");
    expect(ADMONITION_TYPES).toHaveProperty("danger");
    expect(ADMONITION_TYPES).toHaveProperty("error");
    expect(ADMONITION_TYPES).toHaveProperty("bug");
    expect(ADMONITION_TYPES).toHaveProperty("example");
    expect(ADMONITION_TYPES).toHaveProperty("quote");
    expect(ADMONITION_TYPES).toHaveProperty("abstract");
    expect(ADMONITION_TYPES).toHaveProperty("question");
    expect(ADMONITION_TYPES).toHaveProperty("failure");
    expect(ADMONITION_TYPES).toHaveProperty("important");
  });

  it("should have capitalized default titles", () => {
    expect(ADMONITION_TYPES.note).toBe("Note");
    expect(ADMONITION_TYPES.warning).toBe("Warning");
  });
});

describe("wrapTextWithMarkers", () => {
  it("should wrap selected text with prefix and suffix", () => {
    const result = wrapTextWithMarkers("Hello world", 6, 11, "**");
    expect(result.text).toBe("Hello **world**");
    expect(result.selectionStart).toBe(8);
    expect(result.selectionEnd).toBe(13);
  });

  it("should use custom suffix when provided", () => {
    const result = wrapTextWithMarkers("Hello world", 0, 5, "<b>", "</b>");
    expect(result.text).toBe("<b>Hello</b> world");
  });

  it("should handle empty selection", () => {
    const result = wrapTextWithMarkers("Hello world", 5, 5, "**");
    expect(result.text).toBe("Hello**** world");
  });

  it("should handle selection at start", () => {
    const result = wrapTextWithMarkers("Hello", 0, 5, "*");
    expect(result.text).toBe("*Hello*");
  });

  it("should handle selection at end", () => {
    const result = wrapTextWithMarkers("Hello", 0, 5, "`");
    expect(result.text).toBe("`Hello`");
  });
});

describe("insertTextAtCursor", () => {
  it("should insert text at cursor position", () => {
    const result = insertTextAtCursor("Hello world", 5, " beautiful");
    expect(result.text).toBe("Hello beautiful world");
    expect(result.cursorPosition).toBe(15);
  });

  it("should insert at start", () => {
    const result = insertTextAtCursor("world", 0, "Hello ");
    expect(result.text).toBe("Hello world");
    expect(result.cursorPosition).toBe(6);
  });

  it("should insert at end", () => {
    const result = insertTextAtCursor("Hello", 5, " world");
    expect(result.text).toBe("Hello world");
    expect(result.cursorPosition).toBe(11);
  });

  it("should handle empty text", () => {
    const result = insertTextAtCursor("", 0, "Hello");
    expect(result.text).toBe("Hello");
    expect(result.cursorPosition).toBe(5);
  });
});

describe("toggleLinePrefix", () => {
  it("should add prefix when not present", () => {
    const result = toggleLinePrefix("Hello world", 0, 11, "- ");
    expect(result.text).toBe("- Hello world");
    expect(result.adjustment).toBe(2);
  });

  it("should remove prefix when present", () => {
    const result = toggleLinePrefix("- Hello world", 0, 13, "- ");
    expect(result.text).toBe("Hello world");
    expect(result.adjustment).toBe(-2);
  });

  it("should handle heading prefix", () => {
    const result = toggleLinePrefix("Hello", 0, 5, "# ");
    expect(result.text).toBe("# Hello");
    expect(result.adjustment).toBe(2);
  });

  it("should handle checkbox prefix", () => {
    const result = toggleLinePrefix("Task item", 0, 9, "- [ ] ");
    expect(result.text).toBe("- [ ] Task item");
    expect(result.adjustment).toBe(6);
  });
});

describe("generateMarkdownTable", () => {
  it("should generate a table with correct structure", () => {
    const table = generateMarkdownTable(2, 3);
    const lines = table.split("\n");
    expect(lines).toHaveLength(4); // header + separator + 2 data rows
    expect(lines[0]).toContain("Header");
    expect(lines[1]).toContain("---");
    expect(lines[2]).toContain("Cell");
  });

  it("should generate correct number of columns", () => {
    const table = generateMarkdownTable(1, 4);
    const headerCells = table.split("\n")[0].split("|").filter(Boolean);
    expect(headerCells).toHaveLength(4);
  });

  it("should generate correct number of rows", () => {
    const table = generateMarkdownTable(5, 2);
    const lines = table.split("\n");
    expect(lines).toHaveLength(7); // header + separator + 5 data rows
  });
});

describe("generateCodeBlock", () => {
  it("should generate code block without language", () => {
    const block = generateCodeBlock("const x = 1;");
    expect(block).toBe("```\nconst x = 1;\n```");
  });

  it("should generate code block with language", () => {
    const block = generateCodeBlock("const x = 1;", "javascript");
    expect(block).toBe("```javascript\nconst x = 1;\n```");
  });

  it("should handle multi-line code", () => {
    const block = generateCodeBlock("line1\nline2\nline3", "python");
    expect(block).toBe("```python\nline1\nline2\nline3\n```");
  });
});

describe("generateMarkdownLink", () => {
  it("should generate basic link", () => {
    const link = generateMarkdownLink("Click here", "https://example.com");
    expect(link).toBe("[Click here](https://example.com)");
  });

  it("should generate link with title", () => {
    const link = generateMarkdownLink(
      "Click here",
      "https://example.com",
      "Example Site"
    );
    expect(link).toBe('[Click here](https://example.com "Example Site")');
  });
});

describe("generateMarkdownImage", () => {
  it("should generate basic image", () => {
    const image = generateMarkdownImage("Alt text", "image.png");
    expect(image).toBe("![Alt text](image.png)");
  });

  it("should generate image with title", () => {
    const image = generateMarkdownImage("Alt text", "image.png", "Image Title");
    expect(image).toBe('![Alt text](image.png "Image Title")');
  });

  it("should handle empty alt text", () => {
    const image = generateMarkdownImage("", "image.png");
    expect(image).toBe("![](image.png)");
  });
});

describe("extractPlainText", () => {
  it("should remove bold formatting", () => {
    expect(extractPlainText("**bold** text")).toBe("bold text");
  });

  it("should remove italic formatting", () => {
    expect(extractPlainText("*italic* text")).toBe("italic text");
  });

  it("should remove links but keep text", () => {
    expect(extractPlainText("[link text](url)")).toBe("link text");
  });

  it("should remove images", () => {
    expect(extractPlainText("![alt](image.png) text")).toBe("alt text");
  });

  it("should remove code blocks", () => {
    expect(extractPlainText("before\n```\ncode\n```\nafter")).toBe(
      "before\n\nafter"
    );
  });

  it("should remove inline code", () => {
    expect(extractPlainText("use `code` here")).toBe("use code here");
  });

  it("should remove heading markers", () => {
    expect(extractPlainText("# Heading\nText")).toBe("Heading\nText");
  });

  it("should remove list markers", () => {
    expect(extractPlainText("- item 1\n- item 2")).toBe("item 1\nitem 2");
  });

  it("should remove blockquote markers", () => {
    expect(extractPlainText("> quoted text")).toBe("quoted text");
  });
});

describe("getCurrentLine", () => {
  it("should get line at cursor position", () => {
    const text = "Line 1\nLine 2\nLine 3";
    const result = getCurrentLine(text, 10); // cursor in "Line 2"
    expect(result.line).toBe("Line 2");
    expect(result.start).toBe(7);
    expect(result.end).toBe(13);
  });

  it("should handle cursor at start of line", () => {
    const text = "Line 1\nLine 2";
    const result = getCurrentLine(text, 7);
    expect(result.line).toBe("Line 2");
  });

  it("should handle cursor at end of line", () => {
    const text = "Line 1\nLine 2";
    const result = getCurrentLine(text, 6);
    expect(result.line).toBe("Line 1");
  });

  it("should handle single line", () => {
    const text = "Single line";
    const result = getCurrentLine(text, 5);
    expect(result.line).toBe("Single line");
    expect(result.start).toBe(0);
    expect(result.end).toBe(11);
  });

  it("should handle empty text", () => {
    const result = getCurrentLine("", 0);
    expect(result.line).toBe("");
    expect(result.start).toBe(0);
    expect(result.end).toBe(0);
  });
});

describe("isInsideCodeBlock", () => {
  it("should return true when inside code block", () => {
    const text = "before\n```\ncode here\n```\nafter";
    expect(isInsideCodeBlock(text, 15)).toBe(true); // inside "code here"
  });

  it("should return false when outside code block", () => {
    const text = "before\n```\ncode\n```\nafter";
    expect(isInsideCodeBlock(text, 3)).toBe(false); // in "before"
    expect(isInsideCodeBlock(text, 25)).toBe(false); // in "after"
  });

  it("should return false for text without code blocks", () => {
    expect(isInsideCodeBlock("regular text", 5)).toBe(false);
  });

  it("should handle multiple code blocks", () => {
    const text = "```\nblock1\n```\ntext\n```\nblock2\n```";
    expect(isInsideCodeBlock(text, 5)).toBe(true); // in block1
    expect(isInsideCodeBlock(text, 18)).toBe(false); // in "text"
    expect(isInsideCodeBlock(text, 25)).toBe(true); // in block2
  });
});
