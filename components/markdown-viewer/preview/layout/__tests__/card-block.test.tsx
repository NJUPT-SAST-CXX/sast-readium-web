/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CardBlock } from "../card-block";

describe("CardBlock", () => {
  it("should render children content", () => {
    render(
      <CardBlock>
        <p>Card content</p>
      </CardBlock>
    );

    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("should render title when provided", () => {
    render(
      <CardBlock title="Card Title">
        <p>Content</p>
      </CardBlock>
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
  });

  it("should render icon when provided", () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;

    render(
      <CardBlock title="Title" icon={<TestIcon />}>
        <p>Content</p>
      </CardBlock>
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("should not render header when no title or icon", () => {
    const { container } = render(
      <CardBlock>
        <p>Content</p>
      </CardBlock>
    );

    // Should not have border-b class for header separator
    const header = container.querySelector(".border-b");
    expect(header).toBeNull();
  });

  it("should apply default variant styles", () => {
    const { container } = render(
      <CardBlock>
        <p>Content</p>
      </CardBlock>
    );

    expect(container.firstChild).toHaveClass("bg-background");
    expect(container.firstChild).toHaveClass("border");
    expect(container.firstChild).toHaveClass("shadow-sm");
  });

  it("should apply outlined variant styles", () => {
    const { container } = render(
      <CardBlock variant="outlined">
        <p>Content</p>
      </CardBlock>
    );

    expect(container.firstChild).toHaveClass("border-2");
    expect(container.firstChild).toHaveClass("border-dashed");
  });

  it("should apply filled variant styles", () => {
    const { container } = render(
      <CardBlock variant="filled">
        <p>Content</p>
      </CardBlock>
    );

    expect(container.firstChild).toHaveClass("bg-muted");
    expect(container.firstChild).toHaveClass("border-0");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CardBlock className="custom-class">
        <p>Content</p>
      </CardBlock>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
