/**
 * Tests for ModelSelector components (components/ai/elements/model-selector.tsx)
 */

import { render, screen } from "@testing-library/react";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "../model-selector";

// Mock Dialog and Command components
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  DialogContent: ({
    children,
    title,
    className,
  }: {
    children: React.ReactNode;
    title?: string;
    className?: string;
  }) => (
    <div data-testid="dialog-content" data-title={title} className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

jest.mock("@/components/ui/command", () => ({
  Command: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command">{children}</div>
  ),
  CommandDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-dialog">{children}</div>
  ),
  CommandInput: ({ className, ...props }: any) => (
    <input data-testid="command-input" className={className} {...props} />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-list">{children}</div>
  ),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-empty">{children}</div>
  ),
  CommandGroup: ({
    heading,
    children,
  }: {
    heading?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="command-group" data-heading={heading}>
      {children}
    </div>
  ),
  CommandItem: ({ children, ...props }: any) => (
    <div data-testid="command-item" {...props}>
      {children}
    </div>
  ),
  CommandSeparator: () => <div data-testid="command-separator" />,
  CommandShortcut: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="command-shortcut">{children}</span>
  ),
}));

describe("ModelSelector Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ModelSelector", () => {
    it("should render as Dialog", () => {
      render(
        <ModelSelector>
          <span>Test</span>
        </ModelSelector>
      );

      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("should pass props to Dialog", () => {
      render(
        <ModelSelector open={false}>
          <span>Content</span>
        </ModelSelector>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("ModelSelectorTrigger", () => {
    it("should render as DialogTrigger button", () => {
      render(
        <ModelSelectorTrigger>
          <span>Open</span>
        </ModelSelectorTrigger>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Open")).toBeInTheDocument();
    });
  });

  describe("ModelSelectorContent", () => {
    it("should render dialog content", () => {
      render(
        <ModelSelectorContent>
          <span>Models</span>
        </ModelSelectorContent>
      );

      expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
      expect(screen.getByText("Models")).toBeInTheDocument();
    });

    it("should have default title", () => {
      render(
        <ModelSelectorContent>
          <span>Models</span>
        </ModelSelectorContent>
      );

      const dialogContent = screen.getByTestId("dialog-content");
      expect(dialogContent).toBeInTheDocument();
      // Title is rendered as sr-only in DialogTitle
      expect(screen.getByText("Model Selector")).toBeInTheDocument();
    });

    it("should accept custom title", () => {
      render(
        <ModelSelectorContent title="Custom Title">
          <span>Models</span>
        </ModelSelectorContent>
      );

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ModelSelectorContent
          className="custom-class"
          data-testid="content-wrapper"
        >
          <span>Models</span>
        </ModelSelectorContent>
      );

      expect(screen.getByTestId("dialog-content")).toHaveClass("custom-class");
    });
  });

  describe("ModelSelectorInput", () => {
    it("should render command input", () => {
      render(<ModelSelectorInput placeholder="Search models..." />);

      const input = screen.getByTestId("command-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Search models...");
    });

    it("should apply custom className", () => {
      render(
        <ModelSelectorInput className="custom-input" data-testid="input" />
      );

      expect(screen.getByTestId("input")).toHaveClass("custom-input");
    });
  });

  describe("ModelSelectorList", () => {
    it("should render command list", () => {
      render(
        <ModelSelectorList>
          <span>Items</span>
        </ModelSelectorList>
      );

      expect(screen.getByTestId("command-list")).toBeInTheDocument();
      expect(screen.getByText("Items")).toBeInTheDocument();
    });
  });

  describe("ModelSelectorEmpty", () => {
    it("should render command empty state", () => {
      render(<ModelSelectorEmpty>No models found</ModelSelectorEmpty>);

      expect(screen.getByTestId("command-empty")).toBeInTheDocument();
      expect(screen.getByText("No models found")).toBeInTheDocument();
    });
  });

  describe("ModelSelectorGroup", () => {
    it("should render command group", () => {
      render(
        <ModelSelectorGroup heading="Popular">
          <span>Group content</span>
        </ModelSelectorGroup>
      );

      expect(screen.getByTestId("command-group")).toBeInTheDocument();
      expect(screen.getByTestId("command-group")).toHaveAttribute(
        "data-heading",
        "Popular"
      );
      expect(screen.getByText("Group content")).toBeInTheDocument();
    });
  });

  describe("ModelSelectorItem", () => {
    it("should render command item", () => {
      render(
        <ModelSelectorItem>
          <span>Model Item</span>
        </ModelSelectorItem>
      );

      expect(screen.getByTestId("command-item")).toBeInTheDocument();
      expect(screen.getByText("Model Item")).toBeInTheDocument();
    });
  });

  describe("ModelSelectorLogo", () => {
    it("should render img element with correct src", () => {
      render(<ModelSelectorLogo provider="openai" />);

      const img = screen.getByAltText("openai logo");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://models.dev/logos/openai.svg");
    });

    it("should have correct height and width attributes", () => {
      render(<ModelSelectorLogo provider="anthropic" />);

      const img = screen.getByAltText("anthropic logo");
      expect(img).toHaveAttribute("height", "12");
      expect(img).toHaveAttribute("width", "12");
    });

    it("should apply custom className", () => {
      render(
        <ModelSelectorLogo
          provider="google"
          className="custom-logo"
          data-testid="logo"
        />
      );

      expect(screen.getByTestId("logo")).toHaveClass("custom-logo");
    });

    it("should work with custom provider names", () => {
      render(<ModelSelectorLogo provider="custom-provider" />);

      const img = screen.getByAltText("custom-provider logo");
      expect(img).toHaveAttribute(
        "src",
        "https://models.dev/logos/custom-provider.svg"
      );
    });
  });

  describe("ModelSelectorName", () => {
    it("should render span element", () => {
      render(<ModelSelectorName>GPT-4</ModelSelectorName>);

      expect(screen.getByText("GPT-4")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ModelSelectorName className="custom-name" data-testid="name">
          Model Name
        </ModelSelectorName>
      );

      expect(screen.getByTestId("name")).toHaveClass("custom-name");
    });

    it("should truncate text", () => {
      const longName =
        "This is a very long model name that should be truncated";
      render(
        <ModelSelectorName data-testid="name">{longName}</ModelSelectorName>
      );

      expect(screen.getByTestId("name")).toHaveClass("truncate");
    });
  });

  describe("Integration: Full ModelSelector flow", () => {
    it("should render complete model selector dialog", () => {
      render(
        <ModelSelector>
          <ModelSelectorTrigger>Open</ModelSelectorTrigger>
          <ModelSelectorContent>
            <ModelSelectorInput placeholder="Search..." />
            <ModelSelectorList>
              <ModelSelectorGroup heading="Popular">
                <ModelSelectorItem>
                  <ModelSelectorLogo provider="openai" />
                  <ModelSelectorName>GPT-4</ModelSelectorName>
                </ModelSelectorItem>
              </ModelSelectorGroup>
              <ModelSelectorEmpty>Not found</ModelSelectorEmpty>
            </ModelSelectorList>
          </ModelSelectorContent>
        </ModelSelector>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByTestId("command-input")).toBeInTheDocument();
      expect(screen.getByTestId("command-group")).toBeInTheDocument();
      expect(screen.getByAltText("openai logo")).toBeInTheDocument();
    });
  });
});
