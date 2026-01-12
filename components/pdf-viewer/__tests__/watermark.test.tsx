import { render, screen } from "@testing-library/react";
import { PDFWatermark } from "../watermark";

describe("PDFWatermark", () => {
  it("renders nothing when no text provided", () => {
    const { container } = render(
      <PDFWatermark
        text=""
        color="#000"
        opacity={1}
        size={20}
        width={100}
        height={100}
        gapX={1}
        gapY={1}
        rotation={0}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders watermark text", () => {
    render(
      <PDFWatermark
        text="CONFIDENTIAL"
        color="#FF0000"
        opacity={0.5}
        size={40}
        width={500}
        height={500}
        gapX={2}
        gapY={2}
        rotation={-45}
      />
    );

    // It renders multiple copies, so getAllByText
    const elements = screen.getAllByText("CONFIDENTIAL");
    expect(elements.length).toBeGreaterThan(0);

    const firstElement = elements[0];
    expect(firstElement).toHaveStyle({
      color: "#FF0000",
      opacity: "0.5",
      fontSize: "40px",
    });
  });
});
