"use client";

import { useState } from "react";
import {
  File,
  Edit3,
  View,
  Settings,
  FileText,
  Save,
  Share2,
  Printer,
  Download,
  Undo,
  Redo,
  Copy,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Grid3x3,
  List,
  Search,
  Bookmark,
  MessageSquare,
  FolderOpen,
} from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { cn } from "@/lib/utils";
import { usePDFStore } from "@/lib/pdf-store";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PDFPropertiesDialog } from "./pdf-properties-dialog";
import { PDFRecentFilesDialog } from "./pdf-recent-files-dialog";
import { isTauri, renameFile } from "@/lib/tauri-bridge";

interface MenuSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: {
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    action?: () => void;
    divider?: boolean;
  }[];
}

interface PDFMenuBarProps {
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onSearch?: () => void;
  onOpenSettings?: () => void;
}

export function PDFMenuBar({
  onDownload,
  onPrint,
  onShare,
  onSave,
  onSearch,
  onOpenSettings,
  onOpenFile,
  onOpenFolder,
  onRevealInFileManager,
  onOpenRecentFile,
  onFileUpdate,
}: PDFMenuBarProps & {
  onOpenFile?: () => void;
  onOpenFolder?: () => void;
  onRevealInFileManager?: () => void;
  onOpenRecentFile?: (file: File) => void;
  onFileUpdate?: (newFile: File) => void;
}) {
  const { t } = useTranslation();
  const {
    currentPDF,
    zoomIn,
    zoomOut,
    rotateClockwise,
    toggleThumbnails,
    toggleOutline,
    toggleAnnotations,
    undoAnnotation,
    redoAnnotation,
    canUndo,
    canRedo,
    setViewMode,
    showMenuBar,
    toggleDarkMode, // eslint-disable-line @typescript-eslint/no-unused-vars
    isDarkMode, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = usePDFStore();

  const [showProperties, setShowProperties] = useState(false);
  const [showRecentFiles, setShowRecentFiles] = useState(false);

  const getCurrentNativePath = () => {
    const file = currentPDF as (File & { __nativePath?: string | null }) | null;
    const nativePath = file?.__nativePath ?? null;
    return nativePath ? String(nativePath) : null;
  };

  const handleCopyCurrentFilePath = async () => {
    const nativePath = getCurrentNativePath();
    if (!nativePath) return;
    try {
      await navigator.clipboard.writeText(nativePath);
    } catch (error) {
      console.error("Failed to copy current file path:", error);
    }
  };

  const handleRenameCurrentFile = async () => {
    const nativePath = getCurrentNativePath();
    if (!nativePath || !isTauri()) return;

    const file = currentPDF as File | null;
    const currentName = file?.name || "document.pdf";
    const input = window.prompt(t("menu.file.rename"), currentName);
    if (!input) return;

    const trimmed = input.trim();
    if (!trimmed || trimmed === currentName) return;

    const ok = await renameFile(nativePath, trimmed);
    if (!ok) return;

    // Note: recentFiles entries are updated when reopening via recent dialog; here we only
    // rename the file on disk and the in-memory File name used for UI.
    if (file) {
      try {
        Object.defineProperty(file, "name", {
          value: trimmed,
          configurable: true,
        });
      } catch {
        // best effort; ignore if we cannot redefine the property
      }
    }
  };

  // Clipboard operations
  const handleCut = async () => {
    try {
      const selection = window.getSelection();
      const text = selection?.toString();
      if (text) {
        await navigator.clipboard.writeText(text);
        // Note: Actual cutting (removing text) is limited in PDF context
        // as PDFs are typically read-only documents
      }
    } catch (err) {
      console.error("Failed to cut text:", err);
    }
  };

  const handleCopy = async () => {
    try {
      const selection = window.getSelection();
      const text = selection?.toString();
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Paste functionality is limited in PDF viewer context
      // This is mainly for form fields or text annotations
      console.log("Paste:", text);
    } catch (err) {
      console.error("Failed to paste text:", err);
    }
  };

  // New window functionality
  const handleNewWindow = () => {
    // Always allow opening a new window with the current application state
    window.open(window.location.href, "_blank");
  };

  const menuSections: MenuSection[] = [
    {
      id: "file",
      label: t("menu.file.label"),
      icon: <File className="h-4 w-4" />,
      items: [
        {
          label: t("menu.file.open_file"),
          icon: <FileText className="h-4 w-4" />,
          shortcut: "Ctrl+O",
          action: onOpenFile,
        },
        {
          label: t("menu.file.open_folder"),
          icon: <FolderOpen className="h-4 w-4" />,
          action: onOpenFolder,
        },
        { divider: true, label: "" },
        {
          label: t("menu.file.new_window"),
          icon: <FileText className="h-4 w-4" />,
          shortcut: "Ctrl+N",
          action: handleNewWindow,
        },
        {
          label: t("menu.file.recent_files"),
          icon: <File className="h-4 w-4" />,
          action: () => setShowRecentFiles(true),
        },
        ...(isTauri()
          ? [
              {
                label: t("menu.file.copy_path"),
                icon: <Copy className="h-4 w-4" />,
                action: handleCopyCurrentFilePath,
              },
              {
                label: t("menu.file.rename"),
                icon: <Edit3 className="h-4 w-4" />,
                action: handleRenameCurrentFile,
              },
              {
                label: t("menu.file.reveal_in_file_manager"),
                icon: <FolderOpen className="h-4 w-4" />,
                action: onRevealInFileManager,
              },
            ]
          : []),
        {
          label: t("menu.file.save"),
          icon: <Save className="h-4 w-4" />,
          shortcut: "Ctrl+S",
          action: onSave,
        },
        { divider: true, label: "" },
        {
          label: t("menu.file.print"),
          icon: <Printer className="h-4 w-4" />,
          shortcut: "Ctrl+P",
          action: onPrint,
        },
        {
          label: t("menu.file.download"),
          icon: <Download className="h-4 w-4" />,
          shortcut: "Ctrl+D",
          action: onDownload,
        },
        {
          label: t("menu.file.share"),
          icon: <Share2 className="h-4 w-4" />,
          action: onShare,
        },
        { divider: true, label: "" },
        {
          label: t("menu.file.properties"),
          icon: <List className="h-4 w-4" />,
          action: () => setShowProperties(true),
        },
      ],
    },
    {
      id: "edit",
      label: t("menu.edit.label"),
      icon: <Edit3 className="h-4 w-4" />,
      items: [
        {
          label: t("menu.edit.undo"),
          icon: <Undo className="h-4 w-4" />,
          shortcut: "Ctrl+Z",
          action: () => canUndo() && undoAnnotation(),
        },
        {
          label: t("menu.edit.redo"),
          icon: <Redo className="h-4 w-4" />,
          shortcut: "Ctrl+Y",
          action: () => canRedo() && redoAnnotation(),
        },
        { divider: true, label: "" },
        {
          label: t("menu.edit.cut"),
          icon: <Scissors className="h-4 w-4" />,
          shortcut: "Ctrl+X",
          action: handleCut,
        },
        {
          label: t("menu.edit.copy"),
          icon: <Copy className="h-4 w-4" />,
          shortcut: "Ctrl+C",
          action: handleCopy,
        },
        {
          label: t("menu.edit.paste"),
          icon: <Clipboard className="h-4 w-4" />,
          shortcut: "Ctrl+V",
          action: handlePaste,
        },
        { divider: true, label: "" },
        {
          label: t("menu.edit.find"),
          icon: <Search className="h-4 w-4" />,
          shortcut: "Ctrl+F",
          action: onSearch,
        },
      ],
    },
    {
      id: "view",
      label: t("menu.view.label"),
      icon: <View className="h-4 w-4" />,
      items: [
        {
          label: t("menu.view.zoom_in"),
          icon: <ZoomIn className="h-4 w-4" />,
          shortcut: "Ctrl++",
          action: zoomIn,
        },
        {
          label: t("menu.view.zoom_out"),
          icon: <ZoomOut className="h-4 w-4" />,
          shortcut: "Ctrl+-",
          action: zoomOut,
        },
        { divider: true, label: "" },
        {
          label: t("menu.view.rotate_cw"),
          icon: <RotateCw className="h-4 w-4" />,
          shortcut: "R",
          action: rotateClockwise,
        },
        { divider: true, label: "" },
        {
          label: t("menu.view.single_page"),
          icon: <FileText className="h-4 w-4" />,
          action: () => setViewMode("single"),
        },
        {
          label: t("menu.view.continuous"),
          icon: <List className="h-4 w-4" />,
          action: () => setViewMode("continuous"),
        },
        {
          label: t("menu.view.two_page"),
          icon: <Grid3x3 className="h-4 w-4" />,
          action: () => setViewMode("twoPage"),
        },
        { divider: true, label: "" },
        {
          label: t("menu.view.thumbnails"),
          icon: <Maximize2 className="h-4 w-4" />,
          action: toggleThumbnails,
        },
        {
          label: t("menu.view.bookmarks"),
          icon: <Bookmark className="h-4 w-4" />,
          action: toggleOutline,
        },
        {
          label: t("menu.view.annotations"),
          icon: <MessageSquare className="h-4 w-4" />,
          action: toggleAnnotations,
        },
      ],
    },
    {
      id: "settings",
      label: t("menu.settings.label"),
      icon: <Settings className="h-4 w-4" />,
      items: [
        {
          label: t("menu.settings.preferences"),
          icon: <Settings className="h-4 w-4" />,
          action: onOpenSettings,
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "transition-[max-height,opacity] duration-200 ease-out",
        showMenuBar
          ? "max-h-16 opacity-100"
          : "max-h-0 opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-center border-b border-border bg-background px-2 py-1 animate-in slide-in-from-top duration-300">
        <Menubar className="border-none shadow-none bg-transparent h-auto p-0">
          {menuSections.map((section) => (
            <MenubarMenu key={section.id}>
              <MenubarTrigger className="gap-1.5 px-2 py-1 text-sm font-normal">
                {section.icon}
                <span>{section.label}</span>
              </MenubarTrigger>
              <MenubarContent className="min-w-[200px]">
                {section.items.map((item, index) => {
                  if (item.divider) {
                    return <MenubarSeparator key={`divider-${index}`} />;
                  }
                  return (
                    <MenubarItem
                      key={index}
                      onClick={item.action}
                      className="gap-2"
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <MenubarShortcut>{item.shortcut}</MenubarShortcut>
                      )}
                    </MenubarItem>
                  );
                })}
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>

        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>

      <PDFPropertiesDialog
        open={showProperties}
        onOpenChange={setShowProperties}
        onFileUpdate={onFileUpdate}
      />

      <PDFRecentFilesDialog
        open={showRecentFiles}
        onOpenChange={setShowRecentFiles}
        onOpenRecentFile={onOpenRecentFile}
      />
    </div>
  );
}
