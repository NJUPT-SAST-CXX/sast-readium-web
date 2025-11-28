import { render, screen, fireEvent } from "@testing-library/react";
import { PDFAnnotationsList } from "../pdf-annotations-list";
import { usePDFStore, Annotation } from "@/lib/pdf-store";

jest.mock("@/lib/pdf-store");

describe("PDFAnnotationsList", () => {
  const mockAnnotations: Annotation[] = [
    {
      id: "1",
      type: "highlight",
      pageNumber: 1,
      timestamp: Date.now(),
      position: { x: 10, y: 20, width: 100, height: 20 },
      color: "#FFFF00",
    },
    {
      id: "2",
      type: "comment",
      pageNumber: 2,
      timestamp: Date.now() - 1000,
      position: { x: 10, y: 20, width: 100, height: 20 },
      color: "#FF0000",
      content: "This is a comment",
    },
    {
      id: "3",
      type: "shape",
      pageNumber: 1,
      timestamp: Date.now() - 2000,
      position: { x: 10, y: 20, width: 100, height: 20 },
      color: "#0000FF",
    },
  ];

  const mockStore = {
    annotations: mockAnnotations,
  };

  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders annotations list", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    // Check that annotations count is displayed
    expect(screen.getByText(/Annotations \(3\)/)).toBeInTheDocument();
  });

  it("displays empty state when no annotations", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      annotations: [],
    });

    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    expect(screen.getByText("No annotations yet")).toBeInTheDocument();
    expect(
      screen.getByText("Use the toolbar to add annotations")
    ).toBeInTheDocument();
  });

  it("renders annotation items with content", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    // Comment should show its content
    expect(screen.getByText("This is a comment")).toBeInTheDocument();

    // Highlights should show default text
    expect(screen.getByText("Highlighted text")).toBeInTheDocument();

    // Shapes should show default text
    expect(screen.getByText("Shape annotation")).toBeInTheDocument();
  });

  it("displays page numbers for annotations", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    expect(screen.getAllByText(/Page 1/)).toHaveLength(3); // Page header + 2 annotations on page 1
    expect(screen.getAllByText(/Page 2/)).toHaveLength(2); // Page header + 1 annotation on page 2
  });

  it("navigates to annotation on click", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    // Click on the comment annotation
    const commentButton = screen
      .getByText("This is a comment")
      .closest("button");
    fireEvent.click(commentButton!);

    expect(mockOnNavigate).toHaveBeenCalledWith(2, "2");
  });

  it("highlights active page annotations", () => {
    const { rerender } = render(
      <PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />
    );

    // Annotations on page 1 should have active styling
    let buttons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Highlighted text"));
    expect(buttons[0]).toHaveClass("bg-accent/50");

    // Rerender with different current page
    rerender(
      <PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={2} />
    );

    // Now page 2 should be active
    buttons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("This is a comment"));
    expect(buttons[0]).toHaveClass("bg-accent/50");
  });

  it("searches annotations by content", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    const searchInput = screen.getByPlaceholderText("Search annotations...");
    fireEvent.change(searchInput, { target: { value: "comment" } });

    // Should only show the comment annotation
    expect(screen.getByText("This is a comment")).toBeInTheDocument();
    expect(screen.queryByText("Highlighted text")).not.toBeInTheDocument();

    // Count should update
    expect(screen.getByText(/Annotations \(1\)/)).toBeInTheDocument();
  });

  it("searches annotations by type", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    const searchInput = screen.getByPlaceholderText("Search annotations...");
    fireEvent.change(searchInput, { target: { value: "shape" } });

    // Should only show shape annotations
    expect(screen.getByText("Shape annotation")).toBeInTheDocument();
    expect(screen.queryByText("This is a comment")).not.toBeInTheDocument();
  });

  it("searches annotations by page number", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    const searchInput = screen.getByPlaceholderText("Search annotations...");
    fireEvent.change(searchInput, { target: { value: "2" } });

    // Should only show annotations on page 2
    expect(screen.getByText("This is a comment")).toBeInTheDocument();
    expect(screen.getByText(/Annotations \(1\)/)).toBeInTheDocument();
  });

  it("clears search with clear button", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    const searchInput = screen.getByPlaceholderText(
      "Search annotations..."
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "comment" } });

    expect(searchInput.value).toBe("comment");

    // Click clear button
    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe("");
    expect(screen.getByText(/Annotations \(3\)/)).toBeInTheDocument();
  });

  it("displays no match message when search returns no results", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    const searchInput = screen.getByPlaceholderText("Search annotations...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("No annotations match your search")
    ).toBeInTheDocument();
  });

  it("groups annotations by page", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    // Since there are 2 pages with annotations, page headers should be shown
    const pageHeaders = screen.getAllByText(/^Page \d+$/);
    expect(pageHeaders.length).toBeGreaterThan(0);
  });

  it("sorts annotations by page number then timestamp", () => {
    render(<PDFAnnotationsList onNavigate={mockOnNavigate} currentPage={1} />);

    // Get all annotation items in order
    const items = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Page"));

    // First items should be from page 1
    expect(items[0].textContent).toContain("Page 1");
    expect(items[1].textContent).toContain("Page 1");

    // Then items from page 2
    expect(items[2].textContent).toContain("Page 2");
  });
});
