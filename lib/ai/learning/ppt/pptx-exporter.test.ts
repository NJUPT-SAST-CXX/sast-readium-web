/**
 * Tests for PPTX Exporter
 */

import {
  exportToPPTX,
  downloadPPTX,
  generateSlideFromContent,
  createPresentationFromContent,
} from "./pptx-exporter";
import type {
  Presentation,
  Slide,
  SlideElement,
  PresentationTheme,
} from "../types";

// Mock pptxgenjs
jest.mock("pptxgenjs", () => {
  return jest.fn().mockImplementation(() => ({
    title: "",
    author: "",
    subject: "",
    layout: "",
    defineLayout: jest.fn(),
    addSlide: jest.fn(() => ({
      background: null,
      addText: jest.fn(),
      addImage: jest.fn(),
      addShape: jest.fn(),
      addNotes: jest.fn(),
    })),
    write: jest.fn().mockResolvedValue(
      new Blob(["test"], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      })
    ),
  }));
});

// Mock URL and document for download tests
const mockCreateObjectURL = jest.fn(() => "blob:test-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const originalCreateElement = document.createElement.bind(document);

jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
  if (tagName === "a") {
    return {
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLElement;
  }
  return originalCreateElement(tagName);
});

jest.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
jest.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);

// Helper to create mock theme
function createMockTheme(): PresentationTheme {
  return {
    id: "default",
    name: "Default",
    primaryColor: "#1a1a2e",
    secondaryColor: "#16213e",
    backgroundColor: "#ffffff",
    fontFamily: "Inter, sans-serif",
    titleFontSize: 36,
    bodyFontSize: 18,
  };
}

// Helper to create mock slide element
function createMockElement(
  type: "text" | "image" | "shape",
  overrides: Partial<SlideElement> = {}
): SlideElement {
  return {
    id: "el-1",
    type,
    content:
      type === "text"
        ? "Test content"
        : type === "image"
          ? "data:image/png;base64,abc"
          : "rectangle",
    position: { x: 100, y: 100 },
    size: { width: 200, height: 100 },
    style: {
      fontSize: 18,
      color: "#000000",
    },
    zIndex: 1,
    ...overrides,
  };
}

// Helper to create mock slide
function createMockSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    title: "Test Slide",
    elements: [],
    notes: "Speaker notes",
    layout: "content",
    order: 0,
    ...overrides,
  };
}

