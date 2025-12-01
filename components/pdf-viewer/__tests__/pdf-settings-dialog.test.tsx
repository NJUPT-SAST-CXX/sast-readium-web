import { render, screen, fireEvent } from "@testing-library/react";
import { PDFSettingsDialog } from "../pdf-settings-dialog";
import { usePDFStore } from "@/lib/pdf";

jest.mock("@/lib/pdf");
jest.mock("@/lib/platform", () => ({
  isTauri: jest.fn().mockReturnValue(false),
  saveDesktopPreferences: jest.fn(),
  checkForAppUpdates: jest.fn(),
  sendSystemNotification: jest.fn(),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PDFSettingsDialog", () => {
  const mockStore = {
    viewMode: "single",
    fitMode: "custom",
    zoom: 1,
    showThumbnails: false,
    showOutline: false,
    showAnnotations: false,
    isDarkMode: false,
    isPresentationMode: false,
    caseSensitiveSearch: false,
    selectedAnnotationColor: "#ffff00",
    selectedStrokeWidth: 2,
    showPageNavigationInBottomBar: true,
    themeMode: "auto",
    enableSplashScreen: true,
    pdfLoadingAnimation: "spinner",
    watermarkText: "",
    watermarkColor: "#000000",
    watermarkOpacity: 0.2,
    watermarkSize: 48,
    watermarkGapX: 1.5,
    watermarkGapY: 4,
    watermarkRotation: -45,
    autoCheckUpdate: false,

    setViewMode: jest.fn(),
    setFitMode: jest.fn(),
    setZoom: jest.fn(),
    toggleThumbnails: jest.fn(),
    toggleOutline: jest.fn(),
    toggleAnnotations: jest.fn(),
    toggleDarkMode: jest.fn(),
    togglePresentationMode: jest.fn(),
    toggleCaseSensitiveSearch: jest.fn(),
    setSelectedAnnotationColor: jest.fn(),
    setSelectedStrokeWidth: jest.fn(),
    toggleBottomBarMode: jest.fn(),
    setThemeMode: jest.fn(),
    toggleSplashScreen: jest.fn(),
    setPdfLoadingAnimation: jest.fn(),
    setWatermarkText: jest.fn(),
    setWatermarkColor: jest.fn(),
    setWatermarkOpacity: jest.fn(),
    setWatermarkSize: jest.fn(),
    setWatermarkGapX: jest.fn(),
    setWatermarkGapY: jest.fn(),
    setWatermarkRotation: jest.fn(),
    toggleAutoCheckUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders settings dialog", () => {
    render(<PDFSettingsDialog open={true} onOpenChange={jest.fn()} />);

    expect(screen.getByText("settings.title")).toBeInTheDocument();
    expect(screen.getByText("settings.section.display")).toBeInTheDocument();
    expect(screen.getByText("settings.section.interface")).toBeInTheDocument();
    expect(screen.getByText("settings.section.appearance")).toBeInTheDocument();
    expect(screen.getByText("settings.section.watermark")).toBeInTheDocument();
  });

  it("applies changes on save", () => {
    const onOpenChange = jest.fn();
    render(<PDFSettingsDialog open={true} onOpenChange={onOpenChange} />);

    // Change view mode locally
    const continuousBtn = screen.getByText("settings.option.continuous");
    fireEvent.click(continuousBtn);

    // Click save
    const saveBtn = screen.getByText("settings.button.save");
    fireEvent.click(saveBtn);

    expect(mockStore.setViewMode).toHaveBeenCalledWith("continuous");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
