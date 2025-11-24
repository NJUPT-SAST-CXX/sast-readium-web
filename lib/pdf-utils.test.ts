import {
  loadPDFDocument,
  searchInPDF,
  savePDF,
  updatePDFMetadata,
  PDFDocumentProxy,
} from "./pdf-utils";
import { Annotation } from "./pdf-store";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Mock pdfjs-dist
jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: jest.fn(),
}));

// Mock pdf-lib
const mockPDFPage = {
  getRotation: jest.fn().mockReturnValue({ angle: 0 }),
  setRotation: jest.fn(),
  getSize: jest.fn().mockReturnValue({ width: 600, height: 800 }),
  drawRectangle: jest.fn(),
  drawText: jest.fn(),
  drawLine: jest.fn(),
  drawImage: jest.fn(),
};

const mockPDFDocInstance = {
  embedFont: jest.fn().mockResolvedValue("Helvetica"),
  embedJpg: jest.fn(),
  embedPng: jest.fn(),
  getPageCount: jest.fn().mockReturnValue(1),
  copyPages: jest.fn().mockResolvedValue([mockPDFPage]),
  addPage: jest.fn(),
  getPages: jest.fn().mockReturnValue([mockPDFPage]),
  save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  setTitle: jest.fn(),
  setAuthor: jest.fn(),
  setSubject: jest.fn(),
  setKeywords: jest.fn(),
  setCreator: jest.fn(),
  setProducer: jest.fn(),
  setCreationDate: jest.fn(),
  setModificationDate: jest.fn(),
};

jest.mock("pdf-lib", () => ({
  PDFDocument: {
    load: jest.fn(() => Promise.resolve(mockPDFDocInstance)),
    create: jest.fn(() => Promise.resolve(mockPDFDocInstance)),
  },
  StandardFonts: { Helvetica: "Helvetica" },
  rgb: jest.fn(),
  degrees: jest.fn(),
}));

describe("pdf-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadPDFDocument", () => {
    it("should load PDF document successfully", async () => {
      const mockFile = new File([""], "test.pdf");
      Object.defineProperty(mockFile, "arrayBuffer", {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      });
      const mockProxy = { numPages: 1 };
      const mockLoadingTask = {
        promise: Promise.resolve(mockProxy),
        onProgress: null,
      };
      (pdfjsLib.getDocument as jest.Mock).mockReturnValue(mockLoadingTask);

      const result = await loadPDFDocument(mockFile);
      expect(result).toBe(mockProxy);
    });

    it("should cache loaded documents", async () => {
      const mockFile = new File([""], "test.pdf");
      Object.defineProperty(mockFile, "arrayBuffer", {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      });
      const mockProxy = { numPages: 1 };
      (pdfjsLib.getDocument as jest.Mock).mockReturnValue({
        promise: Promise.resolve(mockProxy),
      });

      await loadPDFDocument(mockFile);
      await loadPDFDocument(mockFile);

      expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(1);
    });
  });

  describe("searchInPDF", () => {
    it("should find text matches", async () => {
      const mockProxy = {
        numPages: 1,
        getPage: jest.fn().mockResolvedValue({
          getTextContent: jest.fn().mockResolvedValue({
            items: [{ str: "Hello world" }],
          }),
        }),
      };

      const results = await searchInPDF(
        mockProxy as unknown as PDFDocumentProxy,
        "world"
      );
      expect(results).toHaveLength(1);
      expect(results[0].pageNumber).toBe(1);
      expect(results[0].text).toContain("world");
    });
  });

  describe("savePDF", () => {
    it("should save PDF with annotations", async () => {
      const mockFile = new File([""], "test.pdf");
      Object.defineProperty(mockFile, "arrayBuffer", {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      });
      const annotations: Annotation[] = [
        {
          id: "1",
          type: "highlight",
          pageNumber: 1,
          color: "#ffff00",
          position: { x: 0, y: 0, width: 10, height: 10 },
          timestamp: 123,
        },
      ];

      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = jest.fn();
      global.URL.revokeObjectURL = jest.fn();

      await savePDF(mockFile, annotations);

      expect(PDFDocument.load).toHaveBeenCalled();
      expect(PDFDocument.create).toHaveBeenCalled();
      expect(mockPDFDocInstance.save).toHaveBeenCalled();
      // Note: checking download trigger is hard in JSDOM without more mocks
    });
  });

  describe("updatePDFMetadata", () => {
    it("should update metadata", async () => {
      const mockFile = new File([""], "test.pdf");
      Object.defineProperty(mockFile, "arrayBuffer", {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      });
      const metadata = {
        title: "New Title",
        author: "New Author",
      };

      const result = await updatePDFMetadata(mockFile, metadata);

      expect(mockPDFDocInstance.setTitle).toHaveBeenCalledWith("New Title");
      expect(mockPDFDocInstance.setAuthor).toHaveBeenCalledWith("New Author");
      expect(result).toBeInstanceOf(File);
    });
  });
});
