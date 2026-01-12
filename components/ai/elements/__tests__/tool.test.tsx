/**
 * Tests for Tool components (components/ai/elements/tool.tsx)
 */

import { render, screen } from "@testing-library/react";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "../tool";

// Mock the CodeBlock component
jest.mock("../code-block", () => ({
  CodeBlock: ({ code, language }: { code: string; language: string }) => (
    <pre data-testid="code-block" data-language={language}>
      {code}
    </pre>
  ),
}));

describe("Tool Components", () => {
  describe("Tool", () => {
    it("should render children", () => {
      render(
        <Tool>
          <span>Tool content</span>
        </Tool>
      );

      expect(screen.getByText("Tool content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Tool className="custom-tool" data-testid="tool">
          <span>Content</span>
        </Tool>
      );

      expect(screen.getByTestId("tool")).toHaveClass("custom-tool");
    });
  });

  describe("ToolHeader", () => {
    it("should render with title", () => {
      render(
        <Tool>
          <ToolHeader
            title="Search Tool"
            type="tool-call"
            state="output-available"
          />
        </Tool>
      );

      expect(screen.getByText("Search Tool")).toBeInTheDocument();
    });

    it("should derive title from type when not provided", () => {
      render(
        <Tool>
          <ToolHeader type="tool-call" state="output-available" />
        </Tool>
      );

      // Should show "call" (derived from "tool-call")
      expect(screen.getByText("call")).toBeInTheDocument();
    });

    it("should show Pending badge for input-streaming state", () => {
      render(
        <Tool>
          <ToolHeader title="Test" type="tool-call" state="input-streaming" />
        </Tool>
      );

      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("should show Running badge for input-available state", () => {
      render(
        <Tool>
          <ToolHeader title="Test" type="tool-call" state="input-available" />
        </Tool>
      );

      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    it("should show Completed badge for output-available state", () => {
      render(
        <Tool>
          <ToolHeader title="Test" type="tool-call" state="output-available" />
        </Tool>
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should show Error badge for output-error state", () => {
      render(
        <Tool>
          <ToolHeader title="Test" type="tool-call" state="output-error" />
        </Tool>
      );

      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("should show Awaiting Approval badge for approval-requested state", () => {
      render(
        <Tool>
          <ToolHeader
            title="Test"
            type="tool-call"
            state="approval-requested"
          />
        </Tool>
      );

      expect(screen.getByText("Awaiting Approval")).toBeInTheDocument();
    });

    it("should show Responded badge for approval-responded state", () => {
      render(
        <Tool>
          <ToolHeader
            title="Test"
            type="tool-call"
            state="approval-responded"
          />
        </Tool>
      );

      expect(screen.getByText("Responded")).toBeInTheDocument();
    });

    it("should show Denied badge for output-denied state", () => {
      render(
        <Tool>
          <ToolHeader title="Test" type="tool-call" state="output-denied" />
        </Tool>
      );

      expect(screen.getByText("Denied")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Tool>
          <ToolHeader
            title="Test"
            type="tool-call"
            state="output-available"
            className="custom-header"
            data-testid="header"
          />
        </Tool>
      );

      expect(screen.getByTestId("header")).toHaveClass("custom-header");
    });
  });

  describe("ToolContent", () => {
    it("should render children", () => {
      render(
        <Tool defaultOpen>
          <ToolContent>
            <span>Content inside</span>
          </ToolContent>
        </Tool>
      );

      expect(screen.getByText("Content inside")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Tool defaultOpen>
          <ToolContent className="custom-content" data-testid="content">
            <span>Content</span>
          </ToolContent>
        </Tool>
      );

      expect(screen.getByTestId("content")).toHaveClass("custom-content");
    });
  });

  describe("ToolInput", () => {
    it("should render Parameters heading", () => {
      render(<ToolInput input={{ query: "test" }} />);

      expect(screen.getByText("Parameters")).toBeInTheDocument();
    });

    it("should render input as JSON in CodeBlock", () => {
      const input = { query: "search term", limit: 10 };
      render(<ToolInput input={input} />);

      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock).toHaveAttribute("data-language", "json");
      expect(codeBlock.textContent).toContain("search term");
    });

    it("should apply custom className", () => {
      render(
        <ToolInput
          input={{ test: true }}
          className="custom-input"
          data-testid="input"
        />
      );

      expect(screen.getByTestId("input")).toHaveClass("custom-input");
    });
  });

  describe("ToolOutput", () => {
    it("should return null when no output or errorText", () => {
      const { container } = render(
        <ToolOutput output={undefined} errorText={undefined} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render Result heading for successful output", () => {
      render(<ToolOutput output={{ data: "result" }} errorText={undefined} />);

      expect(screen.getByText("Result")).toBeInTheDocument();
    });

    it("should render Error heading when errorText is present", () => {
      render(
        <ToolOutput output={undefined} errorText="Something went wrong" />
      );

      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should render object output as JSON in CodeBlock", () => {
      const output = { result: "success", count: 5 };
      render(<ToolOutput output={output} errorText={undefined} />);

      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock.textContent).toContain("success");
    });

    it("should render string output in CodeBlock", () => {
      render(<ToolOutput output="Plain text result" errorText={undefined} />);

      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock.textContent).toContain("Plain text result");
    });

    it("should apply custom className", () => {
      render(
        <ToolOutput
          output={{ test: true }}
          errorText={undefined}
          className="custom-output"
          data-testid="output"
        />
      );

      expect(screen.getByTestId("output")).toHaveClass("custom-output");
    });
  });
});
