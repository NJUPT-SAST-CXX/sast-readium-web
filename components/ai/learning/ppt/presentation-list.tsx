"use client";

/**
 * Presentation List Component
 *
 * Displays list of presentations with actions and previews.
 */

import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Play,
  Presentation,
  Layers,
  Clock,
} from "lucide-react";
import { usePPTStore, exportToPPTX } from "@/lib/ai/learning";
import type { Presentation as PresentationType } from "@/lib/ai/learning/types";

interface PresentationListProps {
  onSelectPresentation?: (presentationId: string) => void;
  onCreatePresentation?: () => void;
  onPreview?: (presentationId: string) => void;
}

export function PresentationList({
  onSelectPresentation,
  onCreatePresentation,
  onPreview,
}: PresentationListProps) {
  const { t } = useTranslation();
  const presentations = usePPTStore((state) => state.presentations);
  const deletePresentation = usePPTStore((state) => state.deletePresentation);

  const presentationList = useMemo(() => {
    return Object.values(presentations).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }, [presentations]);

  const handleDelete = useCallback(
    (presentationId: string) => {
      deletePresentation(presentationId);
    },
    [deletePresentation]
  );

  const handleExport = useCallback(
    async (presentationId: string) => {
      const presentation = presentations[presentationId];
      if (!presentation) return;

      try {
        await exportToPPTX(presentation);
      } catch (error) {
        console.error("Failed to export presentation:", error);
      }
    },
    [presentations]
  );

  if (presentationList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
          <Presentation className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500" />
        </div>
        <h3 className="font-medium text-base sm:text-lg mb-1">
          {t("learning.common.empty")}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-xs">
          {t(
            "learning.ppt.empty_desc",
            "Create your first presentation to get started"
          )}
        </p>
        <Button onClick={onCreatePresentation} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("learning.ppt.create")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 shrink-0">
              <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">
                {presentationList.length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("learning.ppt.presentations")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 shrink-0">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">
                {presentationList.reduce((sum, p) => sum + p.slides.length, 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("learning.ppt.slides_count")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Button */}
      <Button
        onClick={onCreatePresentation}
        variant="outline"
        className="w-full gap-2 h-9 sm:h-10"
      >
        <Plus className="w-4 h-4" />
        {t("learning.ppt.create")}
      </Button>

      {/* Presentation List */}
      <div className="space-y-2 sm:space-y-3">
        {presentationList.map((presentation) => (
          <PresentationCard
            key={presentation.id}
            presentation={presentation}
            onSelect={() => onSelectPresentation?.(presentation.id)}
            onPreview={() => onPreview?.(presentation.id)}
            onExport={() => handleExport(presentation.id)}
            onDelete={() => handleDelete(presentation.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface PresentationCardProps {
  presentation: PresentationType;
  onSelect: () => void;
  onPreview: () => void;
  onExport: () => void;
  onDelete: () => void;
}

function PresentationCard({
  presentation,
  onSelect,
  onPreview,
  onExport,
  onDelete,
}: PresentationCardProps) {
  const { t } = useTranslation();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
      onClick={onSelect}
    >
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center shrink-0"
              style={{
                backgroundColor: presentation.theme.primaryColor + "20",
              }}
            >
              <Presentation
                className="w-4 h-4 sm:w-5 sm:h-5"
                style={{ color: presentation.theme.primaryColor }}
              />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base truncate">
                {presentation.title}
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {formatDate(presentation.updatedAt)}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t("learning.ppt.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                {t("learning.ppt.preview")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                {t("learning.ppt.export.title")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-4">
        {/* Mobile: stacked layout, Desktop: row layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2"
            >
              <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {presentation.slides.length} {t("learning.ppt.slides", "slides")}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] sm:text-xs px-1.5 sm:px-2"
              style={{
                borderColor: presentation.theme.primaryColor + "40",
                color: presentation.theme.primaryColor,
              }}
            >
              {presentation.theme.name}
            </Badge>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs flex-1 sm:flex-none"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
            >
              <Play className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">
                {t("learning.ppt.preview")}
              </span>
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs flex-1 sm:flex-none"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
            >
              <Download className="w-3 h-3 mr-1" />
              PPTX
            </Button>
          </div>
        </div>

        {/* Slide Thumbnails */}
        <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1">
          {presentation.slides.slice(0, 4).map((slide, index) => (
            <div
              key={slide.id}
              className="shrink-0 w-12 h-7 sm:w-16 sm:h-9 rounded border bg-white overflow-hidden"
              style={{
                backgroundColor:
                  slide.backgroundColor || presentation.theme.backgroundColor,
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-[5px] sm:text-[6px] text-muted-foreground p-0.5 sm:p-1 truncate">
                {slide.title || `Slide ${index + 1}`}
              </div>
            </div>
          ))}
          {presentation.slides.length > 4 && (
            <div className="shrink-0 w-12 h-7 sm:w-16 sm:h-9 rounded border bg-muted flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground">
              +{presentation.slides.length - 4}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
