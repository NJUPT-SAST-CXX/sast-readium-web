import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PDFGoToPage } from "../pdf-go-to-page";
import { usePDFStore } from "@/lib/pdf";

jest.mock("@/lib/pdf");
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PDFGoToPage", () => {
  const mockGoToPage = jest.fn();
  const mockStore = {
    currentPage: 1,
    numPages: 10,
    goToPage: mockGoToPage,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders and opens popover", async () => {
    render(<PDFGoToPage />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByLabelText(/toolbar.go_to.label/)).toBeInTheDocument();
    });
  });

  it("submits valid page number", async () => {
    render(<PDFGoToPage />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    const input = await screen.findByLabelText(/toolbar.go_to.label/);
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.submit(input.closest("form")!);

    expect(mockGoToPage).toHaveBeenCalledWith(5);
  });

  it("ignores invalid page number", async () => {
    render(<PDFGoToPage />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    const input = await screen.findByLabelText(/toolbar.go_to.label/);
    fireEvent.change(input, { target: { value: "50" } }); // > numPages
    fireEvent.submit(input.closest("form")!);

    expect(mockGoToPage).not.toHaveBeenCalled();
  });
});
