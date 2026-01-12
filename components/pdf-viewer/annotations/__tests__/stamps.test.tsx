import { render, screen, fireEvent } from "@testing-library/react";
import { AnnotationStamps } from "../stamps";

describe("AnnotationStamps", () => {
  const mockOnStampSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all stamp options", () => {
    render(<AnnotationStamps onStampSelect={mockOnStampSelect} />);

    expect(screen.getByText("Stamps:")).toBeInTheDocument();
    // Check for labels
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Confidential")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
  });

  it("calls onStampSelect when a stamp is clicked", () => {
    render(<AnnotationStamps onStampSelect={mockOnStampSelect} />);

    const approvedBtn = screen.getByRole("button", { name: /Approved/i });
    fireEvent.click(approvedBtn);
    expect(mockOnStampSelect).toHaveBeenCalledWith("approved");

    const rejectedBtn = screen.getByRole("button", { name: /Rejected/i });
    fireEvent.click(rejectedBtn);
    expect(mockOnStampSelect).toHaveBeenCalledWith("rejected");
  });
});
