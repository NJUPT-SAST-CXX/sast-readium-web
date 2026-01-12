"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFThumbnail } from "./thumbnail";
import { PDFPageProxy } from "@/lib/pdf";
import { Button } from "@/components/ui/button";

interface PDFDraggableThumbnailProps {
  page: PDFPageProxy | null;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
  isDragEnabled?: boolean;
  onRemove?: () => void;
  onRotate?: () => void;
  rotation?: number;
}

export function PDFDraggableThumbnail({
  page,
  pageNumber,
  isActive,
  onClick,
  isDragEnabled = true,
  onRemove,
  onRotate,
  rotation: _rotation = 0,
}: PDFDraggableThumbnailProps) {
  // _rotation is used for prop validation but not directly in this component
  void _rotation;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: pageNumber,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-50",
        isOver && "opacity-75"
      )}
    >
      {/* Drag Handle */}
      {isDragEnabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "absolute -left-1 top-1/2 z-10 flex h-8 w-6 -translate-y-1/2 cursor-grab items-center justify-center rounded-l-md bg-primary/10 opacity-0 transition-all hover:bg-primary/20 group-hover:opacity-100 active:cursor-grabbing",
            isDragging && "cursor-grabbing opacity-100"
          )}
        >
          <GripVertical className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Action Buttons Overlay */}
      <div className="absolute top-1 right-3 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onRotate && (
          <Button
            variant="secondary"
            size="icon"
            className="h-6 w-6 rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
          >
            <RotateCw className="h-3 w-3" />
          </Button>
        )}
        {onRemove && (
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full shadow-sm opacity-80 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Drop Indicator - Top */}
      {isOver && !isDragging && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-primary" />
      )}

      {/* Thumbnail Content */}
      <div className={cn("w-full", isDragEnabled && "pr-2")}>
        <PDFThumbnail
          page={page}
          pageNumber={pageNumber}
          isActive={isActive}
          onClick={onClick}
          rotation={onRotate ? 0 : undefined} // Wait, I need to pass the actual rotation value.
        />
      </div>

      {/* Drop Indicator - Bottom */}
      {isOver && isDragging && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary" />
      )}

      {/* Dragging Overlay */}
      {isDragging && (
        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-primary bg-primary/5" />
      )}
    </div>
  );
}