// Helper to create mock presentation
function createMockPresentation(
  overrides: Partial<Presentation> = {}
): Presentation {
  return {
    id: "pres-1",
    title: "Test Presentation",
    slides: [createMockSlide()],
    theme: createMockTheme(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("pptx-exporter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exportToPPTX", () => {
    it("should export presentation to blob", async () => {
      const presentation = createMockPresentation();
      const result = await exportToPPTX(presentation);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.fileName).toContain("Test_Presentation");
      expect(result.fileName.endsWith(".pptx")).toBe(true);
    });

    it("should include date in filename", async () => {
      const presentation = createMockPresentation();
      const result = await exportToPPTX(presentation);

      const today = new Date().toISOString().slice(0, 10);
      expect(result.fileName).toContain(today);
    });

    it("should sanitize filename", async () => {
      const presentation = createMockPresentation({
        title: "Test: Presentation! @#$%",
      });
      const result = await exportToPPTX(presentation);

      expect(result.fileName).not.toContain(":");
      expect(result.fileName).not.toContain("!");
      expect(result.fileName).not.toContain("@");
    });

    it("should handle presentation with multiple slides", async () => {
      const presentation = createMockPresentation({
        slides: [
          createMockSlide({ id: "s1", title: "Slide 1" }),
          createMockSlide({ id: "s2", title: "Slide 2" }),
          createMockSlide({ id: "s3", title: "Slide 3" }),
        ],
      });

      const result = await exportToPPTX(presentation);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should handle slides with text elements", async () => {
      const presentation = createMockPresentation({
        slides: [
          createMockSlide({
            elements: [createMockElement("text")],
          }),
        ],
      });

      const result = await exportToPPTX(presentation);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should handle slides with image elements", async () => {
      const presentation = createMockPresentation({
        slides: [
          createMockSlide({
            elements: [createMockElement("image")],
          }),
        ],
      });

      const result = await exportToPPTX(presentation);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should handle slides with shape elements", async () => {
      const presentation = createMockPresentation({
        slides: [
          createMockSlide({
            elements: [createMockElement("shape")],
          }),
        ],
      });

      const result = await exportToPPTX(presentation);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should include notes when option is true", async () => {
      const presentation = createMockPresentation({
        slides: [createMockSlide({ notes: "Important notes" })],
      });

      const result = await exportToPPTX(presentation, { includeNotes: true });
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should handle slide background color", async () => {
      const presentation = createMockPresentation({
        slides: [createMockSlide({ backgroundColor: "#ff0000" })],
      });

      const result = await exportToPPTX(presentation);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it("should handle source file name in metadata", async () => {
      const presentation = createMockPresentation({
        sourceFileName: "document.pdf",
      });

      const result = await exportToPPTX(presentation);
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe("downloadPPTX", () => {
    it("should create and click download link", async () => {
      const presentation = createMockPresentation();

      await downloadPPTX(presentation);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it("should append and remove link from document", async () => {
      const presentation = createMockPresentation();

      await downloadPPTX(presentation);

      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });
  });

  describe("generateSlideFromContent", () => {
    const theme = createMockTheme();

    it("should generate title slide layout", () => {
      const result = generateSlideFromContent(
        "Main Title",
        ["Subtitle text"],
        "title",
        theme
      );

      expect(result.title).toBe("Main Title");
      expect(result.layout).toBe("title");
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });

    it("should generate content slide layout", () => {
      const result = generateSlideFromContent(
        "Content Title",
        ["Point 1", "Point 2", "Point 3"],
        "content",
        theme
      );

      expect(result.title).toBe("Content Title");
      expect(result.layout).toBe("content");
      expect(result.elements.length).toBe(2); // Title + bullets
    });

    it("should generate two-column layout", () => {
      const result = generateSlideFromContent(
        "Two Column Title",
        ["Left 1", "Left 2", "Right 1", "Right 2"],
        "two-column",
        theme
      );

      expect(result.layout).toBe("two-column");
      expect(result.elements.length).toBe(3); // Title + 2 columns
    });

    it("should generate image-focus layout", () => {
      const result = generateSlideFromContent(
        "Image Title",
        ["Caption text"],
        "image-focus",
        theme
      );

      expect(result.layout).toBe("image-focus");
      // Title + placeholder shape + caption
      expect(result.elements.length).toBe(3);
    });

    it("should generate blank layout", () => {
      const result = generateSlideFromContent(
        "Blank Title",
        [],
        "blank",
        theme
      );

      expect(result.layout).toBe("blank");
      expect(result.elements.length).toBe(1); // Just title
    });

    it("should include notes when provided", () => {
      const result = generateSlideFromContent(
        "Title",
        ["Bullet"],
        "content",
        theme,
        { notes: "Speaker notes here" }
      );

      expect(result.notes).toBe("Speaker notes here");
    });

    it("should handle empty bullets for title slide", () => {
      const result = generateSlideFromContent("Title Only", [], "title", theme);

      expect(result.elements.length).toBe(1); // Just title, no subtitle
    });

    it("should apply theme colors to elements", () => {
      const result = generateSlideFromContent(
        "Themed Title",
        ["Bullet"],
        "content",
        theme
      );

      const titleElement = result.elements.find(
        (el) => el.style.fontWeight === "bold"
      );
      expect(titleElement?.style.color).toBe(theme.primaryColor);
    });
  });

  describe("createPresentationFromContent", () => {
    const theme = createMockTheme();

    it("should create presentation with slides", () => {
      const result = createPresentationFromContent(
        "My Presentation",
        [
          { title: "Title Slide", bullets: ["Subtitle"] },
          { title: "Content Slide", bullets: ["Point 1", "Point 2"] },
        ],
        theme
      );

      expect(result.title).toBe("My Presentation");
      expect(result.slides).toHaveLength(2);
      expect(result.theme).toBe(theme);
    });

    it("should use title layout for first slide by default", () => {
      const result = createPresentationFromContent(
        "Presentation",
        [
          { title: "First", bullets: [] },
          { title: "Second", bullets: [] },
        ],
        theme
      );

      expect(result.slides[0].layout).toBe("title");
      expect(result.slides[1].layout).toBe("content");
    });

    it("should respect explicit layout", () => {
      const result = createPresentationFromContent(
        "Presentation",
        [
          { title: "First", bullets: [], layout: "content" },
          { title: "Second", bullets: [], layout: "two-column" },
        ],
        theme
      );

      expect(result.slides[0].layout).toBe("content");
      expect(result.slides[1].layout).toBe("two-column");
    });

    it("should include source document info", () => {
      const result = createPresentationFromContent(
        "Presentation",
        [{ title: "Slide", bullets: [] }],
        theme,
        { id: "doc-123", name: "source.pdf" }
      );

      expect(result.sourceDocumentId).toBe("doc-123");
      expect(result.sourceFileName).toBe("source.pdf");
    });

    it("should assign order to slides", () => {
      const result = createPresentationFromContent(
        "Presentation",
        [
          { title: "First", bullets: [] },
          { title: "Second", bullets: [] },
          { title: "Third", bullets: [] },
        ],
        theme
      );

      expect(result.slides[0].order).toBe(0);
      expect(result.slides[1].order).toBe(1);
      expect(result.slides[2].order).toBe(2);
    });

    it("should assign unique IDs to slides", () => {
      const result = createPresentationFromContent(
        "Presentation",
        [
          { title: "First", bullets: [] },
          { title: "Second", bullets: [] },
        ],
        theme
      );

      expect(result.slides[0].id).not.toBe(result.slides[1].id);
    });

    it("should include notes in slides", () => {
      const result = createPresentationFromContent(
        "Presentation",
        [{ title: "Slide", bullets: [], notes: "My notes" }],
        theme
      );

      expect(result.slides[0].notes).toBe("My notes");
    });
  });
});
