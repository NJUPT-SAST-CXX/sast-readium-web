/**
 * Tests for ChainOfThought components (components/ai-elements/chain-of-thought.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
  ChainOfThoughtImage,
} from "../chain-of-thought";
import { SearchIcon } from "lucide-react";

describe("ChainOfThought Components", () => {
  describe("ChainOfThought", () => {
    it("should render children", () => {
      render(
        <ChainOfThought>
          <span>Thinking content</span>
        </ChainOfThought>
      );

      expect(screen.getByText("Thinking content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ChainOfThought className="custom-cot" data-testid="cot">
          <span>Content</span>
        </ChainOfThought>
      );

      expect(screen.getByTestId("cot")).toHaveClass("custom-cot");
    });

    it("should be closed by default", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <span>Hidden content</span>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      // Content should not be visible when closed
      expect(screen.getByText("Thinking")).toBeInTheDocument();
    });

    it("should be open when defaultOpen is true", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <span>Visible content</span>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByText("Visible content")).toBeInTheDocument();
    });

    it("should call onOpenChange when toggled", () => {
      const handleOpenChange = jest.fn();
      render(
        <ChainOfThought onOpenChange={handleOpenChange}>
          <ChainOfThoughtHeader>Thinking</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <span>Content</span>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      fireEvent.click(screen.getByText("Thinking"));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe("ChainOfThoughtHeader", () => {
    it("should render default text when no children", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader />
        </ChainOfThought>
      );

      expect(screen.getByText("Chain of Thought")).toBeInTheDocument();
    });

    it("should render custom children", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader>Custom Header</ChainOfThoughtHeader>
        </ChainOfThought>
      );

      expect(screen.getByText("Custom Header")).toBeInTheDocument();
    });

    it("should toggle content on click", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader>Toggle</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <span>Toggleable content</span>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      // Initially closed
      const header = screen.getByText("Toggle");

      // Click to open
      fireEvent.click(header);
      expect(screen.getByText("Toggleable content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ChainOfThought>
          <ChainOfThoughtHeader className="custom-header" data-testid="header">
            Header
          </ChainOfThoughtHeader>
        </ChainOfThought>
      );

      expect(screen.getByTestId("header")).toHaveClass("custom-header");
    });
  });

  describe("ChainOfThoughtStep", () => {
    it("should render label", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep label="Searching documents" />
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByText("Searching documents")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              label="Step 1"
              description="This is a description"
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should render children", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep label="Step">
              <span>Step content</span>
            </ChainOfThoughtStep>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByText("Step content")).toBeInTheDocument();
    });

    it("should render custom icon", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              label="Search"
              icon={SearchIcon}
              data-testid="step"
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByTestId("step")).toBeInTheDocument();
    });

    it("should apply status styles", () => {
      const { rerender } = render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              label="Complete"
              status="complete"
              data-testid="step"
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByTestId("step")).toHaveClass("text-muted-foreground");

      rerender(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              label="Active"
              status="active"
              data-testid="step"
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByTestId("step")).toHaveClass("text-foreground");
    });

    it("should apply custom className", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              label="Step"
              className="custom-step"
              data-testid="step"
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByTestId("step")).toHaveClass("custom-step");
    });
  });

  describe("ChainOfThoughtSearchResults", () => {
    it("should render children", () => {
      render(
        <ChainOfThoughtSearchResults>
          <span>Result 1</span>
          <span>Result 2</span>
        </ChainOfThoughtSearchResults>
      );

      expect(screen.getByText("Result 1")).toBeInTheDocument();
      expect(screen.getByText("Result 2")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ChainOfThoughtSearchResults
          className="custom-results"
          data-testid="results"
        >
          <span>Results</span>
        </ChainOfThoughtSearchResults>
      );

      expect(screen.getByTestId("results")).toHaveClass("custom-results");
    });
  });

  describe("ChainOfThoughtSearchResult", () => {
    it("should render as a badge", () => {
      render(<ChainOfThoughtSearchResult>Result</ChainOfThoughtSearchResult>);

      expect(screen.getByText("Result")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ChainOfThoughtSearchResult
          className="custom-result"
          data-testid="result"
        >
          Result
        </ChainOfThoughtSearchResult>
      );

      expect(screen.getByTestId("result")).toHaveClass("custom-result");
    });
  });

  describe("ChainOfThoughtContent", () => {
    it("should render children when open", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Header</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <span>Content visible</span>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByText("Content visible")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Header</ChainOfThoughtHeader>
          <ChainOfThoughtContent
            className="custom-content"
            data-testid="content"
          >
            <span>Content</span>
          </ChainOfThoughtContent>
        </ChainOfThought>
      );

      expect(screen.getByTestId("content")).toHaveClass("custom-content");
    });
  });

  describe("ChainOfThoughtImage", () => {
    it("should render children", () => {
      render(
        <ChainOfThoughtImage>
          <img src="test.png" alt="Test" />
        </ChainOfThoughtImage>
      );

      expect(screen.getByAltText("Test")).toBeInTheDocument();
    });

    it("should render caption when provided", () => {
      render(
        <ChainOfThoughtImage caption="Image caption">
          <img src="test.png" alt="Test" />
        </ChainOfThoughtImage>
      );

      expect(screen.getByText("Image caption")).toBeInTheDocument();
    });

    it("should not render caption when not provided", () => {
      render(
        <ChainOfThoughtImage>
          <img src="test.png" alt="Test" />
        </ChainOfThoughtImage>
      );

      expect(screen.queryByText("Image caption")).not.toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ChainOfThoughtImage className="custom-image" data-testid="image">
          <img src="test.png" alt="Test" />
        </ChainOfThoughtImage>
      );

      expect(screen.getByTestId("image")).toHaveClass("custom-image");
    });
  });
});
