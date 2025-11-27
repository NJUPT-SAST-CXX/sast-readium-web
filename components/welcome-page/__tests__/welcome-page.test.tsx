import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WelcomePage } from "../welcome-page";
import { usePDFStore } from "@/lib/pdf-store";
import { isTauri, openPdfFileViaNativeDialog, getSystemInfo } from "@/lib/tauri-bridge";
import { processArchive } from "@/lib/archive-utils";

jest.mock("@/lib/pdf-store");
jest.mock("@/lib/tauri-bridge");
jest.mock("@/lib/archive-utils");
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} alt={(props.alt as string) || ""} />,
}));
jest.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Lang</div>,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

describe("WelcomePage", () => {
  const mockOnFileSelect = jest.fn();
  const mockStore = {
    recentFiles: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
    (isTauri as jest.Mock).mockReturnValue(false);
    (getSystemInfo as jest.Mock).mockResolvedValue(null);
    // Mock scrollIntoView for ScrollArea
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it("renders welcome options", () => {
    render(<WelcomePage onFileSelect={mockOnFileSelect} />);

    expect(screen.getByText("welcome.open_pdf")).toBeInTheDocument();
    expect(screen.getByText("welcome.open_folder")).toBeInTheDocument();
    expect(screen.getByText("welcome.open_zip")).toBeInTheDocument();
  });

  it("handles file input change", () => {
    render(<WelcomePage onFileSelect={mockOnFileSelect} />);

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"][accept="application/pdf"]');
    
    if (!input) throw new Error("Input not found");

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it("handles archive input change", async () => {
    (processArchive as jest.Mock).mockResolvedValue([
      new File(["content"], "extracted.pdf", { type: "application/pdf" }),
    ]);

    render(<WelcomePage onFileSelect={mockOnFileSelect} />);

    const archive = new File(["zip content"], "test.zip", { type: "application/zip" });
    const input = document.querySelector('input[type="file"][accept=".zip"]');
    
    if (!input) throw new Error("Archive input not found");

    fireEvent.change(input, { target: { files: [archive] } });
    
    expect(screen.getByText("welcome.parsing_zip")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalled();
    });
  });

  it("handles native open dialog in Tauri", async () => {
    (isTauri as jest.Mock).mockReturnValue(true);
    const mockFile = new File([""], "native.pdf", { type: "application/pdf" });
    (openPdfFileViaNativeDialog as jest.Mock).mockResolvedValue(mockFile);

    render(<WelcomePage onFileSelect={mockOnFileSelect} />);

    const openBtn = screen.getByText("welcome.open_pdf");
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(openPdfFileViaNativeDialog).toHaveBeenCalled();
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
    });
  });

  it("shows recent files", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      recentFiles: [
        { name: "Recent.pdf", url: "blob:url", readingProgress: 50, numPages: 10 },
      ],
    });

    render(<WelcomePage onFileSelect={mockOnFileSelect} />);

    expect(screen.getByText("Recent.pdf")).toBeInTheDocument();
    expect(screen.getByText("50% · 10 p")).toBeInTheDocument();
  });
});
