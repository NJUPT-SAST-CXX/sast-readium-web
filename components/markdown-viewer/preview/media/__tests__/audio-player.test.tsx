/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { AudioPlayer } from "../audio-player";

// Mock HTMLMediaElement
beforeAll(() => {
  window.HTMLMediaElement.prototype.play = jest.fn();
  window.HTMLMediaElement.prototype.pause = jest.fn();
});

describe("AudioPlayer", () => {
  it("should render audio player with title", () => {
    render(<AudioPlayer src="/audio/test.mp3" title="Test Audio" />);

    expect(screen.getByText("Test Audio")).toBeInTheDocument();
  });

  it("should render play button", () => {
    render(<AudioPlayer src="/audio/test.mp3" />);

    // The play button should be present
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should render time display", () => {
    render(<AudioPlayer src="/audio/test.mp3" />);

    // Should show 0:00 initially (may have multiple)
    const timeElements = screen.getAllByText("0:00");
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <AudioPlayer src="/audio/test.mp3" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should render audio element with correct src", () => {
    render(<AudioPlayer src="/audio/test.mp3" />);

    const audio = document.querySelector("audio");
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute("src", "/audio/test.mp3");
  });

  it("should have volume controls", () => {
    render(<AudioPlayer src="/audio/test.mp3" />);

    // Should have multiple sliders (progress and volume)
    const sliders = document.querySelectorAll('[role="slider"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });
});
