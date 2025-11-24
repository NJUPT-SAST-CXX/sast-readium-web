import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PDFAnnotationLayer } from "../pdf-annotation-layer";
import { usePDFStore } from "@/lib/pdf-store";

jest.mock("@/lib/pdf-store");

describe("PDFAnnotationLayer", () => {
  const mockPage = {
    getViewport: jest.fn().mockReturnValue({
      width: 800,
      height: 600,
      convertToViewportPoint: jest.fn((x, y) => [x, y]),
      transform: [1, 0, 0, 1, 0, 0],
    }),
    getAnnotations: jest.fn().mockResolvedValue([
      {
        subtype: "Link",
        rect: [10, 10, 100, 100],
        url: "https://example.com",
      },
    ]),
  };

  const mockStore = {
    annotations: [
      {
        id: "1",
        type: "comment",
        pageNumber: 1,
        content: "Test Comment",
        position: { x: 0.1, y: 0.1, width: 0, height: 0 },
        color: "#000",
        timestamp: Date.now(),
      },
    ],
    addAnnotation: jest.fn(),
    removeAnnotation: jest.fn(),
    updateAnnotation: jest.fn(),
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders existing annotations", async () => {
    render(
      <PDFAnnotationLayer
        page={mockPage as any}
        scale={1}
        rotation={0}
        selectedAnnotationType={null}
      />
    );

    expect(screen.getByText("Test Comment")).toBeInTheDocument();
    
    // Wait for native annotations (links)
    await waitFor(() => {
      const links = document.querySelectorAll("a");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it("handles drawing new annotation", () => {
    render(
      <PDFAnnotationLayer
        page={mockPage as any}
        scale={1}
        rotation={0}
        selectedAnnotationType="highlight"
      />
    );

    const container = document.querySelector(".absolute.inset-0");
    if (!container) throw new Error("Container not found");

    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(container);

    expect(mockStore.addAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "highlight",
        pageNumber: 1,
      })
    );
  });

  it("handles adding text annotation", () => {
    render(
      <PDFAnnotationLayer
        page={mockPage as any}
        scale={1}
        rotation={0}
        selectedAnnotationType="text"
      />
    );

    const container = document.querySelector(".absolute.inset-0");
    if (!container) throw new Error("Container not found");

    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    
    const input = screen.getByPlaceholderText("Enter text...");
    fireEvent.change(input, { target: { value: "New Text" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockStore.addAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text",
        content: "New Text",
      })
    );
  });
});
