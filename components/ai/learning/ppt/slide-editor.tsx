"use client";

/**
 * Slide Editor Component
 *
 * Interactive slide editor with element manipulation and styling.
 */

import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Type,
  Square,
  Circle,
  ArrowRight,
  Image as ImageIcon,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { usePPTStore } from "@/lib/ai/learning";
import type {
  SlideElement,
  SlideElementType,
  SlideElementStyle,
  ShapeType,
} from "@/lib/ai/learning/types";

interface SlideEditorProps {
  presentationId: string;
  slideId: string;
  onSelectElement?: (elementId: string | null) => void;
}

export function SlideEditor({
  presentationId,
  slideId,
  onSelectElement,
}: SlideEditorProps) {
  const { t } = useTranslation();
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const presentations = usePPTStore((state) => state.presentations);
  const updateElement = usePPTStore((state) => state.updateElement);
  const deleteElement = usePPTStore((state) => state.deleteElement);
  const bringForward = usePPTStore((state) => state.bringForward);
  const sendBackward = usePPTStore((state) => state.sendBackward);
  const addElement = usePPTStore((state) => state.addElement);

  const presentation = presentations[presentationId];
  const slide = presentation?.slides.find((s) => s.id === slideId);
  const selectedElement = slide?.elements.find(
    (e) => e.id === selectedElementId
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setSelectedElementId(null);
        onSelectElement?.(null);
      }
    },
    [onSelectElement]
  );

  const handleElementClick = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation();
      setSelectedElementId(elementId);
      onSelectElement?.(elementId);
    },
    [onSelectElement]
  );

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, element: SlideElement) => {
      if (element.locked) return;
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - element.position.x,
        y: e.clientY - element.position.y,
      });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedElementId || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(
        0,
        Math.min(e.clientX - dragStart.x, rect.width - 100)
      );
      const newY = Math.max(
        0,
        Math.min(e.clientY - dragStart.y, rect.height - 50)
      );

      updateElement(presentationId, slideId, selectedElementId, {
        position: { x: newX, y: newY },
      });
    },
    [
      isDragging,
      selectedElementId,
      dragStart,
      presentationId,
      slideId,
      updateElement,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleAddElement = useCallback(
    (type: SlideElementType, shapeType?: ShapeType) => {
      const element: Omit<SlideElement, "id"> = {
        type,
        content:
          type === "text"
            ? "New Text"
            : type === "shape"
              ? shapeType || "rectangle"
              : "",
        position: { x: 100, y: 100 },
        size: {
          width: type === "text" ? 200 : 100,
          height: type === "text" ? 50 : 100,
        },
        style: {
          fontSize: 16,
          fontWeight: "normal",
          fontStyle: "normal",
          textAlign: "left",
          color: "#000000",
          backgroundColor: type === "shape" ? "#e5e7eb" : "transparent",
          borderColor: "#d1d5db",
          borderWidth: type === "shape" ? 1 : 0,
          opacity: 1,
        },
        zIndex: slide ? slide.elements.length + 1 : 1,
      };

      addElement(presentationId, slideId, element);
    },
    [presentationId, slideId, addElement, slide]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElementId) return;
    deleteElement(presentationId, slideId, selectedElementId);
    setSelectedElementId(null);
    onSelectElement?.(null);
  }, [
    selectedElementId,
    presentationId,
    slideId,
    deleteElement,
    onSelectElement,
  ]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedElementId || !selectedElement) return;
    // Duplicate by creating a new element with same properties but offset position
    const newElement: Omit<SlideElement, "id"> = {
      ...selectedElement,
      position: {
        x: selectedElement.position.x + 20,
        y: selectedElement.position.y + 20,
      },
      zIndex: slide ? slide.elements.length + 1 : 1,
    };
    addElement(presentationId, slideId, newElement);
  }, [
    selectedElementId,
    selectedElement,
    presentationId,
    slideId,
    addElement,
    slide,
  ]);

  const handleMoveLayer = useCallback(
    (direction: "up" | "down") => {
      if (!selectedElementId) return;
      if (direction === "up") {
        bringForward(presentationId, slideId, selectedElementId);
      } else {
        sendBackward(presentationId, slideId, selectedElementId);
      }
    },
    [selectedElementId, presentationId, slideId, bringForward, sendBackward]
  );

  if (!presentation || !slide) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("learning.common.error")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border-b bg-muted/30 overflow-x-auto">
          {/* Add Elements */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAddElement("text")}
                >
                  <Type className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t("learning.ppt.editor.add_text")}
              </TooltipContent>
            </Tooltip>
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Square className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {t("learning.ppt.editor.add_shape")}
                </TooltipContent>
              </Tooltip>
              <PopoverContent className="w-40 p-2">
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddElement("shape", "rectangle")}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddElement("shape", "circle")}
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddElement("shape", "arrow")}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddElement("shape", "line")}
                  >
                    <div className="w-4 h-0.5 bg-current" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAddElement("image")}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t("learning.ppt.editor.add_image")}
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Selection actions */}
          {selectedElement && (
            <>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleDuplicateSelected}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("learning.ppt.editor.duplicate")}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("learning.ppt.editor.delete")}
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Layer controls */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleMoveLayer("up")}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("learning.ppt.editor.bring_forward")}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleMoveLayer("down")}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("learning.ppt.editor.send_backward")}
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Lock toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedElement.locked ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      updateElement(
                        presentationId,
                        slideId,
                        selectedElementId!,
                        {
                          locked: !selectedElement.locked,
                        }
                      )
                    }
                  >
                    {selectedElement.locked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {selectedElement.locked
                    ? t("learning.ppt.editor.unlock")
                    : t("learning.ppt.editor.lock")}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>

      {/* Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative bg-white m-4 rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundColor:
              slide.backgroundColor || presentation.theme.backgroundColor,
            aspectRatio: "16/9",
            maxHeight: "calc(100vh - 200px)",
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Slide Elements */}
          {[...slide.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <ElementRenderer
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                onClick={(e) => handleElementClick(e, element.id)}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
              />
            ))}
        </div>

        {/* Properties Panel */}
        {selectedElement && (
          <ElementPropertiesPanel
            presentationId={presentationId}
            slideId={slideId}
            element={selectedElement}
          />
        )}
      </div>
    </div>
  );
}

