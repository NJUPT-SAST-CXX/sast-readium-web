"use client";

import type React from "react";
import { useState } from "react";
import { usePDFStore, ViewMode, FitMode } from "@/lib/pdf-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PDFSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PDFSettingsDialog({ open, onOpenChange }: PDFSettingsDialogProps) {
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
  } = usePDFStore();

  const [localViewMode, setLocalViewMode] = useState<ViewMode>(viewMode);
  const [localFitMode, setLocalFitMode] = useState<FitMode>(fitMode);
  const [localZoom, setLocalZoom] = useState<number>(zoom);
  const [localShowThumbnails, setLocalShowThumbnails] = useState<boolean>(showThumbnails);
  const [localShowOutline, setLocalShowOutline] = useState<boolean>(showOutline);
  const [localShowAnnotations, setLocalShowAnnotations] = useState<boolean>(showAnnotations);
  const [localIsDarkMode, setLocalIsDarkMode] = useState<boolean>(isDarkMode);
  const [localIsPresentationMode, setLocalIsPresentationMode] = useState<boolean>(isPresentationMode);
  const [localCaseSensitiveSearch, setLocalCaseSensitiveSearch] = useState<boolean>(caseSensitiveSearch);
  const [localSelectedAnnotationColor, setLocalSelectedAnnotationColor] = useState<string>(selectedAnnotationColor);
  const [localSelectedStrokeWidth, setLocalSelectedStrokeWidth] = useState<number>(selectedStrokeWidth);

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

    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleZoomSliderChange = (value: number[]) => {
    if (value[0] >= 0.5 && value[0] <= 3.0) {
      setLocalZoom(value[0]);
    }
  };

  const fitModeLabel = (mode: FitMode) => {
    switch (mode) {
      case "fitWidth":
        return "Fit to width";
      case "fitPage":
        return "Fit to page";
      default:
        return "Custom";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Viewer Settings</DialogTitle>
          <DialogDescription>
            Configure how the PDF viewer behaves and looks. These preferences are saved for future sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Display section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Display</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">View mode</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={localViewMode === "single" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalViewMode("single")}
                  >
                    Single page
                  </Button>
                  <Button
                    type="button"
                    variant={localViewMode === "continuous" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalViewMode("continuous")}
                  >
                    Continuous
                  </Button>
                  <Button
                    type="button"
                    variant={localViewMode === "twoPage" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalViewMode("twoPage")}
                  >
                    Two page
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Fit mode</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={localFitMode === "fitWidth" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFitMode("fitWidth")}
                  >
                    Fit width
                  </Button>
                  <Button
                    type="button"
                    variant={localFitMode === "fitPage" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFitMode("fitPage")}
                  >
                    Fit page
                  </Button>
                  <Button
                    type="button"
                    variant={localFitMode === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFitMode("custom")}
                  >
                    Custom
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Current: {fitModeLabel(localFitMode)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Default zoom</span>
                <span className="text-[11px] font-normal text-muted-foreground/80">{Math.round(localZoom * 100)}%</span>
              </div>
              <Slider
                min={0.5}
                max={3.0}
                step={0.05}
                value={[localZoom]}
                onValueChange={handleZoomSliderChange}
              />
            </div>
          </section>

          {/* Panels / navigation section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Panels & navigation</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Side panels</div>
                <div className="space-y-1 text-xs">
                  <Label className="flex items-center justify-between gap-2">
                    <span>Thumbnails</span>
                    <Checkbox
                      checked={localShowThumbnails}
                      onCheckedChange={(checked) => setLocalShowThumbnails(!!checked)}
                    />
                  </Label>
                  <Label className="flex items-center justify-between gap-2">
                    <span>Document outline</span>
                    <Checkbox
                      checked={localShowOutline}
                      onCheckedChange={(checked) => setLocalShowOutline(!!checked)}
                    />
                  </Label>
                  <Label className="flex items-center justify-between gap-2">
                    <span>Annotations panel</span>
                    <Checkbox
                      checked={localShowAnnotations}
                      onCheckedChange={(checked) => setLocalShowAnnotations(!!checked)}
                    />
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Navigation & search</div>
                <div className="space-y-1 text-xs">
                  <Label className="flex items-center justify-between gap-2">
                    <span>Case sensitive search</span>
                    <Checkbox
                      checked={localCaseSensitiveSearch}
                      onCheckedChange={(checked) => setLocalCaseSensitiveSearch(!!checked)}
                    />
                  </Label>
                </div>
              </div>
            </div>
          </section>

          {/* Appearance section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Appearance</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Theme</div>
                <div className="space-y-1 text-xs">
                  <Label className="flex items-center justify-between gap-2">
                    <span>Dark mode</span>
                    <Checkbox
                      checked={localIsDarkMode}
                      onCheckedChange={(checked) => setLocalIsDarkMode(!!checked)}
                    />
                  </Label>
                  <Label className="flex items-center justify-between gap-2">
                    <span>Presentation mode</span>
                    <Checkbox
                      checked={localIsPresentationMode}
                      onCheckedChange={(checked) => setLocalIsPresentationMode(!!checked)}
                    />
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Annotation defaults</div>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between gap-2">
                    <span>Highlight color</span>
                    <Input
                      type="color"
                      className="h-6 w-12 p-0 border-0 bg-transparent"
                      value={localSelectedAnnotationColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLocalSelectedAnnotationColor(e.target.value)
                      }
                    />
                  </label>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Stroke width</span>
                      <span className="text-[11px] text-muted-foreground/80">{localSelectedStrokeWidth}px</span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[localSelectedStrokeWidth]}
                      onValueChange={(values) => setLocalSelectedStrokeWidth(values[0])}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
