"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Highlighter,
  MessageSquare,
  Square,
  Type,
  Trash2,
  Pen,
  Undo2,
  Redo2,
  Download,
  Upload,
  Stamp,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { usePDFStore, AnnotationStamp } from "@/lib/pdf";
import { AnnotationColorPicker } from "./annotation-color-picker";
import { AnnotationStamps } from "./annotation-stamps";
import { cn } from "@/lib/utils";

interface PDFAnnotationsToolbarProps {
  onAnnotationTypeSelect: (
    type: "highlight" | "comment" | "shape" | "text" | "drawing" | null
  ) => void;
  selectedType: "highlight" | "comment" | "shape" | "text" | "drawing" | null;
  onStampSelect: (stamp: AnnotationStamp) => void;
  className?: string;
  onOpenSignatureDialog?: () => void;
}

export function PDFAnnotationsToolbar({
  onAnnotationTypeSelect,
  selectedType,
  onStampSelect,
  className,
  onOpenSignatureDialog,
}: PDFAnnotationsToolbarProps) {
  const { t } = useTranslation();
  const {
    annotations,
    removeAnnotation,
    currentPage,
    undoAnnotation,
    redoAnnotation,
    canUndo,
    canRedo,
    selectedAnnotationColor,
    setSelectedAnnotationColor,
    selectedStrokeWidth,
    setSelectedStrokeWidth,
    exportAnnotations,
    importAnnotations,
  } = usePDFStore();

  const [showStamps, setShowStamps] = useState(false);

  const currentPageAnnotations = annotations.filter(
    (a) => a.pageNumber === currentPage
  );

  const handleExport = () => {
    const data = exportAnnotations();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        if (data) {
          importAnnotations(data);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col border-t border-border bg-background",
          className
        )}
      >
        <div className="flex items-center gap-2 p-2">
          <div className="text-xs font-medium text-muted-foreground">
            {t("annotations.toolbar.title")}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedType === "highlight" ? "default" : "ghost"}
                size="icon"
                onClick={() =>
                  onAnnotationTypeSelect(
                    selectedType === "highlight" ? null : "highlight"
                  )
                }
                className="h-8 w-8"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t("annotations.toolbar.highlight")}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedType === "comment" ? "default" : "ghost"}
                size="icon"
                onClick={() =>
                  onAnnotationTypeSelect(
                    selectedType === "comment" ? null : "comment"
                  )
                }
                className="h-8 w-8"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.comment")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedType === "shape" ? "default" : "ghost"}
                size="icon"
                onClick={() =>
                  onAnnotationTypeSelect(
                    selectedType === "shape" ? null : "shape"
                  )
                }
                className="h-8 w-8"
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.shape")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedType === "text" ? "default" : "ghost"}
                size="icon"
                onClick={() =>
                  onAnnotationTypeSelect(
                    selectedType === "text" ? null : "text"
                  )
                }
                className="h-8 w-8"
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.text")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedType === "drawing" ? "default" : "ghost"}
                size="icon"
                onClick={() =>
                  onAnnotationTypeSelect(
                    selectedType === "drawing" ? null : "drawing"
                  )
                }
                className="h-8 w-8"
              >
                <Pen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.drawing")}</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={undoAnnotation}
                disabled={!canUndo()}
                className="h-8 w-8"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.undo")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={redoAnnotation}
                disabled={!canRedo()}
                className="h-8 w-8"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.redo")}</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <AnnotationColorPicker
            selectedColor={selectedAnnotationColor}
            onColorChange={setSelectedAnnotationColor}
          />

          {(selectedType === "drawing" || selectedType === "shape") && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("annotations.toolbar.width_label")}
                </span>
                <Slider
                  value={[selectedStrokeWidth]}
                  onValueChange={([value]) => setSelectedStrokeWidth(value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground w-6">
                  {t("annotations.toolbar.stroke_width_value", {
                    value: selectedStrokeWidth,
                  })}
                </span>
              </div>
            </>
          )}

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showStamps ? "default" : "ghost"}
                size="icon"
                onClick={() => setShowStamps(!showStamps)}
                className="h-8 w-8"
              >
                <Stamp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.stamps")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSignatureDialog}
                className="h-8 w-8"
              >
                <PenLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t("annotations.toolbar.signature")}
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.export")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImport}
                className="h-8 w-8"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("annotations.toolbar.import")}</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("annotations.toolbar.count", {
                count: currentPageAnnotations.length,
              })}
            </span>

            {currentPageAnnotations.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      currentPageAnnotations.forEach((a) =>
                        removeAnnotation(a.id)
                      );
                    }}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("annotations.toolbar.clear_page")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {showStamps && (
          <div className="border-t border-border p-3">
            <AnnotationStamps
              onStampSelect={(stamp) => {
                onStampSelect(stamp);
                setShowStamps(false);
              }}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
