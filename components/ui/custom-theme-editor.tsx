"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Palette,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  MoreHorizontal,
  Check,
  Pencil,
  Eye,
  Sparkles,
  FileJson,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCustomThemeStore,
  CustomTheme,
  CustomThemeColors,
  DEFAULT_THEME_COLORS,
  BUILTIN_THEMES,
  applyCustomTheme,
} from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  isTauri,
  exportCustomThemesToFile,
  importCustomThemesFromFile,
} from "@/lib/platform";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

function ColorInput({ label, value, onChange, description }: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    onChange(localValue);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground cursor-help">
                  ?
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex gap-2">
        <div
          className="w-8 h-8 rounded border shrink-0"
          style={{ backgroundColor: localValue }}
        />
        <Input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className="h-8 text-xs font-mono"
          placeholder="oklch(0.5 0.1 200)"
        />
      </div>
    </div>
  );
}

interface ThemeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTheme?: CustomTheme | null;
  onSave: (theme: Omit<CustomTheme, "id" | "createdAt" | "updatedAt">) => void;
}

function ThemeEditorDialog({
  open,
  onOpenChange,
  editingTheme,
  onSave,
}: ThemeEditorDialogProps) {
  // Use a key to force remount when editingTheme changes
  const dialogKey = editingTheme?.id ?? "new";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemeEditorDialogContent
        key={dialogKey}
        editingTheme={editingTheme ?? null}
        onSave={onSave}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

function ThemeEditorDialogContent({
  editingTheme,
  onSave,
  onClose,
}: {
  editingTheme: CustomTheme | null;
  onSave: (theme: Omit<CustomTheme, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const [name, setName] = useState(editingTheme?.name ?? "");
  const [description, setDescription] = useState(
    editingTheme?.description ?? ""
  );
  const [radius, setRadius] = useState(
    editingTheme?.radius?.replace("rem", "") ?? "0.375"
  );
  const [colors, setColors] = useState<CustomThemeColors>(
    editingTheme?.colors ?? DEFAULT_THEME_COLORS
  );
  const [previewActive, setPreviewActive] = useState(false);

  const updateColor = useCallback(
    (key: keyof CustomThemeColors, value: string) => {
      setColors((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handlePreview = useCallback(() => {
    if (previewActive) {
      applyCustomTheme(null);
      setPreviewActive(false);
    } else {
      applyCustomTheme({
        id: "preview",
        name,
        description,
        colors,
        radius: `${radius}rem`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setPreviewActive(true);
    }
  }, [previewActive, name, description, colors, radius]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t("custom_theme.error.name_required"));
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      colors,
      radius: `${radius}rem`,
    });
    if (previewActive) {
      applyCustomTheme(null);
      setPreviewActive(false);
    }
    onClose();
  };

  const handleClose = () => {
    if (previewActive) {
      applyCustomTheme(null);
      setPreviewActive(false);
    }
    onClose();
  };

  const colorGroups = [
    {
      title: t("custom_theme.color_group.base"),
      colors: [
        {
          key: "background" as const,
          label: t("custom_theme.color.background"),
        },
        {
          key: "foreground" as const,
          label: t("custom_theme.color.foreground"),
        },
        { key: "card" as const, label: t("custom_theme.color.card") },
        {
          key: "cardForeground" as const,
          label: t("custom_theme.color.card_foreground"),
        },
        { key: "popover" as const, label: t("custom_theme.color.popover") },
        {
          key: "popoverForeground" as const,
          label: t("custom_theme.color.popover_foreground"),
        },
      ],
    },
    {
      title: t("custom_theme.color_group.primary"),
      colors: [
        { key: "primary" as const, label: t("custom_theme.color.primary") },
        {
          key: "primaryForeground" as const,
          label: t("custom_theme.color.primary_foreground"),
        },
        { key: "secondary" as const, label: t("custom_theme.color.secondary") },
        {
          key: "secondaryForeground" as const,
          label: t("custom_theme.color.secondary_foreground"),
        },
        { key: "accent" as const, label: t("custom_theme.color.accent") },
        {
          key: "accentForeground" as const,
          label: t("custom_theme.color.accent_foreground"),
        },
      ],
    },
    {
      title: t("custom_theme.color_group.utility"),
      colors: [
        { key: "muted" as const, label: t("custom_theme.color.muted") },
        {
          key: "mutedForeground" as const,
          label: t("custom_theme.color.muted_foreground"),
        },
        {
          key: "destructive" as const,
          label: t("custom_theme.color.destructive"),
        },
        {
          key: "destructiveForeground" as const,
          label: t("custom_theme.color.destructive_foreground"),
        },
        { key: "border" as const, label: t("custom_theme.color.border") },
        { key: "input" as const, label: t("custom_theme.color.input") },
        { key: "ring" as const, label: t("custom_theme.color.ring") },
      ],
    },
    {
      title: t("custom_theme.color_group.sidebar"),
      colors: [
        { key: "sidebar" as const, label: t("custom_theme.color.sidebar") },
        {
          key: "sidebarForeground" as const,
          label: t("custom_theme.color.sidebar_foreground"),
        },
        {
          key: "sidebarPrimary" as const,
          label: t("custom_theme.color.sidebar_primary"),
        },
        {
          key: "sidebarPrimaryForeground" as const,
          label: t("custom_theme.color.sidebar_primary_foreground"),
        },
        {
          key: "sidebarAccent" as const,
          label: t("custom_theme.color.sidebar_accent"),
        },
        {
          key: "sidebarAccentForeground" as const,
          label: t("custom_theme.color.sidebar_accent_foreground"),
        },
        {
          key: "sidebarBorder" as const,
          label: t("custom_theme.color.sidebar_border"),
        },
        {
          key: "sidebarRing" as const,
          label: t("custom_theme.color.sidebar_ring"),
        },
      ],
    },
    {
      title: t("custom_theme.color_group.chart"),
      colors: [
        { key: "chart1" as const, label: t("custom_theme.color.chart1") },
        { key: "chart2" as const, label: t("custom_theme.color.chart2") },
        { key: "chart3" as const, label: t("custom_theme.color.chart3") },
        { key: "chart4" as const, label: t("custom_theme.color.chart4") },
        { key: "chart5" as const, label: t("custom_theme.color.chart5") },
      ],
    },
  ];

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {editingTheme
            ? t("custom_theme.edit_theme")
            : t("custom_theme.create_theme")}
        </DialogTitle>
        <DialogDescription>
          {t("custom_theme.editor_description")}
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="basic" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">
              {t("custom_theme.tab.basic")}
            </TabsTrigger>
            <TabsTrigger value="colors">
              {t("custom_theme.tab.colors")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="flex-1 space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="theme-name">{t("custom_theme.name")}</Label>
              <Input
                id="theme-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("custom_theme.name_placeholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme-description">
                {t("custom_theme.description")}
              </Label>
              <Textarea
                id="theme-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("custom_theme.description_placeholder")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("custom_theme.border_radius")}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[parseFloat(radius)]}
                  onValueChange={([v]) => setRadius(v.toString())}
                  min={0}
                  max={1}
                  step={0.125}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-16">
                  {radius}rem
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {[0, 0.25, 0.375, 0.5, 0.75, 1].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r.toString())}
                    className={cn(
                      "w-8 h-8 border-2 transition-colors",
                      parseFloat(radius) === r
                        ? "border-primary"
                        : "border-muted hover:border-muted-foreground"
                    )}
                    style={{ borderRadius: `${r}rem` }}
                  />
                ))}
              </div>
            </div>

            {/* Preview section */}
            <div className="space-y-2 pt-4 border-t">
              <Label>{t("custom_theme.preview")}</Label>
              <div className="flex gap-2 flex-wrap">
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderRadius: `${radius}rem`,
                  }}
                >
                  <div className="text-sm font-medium mb-2">
                    {t("custom_theme.preview_card")}
                  </div>
                  <div
                    className="px-3 py-1.5 rounded text-xs inline-block"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.primaryForeground,
                      borderRadius: `calc(${radius}rem - 4px)`,
                    }}
                  >
                    {t("custom_theme.preview_button")}
                  </div>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: colors.card,
                    color: colors.cardForeground,
                    borderColor: colors.border,
                    borderRadius: `${radius}rem`,
                  }}
                >
                  <div className="text-sm font-medium mb-2">
                    {t("custom_theme.preview_card")}
                  </div>
                  <div
                    className="px-3 py-1.5 rounded text-xs inline-block"
                    style={{
                      backgroundColor: colors.secondary,
                      color: colors.secondaryForeground,
                      borderRadius: `calc(${radius}rem - 4px)`,
                    }}
                  >
                    {t("custom_theme.preview_secondary")}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="flex-1 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {colorGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      {group.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {group.colors.map(({ key, label }) => (
                        <ColorInput
                          key={key}
                          label={label}
                          value={colors[key]}
                          onChange={(v) => updateColor(key, v)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter className="flex-shrink-0 gap-2">
        <Button variant="outline" onClick={handlePreview}>
          <Eye className="h-4 w-4 mr-2" />
          {previewActive
            ? t("custom_theme.stop_preview")
            : t("custom_theme.preview_theme")}
        </Button>
        <Button variant="outline" onClick={handleClose}>
          {t("dialog.cancel")}
        </Button>
        <Button onClick={handleSave}>
          <Check className="h-4 w-4 mr-2" />
          {t("custom_theme.save")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface CustomThemeManagerProps {
  className?: string;
}

export function CustomThemeManager({ className }: CustomThemeManagerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);

  const {
    customThemes,
    activeCustomThemeId,
    addTheme,
    updateTheme,
    deleteTheme,
    duplicateTheme,
    setActiveCustomTheme,
    exportThemesToJson,
    importThemes,
    addPresetTheme,
  } = useCustomThemeStore();

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setEditorOpen(true);
  };

  const handleEditTheme = (theme: CustomTheme) => {
    setEditingTheme(theme);
    setEditorOpen(true);
  };

  const handleSaveTheme = (
    themeData: Omit<CustomTheme, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editingTheme) {
      updateTheme(editingTheme.id, themeData);
      toast.success(t("custom_theme.theme_updated"));
    } else {
      const id = addTheme(themeData);
      setActiveCustomTheme(id);
      toast.success(t("custom_theme.theme_created"));
    }
  };

  const handleDeleteTheme = (id: string) => {
    deleteTheme(id);
    toast.success(t("custom_theme.theme_deleted"));
  };

  const handleDuplicateTheme = (id: string) => {
    const newId = duplicateTheme(id);
    if (newId) {
      toast.success(t("custom_theme.theme_duplicated"));
    }
  };

  const handleActivateTheme = (id: string | null) => {
    setActiveCustomTheme(id);
    if (id) {
      const theme = customThemes.find((t) => t.id === id);
      if (theme) {
        applyCustomTheme(theme);
        toast.success(t("custom_theme.theme_applied", { name: theme.name }));
      }
    } else {
      applyCustomTheme(null);
      toast.success(t("custom_theme.theme_deactivated"));
    }
  };

  const handleExport = async (themeIds?: string[]) => {
    // Use native file dialog in Tauri
    if (isTauri()) {
      const themes = themeIds
        ? customThemes.filter((t) => themeIds.includes(t.id))
        : customThemes;

      const success = await exportCustomThemesToFile({
        version: 1,
        themes: themes.map((theme) => ({
          id: theme.id,
          name: theme.name,
          description: theme.description,
          colors: theme.colors as unknown as Record<string, string>,
          radius: theme.radius,
          createdAt: theme.createdAt,
          updatedAt: theme.updatedAt,
        })),
      });

      if (success) {
        toast.success(t("custom_theme.themes_exported"));
      }
      return;
    }

    // Web fallback: download via blob
    const json = exportThemesToJson(themeIds);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sast-readium-themes-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t("custom_theme.themes_exported"));
  };

  const handleImport = async () => {
    // Use native file dialog in Tauri
    if (isTauri()) {
      try {
        const storage = await importCustomThemesFromFile();
        if (!storage) return;

        const result = importThemes({
          version: 1,
          exportedAt: Date.now(),
          themes: storage.themes.map((theme) => ({
            id: theme.id,
            name: theme.name,
            description: theme.description,
            colors: theme.colors as unknown as CustomThemeColors,
            radius: theme.radius,
            createdAt: theme.createdAt,
            updatedAt: theme.updatedAt,
          })),
        });

        if (result.success) {
          toast.success(
            t("custom_theme.themes_imported", { count: result.imported })
          );
        } else {
          toast.error(result.errors.join(", "));
        }
      } catch {
        toast.error(t("custom_theme.import_error"));
      }
      return;
    }

    // Web fallback: use file input
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importThemes(text);
      if (result.success) {
        toast.success(
          t("custom_theme.themes_imported", { count: result.imported })
        );
      } else {
        toast.error(result.errors.join(", "));
      }
    } catch {
      toast.error(t("custom_theme.import_error"));
    }

    // Reset input
    e.target.value = "";
  };

  const handleAddPreset = (index: number) => {
    const id = addPresetTheme(index);
    if (id) {
      toast.success(t("custom_theme.preset_added"));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("custom_theme.title")}
        </div>
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleImport}
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("custom_theme.import")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleExport()}
                  disabled={customThemes.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("custom_theme.export_all")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateTheme}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("custom_theme.create_new")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {t("custom_theme.presets")}
              </div>
              {BUILTIN_THEMES.map((preset, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleAddPreset(index)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {preset.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active theme indicator */}
      {activeCustomThemeId && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm">
            {t("custom_theme.active")}:{" "}
            <strong>
              {customThemes.find((t) => t.id === activeCustomThemeId)?.name}
            </strong>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => handleActivateTheme(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Theme list */}
      {customThemes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t("custom_theme.no_themes")}</p>
          <p className="text-xs mt-1">{t("custom_theme.no_themes_hint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customThemes.map((theme) => (
            <div
              key={theme.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                activeCustomThemeId === theme.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              {/* Color preview */}
              <div className="flex -space-x-1">
                {[
                  theme.colors.primary,
                  theme.colors.secondary,
                  theme.colors.accent,
                  theme.colors.background,
                ].map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-background"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Theme info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {theme.name}
                  </span>
                  {activeCustomThemeId === theme.id && (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {t("custom_theme.active_badge")}
                    </Badge>
                  )}
                </div>
                {theme.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {theme.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                {activeCustomThemeId !== theme.id && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleActivateTheme(theme.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("custom_theme.apply")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditTheme(theme)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("custom_theme.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateTheme(theme.id)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t("custom_theme.duplicate")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport([theme.id])}>
                      <FileJson className="h-4 w-4 mr-2" />
                      {t("custom_theme.export")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteTheme(theme.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("custom_theme.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Theme editor dialog */}
      <ThemeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingTheme={editingTheme}
        onSave={handleSaveTheme}
      />
    </div>
  );
}
