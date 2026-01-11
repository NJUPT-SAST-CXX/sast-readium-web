import { markdownToHtml, downloadFile } from "./markdown-export";

describe("markdown-export utilities", () => {
  describe("markdownToHtml", () => {
    it("should convert headers", () => {
      const html = markdownToHtml("# Title");
      expect(html).toContain("<h1>Title</h1>");
    });

    it("should convert bold text", () => {
      const html = markdownToHtml("**bold**");
      expect(html).toContain("<strong>bold</strong>");
    });

    it("should convert italic text", () => {
      const html = markdownToHtml("*italic*");
      expect(html).toContain("<em>italic</em>");
    });

    it("should convert links", () => {
      const html = markdownToHtml("[link](http://example.com)");
      expect(html).toContain('<a href="http://example.com">link</a>');
    });

    it("should convert images", () => {
      const html = markdownToHtml("![alt](image.png)");
      expect(html).toContain('<img src="image.png" alt="alt" />');
    });

    it("should convert inline code", () => {
      const html = markdownToHtml("`code`");
      expect(html).toContain("<code>code</code>");
    });

    it("should include title in document", () => {
      const html = markdownToHtml("content", "My Document");
      expect(html).toContain("<title>My Document</title>");
    });

    it("should escape HTML in title", () => {
      const html = markdownToHtml("content", "<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>alert");
    });

    it("should include CSS styles", () => {
      const html = markdownToHtml("content");
      expect(html).toContain("<style>");
      expect(html).toContain("font-family");
    });
  });

  describe("downloadFile", () => {
    let mockCreateElement: jest.SpyInstance;
    let mockAppendChild: jest.SpyInstance;
    let mockRemoveChild: jest.SpyInstance;
    let mockCreateObjectURL: jest.SpyInstance;
    let mockRevokeObjectURL: jest.SpyInstance;
    let mockClick: jest.Mock;

    beforeEach(() => {
      mockClick = jest.fn();
      mockCreateElement = jest
        .spyOn(document, "createElement")
        .mockReturnValue({
          href: "",
          download: "",
          click: mockClick,
        } as unknown as HTMLAnchorElement);
      mockAppendChild = jest
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => null as unknown as Node);
      mockRemoveChild = jest
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => null as unknown as Node);
      mockCreateObjectURL = jest
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:test");
      mockRevokeObjectURL = jest
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      mockCreateObjectURL.mockRestore();
      mockRevokeObjectURL.mockRestore();
    });

    it("should create and click download link", () => {
      downloadFile("content", "test.txt");
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});
