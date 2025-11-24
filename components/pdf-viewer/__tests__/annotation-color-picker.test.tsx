import { render, screen, fireEvent } from "@testing-library/react";
import { AnnotationColorPicker } from "../annotation-color-picker";

describe("AnnotationColorPicker", () => {
  const mockOnColorChange = jest.fn();
  const selectedColor = "#ffff00";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all preset colors", () => {
    render(
      <AnnotationColorPicker
        selectedColor={selectedColor}
        onColorChange={mockOnColorChange}
      />
    );
    
    // There are 12 preset colors
    const colorButtons = screen.getAllByLabelText(/Select .* color/);
    expect(colorButtons).toHaveLength(12);
  });

  it("highlights the selected color", () => {
    render(
      <AnnotationColorPicker
        selectedColor={selectedColor}
        onColorChange={mockOnColorChange}
      />
    );

    const selectedButton = screen.getByLabelText("Select Yellow color");
    expect(selectedButton).toHaveClass("border-primary");
  });

  it("calls onColorChange when a color is clicked", () => {
    render(
      <AnnotationColorPicker
        selectedColor={selectedColor}
        onColorChange={mockOnColorChange}
      />
    );

    const redButton = screen.getByLabelText("Select Red color");
    fireEvent.click(redButton);
    expect(mockOnColorChange).toHaveBeenCalledWith("#ff6b6b");
  });

  it("calls onColorChange when custom color is selected", () => {
    render(
      <AnnotationColorPicker
        selectedColor={selectedColor}
        onColorChange={mockOnColorChange}
      />
    );

    const colorInput = screen.getByTitle("Custom color");
    fireEvent.change(colorInput, { target: { value: "#123456" } });
    expect(mockOnColorChange).toHaveBeenCalledWith("#123456");
  });
});
