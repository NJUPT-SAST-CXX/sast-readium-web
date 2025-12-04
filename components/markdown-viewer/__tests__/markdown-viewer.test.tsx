/**
 * Tests for MarkdownViewer component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownViewer } from "../markdown-viewer";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock usePDFStore
jest.mock("@/lib/pdf", () => ({
  usePDFStore: () => ({
    isDarkMode: false,
    themeMode: "light",
    setThemeMode: jest.fn(),
  }),
}));

// Mock MarkdownPreview
jest.mock("../markdown-preview", () => ({
  MarkdownPreview: ({
    content,
    onHeadingsChange,
  }: {
    content: string;
    onHeadingsChange?: (
      headings: Array<{ id: string; text: string; level: number }>
    ) => void;
  }) => {
    // Simulate heading extraction
    React.useEffect(() => {
      if (onHeadingsChange) {
        const headings = [{ id: "heading-1", text: "Heading 1", level: 1 }];
        onHeadingsChange(headings);
      }
    }, [onHeadingsChange]);
    return <div data-testid="markdown-preview">{content}</div>;
  },
  TOCSidebar: ({
    items,
    onItemClick,
  }: {
    items: Array<{ id: string; text: string; level: number }>;
    onItemClick?: (id: string) => void;
  }) => (
    <div data-testid="toc-sidebar">
      {items.map((item) => (
        <button key={item.id} onClick={() => onItemClick?.(item.id)}>
          {item.text}
        </button>
      ))}
    </div>
  ),
}));

// Mock MarkdownEditor
jest.mock("../markdown-editor", () => ({
  MarkdownEditor: ({
    value,
    onChange,
    onSave,
  }: {
    value: string;
    onChange: (v: string) => void;
    onSave?: () => void;
  }) => (
    <div data-testid="markdown-editor">
      <textarea
        data-testid="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {onSave && <button onClick={onSave}>Save</button>}
    </div>
  ),
}));

// Mock readMarkdownContent - need to mock the entire module path
const mockReadMarkdownContent = jest
  .fn()
  .mockResolvedValue("# Test Markdown\n\nContent here.");
const mockSearchInContent = jest.fn().mockReturnValue([]);

jest.mock("@/lib/utils", () => {
  const actual = jest.requireActual("@/lib/utils");
  return {
    ...actual,
    readMarkdownContent: (...args: unknown[]) =>
      mockReadMarkdownContent(...args),
    searchInContent: (...args: unknown[]) => mockSearchInContent(...args),
  };
});

// Mock URL APIs
global.URL.createObjectURL = jest.fn(() => "blob:test");
global.URL.revokeObjectURL = jest.fn();

// Mock document methods
const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock fullscreen API
Object.defineProperty(document, "fullscreenElement", {
  value: null,
  writable: true,
});
document.documentElement.requestFullscreen = jest
  .fn()
  .mockResolvedValue(undefined);
document.exitFullscreen = jest.fn().mockResolvedValue(undefined);

// Create a mock File
function createMockFile(name: string, content: string): File {
  const blob = new Blob([content], { type: "text/markdown" });
  return new File([blob], name, { type: "text/markdown" });
}

describe("MarkdownViewer", () => {
  const mockFile = createMockFile(
    "test.md",
    "# Test Markdown\n\nContent here."
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadMarkdownContent.mockResolvedValue(
      "# Test Markdown\n\nContent here."
    );
  });

  it("should render loading state initially", () => {
    render(<MarkdownViewer file={mockFile} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should render content after loading", async () => {
    render(<MarkdownViewer file={mockFile} />);

    await waitFor(() => {
      expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
    });
  });

  it("should display file name in footer", async () => {
    render(<MarkdownViewer file={mockFile} />);

    await waitFor(() => {
      expect(screen.getByText("test.md")).toBeInTheDocument();
    });
  });

  it("should show toolbar by default", async () => {
    render(<MarkdownViewer file={mockFile} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
    });
  });

  it("should toggle toolbar visibility", async () => {
    render(<MarkdownViewer file={mockFile} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/toggle menu/i)).toBeInTheDocument();
    });

    // Click to hide toolbar
    const toggleButton = screen.getByLabelText(/toggle menu/i);
    await userEvent.click(toggleButton);

    // Toolbar should be hidden, but floating button should appear
    await waitFor(() => {
      expect(screen.queryByLabelText(/zoom in/i)).not.toBeInTheDocument();
    });

    // Click floating button to show toolbar again
    const floatingButton = screen.getByRole("button", { name: /toggle menu/i });
    await userEvent.click(floatingButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
    });
  });

  describe("View Modes", () => {
    it("should start in view mode by default", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
        expect(screen.queryByTestId("markdown-editor")).not.toBeInTheDocument();
      });
    });

    it("should start in edit mode when initialMode is edit", async () => {
      render(<MarkdownViewer file={mockFile} initialMode="edit" />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
      });
    });

    it("should switch to edit mode when edit button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText(/edit/i);
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
      });
    });

    it("should show split view when split button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });

      const splitButton = screen.getByLabelText(/split view/i);
      await userEvent.click(splitButton);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });
    });
  });

  describe("Zoom Controls", () => {
    it("should zoom in when zoom in button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      });

      const zoomInButton = screen.getByLabelText(/zoom in/i);
      await userEvent.click(zoomInButton);

      expect(screen.getByText("110%")).toBeInTheDocument();
    });

    it("should zoom out when zoom out button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      });

      const zoomOutButton = screen.getByLabelText(/zoom out/i);
      await userEvent.click(zoomOutButton);

      expect(screen.getByText("90%")).toBeInTheDocument();
    });

    it("should reset zoom when reset button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      });

      // Zoom in first
      const zoomInButton = screen.getByLabelText(/zoom in/i);
      await userEvent.click(zoomInButton);
      expect(screen.getByText("110%")).toBeInTheDocument();

      // Reset
      const resetButton = screen.getByLabelText(/actual size/i);
      await userEvent.click(resetButton);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Search", () => {
    it("should toggle search bar when search button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
      });

      const searchButton = screen.getByLabelText(/search/i);
      await userEvent.click(searchButton);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it("should close search bar when X button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
      });

      // Open search
      const searchButton = screen.getByLabelText(/search/i);
      await userEvent.click(searchButton);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();

      // Close search
      const closeButtons = screen.getAllByRole("button");
      const closeButton = closeButtons.find((btn) =>
        btn.querySelector("svg.lucide-x")
      );
      if (closeButton) {
        await userEvent.click(closeButton);
      }

      // Search bar should be closed
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/search/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("TOC Sidebar", () => {
    it("should show TOC sidebar when TOC button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });

      // Wait for headings to be extracted
      await waitFor(() => {
        const tocButton = screen.getByLabelText(/table of contents/i);
        expect(tocButton).not.toBeDisabled();
      });

      const tocButton = screen.getByLabelText(/table of contents/i);
      await userEvent.click(tocButton);

      await waitFor(() => {
        expect(screen.getByTestId("toc-sidebar")).toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should toggle search with Ctrl+F", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "f", ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it("should zoom in with Ctrl+Plus", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "+", ctrlKey: true });

      expect(screen.getByText("110%")).toBeInTheDocument();
    });

    it("should zoom out with Ctrl+Minus", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "-", ctrlKey: true });

      expect(screen.getByText("90%")).toBeInTheDocument();
    });

    it("should reset zoom with Ctrl+0", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      });

      // Zoom in first
      fireEvent.keyDown(window, { key: "+", ctrlKey: true });
      expect(screen.getByText("110%")).toBeInTheDocument();

      // Reset
      fireEvent.keyDown(window, { key: "0", ctrlKey: true });
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should save with Ctrl+S when onSave is provided", async () => {
      const onSave = jest.fn();
      render(<MarkdownViewer file={mockFile} onSave={onSave} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });

      // Switch to edit mode and make changes
      const editButton = screen.getByLabelText(/edit/i);
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
      });

      // Make a change
      const textarea = screen.getByTestId("editor-textarea");
      await userEvent.type(textarea, " modified");

      // Save with Ctrl+S
      fireEvent.keyDown(window, { key: "s", ctrlKey: true });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe("Download", () => {
    it("should download file when download button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/download/i)).toBeInTheDocument();
      });

      const downloadButton = screen.getByLabelText(/download/i);
      await userEvent.click(downloadButton);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe("Print", () => {
    it("should call window.print when print button is clicked", async () => {
      const printSpy = jest.spyOn(window, "print").mockImplementation(() => {});

      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/print/i)).toBeInTheDocument();
      });

      const printButton = screen.getByLabelText(/print/i);
      await userEvent.click(printButton);

      expect(printSpy).toHaveBeenCalled();
      printSpy.mockRestore();
    });
  });

  describe("Theme Toggle", () => {
    it("should show theme dropdown when theme button is clicked", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });

      // Find the theme toggle button (sun/moon icon)
      const themeButtons = screen.getAllByRole("button");
      const themeButton = themeButtons.find(
        (btn) =>
          btn.querySelector("svg.lucide-sun") ||
          btn.querySelector("svg.lucide-moon")
      );

      if (themeButton) {
        await userEvent.click(themeButton);

        await waitFor(() => {
          expect(screen.getByText(/light/i)).toBeInTheDocument();
          expect(screen.getByText(/dark/i)).toBeInTheDocument();
          expect(screen.getByText(/sepia/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("should show error state when file loading fails", async () => {
      mockReadMarkdownContent.mockRejectedValueOnce(
        new Error("Failed to load")
      );

      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it("should show go back button on error", async () => {
      mockReadMarkdownContent.mockRejectedValueOnce(
        new Error("Failed to load")
      );

      const onClose = jest.fn();
      render(<MarkdownViewer file={mockFile} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByText(/go back/i)).toBeInTheDocument();
      });

      const goBackButton = screen.getByText(/go back/i);
      await userEvent.click(goBackButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Header", () => {
    it("should render custom header when provided", async () => {
      render(
        <MarkdownViewer
          file={mockFile}
          header={<div data-testid="custom-header">Custom Header</div>}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("custom-header")).toBeInTheDocument();
      });
    });
  });

  describe("Save Functionality", () => {
    it("should show save button when onSave is provided", async () => {
      const onSave = jest.fn();
      render(<MarkdownViewer file={mockFile} onSave={onSave} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/save/i)).toBeInTheDocument();
      });
    });

    it("should not show save button when onSave is not provided", async () => {
      render(<MarkdownViewer file={mockFile} />);

      await waitFor(() => {
        expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
      });

      expect(
        screen.queryByLabelText(/save \(ctrl\+s\)/i)
      ).not.toBeInTheDocument();
    });
  });
});
