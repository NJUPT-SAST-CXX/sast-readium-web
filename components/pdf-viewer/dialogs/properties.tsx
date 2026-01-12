"use client";

import { usePDFStore } from "@/lib/pdf";
import { updatePDFMetadata, PDFMetadataUpdate } from "@/lib/pdf";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Calendar, Database, Pencil, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface PDFPropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpdate?: (newFile: File) => void;
}

export function PDFPropertiesDialog({
  open,
  onOpenChange,
  onFileUpdate,
}: PDFPropertiesDialogProps) {
  const { t } = useTranslation();
  const { metadata, numPages, currentPDF, setCurrentPDF } = usePDFStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
  });

  useEffect(() => {
    if (metadata?.info) {
      setFormData({
        title: (metadata.info.Title as string) || "",
        author: (metadata.info.Author as string) || "",
        subject: (metadata.info.Subject as string) || "",
        keywords: (metadata.info.Keywords as string) || "",
        creator: (metadata.info.Creator as string) || "",
        producer: (metadata.info.Producer as string) || "",
      });
    }
  }, [metadata, open]);

  if (!metadata) return null;

  const handleSave = async () => {
    if (!currentPDF) return;

    try {
      setIsSaving(true);

      const updates: PDFMetadataUpdate = {
        title: formData.title,
        author: formData.author,
        subject: formData.subject,
        keywords: undefined,
        creator: formData.creator,
        producer: formData.producer,
      };

      // Split keywords string into array
      if (formData.keywords) {
        updates.keywords = formData.keywords.split(/[,;]\s*/).filter(Boolean);
      }

      const newFile = await updatePDFMetadata(currentPDF, updates);

      // Update store and notify parent
      setCurrentPDF(newFile);
      if (onFileUpdate) {
        onFileUpdate(newFile);
      }

      setIsEditing(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save metadata:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t("properties.unknown");
    try {
      // Handle PDF date format: D:YYYYMMDDHHmmSS...
      if (dateStr.startsWith("D:")) {
        const year = dateStr.substring(2, 6);
        const month = dateStr.substring(6, 8);
        const day = dateStr.substring(8, 10);
        const hour = dateStr.substring(10, 12);
        const minute = dateStr.substring(12, 14);
        return new Date(
          `${year}-${month}-${day}T${hour}:${minute}:00`
        ).toLocaleString();
      }
      const parsed = new Date(dateStr);
      if (!Number.isNaN(parsed.valueOf())) {
        return parsed.toLocaleString();
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return t("properties.unknown");
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const info = metadata.info || {};

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setIsEditing(false);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-between pr-8">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("properties.title")}
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8"
              >
                <Pencil className="h-4 w-4 mr-1" />
                {t("menu.edit.label") || "Edit"}
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>{t("properties.filename")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t("properties.title")}
              </h4>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>{t("properties.title")}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  ) : (
                    <div
                      className="text-sm font-medium truncate"
                      title={info.Title as string}
                    >
                      {(info.Title as string) || "-"}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>{t("properties.author")}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                    />
                  ) : (
                    <div
                      className="text-sm font-medium truncate"
                      title={info.Author as string}
                    >
                      {(info.Author as string) || "-"}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>{t("properties.subject")}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                    />
                  ) : (
                    <div
                      className="text-sm font-medium truncate"
                      title={info.Subject as string}
                    >
                      {(info.Subject as string) || "-"}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>{t("properties.keywords")}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.keywords}
                      onChange={(e) =>
                        setFormData({ ...formData, keywords: e.target.value })
                      }
                    />
                  ) : (
                    <div
                      className="text-sm font-medium truncate"
                      title={info.Keywords as string}
                    >
                      {(info.Keywords as string) || "-"}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Technical Info */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                {t("properties.creator")}
              </h4>
              <div className="grid gap-4 text-sm">
                <div className="grid grid-cols-3 items-center">
                  <div className="text-muted-foreground">
                    {t("properties.filesize")}
                  </div>
                  <div className="col-span-2 font-medium">
                    {formatFileSize(metadata.contentLength)}
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center">
                  <div className="text-muted-foreground">
                    {t("properties.page_count")}
                  </div>
                  <div className="col-span-2 font-medium">
                    {t("properties.n_pages", { count: numPages })}
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center">
                  <div className="text-muted-foreground">
                    {t("properties.pdf_version")}
                  </div>
                  <div className="col-span-2 font-medium">
                    {(info.PDFFormatVersion as string) || "-"}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{t("properties.creator")}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.creator}
                      onChange={(e) =>
                        setFormData({ ...formData, creator: e.target.value })
                      }
                    />
                  ) : (
                    <div
                      className="text-sm font-medium truncate"
                      title={info.Creator as string}
                    >
                      {(info.Creator as string) || "-"}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>{t("properties.producer")}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.producer}
                      onChange={(e) =>
                        setFormData({ ...formData, producer: e.target.value })
                      }
                    />
                  ) : (
                    <div
                      className="text-sm font-medium truncate"
                      title={info.Producer as string}
                    >
                      {(info.Producer as string) || "-"}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Dates */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t("properties.creation_date")}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-muted-foreground">
                  {metadata.fileCreatedAt
                    ? t("properties.file_created_at")
                    : t("properties.creation_date")}
                </div>
                <div className="col-span-2 font-medium">
                  {formatDate(
                    metadata.fileCreatedAt || (info.CreationDate as string)
                  )}
                </div>

                <div className="text-muted-foreground">
                  {metadata.fileModifiedAt
                    ? t("properties.file_modified_at")
                    : t("properties.mod_date")}
                </div>
                <div className="col-span-2 font-medium">
                  {formatDate(
                    metadata.fileModifiedAt || (info.ModDate as string)
                  )}
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        {isEditing && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              {t("menu.edit.undo") || "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("menu.file.save") || "Save"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
