"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Subscript,
  Superscript,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export interface FloatingToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onBold: () => void;
  onItalic: () => void;
  onStrikethrough: () => void;
  onCode: () => void;
  onLink: () => void;
  onHighlight: () => void;
  onSubscript?: () => void;
  onSuperscript?: () => void;
  onComment?: () => void;
  selectedText?: string;
}

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: () => void;
  active?: boolean;
}

export function FloatingToolbar({
  isVisible,
  position,
  onBold,
  onItalic,
  onStrikethrough,
  onCode,
  onLink,
  onHighlight,
  onSubscript,
  onSuperscript,
  onComment,
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Adjust position to stay within viewport using useMemo
  const calculatedPosition = useMemo(() => {
    if (!isVisible) return position;

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : 768;
    const toolbarWidth = 280; // Approximate toolbar width
    const toolbarHeight = 40; // Approximate toolbar height

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + toolbarWidth / 2 > viewportWidth) {
      x = viewportWidth - toolbarWidth / 2 - 8;
    }
    if (x - toolbarWidth / 2 < 0) {
      x = toolbarWidth / 2 + 8;
    }

    // Adjust vertical position (show above selection if no room below)
    if (y + toolbarHeight > viewportHeight) {
      y = position.y - toolbarHeight - 8;
    }

    return { x, y };
  }, [isVisible, position]);

  const buttons: ToolbarButton[] = [
    { icon: Bold, label: "加粗", shortcut: "⌘B", action: onBold },
    { icon: Italic, label: "斜体", shortcut: "⌘I", action: onItalic },
    { icon: Strikethrough, label: "删除线", action: onStrikethrough },
    { icon: Code, label: "行内代码", action: onCode },
    { icon: Link, label: "链接", shortcut: "⌘K", action: onLink },
    { icon: Highlighter, label: "高亮", action: onHighlight },
  ];

  if (onSubscript) {
    buttons.push({ icon: Subscript, label: "下标", action: onSubscript });
  }
  if (onSuperscript) {
    buttons.push({ icon: Superscript, label: "上标", action: onSuperscript });
  }

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "fixed z-50 flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
      style={{
        left: calculatedPosition.x,
        top: calculatedPosition.y,
        transform: "translateX(-50%)",
      }}
    >
      {buttons.map((button) => (
        <Tooltip key={button.label}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded hover:bg-accent transition-colors",
                button.active && "bg-accent"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                button.action();
              }}
            >
              <button.icon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            <p className="text-xs">
              {button.label}
              {button.shortcut && (
                <span className="ml-2 text-muted-foreground">
                  {button.shortcut}
                </span>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}

      {onComment && (
        <>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onComment();
                }}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
              <p className="text-xs">添加评论</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}

// Hook to manage floating toolbar visibility
export function useFloatingToolbar() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setIsVisible(false);
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setIsVisible(false);
      setSelectedText("");
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position toolbar above the selection
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
    setSelectedText(text);
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    setSelectedText("");
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return {
    isVisible,
    position,
    selectedText,
    hide,
  };
}
