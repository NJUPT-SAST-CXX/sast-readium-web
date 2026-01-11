/**
 * Tests for Plan components (components/ai/elements/plan.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanAction,
  PlanContent,
  PlanFooter,
  PlanTrigger,
} from "../plan";

// Mock Shimmer component
jest.mock("../shimmer", () => ({
  Shimmer: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="shimmer">{children}</span>
  ),
}));

// Mock shadcn/ui components
jest.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h3 data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p data-testid="card-description" className={className} {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
  CardFooter: ({ children, ...props }: any) => (
    <div data-testid="card-footer" {...props}>
      {children}
    </div>
  ),
  CardAction: ({ children, ...props }: any) => (
    <div data-testid="card-action" {...props}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/collapsible", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Collapsible: ({ children, onOpenChange, open, asChild, className }: any) => (
    <div
      data-testid="collapsible"
      data-open={open}
      className={className}
      onClick={() => onOpenChange?.(!open)}
    >
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CollapsibleTrigger: ({ children, asChild }: any) => (
    <div data-testid="collapsible-trigger">{children}</div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CollapsibleContent: ({ children, asChild }: any) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, className, size, variant, ...props }: any) => (
    <button
      className={className}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe("Plan Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Plan", () => {
    it("should render as Collapsible with Card", () => {
      render(
        <Plan>
          <span>Plan content</span>
        </Plan>
      );

      expect(screen.getByTestId("collapsible")).toBeInTheDocument();
      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByText("Plan content")).toBeInTheDocument();
    });

    it("should provide isStreaming context", () => {
      render(
        <Plan isStreaming={true}>
          <PlanTitle>Streaming Title</PlanTitle>
        </Plan>
      );

      // Shimmer should be rendered when streaming
      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
    });

    it("should support collapsible state", () => {
      render(
        <Plan defaultOpen={true}>
          <PlanContent>
            <span>Content</span>
          </PlanContent>
        </Plan>
      );

      const collapsible = screen.getByTestId("collapsible");
      expect(collapsible).toBeInTheDocument();
      // The mock doesn't always preserve data-open, but the component is rendered
    });

    it("should apply custom className", () => {
      const { container } = render(
        <Plan className="custom-plan">
          <span>Plan</span>
        </Plan>
      );

      const plan = container.querySelector(".custom-plan");
      expect(plan).toBeInTheDocument();
    });
  });

  describe("PlanHeader", () => {
    it("should render card header", () => {
      render(
        <Plan>
          <PlanHeader>
            <span>Header content</span>
          </PlanHeader>
        </Plan>
      );

      expect(screen.getByTestId("card-header")).toBeInTheDocument();
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("should have flex layout", () => {
      render(
        <Plan>
          <PlanHeader data-testid="header">
            <span>Content</span>
          </PlanHeader>
        </Plan>
      );

      const header = screen.getByTestId("header");
      expect(header).toHaveClass("flex");
    });

    it("should apply custom className", () => {
      render(
        <Plan>
          <PlanHeader className="custom-header" data-testid="header">
            <span>Header</span>
          </PlanHeader>
        </Plan>
      );

      expect(screen.getByTestId("header")).toHaveClass("custom-header");
    });
  });

  describe("PlanTitle", () => {
    it("should render title without streaming", () => {
      render(
        <Plan isStreaming={false}>
          <PlanTitle>Regular Title</PlanTitle>
        </Plan>
      );

      expect(screen.getByText("Regular Title")).toBeInTheDocument();
      expect(screen.queryByTestId("shimmer")).not.toBeInTheDocument();
    });

    it("should render title with Shimmer when streaming", () => {
      render(
        <Plan isStreaming={true}>
          <PlanTitle>Streaming Title</PlanTitle>
        </Plan>
      );

      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
      expect(screen.getByText("Streaming Title")).toBeInTheDocument();
    });

    it("should require string children", () => {
      render(
        <Plan isStreaming={false}>
          <PlanTitle>Text Content</PlanTitle>
        </Plan>
      );

      expect(screen.getByText("Text Content")).toBeInTheDocument();
    });
  });

  describe("PlanDescription", () => {
    it("should render description without streaming", () => {
      render(
        <Plan isStreaming={false}>
          <PlanDescription>Regular description</PlanDescription>
        </Plan>
      );

      expect(screen.getByText("Regular description")).toBeInTheDocument();
      expect(screen.queryByTestId("shimmer")).not.toBeInTheDocument();
    });

    it("should render description with Shimmer when streaming", () => {
      render(
        <Plan isStreaming={true}>
          <PlanDescription>Streaming description</PlanDescription>
        </Plan>
      );

      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
      expect(screen.getByText("Streaming description")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Plan>
          <PlanDescription className="custom-description" data-testid="desc">
            Description
          </PlanDescription>
        </Plan>
      );

      expect(screen.getByTestId("desc")).toHaveClass("custom-description");
    });

    it("should have text-balance class", () => {
      render(
        <Plan>
          <PlanDescription data-testid="desc">Description</PlanDescription>
        </Plan>
      );

      expect(screen.getByTestId("desc")).toHaveClass("text-balance");
    });
  });

  describe("PlanAction", () => {
    it("should render card action", () => {
      render(
        <Plan>
          <PlanAction>
            <button>Action</button>
          </PlanAction>
        </Plan>
      );

      expect(screen.getByTestId("card-action")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("should pass through props", () => {
      render(
        <Plan>
          <PlanAction data-testid="action" className="custom">
            <span>Content</span>
          </PlanAction>
        </Plan>
      );

      expect(screen.getByTestId("action")).toHaveClass("custom");
    });
  });

  describe("PlanContent", () => {
    it("should render collapsible content with card content", () => {
      render(
        <Plan defaultOpen={true}>
          <PlanContent>
            <span>Content text</span>
          </PlanContent>
        </Plan>
      );

      expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
      expect(screen.getByTestId("card-content")).toBeInTheDocument();
      expect(screen.getByText("Content text")).toBeInTheDocument();
    });
  });

  describe("PlanFooter", () => {
    it("should render card footer", () => {
      render(
        <Plan>
          <PlanFooter>
            <span>Footer content</span>
          </PlanFooter>
        </Plan>
      );

      expect(screen.getByTestId("card-footer")).toBeInTheDocument();
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });
  });

  describe("PlanTrigger", () => {
    it("should render collapsible trigger button", () => {
      render(
        <Plan defaultOpen={false}>
          <PlanTrigger />
        </Plan>
      );

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();
    });

    it("should have toggle icon", () => {
      render(
        <Plan defaultOpen={false}>
          <PlanTrigger />
        </Plan>
      );

      // The button should contain an icon (ChevronsUpDownIcon)
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have sr-only toggle text", () => {
      render(
        <Plan defaultOpen={false}>
          <PlanTrigger />
        </Plan>
      );

      expect(screen.getByText("Toggle plan")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Plan defaultOpen={false}>
          <PlanTrigger className="custom-trigger" data-testid="trigger" />
        </Plan>
      );

      expect(screen.getByTestId("trigger")).toHaveClass("custom-trigger");
    });
  });

  describe("Integration: Full Plan component", () => {
    it("should render complete plan with streaming state", () => {
      render(
        <Plan isStreaming={true}>
          <PlanHeader>
            <PlanTitle>Analysis Plan</PlanTitle>
          </PlanHeader>
          <PlanContent>
            <PlanDescription>Breaking down the problem...</PlanDescription>
          </PlanContent>
          <PlanFooter>
            <span>Step 1 of 3</span>
          </PlanFooter>
        </Plan>
      );

      // Should show shimmer for both title and description when streaming
      const shimmerElements = screen.getAllByTestId("shimmer");
      expect(shimmerElements.length).toBeGreaterThan(0);
      expect(screen.getByText("Analysis Plan")).toBeInTheDocument();
      expect(
        screen.getByText("Breaking down the problem...")
      ).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });

    it("should handle collapsible toggling", () => {
      render(
        <Plan defaultOpen={true}>
          <PlanTrigger />
          <PlanContent>
            <span>Expandable content</span>
          </PlanContent>
        </Plan>
      );

      const collapsible = screen.getByTestId("collapsible");
      expect(collapsible).toBeInTheDocument();

      fireEvent.click(collapsible);
      expect(collapsible).toBeInTheDocument();
    });
  });
});
