"use client";

import { useState, useCallback } from "react";
import { GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Block } from "./types";

export interface BlockHandleProps {
  block: Block;
  isHovered: boolean;
  isDragging: boolean;
  onDragStart: (block: Block) => void;
  onDragEnd: () => void;
  onAddBlockBefore: (block: Block) => void;
  onAddBlockAfter: (block: Block) => void;
  onOpenMenu: (block: Block, position: { x: number; y: number }) => void;
}

export function BlockHandle({
  block,
  isHovered,
  isDragging,
  onDragStart,
  onDragEnd,
  onAddBlockAfter,
  onOpenMenu,
}: BlockHandleProps) {
  const [showAddButton, setShowAddButton] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", block.id);
      onDragStart(block);
    },
    [block, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      onOpenMenu(block, { x: rect.left, y: rect.bottom + 4 });
    },
    [block, onOpenMenu]
  );

  const handleAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAddBlockAfter(block);
    },
    [block, onAddBlockAfter]
  );

  return (
    <div
      className={cn(
        "absolute -left-8 top-0 flex items-center gap-0.5 h-6 transition-opacity duration-150",
        isHovered || isDragging ? "opacity-100" : "opacity-0",
        "group/handle"
      )}
      onMouseEnter={() => setShowAddButton(true)}
      onMouseLeave={() => setShowAddButton(false)}
    >
      {/* Add button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded hover:bg-muted transition-all",
              showAddButton ? "opacity-100" : "opacity-0"
            )}
            onClick={handleAddClick}
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={4}>
          <p className="text-xs">添加块</p>
        </TooltipContent>
      </Tooltip>

      {/* Drag handle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            draggable
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded cursor-grab active:cursor-grabbing",
              "hover:bg-muted transition-colors",
              isDragging && "bg-muted"
            )}
            onClick={handleClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={4}>
          <p className="text-xs">拖动移动 · 点击打开菜单</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
