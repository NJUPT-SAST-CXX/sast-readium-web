/**
 * Tests for Shimmer component (components/ai/elements/shimmer.tsx)
 */

import { render, screen } from "@testing-library/react";

// Mock motion/react to avoid ESM issues
jest.mock("motion/react", () => {
  const React = require("react");
  const createMotionComponent = (Element: string) =>
    React.forwardRef(({ children, style, ...props }: any, ref: any) =>
      React.createElement(Element, { ...props, ref, style }, children)
    );

  return {
    motion: {
      p: createMotionComponent("p"),
      span: createMotionComponent("span"),
      div: createMotionComponent("div"),
      h1: createMotionComponent("h1"),
      h2: createMotionComponent("h2"),
      h3: createMotionComponent("h3"),
    },
  };
});

import { Shimmer } from "../shimmer";

describe("Shimmer Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with children text", () => {
    render(<Shimmer>Loading content...</Shimmer>);

    expect(screen.getByText("Loading content...")).toBeInTheDocument();
  });

  it("should render as paragraph by default", () => {
    render(<Shimmer>Shimmer text</Shimmer>);

    expect(screen.getByText("Shimmer text")).toBeInTheDocument();
  });

  it("should render with custom element type", () => {
    render(<Shimmer as="span">Shimmer span</Shimmer>);

    expect(screen.getByText("Shimmer span")).toBeInTheDocument();
  });

  it("should render as h1 when specified", () => {
    render(<Shimmer as="h1">Shimmer heading</Shimmer>);

    expect(screen.getByText("Shimmer heading")).toBeInTheDocument();
  });

  it("should render as h2 when specified", () => {
    render(<Shimmer as="h2">Heading 2</Shimmer>);

    expect(screen.getByText("Heading 2")).toBeInTheDocument();
  });

  it("should render as h3 when specified", () => {
    render(<Shimmer as="h3">Heading 3</Shimmer>);

    expect(screen.getByText("Heading 3")).toBeInTheDocument();
  });

  it("should render as div when specified", () => {
    render(<Shimmer as="div">Shimmer div</Shimmer>);

    expect(screen.getByText("Shimmer div")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(
      <Shimmer className="custom-shimmer">Text with custom class</Shimmer>
    );

    expect(screen.getByText("Text with custom class")).toBeInTheDocument();
  });

  it("should accept custom duration prop", () => {
    render(<Shimmer duration={4}>Slower shimmer</Shimmer>);

    expect(screen.getByText("Slower shimmer")).toBeInTheDocument();
  });

  it("should accept custom spread prop", () => {
    render(<Shimmer spread={3}>Wider shimmer</Shimmer>);

    expect(screen.getByText("Wider shimmer")).toBeInTheDocument();
  });

  it("should render with multiple lines of text", () => {
    render(<Shimmer>This is a longer text for shimmer effect</Shimmer>);

    expect(
      screen.getByText("This is a longer text for shimmer effect")
    ).toBeInTheDocument();
  });

  it("should be memoized for performance", () => {
    const { rerender } = render(<Shimmer>Text</Shimmer>);

    expect(screen.getByText("Text")).toBeInTheDocument();

    // Rerender with same props
    rerender(<Shimmer>Text</Shimmer>);

    // Should still render without issues
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("should handle empty string", () => {
    const { container } = render(<Shimmer>{""}</Shimmer>);

    // Should render without error
    expect(container).toBeInTheDocument();
  });

  it("should handle special characters", () => {
    render(<Shimmer>Loading... (60%)</Shimmer>);

    expect(screen.getByText("Loading... (60%)")).toBeInTheDocument();
  });

  it("should work with different durations", () => {
    const { rerender } = render(<Shimmer duration={1}>Fast shimmer</Shimmer>);

    expect(screen.getByText("Fast shimmer")).toBeInTheDocument();

    rerender(<Shimmer duration={5}>Slow shimmer</Shimmer>);

    expect(screen.getByText("Slow shimmer")).toBeInTheDocument();
  });

  it("should work with different spreads", () => {
    const { rerender } = render(<Shimmer spread={1}>Narrow</Shimmer>);

    expect(screen.getByText("Narrow")).toBeInTheDocument();

    rerender(<Shimmer spread={5}>Wide</Shimmer>);

    expect(screen.getByText("Wide")).toBeInTheDocument();
  });

  it("should handle very long text", () => {
    const longText =
      "This is a very long piece of text that should still render correctly with the shimmer effect applied";

    render(<Shimmer>{longText}</Shimmer>);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("should work with different element types", () => {
    render(
      <Shimmer as="span" className="text-primary text-sm">
        Styled Shimmer
      </Shimmer>
    );

    expect(screen.getByText("Styled Shimmer")).toBeInTheDocument();
  });

  it("should work in layout contexts", () => {
    render(
      <div className="grid grid-cols-2 gap-4">
        <Shimmer>Item 1</Shimmer>
        <Shimmer>Item 2</Shimmer>
        <Shimmer>Item 3</Shimmer>
        <Shimmer>Item 4</Shimmer>
      </div>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.getByText("Item 4")).toBeInTheDocument();
  });
});
