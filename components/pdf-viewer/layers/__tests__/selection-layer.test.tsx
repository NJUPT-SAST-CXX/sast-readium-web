import { render, screen, fireEvent } from "@testing-library/react";
import { PDFSelectionLayer } from "../selection-layer";
import { usePDFStore } from "@/lib/pdf";

jest.mock("@/lib/pdf");

// Mock AI chat store to avoid TransformStream issues
jest.mock("@/lib/ai/core", () => ({
  useAIChatStore: () => ({
    updatePDFContext: jest.fn(),
    setSidebarOpen: jest.fn(),
  }),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PDFSelectionLayer", () => {
  const mockStore = {
    isSelectionMode: true,
    toggleSelectionMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders when selection mode is active", () => {
    const { container } = render(
      <PDFSelectionLayer
        page={{} as unknown as Parameters<typeof PDFSelectionLayer>[0]["page"]}
        scale={1}
        rotation={0}
        pageNumber={1}
      />
    );

    expect(container.firstChild).not.toBeNull();
  });

  it("does not render when selection mode is inactive", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      isSelectionMode: false,
    });

    const { container } = render(
      <PDFSelectionLayer
        page={{} as unknown as Parameters<typeof PDFSelectionLayer>[0]["page"]}
        scale={1}
        rotation={0}
        pageNumber={1}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("starts selection on mouse down and shows menu after mouse up", () => {
    const mockPage = {
      getViewport: jest.fn().mockReturnValue({ width: 100, height: 100 }),
      getTextContent: jest.fn().mockResolvedValue({ items: [] }),
    };

    const { container } = render(
      <PDFSelectionLayer
        page={
          mockPage as unknown as Parameters<typeof PDFSelectionLayer>[0]["page"]
        }
        scale={1}
        rotation={0}
        pageNumber={1}
      />
    );

    const layer = container.firstChild as Element;

    // Simulate selection with significant movement (> 5px)
    fireEvent.mouseDown(layer, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(layer, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(layer);

    // Menu should appear with Copy Image button
    expect(screen.getByTitle("Copy Image")).toBeInTheDocument();
  });
});
