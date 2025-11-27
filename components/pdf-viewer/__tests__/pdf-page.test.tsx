import { render, screen } from "@testing-library/react";
import { PDFPage } from "../pdf-page";
import { usePDFStore } from "@/lib/pdf-store";

jest.mock("@/lib/pdf-store");
jest.mock("../pdf-watermark", () => ({
  PDFWatermark: () => <div data-testid="pdf-watermark">Watermark</div>,
}));

describe("PDFPage", () => {
  const mockPage = {
    getViewport: jest.fn().mockReturnValue({ width: 100, height: 100 }),
    render: jest.fn().mockReturnValue({
      promise: Promise.resolve(),
      cancel: jest.fn(),
    }),
  };

  const mockStore = {
    zoom: 1,
    setZoom: jest.fn(),
    watermarkText: "",
    watermarkColor: "rgba(0, 0, 0, 0.1)",
    watermarkOpacity: 0.2,
    watermarkSize: 48,
    watermarkGapX: 1.5,
    watermarkGapY: 4,
    watermarkRotation: -45,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders canvas and handles loading", () => {
    render(<PDFPage page={mockPage as unknown as Parameters<typeof PDFPage>[0]["page"]} scale={1} rotation={0} />);
    // Canvases don't have implicit role, but we can search by tag or className
    // Wait, the component renders a <canvas>
    // react-testing-library doesn't easily find canvas by role "img" unless aria-label is set.
    // We can look for class name "mx-auto shadow-lg"
    const canvasElement = document.querySelector("canvas");
    expect(canvasElement).toBeInTheDocument();
  });

  it("renders watermark when configured", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      watermarkText: "CONFIDENTIAL",
    });

    render(<PDFPage page={mockPage as unknown as Parameters<typeof PDFPage>[0]["page"]} scale={1} rotation={0} />);
    expect(screen.getByTestId("pdf-watermark")).toBeInTheDocument();
  });

  it("renders with null page", () => {
    render(<PDFPage page={null} scale={1} rotation={0} />);
    const canvasElement = document.querySelector("canvas");
    expect(canvasElement).toBeInTheDocument();
  });
});
