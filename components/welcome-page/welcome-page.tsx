"use client";

import { processArchive } from "@/lib/archive-utils";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  FileArchive,
  FileText,
  FolderOpen,
  Sparkles,
  Upload,
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
import { usePDFStore, type RecentFile } from "@/lib/pdf-store";
import {
  isTauri,
  openPdfFileViaNativeDialog,
  openPdfFolderViaNativeDialog,
  readPdfFileAtPath,
} from "@/lib/tauri-bridge";
import { getSystemInfo } from "@/lib/tauri-bridge";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

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
      const pdfFiles = files.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
      );

      if (pdfFiles.length === 0) {
        alert(t("dialog.no_pdf_found"));
        return;
      }

      const entries: PendingFile[] = pdfFiles.map((file) => ({
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

      onFileSelect(pdfFiles[0]);
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
          if (
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")
          ) {
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
        if (
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
        ) {
          pdfs.push(file);
        }
      }
    }

    handleFilesSelected(pdfs, "文件夹导入");
    setFolderDialogOpen(false);
    setFolderFiles([]);
    setSelectedPaths(new Set());
    setFolderSearch("");
  }, [folderFiles, handleFilesSelected, selectedPaths]);

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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
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

      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <Image
                src="/window.svg"
                alt="SAST Readium logo"
                width={24}
                height={24}
                className="h-6 w-6"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("app.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:inline-flex">
              {t("app.tagline")}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {t("welcome.start")}
              </h2>
              <div className="space-y-1">
                <Button
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleOpenClick}
                >
                  <FileText className="h-4 w-4" />
                  <span>{t("welcome.open_pdf")}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleFolderClick}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>{t("welcome.open_folder")}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleArchiveClick}
                  disabled={isExtractingArchive}
                >
                  <FileArchive className="h-4 w-4" />
                  <span>
                    {isExtractingArchive
                      ? t("welcome.parsing_zip")
                      : t("welcome.open_zip")}
                  </span>
                </Button>
                {recentFiles.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => handleRecentFileClick(recentFiles[0])}
                  >
                    <Clock className="h-4 w-4" />
                    <span>
                      {t("welcome.continue_reading", {
                        fileName: recentFiles[0].name,
                      })}
                    </span>
                  </Button>
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {t("welcome.drag_hint")}
              </p>
            </section>

            <section className="space-y-6">
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {t("welcome.recent")}
                </h2>
                {recentFiles.length > 0 ? (
                  <div className="space-y-1">
                    {recentFiles.slice(0, 5).map((file, index) => (
                      <button
                        key={`${file.url}-${index}`}
                        onClick={() => handleRecentFileClick(file)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="truncate">{file.name}</span>
                        <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                          {typeof file.readingProgress === "number"
                            ? `${Math.round(file.readingProgress)}%`
                            : ""}
                          {file.numPages ? ` · ${file.numPages} p` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("welcome.no_recent")}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {t("welcome.import_queue")}
                  </h2>
                  {pendingFiles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingFiles([])}
                    >
                      {t("welcome.clear")}
                    </Button>
                  )}
                </div>
                {pendingFiles.length > 0 ? (
                  <div className="space-y-1">
                    {pendingFiles.map((pending) => (
                      <div
                        key={pending.id}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate">{pending.file.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {pending.relativePath ?? "—"} · {pending.origin}
                          </p>
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {formatFileSize(pending.file.size)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => onFileSelect(pending.file)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleRemovePending(pending.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("welcome.no_pending")}
                  </p>
                )}
              </div>

              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  {t("welcome.help")}
                </h2>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>
                    <a
                      href="https://github.com/NJUPT-SAST-CXX/sast-readium-web"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-foreground hover:underline"
                    >
                      {t("welcome.view_docs")}
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/NJUPT-SAST-CXX/sast-readium-web/issues/new/choose"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-foreground hover:underline"
                    >
                      {t("welcome.submit_issue")}
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="hover:text-foreground hover:underline"
                    >
                      {t("welcome.about")}
                    </Link>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>{t("footer.built_with")}</p>
          <p>{t("footer.drag_drop")}</p>
          {systemInfo && (
            <p className="hidden md:inline-flex text-xs">
              {systemInfo.os} · {systemInfo.arch}
            </p>
          )}
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
                <div className="inline-flex items-center gap-px rounded-md border bg-background px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => setFolderDetailMode("simple")}
                    className={`rounded-sm px-2 py-0.5 text-[11px] transition-colors ${
                      folderDetailMode === "simple"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {t("dialog.simple")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFolderDetailMode("detailed")}
                    className={`rounded-sm px-2 py-0.5 text-[11px] transition-colors ${
                      folderDetailMode === "detailed"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {t("dialog.detailed")}
                  </button>
                </div>
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
