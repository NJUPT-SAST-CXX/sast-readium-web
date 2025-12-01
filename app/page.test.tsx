import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "./page";
import { usePDFStore } from "@/lib/pdf";

// Mock dependencies
jest.mock("@/lib/pdf", () => ({
  usePDFStore: jest.fn(),
  unloadPDFDocument: jest.fn(),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));
jest.mock("@/components/welcome-page/welcome-page", () => ({
  WelcomePage: ({ onFileSelect }: { onFileSelect: (f: File[]) => void }) => (
    <div data-testid="welcome-page">
      <button
        onClick={() =>
          onFileSelect([
            new File([""], "test.pdf", { type: "application/pdf" }),
          ])
        }
      >
        Open PDF
      </button>
    </div>
  ),
}));
jest.mock("@/components/pdf-viewer/pdf-viewer", () => ({
  PDFViewer: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="pdf-viewer">
      <button onClick={() => onClose()}>Close PDF</button>
    </div>
  ),
}));
jest.mock("@/components/pdf-viewer/pdf-tab-bar", () => ({
  PDFTabBar: () => <div data-testid="pdf-tab-bar">Tabs</div>,
}));
jest.mock("@/hooks/use-pdf-context", () => ({
  usePDFContext: jest.fn(),
}));

describe("Home Page", () => {
  const mockStore = {
    isDarkMode: false,
    resetPDF: jest.fn(),
    openDocumentSession: jest.fn(),
    closeDocumentSession: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders welcome page initially", () => {
    render(<Home />);
    expect(screen.getByTestId("welcome-page")).toBeInTheDocument();
  });

  it("opens PDF viewer when file is selected", async () => {
    render(<Home />);

    const openBtn = screen.getByText("Open PDF");
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    });
    // openDocumentSession is called with the document ID
    expect(mockStore.openDocumentSession).toHaveBeenCalled();
  });

  it("closes PDF viewer and returns to welcome page", async () => {
    render(<Home />);

    // Open first
    fireEvent.click(screen.getByText("Open PDF"));
    await waitFor(() => {
      expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    });

    // Close - the mock PDFViewer calls onClose which triggers handleClose
    fireEvent.click(screen.getByText("Close PDF"));

    // After closing, closeDocumentSession should be called
    await waitFor(() => {
      expect(mockStore.closeDocumentSession).toHaveBeenCalled();
    });

    // Welcome page should be visible again when no documents are open
    await waitFor(() => {
      expect(screen.getByTestId("welcome-page")).toBeInTheDocument();
    });
  });

  it("applies dark mode class", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      isDarkMode: true,
    });

    render(<Home />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
