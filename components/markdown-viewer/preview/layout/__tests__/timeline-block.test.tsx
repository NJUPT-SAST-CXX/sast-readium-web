/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { TimelineBlock, parseTimelineFromMarkdown } from "../timeline-block";

describe("TimelineBlock", () => {
  const mockItems = [
    { id: "1", title: "Task 1", status: "completed" as const },
    { id: "2", title: "Task 2", date: "2024-01-15", status: "active" as const },
    {
      id: "3",
      title: "Task 3",
      description: "Description here",
      status: "pending" as const,
    },
  ];

  it("should render all timeline items", () => {
    render(<TimelineBlock items={mockItems} />);

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("Task 3")).toBeInTheDocument();
  });

  it("should render item dates", () => {
    render(<TimelineBlock items={mockItems} />);

    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
  });

  it("should render item descriptions", () => {
    render(<TimelineBlock items={mockItems} />);

    expect(screen.getByText("Description here")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <TimelineBlock items={mockItems} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should render empty when no items", () => {
    const { container } = render(<TimelineBlock items={[]} />);

    // Should still render the container but with no items
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("parseTimelineFromMarkdown", () => {
  it("should parse completed tasks", () => {
    const content = `- [x] 2024-01-01: Task completed`;

    const items = parseTimelineFromMarkdown(content);

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Task completed");
    expect(items[0].date).toBe("2024-01-01");
    expect(items[0].status).toBe("completed");
  });

  it("should parse pending tasks", () => {
    const content = `- [ ] 2024-01-02: Task pending`;

    const items = parseTimelineFromMarkdown(content);

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Task pending");
    expect(items[0].status).toBe("pending");
  });

  it("should parse tasks without dates", () => {
    const content = `- [x] Task without date`;

    const items = parseTimelineFromMarkdown(content);

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Task without date");
    expect(items[0].date).toBeUndefined();
  });

  it("should parse multiple tasks", () => {
    const content = `- [x] 2024-01-01: First task
- [ ] 2024-01-02: Second task
- [x] Third task`;

    const items = parseTimelineFromMarkdown(content);

    expect(items).toHaveLength(3);
  });

  it("should return empty array for invalid content", () => {
    const content = `Regular paragraph text`;

    const items = parseTimelineFromMarkdown(content);

    expect(items).toHaveLength(0);
  });

  it("should generate unique IDs", () => {
    const content = `- [x] Task 1
- [ ] Task 2`;

    const items = parseTimelineFromMarkdown(content);

    expect(items[0].id).not.toBe(items[1].id);
  });
});
