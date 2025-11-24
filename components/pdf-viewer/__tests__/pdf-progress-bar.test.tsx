import { render, screen, fireEvent } from "@testing-library/react";
import { PDFProgressBar } from "../pdf-progress-bar";
import { usePDFStore } from "@/lib/pdf-store";

jest.mock("@/lib/pdf-store");
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PDFProgressBar", () => {
  const mockStore = {
    currentPage: 1,
    numPages: 10,
    showPageNavigationInBottomBar: true,
    toggleBottomBarMode: jest.fn(),
    goToPage: jest.fn(),
    firstPage: jest.fn(),
    lastPage: jest.fn(),
    nextPage: jest.fn(),
    previousPage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders page navigation mode by default", () => {
    render(<PDFProgressBar />);
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    expect(screen.getByText("/ 10")).toBeInTheDocument();
  });

  it("toggles to progress bar mode", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      showPageNavigationInBottomBar: false,
    });
    render(<PDFProgressBar />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("10 pages")).toBeInTheDocument();
  });

  it("navigates pages", () => {
    render(<PDFProgressBar />);
    
    // Find buttons by icon or tooltip. 
    // Since we mocked translation, tooltips are keys.
    // Tooltips are in DOM but might need interaction.
    
    // We can try finding by accessible name from tooltip if tooltip renders immediately.
    // Radix Tooltip only renders content when active usually.
    
    // But the buttons have onClick handlers. We can find them by their rendered SVG icons if we could.
    // Let's use getAllByRole("button").
    const buttons = screen.getAllByRole("button");
    // 0: toggle mode
    // 1: first page
    // 2: previous page
    // 3: next page
    // 4: last page
    
    fireEvent.click(buttons[3]); // Next page
    expect(mockStore.nextPage).toHaveBeenCalled();
  });

  it("handles manual page input", () => {
    render(<PDFProgressBar />);
    const input = screen.getByDisplayValue("1");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.submit(input.closest("form")!);
    expect(mockStore.goToPage).toHaveBeenCalledWith(5);
  });
});
