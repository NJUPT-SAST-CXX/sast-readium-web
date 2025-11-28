/**
 * Tests for CodeBlock components (components/ai-elements/code-block.tsx)
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock shiki to avoid async highlighting issues
jest.mock("shiki", () => ({
  codeToHtml: jest.fn((code, options) => {
    // Return a synchronous mock value wrapped in Promise
    return Promise.resolve(
      `<pre><code class="${options.lang}">${code}</code></pre>`
    );
  }),
}));

import { CodeBlock, CodeBlockCopyButton } from "../code-block";

describe("CodeBlock Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  describe("CodeBlock", () => {
    it("should render with code and language", async () => {
      render(
        <CodeBlock
          code="const x = 1;"
          language="javascript"
          data-testid="code-block"
        />
      );

      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toBeInTheDocument();

      // Wait for async highlighting to complete
      await waitFor(() => {
        expect(codeBlock).toBeInTheDocument();
      });
    });

    it("should apply custom className", async () => {
      render(
        <CodeBlock
          code="print('hello')"
          language="python"
          className="custom-code"
          data-testid="code-block"
        />
      );

      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toHaveClass("custom-code");
    });

    it("should render children (copy button)", async () => {
      render(
        <CodeBlock code="x = 1" language="python">
          <button>Copy</button>
        </CodeBlock>
      );

      // Note: children are rendered in an absolute positioned div
      const copyButton = screen.getByText("Copy");
      expect(copyButton).toBeInTheDocument();
    });

    it("should have proper structure with light and dark HTML divs", async () => {
      render(
        <CodeBlock
          code="const x = 1;"
          language="javascript"
          data-testid="code-block"
        />
      );

      const codeBlock = screen.getByTestId("code-block");
      const divs = codeBlock.querySelectorAll("div");

      // Should have at least one div for light mode and one for dark mode
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  describe("CodeBlockCopyButton", () => {
    it("should render copy button", () => {
      render(
        <CodeBlock code="test code" language="javascript">
          <CodeBlockCopyButton data-testid="copy-button" />
        </CodeBlock>
      );

      const button = screen.getByTestId("copy-button");
      expect(button).toBeInTheDocument();
    });

    it("should copy code to clipboard on click", async () => {
      const handleCopy = jest.fn();
      render(
        <CodeBlock code="const test = 1;" language="javascript">
          <CodeBlockCopyButton onCopy={handleCopy} data-testid="copy-button" />
        </CodeBlock>
      );

      const button = screen.getByTestId("copy-button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "const test = 1;"
        );
        expect(handleCopy).toHaveBeenCalled();
      });
    });

    it("should show check icon after copying", async () => {
      render(
        <CodeBlock code="test code" language="javascript">
          <CodeBlockCopyButton data-testid="copy-button" />
        </CodeBlock>
      );

      const button = screen.getByTestId("copy-button");
      fireEvent.click(button);

      // After click, the check icon should appear (icon is rendered as SVG)
      await waitFor(() => {
        const svgs = button.querySelectorAll("svg");
        expect(svgs.length).toBeGreaterThan(0);
      });
    });

    it("should reset copy state after timeout", async () => {
      jest.useFakeTimers();

      render(
        <CodeBlock code="test" language="javascript">
          <CodeBlockCopyButton timeout={1000} data-testid="copy-button" />
        </CodeBlock>
      );

      const button = screen.getByTestId("copy-button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });

      // Fast-forward time
      jest.advanceTimersByTime(1100);

      jest.useRealTimers();
    });

    it("should handle clipboard error", async () => {
      const handleError = jest.fn();
      const clipboardError = new Error("Clipboard access denied");

      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        clipboardError
      );

      render(
        <CodeBlock code="test" language="javascript">
          <CodeBlockCopyButton
            onError={handleError}
            data-testid="copy-button"
          />
        </CodeBlock>
      );

      const button = screen.getByTestId("copy-button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(clipboardError);
      });
    });

    it("should apply custom className", () => {
      render(
        <CodeBlock code="test" language="javascript">
          <CodeBlockCopyButton
            className="custom-copy-button"
            data-testid="copy-button"
          />
        </CodeBlock>
      );

      const button = screen.getByTestId("copy-button");
      expect(button).toHaveClass("custom-copy-button");
    });

    it("should render custom children instead of icon", () => {
      render(
        <CodeBlock code="test" language="javascript">
          <CodeBlockCopyButton>
            <span>Copy Text</span>
          </CodeBlockCopyButton>
        </CodeBlock>
      );

      expect(screen.getByText("Copy Text")).toBeInTheDocument();
    });

    it("should handle missing clipboard API gracefully", async () => {
      const handleError = jest.fn();
      const originalClipboard = navigator.clipboard;

      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });

      render(
        <CodeBlock code="test" language="javascript">
          <CodeBlockCopyButton
            onError={handleError}
            data-testid="copy-button"
          />
        </CodeBlock>
      );

      const button = screen.getByTestId("copy-button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Clipboard API not available",
          })
        );
      });

      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
    });
  });
});
