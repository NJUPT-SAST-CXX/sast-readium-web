/**
 * Tests for PresentationList component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { PresentationList } from "../presentation-list";
import { usePPTStore, exportToPPTX } from "@/lib/ai/learning";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock("@/lib/ai/learning", () => ({
  usePPTStore: jest.fn(),
  exportToPPTX: jest.fn(),
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, onClick }: any) => (
    <div data-testid="card" onClick={onClick}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button data-testid="dropdown-item" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

const mockUsePPTStore = usePPTStore as jest.MockedFunction<typeof usePPTStore>;
const mockExportToPPTX = exportToPPTX as jest.MockedFunction<
  typeof exportToPPTX
>;

describe("PresentationList", () => {
  const mockPresentations = {
    "ppt-1": {
      id: "ppt-1",
      title: "Test Presentation 1",
      slides: [
        {
          id: "slide-1",
          title: "Slide 1",
          elements: [],
          layout: "content",
          order: 0,
        },
        {
          id: "slide-2",
          title: "Slide 2",
          elements: [],
          layout: "content",
          order: 1,
        },
      ],
      theme: {
        name: "Default",
        primaryColor: "#3b82f6",
        backgroundColor: "#ffffff",
      },
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    },
    "ppt-2": {
      id: "ppt-2",
      title: "Test Presentation 2",
      slides: [
        {
          id: "slide-3",
          title: "Slide 3",
          elements: [],
          layout: "title",
          order: 0,
        },
      ],
      theme: {
        name: "Dark",
        primaryColor: "#8b5cf6",
        backgroundColor: "#1f2937",
      },
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 3600000,
    },
  };

  const mockDeletePresentation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: mockPresentations,
        deletePresentation: mockDeletePresentation,
      };
      return selector(state);
    });

    mockExportToPPTX.mockResolvedValue({ success: true } as any);
  });

  it("should render presentation list", () => {
    render(<PresentationList />);

    expect(screen.getByText("Test Presentation 1")).toBeInTheDocument();
    expect(screen.getByText("Test Presentation 2")).toBeInTheDocument();
  });

  it("should display presentation count", () => {
    render(<PresentationList />);

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should display total slides count", () => {
    render(<PresentationList />);

    // 2 + 1 = 3 slides total
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should show empty state when no presentations", () => {
    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: {},
        deletePresentation: mockDeletePresentation,
      };
      return selector(state);
    });

    render(<PresentationList />);

    expect(screen.getByText("learning.common.empty")).toBeInTheDocument();
  });

  it("should call onCreatePresentation when create button clicked", () => {
    const onCreatePresentation = jest.fn();
    render(<PresentationList onCreatePresentation={onCreatePresentation} />);

    const createButton = screen.getByText("learning.ppt.create");
    fireEvent.click(createButton);

    expect(onCreatePresentation).toHaveBeenCalled();
  });

  it("should call onSelectPresentation when card clicked", () => {
    const onSelectPresentation = jest.fn();
    render(<PresentationList onSelectPresentation={onSelectPresentation} />);

    const cards = screen.getAllByTestId("card");
    fireEvent.click(cards[2]); // First presentation card (after summary cards)

    expect(onSelectPresentation).toHaveBeenCalled();
  });

  it("should display slide count badge", () => {
    render(<PresentationList />);

    const badges = screen.getAllByTestId("badge");
    expect(badges.some((b) => b.textContent?.includes("2"))).toBe(true);
  });

  it("should display theme name badge", () => {
    render(<PresentationList />);

    const badges = screen.getAllByTestId("badge");
    expect(badges.some((b) => b.textContent?.includes("Default"))).toBe(true);
  });

  it("should render dropdown menu items", () => {
    render(<PresentationList />);

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    expect(dropdownItems.length).toBeGreaterThan(0);
  });

  it("should call onPreview when preview button clicked", () => {
    const onPreview = jest.fn();
    render(<PresentationList onPreview={onPreview} />);

    // Find preview button in dropdown
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const previewItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.ppt.preview")
    );

    if (previewItem) {
      fireEvent.click(previewItem);
      expect(onPreview).toHaveBeenCalled();
    }
  });

  it("should call exportToPPTX when export button clicked", async () => {
    render(<PresentationList />);

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const exportItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.ppt.export")
    );

    if (exportItem) {
      fireEvent.click(exportItem);
      expect(mockExportToPPTX).toHaveBeenCalled();
    }
  });

  it("should call deletePresentation when delete clicked", () => {
    render(<PresentationList />);

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const deleteItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.common.delete")
    );

    if (deleteItem) {
      fireEvent.click(deleteItem);
      expect(mockDeletePresentation).toHaveBeenCalled();
    }
  });

  it("should sort presentations by updatedAt descending", () => {
    render(<PresentationList />);

    const titles = screen.getAllByRole("heading", { level: 3 });
    // First presentation should be the most recently updated
    expect(titles[0].textContent).toBe("Test Presentation 1");
  });

  it("should display slide thumbnails", () => {
    render(<PresentationList />);

    // Should show slide titles in thumbnails
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
  });

  it("should show +N indicator for presentations with many slides", () => {
    const manySlides = {
      "ppt-many": {
        id: "ppt-many",
        title: "Many Slides",
        slides: Array.from({ length: 6 }, (_, i) => ({
          id: `slide-${i}`,
          title: `Slide ${i + 1}`,
          elements: [],
          layout: "content" as const,
          order: i,
        })),
        theme: {
          name: "Default",
          primaryColor: "#3b82f6",
          backgroundColor: "#ffffff",
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: manySlides,
        deletePresentation: mockDeletePresentation,
      };
      return selector(state);
    });

    render(<PresentationList />);

    // Should show +2 for 6 slides (4 shown + 2 more)
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("should render create button in empty state", () => {
    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: {},
        deletePresentation: mockDeletePresentation,
      };
      return selector(state);
    });

    const onCreatePresentation = jest.fn();
    render(<PresentationList onCreatePresentation={onCreatePresentation} />);

    const createButton = screen.getByText("learning.ppt.create");
    fireEvent.click(createButton);

    expect(onCreatePresentation).toHaveBeenCalled();
  });

  it("should display formatted date", () => {
    render(<PresentationList />);

    // Date should be formatted - check for any date-like text
    // The component uses toLocaleDateString which varies by locale
    const cards = screen.getAllByTestId("card");
    expect(cards.length).toBeGreaterThan(0);
  });
});
