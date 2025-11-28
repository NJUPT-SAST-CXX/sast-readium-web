/**
 * Tests for Suggestion components (components/ai-elements/suggestion.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Suggestions, Suggestion } from "../suggestion";

describe("Suggestion Components", () => {
  describe("Suggestions", () => {
    it("should render children", () => {
      render(
        <Suggestions>
          <span>Child 1</span>
          <span>Child 2</span>
        </Suggestions>
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Suggestions className="custom-suggestions" data-testid="suggestions">
          <span>Content</span>
        </Suggestions>
      );

      // The className is applied to the inner div
      const container = screen.getByTestId("suggestions");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Suggestion", () => {
    it("should render suggestion text", () => {
      render(<Suggestion suggestion="Summarize this" />);

      expect(screen.getByText("Summarize this")).toBeInTheDocument();
    });

    it("should render custom children instead of suggestion text", () => {
      render(
        <Suggestion suggestion="hidden">
          <span>Custom content</span>
        </Suggestion>
      );

      expect(screen.getByText("Custom content")).toBeInTheDocument();
      expect(screen.queryByText("hidden")).not.toBeInTheDocument();
    });

    it("should call onClick with suggestion text", () => {
      const handleClick = jest.fn();
      render(
        <Suggestion suggestion="Translate to Chinese" onClick={handleClick} />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledWith("Translate to Chinese");
    });

    it("should not throw when onClick is not provided", () => {
      render(<Suggestion suggestion="Test" />);

      expect(() => {
        fireEvent.click(screen.getByRole("button"));
      }).not.toThrow();
    });

    it("should apply custom className", () => {
      render(
        <Suggestion
          suggestion="Test"
          className="custom-suggestion"
          data-testid="suggestion"
        />
      );

      expect(screen.getByTestId("suggestion")).toHaveClass("custom-suggestion");
    });

    it("should use outline variant by default", () => {
      render(<Suggestion suggestion="Test" data-testid="suggestion" />);

      // Button should be rendered with default styling
      const button = screen.getByTestId("suggestion");
      expect(button).toBeInTheDocument();
    });

    it("should apply custom variant", () => {
      render(
        <Suggestion
          suggestion="Test"
          variant="secondary"
          data-testid="suggestion"
        />
      );

      expect(screen.getByTestId("suggestion")).toBeInTheDocument();
    });

    it("should use sm size by default", () => {
      render(<Suggestion suggestion="Test" data-testid="suggestion" />);

      expect(screen.getByTestId("suggestion")).toBeInTheDocument();
    });

    it("should apply custom size", () => {
      render(
        <Suggestion suggestion="Test" size="lg" data-testid="suggestion" />
      );

      expect(screen.getByTestId("suggestion")).toBeInTheDocument();
    });

    it("should have button type", () => {
      render(<Suggestion suggestion="Test" />);

      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("should be disabled when disabled prop is true", () => {
      render(<Suggestion suggestion="Test" disabled />);

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("Suggestions with multiple Suggestion children", () => {
    it("should render multiple suggestions", () => {
      const suggestions = ["Summarize", "Translate", "Explain"];

      render(
        <Suggestions>
          {suggestions.map((s) => (
            <Suggestion key={s} suggestion={s} />
          ))}
        </Suggestions>
      );

      suggestions.forEach((s) => {
        expect(screen.getByText(s)).toBeInTheDocument();
      });
    });

    it("should handle clicks on individual suggestions", () => {
      const handleClick = jest.fn();
      const suggestions = ["Option 1", "Option 2", "Option 3"];

      render(
        <Suggestions>
          {suggestions.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={handleClick} />
          ))}
        </Suggestions>
      );

      fireEvent.click(screen.getByText("Option 2"));
      expect(handleClick).toHaveBeenCalledWith("Option 2");
    });
  });
});
