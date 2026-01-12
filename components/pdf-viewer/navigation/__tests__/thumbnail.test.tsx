import { render, screen, fireEvent } from "@testing-library/react";
import { PDFThumbnail } from "../thumbnail";

describe("PDFThumbnail", () => {
  const mockPage = {
    getViewport: jest.fn().mockReturnValue({ width: 100, height: 100 }),
    render: jest.fn().mockReturnValue({
      promise: Promise.resolve(),
    }),
  };

  it("renders thumbnail", () => {
    render(
      <PDFThumbnail
        page={mockPage as unknown as Parameters<typeof PDFThumbnail>[0]["page"]}
        pageNumber={1}
        isActive={false}
        onClick={jest.fn()}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    // Canvas should be present
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });

  it("shows active state", () => {
    render(
      <PDFThumbnail
        page={mockPage as unknown as Parameters<typeof PDFThumbnail>[0]["page"]}
        pageNumber={1}
        isActive={true}
        onClick={jest.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-primary");
  });

  it("handles click", () => {
    const onClick = jest.fn();
    render(
      <PDFThumbnail
        page={mockPage as unknown as Parameters<typeof PDFThumbnail>[0]["page"]}
        pageNumber={1}
        isActive={false}
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
