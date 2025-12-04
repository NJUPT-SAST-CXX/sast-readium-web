/**
 * Tests for MarkdownEditor component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../markdown-editor";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock MarkdownPreview
jest.mock("../markdown-preview", () => ({
  MarkdownPreview: ({ content }: { content: string }) => (
    <div data-testid="markdown-preview">{content}</div>
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:test");
global.URL.revokeObjectURL = jest.fn();

describe("MarkdownEditor", () => {
  const defaultProps = {
    value: "# Test Content",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with initial value", () => {
    render(<MarkdownEditor {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("# Test Content");
  });

  it("should call onChange when content changes", async () => {
    const onChange = jest.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);

    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "Hello");

    expect(onChange).toHaveBeenCalled();
  });

  it("should show toolbar by default", () => {
    render(<MarkdownEditor {...defaultProps} />);
    // Check for toolbar buttons
    expect(screen.getByLabelText(/bold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/italic/i)).toBeInTheDocument();
  });

  it("should hide toolbar when showToolbar is false", () => {
    render(<MarkdownEditor {...defaultProps} showToolbar={false} />);
    expect(screen.queryByLabelText(/bold/i)).not.toBeInTheDocument();
  });

  it("should show status bar by default", () => {
    render(<MarkdownEditor {...defaultProps} />);
    expect(screen.getByText(/words/i)).toBeInTheDocument();
  });

  it("should hide status bar when showStatusBar is false", () => {
    render(<MarkdownEditor {...defaultProps} showStatusBar={false} />);
    expect(screen.queryByText(/words/i)).not.toBeInTheDocument();
  });

  it("should display word count in status bar", () => {
    render(<MarkdownEditor value="one two three" onChange={jest.fn()} />);
    expect(screen.getByText("3")).toBeInTheDocument(); // 3 words
  });

  it("should display character count in status bar", () => {
    render(<MarkdownEditor value="hello" onChange={jest.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument(); // 5 characters
  });

  it("should display line count in status bar", () => {
    render(<MarkdownEditor value="line1\nline2\nline3" onChange={jest.fn()} />);
    expect(screen.getByText("3")).toBeInTheDocument(); // 3 lines
  });

  describe("View Modes", () => {
    it("should default to split view", () => {
      render(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
    });

    it("should show only editor in edit mode", () => {
      render(<MarkdownEditor {...defaultProps} defaultViewMode="edit" />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.queryByTestId("markdown-preview")).not.toBeInTheDocument();
    });

    it("should show only preview in preview mode", () => {
      render(<MarkdownEditor {...defaultProps} defaultViewMode="preview" />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
    });

    it("should switch view modes via toggle buttons", async () => {
      render(<MarkdownEditor {...defaultProps} />);

      // Find and click preview mode button
      const previewButton = screen.getByLabelText(/preview mode/i);
      await userEvent.click(previewButton);

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
    });
  });

  describe("Toolbar Actions", () => {
    it("should insert bold formatting", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const boldButton = screen.getByLabelText(/bold/i);
      await userEvent.click(boldButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("**"));
    });

    it("should insert italic formatting", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const italicButton = screen.getByLabelText(/italic/i);
      await userEvent.click(italicButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("*"));
    });

    it("should insert strikethrough formatting", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const strikeButton = screen.getByLabelText(/strikethrough/i);
      await userEvent.click(strikeButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("~~"));
    });

    it("should insert inline code", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const codeButton = screen.getByLabelText(/inline code/i);
      await userEvent.click(codeButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("`"));
    });

    it("should insert bullet list", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const listButton = screen.getByLabelText(/bullet list/i);
      await userEvent.click(listButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("- "));
    });

    it("should insert numbered list", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const listButton = screen.getByLabelText(/numbered list/i);
      await userEvent.click(listButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("1. "));
    });

    it("should insert task list", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const taskButton = screen.getByLabelText(/task list/i);
      await userEvent.click(taskButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("- [ ] "));
    });

    it("should insert quote", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const quoteButton = screen.getByLabelText(/quote/i);
      await userEvent.click(quoteButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("> "));
    });

    it("should insert table", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const tableButton = screen.getByLabelText(/table/i);
      await userEvent.click(tableButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("|"));
    });

    it("should insert horizontal rule", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const hrButton = screen.getByLabelText(/horizontal rule/i);
      await userEvent.click(hrButton);

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("---"));
    });
  });

  describe("Undo/Redo", () => {
    it("should disable undo when no history", () => {
      render(<MarkdownEditor {...defaultProps} />);
      const undoButton = screen.getByLabelText(/undo/i);
      expect(undoButton).toBeDisabled();
    });

    it("should disable redo when at latest state", () => {
      render(<MarkdownEditor {...defaultProps} />);
      const redoButton = screen.getByLabelText(/redo/i);
      expect(redoButton).toBeDisabled();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should handle Ctrl+B for bold", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.keyDown(textarea, { key: "b", ctrlKey: true });

      // Wait for the action to be processed
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should handle Ctrl+I for italic", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.keyDown(textarea, { key: "i", ctrlKey: true });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should handle Ctrl+K for link", async () => {
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.keyDown(textarea, { key: "k", ctrlKey: true });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should handle Ctrl+S for save", async () => {
      const onSave = jest.fn();
      render(<MarkdownEditor {...defaultProps} onSave={onSave} />);

      fireEvent.keyDown(window, { key: "s", ctrlKey: true });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith("# Test Content");
      });
    });
  });

  describe("File Operations", () => {
    it("should copy content to clipboard", async () => {
      render(<MarkdownEditor {...defaultProps} />);

      const copyButton = screen.getByLabelText(/copy/i);
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "# Test Content"
      );
    });

    it("should download content as file", async () => {
      render(<MarkdownEditor {...defaultProps} fileName="test.md" />);

      const downloadButton = screen.getByLabelText(/download/i);
      await userEvent.click(downloadButton);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe("Fullscreen Mode", () => {
    it("should toggle fullscreen mode", async () => {
      const { container } = render(<MarkdownEditor {...defaultProps} />);

      const fullscreenButton = screen.getByLabelText(/fullscreen/i);
      await userEvent.click(fullscreenButton);

      // Check for fullscreen class
      expect(container.firstChild).toHaveClass("fixed");
    });
  });

  describe("Read-only Mode", () => {
    it("should disable editing when readOnly is true", () => {
      render(<MarkdownEditor {...defaultProps} readOnly={true} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("readonly");
    });

    it("should disable toolbar buttons when readOnly is true", () => {
      render(<MarkdownEditor {...defaultProps} readOnly={true} />);

      const boldButton = screen.getByLabelText(/bold/i);
      expect(boldButton).toBeDisabled();
    });
  });

  describe("Placeholder", () => {
    it("should show placeholder when empty", () => {
      render(
        <MarkdownEditor
          value=""
          onChange={jest.fn()}
          placeholder="Start writing..."
        />
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("placeholder", "Start writing...");
    });
  });

  describe("Ref Methods", () => {
    it("should expose focus method via ref", () => {
      const ref = React.createRef<{
        focus: () => void;
        getValue: () => string;
        setValue: (value: string) => void;
        insertText: (text: string) => void;
        wrapSelection: (before: string, after: string) => void;
      }>();

      render(<MarkdownEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.focus).toBe("function");
    });

    it("should expose getValue method via ref", () => {
      const ref = React.createRef<{
        focus: () => void;
        getValue: () => string;
        setValue: (value: string) => void;
        insertText: (text: string) => void;
        wrapSelection: (before: string, after: string) => void;
      }>();

      render(<MarkdownEditor {...defaultProps} ref={ref} />);

      expect(ref.current?.getValue()).toBe("# Test Content");
    });
  });
});
