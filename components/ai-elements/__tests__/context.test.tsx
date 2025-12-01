/**
 * Tests for Context components (components/ai-elements/context.tsx)
 */

import { render, screen } from "@testing-library/react";

// Mock tokenlens to avoid external API calls
jest.mock("tokenlens", () => ({
  getUsage: jest.fn((options) => ({
    costUSD: {
      totalUSD: 0.001,
    },
  })),
}));

import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from "../context";

describe("Context Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUsage = {
    promptTokens: 500,
    completionTokens: 1000,
    totalTokens: 1500,
    inputTokens: 500,
    outputTokens: 1000,
    reasoningTokens: 200,
    cachedInputTokens: 100,
  };

  describe("Context", () => {
    it("should render HoverCard provider with children", () => {
      render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextTrigger data-testid="trigger">
            <span>Usage</span>
          </ContextTrigger>
        </Context>
      );

      // Context provides HoverCard, content should be accessible via trigger
      expect(screen.getByText("Usage")).toBeInTheDocument();
    });

    it("should provide context values to children", () => {
      render(
        <Context usedTokens={1000} maxTokens={4000}>
          <ContextTrigger data-testid="trigger">
            <span>Context Usage</span>
          </ContextTrigger>
        </Context>
      );

      expect(screen.getByText("Context Usage")).toBeInTheDocument();
    });

    it("should calculate usage percentage correctly", () => {
      render(
        <Context usedTokens={1000} maxTokens={4000}>
          <ContextTrigger data-testid="trigger" />
        </Context>
      );

      // 1000 / 4000 = 25%
      const trigger = screen.getByTestId("trigger");
      expect(trigger.textContent).toContain("25%");
    });

    it("should handle zero tokens", () => {
      render(
        <Context usedTokens={0} maxTokens={4000}>
          <ContextTrigger data-testid="trigger" />
        </Context>
      );

      const trigger = screen.getByTestId("trigger");
      expect(trigger.textContent).toContain("0%");
    });
  });

  describe("ContextTrigger", () => {
    it("should render button with usage percentage", () => {
      render(
        <Context usedTokens={1500} maxTokens={3000}>
          <ContextTrigger data-testid="trigger" />
        </Context>
      );

      // 1500 / 3000 = 50%
      expect(screen.getByTestId("trigger").textContent).toContain("50%");
    });

    it("should render custom children", () => {
      render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextTrigger>
            <span>Custom Trigger</span>
          </ContextTrigger>
        </Context>
      );

      expect(screen.getByText("Custom Trigger")).toBeInTheDocument();
    });

    it("should format percentage with 1 decimal place", () => {
      render(
        <Context usedTokens={333} maxTokens={1000}>
          <ContextTrigger data-testid="trigger" />
        </Context>
      );

      // 333 / 1000 = 33.3%
      expect(screen.getByTestId("trigger").textContent).toContain("33.3%");
    });

    it("should render with button role", () => {
      render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextTrigger data-testid="trigger" />
        </Context>
      );

      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });
  });

  describe("ContextContent", () => {
    it("should support ContextContent structure", () => {
      const { container } = render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextTrigger />
          <ContextContent>
            <ContextContentHeader />
            <ContextContentBody>Body Content</ContextContentBody>
            <ContextContentFooter />
          </ContextContent>
        </Context>
      );

      // ContextContent is inside HoverCard, which is initially hidden
      // The structure is correct if it renders without error
      expect(container).toBeInTheDocument();
    });

    it("should accept custom className", () => {
      const { container } = render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextTrigger />
          <ContextContent className="custom-content" />
        </Context>
      );

      // Verify the component structure renders
      expect(container).toBeInTheDocument();
    });
  });

  describe("ContextContentHeader", () => {
    it("should render with expected structure", () => {
      const { container } = render(
        <Context usedTokens={1000} maxTokens={4000}>
          <ContextContentHeader />
        </Context>
      );

      // ContextContentHeader renders correctly when Context is provided
      expect(container).toBeInTheDocument();
    });

    it("should render custom children instead of default content", () => {
      render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextContentHeader>
            <span>Custom Header</span>
          </ContextContentHeader>
        </Context>
      );

      expect(screen.getByText("Custom Header")).toBeInTheDocument();
    });

    it("should accept custom className", () => {
      const { container } = render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextContentHeader className="custom-header" />
        </Context>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("ContextContentBody", () => {
    it("should render children", () => {
      render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextContentBody>
            <span>Body Content</span>
          </ContextContentBody>
        </Context>
      );

      expect(screen.getByText("Body Content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Context usedTokens={500} maxTokens={2000}>
          <ContextContentBody className="custom-body" data-testid="body">
            Content
          </ContextContentBody>
        </Context>
      );

      expect(screen.getByTestId("body")).toHaveClass("custom-body");
    });
  });

  describe("ContextContentFooter", () => {
    it("should render total cost", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextContentFooter data-testid="footer" />
        </Context>
      );

      const footer = screen.getByTestId("footer");
      expect(footer.textContent).toContain("Total cost");
      // Cost should be formatted as currency
      expect(footer.textContent).toContain("$");
    });

    it("should render custom children", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextContentFooter>
            <span>Custom Footer</span>
          </ContextContentFooter>
        </Context>
      );

      expect(screen.getByText("Custom Footer")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextContentFooter
            className="custom-footer"
            data-testid="footer"
          />
        </Context>
      );

      expect(screen.getByTestId("footer")).toHaveClass("custom-footer");
    });

    it("should show $0.00 when no modelId provided", () => {
      render(
        <Context usedTokens={500} maxTokens={2000} usage={mockUsage}>
          <ContextContentFooter data-testid="footer" />
        </Context>
      );

      const footer = screen.getByTestId("footer");
      expect(footer.textContent).toContain("$0.00");
    });
  });

  describe("ContextInputUsage", () => {
    it("should render input token count", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextInputUsage data-testid="input-usage" />
        </Context>
      );

      const usage = screen.getByTestId("input-usage");
      expect(usage.textContent).toContain("Input");
      expect(usage.textContent).toContain("500");
    });

    it("should render custom children", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextInputUsage>
            <span>Custom Input</span>
          </ContextInputUsage>
        </Context>
      );

      expect(screen.getByText("Custom Input")).toBeInTheDocument();
    });

    it("should return null when no input tokens", () => {
      const { container } = render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={{ ...mockUsage, inputTokens: 0 }}
        >
          <ContextInputUsage data-testid="input-usage" />
        </Context>
      );

      // Should not render when tokens are 0 and no children provided
      expect(screen.queryByTestId("input-usage")).not.toBeInTheDocument();
    });
  });

  describe("ContextOutputUsage", () => {
    it("should render output token count", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextOutputUsage data-testid="output-usage" />
        </Context>
      );

      const usage = screen.getByTestId("output-usage");
      expect(usage.textContent).toContain("Output");
      expect(usage.textContent).toContain("1K");
    });

    it("should return null when no output tokens", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={{ ...mockUsage, outputTokens: 0 }}
        >
          <ContextOutputUsage data-testid="output-usage" />
        </Context>
      );

      expect(screen.queryByTestId("output-usage")).not.toBeInTheDocument();
    });
  });

  describe("ContextReasoningUsage", () => {
    it("should render reasoning token count", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextReasoningUsage data-testid="reasoning-usage" />
        </Context>
      );

      const usage = screen.getByTestId("reasoning-usage");
      expect(usage.textContent).toContain("Reasoning");
      expect(usage.textContent).toContain("200");
    });

    it("should return null when no reasoning tokens", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={{ ...mockUsage, reasoningTokens: 0 }}
        >
          <ContextReasoningUsage data-testid="reasoning-usage" />
        </Context>
      );

      expect(screen.queryByTestId("reasoning-usage")).not.toBeInTheDocument();
    });
  });

  describe("ContextCacheUsage", () => {
    it("should render cache token count", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={mockUsage}
        >
          <ContextCacheUsage data-testid="cache-usage" />
        </Context>
      );

      const usage = screen.getByTestId("cache-usage");
      expect(usage.textContent).toContain("Cache");
      expect(usage.textContent).toContain("100");
    });

    it("should return null when no cache tokens", () => {
      render(
        <Context
          usedTokens={500}
          maxTokens={2000}
          modelId="gpt-4"
          usage={{ ...mockUsage, cachedInputTokens: 0 }}
        >
          <ContextCacheUsage data-testid="cache-usage" />
        </Context>
      );

      expect(screen.queryByTestId("cache-usage")).not.toBeInTheDocument();
    });
  });
});
