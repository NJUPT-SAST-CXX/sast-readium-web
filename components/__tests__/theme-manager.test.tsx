import { render, waitFor } from "@testing-library/react";
import { ThemeManager } from "../theme-manager";
import { usePDFStore } from "@/lib/pdf-store";
import { isTauri, loadDesktopPreferences } from "@/lib/tauri-bridge";
import {
  useCustomThemeStore,
  DEFAULT_THEME_COLORS,
  applyCustomTheme,
} from "@/lib/custom-theme-store";

jest.mock("@/lib/pdf-store");
jest.mock("@/lib/tauri-bridge", () => ({
  isTauri: jest.fn(),
  loadDesktopPreferences: jest.fn(),
}));
jest.mock("@/lib/custom-theme-store", () => ({
  useCustomThemeStore: jest.fn(),
  applyCustomTheme: jest.fn(),
  DEFAULT_THEME_COLORS: {},
  loadCustomThemesFromDesktop: jest.fn().mockResolvedValue(undefined),
  setupDesktopThemeSync: jest.fn().mockReturnValue(() => {}),
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
    // Setup custom theme store mock
    (useCustomThemeStore as unknown as jest.Mock).mockReturnValue({
      activeCustomThemeId: null,
      customThemes: [],
    });
    // Mock setState on the store function itself
    (usePDFStore as unknown as { setState: typeof mockSetState }).setState =
      mockSetState;

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

  it("applies sepia class when themeMode is sepia", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      themeMode: "sepia",
      isDarkMode: false,
    });

    render(<ThemeManager />);

    expect(document.documentElement.classList.contains("sepia")).toBe(true);
  });

  it("removes sepia class when themeMode is not sepia", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      themeMode: "light",
      isDarkMode: false,
    });
    document.documentElement.classList.add("sepia");

    render(<ThemeManager />);

    expect(document.documentElement.classList.contains("sepia")).toBe(false);
  });

  it("applies custom theme when activeCustomThemeId is set", () => {
    const mockTheme = {
      id: "test-theme",
      name: "Test Theme",
      colors: DEFAULT_THEME_COLORS,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (useCustomThemeStore as unknown as jest.Mock).mockReturnValue({
      activeCustomThemeId: "test-theme",
      customThemes: [mockTheme],
    });

    render(<ThemeManager />);

    expect(applyCustomTheme).toHaveBeenCalledWith(mockTheme);
  });

  it("removes custom theme when activeCustomThemeId is null", () => {
    (useCustomThemeStore as unknown as jest.Mock).mockReturnValue({
      activeCustomThemeId: null,
      customThemes: [],
    });

    render(<ThemeManager />);

    expect(applyCustomTheme).toHaveBeenCalledWith(null);
  });
});
