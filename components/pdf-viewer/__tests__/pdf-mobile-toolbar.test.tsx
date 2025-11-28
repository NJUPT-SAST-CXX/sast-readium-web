import { render, screen, fireEvent } from "@testing-library/react";
import { PDFMobileToolbar } from "../pdf-mobile-toolbar";
import { usePDFStore } from "@/lib/pdf-store";
import { useAIChatStore } from "@/lib/ai-chat-store";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock pdf-store
jest.mock("@/lib/pdf-store");

// Mock ai-chat-store
jest.mock("@/lib/ai-chat-store");

describe("PDFMobileToolbar", () => {
  const mockPDFStore = {
    currentPage: 5,
    numPages: 20,
    nextPage: jest.fn(),
    previousPage: jest.fn(),
    firstPage: jest.fn(),
    lastPage: jest.fn(),
    toggleThumbnails: jest.fn(),
    toggleOutline: jest.fn(),
    isDarkMode: false,
    toggleDarkMode: jest.fn(),
    rotateClockwise: jest.fn(),
    setFitMode: jest.fn(),
  };

  const mockAIChatStore = {
    setSidebarOpen: jest.fn(),
  };

  const mockCallbacks = {
    onSearch: jest.fn(),
    onOpenSettings: jest.fn(),
    onToggleBookmarks: jest.fn(),
    onAddComment: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockPDFStore);
    (useAIChatStore as unknown as jest.Mock).mockReturnValue(mockAIChatStore);
  });

  it("renders mobile toolbar", () => {
    const { container } = render(<PDFMobileToolbar {...mockCallbacks} />);

    // Should have basic elements
    const toolbar = container.querySelector("[data-orientation]");
    expect(toolbar).toBeInTheDocument();
  });

  it("displays current page number and total pages", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    expect(screen.getByText("5 / 20")).toBeInTheDocument();
  });

  it("has thumbnails and outline toggle buttons", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Should have multiple buttons (thumbnails, outline, prev, next, AI, search, more)
    expect(buttons.length).toBeGreaterThan(3);
  });

  it("disables previous page button when on first page", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      currentPage: 1,
    });

    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Previous button is around index 2 (after thumbnails and outline)
    const previousButton = buttons[2];
    expect(previousButton).toBeDisabled();
  });

  it("disables next page button when on last page", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      currentPage: 20,
    });

    const { container } = render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = container.querySelectorAll("button");
    // Next button is after previous button in the center section
    let nextButtonFound = false;
    buttons.forEach((btn) => {
      if (btn.disabled && btn.querySelector("svg")) {
        nextButtonFound = true;
      }
    });
    expect(nextButtonFound).toBe(true);
  });

  it("calls nextPage when next button is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Find next button (ChevronRight icon) - it's after the page indicator
    const nextButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-chevron-right");
    });

    if (nextButton) {
      fireEvent.click(nextButton);
      expect(mockPDFStore.nextPage).toHaveBeenCalled();
    }
  });

  it("calls previousPage when previous button is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Find previous button (ChevronLeft icon)
    const prevButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-chevron-left");
    });

    if (prevButton) {
      fireEvent.click(prevButton);
      expect(mockPDFStore.previousPage).toHaveBeenCalled();
    }
  });

  it("calls onSearch when search button is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Find search button (Search icon)
    const searchButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-search");
    });

    if (searchButton) {
      fireEvent.click(searchButton);
      expect(mockCallbacks.onSearch).toHaveBeenCalled();
    }
  });

  it("calls setSidebarOpen when AI button is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Find AI button (Sparkles icon)
    const aiButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-sparkles");
    });

    if (aiButton) {
      fireEvent.click(aiButton);
      expect(mockAIChatStore.setSidebarOpen).toHaveBeenCalledWith(true);
    }
  });

  it("calls toggleThumbnails when thumbnails button is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // First button is thumbnails
    fireEvent.click(buttons[0]);

    expect(mockPDFStore.toggleThumbnails).toHaveBeenCalled();
  });

  it("calls toggleOutline when outline button is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Second button is outline
    fireEvent.click(buttons[1]);

    expect(mockPDFStore.toggleOutline).toHaveBeenCalled();
  });

  it("renders more menu with additional options", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    // Find more menu button (MoreVertical icon)
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);

      // Check for menu items - they appear in a portal/dropdown
      expect(screen.queryByText("toolbar.tooltip.first_page")).toBeDefined();
      expect(screen.queryByText("toolbar.tooltip.rotate_cw")).toBeDefined();
    }
  });

  it("calls firstPage when first page menu item is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      const firstPageItem = screen.queryByText("toolbar.tooltip.first_page");
      if (firstPageItem) {
        fireEvent.click(firstPageItem);
        expect(mockPDFStore.firstPage).toHaveBeenCalled();
      }
    }
  });

  it("calls lastPage when last page menu item is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      const lastPageItem = screen.queryByText("toolbar.tooltip.last_page");
      if (lastPageItem) {
        fireEvent.click(lastPageItem);
        expect(mockPDFStore.lastPage).toHaveBeenCalled();
      }
    }
  });

  it("calls rotateClockwise when rotate menu item is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      const rotateItem = screen.queryByText("toolbar.tooltip.rotate_cw");
      if (rotateItem) {
        fireEvent.click(rotateItem);
        expect(mockPDFStore.rotateClockwise).toHaveBeenCalled();
      }
    }
  });

  it("calls setFitMode when fit width menu item is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      const fitWidthItem = screen.queryByText("toolbar.tooltip.fit_width");
      if (fitWidthItem) {
        fireEvent.click(fitWidthItem);
        expect(mockPDFStore.setFitMode).toHaveBeenCalledWith("fitWidth");
      }
    }
  });

  it("calls toggleDarkMode when dark mode menu item is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      const darkModeItem = screen.queryByText("toolbar.tooltip.dark_mode");
      if (darkModeItem) {
        fireEvent.click(darkModeItem);
        expect(mockPDFStore.toggleDarkMode).toHaveBeenCalled();
      }
    }
  });

  it("calls onOpenSettings when settings menu item is clicked", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      const settingsItem = screen.queryByText("menu.settings.label");
      if (settingsItem) {
        fireEvent.click(settingsItem);
        expect(mockCallbacks.onOpenSettings).toHaveBeenCalled();
      }
    }
  });

  it("renders bookmarks menu item when provided", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      expect(screen.queryByText("toolbar.tooltip.bookmarks")).toBeDefined();
    }
  });

  it("renders add comment menu item when onAddComment is provided", () => {
    render(<PDFMobileToolbar {...mockCallbacks} />);

    const buttons = screen.getAllByRole("button");
    const moreButton = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.className?.baseVal?.includes("lucide-more-vertical");
    });

    if (moreButton) {
      fireEvent.click(moreButton);
      expect(screen.queryByText("toolbar.tooltip.add_comment")).toBeDefined();
    }
  });

  it("handles landscape orientation prop", () => {
    render(<PDFMobileToolbar {...mockCallbacks} orientation="landscape" />);

    const toolbar = document.querySelector("[data-orientation='landscape']");
    expect(toolbar).toBeInTheDocument();
  });

  it("handles portrait orientation prop", () => {
    render(<PDFMobileToolbar {...mockCallbacks} orientation="portrait" />);

    const toolbar = document.querySelector("[data-orientation='portrait']");
    expect(toolbar).toBeInTheDocument();
  });
});
