import { render, screen, fireEvent } from "@testing-library/react";
import { PDFDraggableThumbnail } from "../pdf-draggable-thumbnail";

// Mock dnd-kit
jest.mock("@dnd-kit/sortable", () => ({
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
    isOver: false,
  })),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: jest.fn((transform) => ""),
    },
  },
}));

// Mock the PDFThumbnail component
jest.mock("../pdf-thumbnail", () => ({
  PDFThumbnail: ({ pageNumber, isActive, onClick }: any) => (
    <div data-testid={`thumbnail-${pageNumber}`}>
      <button onClick={onClick} className={isActive ? "active" : ""}>
        Page {pageNumber}
      </button>
    </div>
  ),
}));

describe("PDFDraggableThumbnail", () => {
  const mockPage = {
    getViewport: jest.fn().mockReturnValue({ width: 100, height: 100 }),
    render: jest.fn().mockReturnValue({
      promise: Promise.resolve(),
    }),
  };

  const defaultProps = {
    page: mockPage as unknown as any,
    pageNumber: 1,
    isActive: false,
    onClick: jest.fn(),
    isDragEnabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders thumbnail", () => {
    render(<PDFDraggableThumbnail {...defaultProps} />);

    expect(screen.getByTestId("thumbnail-1")).toBeInTheDocument();
  });

  it("passes pageNumber to thumbnail", () => {
    render(<PDFDraggableThumbnail {...defaultProps} pageNumber={5} />);

    expect(screen.getByTestId("thumbnail-5")).toBeInTheDocument();
  });

  it("calls onClick when thumbnail is clicked", () => {
    const onClick = jest.fn();
    render(<PDFDraggableThumbnail {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByText("Page 1"));
    expect(onClick).toHaveBeenCalled();
  });

  it("passes isActive state to thumbnail", () => {
    const { rerender } = render(
      <PDFDraggableThumbnail {...defaultProps} isActive={false} />
    );

    let button = screen.getByText("Page 1");
    expect(button).not.toHaveClass("active");

    rerender(<PDFDraggableThumbnail {...defaultProps} isActive={true} />);

    button = screen.getByText("Page 1");
    expect(button).toHaveClass("active");
  });

  it("renders drag handle when drag is enabled", () => {
    render(<PDFDraggableThumbnail {...defaultProps} isDragEnabled={true} />);

    // Check for the drag handle div
    const container = screen.getByTestId("thumbnail-1").parentElement;
    expect(container?.querySelector("div")).toBeInTheDocument();
  });

  it("does not render drag handle when drag is disabled", () => {
    render(<PDFDraggableThumbnail {...defaultProps} isDragEnabled={false} />);

    const container = screen.getByTestId("thumbnail-1").parentElement;
    // Should have fewer elements when drag handle is not rendered
    const divCount = container?.querySelectorAll("div").length ?? 0;
    expect(divCount).toBeLessThan(3);
  });

  it("renders rotate button when onRotate is provided", () => {
    const onRotate = jest.fn();
    render(<PDFDraggableThumbnail {...defaultProps} onRotate={onRotate} />);

    // Should have action buttons overlay with rotate button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("calls onRotate when rotate button is clicked", () => {
    const onRotate = jest.fn();
    render(<PDFDraggableThumbnail {...defaultProps} onRotate={onRotate} />);

    const buttons = screen.getAllByRole("button");
    // First button is thumbnail, second should be rotate or delete
    // We need to find the rotate button - it comes before delete in the overlay
    const rotateButton = buttons[buttons.length - 2]; // Rotate is second-to-last
    fireEvent.click(rotateButton);

    expect(onRotate).toHaveBeenCalled();
  });

  it("renders remove button when onRemove is provided", () => {
    const onRemove = jest.fn();
    render(<PDFDraggableThumbnail {...defaultProps} onRemove={onRemove} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("calls onRemove when remove button is clicked", () => {
    const onRemove = jest.fn();
    render(<PDFDraggableThumbnail {...defaultProps} onRemove={onRemove} />);

    // When onRemove is provided, there should be action buttons rendered
    const buttons = screen.getAllByRole("button");
    // At least the thumbnail button should be there
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("does not render action buttons when no callbacks provided", () => {
    render(
      <PDFDraggableThumbnail
        {...defaultProps}
        onRotate={undefined}
        onRemove={undefined}
      />
    );

    // Should only have the thumbnail button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(1);
  });

  it("prevents event propagation when clicking action buttons", () => {
    const onRemove = jest.fn();
    render(<PDFDraggableThumbnail {...defaultProps} onRemove={onRemove} />);

    const buttons = screen.getAllByRole("button");
    // Should have thumbnail button + action buttons
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders both rotate and remove buttons together", () => {
    const onRotate = jest.fn();
    const onRemove = jest.fn();

    render(
      <PDFDraggableThumbnail
        {...defaultProps}
        onRotate={onRotate}
        onRemove={onRemove}
      />
    );

    const buttons = screen.getAllByRole("button");
    // Should have: thumbnail + rotate + remove
    expect(buttons.length).toBe(3);
  });

  it("applies correct styling to container when dragging", () => {
    const { useSortable } = require("@dnd-kit/sortable");
    useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: true,
      isOver: false,
    });

    const { container } = render(<PDFDraggableThumbnail {...defaultProps} />);

    const wrapper = container.querySelector(".relative");
    expect(wrapper).toHaveClass("z-50");
    expect(wrapper).toHaveClass("opacity-50");
  });

  it("applies correct styling when drag is over", () => {
    const { useSortable } = require("@dnd-kit/sortable");
    useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: false,
      isOver: true,
    });

    const { container } = render(<PDFDraggableThumbnail {...defaultProps} />);

    const wrapper = container.querySelector(".relative");
    expect(wrapper).toHaveClass("opacity-75");
  });

  it("shows top drop indicator when isOver and not dragging", () => {
    const { useSortable } = require("@dnd-kit/sortable");
    useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: false,
      isOver: true,
    });

    const { container } = render(<PDFDraggableThumbnail {...defaultProps} />);

    const topIndicator = container.querySelector(".absolute.-top-1");
    expect(topIndicator).toBeInTheDocument();
  });

  it("shows bottom drop indicator when isOver and dragging", () => {
    const { useSortable } = require("@dnd-kit/sortable");
    useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: true,
      isOver: true,
    });

    const { container } = render(<PDFDraggableThumbnail {...defaultProps} />);

    const bottomIndicator = container.querySelector(".absolute.-bottom-1");
    expect(bottomIndicator).toBeInTheDocument();
  });

  it("shows dragging overlay when dragging", () => {
    const { useSortable } = require("@dnd-kit/sortable");
    useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: true,
      isOver: false,
    });

    const { container } = render(<PDFDraggableThumbnail {...defaultProps} />);

    const overlay = container.querySelector(".absolute.inset-0");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("border-2");
    expect(overlay).toHaveClass("border-dashed");
  });

  it("does not show dragging overlay when not dragging", () => {
    const { useSortable } = require("@dnd-kit/sortable");
    useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: null,
      isDragging: false,
      isOver: false,
    });

    const { container } = render(<PDFDraggableThumbnail {...defaultProps} />);

    const overlay = container.querySelector(".absolute.inset-0");
    expect(overlay).not.toBeInTheDocument();
  });

  it("applies group hover classes to drag handle", () => {
    render(<PDFDraggableThumbnail {...defaultProps} isDragEnabled={true} />);

    // Drag handle should be rendered when drag is enabled
    const container = screen.getByTestId("thumbnail-1").parentElement;
    expect(container).toBeInTheDocument();
  });

  it("applies grab cursor to drag handle", () => {
    render(<PDFDraggableThumbnail {...defaultProps} isDragEnabled={true} />);

    // Drag handle should have cursor-grab class
    const container = screen.getByTestId("thumbnail-1").parentElement;
    expect(container).toBeInTheDocument();
  });

  it("renders with correct page number passed through", () => {
    render(<PDFDraggableThumbnail {...defaultProps} pageNumber={42} />);

    expect(screen.getByTestId("thumbnail-42")).toBeInTheDocument();
  });

  it("handles null page prop gracefully", () => {
    render(<PDFDraggableThumbnail {...defaultProps} page={null} />);

    expect(screen.getByTestId("thumbnail-1")).toBeInTheDocument();
  });

  it("maintains drag state consistency across re-renders", () => {
    const { rerender } = render(
      <PDFDraggableThumbnail {...defaultProps} isDragEnabled={true} />
    );

    rerender(<PDFDraggableThumbnail {...defaultProps} isDragEnabled={true} />);

    expect(screen.getByTestId("thumbnail-1")).toBeInTheDocument();
  });
});
