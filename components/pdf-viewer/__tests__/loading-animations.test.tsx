import { render, screen } from "@testing-library/react";
import { PDFLoadingAnimation } from "../loading-animations";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "viewer.loading_document": "Loading document...",
        "viewer.loading_pdf": "Loading PDF...",
      };
      return translations[key] || key;
    },
  }),
}));

describe("PDFLoadingAnimation", () => {
  it("renders spinner type correctly", () => {
    render(<PDFLoadingAnimation type="spinner" progress={45} />);
    expect(screen.getByText("45%")).toBeInTheDocument();
    // Loader2 is an SVG, checking for its presence might be tricky by role, but we can check for class
    // Or just rely on "45%" being there which implies rendering happened.
  });

  it("renders pulse type correctly", () => {
    render(<PDFLoadingAnimation type="pulse" progress={60} />);
    expect(screen.getByText("Loading document...")).toBeInTheDocument();
  });

  it("renders bar type correctly", () => {
    render(<PDFLoadingAnimation type="bar" progress={80} />);
    expect(screen.getByText("Loading PDF...")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("handles undefined progress", () => {
    render(<PDFLoadingAnimation type="bar" />);
    expect(screen.getByText("...")).toBeInTheDocument();
  });
});
