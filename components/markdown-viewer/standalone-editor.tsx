"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText, FolderOpen, FilePlus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";

// ============================================================================
// Types
// ============================================================================

export interface StandaloneEditorProps {
  className?: string;
  initialContent?: string;
  initialFileName?: string;
  onSave?: (content: string, fileName: string) => void;
  onClose?: () => void;
}

// ============================================================================
// Standalone Markdown Editor Component
// ============================================================================

export function StandaloneMarkdownEditor({
  className,
  initialContent = "",
  initialFileName = "untitled.md",
  onSave,
  onClose,
}: StandaloneEditorProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState(initialFileName);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== originalContent);
  }, [content, originalContent]);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(content, fileName);
      setOriginalContent(content);
      setHasUnsavedChanges(false);
    } else {
      // Download file
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setOriginalContent(content);
      setHasUnsavedChanges(false);
    }
  }, [content, fileName, onSave]);

  // Handle save as
  const handleSaveAs = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  // Handle save dialog confirm
  const handleSaveDialogConfirm = useCallback(() => {
    handleSave();
    setShowSaveDialog(false);
  }, [handleSave]);

  // Handle new file
  const handleNew = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      setContent("");
      setFileName("untitled.md");
      setOriginalContent("");
    }
  }, [hasUnsavedChanges]);

  // Handle open file
  const handleOpen = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        setContent(text);
        setFileName(file.name);
        setOriginalContent(text);
      }
    };
    input.click();
  }, []);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose?.();
    }
  }, [hasUnsavedChanges, onClose]);

  // Handle unsaved dialog actions
  const handleUnsavedSave = useCallback(() => {
    handleSave();
    setShowUnsavedDialog(false);
    onClose?.();
  }, [handleSave, onClose]);

  const handleUnsavedDiscard = useCallback(() => {
    setShowUnsavedDialog(false);
    setContent("");
    setFileName("untitled.md");
    setOriginalContent("");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      } else if (isMod && e.key === "n") {
        e.preventDefault();
        handleNew();
      } else if (isMod && e.key === "o") {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleSaveAs, handleNew, handleOpen]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">
            {fileName}
            {hasUnsavedChanges && (
              <span className="text-muted-foreground"> •</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleNew}>
            <FilePlus className="h-4 w-4 mr-1" />
            {t("markdown.new", "New")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpen}>
            <FolderOpen className="h-4 w-4 mr-1" />
            {t("markdown.open", "Open")}
          </Button>
          <Button
            variant={hasUnsavedChanges ? "default" : "ghost"}
            size="sm"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-1" />
            {t("markdown.save_btn", "Save")}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          value={content}
          onChange={handleContentChange}
          onSave={handleSave}
          fileName={fileName}
          className="h-full border-0 rounded-none"
          defaultViewMode="split"
        />
      </div>

      {/* Save As Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("markdown.save_as", "Save As")}</DialogTitle>
            <DialogDescription>
              {t(
                "markdown.save_as_desc",
                "Enter a file name for your document."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filename">
                {t("markdown.filename", "File Name")}
              </Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="document.md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleSaveDialogConfirm}>
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("markdown.unsaved_title", "Unsaved Changes")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "markdown.unsaved_desc",
                "You have unsaved changes. Do you want to save them before continuing?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleUnsavedDiscard}>
              {t("markdown.discard", "Discard")}
            </Button>
            <Button onClick={handleUnsavedSave}>
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
