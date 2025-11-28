import { render, screen, fireEvent } from "@testing-library/react";
import { SignatureDialog } from "../signature-dialog";
import { usePDFStore } from "@/lib/pdf-store";

jest.mock("@/lib/pdf-store");
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("SignatureDialog", () => {
  const mockStore = {
    signatures: ["sig1.png"],
    addSignature: jest.fn(),
    removeSignature: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders and shows saved signatures", () => {
    render(
      <SignatureDialog
        open={true}
        onOpenChange={jest.fn()}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("Manage Signatures")).toBeInTheDocument();
    // Saved signatures label
    expect(screen.getByText("Saved Signatures")).toBeInTheDocument();
  });

  it("has tab options for Draw and Image", () => {
    render(
      <SignatureDialog
        open={true}
        onOpenChange={jest.fn()}
        onSelect={jest.fn()}
      />
    );

    // Radix tabs don't switch properly in test environment, just verify tabs exist
    expect(screen.getByText("Draw")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
  });

  it("selects a signature", () => {
    const mockOnSelect = jest.fn();
    render(
      <SignatureDialog
        open={true}
        onOpenChange={jest.fn()}
        onSelect={mockOnSelect}
      />
    );

    const sigImage = screen.getByAltText("Signature 1");
    fireEvent.click(sigImage.parentElement!); // click the container

    expect(mockOnSelect).toHaveBeenCalledWith("sig1.png");
  });
});
