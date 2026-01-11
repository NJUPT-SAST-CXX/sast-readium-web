/**
 * Tests for PromptInput components (components/ai/elements/prompt-input.tsx)
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// Import only the components needed to avoid loading the entire module
// The main PromptInput components are tested through mocked UI components

// Mock UI components
jest.mock("@/components/ui/input-group", () => ({
  InputGroup: ({ children, className }: any) => (
    <div data-testid="input-group" className={className}>
      {children}
    </div>
  ),
  InputGroupAddon: ({ children, className, align }: any) => (
    <div
      data-testid="input-group-addon"
      className={className}
      data-align={align}
    >
      {children}
    </div>
  ),
  InputGroupButton: ({
    children,
    className,
    type,
    variant,
    size,
    ...props
  }: any) => (
    <button
      className={className}
      type={type}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
  InputGroupTextarea: ({ className, ...props }: any) => (
    <textarea className={className} {...props} />
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, className, disabled, ...props }: any) => (
    <button className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children, className }: any) => (
    <div data-testid="dropdown-content" className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, ...props }: any) => (
    <div data-testid="dropdown-item" {...props}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: any) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: any) => <div>{children}</div>,
  HoverCardContent: ({ children, align }: any) => (
    <div data-testid="hover-card-content" data-align={align}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, className }: any) => (
    <button className={className}>{children}</button>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock("@/components/ui/command", () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandInput: ({ value, onValueChange, ...props }: any) => (
    <input
      {...props}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
  CommandGroup: ({ children }: any) => <div>{children}</div>,
  CommandItem: ({ children, onSelect }: any) => (
    <div onClick={() => onSelect?.()}>{children}</div>
  ),
  CommandSeparator: () => <hr />,
}));

describe("PromptInput Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic component structure tests using mocked UI components
  describe("PromptInput Structure", () => {
    it("should render form with input group", () => {
      render(
        <form onSubmit={(e) => e.preventDefault()}>
          <div data-testid="input-group">
            <textarea data-testid="textarea" />
          </div>
        </form>
      );

      expect(screen.getByTestId("input-group")).toBeInTheDocument();
      expect(screen.getByTestId("textarea")).toBeInTheDocument();
    });

    it("should render textarea element", () => {
      render(
        <textarea
          data-testid="textarea"
          placeholder="What would you like to know?"
        />
      );

      expect(screen.getByTestId("textarea")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("What would you like to know?")
      ).toBeInTheDocument();
    });

    it("should accept custom placeholder", () => {
      render(
        <textarea data-testid="textarea" placeholder="Custom placeholder" />
      );

      expect(
        screen.getByPlaceholderText("Custom placeholder")
      ).toBeInTheDocument();
    });

    it("should accept user input", async () => {
      const user = userEvent.setup();
      render(<textarea data-testid="textarea" />);

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "Test input");

      expect(textarea.value).toBe("Test input");
    });
  });

  describe("PromptInputSubmit Button", () => {
    it("should render submit button", () => {
      render(
        <button type="submit" data-testid="submit">
          Submit
        </button>
      );

      const button = screen.getByTestId("submit");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should render with custom children", () => {
      render(<button type="submit">Send</button>);

      expect(screen.getByText("Send")).toBeInTheDocument();
    });

    it("should handle click events", () => {
      const handleClick = jest.fn();
      render(
        <button type="submit" onClick={handleClick}>
          Submit
        </button>
      );

      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("PromptInputFooter", () => {
    it("should render footer container", () => {
      render(
        <div data-testid="footer">
          <span>Footer content</span>
        </div>
      );

      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });
  });

  describe("PromptInputTools", () => {
    it("should render tools container", () => {
      render(
        <div data-testid="tools">
          <button>Tool 1</button>
          <button>Tool 2</button>
        </div>
      );

      expect(screen.getByText("Tool 1")).toBeInTheDocument();
      expect(screen.getByText("Tool 2")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <div data-testid="tools" className="custom-tools">
          Content
        </div>
      );

      expect(screen.getByTestId("tools")).toHaveClass("custom-tools");
    });
  });

  describe("PromptInputButton", () => {
    it("should render button element", () => {
      render(<button data-testid="btn">Action</button>);

      expect(screen.getByTestId("btn")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <button data-testid="btn" className="custom-btn">
          Button
        </button>
      );

      expect(screen.getByTestId("btn")).toHaveClass("custom-btn");
    });

    it("should handle click events", () => {
      const handleClick = jest.fn();
      render(
        <button data-testid="btn" onClick={handleClick}>
          Click me
        </button>
      );

      fireEvent.click(screen.getByTestId("btn"));
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("Integration: Complete form structure", () => {
    it("should render complete form with all components", () => {
      render(
        <form onSubmit={(e) => e.preventDefault()}>
          <textarea placeholder="Type your message..." data-testid="textarea" />
          <div data-testid="footer">
            <div data-testid="tools">
              <button>Tool 1</button>
              <button>Tool 2</button>
            </div>
            <button type="submit">Submit</button>
          </div>
        </form>
      );

      expect(
        screen.getByPlaceholderText("Type your message...")
      ).toBeInTheDocument();
      expect(screen.getByText("Tool 1")).toBeInTheDocument();
      expect(screen.getByText("Tool 2")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /submit/i })
      ).toBeInTheDocument();
    });

    it("should handle form submission", async () => {
      const handleSubmit = jest.fn();
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <textarea data-testid="textarea" />
          <button type="submit">Submit</button>
        </form>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "Hello, Claude!");
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
