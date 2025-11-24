import { render, waitFor } from "@testing-library/react";
import { ThemeManager } from "../theme-manager";
import { usePDFStore } from "@/lib/pdf-store";
import { isTauri, loadDesktopPreferences } from "@/lib/tauri-bridge";

jest.mock("@/lib/pdf-store");
jest.mock("@/lib/tauri-bridge", () => ({
  isTauri: jest.fn(),
  loadDesktopPreferences: jest.fn(),
}));

describe("ThemeManager", () => {
  const mockSetState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup store mock
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      themeMode: "light",
      isDarkMode: false,
    });
    // Mock setState on the store function itself
    (usePDFStore as any).setState = mockSetState;
    
    // Setup matchMedia mock
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it("loads desktop preferences if in Tauri", async () => {
    (isTauri as jest.Mock).mockReturnValue(true);
    (loadDesktopPreferences as jest.Mock).mockResolvedValue({
      themeMode: "dark",
      enableSplashScreen: false,
    });

    render(<ThemeManager />);

    await waitFor(() => {
      expect(loadDesktopPreferences).toHaveBeenCalled();
      expect(mockSetState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it("does not load preferences if not in Tauri", () => {
    (isTauri as jest.Mock).mockReturnValue(false);

    render(<ThemeManager />);

    expect(loadDesktopPreferences).not.toHaveBeenCalled();
  });

  it("applies dark class to document element", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      themeMode: "dark",
      isDarkMode: true,
    });

    render(<ThemeManager />);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from document element", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      themeMode: "light",
      isDarkMode: false,
    });
    document.documentElement.classList.add("dark");

    render(<ThemeManager />);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
