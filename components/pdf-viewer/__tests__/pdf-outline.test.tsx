import { render, screen, fireEvent } from "@testing-library/react";
import { PDFOutline } from "../pdf-outline";

describe("PDFOutline", () => {
  const mockOutline = [
    {
      title: "Chapter 1",
      pageNumber: 1,
      items: [
        {
          title: "Section 1.1",
          pageNumber: 2,
          items: [],
        },
      ],
    },
    {
      title: "Chapter 2",
      pageNumber: 5,
      items: [],
    },
  ];

  const mockOnNavigate = jest.fn();

  it("renders outline structure", () => {
    render(
      <PDFOutline
        outline={mockOutline}
        onNavigate={mockOnNavigate}
        currentPage={1}
      />
    );

    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
  });

  it("expands and collapses items", () => {
    render(
      <PDFOutline
        outline={mockOutline}
        onNavigate={mockOnNavigate}
        currentPage={1}
      />
    );

    // Initially Section 1.1 should be visible because Chapter 1 is expanded (level 0 starts expanded in implementation?)
    // Implementation says: useState(level === 0) for expanded.
    expect(screen.getByText("Section 1.1")).toBeInTheDocument();

    // Click Chapter 1 to collapse
    fireEvent.click(screen.getByText("Chapter 1"));
    
    // Should not be visible?
    // Wait, if we click the button containing Chapter 1, it toggles expansion AND navigates.
    // If it has children, it toggles.
    
    // Check if Section 1.1 is still in document. 
    // If collapsed, it shouldn't be rendered (conditional rendering).
    expect(screen.queryByText("Section 1.1")).not.toBeInTheDocument();
  });

  it("filters based on search", () => {
    render(
      <PDFOutline
        outline={mockOutline}
        onNavigate={mockOnNavigate}
        currentPage={1}
      />
    );

    const input = screen.getByPlaceholderText("Search bookmarks...");
    fireEvent.change(input, { target: { value: "Section" } });

    expect(screen.getByText("Section 1.1")).toBeInTheDocument();
    expect(screen.queryByText("Chapter 2")).not.toBeInTheDocument();
    // Chapter 1 should be visible as parent of Section 1.1
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
  });

  it("navigates on click", () => {
    render(
      <PDFOutline
        outline={mockOutline}
        onNavigate={mockOnNavigate}
        currentPage={1}
      />
    );

    fireEvent.click(screen.getByText("Chapter 2"));
    expect(mockOnNavigate).toHaveBeenCalledWith(5);
  });
});
