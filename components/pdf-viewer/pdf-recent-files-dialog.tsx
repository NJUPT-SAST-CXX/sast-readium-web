"use client";

import { usePDFStore, type RecentFile } from "@/lib/pdf-store";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  FileText,
  Trash2,
  ExternalLink,
  FolderOpen,
  Clipboard,
  Edit3,
} from "lucide-react";
import {
  isTauri,
  readPdfFileAtPath,
  revealInFileManager,
  renameFile,
  deleteFile,
} from "@/lib/tauri-bridge";

interface PDFRecentFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenRecentFile?: (file: File) => void;
}

export function PDFRecentFilesDialog({
  open,
  onOpenChange,
  onOpenRecentFile,
}: PDFRecentFilesDialogProps) {
  const { t, i18n } = useTranslation();
  const {
    recentFiles,
    removeRecentFile,
    clearRecentFiles,
    setCurrentPDF,
    updateRecentFileByPath,
  } = usePDFStore();
  const isDesktop = isTauri();

  const handleOpenFile = async (entry: RecentFile) => {
    try {
      let file: File | null = null;

      if (isTauri() && entry.path) {
        file = await readPdfFileAtPath(entry.path, entry.name);
      } else {
        const response = await fetch(entry.url);
        const blob = await response.blob();
        file = new File([blob], entry.name || "document.pdf", {
          type: "application/pdf",
        });
      }

      if (!file) return;

      if (onOpenRecentFile) {
        onOpenRecentFile(file);
      } else {
        setCurrentPDF(file);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to open recent file:", error);
    }
  };

  const handleCopyPath = async (entry: RecentFile) => {
    if (!entry.path) return;
    try {
      await navigator.clipboard.writeText(entry.path);
    } catch (error) {
      console.error("Failed to copy file path:", error);
    }
  };

  const handleRename = async (entry: RecentFile) => {
    if (!isDesktop || !entry.path) return;

    const currentName = entry.name || "document.pdf";
    const input = window.prompt(t("menu.file.rename"), currentName);
    if (!input) return;

    const trimmed = input.trim();
    if (!trimmed || trimmed === currentName) return;

    const ok = await renameFile(entry.path, trimmed);
    if (!ok) return;

    const oldPath = entry.path;
    const lastSlash = Math.max(
      oldPath.lastIndexOf("/"),
      oldPath.lastIndexOf("\\")
    );
    const dir = lastSlash >= 0 ? oldPath.slice(0, lastSlash + 1) : "";
    const newFullPath = `${dir}${trimmed}`;

    updateRecentFileByPath(oldPath, { name: trimmed, path: newFullPath });
  };

  const handleDeleteFile = async (entry: RecentFile) => {
    if (!isDesktop || !entry.path) return;

    const confirmed = window.confirm(t("recent.delete"));
    if (!confirmed) return;

    const ok = await deleteFile(entry.path);
    if (!ok) return;

    removeRecentFile(entry.url);
  };

  const formatLastOpened = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(i18n.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("recent.title")}
          </DialogTitle>
          <DialogDescription>
            {recentFiles.length > 0 ? t("recent.title") : t("recent.empty")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] min-h-[200px]">
          {recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-20" />
              <p>{t("recent.empty")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {recentFiles.map((file) => (
                <div
                  key={file.url}
                  className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {typeof file.readingProgress === "number"
                          ? `${Math.round(file.readingProgress)}% · `
                          : ""}
                        {formatLastOpened(file.lastOpened)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenFile(file)}
                      title={t("recent.open")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {isDesktop && file.path && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyPath(file)}
                          title={t("menu.file.copy_path")}
                        >
                          <Clipboard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFile(file)}
                          title={t("recent.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRename(file)}
                          title={t("menu.file.rename")}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            void revealInFileManager(file.path as string)
                          }
                          title={t("menu.file.reveal_in_file_manager")}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeRecentFile(file.url)}
                      title={t("recent.remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {recentFiles.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearRecentFiles}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t("recent.clear_all")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
