"use client";

import type React from "react";
import { useState } from "react";
import { usePDFStore, ViewMode, FitMode } from "@/lib/pdf-store";
import { isTauri, saveDesktopPreferences } from "@/lib/tauri-bridge";
import {
  checkForAppUpdates,
  installAppUpdate,
  type UpdateStatus,
} from "@/lib/update-service";
import { sendSystemNotification } from "@/lib/notification-service";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Monitor,
  Layout,
  Palette,
  RotateCcw,
  Settings2,
  Sun,
  Moon,
  Stamp,
  RefreshCcw,
  Bell,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface PDFSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PDFSettingsDialog({
  open,
  onOpenChange,
}: PDFSettingsDialogProps) {
  const { t } = useTranslation();
  const {
    viewMode,
    fitMode,
    zoom,
    showThumbnails,
    showOutline,
    showAnnotations,
    isDarkMode,
    isPresentationMode,
    caseSensitiveSearch,
    selectedAnnotationColor,
    selectedStrokeWidth,
    showPageNavigationInBottomBar,
    setViewMode,
    setFitMode,
    setZoom,
    toggleThumbnails,
    toggleOutline,
    toggleAnnotations,
    toggleDarkMode,
    togglePresentationMode,
    toggleCaseSensitiveSearch,
    setSelectedAnnotationColor,
    setSelectedStrokeWidth,
    toggleBottomBarMode,
    themeMode,
    setThemeMode,
    enableSplashScreen,
    toggleSplashScreen,
    pdfLoadingAnimation,
    setPdfLoadingAnimation,
    watermarkText,
    watermarkColor,
    watermarkOpacity,
    watermarkSize,
    watermarkGapX,
    watermarkGapY,
    watermarkRotation,
    setWatermarkText,
    setWatermarkColor,
    setWatermarkOpacity,
    setWatermarkSize,
    setWatermarkGapX,
    setWatermarkGapY,
    setWatermarkRotation,
    autoCheckUpdate,
    toggleAutoCheckUpdate,
    scrollSensitivity,
    scrollThreshold,
    scrollDebounce,
    enableSmoothScrolling,
    invertWheel,
    zoomStep,
    sidebarInitialWidth,
    setScrollSensitivity,
    setScrollThreshold,
    setScrollDebounce,
    setEnableSmoothScrolling,
    setInvertWheel,
    setZoomStep,
    setSidebarInitialWidth,
  } = usePDFStore();

  const [localViewMode, setLocalViewMode] = useState<ViewMode>(viewMode);
  const [localFitMode, setLocalFitMode] = useState<FitMode>(fitMode);
  const [localZoom, setLocalZoom] = useState<number>(zoom);
  const [localShowThumbnails, setLocalShowThumbnails] =
    useState<boolean>(showThumbnails);
  const [localShowOutline, setLocalShowOutline] =
    useState<boolean>(showOutline);
  const [localShowAnnotations, setLocalShowAnnotations] =
    useState<boolean>(showAnnotations);
  const [localIsDarkMode, setLocalIsDarkMode] = useState<boolean>(isDarkMode);
  const [localIsPresentationMode, setLocalIsPresentationMode] =
    useState<boolean>(isPresentationMode);
  const [localCaseSensitiveSearch, setLocalCaseSensitiveSearch] =
    useState<boolean>(caseSensitiveSearch);
  const [localSelectedAnnotationColor, setLocalSelectedAnnotationColor] =
    useState<string>(selectedAnnotationColor);
  const [localSelectedStrokeWidth, setLocalSelectedStrokeWidth] =
    useState<number>(selectedStrokeWidth);
  const [
    localShowPageNavigationInBottomBar,
    setLocalShowPageNavigationInBottomBar,
  ] = useState<boolean>(showPageNavigationInBottomBar);
  const [localThemeMode, setLocalThemeMode] = useState<
    "light" | "dark" | "sepia" | "auto"
  >(themeMode);
  const [localEnableSplashScreen, setLocalEnableSplashScreen] =
    useState<boolean>(enableSplashScreen);
  const [localPdfLoadingAnimation, setLocalPdfLoadingAnimation] = useState<
    "spinner" | "pulse" | "bar"
  >(pdfLoadingAnimation);

  // Watermark local state
  const [localWatermarkText, setLocalWatermarkText] =
    useState<string>(watermarkText);
  const [localWatermarkColor, setLocalWatermarkColor] =
    useState<string>(watermarkColor);
  const [localWatermarkOpacity, setLocalWatermarkOpacity] =
    useState<number>(watermarkOpacity);
  const [localWatermarkSize, setLocalWatermarkSize] =
    useState<number>(watermarkSize);
  const [localWatermarkGapX, setLocalWatermarkGapX] =
    useState<number>(watermarkGapX);
  const [localWatermarkGapY, setLocalWatermarkGapY] =
    useState<number>(watermarkGapY);
  const [localWatermarkRotation, setLocalWatermarkRotation] =
    useState<number>(watermarkRotation);

  // Scrolling & Interaction local state
  const [localScrollSensitivity, setLocalScrollSensitivity] =
    useState<number>(scrollSensitivity);
  const [localScrollThreshold, setLocalScrollThreshold] =
    useState<number>(scrollThreshold);
  const [localScrollDebounce, setLocalScrollDebounce] =
    useState<number>(scrollDebounce);
  const [localEnableSmoothScrolling, setLocalEnableSmoothScrolling] =
    useState<boolean>(enableSmoothScrolling);
  const [localInvertWheel, setLocalInvertWheel] =
    useState<boolean>(invertWheel);
  const [localZoomStep, setLocalZoomStep] = useState<number>(zoomStep);
  const [localSidebarInitialWidth, setLocalSidebarInitialWidth] =
    useState<number>(sidebarInitialWidth);

  const [localAutoCheckUpdate, setLocalAutoCheckUpdate] =
    useState<boolean>(autoCheckUpdate);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);

  const handleThemeChange = (mode: "light" | "dark" | "sepia" | "auto") => {
    setLocalThemeMode(mode);
    setThemeMode(mode);
    setLocalIsDarkMode(mode === "dark");
  };

  const handleSave = () => {
    if (localViewMode !== viewMode) {
      setViewMode(localViewMode);
    }
    if (localFitMode !== fitMode) {
      setFitMode(localFitMode);
    }
    if (localZoom !== zoom) {
      setZoom(localZoom);
    }

    if (localShowThumbnails !== showThumbnails) {
      toggleThumbnails();
    }
    if (localShowOutline !== showOutline) {
      toggleOutline();
    }
    if (localShowAnnotations !== showAnnotations) {
      toggleAnnotations();
    }

    if (localIsDarkMode !== isDarkMode) {
      toggleDarkMode();
    }
    if (localIsPresentationMode !== isPresentationMode) {
      togglePresentationMode();
    }

    if (localCaseSensitiveSearch !== caseSensitiveSearch) {
      toggleCaseSensitiveSearch();
    }

    if (localSelectedAnnotationColor !== selectedAnnotationColor) {
      setSelectedAnnotationColor(localSelectedAnnotationColor);
    }
    if (localSelectedStrokeWidth !== selectedStrokeWidth) {
      setSelectedStrokeWidth(localSelectedStrokeWidth);
    }

    if (localShowPageNavigationInBottomBar !== showPageNavigationInBottomBar) {
      toggleBottomBarMode();
    }

    if (localThemeMode !== themeMode) {
      setThemeMode(localThemeMode);
    }

    if (localEnableSplashScreen !== enableSplashScreen) {
      toggleSplashScreen();
    }

    if (localPdfLoadingAnimation !== pdfLoadingAnimation) {
      setPdfLoadingAnimation(localPdfLoadingAnimation);
    }

    if (localWatermarkText !== watermarkText) {
      setWatermarkText(localWatermarkText);
    }
    if (localWatermarkColor !== watermarkColor) {
      setWatermarkColor(localWatermarkColor);
    }
    if (localWatermarkOpacity !== watermarkOpacity) {
      setWatermarkOpacity(localWatermarkOpacity);
    }
    if (localWatermarkSize !== watermarkSize) {
      setWatermarkSize(localWatermarkSize);
    }
    if (localWatermarkGapX !== watermarkGapX) {
      setWatermarkGapX(localWatermarkGapX);
    }
    if (localWatermarkGapY !== watermarkGapY) {
      setWatermarkGapY(localWatermarkGapY);
    }
    if (localWatermarkRotation !== watermarkRotation) {
      setWatermarkRotation(localWatermarkRotation);
    }

    if (localScrollSensitivity !== scrollSensitivity) {
      setScrollSensitivity(localScrollSensitivity);
    }
    if (localScrollThreshold !== scrollThreshold) {
      setScrollThreshold(localScrollThreshold);
    }
    if (localScrollDebounce !== scrollDebounce) {
      setScrollDebounce(localScrollDebounce);
    }
    if (localEnableSmoothScrolling !== enableSmoothScrolling) {
      setEnableSmoothScrolling(localEnableSmoothScrolling);
    }
    if (localInvertWheel !== invertWheel) {
      setInvertWheel(localInvertWheel);
    }
    if (localZoomStep !== zoomStep) {
      setZoomStep(localZoomStep);
    }
    if (localSidebarInitialWidth !== sidebarInitialWidth) {
      setSidebarInitialWidth(localSidebarInitialWidth);
    }

    if (localAutoCheckUpdate !== autoCheckUpdate) {
      toggleAutoCheckUpdate();
    }

    if (isTauri()) {
      void saveDesktopPreferences({
        themeMode: localThemeMode === "sepia" ? "light" : localThemeMode,
        enableSplashScreen: localEnableSplashScreen,
        pdfLoadingAnimation: localPdfLoadingAnimation,
      });
    }

    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset local state to current store values
    setLocalViewMode(viewMode);
    setLocalFitMode(fitMode);
    setLocalZoom(zoom);
    setLocalShowThumbnails(showThumbnails);
    setLocalShowOutline(showOutline);
    setLocalShowAnnotations(showAnnotations);
    setLocalIsDarkMode(isDarkMode);
    setLocalIsPresentationMode(isPresentationMode);
    setLocalCaseSensitiveSearch(caseSensitiveSearch);
    setLocalSelectedAnnotationColor(selectedAnnotationColor);
    setLocalSelectedStrokeWidth(selectedStrokeWidth);
    setLocalShowPageNavigationInBottomBar(showPageNavigationInBottomBar);
    setLocalThemeMode(themeMode);
    setLocalEnableSplashScreen(enableSplashScreen);
    setLocalPdfLoadingAnimation(pdfLoadingAnimation);
    setLocalWatermarkText(watermarkText);
    setLocalWatermarkColor(watermarkColor);
    setLocalWatermarkOpacity(watermarkOpacity);
    setLocalWatermarkSize(watermarkSize);
    setLocalWatermarkGapX(watermarkGapX);
    setLocalWatermarkGapY(watermarkGapY);
    setLocalWatermarkRotation(watermarkRotation);
    setLocalScrollSensitivity(scrollSensitivity);
    setLocalScrollThreshold(scrollThreshold);
    setLocalScrollDebounce(scrollDebounce);
    setLocalEnableSmoothScrolling(enableSmoothScrolling);
    setLocalInvertWheel(invertWheel);
    setLocalZoomStep(zoomStep);
    setLocalSidebarInitialWidth(sidebarInitialWidth);
    setLocalAutoCheckUpdate(autoCheckUpdate);
    setUpdateStatus(null);

    onOpenChange(false);
  };

  const handleResetDefaults = () => {
    setLocalViewMode("single");
    setLocalFitMode("custom");
    setLocalZoom(1.0);
    setLocalShowThumbnails(false);
    setLocalShowOutline(false);
    setLocalShowAnnotations(false);
    setLocalIsDarkMode(false);
    setLocalIsPresentationMode(false);
    setLocalCaseSensitiveSearch(false);
    setLocalSelectedAnnotationColor("#ffff00");
    setLocalSelectedStrokeWidth(2);
    setLocalShowPageNavigationInBottomBar(true);
    setLocalThemeMode("auto");
    setLocalEnableSplashScreen(true);
    setLocalPdfLoadingAnimation("spinner");
    setLocalWatermarkText("");
    setLocalWatermarkColor("rgba(0, 0, 0, 0.1)");
    setLocalWatermarkOpacity(0.2);
    setLocalWatermarkSize(48);
    setLocalWatermarkGapX(1.5);
    setLocalWatermarkGapY(4.0);
    setLocalWatermarkRotation(-45);
    setLocalScrollSensitivity(150);
    setLocalScrollThreshold(10);
    setLocalScrollDebounce(150);
    setLocalEnableSmoothScrolling(true);
    setLocalInvertWheel(false);
    setLocalZoomStep(0.1);
    setLocalSidebarInitialWidth(240);
    setLocalAutoCheckUpdate(false);
  };

  const handleZoomSliderChange = (value: number[]) => {
    if (value[0] >= 0.5 && value[0] <= 3.0) {
      setLocalZoom(value[0]);
    }
  };

  const fitModeLabel = (mode: FitMode) => {
    switch (mode) {
      case "fitWidth":
        return t("settings.option.fit_width");
      case "fitPage":
        return t("settings.option.fit_page");
      default:
        return t("settings.option.custom");
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const status = await checkForAppUpdates();
      setUpdateStatus(status);
    } catch (error) {
      console.error(error);
      setUpdateStatus({ available: false, error: t("message.check_error") });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleTestNotification = () => {
    void sendSystemNotification({
      title: t("app.title"),
      body: t("message.notification_test"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t("settings.title")}
          </DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="flex flex-wrap gap-2 w-full mb-4 h-auto flex-shrink-0 bg-muted/40 p-1 rounded-xl">
            <TabsTrigger
              value="display"
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg"
            >
              <Monitor className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">
                {t("settings.section.display")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="interface"
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg"
            >
              <Layout className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">
                {t("settings.section.interface")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="scrolling"
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">
                {t("settings.section.scrolling")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg"
            >
              <Palette className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">
                {t("settings.section.appearance")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="watermark"
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg"
            >
              <Stamp className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">
                {t("settings.section.watermark")}
              </span>
            </TabsTrigger>
            {isTauri() && (
              <TabsTrigger
                value="system"
                className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg"
              >
                <RefreshCcw className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs">
                  {t("settings.section.system")}
                </span>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-1 pb-2">
            {/* Display section */}
            <TabsContent value="display" className="space-y-4 mt-0">
              <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.view_mode")}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={localViewMode === "single" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalViewMode("single")}
                    className="flex-1"
                  >
                    {t("settings.option.single_page")}
                  </Button>
                  <Button
                    type="button"
                    variant={
                      localViewMode === "continuous" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setLocalViewMode("continuous")}
                    className="flex-1"
                  >
                    {t("settings.option.continuous")}
                  </Button>
                  <Button
                    type="button"
                    variant={
                      localViewMode === "twoPage" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setLocalViewMode("twoPage")}
                    className="flex-1"
                  >
                    {t("settings.option.two_page")}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.fit_mode")}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      localFitMode === "fitWidth" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setLocalFitMode("fitWidth")}
                    className="flex-1"
                  >
                    {t("settings.option.fit_width")}
                  </Button>
                  <Button
                    type="button"
                    variant={localFitMode === "fitPage" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFitMode("fitPage")}
                    className="flex-1"
                  >
                    {t("settings.option.fit_page")}
                  </Button>
                  <Button
                    type="button"
                    variant={localFitMode === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFitMode("custom")}
                    className="flex-1"
                  >
                    {t("settings.option.custom")}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-right">
                  {t("settings.option.current", {
                    mode: fitModeLabel(localFitMode),
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{t("settings.option.default_zoom")}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-muted">
                  {Math.round(localZoom * 100)}%
                </span>
              </div>
              <Slider
                min={0.5}
                max={3.0}
                step={0.05}
                value={[localZoom]}
                onValueChange={handleZoomSliderChange}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
                <span>300%</span>
              </div>
              </div>
            </TabsContent>

            {/* Interface section */}
            <TabsContent value="interface" className="space-y-4 mt-0">
              <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.side_panels")}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                    <span>{t("settings.option.show_thumbnails")}</span>
                    <Checkbox
                      checked={localShowThumbnails}
                      onCheckedChange={(checked) =>
                        setLocalShowThumbnails(!!checked)
                      }
                    />
                  </Label>
                  <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                    <span>{t("settings.option.show_outline")}</span>
                    <Checkbox
                      checked={localShowOutline}
                      onCheckedChange={(checked) =>
                        setLocalShowOutline(!!checked)
                      }
                    />
                  </Label>
                  <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                    <span>{t("settings.option.show_annotations")}</span>
                    <Checkbox
                      checked={localShowAnnotations}
                      onCheckedChange={(checked) =>
                        setLocalShowAnnotations(!!checked)
                      }
                    />
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.behavior")}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                    <span>{t("settings.option.case_sensitive")}</span>
                    <Checkbox
                      checked={localCaseSensitiveSearch}
                      onCheckedChange={(checked) =>
                        setLocalCaseSensitiveSearch(!!checked)
                      }
                    />
                  </Label>
                  <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                    <span>{t("settings.option.bottom_bar")}</span>
                    <Checkbox
                      checked={localShowPageNavigationInBottomBar}
                      onCheckedChange={(checked) =>
                        setLocalShowPageNavigationInBottomBar(!!checked)
                      }
                    />
                  </Label>
                </div>
              </div>
              </div>
            </TabsContent>

            {/* Scrolling section */}
            <TabsContent value="scrolling" className="space-y-4 mt-0">
              <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.scroll_behavior")}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                    <span>{t("settings.option.enable_smooth_scrolling")}</span>
                    <Checkbox
                      checked={localEnableSmoothScrolling}
                      onCheckedChange={(checked) =>
                        setLocalEnableSmoothScrolling(!!checked)
                      }
                    />
                  </Label>
                  <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                    <span>{t("settings.option.invert_wheel")}</span>
                    <Checkbox
                      checked={localInvertWheel}
                      onCheckedChange={(checked) =>
                        setLocalInvertWheel(!!checked)
                      }
                    />
                  </Label>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>{t("settings.option.scroll_sensitivity")}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {localScrollSensitivity}
                    </span>
                  </div>
                  <Slider
                    min={50}
                    max={500}
                    step={10}
                    value={[localScrollSensitivity]}
                    onValueChange={(values) =>
                      setLocalScrollSensitivity(values[0])
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t("settings.hint.scroll_sensitivity")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.interaction_tweaks")}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>{t("settings.option.scroll_debounce")}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {localScrollDebounce}ms
                    </span>
                  </div>
                  <Slider
                    min={50}
                    max={500}
                    step={10}
                    value={[localScrollDebounce]}
                    onValueChange={(values) =>
                      setLocalScrollDebounce(values[0])
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>{t("settings.option.scroll_threshold")}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {localScrollThreshold}px
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[localScrollThreshold]}
                    onValueChange={(values) =>
                      setLocalScrollThreshold(values[0])
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>{t("settings.option.zoom_step")}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {Math.round(localZoomStep * 100)}%
                    </span>
                  </div>
                  <Slider
                    min={0.05}
                    max={0.5}
                    step={0.05}
                    value={[localZoomStep]}
                    onValueChange={(values) => setLocalZoomStep(values[0])}
                  />
                </div>
              </div>
              </div>
            </TabsContent>

            {/* Appearance section */}
            <TabsContent value="appearance" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-2 items-start">
                <div className="space-y-4 rounded-xl border bg-card/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.option.theme")}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        {t("settings.option.color_theme")}
                      </span>
                      <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/70 p-1">
                        <Button
                          type="button"
                          variant={
                            localThemeMode === "light" ? "default" : "ghost"
                          }
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleThemeChange("light")}
                        >
                          <Sun className="mr-1 h-3.5 w-3.5" />
                          {t("settings.option.light")}
                        </Button>
                        <Button
                          type="button"
                          variant={
                            localThemeMode === "dark" ? "default" : "ghost"
                          }
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleThemeChange("dark")}
                        >
                          <Moon className="mr-1 h-3.5 w-3.5" />
                          {t("settings.option.dark")}
                        </Button>
                        <Button
                          type="button"
                          variant={
                            localThemeMode === "sepia" ? "default" : "ghost"
                          }
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleThemeChange("sepia")}
                        >
                          <div className="mr-1 h-3.5 w-3.5 rounded-full border border-amber-900/20 bg-[#f4ecd8]" />
                          {t("settings.option.sepia")}
                        </Button>
                        <Button
                          type="button"
                          variant={
                            localThemeMode === "auto" ? "default" : "ghost"
                          }
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleThemeChange("auto")}
                        >
                          <Monitor className="mr-1 h-3.5 w-3.5" />
                          {t("settings.option.auto")}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2 text-sm font-medium">
                        <span>{t("settings.option.presentation")}</span>
                        <Checkbox
                          checked={localIsPresentationMode}
                          onCheckedChange={(checked) =>
                            setLocalIsPresentationMode(!!checked)
                          }
                        />
                      </Label>
                      <Label className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2 text-sm font-medium">
                        <span>{t("settings.option.splash_screen")}</span>
                        <Checkbox
                          checked={localEnableSplashScreen}
                          onCheckedChange={(checked) =>
                            setLocalEnableSplashScreen(!!checked)
                          }
                        />
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        {t("settings.option.loading_animation")}
                      </span>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Button
                          type="button"
                          variant={
                            localPdfLoadingAnimation === "spinner"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="w-full"
                          onClick={() => setLocalPdfLoadingAnimation("spinner")}
                        >
                          {t("settings.option.loading_type.spinner")}
                        </Button>
                        <Button
                          type="button"
                          variant={
                            localPdfLoadingAnimation === "pulse"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="w-full"
                          onClick={() => setLocalPdfLoadingAnimation("pulse")}
                        >
                          {t("settings.option.loading_type.pulse")}
                        </Button>
                        <Button
                          type="button"
                          variant={
                            localPdfLoadingAnimation === "bar" ? "default" : "outline"
                          }
                          size="sm"
                          className="w-full"
                          onClick={() => setLocalPdfLoadingAnimation("bar")}
                        >
                          {t("settings.option.loading_type.bar")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border bg-card/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("settings.option.annotation_defaults")}
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between gap-3 text-sm font-medium">
                      <span>{t("settings.option.highlight_color")}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 w-5 rounded-full border shadow-sm"
                          style={{ backgroundColor: localSelectedAnnotationColor }}
                        />
                        <Input
                          type="color"
                          className="h-8 w-20 cursor-pointer border bg-background"
                          value={localSelectedAnnotationColor}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setLocalSelectedAnnotationColor(e.target.value)
                          }
                        />
                      </div>
                    </label>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <span>{t("settings.option.stroke_width")}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                          {localSelectedStrokeWidth}px
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[localSelectedStrokeWidth]}
                        onValueChange={(values) =>
                          setLocalSelectedStrokeWidth(values[0])
                        }
                      />
                      <div className="mt-2 h-2 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(localSelectedStrokeWidth / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Watermark section */}
            <TabsContent value="watermark" className="space-y-4 mt-0">
              <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.watermark_text")}
                </div>
                <Input
                  value={localWatermarkText}
                  onChange={(e) => setLocalWatermarkText(e.target.value)}
                  placeholder={t("settings.placeholder.watermark_text")}
                  className="h-8"
                />
                <p className="text-[10px] text-muted-foreground">
                  {t("settings.hint.watermark_text")}
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("settings.option.watermark_style")}
                </div>
                <div className="p-3 rounded-lg border bg-card space-y-4">
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-xs">
                      {t("settings.option.watermark_color")}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border shadow-sm"
                        style={{ backgroundColor: localWatermarkColor }}
                      />
                      <Input
                        type="color"
                        className="h-8 w-16 p-1 cursor-pointer"
                        value={localWatermarkColor}
                        onChange={(e) => setLocalWatermarkColor(e.target.value)}
                      />
                    </div>
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>{t("settings.option.opacity")}</span>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {Math.round(localWatermarkOpacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[localWatermarkOpacity]}
                      onValueChange={(values) =>
                        setLocalWatermarkOpacity(values[0])
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>{t("settings.option.size")}</span>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {localWatermarkSize}px
                      </span>
                    </div>
                    <Slider
                      min={12}
                      max={128}
                      step={4}
                      value={[localWatermarkSize]}
                      onValueChange={(values) =>
                        setLocalWatermarkSize(values[0])
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>{t("settings.option.watermark_gap_x")}</span>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        x{localWatermarkGapX}
                      </span>
                    </div>
                    <Slider
                      min={0.5}
                      max={5.0}
                      step={0.1}
                      value={[localWatermarkGapX]}
                      onValueChange={(values) =>
                        setLocalWatermarkGapX(values[0])
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>{t("settings.option.watermark_gap_y")}</span>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        x{localWatermarkGapY}
                      </span>
                    </div>
                    <Slider
                      min={1.0}
                      max={10.0}
                      step={0.5}
                      value={[localWatermarkGapY]}
                      onValueChange={(values) =>
                        setLocalWatermarkGapY(values[0])
                      }
                    />
                  </div>
                </div>
              </div>
              </div>
            </TabsContent>

            {/* System section */}
            {isTauri() && (
              <TabsContent value="system" className="space-y-4 mt-0">
                <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("settings.option.behavior")}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border/50 transition-colors">
                      <span>{t("settings.option.auto_check_update")}</span>
                      <Checkbox
                        checked={localAutoCheckUpdate}
                        onCheckedChange={(checked) =>
                          setLocalAutoCheckUpdate(!!checked)
                        }
                      />
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("settings.section.system")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCheckUpdate}
                      disabled={isCheckingUpdate}
                      className="justify-between"
                    >
                      {isCheckingUpdate ? (
                        <>
                          {t("update.checking")}
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        </>
                      ) : (
                        <>
                          {t("settings.option.check_update")}
                          <RefreshCcw className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>

                    {updateStatus && (
                      <div
                        className={`text-xs p-2 rounded border ${
                          updateStatus.available
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                            : "bg-muted"
                        }`}
                      >
                        {updateStatus.available ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 font-medium">
                              <AlertCircle className="h-3 w-3" />
                              {t("message.update_available", {
                                version: updateStatus.version,
                              })}
                            </div>
                            {updateStatus.body && (
                              <p className="opacity-90">{updateStatus.body}</p>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              className="h-6 text-xs w-full mt-1"
                              onClick={() => installAppUpdate()}
                            >
                              Install & Relaunch
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {updateStatus.error || t("message.no_update")}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestNotification}
                      className="justify-between"
                    >
                      {t("settings.option.test_notification")}
                      <Bell className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full gap-2 mt-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            {t("settings.button.reset")}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t("settings.button.cancel")}
            </Button>
            <Button type="button" onClick={handleSave}>
              {t("settings.button.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
