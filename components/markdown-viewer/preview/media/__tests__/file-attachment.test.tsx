/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { FileAttachment } from "../file-attachment";

describe("FileAttachment", () => {
  it("should render file attachment with name", () => {
    render(<FileAttachment src="/files/document.pdf" name="My Document.pdf" />);

    expect(screen.getByText("My Document.pdf")).toBeInTheDocument();
  });

  it("should extract filename from URL when name not provided", () => {
    render(<FileAttachment src="/files/report.pdf" />);

    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("should display file extension", () => {
    render(<FileAttachment src="/files/document.pdf" />);

    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("should display file size when provided", () => {
    render(
      <FileAttachment src="/files/document.pdf" name="doc.pdf" size="2.5 MB" />
    );

    expect(screen.getByText("2.5 MB")).toBeInTheDocument();
  });

  it("should render download link", () => {
    render(<FileAttachment src="/files/document.pdf" name="doc.pdf" />);

    const downloadLink = document.querySelector("a[download]");
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute("href", "/files/document.pdf");
  });

  it("should render external link", () => {
    render(<FileAttachment src="/files/document.pdf" name="doc.pdf" />);

    const externalLink = document.querySelector('a[target="_blank"]');
    expect(externalLink).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <FileAttachment src="/files/doc.pdf" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