// Element Renderer
function ElementRenderer({
  element,
  isSelected,
  onClick,
  onMouseDown,
}: {
  element: SlideElement;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: element.position.x,
    top: element.position.y,
    width: element.size.width,
    height: element.size.height,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    opacity: element.style.opacity,
    cursor: element.locked ? "not-allowed" : "move",
    userSelect: "none",
  };

  const innerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    fontSize: element.style.fontSize,
    fontWeight: element.style.fontWeight,
    fontStyle: element.style.fontStyle,
    textAlign: element.style.textAlign,
    color: element.style.color,
    backgroundColor: element.style.backgroundColor,
    borderColor: element.style.borderColor,
    borderWidth: element.style.borderWidth,
    borderStyle: element.style.borderWidth ? "solid" : "none",
    borderRadius: element.style.borderRadius,
    display: "flex",
    alignItems: "center",
    justifyContent:
      element.style.textAlign === "center"
        ? "center"
        : element.style.textAlign === "right"
          ? "flex-end"
          : "flex-start",
    padding: element.type === "text" ? "8px" : undefined,
    overflow: "hidden",
  };

  return (
    <div
      style={style}
      className={cn(
        "group",
        isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {element.type === "text" && (
        <div style={innerStyle}>{element.content}</div>
      )}
      {element.type === "shape" && (
        <div
          style={{
            ...innerStyle,
            borderRadius:
              element.content === "circle" ? "50%" : element.style.borderRadius,
          }}
        />
      )}
      {element.type === "image" && (
        <div style={innerStyle}>
          {element.content ? (
            // eslint-disable-next-line @next/next/no-img-element -- Dynamic user content (base64/blob URLs)
            <img
              src={element.content}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Resize handles (shown when selected) */}
      {isSelected && !element.locked && (
        <>
          <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-sm cursor-se-resize" />
          <div className="absolute -left-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-sm cursor-sw-resize" />
          <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-sm cursor-ne-resize" />
          <div className="absolute -left-1 -top-1 w-3 h-3 bg-blue-500 rounded-sm cursor-nw-resize" />
        </>
      )}
    </div>
  );
}

// Properties Panel
function ElementPropertiesPanel({
  presentationId,
  slideId,
  element,
}: {
  presentationId: string;
  slideId: string;
  element: SlideElement;
}) {
  const { t } = useTranslation();
  const updateElement = usePPTStore((state) => state.updateElement);

  const updateStyle = useCallback(
    (updates: Partial<SlideElementStyle>) => {
      updateElement(presentationId, slideId, element.id, {
        style: { ...element.style, ...updates },
      });
    },
    [presentationId, slideId, element.id, element.style, updateElement]
  );

  return (
    <ScrollArea className="w-48 sm:w-64 border-l bg-muted/30">
      <div className="p-3 sm:p-4">
        <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">
          {t("learning.ppt.editor.properties")}
        </h3>

        {/* Content (for text) */}
        {element.type === "text" && (
          <div className="space-y-4 mb-4">
            <div>
              <Label className="text-xs">{t("learning.ppt.editor.text")}</Label>
              <Textarea
                value={element.content}
                onChange={(e) =>
                  updateElement(presentationId, slideId, element.id, {
                    content: e.target.value,
                  })
                }
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Position & Size */}
        <div className="space-y-3 mb-4">
          <h4 className="text-xs font-medium text-muted-foreground">
            {t("learning.ppt.editor.position")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={Math.round(element.position.x)}
                onChange={(e) =>
                  updateElement(presentationId, slideId, element.id, {
                    position: {
                      ...element.position,
                      x: Number(e.target.value),
                    },
                  })
                }
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={Math.round(element.position.y)}
                onChange={(e) =>
                  updateElement(presentationId, slideId, element.id, {
                    position: {
                      ...element.position,
                      y: Number(e.target.value),
                    },
                  })
                }
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">W</Label>
              <Input
                type="number"
                value={Math.round(element.size.width)}
                onChange={(e) =>
                  updateElement(presentationId, slideId, element.id, {
                    size: { ...element.size, width: Number(e.target.value) },
                  })
                }
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">H</Label>
              <Input
                type="number"
                value={Math.round(element.size.height)}
                onChange={(e) =>
                  updateElement(presentationId, slideId, element.id, {
                    size: { ...element.size, height: Number(e.target.value) },
                  })
                }
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Typography (for text) */}
        {element.type === "text" && (
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-medium text-muted-foreground">
              {t("learning.ppt.editor.typography")}
            </h4>
            <div>
              <Label className="text-xs">
                {t("learning.ppt.editor.font_size")}
              </Label>
              <Slider
                value={[element.style.fontSize || 16]}
                onValueChange={([value]) => updateStyle({ fontSize: value })}
                min={8}
                max={72}
                step={1}
                className="mt-2"
              />
              <span className="text-xs text-muted-foreground">
                {element.style.fontSize}px
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                variant={
                  element.style.fontWeight === "bold" ? "default" : "outline"
                }
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  updateStyle({
                    fontWeight:
                      element.style.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={
                  element.style.fontStyle === "italic" ? "default" : "outline"
                }
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  updateStyle({
                    fontStyle:
                      element.style.fontStyle === "italic"
                        ? "normal"
                        : "italic",
                  })
                }
              >
                <Italic className="w-4 h-4" />
              </Button>
            </div>
            <ToggleGroup
              type="single"
              value={element.style.textAlign || "left"}
              onValueChange={(value) => {
                if (value)
                  updateStyle({
                    textAlign: value as "left" | "center" | "right",
                  });
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="left" aria-label="Align left">
                <AlignLeft className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Align center">
                <AlignCenter className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Align right">
                <AlignRight className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {/* Colors */}
        <div className="space-y-3 mb-4">
          <h4 className="text-xs font-medium text-muted-foreground">
            {t("learning.ppt.editor.colors")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">
                {t("learning.ppt.editor.text_color")}
              </Label>
              <Input
                type="color"
                value={element.style.color || "#000000"}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="h-8 p-1 cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-xs">
                {t("learning.ppt.editor.background")}
              </Label>
              <Input
                type="color"
                value={element.style.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  updateStyle({ backgroundColor: e.target.value })
                }
                className="h-8 p-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Border */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            {t("learning.ppt.editor.border")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">
                {t("learning.ppt.editor.border_color")}
              </Label>
              <Input
                type="color"
                value={element.style.borderColor || "#d1d5db"}
                onChange={(e) => updateStyle({ borderColor: e.target.value })}
                className="h-8 p-1 cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-xs">
                {t("learning.ppt.editor.border_width")}
              </Label>
              <Input
                type="number"
                value={element.style.borderWidth || 0}
                onChange={(e) =>
                  updateStyle({ borderWidth: Number(e.target.value) })
                }
                min={0}
                max={10}
                className="h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">
              {t("learning.ppt.editor.border_radius")}
            </Label>
            <Slider
              value={[element.style.borderRadius || 0]}
              onValueChange={([value]) => updateStyle({ borderRadius: value })}
              min={0}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-3 mt-4">
          <h4 className="text-xs font-medium text-muted-foreground">
            {t("learning.ppt.editor.opacity")}
          </h4>
          <Slider
            value={[(element.style.opacity || 1) * 100]}
            onValueChange={([value]) => updateStyle({ opacity: value / 100 })}
            min={0}
            max={100}
            step={1}
          />
          <span className="text-xs text-muted-foreground">
            {Math.round((element.style.opacity || 1) * 100)}%
          </span>
        </div>
      </div>
    </ScrollArea>
  );
}
