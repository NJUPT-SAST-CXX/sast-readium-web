import { render, screen, waitFor } from "@testing-library/react";
import { PDFTextLayer } from "../pdf-text-layer";
import { usePDFStore } from "@/lib/pdf-store";

jest.mock("@/lib/pdf-store");

describe("PDFTextLayer", () => {
  const mockPage = {
    getViewport: jest.fn().mockReturnValue({
      width: 800,
      height: 600,
      transform: [1, 0, 0, 1, 0, 0],
    }),
    getTextContent: jest.fn().mockResolvedValue({
      items: [
        {
          str: "Hello World",
          transform: [10, 0, 0, 10, 100, 100],
          width: 50,
          height: 10,
        },
      ],
    }),
  };

  const mockStore = {
    addAnnotation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders text content", async () => {
    render(
      <PDFTextLayer
        page={mockPage as any}
        scale={1}
        rotation={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  it("highlights search query", async () => {
    render(
      <PDFTextLayer
        page={mockPage as any}
        scale={1}
        rotation={0}
        searchQuery="Hello"
      />
    );

    await waitFor(() => {
      const textElement = screen.getByText("Hello World");
      expect(textElement).toHaveStyle({ backgroundColor: "rgba(255, 255, 0, 0.4)" });
    });
  });
});
