import { render, screen, waitFor } from "@testing-library/react";
import { PDFViewer } from "../pdf-viewer";
import { usePDFStore } from "@/lib/pdf-store";
import { loadPDFDocument } from "@/lib/pdf-utils";

// Mock dependencies
jest.mock("@/lib/pdf-store", () => {
  const mockState = {
    currentPage: 1,
    zoom: 1,
    rotation: 0,
    numPages: 10,
    viewMode: "single",
    fitMode: "custom",
    setNumPages: jest.fn(),
    setCurrentPage: jest.fn(),
    setCurrentPDF: jest.fn(),
    initializePageOrder: jest.fn(),
    addRecentFile: jest.fn(),
    pageOrder: [],
    outline: [],
    setOutline: jest.fn(),
    setMetadata: jest.fn(),
    updateRecentFileByUrl: jest.fn(),
    updateReadingProgress: jest.fn(),
    isSelectionMode: false,
    pageRotations: {},
    pdfLoadingAnimation: "spinner",
    signatures: [],
    bookmarks: [],
    annotations: [],
    searchQuery: "",
    searchResults: [],
    caseSensitiveSearch: false,
    selectedAnnotationColor: "#000000",
    selectedStrokeWidth: 1,
    addSignature: jest.fn(),
    removeSignature: jest.fn(),
    addStampAnnotation: jest.fn(),
    addImageAnnotation: jest.fn(),
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
    toggleKeyboardShortcuts: jest.fn(),
    toggleFullscreen: jest.fn(),
    toggleThumbnails: jest.fn(),
    toggleOutline: jest.fn(),
    toggleAnnotations: jest.fn(),
    toggleDarkMode: jest.fn(),
    setThemeMode: jest.fn(),
    setZoom: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    rotateClockwise: jest.fn(),
    rotateCounterClockwise: jest.fn(),
    nextPage: jest.fn(),
    previousPage: jest.fn(),
    firstPage: jest.fn(),
    lastPage: jest.fn(),
    goToPage: jest.fn(),
    reorderPages: jest.fn(),
    rotatePage: jest.fn(),
    removePage: jest.fn(),
    sidebarInitialWidth: 300,
    scrollSensitivity: 1,
    scrollDebounce: 100,
    scrollThreshold: 0.5,
    enableSmoothScrolling: true,
    invertWheel: false,
    zoomStep: 0.1,
  };

  return {
    usePDFStore: Object.assign(
      jest.fn(() => mockState),
      { getState: jest.fn(() => mockState) }
    ),
  };
});

jest.mock("@/lib/pdf-utils");
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock("@/lib/tauri-bridge", () => ({
  revealInFileManager: jest.fn(),
}));

// Mock URL.createObjectURL
if (typeof window !== "undefined") {
  global.URL.createObjectURL = jest.fn(() => "blob:test");
  global.URL.revokeObjectURL = jest.fn();
}

jest.mock("@/hooks/use-touch-gestures", () => ({
  useTouchGestures: () => ({
    onTouchStart: jest.fn(),
    onTouchMove: jest.fn(),
    onTouchEnd: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-device-orientation", () => ({
  useDeviceOrientation: () => ({
    orientation: "portrait",
    isMobile: false,
    viewportWidth: 1024,
    viewportHeight: 768,
  }),
}));

// Mock UI components to simplify testing
jest.mock("../pdf-toolbar", () => ({
  PDFToolbar: () => <div data-testid="pdf-toolbar">PDFToolbar</div>,
}));
jest.mock("../pdf-page", () => ({
  PDFPage: () => <div data-testid="pdf-page">PDFPage</div>,
}));
jest.mock("../pdf-annotation-layer", () => ({
  PDFAnnotationLayer: () => <div>PDFAnnotationLayer</div>,
}));
jest.mock("../pdf-text-layer", () => ({
  PDFTextLayer: () => <div>PDFTextLayer</div>,
}));
jest.mock("../pdf-selection-layer", () => ({
  PDFSelectionLayer: () => <div>PDFSelectionLayer</div>,
}));
jest.mock("../loading-animations", () => ({
  PDFLoadingAnimation: () => <div>Loading...</div>,
}));
jest.mock("../signature-dialog", () => ({
  SignatureDialog: () => (
    <div data-testid="signature-dialog">SignatureDialog</div>
  ),
}));
jest.mock("../pdf-outline", () => ({
  PDFOutline: () => <div data-testid="pdf-outline">PDFOutline</div>,
}));
jest.mock("../pdf-bookmarks", () => ({
  PDFBookmarks: () => <div data-testid="pdf-bookmarks">PDFBookmarks</div>,
}));
jest.mock("../pdf-annotations-list", () => ({
  PDFAnnotationsList: () => (
    <div data-testid="pdf-annotations-list">PDFAnnotationsList</div>
  ),
}));
jest.mock("../pdf-draggable-thumbnail", () => ({
  PDFDraggableThumbnail: () => <div data-testid="pdf-thumbnail">Thumbnail</div>,
}));

// Mock AI sidebar to avoid TransformStream issues
jest.mock("@/components/ai-sidebar/ai-sidebar", () => ({
  AISidebar: () => <div data-testid="ai-sidebar">AISidebar</div>,
}));

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  ...jest.requireActual("@dnd-kit/core"),
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}));

describe("PDFViewer", () => {
  const mockFile = new File(["dummy content"], "test.pdf", {
    type: "application/pdf",
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (loadPDFDocument as jest.Mock).mockResolvedValue({
      numPages: 10,
      getMetadata: jest.fn().mockResolvedValue({}),
      getOutline: jest.fn().mockResolvedValue([]),
      getPage: jest.fn().mockResolvedValue({
        getViewport: () => ({ width: 100, height: 100 }),
        render: jest.fn(),
      }),
      destroy: jest.fn(),
    });
  });

  it("renders loading state initially", () => {
    render(<PDFViewer file={mockFile} onClose={jest.fn()} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("loads PDF and renders toolbar", async () => {
    render(<PDFViewer file={mockFile} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(loadPDFDocument).toHaveBeenCalledWith(
        mockFile,
        expect.any(Function),
        undefined
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("pdf-toolbar")).toBeInTheDocument();
    });
  });

  it.only("updates store with PDF info on load", async () => {
    try {
      render(<PDFViewer file={mockFile} onClose={jest.fn()} />);

      await waitFor(() => {
        const store = usePDFStore.getState();
        expect(store.setNumPages).toHaveBeenCalledWith(10);
        expect(store.setCurrentPDF).toHaveBeenCalledWith(mockFile);
      });
    } catch (e) {
      process.stdout.write(`\n\nTEST ERROR: ${e}\n\n`);
      throw e;
    }
  });
});
