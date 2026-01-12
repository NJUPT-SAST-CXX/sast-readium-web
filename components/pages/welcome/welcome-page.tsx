"use client";

import { processArchive } from "@/lib/utils";
import { isSupportedDocument, getAcceptString, isMarkdown } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Clock,
  FileArchive,
  FileText,
  FileCode,
  FolderOpen,
  Github,
  HelpCircle,
  Info,
  Keyboard,
  MessageSquare,
  Moon,
  Palette,
  Settings,
  Sun,
  Sunrise,
  Upload,
  Database,
  Bookmark,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePDFStore, type RecentFile } from "@/lib/pdf";
import {
  isTauri,
  openPdfFileViaNativeDialog,
  openPdfFolderViaNativeDialog,
  readPdfFileAtPath,
} from "@/lib/platform";
import { getSystemInfo } from "@/lib/platform";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/core/language-switcher";

interface WelcomePageProps {
  onFileSelect: (file: File | File[]) => void;
}

interface PendingFile {
  id: string;
  file: File;
  origin: string;
  relativePath?: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
  file?: File;
  isDirectory: boolean;
}

function collectFileStats(node: FileTreeNode): {
  totalFiles: number;
  totalSize: number;
  filePaths: string[];
} {
  let totalFiles = 0;
  let totalSize = 0;
  const filePaths: string[] = [];

  if (!node.isDirectory && node.file) {
    totalFiles += 1;
    totalSize += node.file.size;
    filePaths.push(node.path);
  }

  if (node.children) {
    for (const child of node.children) {
      const stats = collectFileStats(child);
      totalFiles += stats.totalFiles;
      totalSize += stats.totalSize;
      filePaths.push(...stats.filePaths);
    }
  }

  return { totalFiles, totalSize, filePaths };
}

