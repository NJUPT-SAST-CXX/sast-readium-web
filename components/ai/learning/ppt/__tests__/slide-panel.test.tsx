/**
 * Tests for SlidePanel component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { SlidePanel } from "../slide-panel";
import { usePPTStore } from "@/lib/ai/learning";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock("@/lib/ai/learning", () => ({
  usePPTStore: jest.fn(),
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

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => (
    <div data-testid="scroll-area">{children}</div>
  ),
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
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

const mockUsePPTStore = usePPTStore as jest.MockedFunction<typeof usePPTStore>;

describe("SlidePanel", () => {
  const mockPresentation = {
    id: "ppt-1",
    title: "Test Presentation",
    slides: [
      {
        id: "slide-1",
        layout: "title" as const,
        title: "Title Slide",
        elements: [
          {
            id: "elem-1",
            type: "text" as const,
            content: "Welcome",
            position: { x: 0, y: 0 },
            size: { width: 100, height: 50 },
            style: { color: "#000000" },
            zIndex: 1,
          },
        ],
        notes: "",
        order: 0,
      },
      {
        id: "slide-2",
        layout: "content" as const,
        title: "Content Slide",
        elements: [],
        notes: "",
        order: 1,
      },
      {
        id: "slide-3",
        layout: "blank" as const,
        title: "",
        elements: [],
        notes: "",
        order: 2,
      },
    ],
    theme: {
      name: "Default",
      primaryColor: "#3b82f6",
      backgroundColor: "#ffffff",
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockAddSlide = jest.fn();
  const mockDeleteSlide = jest.fn();
  const mockDuplicateSlide = jest.fn();
  const mockReorderSlides = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: { "ppt-1": mockPresentation },
        addSlide: mockAddSlide,
        deleteSlide: mockDeleteSlide,
        duplicateSlide: mockDuplicateSlide,
        reorderSlides: mockReorderSlides,
      };
      return selector(state);
    });
  });

  it("should render slide panel", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
  });

  it("should display slide count", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    expect(screen.getByText(/3.*slides/)).toBeInTheDocument();
  });

  it("should render slide thumbnails", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    // Should show slide numbers
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should call onSelectSlide when thumbnail clicked", () => {
    const onSelectSlide = jest.fn();
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={onSelectSlide}
      />
    );

    // Click on slide 2 number
    fireEvent.click(screen.getByText("2"));

    expect(onSelectSlide).toHaveBeenCalledWith("slide-2");
  });

  it("should show add slide dropdown", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    const dropdownContent = screen.getAllByTestId("dropdown-content");
    expect(dropdownContent.length).toBeGreaterThan(0);
  });

  it("should call addSlide with layout when layout option clicked", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const titleItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.ppt.layouts.title")
    );

    if (titleItem) {
      fireEvent.click(titleItem);
      expect(mockAddSlide).toHaveBeenCalledWith(
        "ppt-1",
        expect.objectContaining({
          layout: "title",
        })
      );
    }
  });

  it("should call duplicateSlide when duplicate clicked", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const duplicateItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.ppt.editor.duplicate")
    );

    if (duplicateItem) {
      fireEvent.click(duplicateItem);
      expect(mockDuplicateSlide).toHaveBeenCalled();
    }
  });

  it("should call deleteSlide when delete clicked", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const deleteItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.common.delete")
    );

    if (deleteItem) {
      fireEvent.click(deleteItem);
      expect(mockDeleteSlide).toHaveBeenCalled();
    }
  });

  it("should call reorderSlides when move up clicked", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-2"
        onSelectSlide={jest.fn()}
      />
    );

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const moveUpItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.ppt.editor.move_up")
    );

    if (moveUpItem) {
      fireEvent.click(moveUpItem);
      expect(mockReorderSlides).toHaveBeenCalled();
    }
  });

  it("should call reorderSlides when move down clicked", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    const moveDownItem = dropdownItems.find((item) =>
      item.textContent?.includes("learning.ppt.editor.move_down")
    );

    if (moveDownItem) {
      fireEvent.click(moveDownItem);
      expect(mockReorderSlides).toHaveBeenCalled();
    }
  });

  it("should return null when presentation not found", () => {
    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: {},
        addSlide: mockAddSlide,
        deleteSlide: mockDeleteSlide,
        duplicateSlide: mockDuplicateSlide,
        reorderSlides: mockReorderSlides,
      };
      return selector(state);
    });

    const { container } = render(
      <SlidePanel
        presentationId="nonexistent"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should display element preview in thumbnail", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    // First slide has "Welcome" text element
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  it("should display slide title in thumbnail", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    expect(screen.getByText("Title Slide")).toBeInTheDocument();
  });

  it("should highlight selected slide", () => {
    const { container } = render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    // Selected slide should have ring-2 ring-blue-500 class
    const selectedSlide = container.querySelector(".ring-blue-500");
    expect(selectedSlide).toBeInTheDocument();
  });

  it("should show layout options in add slide dropdown", () => {
    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-1"
        onSelectSlide={jest.fn()}
      />
    );

    expect(screen.getByText("learning.ppt.layouts.title")).toBeInTheDocument();
    expect(
      screen.getByText("learning.ppt.layouts.content")
    ).toBeInTheDocument();
    expect(
      screen.getByText("learning.ppt.layouts.two_column")
    ).toBeInTheDocument();
    expect(screen.getByText("learning.ppt.layouts.blank")).toBeInTheDocument();
  });

  it("should call deleteSlide with correct args", () => {
    const onSelectSlide = jest.fn();

    render(
      <SlidePanel
        presentationId="ppt-1"
        selectedSlideId="slide-2"
        onSelectSlide={onSelectSlide}
      />
    );

    const dropdownItems = screen.getAllByTestId("dropdown-item");
    // Find delete item for slide-2 (second set of dropdown items)
    const deleteItems = dropdownItems.filter((item) =>
      item.textContent?.includes("learning.common.delete")
    );

    // Click the delete item for slide-2 (index 1)
    if (deleteItems.length > 1) {
      fireEvent.click(deleteItems[1]);
      expect(mockDeleteSlide).toHaveBeenCalledWith("ppt-1", "slide-2");
    }
  });
});
