import { render } from "@testing-library/react";
import { PDFDrawingLayer } from "../pdf-drawing-layer";
import { usePDFStore } from "@/lib/pdf";

jest.mock("@/lib/pdf");

describe("PDFDrawingLayer", () => {
  const mockPage = {
    getViewport: jest.fn().mockReturnValue({
      width: 800,
      height: 600,
    }),
  };

  const mockStore = {
    annotations: [],
    addAnnotation: jest.fn(),
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders canvas", () => {
    const { container } = render(
      <PDFDrawingLayer
        page={
          mockPage as unknown as Parameters<typeof PDFDrawingLayer>[0]["page"]
        }
        scale={1}
        rotation={0}
        isDrawingMode={false}
        strokeColor="#000"
        strokeWidth={2}
      />
    );

    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("sets drawing cursor when in drawing mode", () => {
    const { container } = render(
      <PDFDrawingLayer
        page={
          mockPage as unknown as Parameters<typeof PDFDrawingLayer>[0]["page"]
        }
        scale={1}
        rotation={0}
        isDrawingMode={true}
        strokeColor="#000"
        strokeWidth={2}
      />
    );

    expect(container.querySelector("canvas")).toHaveClass("cursor-crosshair");
  });
});
