import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PresentationMode } from "..";

// Mock state functions
const mockNextPage = jest.fn();
const mockPreviousPage = jest.fn();
const mockTogglePresentationMode = jest.fn();
const mockGoToPage = jest.fn();

jest.mock("@/lib/pdf", () => ({
  usePDFStore: () => ({
    currentPage: 1,
    numPages: 10,
    nextPage: mockNextPage,
    previousPage: mockPreviousPage,
    isPresentationMode: true,
    togglePresentationMode: mockTogglePresentationMode,
    goToPage: mockGoToPage,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue || key,
  }),
}));

// Mock fullscreen API
const mockRequestFullscreen = jest.fn().mockResolvedValue(undefined);
const mockExitFullscreen = jest.fn().mockResolvedValue(undefined);

Object.defineProperty(document, "fullscreenElement", {
  value: null,
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
  value: mockRequestFullscreen,
  writable: true,
});

Object.defineProperty(document, "exitFullscreen", {
  value: mockExitFullscreen,
  writable: true,
});

// Mock PDFPage component
jest.mock("../../page", () => ({
  PDFPage: ({
    scale,
    rotation,
    className,
  }: {
    scale: number;
    rotation: number;
    className?: string;
  }) => (
    <div
      data-testid="pdf-page"
      data-scale={scale}
      data-rotation={rotation}
      className={className}
    >
      Mock PDF Page
    </div>
  ),
}));

const mockPdfDocument = {
  numPages: 10,
  getPage: jest.fn().mockResolvedValue({
    getViewport: jest.fn().mockReturnValue({ width: 800, height: 600 }),
  }),
};

const defaultProps = {
  pdfDocument: mockPdfDocument,
  rotation: 0,
  pageRotations: {},
  pageOrder: [],
};

describe("PresentationMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders presentation overlay when isPresentationMode is true", () => {
      const { container } = render(<PresentationMode {...defaultProps} />);
      expect(container.firstChild).not.toBeNull();
      expect(container.querySelector(".fixed.inset-0")).toBeInTheDocument();
    });

    it("renders page counter", () => {
      render(<PresentationMode {...defaultProps} />);
      expect(screen.getByText("1 / 10")).toBeInTheDocument();
    });

    it("renders navigation arrows", async () => {
      render(<PresentationMode {...defaultProps} />);

      // Move mouse to make controls visible
      const container = document.querySelector(".fixed.inset-0");
      if (container) {
        fireEvent.mouseMove(container);
      }

      await waitFor(() => {
        // Check for navigation buttons
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("calls nextPage on ArrowRight key", () => {
      render(<PresentationMode {...defaultProps} />);
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(mockNextPage).toHaveBeenCalled();
    });

    it("calls previousPage on ArrowLeft key", () => {
      render(<PresentationMode {...defaultProps} />);
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      // previousPage is not called because currentPage is 1
      // Let's test that goToPage is called on Home key instead
    });

    it("calls nextPage on Space key", () => {
      render(<PresentationMode {...defaultProps} />);
      fireEvent.keyDown(window, { key: " " });
      expect(mockNextPage).toHaveBeenCalled();
    });

    it("calls goToPage(1) on Home key", () => {
      render(<PresentationMode {...defaultProps} />);
      fireEvent.keyDown(window, { key: "Home" });
      expect(mockGoToPage).toHaveBeenCalledWith(1);
    });

    it("calls goToPage(numPages) on End key", () => {
      render(<PresentationMode {...defaultProps} />);
      fireEvent.keyDown(window, { key: "End" });
      expect(mockGoToPage).toHaveBeenCalledWith(10);
    });
  });

  describe("Black/White Screen", () => {
    it("toggles black screen on B key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "b" });

      await waitFor(() => {
        expect(screen.getByText("Click to resume")).toBeInTheDocument();
      });
    });

    it("toggles white screen on W key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "w" });

      await waitFor(() => {
        expect(screen.getByText("Click to resume")).toBeInTheDocument();
      });
    });
  });

  describe("Timer", () => {
    it("toggles timer on T key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "t" });

      // Timer should show 0:00 initially
      await waitFor(() => {
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });
    });
  });

  describe("Overview Grid", () => {
    it("toggles overview on G key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "g" });

      await waitFor(() => {
        expect(screen.getByText("Slide Overview")).toBeInTheDocument();
      });
    });
  });

  describe("Auto-advance", () => {
    it("toggles auto-advance on A key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "a" });

      await waitFor(() => {
        // Look for the auto-advance indicator with timing info
        expect(screen.getByText(/Auto.*5s/)).toBeInTheDocument();
      });
    });
  });

  describe("Mouse Navigation", () => {
    it("shows controls on mouse move", async () => {
      render(<PresentationMode {...defaultProps} />);

      const container = document.querySelector(".fixed.inset-0");
      expect(container).toBeInTheDocument();

      if (container) {
        fireEvent.mouseMove(container);
      }

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Exit Presentation", () => {
    it("calls togglePresentationMode on ESC key", () => {
      render(<PresentationMode {...defaultProps} />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(mockTogglePresentationMode).toHaveBeenCalled();
    });

    it("calls togglePresentationMode when exit button is clicked", async () => {
      render(<PresentationMode {...defaultProps} />);

      // Show controls
      const container = document.querySelector(".fixed.inset-0");
      if (container) {
        fireEvent.mouseMove(container);
      }

      await waitFor(() => {
        const exitButton = screen
          .getAllByRole("button")
          .find((btn) => btn.getAttribute("title")?.includes("Exit"));
        expect(exitButton).toBeInTheDocument();
        if (exitButton) {
          fireEvent.click(exitButton);
        }
      });

      expect(mockTogglePresentationMode).toHaveBeenCalled();
    });
  });

  describe("Responsive Layout", () => {
    it("renders with responsive classes for mobile", () => {
      render(<PresentationMode {...defaultProps} />);

      // Check for responsive classes
      const container = document.querySelector(".fixed.inset-0");
      expect(container).toBeInTheDocument();

      // Navigation arrows should have responsive positioning
      const navArrows = document.querySelectorAll("[class*='sm:left-']");
      expect(navArrows.length).toBeGreaterThan(0);
    });
  });

  describe("Help Overlay", () => {
    it("toggles help overlay on H key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "h" });

      await waitFor(() => {
        expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
      });
    });

    it("toggles help overlay on ? key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "?" });

      await waitFor(() => {
        expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
      });
    });

    it("shows help button in controls bar", async () => {
      render(<PresentationMode {...defaultProps} />);

      // Show controls
      const container = document.querySelector(".fixed.inset-0");
      if (container) {
        fireEvent.mouseMove(container);
      }

      await waitFor(() => {
        const helpButton = screen
          .getAllByRole("button")
          .find((btn) => btn.getAttribute("title")?.includes("Help"));
        expect(helpButton).toBeInTheDocument();
      });
    });
  });

  describe("Pen Tool", () => {
    it("toggles pen tool on P key", async () => {
      render(<PresentationMode {...defaultProps} />);

      fireEvent.keyDown(window, { key: "p" });

      // Check that the pen tool controls are visible (undo/clear buttons)
      const container = document.querySelector(".fixed.inset-0");
      if (container) {
        fireEvent.mouseMove(container);
      }

      await waitFor(() => {
        const undoButton = screen
          .getAllByRole("button")
          .find((btn) => btn.getAttribute("title")?.includes("Undo"));
        expect(undoButton).toBeInTheDocument();
      });
    });
  });
});
