import { render, screen, fireEvent } from "@testing-library/react";
import { PDFRecentFilesDialog } from "../pdf-recent-files-dialog";
import { usePDFStore } from "@/lib/pdf";

jest.mock("@/lib/pdf");
jest.mock("@/lib/platform", () => ({
  isTauri: jest.fn().mockReturnValue(false),
  readPdfFileAtPath: jest.fn(),
  revealInFileManager: jest.fn(),
  renameFile: jest.fn(),
  deleteFile: jest.fn(),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

// Mock fetch for opening URL files
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob([])),
  })
) as jest.Mock;

describe("PDFRecentFilesDialog", () => {
  const mockStore = {
    recentFiles: [
      {
        url: "blob:test1",
        name: "Recent Doc 1.pdf",
        lastOpened: Date.now(),
        readingProgress: 50,
      },
    ],
    removeRecentFile: jest.fn(),
    clearRecentFiles: jest.fn(),
    setCurrentPDF: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders recent files", () => {
    render(<PDFRecentFilesDialog open={true} onOpenChange={jest.fn()} />);

    // There may be multiple elements with this text (title in header and dialog)
    expect(screen.getAllByText("recent.title").length).toBeGreaterThan(0);
    expect(screen.getByText("Recent Doc 1.pdf")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      recentFiles: [],
    });

    render(<PDFRecentFilesDialog open={true} onOpenChange={jest.fn()} />);

    // There may be multiple elements with this text, just check at least one exists
    expect(screen.getAllByText("recent.empty").length).toBeGreaterThan(0);
  });

  it("opens a file", async () => {
    const onOpenChange = jest.fn();
    render(<PDFRecentFilesDialog open={true} onOpenChange={onOpenChange} />);

    const openBtn = screen.getByTitle("recent.open");
    fireEvent.click(openBtn);

    // Wait for fetch
    await new Promise(process.nextTick);

    expect(mockStore.setCurrentPDF).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
