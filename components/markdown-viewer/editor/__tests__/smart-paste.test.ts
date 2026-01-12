/**
 * @jest-environment jsdom
 */

import { smartPaste, formatUrlContent } from "../smart-paste";

// Mock DataTransfer
function createMockDataTransfer(data: {
  "text/plain"?: string;
  "text/html"?: string;
}): DataTransfer {
  const items: DataTransferItem[] = [];

  return {
    getData: (type: string) => data[type as keyof typeof data] || "",
    items: items as unknown as DataTransferItemList,
  } as DataTransfer;
}

describe("smart-paste", () => {
  describe("smartPaste", () => {
    it("should return plain text as-is when no special format detected", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "Hello world",
      });

      const result = smartPaste(clipboardData);

      expect(result).toEqual({
        content: "Hello world",
        type: "plain",
      });
    });

    it("should detect and format URL as link", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "https://example.com",
      });

      const result = smartPaste(clipboardData);

      expect(result).toEqual({
        content: "[https://example.com](https://example.com)",
        type: "url",
      });
    });

    it("should wrap selected text in link when URL is pasted", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "https://example.com",
      });

      const result = smartPaste(clipboardData, "Click here");

      expect(result).toEqual({
        content: "[Click here](https://example.com)",
        type: "url",
      });
    });

    it("should convert simple HTML to markdown", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "Hello",
        "text/html": "<p><strong>Hello</strong> <em>world</em></p>",
      });

      const result = smartPaste(clipboardData);

      expect(result.type).toBe("html");
      expect(result.content).toContain("**Hello**");
      expect(result.content).toContain("*world*");
    });

    it("should convert HTML headings to markdown", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "Title",
        "text/html": "<h1>Title</h1><h2>Subtitle</h2>",
      });

      const result = smartPaste(clipboardData);

      expect(result.type).toBe("html");
      expect(result.content).toContain("# Title");
      expect(result.content).toContain("## Subtitle");
    });

    it("should convert HTML links to markdown", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "Link",
        "text/html": '<a href="https://example.com">Link</a>',
      });

      const result = smartPaste(clipboardData);

      expect(result.type).toBe("html");
      expect(result.content).toContain("[Link](https://example.com)");
    });

    it("should convert HTML lists to markdown", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "Item 1\nItem 2",
        "text/html": "<ul><li>Item 1</li><li>Item 2</li></ul>",
      });

      const result = smartPaste(clipboardData);

      expect(result.type).toBe("html");
      expect(result.content).toContain("- Item 1");
      expect(result.content).toContain("- Item 2");
    });

    it("should handle empty clipboard data", () => {
      const clipboardData = createMockDataTransfer({
        "text/plain": "",
      });

      const result = smartPaste(clipboardData);

      expect(result).toEqual({
        content: "",
        type: "plain",
      });
    });
  });

  describe("formatUrlContent", () => {
    it("should format YouTube URL as video embed", async () => {
      const result = await formatUrlContent(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      );

      expect(result).toContain("!video");
      expect(result).toContain("YouTube");
    });

    it("should format image URL as image embed", async () => {
      const result = await formatUrlContent("https://example.com/image.png");

      expect(result).toBe("![Image](https://example.com/image.png)");
    });

    it("should format GitHub repo URL with repo name", async () => {
      const result = await formatUrlContent(
        "https://github.com/facebook/react"
      );

      expect(result).toBe(
        "[facebook/react](https://github.com/facebook/react)"
      );
    });

    it("should format Twitter URL as embed", async () => {
      const result = await formatUrlContent(
        "https://twitter.com/user/status/123456789"
      );

      expect(result).toContain("@embed");
    });

    it("should format regular URL as simple link", async () => {
      const result = await formatUrlContent("https://example.com/page");

      expect(result).toBe(
        "[https://example.com/page](https://example.com/page)"
      );
    });
  });
});
