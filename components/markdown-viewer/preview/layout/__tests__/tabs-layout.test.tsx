/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabsLayout, parseTabsFromMarkdown } from "../tabs-layout";

describe("TabsLayout", () => {
  const mockTabs = [
    { id: "tab1", label: "Tab 1", content: <div>Content 1</div> },
    { id: "tab2", label: "Tab 2", content: <div>Content 2</div> },
    { id: "tab3", label: "Tab 3", content: <div>Content 3</div> },
  ];

  it("should render all tab headers", () => {
    render(<TabsLayout tabs={mockTabs} />);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("should show first tab content by default", () => {
    render(<TabsLayout tabs={mockTabs} />);

    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("should show specified default tab content", () => {
    render(<TabsLayout tabs={mockTabs} defaultTab="tab2" />);

    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("should switch tab content on click", () => {
    render(<TabsLayout tabs={mockTabs} />);

    // Initially shows Tab 1 content
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    // Click Tab 2
    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("Content 2")).toBeInTheDocument();

    // Click Tab 3
    fireEvent.click(screen.getByText("Tab 3"));
    expect(screen.getByText("Content 3")).toBeInTheDocument();
  });

  it("should return null when tabs array is empty", () => {
    const { container } = render(<TabsLayout tabs={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <TabsLayout tabs={mockTabs} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should highlight active tab", () => {
    render(<TabsLayout tabs={mockTabs} />);

    const tab1Button = screen.getByText("Tab 1");
    expect(tab1Button).toHaveClass("border-primary");

    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("Tab 2")).toHaveClass("border-primary");
  });
});

describe("parseTabsFromMarkdown", () => {
  it("should parse tabs from markdown syntax", () => {
    const content = `:::tab[First Tab]
Content for first tab
:::
:::tab[Second Tab]
Content for second tab
:::`;

    const tabs = parseTabsFromMarkdown(content);

    expect(tabs).toHaveLength(2);
    expect(tabs[0].label).toBe("First Tab");
    expect(tabs[0].content).toContain("Content for first tab");
    expect(tabs[1].label).toBe("Second Tab");
    expect(tabs[1].content).toContain("Content for second tab");
  });

  it("should return empty array for content without tabs", () => {
    const content = "Just regular content";

    const tabs = parseTabsFromMarkdown(content);

    expect(tabs).toHaveLength(0);
  });

  it("should handle tabs with multiline content", () => {
    const content = `:::tab[Tab]
Line 1
Line 2
Line 3
:::`;

    const tabs = parseTabsFromMarkdown(content);

    expect(tabs).toHaveLength(1);
    expect(tabs[0].content).toContain("Line 1");
    expect(tabs[0].content).toContain("Line 2");
    expect(tabs[0].content).toContain("Line 3");
  });

  it("should generate unique IDs for each tab", () => {
    const content = `:::tab[Tab A]
Content A
:::
:::tab[Tab B]
Content B
:::`;

    const tabs = parseTabsFromMarkdown(content);

    expect(tabs[0].id).not.toBe(tabs[1].id);
  });
});
