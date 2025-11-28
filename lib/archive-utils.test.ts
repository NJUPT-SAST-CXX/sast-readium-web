import { processArchive } from "./archive-utils";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { createExtractorFromData } from "node-unrar-js";

// Mock JSZip
jest.mock("jszip", () => ({
  loadAsync: jest.fn(),
}));

// Mock pdf-lib
const mockPDFPage = {
  drawImage: jest.fn(),
};
const mockPDFDoc = {
  embedJpg: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
  embedPng: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
  addPage: jest.fn().mockReturnValue(mockPDFPage),
  save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
};
jest.mock("pdf-lib", () => ({
  PDFDocument: {
    create: jest.fn(() => Promise.resolve(mockPDFDoc)),
  },
}));

// Mock node-unrar-js
jest.mock("node-unrar-js", () => ({
  createExtractorFromData: jest.fn(),
}));

describe("archive-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processArchive", () => {
    it("should throw error for unsupported formats", async () => {
      const file = new File([""], "test.txt", { type: "text/plain" });
      await expect(processArchive(file)).rejects.toThrow(
        "Unsupported archive format"
      );
    });

    describe("ZIP processing", () => {
      it("should extract PDFs from ZIP", async () => {
        const mockFile = new File([""], "test.zip", {
          type: "application/zip",
        });
        const mockBlob = new Blob(["pdf-content"], { type: "application/pdf" });

        (JSZip.loadAsync as jest.Mock).mockResolvedValue({
          files: {
            "doc.pdf": {
              dir: false,
              name: "doc.pdf",
              async: jest.fn().mockResolvedValue(mockBlob),
            },
            "folder/": {
              dir: true,
            },
          },
        });

        const result = await processArchive(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("doc.pdf");
        expect(result[0].type).toBe("application/pdf");
      });

      it("should convert images to PDF if ZIP contains images but no PDFs", async () => {
        const mockFile = new File([""], "comic.cbz", {
          type: "application/zip",
        });
        const mockImageBuffer = new ArrayBuffer(10);

        (JSZip.loadAsync as jest.Mock).mockResolvedValue({
          files: {
            "page1.jpg": {
              dir: false,
              name: "page1.jpg",
              async: jest.fn().mockResolvedValue(mockImageBuffer),
            },
            "page2.png": {
              dir: false,
              name: "page2.png",
              async: jest.fn().mockResolvedValue(mockImageBuffer),
            },
          },
        });

        const result = await processArchive(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("comic.pdf"); // .cbz replaced with .pdf
        expect(PDFDocument.create).toHaveBeenCalled();
        expect(mockPDFDoc.embedJpg).toHaveBeenCalled();
        expect(mockPDFDoc.embedPng).toHaveBeenCalled();
        expect(mockPDFDoc.addPage).toHaveBeenCalledTimes(2);
        expect(mockPDFDoc.save).toHaveBeenCalled();
      });
    });

    describe("RAR processing", () => {
      it("should extract PDFs from RAR", async () => {
        // Create a mock file with arrayBuffer method
        const mockArrayBuffer = new ArrayBuffer(10);
        const mockFile = new File(["test"], "test.rar");
        mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);

        const mockExtractor = {
          extract: jest.fn().mockReturnValue({
            files: [
              {
                fileHeader: { name: "doc.pdf", flags: { directory: false } },
                extraction: { buffer: new Uint8Array(10) },
              },
            ],
          }),
        };
        (createExtractorFromData as jest.Mock).mockResolvedValue(mockExtractor);

        const result = await processArchive(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("doc.pdf");
      });

      it("should convert images to PDF from RAR", async () => {
        // Create a mock file with arrayBuffer method
        const mockArrayBuffer = new ArrayBuffer(10);
        const mockFile = new File(["test"], "comic.cbr");
        mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);

        const mockExtractor = {
          extract: jest.fn().mockReturnValue({
            files: [
              {
                fileHeader: { name: "p1.jpg", flags: { directory: false } },
                extraction: { buffer: new Uint8Array(10) },
              },
            ],
          }),
        };
        (createExtractorFromData as jest.Mock).mockResolvedValue(mockExtractor);

        const result = await processArchive(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("comic.pdf");
        expect(PDFDocument.create).toHaveBeenCalled();
      });
    });
  });
});
