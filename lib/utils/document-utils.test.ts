/**
 * Tests for document-utils
 */

import {
  getDocumentType,
  isPDF,
  isMarkdown,
  isSupportedDocument,
  getAcceptString,
  getDocumentTypeName,
  readMarkdownContent,
} from "./document-utils";

// Helper to create mock File
function createMockFile(
  name: string,
  type: string,
  content: string = ""
): File {
  return new File([content], name, { type });
}

describe("document-utils", () => {
  describe("getDocumentType", () => {
    it("should detect PDF by MIME type", () => {
      const file = createMockFile("document.pdf", "application/pdf");
      expect(getDocumentType(file)).toBe("pdf");
    });

    it("should detect PDF by extension", () => {
      const file = createMockFile("document.pdf", "");
      expect(getDocumentType(file)).toBe("pdf");
    });

    it("should detect Markdown by MIME type", () => {
      const file = createMockFile("readme.md", "text/markdown");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should detect Markdown by text/x-markdown MIME type", () => {
      const file = createMockFile("readme.md", "text/x-markdown");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should detect Markdown by text/plain MIME type with .md extension", () => {
      const file = createMockFile("readme.md", "text/plain");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should detect Markdown by .md extension", () => {
      const file = createMockFile("readme.md", "");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should detect Markdown by .markdown extension", () => {
      const file = createMockFile("readme.markdown", "");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should detect Markdown by .mdown extension", () => {
      const file = createMockFile("readme.mdown", "");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should detect Markdown by .mkdn extension", () => {
      const file = createMockFile("readme.mkdn", "");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should detect Markdown by .mkd extension", () => {
      const file = createMockFile("readme.mkd", "");
      expect(getDocumentType(file)).toBe("markdown");
    });

    it("should return unknown for unsupported types", () => {
      const file = createMockFile("image.png", "image/png");
      expect(getDocumentType(file)).toBe("unknown");
    });

    it("should return unknown for empty file", () => {
      const file = createMockFile("file", "");
      expect(getDocumentType(file)).toBe("unknown");
    });

    it("should be case insensitive for extensions", () => {
      const file = createMockFile("DOCUMENT.PDF", "");
      expect(getDocumentType(file)).toBe("pdf");
    });
  });

  describe("isPDF", () => {
    it("should return true for PDF files", () => {
      const file = createMockFile("doc.pdf", "application/pdf");
      expect(isPDF(file)).toBe(true);
    });

    it("should return false for non-PDF files", () => {
      const file = createMockFile("doc.md", "text/markdown");
      expect(isPDF(file)).toBe(false);
    });
  });

  describe("isMarkdown", () => {
    it("should return true for Markdown files", () => {
      const file = createMockFile("readme.md", "text/markdown");
      expect(isMarkdown(file)).toBe(true);
    });

    it("should return false for non-Markdown files", () => {
      const file = createMockFile("doc.pdf", "application/pdf");
      expect(isMarkdown(file)).toBe(false);
    });
  });

  describe("isSupportedDocument", () => {
    it("should return true for PDF files", () => {
      const file = createMockFile("doc.pdf", "application/pdf");
      expect(isSupportedDocument(file)).toBe(true);
    });

    it("should return true for Markdown files", () => {
      const file = createMockFile("readme.md", "text/markdown");
      expect(isSupportedDocument(file)).toBe(true);
    });

    it("should return false for unsupported files", () => {
      const file = createMockFile("image.png", "image/png");
      expect(isSupportedDocument(file)).toBe(false);
    });
  });

  describe("getAcceptString", () => {
    it("should return a comma-separated string of accepted types", () => {
      const acceptString = getAcceptString();

      expect(acceptString).toContain("application/pdf");
      expect(acceptString).toContain(".pdf");
      expect(acceptString).toContain("text/markdown");
      expect(acceptString).toContain(".md");
    });

    it("should include all markdown extensions", () => {
      const acceptString = getAcceptString();

      expect(acceptString).toContain(".md");
      expect(acceptString).toContain(".markdown");
      expect(acceptString).toContain(".mdown");
    });
  });

  describe("getDocumentTypeName", () => {
    it("should return 'PDF' for pdf type", () => {
      expect(getDocumentTypeName("pdf")).toBe("PDF");
    });

    it("should return 'Markdown' for markdown type", () => {
      expect(getDocumentTypeName("markdown")).toBe("Markdown");
    });

    it("should return 'Unknown' for unknown type", () => {
      expect(getDocumentTypeName("unknown")).toBe("Unknown");
    });
  });

  describe("readMarkdownContent", () => {
    it("should read file content as text", async () => {
      const content = "# Hello World\n\nThis is markdown.";
      const file = createMockFile("readme.md", "text/markdown", content);

      const result = await readMarkdownContent(file);
      expect(result).toBe(content);
    });

    it("should handle empty file", async () => {
      const file = createMockFile("empty.md", "text/markdown", "");

      const result = await readMarkdownContent(file);
      expect(result).toBe("");
    });

    it("should handle unicode content", async () => {
      const content = "# 你好世界\n\n这是中文内容。";
      const file = createMockFile("chinese.md", "text/markdown", content);

      const result = await readMarkdownContent(file);
      expect(result).toBe(content);
    });
  });
});
