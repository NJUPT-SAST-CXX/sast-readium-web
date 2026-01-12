/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { ColumnsLayout, Column } from "../columns-layout";

describe("ColumnsLayout", () => {
  it("should render children", () => {
    render(
      <ColumnsLayout>
        <div>Column 1</div>
        <div>Column 2</div>
      </ColumnsLayout>
    );

    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Column 2")).toBeInTheDocument();
  });

  it("should apply 2-column grid by default", () => {
    const { container } = render(
      <ColumnsLayout>
        <div>Content</div>
      </ColumnsLayout>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("md:grid-cols-2");
  });

  it("should apply 3-column grid when specified", () => {
    const { container } = render(
      <ColumnsLayout columns={3}>
        <div>Content</div>
      </ColumnsLayout>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("lg:grid-cols-3");
  });

  it("should apply 4-column grid when specified", () => {
    const { container } = render(
      <ColumnsLayout columns={4}>
        <div>Content</div>
      </ColumnsLayout>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("lg:grid-cols-4");
  });

  it("should apply different gap sizes", () => {
    const { container, rerender } = render(
      <ColumnsLayout gap="sm">
        <div>Content</div>
      </ColumnsLayout>
    );

    expect(container.firstChild).toHaveClass("gap-2");

    rerender(
      <ColumnsLayout gap="lg">
        <div>Content</div>
      </ColumnsLayout>
    );

    expect(container.firstChild).toHaveClass("gap-6");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ColumnsLayout className="custom-class">
        <div>Content</div>
      </ColumnsLayout>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("Column", () => {
  it("should render children", () => {
    render(
      <Column>
        <p>Column content</p>
      </Column>
    );

    expect(screen.getByText("Column content")).toBeInTheDocument();
  });

  it("should apply min-w-0 class", () => {
    const { container } = render(
      <Column>
        <p>Content</p>
      </Column>
    );

    expect(container.firstChild).toHaveClass("min-w-0");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Column className="custom-class">
        <p>Content</p>
      </Column>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
