import { render, screen, act } from "@testing-library/react";
import { SplashScreen } from "../splash-screen";
import { usePDFStore } from "@/lib/pdf-store";

jest.mock("@/lib/pdf-store");
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} alt={props.alt as string} />,
}));

describe("SplashScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders when enabled and not shown before", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue(true); // enableSplashScreen = true

    render(<SplashScreen />);

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText("Readium")).toBeInTheDocument();
  });

  it("does not render if already shown", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue(true);
    sessionStorage.setItem("hasShownSplashScreen", "true");

    const { container } = render(<SplashScreen />);
    
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(container.firstChild).toBeNull();
  });

  it("does not render if disabled", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue(false);

    const { container } = render(<SplashScreen />);
    
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(container.firstChild).toBeNull();
  });

  it("hides after timeout", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue(true);

    const { container } = render(<SplashScreen />);

    act(() => {
      jest.advanceTimersByTime(0); // Mount
    });
    expect(screen.getByText("Readium")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2500); // Hide animation start
    });
    
    // Verify session storage set
    expect(sessionStorage.getItem("hasShownSplashScreen")).toBe("true");

    act(() => {
      jest.advanceTimersByTime(1000); // Unmount
    });

    expect(container.firstChild).toBeNull();
  });
});
