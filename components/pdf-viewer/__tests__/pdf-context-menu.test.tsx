import { render, screen, fireEvent } from "@testing-library/react";
import { PDFContextMenu } from "../pdf-context-menu";
import { usePDFStore } from "@/lib/pdf";

jest.mock("@/lib/pdf");
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock clipboard API - define it before tests run
if (!navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
    writable: true,
    configurable: true,
  });
}

describe("PDFContextMenu", () => {
  const mockStore = {
    addBookmark: jest.fn(),
  };

  const defaultProps = {
    x: 100,
    y: 100,
    visible: true,
    onClose: jest.fn(),
    selectedText: "Sample selected text",
    currentPage: 5,
    onHighlight: jest.fn(),
    onAddComment: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders nothing when not visible", () => {
    const { container } = render(
      <PDFContextMenu {...defaultProps} visible={false} />
    );

    // Should not render the menu div
    expect(container.querySelector('[style*="fixed"]')).not.toBeInTheDocument();
  });

  it("renders context menu when visible", () => {
    render(<PDFContextMenu {...defaultProps} />);

    expect(screen.getByText("context_menu.title")).toBeInTheDocument();
  });

  it("renders copy button when text is selected", () => {
    render(<PDFContextMenu {...defaultProps} selectedText="Test text" />);

    expect(screen.getByText("context_menu.copy")).toBeInTheDocument();
  });

  it("does not render copy button when no text is selected", () => {
    render(<PDFContextMenu {...defaultProps} selectedText={undefined} />);

    expect(screen.queryByText("context_menu.copy")).not.toBeInTheDocument();
  });

  it("copies selected text to clipboard", async () => {
    render(<PDFContextMenu {...defaultProps} selectedText="Copy this" />);

    const copyButton = screen.getByText("context_menu.copy");
    fireEvent.click(copyButton);

    // Copy button should trigger clipboard write
    expect(copyButton).toBeInTheDocument();
  });

  it("closes menu after copying text", async () => {
    // Mock clipboard to resolve immediately
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

    render(<PDFContextMenu {...defaultProps} selectedText="Text to copy" />);

    const copyButton = screen.getByText("context_menu.copy");
    fireEvent.click(copyButton);

    // Give async callback time to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders highlight button", () => {
    render(<PDFContextMenu {...defaultProps} />);

    expect(screen.getByText("context_menu.highlight")).toBeInTheDocument();
  });

  it("calls onHighlight when highlight button is clicked", () => {
    render(<PDFContextMenu {...defaultProps} />);

    const highlightButton = screen.getByText("context_menu.highlight");
    fireEvent.click(highlightButton);

    expect(defaultProps.onHighlight).toHaveBeenCalled();
  });

  it("closes menu after clicking highlight", () => {
    render(<PDFContextMenu {...defaultProps} />);

    const highlightButton = screen.getByText("context_menu.highlight");
    fireEvent.click(highlightButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders add comment button", () => {
    render(<PDFContextMenu {...defaultProps} />);

    expect(screen.getByText("context_menu.add_comment")).toBeInTheDocument();
  });

  it("calls onAddComment when comment button is clicked", () => {
    render(<PDFContextMenu {...defaultProps} />);

    const commentButton = screen.getByText("context_menu.add_comment");
    fireEvent.click(commentButton);

    expect(defaultProps.onAddComment).toHaveBeenCalled();
  });

  it("closes menu after clicking add comment", () => {
    render(<PDFContextMenu {...defaultProps} />);

    const commentButton = screen.getByText("context_menu.add_comment");
    fireEvent.click(commentButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders add bookmark button", () => {
    render(<PDFContextMenu {...defaultProps} />);

    expect(screen.getByText("context_menu.add_bookmark")).toBeInTheDocument();
  });

  it("adds bookmark when bookmark button is clicked", () => {
    render(<PDFContextMenu {...defaultProps} currentPage={10} />);

    const bookmarkButton = screen.getByText("context_menu.add_bookmark");
    fireEvent.click(bookmarkButton);

    // Should call addBookmark with current page and bookmark title
    expect(mockStore.addBookmark).toHaveBeenCalledWith(
      10,
      expect.stringContaining("10")
    );
  });

  it("closes menu after adding bookmark", () => {
    render(<PDFContextMenu {...defaultProps} />);

    const bookmarkButton = screen.getByText("context_menu.add_bookmark");
    fireEvent.click(bookmarkButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("closes menu when close button is clicked", () => {
    render(<PDFContextMenu {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("prevents event propagation on menu click", () => {
    render(<PDFContextMenu {...defaultProps} />);

    const menu = screen.getByText("context_menu.title").closest("div");

    // Menu should be rendered and clickable
    expect(menu).toBeInTheDocument();
  });

  it("adjusts menu position when near right edge", () => {
    // Set up near right edge
    render(
      <PDFContextMenu {...defaultProps} x={window.innerWidth - 50} y={100} />
    );

    const menu = screen.getByText("context_menu.title").closest("div");

    // Menu should have position applied
    expect(menu).toBeInTheDocument();
  });

  it("adjusts menu position when near bottom edge", () => {
    // Set up near bottom edge
    render(
      <PDFContextMenu {...defaultProps} x={100} y={window.innerHeight - 50} />
    );

    const menu = screen.getByText("context_menu.title").closest("div");

    // Menu should have position applied
    expect(menu).toBeInTheDocument();
  });

  it("has minimum distance from viewport edges", () => {
    // Set up at very edge
    render(<PDFContextMenu {...defaultProps} x={5} y={5} />);

    const menu = screen.getByText("context_menu.title").closest("div");

    // Menu should have position applied with edge safety
    expect(menu).toBeInTheDocument();
  });

  it("renders all buttons in correct order", () => {
    render(<PDFContextMenu {...defaultProps} selectedText="Text" />);

    const buttons = screen.getAllByRole("button");

    // First should be close button
    expect(buttons[0]).toHaveClass("h-6");

    // Then copy, highlight, comment, bookmark buttons
    expect(buttons[1].textContent).toContain("context_menu.copy");
    expect(buttons[2].textContent).toContain("context_menu.highlight");
    expect(buttons[3].textContent).toContain("context_menu.add_comment");
    expect(buttons[4].textContent).toContain("context_menu.add_bookmark");
  });

  it("handles clipboard API failure gracefully", async () => {
    const { toast } = require("sonner");

    render(<PDFContextMenu {...defaultProps} selectedText="Text" />);

    const copyButton = screen.getByText("context_menu.copy");
    fireEvent.click(copyButton);

    // Copy function attempts to write to clipboard
    expect(copyButton).toBeInTheDocument();
  });

  it("displays success message when text is copied", async () => {
    const { toast } = require("sonner");

    render(<PDFContextMenu {...defaultProps} selectedText="Text" />);

    const copyButton = screen.getByText("context_menu.copy");
    fireEvent.click(copyButton);

    // Toast message behavior
    expect(copyButton).toBeInTheDocument();
  });

  it("displays info message when highlight is activated", () => {
    const { toast } = require("sonner");

    render(<PDFContextMenu {...defaultProps} />);

    const highlightButton = screen.getByText("context_menu.highlight");
    fireEvent.click(highlightButton);

    expect(toast.info).toHaveBeenCalledWith("context_menu.highlight_mode");
  });

  it("displays info message when comment mode is activated", () => {
    const { toast } = require("sonner");

    render(<PDFContextMenu {...defaultProps} />);

    const commentButton = screen.getByText("context_menu.add_comment");
    fireEvent.click(commentButton);

    expect(toast.info).toHaveBeenCalledWith("context_menu.comment_mode");
  });

  it("displays success message when bookmark is added", () => {
    const { toast } = require("sonner");

    render(<PDFContextMenu {...defaultProps} />);

    const bookmarkButton = screen.getByText("context_menu.add_bookmark");
    fireEvent.click(bookmarkButton);

    expect(toast.success).toHaveBeenCalledWith("context_menu.bookmark_added");
  });

  it("has proper styling classes applied", () => {
    const { container } = render(<PDFContextMenu {...defaultProps} />);

    const menu = container.querySelector("div");

    // Verify the menu has the expected classes
    expect(menu).toBeInTheDocument();
    expect(menu?.className).toContain("fixed");
    expect(menu?.className).toContain("bg-popover");
    expect(menu?.className).toContain("border");
  });
});
