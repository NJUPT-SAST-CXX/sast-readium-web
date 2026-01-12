/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { Minimap } from "../minimap";

// Mock canvas context
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: "",
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe("Minimap", () => {
  const defaultProps = {
    content: "# Heading\n\nParagraph text\n\n- List item\n\n```code```",
    scrollPercentage: 0.5,
    viewportHeight: 100,
    totalHeight: 500,
    onSeek: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render canvas element", () => {
    const { container } = render(<Minimap {...defaultProps} />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("should render viewport indicator", () => {
    const { container } = render(<Minimap {...defaultProps} />);

    const indicator = container.querySelector(".bg-primary\\/20");
    expect(indicator).toBeInTheDocument();
  });

  it("should call onSeek when clicked", () => {
    const onSeek = jest.fn();
    const { container } = render(<Minimap {...defaultProps} onSeek={onSeek} />);

    const minimap = container.firstChild as HTMLElement;
    fireEvent.mouseDown(minimap, { clientY: 100 });

    expect(onSeek).toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Minimap {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should handle drag interaction", () => {
    const onSeek = jest.fn();
    const { container } = render(<Minimap {...defaultProps} onSeek={onSeek} />);

    const minimap = container.firstChild as HTMLElement;

    // Start dragging
    fireEvent.mouseDown(minimap, { clientY: 50 });
    expect(onSeek).toHaveBeenCalledTimes(1);

    // Continue dragging
    fireEvent.mouseMove(minimap, { clientY: 100 });
    expect(onSeek).toHaveBeenCalledTimes(2);

    // End dragging
    fireEvent.mouseUp(minimap);
  });

  it("should position viewport indicator based on scroll percentage", () => {
    const { container, rerender } = render(
      <Minimap {...defaultProps} scrollPercentage={0} />
    );

    let indicator = container.querySelector(".bg-primary\\/20") as HTMLElement;
    const initialTop = indicator.style.top;

    rerender(<Minimap {...defaultProps} scrollPercentage={0.5} />);
    indicator = container.querySelector(".bg-primary\\/20") as HTMLElement;

    expect(indicator.style.top).not.toBe(initialTop);
  });
});
