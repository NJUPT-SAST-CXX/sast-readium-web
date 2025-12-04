/**
 * Tests for SlideEditor component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { SlideEditor } from "../slide-editor";
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
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, type }: any) => (
    <input value={value} onChange={onChange} type={type} data-testid="input" />
  ),
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange }: any) => (
    <textarea value={value} onChange={onChange} data-testid="textarea" />
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange }: any) => (
    <input
      type="range"
      value={value?.[0]}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      data-testid="slider"
    />
  ),
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/toggle-group", () => ({
  ToggleGroup: ({ children }: any) => (
    <div data-testid="toggle-group">{children}</div>
  ),
  ToggleGroupItem: ({ children, value }: any) => (
    <button data-testid={`toggle-${value}`}>{children}</button>
  ),
}));

const mockUsePPTStore = usePPTStore as jest.MockedFunction<typeof usePPTStore>;

describe("SlideEditor", () => {
  const mockPresentation = {
    id: "ppt-1",
    title: "Test Presentation",
    slides: [
      {
        id: "slide-1",
        layout: "content" as const,
        title: "Slide 1",
        elements: [
          {
            id: "elem-1",
            type: "text" as const,
            content: "Hello World",
            position: { x: 100, y: 100 },
            size: { width: 200, height: 50 },
            style: {
              fontSize: 16,
              fontWeight: "normal",
              fontStyle: "normal",
              textAlign: "left" as const,
              color: "#000000",
              backgroundColor: "transparent",
              borderColor: "#d1d5db",
              borderWidth: 0,
              opacity: 1,
            },
            zIndex: 1,
          },
        ],
        notes: "",
        order: 0,
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

  const mockUpdateElement = jest.fn();
  const mockDeleteElement = jest.fn();
  const mockBringForward = jest.fn();
  const mockSendBackward = jest.fn();
  const mockAddElement = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: { "ppt-1": mockPresentation },
        updateElement: mockUpdateElement,
        deleteElement: mockDeleteElement,
        bringForward: mockBringForward,
        sendBackward: mockSendBackward,
        addElement: mockAddElement,
      };
      return selector(state);
    });
  });

  it("should render slide editor", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    expect(screen.getByTestId("separator")).toBeInTheDocument();
  });

  it("should render toolbar buttons", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should render shape popover", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();
  });

  it("should call addElement when add text is clicked", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(mockAddElement).toHaveBeenCalled();
  });

  it("should display element content", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should show error when presentation not found", () => {
    mockUsePPTStore.mockImplementation((selector: any) => {
      const state = {
        presentations: {},
        updateElement: mockUpdateElement,
        deleteElement: mockDeleteElement,
        bringForward: mockBringForward,
        sendBackward: mockSendBackward,
        addElement: mockAddElement,
      };
      return selector(state);
    });

    render(<SlideEditor presentationId="nonexistent" slideId="slide-1" />);
    expect(screen.getByText("learning.common.error")).toBeInTheDocument();
  });

  it("should show error when slide not found", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="nonexistent" />);
    expect(screen.getByText("learning.common.error")).toBeInTheDocument();
  });

  it("should call onSelectElement when element clicked", () => {
    const onSelectElement = jest.fn();
    render(
      <SlideEditor
        presentationId="ppt-1"
        slideId="slide-1"
        onSelectElement={onSelectElement}
      />
    );

    fireEvent.click(screen.getByText("Hello World"));
    expect(onSelectElement).toHaveBeenCalledWith("elem-1");
  });

  it("should show properties panel when element selected", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    fireEvent.click(screen.getByText("Hello World"));
    expect(
      screen.getByText("learning.ppt.editor.properties")
    ).toBeInTheDocument();
  });

  it("should render shape buttons in popover", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    const popover = screen.getByTestId("popover-content");
    const shapeButtons = popover.querySelectorAll("button");
    expect(shapeButtons.length).toBeGreaterThan(0);
  });

  it("should show selection actions when element selected", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    fireEvent.click(screen.getByText("Hello World"));
    const separators = screen.getAllByTestId("separator");
    expect(separators.length).toBeGreaterThan(1);
  });

  it("should render text alignment toggle group", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    fireEvent.click(screen.getByText("Hello World"));
    expect(screen.getByTestId("toggle-group")).toBeInTheDocument();
  });

  it("should render position inputs in properties panel", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    fireEvent.click(screen.getByText("Hello World"));
    const inputs = screen.getAllByTestId("input");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("should render sliders in properties panel", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    fireEvent.click(screen.getByText("Hello World"));
    const sliders = screen.getAllByTestId("slider");
    expect(sliders.length).toBeGreaterThan(0);
  });

  it("should render textarea for text element content", () => {
    render(<SlideEditor presentationId="ppt-1" slideId="slide-1" />);
    fireEvent.click(screen.getByText("Hello World"));
    expect(screen.getByTestId("textarea")).toBeInTheDocument();
  });
});
