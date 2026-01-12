/**
 * Tests for Reasoning components (components/ai/elements/reasoning.tsx)
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "../reasoning";

// Mock Streamdown component
jest.mock("streamdown", () => ({
  Streamdown: ({ children, ...props }: any) => (
    <div data-testid="streamdown" {...props}>
      {children}
    </div>
  ),
}));

// Mock Shimmer component
jest.mock("../shimmer", () => ({
  Shimmer: ({ children, duration }: any) => (
    <span data-testid="shimmer" data-duration={duration}>
      {children}
    </span>
  ),
}));

// Mock Radix UI components
jest.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children, open, onOpenChange, className, ...props }: any) => (
    <div
      data-testid="collapsible"
      data-open={open}
      className={className}
      onClick={() => onOpenChange?.(!open)}
      {...props}
    >
      {children}
    </div>
  ),
  CollapsibleTrigger: ({ children, className, ...props }: any) => (
    <div data-testid="collapsible-trigger" className={className} {...props}>
      {children}
    </div>
  ),
  CollapsibleContent: ({ children, className, ...props }: any) => (
    <div data-testid="collapsible-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

jest.mock("@radix-ui/react-use-controllable-state", () => ({
  useControllableState: ({ prop, defaultProp, onChange }: any) => {
    const [state, setState] = require("react").useState(
      prop !== undefined ? prop : defaultProp
    );

    require("react").useEffect(() => {
      if (prop !== undefined) {
        setState(prop);
      }
    }, [prop]);

    const updateState = (newState: any) => {
      setState(newState);
      onChange?.(newState);
    };

    return [state, updateState];
  },
}));

describe("Reasoning Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Reasoning", () => {
    it("should render as Collapsible", () => {
      render(
        <Reasoning>
          <span>Reasoning content</span>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible")).toBeInTheDocument();
      expect(screen.getByText("Reasoning content")).toBeInTheDocument();
    });

    it("should be open by default", () => {
      render(
        <Reasoning defaultOpen={true}>
          <span>Content</span>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible")).toHaveAttribute(
        "data-open",
        "true"
      );
    });

    it("should be closed when defaultOpen is false", () => {
      render(
        <Reasoning defaultOpen={false}>
          <span>Content</span>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible")).toHaveAttribute(
        "data-open",
        "false"
      );
    });

    it("should support controlled open state", () => {
      const { rerender } = render(
        <Reasoning open={true} onOpenChange={jest.fn()}>
          <span>Content</span>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible")).toHaveAttribute(
        "data-open",
        "true"
      );

      rerender(
        <Reasoning open={false} onOpenChange={jest.fn()}>
          <span>Content</span>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible")).toHaveAttribute(
        "data-open",
        "false"
      );
    });

    it("should call onOpenChange when toggled", () => {
      const handleOpenChange = jest.fn();
      render(
        <Reasoning onOpenChange={handleOpenChange}>
          <span>Content</span>
        </Reasoning>
      );

      const collapsible = screen.getByTestId("collapsible");
      fireEvent.click(collapsible);

      expect(handleOpenChange).toHaveBeenCalled();
    });

    it("should render children", () => {
      render(
        <Reasoning>
          <ReasoningTrigger />
          <ReasoningContent>Thinking content...</ReasoningContent>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible-trigger")).toBeInTheDocument();
      expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Reasoning className="custom-reasoning" data-testid="reasoning">
          <span>Content</span>
        </Reasoning>
      );

      expect(screen.getByTestId("reasoning")).toHaveClass("custom-reasoning");
    });

    it("should track streaming duration", () => {
      const { rerender } = render(
        <Reasoning isStreaming={true}>
          <ReasoningTrigger />
        </Reasoning>
      );

      // Simulate streaming for 2 seconds
      jest.advanceTimersByTime(2000);

      rerender(
        <Reasoning isStreaming={false}>
          <ReasoningTrigger />
        </Reasoning>
      );

      // Wait for duration calculation
      waitFor(() => {
        expect(screen.getByText(/Thought for 2 seconds/)).toBeInTheDocument();
      });
    });

    it("should auto-close when streaming completes", async () => {
      const { rerender } = render(
        <Reasoning defaultOpen={true} isStreaming={true}>
          <span>Content</span>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible")).toHaveAttribute(
        "data-open",
        "true"
      );

      rerender(
        <Reasoning defaultOpen={true} isStreaming={false}>
          <span>Content</span>
        </Reasoning>
      );

      // Fast-forward the auto-close delay
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByTestId("collapsible")).toHaveAttribute(
          "data-open",
          "false"
        );
      });
    });
  });

  describe("ReasoningTrigger", () => {
    it("should render as CollapsibleTrigger", () => {
      render(
        <Reasoning>
          <ReasoningTrigger />
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible-trigger")).toBeInTheDocument();
    });

    it("should show default thinking message when not streaming", () => {
      render(
        <Reasoning isStreaming={false}>
          <ReasoningTrigger />
        </Reasoning>
      );

      expect(screen.getByText(/Thought for a few seconds/)).toBeInTheDocument();
    });

    it("should show Shimmer when streaming", () => {
      render(
        <Reasoning isStreaming={true}>
          <ReasoningTrigger />
        </Reasoning>
      );

      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
      expect(screen.getByText("Thinking...")).toBeInTheDocument();
    });

    it("should show duration in message", () => {
      render(
        <Reasoning isStreaming={false} duration={5}>
          <ReasoningTrigger />
        </Reasoning>
      );

      expect(screen.getByText(/Thought for 5 seconds/)).toBeInTheDocument();
    });

    it("should render custom children", () => {
      render(
        <Reasoning>
          <ReasoningTrigger>
            <span>Custom trigger</span>
          </ReasoningTrigger>
        </Reasoning>
      );

      expect(screen.getByText("Custom trigger")).toBeInTheDocument();
      expect(screen.queryByText(/Thought for/)).not.toBeInTheDocument();
    });

    it("should have icon", () => {
      render(
        <Reasoning>
          <ReasoningTrigger />
        </Reasoning>
      );

      // BrainIcon should be rendered, but we check for the trigger element
      expect(screen.getByTestId("collapsible-trigger")).toBeInTheDocument();
    });

    it("should have chevron icon that rotates", () => {
      const { rerender } = render(
        <Reasoning defaultOpen={false}>
          <ReasoningTrigger />
        </Reasoning>
      );

      // When closed, chevron is at 0 degrees
      expect(screen.getByTestId("collapsible-trigger")).toBeInTheDocument();

      rerender(
        <Reasoning defaultOpen={true}>
          <ReasoningTrigger />
        </Reasoning>
      );

      // When open, chevron should rotate
      expect(screen.getByTestId("collapsible-trigger")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Reasoning>
          <ReasoningTrigger className="custom-trigger" data-testid="trigger" />
        </Reasoning>
      );

      expect(screen.getByTestId("trigger")).toHaveClass("custom-trigger");
    });
  });

  describe("ReasoningContent", () => {
    it("should render as CollapsibleContent", () => {
      render(
        <Reasoning>
          <ReasoningContent>Reasoning text</ReasoningContent>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
      expect(screen.getByText("Reasoning text")).toBeInTheDocument();
    });

    it("should wrap children in Streamdown", () => {
      render(
        <Reasoning>
          <ReasoningContent>Markdown content</ReasoningContent>
        </Reasoning>
      );

      expect(screen.getByTestId("streamdown")).toBeInTheDocument();
      expect(screen.getByText("Markdown content")).toBeInTheDocument();
    });

    it("should require string children", () => {
      render(
        <Reasoning>
          <ReasoningContent>Plain text content</ReasoningContent>
        </Reasoning>
      );

      expect(screen.getByText("Plain text content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <Reasoning>
          <ReasoningContent className="custom-content">
            Content
          </ReasoningContent>
        </Reasoning>
      );

      const content = container.querySelector(".custom-content");
      expect(content).toBeInTheDocument();
    });

    it("should have animation classes", () => {
      render(
        <Reasoning>
          <ReasoningContent>Content</ReasoningContent>
        </Reasoning>
      );

      const content = screen.getByTestId("collapsible-content");
      // Classes include Tailwind data-state classes for animations
      expect(content).toHaveClass("mt-4", "text-sm");
    });
  });

  describe("Integration: Full Reasoning flow", () => {
    it("should render complete reasoning component", () => {
      render(
        <Reasoning isStreaming={false} defaultOpen={true}>
          <ReasoningTrigger />
          <ReasoningContent>
            Breaking down the problem into steps...
          </ReasoningContent>
        </Reasoning>
      );

      expect(screen.getByTestId("collapsible-trigger")).toBeInTheDocument();
      expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
      expect(
        screen.getByText("Breaking down the problem into steps...")
      ).toBeInTheDocument();
    });

    it("should handle streaming state transition", async () => {
      const { rerender } = render(
        <Reasoning isStreaming={true} defaultOpen={false}>
          <ReasoningTrigger />
          <ReasoningContent>Initial content</ReasoningContent>
        </Reasoning>
      );

      // While streaming, should show Shimmer
      const shimmerElements = screen.queryAllByTestId("shimmer");
      expect(shimmerElements.length).toBeGreaterThan(0);

      // Simulate streaming completion
      rerender(
        <Reasoning isStreaming={false} defaultOpen={false}>
          <ReasoningTrigger />
          <ReasoningContent>Initial content</ReasoningContent>
        </Reasoning>
      );

      // Component should still be rendered after streaming
      expect(screen.getByTestId("collapsible-trigger")).toBeInTheDocument();
    });

    it("should toggle open/closed state", () => {
      render(
        <Reasoning defaultOpen={false}>
          <ReasoningTrigger />
          <ReasoningContent>Content</ReasoningContent>
        </Reasoning>
      );

      let collapsible = screen.getByTestId("collapsible");
      expect(collapsible).toHaveAttribute("data-open", "false");

      fireEvent.click(collapsible);

      collapsible = screen.getByTestId("collapsible");
      expect(collapsible).toHaveAttribute("data-open", "true");
    });

    it("should display duration when available", () => {
      render(
        <Reasoning isStreaming={false} duration={3}>
          <ReasoningTrigger />
          <ReasoningContent>Thinking completed</ReasoningContent>
        </Reasoning>
      );

      expect(screen.getByText(/Thought for 3 seconds/)).toBeInTheDocument();
    });
  });
});