export function WelcomePage({ onFileSelect }: WelcomePageProps) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isExtractingArchive, setIsExtractingArchive] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [folderDetailMode, setFolderDetailMode] = useState<
    "simple" | "detailed"
  >("simple");
  const [folderSearch, setFolderSearch] = useState("");
  const { recentFiles } = usePDFStore();
  const [systemInfo, setSystemInfo] = useState<{
    os: string;
    arch: string;
  } | null>(null);

  const formatFileSize = useCallback((size: number) => {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} B`;
  }, []);

  const dedupeKey = (file: PendingFile) =>
    `${file.origin}-${file.relativePath ?? file.file.name}-${
      file.file.lastModified
    }`;

  const handleFilesSelected = useCallback(
    (files: File[], origin: string) => {
      if (!files.length) return;
      const supportedFiles = files.filter((file) => isSupportedDocument(file));

      if (supportedFiles.length === 0) {
        alert(t("dialog.no_files_found"));
        return;
      }

      const entries: PendingFile[] = supportedFiles.map((file) => ({
        id:
          (globalThis.crypto?.randomUUID?.() ??
            Math.random().toString(36).slice(2)) + file.lastModified.toString(),
        file,
        origin,
        relativePath: (file as File & { webkitRelativePath?: string })
          .webkitRelativePath,
      }));

      setPendingFiles((prev) => {
        const seen = new Set<string>();
        const merged = [...entries, ...prev].filter((entry) => {
          const key = dedupeKey(entry);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return merged.slice(0, 100);
      });

      onFileSelect(supportedFiles[0]);
    },
    [onFileSelect, t]
  );

  const folderFileTree = useMemo(() => {
    const root: FileTreeNode = {
      name: "",
      path: "",
      children: [],
      isDirectory: true,
    };

    const ensureChild = (
      parent: FileTreeNode,
      name: string,
      path: string,
      isDirectory: boolean
    ) => {
      if (!parent.children) parent.children = [];
      let child = parent.children.find(
        (c) => c.name === name && c.isDirectory === isDirectory
      );
      if (!child) {
        child = {
          name,
          path,
          children: isDirectory ? [] : undefined,
          isDirectory,
        };
        parent.children.push(child);
      }
      return child;
    };

    for (const file of folderFiles) {
      const rel =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ??
        file.name;
      const parts = rel.split("/").filter(Boolean);
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const segment = parts[i];
        const isLast = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join("/");
        if (isLast) {
          if (isSupportedDocument(file)) {
            if (!current.children) current.children = [];
            current.children.push({
              name: segment,
              path: currentPath,
              file,
              isDirectory: false,
            });
          }
        } else {
          current = ensureChild(current, segment, currentPath, true);
        }
      }
    }

    if (!root.children) return [] as FileTreeNode[];
    const sortNodes = (nodes: FileTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name, i18n.language);
      });
      nodes.forEach((n) => {
        if (n.children) sortNodes(n.children);
      });
    };
    sortNodes(root.children);
    return root.children;
  }, [folderFiles, i18n.language]);

  const filteredFolderFileTree = useMemo(() => {
    const query = folderSearch.trim().toLowerCase();
    if (!query) return folderFileTree;

    const filterNode = (node: FileTreeNode): FileTreeNode | null => {
      const selfMatch =
        node.name.toLowerCase().includes(query) ||
        node.path.toLowerCase().includes(query);

      if (!node.children || node.children.length === 0) {
        if (!node.isDirectory && selfMatch) return node;
        return null;
      }

      const filteredChildren = node.children
        .map((child) => filterNode(child))
        .filter((child): child is FileTreeNode => Boolean(child));

      if (selfMatch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }

      return null;
    };

    return folderFileTree
      .map((node) => filterNode(node))
      .filter((node): node is FileTreeNode => Boolean(node));
  }, [folderFileTree, folderSearch]);

  const toggleNodeSelected = useCallback((node: FileTreeNode) => {
    if (node.isDirectory) {
      const { filePaths } = collectFileStats(node);
      if (filePaths.length === 0) return;
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        const allSelected = filePaths.every((p) => next.has(p));
        if (allSelected) {
          filePaths.forEach((p) => next.delete(p));
        } else {
          filePaths.forEach((p) => next.add(p));
        }
        return next;
      });
    } else {
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        if (next.has(node.path)) {
          next.delete(node.path);
        } else {
          next.add(node.path);
        }
        return next;
      });
    }
  }, []);

  const handleSelectAllInFolderTree = useCallback(() => {
    const allPaths: string[] = [];
    for (const node of filteredFolderFileTree) {
      const stats = collectFileStats(node);
      allPaths.push(...stats.filePaths);
    }
    if (allPaths.length === 0) return;
    setSelectedPaths(new Set(allPaths));
  }, [filteredFolderFileTree]);

  const handleClearSelection = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  const formatLastModified = useCallback(
    (timestamp?: number) => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      return date.toLocaleString(i18n.language, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [i18n.language]
  );

  const handleConfirmFolderImport = useCallback(() => {
    const pdfs: File[] = [];
    for (const file of folderFiles) {
      const rel =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ??
        file.name;
      const path = rel.split("/").filter(Boolean).join("/");
      if (selectedPaths.size === 0 || selectedPaths.has(path)) {
        if (isSupportedDocument(file)) {
          pdfs.push(file);
        }
      }
    }

    handleFilesSelected(pdfs, t("welcome.folder_import"));
    setFolderDialogOpen(false);
    setFolderFiles([]);
    setSelectedPaths(new Set());
    setFolderSearch("");
  }, [folderFiles, handleFilesSelected, selectedPaths, t]);

  useEffect(() => {
    let cancelled = false;

    getSystemInfo().then((info) => {
      if (!cancelled && info) {
        setSystemInfo(info);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    handleFilesSelected(files, "单文件/多文件选择");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) {
      return;
    }
    setFolderFiles(files);
    setFolderDialogOpen(true);
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const handleArchiveInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archive = e.target.files?.[0];
    if (!archive) return;

    setIsExtractingArchive(true);
    try {
      const files = await processArchive(archive);
      handleFilesSelected(files, `${archive.name} 压缩包`);
    } catch (error) {
      console.error("Failed to extract archive", error);
      alert("解析压缩包失败，请确认文件是否有效");
    } finally {
      setIsExtractingArchive(false);
      if (archiveInputRef.current) {
        archiveInputRef.current.value = "";
      }
    }
  };

  const handleOpenClick = () => {
    if (isTauri()) {
      openPdfFileViaNativeDialog()
        .then((file) => {
          if (file) {
            onFileSelect(file);
          }
        })
        .catch((error) => {
          console.error("Failed to open PDF via native dialog", error);
        });
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFolderClick = () => {
    if (isTauri()) {
      openPdfFolderViaNativeDialog()
        .then((files) => {
          if (!files) return;
          if (files.length === 0) {
            alert(t("dialog.no_pdf_found"));
            return;
          }
          setFolderFiles(files);
          setFolderDialogOpen(true);
        })
        .catch((error) => {
          console.error("Failed to open folder via native dialog", error);
        });
    } else {
      folderInputRef.current?.click();
    }
  };

  const handleArchiveClick = () => {
    archiveInputRef.current?.click();
  };

  useEffect(() => {
    const folderInput = folderInputRef.current;
    if (!folderInput) return;
    folderInput.setAttribute("webkitdirectory", "");
    folderInput.setAttribute("directory", "");
  }, []);

  const handleRecentFileClick = (entry: RecentFile) => {
    if (isTauri() && entry.path) {
      readPdfFileAtPath(entry.path, entry.name)
        .then((file) => {
          if (!file) return;
          onFileSelect(file);
        })
        .catch((err) =>
          console.error("Error loading recent native file:", err)
        );
      return;
    }

    fetch(entry.url)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], entry.name || "document.pdf", {
          type: "application/pdf",
        });
        onFileSelect(file);
      })
      .catch((err) => console.error("Error loading recent file:", err));
  };

  const handleRemovePending = (id: string) => {
    setPendingFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const { bookmarks, annotations, themeMode, setThemeMode } = usePDFStore();

  const quickActions = [
    {
      icon: Settings,
      labelKey: "welcome.action_settings",
      onClick: () => (window.location.href = "/help"),
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    },
    {
      icon: Palette,
      labelKey: "welcome.action_theme",
      onClick: () => {
        const modes: Array<"light" | "dark" | "sepia" | "auto"> = [
          "light",
          "dark",
          "sepia",
          "auto",
        ];
        const currentIndex = modes.indexOf(themeMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setThemeMode(modes[nextIndex]);
      },
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      badge: themeMode,
    },
    {
      icon: Keyboard,
      labelKey: "welcome.action_shortcuts",
      onClick: () => {
        const event = new KeyboardEvent("keydown", { key: "?" });
        document.dispatchEvent(event);
      },
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      icon: Database,
      labelKey: "welcome.action_data",
      onClick: () => (window.location.href = "/help"),
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
  ];

  const themeIcons: Record<string, typeof Sun> = {
    light: Sun,
    dark: Moon,
    sepia: Sunrise,
    auto: Palette,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString()}
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        onChange={handleFolderInputChange}
        className="hidden"
      />
      <input
        ref={archiveInputRef}
        type="file"
        accept=".zip"
        onChange={handleArchiveInputChange}
        className="hidden"
      />

      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm ring-1 ring-primary/10">
              <Image
                src="/window.svg"
                alt="SAST Readium logo"
                width={24}
                height={24}
                className="h-5 w-5 sm:h-6 sm:w-6"
                priority
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              {t("app.title")}
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Mobile: Icon only links */}
            <Link
              href="/help"
              className="flex sm:hidden items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t("help.view_help")}
            >
              <HelpCircle className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="flex sm:hidden items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t("welcome.about")}
            >
              <Info className="h-4 w-4" />
            </Link>
            {/* Desktop: Full links */}
            <Link
              href="/help"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              {t("help.view_help")}
            </Link>
            <Link
              href="/about"
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="h-4 w-4" />
              {t("welcome.about")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              {/* Left: Hero Content */}
              <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                    {t("welcome.hero_title")}
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                    {t("app.subtitle")}
                  </p>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto"
                    onClick={handleOpenClick}
                  >
                    <FileText className="h-5 w-5" />
                    {t("welcome.open_document")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {recentFiles.length > 0 && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 w-full sm:w-auto"
                      onClick={() => handleRecentFileClick(recentFiles[0])}
                    >
                      <Clock className="h-5 w-5" />
                      {t("welcome.continue_last")}
                    </Button>
                  )}
                </div>

                {/* Secondary Actions */}
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={handleFolderClick}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {t("welcome.open_folder")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={handleArchiveClick}
                    disabled={isExtractingArchive}
                  >
                    <FileArchive className="h-4 w-4" />
                    {isExtractingArchive
                      ? t("welcome.parsing_zip")
                      : t("welcome.open_zip")}
                  </Button>
                </div>

                {/* Drag hint - hide on mobile */}
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground justify-center lg:justify-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Upload className="h-4 w-4" />
                  </div>
                  <span>{t("welcome.drag_hint")}</span>
                </div>
              </div>

              {/* Right: Quick Access Panel */}
              <div className="space-y-6">
                {/* Recent Files Card */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-6 shadow-xl shadow-black/5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Clock className="h-5 w-5 text-primary" />
                      {t("welcome.recent")}
                    </h3>
                    {recentFiles.length > 5 && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        {t("welcome.view_all")}
                      </Button>
                    )}
                  </div>
                  {recentFiles.length > 0 ? (
                    <div className="space-y-1">
                      {recentFiles.slice(0, 5).map((file, index) => (
                        <button
                          key={`${file.url}-${index}`}
                          onClick={() => handleRecentFileClick(file)}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-accent"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {typeof file.readingProgress === "number"
                                ? `${Math.round(file.readingProgress)}% ${t("welcome.progress")}`
                                : ""}
                              {file.numPages
                                ? ` · ${file.numPages} ${t("welcome.pages")}`
                                : ""}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("welcome.no_recent")}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={handleOpenClick}
                      >
                        {t("welcome.open_first_doc")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Import Queue (only show if has pending files) */}
                {pendingFiles.length > 0 && (
                  <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-xl shadow-black/5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-semibold">
                        <Upload className="h-5 w-5 text-orange-500" />
                        {t("welcome.import_queue")}
                        <span className="ml-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-500">
                          {pendingFiles.length}
                        </span>
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingFiles([])}
                        className="text-xs"
                      >
                        {t("welcome.clear")}
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {pendingFiles.map((pending) => (
                        <div
                          key={pending.id}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                            {isMarkdown(pending.file) ? (
                              <FileCode className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">
                              {pending.file.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatFileSize(pending.file.size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => onFileSelect(pending.file)}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemovePending(pending.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions & System Status Section */}
        <section className="border-t border-border/40 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {/* Quick Actions */}
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  {t("welcome.quick_actions")}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {quickActions.map((action, index) => {
                    const ThemeIcon = action.badge
                      ? themeIcons[action.badge] || Palette
                      : null;
                    return (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className={`flex items-center gap-2 sm:gap-3 rounded-xl p-2.5 sm:p-3 text-left transition-all hover:scale-[1.02] ${action.color} hover:shadow-md`}
                      >
                        <action.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium">
                            {t(action.labelKey)}
                          </span>
                          {action.badge && ThemeIcon && (
                            <div className="hidden sm:flex items-center gap-1 text-xs opacity-70 mt-0.5">
                              <ThemeIcon className="h-3 w-3" />
                              <span>{t(`welcome.theme_${action.badge}`)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* System Status */}
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  {t("welcome.system_status")}
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* Storage Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                      </div>
                      <span className="text-muted-foreground text-center sm:text-left">
                        <span className="block sm:hidden">
                          {recentFiles.length}
                        </span>
                        <span className="hidden sm:inline">
                          {t("welcome.recent_count", {
                            count: recentFiles.length,
                          })}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                      </div>
                      <span className="text-muted-foreground text-center sm:text-left">
                        <span className="block sm:hidden">
                          {bookmarks.length}
                        </span>
                        <span className="hidden sm:inline">
                          {t("welcome.bookmark_count", {
                            count: bookmarks.length,
                          })}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-green-500/10">
                        <StickyNote className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                      </div>
                      <span className="text-muted-foreground text-center sm:text-left">
                        <span className="block sm:hidden">
                          {annotations.length}
                        </span>
                        <span className="hidden sm:inline">
                          {t("welcome.annotation_count", {
                            count: annotations.length,
                          })}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Shortcuts Preview - hide on mobile */}
                  <div className="hidden sm:block pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {t("welcome.shortcuts_preview")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const event = new KeyboardEvent("keydown", {
                            key: "?",
                          });
                          document.dispatchEvent(event);
                        }}
                      >
                        {t("welcome.view_all_shortcuts")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                        <span className="text-muted-foreground">
                          {t("welcome.shortcut_search")}
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">
                          Ctrl+F
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                        <span className="text-muted-foreground">
                          {t("welcome.shortcut_zoom_in")}
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">
                          Ctrl++
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                        <span className="text-muted-foreground">
                          {t("welcome.shortcut_zoom_out")}
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">
                          Ctrl+-
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                        <span className="text-muted-foreground">
                          {t("welcome.shortcut_fullscreen")}
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">
                          F11
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <a
                href="https://github.com/NJUPT-SAST-CXX/sast-readium-web"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                {t("welcome.view_docs")}
              </a>
              <span className="hidden sm:inline text-border">|</span>
              <a
                href="https://github.com/NJUPT-SAST-CXX/sast-readium-web/issues/new/choose"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                {t("welcome.submit_issue")}
              </a>
              <span className="hidden sm:inline text-border">|</span>
              <Link
                href="/help"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                {t("help.view_help")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Simplified Footer */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
            <div className="hidden sm:flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" />
              <span>{t("footer.drag_drop")}</span>
            </div>
            {systemInfo && (
              <span className="px-2 py-1 rounded-full bg-muted">
                {systemInfo.os} · {systemInfo.arch}
              </span>
            )}
          </div>
        </div>
      </footer>
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-[95vw] sm:max-w-lg md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dialog.select_pdf")}</DialogTitle>
            <DialogDescription>{t("dialog.scan_desc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>{t("dialog.default_import")}</span>
                <ToggleGroup
                  type="single"
                  value={folderDetailMode}
                  onValueChange={(value) => {
                    if (value)
                      setFolderDetailMode(value as "simple" | "detailed");
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7"
                >
                  <ToggleGroupItem
                    value="simple"
                    className="text-[11px] px-2 h-6"
                  >
                    {t("dialog.simple")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="detailed"
                    className="text-[11px] px-2 h-6"
                  >
                    {t("dialog.detailed")}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  placeholder={t("dialog.search_placeholder")}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllInFolderTree}
                  className="shrink-0"
                >
                  {t("dialog.select_all")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="shrink-0"
                >
                  {t("dialog.clear_selection")}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-72 rounded-md border bg-muted/30 p-2">
              <div className="space-y-1 text-sm">
                {filteredFolderFileTree.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("dialog.no_pdf_found")}
                  </p>
                ) : (
                  filteredFolderFileTree.map((node) => (
                    <FolderTreeNode
                      key={node.path || node.name}
                      node={node}
                      level={0}
                      selectedPaths={selectedPaths}
                      onToggle={toggleNodeSelected}
                      detailMode={folderDetailMode}
                      formatFileSize={formatFileSize}
                      formatLastModified={formatLastModified}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFolderDialogOpen(false);
                setFolderFiles([]);
                setSelectedPaths(new Set());
                setFolderSearch("");
              }}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmFolderImport}
              disabled={folderFileTree.length === 0}
            >
              {t("dialog.confirm_import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FolderTreeNodeProps {
  node: FileTreeNode;
  level: number;
  selectedPaths: Set<string>;
  onToggle: (node: FileTreeNode) => void;
  detailMode: "simple" | "detailed";
  formatFileSize: (size: number) => string;
  formatLastModified: (timestamp?: number) => string;
}

function FolderTreeNode({
  node,
  level,
  selectedPaths,
  onToggle,
  detailMode,
  formatFileSize,
  formatLastModified,
}: FolderTreeNodeProps) {
  const { t } = useTranslation();
  const hasChildren = !!node.children && node.children.length > 0;
  const isSelected = !node.isDirectory && selectedPaths.has(node.path);
  const paddingLeft = 8 + level * 16;

  let directoryChecked: boolean | "indeterminate" = false;
  let directoryTotalFiles = 0;
  let directoryTotalSize = 0;

  if (node.isDirectory) {
    const stats = collectFileStats(node);
    directoryTotalFiles = stats.totalFiles;
    directoryTotalSize = stats.totalSize;
    if (stats.filePaths.length > 0) {
      const selectedCount = stats.filePaths.filter((p) =>
        selectedPaths.has(p)
      ).length;
      if (selectedCount === 0) {
        directoryChecked = false;
      } else if (selectedCount === stats.filePaths.length) {
        directoryChecked = true;
      } else {
        directoryChecked = "indeterminate";
      }
    }
  }

  return (
    <div className="space-y-1">
      <div
        className="flex items-start gap-2 rounded-sm px-1 py-0.5 hover:bg-accent/40"
        style={{ paddingLeft }}
      >
        <Checkbox
          checked={node.isDirectory ? directoryChecked : isSelected}
          onCheckedChange={() => onToggle(node)}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            {node.isDirectory && (
              <span className="text-xs text-muted-foreground">📁</span>
            )}
            <span className="truncate text-xs sm:text-sm">
              {node.name || t("dialog.root_dir")}
            </span>
          </div>
          {detailMode === "detailed" && !node.isDirectory && (
            <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
              {node.path}
              {node.file ? ` · ${formatFileSize(node.file.size)}` : ""}
              {node.file && node.file.lastModified
                ? ` · ${formatLastModified(node.file.lastModified)}`
                : ""}
            </div>
          )}
          {detailMode === "detailed" &&
            node.isDirectory &&
            directoryTotalFiles > 0 && (
              <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                {directoryTotalFiles} PDF · {formatFileSize(directoryTotalSize)}
              </div>
            )}
        </div>
      </div>
      {hasChildren && (
        <div className="space-y-0.5">
          {node.children!.map((child) => (
            <FolderTreeNode
              key={child.path || child.name}
              node={child}
              level={level + 1}
              selectedPaths={selectedPaths}
              onToggle={onToggle}
              detailMode={detailMode}
              formatFileSize={formatFileSize}
              formatLastModified={formatLastModified}
            />
          ))}
        </div>
      )}
    </div>
  );
}
