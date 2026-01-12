/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { VideoEmbed } from "../video-embed";

describe("VideoEmbed", () => {
  it("should render YouTube video embed", () => {
    render(
      <VideoEmbed
        src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        title="Test Video"
      />
    );

    expect(screen.getByText("Test Video")).toBeInTheDocument();
  });

  it("should render direct video file", () => {
    render(<VideoEmbed src="/videos/test.mp4" title="Local Video" />);

    expect(screen.getByText("Local Video")).toBeInTheDocument();
    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/videos/test.mp4");
  });

  it("should show error message for unrecognized URL", () => {
    render(<VideoEmbed src="https://unknown-site.com/video" />);

    expect(screen.getByText("无法识别的视频链接")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <VideoEmbed
        src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
