/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../progress-bar";

describe("ProgressBar", () => {
  it("should render progress bar with correct percentage", () => {
    render(<ProgressBar value={75} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("should render label when provided", () => {
    render(<ProgressBar value={50} label="Progress" />);

    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should calculate percentage based on max value", () => {
    render(<ProgressBar value={25} max={50} />);

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should clamp percentage to 0-100 range", () => {
    const { rerender } = render(<ProgressBar value={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();

    rerender(<ProgressBar value={-10} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should hide value when showValue is false", () => {
    render(<ProgressBar value={75} showValue={false} />);

    expect(screen.queryByText("75%")).not.toBeInTheDocument();
  });

  it("should render with different sizes", () => {
    const { container, rerender } = render(
      <ProgressBar value={50} size="sm" />
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass("h-1.5");

    rerender(<ProgressBar value={50} size="lg" />);
    expect(progressBar).toHaveClass("h-4");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ProgressBar value={50} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should have correct ARIA attributes", () => {
    render(<ProgressBar value={75} max={100} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });
});
