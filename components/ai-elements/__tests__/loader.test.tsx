/**
 * Tests for Loader component (components/ai-elements/loader.tsx)
 */

import { render, screen } from "@testing-library/react";
import { Loader } from "../loader";

describe("Loader Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with default size", () => {
    render(<Loader data-testid="loader" />);

    const loader = screen.getByTestId("loader");
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveClass("animate-spin");
  });

  it("should render SVG icon with default size", () => {
    render(<Loader data-testid="loader" />);

    const svg = screen.getByTestId("loader").querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Default size is 16
    expect(svg).toHaveAttribute("height", "16");
    expect(svg).toHaveAttribute("width", "16");
  });

  it("should render with custom size", () => {
    render(<Loader size={24} data-testid="loader" />);

    const svg = screen.getByTestId("loader").querySelector("svg");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveAttribute("width", "24");
  });

  it("should render with custom className", () => {
    render(<Loader className="custom-loader-class" data-testid="loader" />);

    expect(screen.getByTestId("loader")).toHaveClass("custom-loader-class");
  });

  it("should combine default and custom classNames", () => {
    render(<Loader className="text-blue-500" data-testid="loader" />);

    const loader = screen.getByTestId("loader");
    expect(loader).toHaveClass("animate-spin");
    expect(loader).toHaveClass("text-blue-500");
  });

  it("should have inline-flex and center alignment", () => {
    render(<Loader data-testid="loader" />);

    const loader = screen.getByTestId("loader");
    expect(loader).toHaveClass("inline-flex");
    expect(loader).toHaveClass("items-center");
    expect(loader).toHaveClass("justify-center");
  });

  it("should accept HTML div attributes", () => {
    render(<Loader data-testid="loader" id="custom-id" title="Loading..." />);

    const loader = screen.getByTestId("loader");
    expect(loader).toHaveAttribute("id", "custom-id");
    expect(loader).toHaveAttribute("title", "Loading...");
  });

  it("should render with small size", () => {
    render(<Loader size={12} data-testid="loader" />);

    const svg = screen.getByTestId("loader").querySelector("svg");
    expect(svg).toHaveAttribute("height", "12");
    expect(svg).toHaveAttribute("width", "12");
  });

  it("should render with large size", () => {
    render(<Loader size={32} data-testid="loader" />);

    const svg = screen.getByTestId("loader").querySelector("svg");
    expect(svg).toHaveAttribute("height", "32");
    expect(svg).toHaveAttribute("width", "32");
  });

  it("should have SVG with proper structure", () => {
    render(<Loader data-testid="loader" />);

    const loader = screen.getByTestId("loader");
    const svg = loader.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 16 16");
  });

  it("should render with aria-label for accessibility", () => {
    render(<Loader aria-label="Loading content" data-testid="loader" />);

    expect(screen.getByTestId("loader")).toHaveAttribute(
      "aria-label",
      "Loading content"
    );
  });

  it("should have multiple stroke paths in SVG", () => {
    render(<Loader data-testid="loader" />);

    const svg = screen.getByTestId("loader").querySelector("svg");
    const paths = svg?.querySelectorAll("path");

    // Loader has multiple paths for animation effect
    expect(paths && paths.length > 0).toBe(true);
  });

  it("should work in different contexts", () => {
    render(
      <div className="flex gap-2">
        <Loader size={16} data-testid="loader-1" />
        <Loader size={20} data-testid="loader-2" />
        <Loader size={24} data-testid="loader-3" />
      </div>
    );

    expect(screen.getByTestId("loader-1")).toBeInTheDocument();
    expect(screen.getByTestId("loader-2")).toBeInTheDocument();
    expect(screen.getByTestId("loader-3")).toBeInTheDocument();
  });
});
