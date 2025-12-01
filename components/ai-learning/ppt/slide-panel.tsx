"use client";

/**
 * Slide Panel Component
 *
 * Sidebar panel showing slide thumbnails with reordering and management.
 */

import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { usePPTStore } from "@/lib/ai/learning";
import type { Slide, SlideLayout } from "@/lib/ai/learning/types";

interface SlidePanelProps {
  presentationId: string;
  selectedSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
}

export function SlidePanel({
  presentationId,
  selectedSlideId,
  onSelectSlide,
}: SlidePanelProps) {
  const { t } = useTranslation();

  const presentations = usePPTStore((state) => state.presentations);
  const addSlide = usePPTStore((state) => state.addSlide);
  const deleteSlide = usePPTStore((state) => state.deleteSlide);
  const duplicateSlide = usePPTStore((state) => state.duplicateSlide);
  const reorderSlides = usePPTStore((state) => state.reorderSlides);

  const presentation = presentations[presentationId];
  const slides = presentation?.slides || [];

  const handleAddSlide = useCallback(
    (layout: SlideLayout = "content") => {
      addSlide(presentationId, {
        layout,
        title: "",
        elements: [],
        notes: "",
        order: slides.length,
      });
    },
    [presentationId, addSlide, slides.length]
  );

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      deleteSlide(presentationId, slideId);
      // Select another slide if the deleted one was selected
      if (slideId === selectedSlideId && slides.length > 1) {
        const index = slides.findIndex((s) => s.id === slideId);
        const nextSlide = slides[index === 0 ? 1 : index - 1];
        if (nextSlide) {
          onSelectSlide(nextSlide.id);
        }
      }
    },
    [presentationId, deleteSlide, selectedSlideId, slides, onSelectSlide]
  );

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      duplicateSlide(presentationId, slideId);
    },
    [presentationId, duplicateSlide]
  );

  const handleMoveSlide = useCallback(
    (slideId: string, direction: "up" | "down") => {
      const index = slides.findIndex((s) => s.id === slideId);
      if (index === -1) return;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= slides.length) return;

      const newOrder = [...slides.map((s) => s.id)];
      [newOrder[index], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[index],
      ];
      reorderSlides(presentationId, newOrder);
    },
    [presentationId, slides, reorderSlides]
  );

  if (!presentation) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-48 border-r bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">
          {t("learning.ppt.slides_count")}: {slides.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAddSlide("title")}>
              {t("learning.ppt.layouts.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddSlide("content")}>
              {t("learning.ppt.layouts.content")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddSlide("two-column")}>
              {t("learning.ppt.layouts.two_column")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddSlide("image-focus")}>
              {t("learning.ppt.layouts.image_focus")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddSlide("blank")}>
              {t("learning.ppt.layouts.blank")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Slide Thumbnails */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            slide={slide}
            index={index}
            isSelected={slide.id === selectedSlideId}
            backgroundColor={
              slide.backgroundColor || presentation.theme.backgroundColor
            }
            onSelect={() => onSelectSlide(slide.id)}
            onDelete={() => handleDeleteSlide(slide.id)}
            onDuplicate={() => handleDuplicateSlide(slide.id)}
            onMoveUp={() => handleMoveSlide(slide.id, "up")}
            onMoveDown={() => handleMoveSlide(slide.id, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < slides.length - 1}
            canDelete={slides.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  backgroundColor: string;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
}

function SlideThumbnail({
  slide,
  index,
  isSelected,
  backgroundColor,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  canDelete,
}: SlideThumbnailProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-md overflow-hidden",
        "transition-all hover:ring-2 hover:ring-blue-300",
        isSelected && "ring-2 ring-blue-500"
      )}
      onClick={onSelect}
    >
      {/* Slide Number */}
      <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
        {index + 1}
      </div>

      {/* Actions */}
      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Button variant="secondary" size="icon" className="h-6 w-6">
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              {t("learning.ppt.editor.duplicate")}
            </DropdownMenuItem>
            {canMoveUp && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                {t("learning.ppt.editor.move_up")}
              </DropdownMenuItem>
            )}
            {canMoveDown && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                {t("learning.ppt.editor.move_down")}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("learning.common.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Thumbnail Preview */}
      <div className="aspect-video w-full rounded" style={{ backgroundColor }}>
        {/* Simple element preview */}
        <div className="w-full h-full p-1 flex flex-col">
          {slide.elements.slice(0, 3).map((element) => (
            <div
              key={element.id}
              className="text-[6px] text-gray-600 truncate"
              style={{
                color: element.style.color,
              }}
            >
              {element.type === "text" ? element.content.slice(0, 20) : ""}
            </div>
          ))}
          {slide.title &&
            !slide.elements.some((e) => e.content === slide.title) && (
              <div className="text-[8px] font-medium text-gray-800 truncate text-center mt-1">
                {slide.title}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
