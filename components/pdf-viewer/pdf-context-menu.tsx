"use client";

import { Button } from "@/components/ui/button";
import { usePDFStore } from "@/lib/pdf-store";
import { useTranslation } from "react-i18next";
import {
  Copy,
  Highlighter,
  MessageSquarePlus,
  Bookmark,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PDFContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  selectedText?: string;
  currentPage: number;
  onHighlight?: () => void;
  onAddComment?: () => void;
}

export function PDFContextMenu({
  x,
  y,
  visible,
  onClose,
  selectedText,
  currentPage,
  onHighlight,
  onAddComment,
}: PDFContextMenuProps) {
  const { t } = useTranslation();
  const { addBookmark } = usePDFStore();

  if (!visible) return null;

  const handleCopy = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        toast.success(t("context_menu.copied"));
      } catch {
        toast.error(t("context_menu.copy_failed"));
      }
    }
    onClose();
  };

  const handleHighlight = () => {
    if (onHighlight) {
      onHighlight();
    }
    toast.info(t("context_menu.highlight_mode"));
    onClose();
  };

  const handleAddComment = () => {
    if (onAddComment) {
      onAddComment();
    }
    toast.info(t("context_menu.comment_mode"));
    onClose();
  };

  const handleAddBookmark = () => {
    addBookmark(
      currentPage,
      `${t("context_menu.bookmark_prefix")} ${currentPage}`
    );
    toast.success(t("context_menu.bookmark_added"));
    onClose();
  };

  // Adjust menu position to stay within viewport
  const menuWidth = 180;
  const menuHeight = 200;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 400;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 600;

  let adjustedX = x;
  let adjustedY = y;

  if (x + menuWidth > viewportWidth - 16) {
    adjustedX = viewportWidth - menuWidth - 16;
  }
  if (y + menuHeight > viewportHeight - 16) {
    adjustedY = viewportHeight - menuHeight - 16;
  }
  if (adjustedX < 16) adjustedX = 16;
  if (adjustedY < 16) adjustedY = 16;

  return (
    <div
      className={cn(
        "fixed z-[100] bg-popover border border-border rounded-lg shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
      style={{
        left: adjustedX,
        top: adjustedY,
        width: menuWidth,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          {t("context_menu.title")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="p-1">
        {selectedText && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-9"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            <span className="text-sm">{t("context_menu.copy")}</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={handleHighlight}
        >
          <Highlighter className="h-4 w-4" />
          <span className="text-sm">{t("context_menu.highlight")}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={handleAddComment}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="text-sm">{t("context_menu.add_comment")}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={handleAddBookmark}
        >
          <Bookmark className="h-4 w-4" />
          <span className="text-sm">{t("context_menu.add_bookmark")}</span>
        </Button>
      </div>
    </div>
  );
}
