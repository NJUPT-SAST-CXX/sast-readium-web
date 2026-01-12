import { render, screen, fireEvent } from "@testing-library/react";
import { PDFBookmarks } from "../bookmarks";
import { usePDFStore } from "@/lib/pdf";

jest.mock("@/lib/pdf");

describe("PDFBookmarks", () => {
  const mockStore = {
    bookmarks: [
      { id: "1", pageNumber: 1, title: "Bookmark 1", timestamp: Date.now() },
      { id: "2", pageNumber: 5, title: "Bookmark 2", timestamp: Date.now() },
    ],
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
  };

  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders bookmarks list", () => {
    render(<PDFBookmarks onNavigate={mockOnNavigate} currentPage={1} />);
    expect(screen.getByText("Bookmark 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });

  it("adds a bookmark", () => {
    render(<PDFBookmarks onNavigate={mockOnNavigate} currentPage={3} />);

    // Click add button (plus icon)
    const addButton = screen.getAllByRole("button")[0]; // Assuming first button is add
    // Or find by icon if possible, but lucide icons are tricky.
    // The Add button has onClick={() => setIsAdding(!isAdding)}

    // Let's try to find by text "My Bookmarks" and the button next to it.
    // Or just click the button that has the Plus icon.
    // We can query by class "h-8 w-8" maybe?

    // Let's use fireEvent on the button.
    // The first button in the document is likely the add button in the header.
    // (assuming no other buttons before it).

    fireEvent.click(addButton);

    const input = screen.getByPlaceholderText("Bookmark name...");
    fireEvent.change(input, { target: { value: "New Bookmark" } });

    const submitBtn = screen.getByText("Add");
    fireEvent.click(submitBtn);

    expect(mockStore.addBookmark).toHaveBeenCalledWith(3, "New Bookmark");
  });

  it("navigates on click", () => {
    render(<PDFBookmarks onNavigate={mockOnNavigate} currentPage={1} />);

    fireEvent.click(screen.getByText("Bookmark 2"));
    expect(mockOnNavigate).toHaveBeenCalledWith(5);
  });

  it("removes a bookmark", () => {
    render(<PDFBookmarks onNavigate={mockOnNavigate} currentPage={1} />);

    // Find delete button. It's invisible until hover usually, but exists in DOM.
    // It has onClick={() => removeBookmark(bookmark.id)}

    const buttons = screen.getAllByRole("button");
    // buttons: Add, Bookmark 1 (button), Delete 1, Bookmark 2 (button), Delete 2.
    // We want Delete 1.

    // The delete button has Trash2 icon.
    // We can assume it is the 3rd button?
    // 1. Add
    // 2. Bookmark 1
    // 3. Delete 1

    const deleteBtn = buttons[2];
    fireEvent.click(deleteBtn);

    expect(mockStore.removeBookmark).toHaveBeenCalledWith("1");
  });
});
