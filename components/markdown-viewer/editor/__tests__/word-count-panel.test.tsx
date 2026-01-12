/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { WordCountPanel } from "../word-count-panel";

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("WordCountPanel", () => {
  it("should render word count inline", () => {
    const { container } = render(<WordCountPanel content="Hello world test" />);

    // Check the container has expected content structure
    expect(container.querySelector("button")).toBeInTheDocument();
    expect(container.textContent).toContain("词");
  });

  it("should render line count inline", () => {
    const { container } = render(
      <WordCountPanel content="Line 1\nLine 2\nLine 3" />
    );

    expect(container.textContent).toContain("行");
  });

  it("should handle empty content", () => {
    const { container } = render(<WordCountPanel content="" />);

    expect(container.textContent).toContain("0");
    expect(container.textContent).toContain("词");
  });

  it("should render detailed stats when showInline is false", () => {
    render(<WordCountPanel content="Hello world" showInline={false} />);

    // Should show detailed stats
    expect(screen.getByText("字符")).toBeInTheDocument();
    expect(screen.getByText("段落")).toBeInTheDocument();
  });
});
