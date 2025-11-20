'use client';

import JSZip from 'jszip';
import {
  Clock,
  FileArchive,
  FileText,
  FolderOpen,
  Info,
  Keyboard,
  Layers3,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePDFStore } from '@/lib/pdf-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface WelcomePageProps {
  onFileSelect: (file: File) => void;
}

interface PendingFile {
  id: string;
  file: File;
  origin: string;
  relativePath?: string;
}

export function WelcomePage({ onFileSelect }: WelcomePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isExtractingArchive, setIsExtractingArchive] = useState(false);
  const { recentFiles } = usePDFStore();

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
    `${file.origin}-${file.relativePath ?? file.file.name}-${file.file.lastModified}`;

  const handleFilesSelected = useCallback(
    (files: File[], origin: string) => {
      if (!files.length) return;
      const pdfFiles = files.filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
      );

      if (pdfFiles.length === 0) {
        alert('未检测到可导入的 PDF 文件');
        return;
      }

      const entries: PendingFile[] = pdfFiles.map((file) => ({
        id:
          (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
          file.lastModified.toString(),
        file,
        origin,
        relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath,
      }));

      setPendingFiles((prev) => {
        const seen = new Set<string>();
        const merged = [...entries, ...prev].filter((entry) => {
          const key = dedupeKey(entry);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return merged.slice(0, 12);
      });

      onFileSelect(pdfFiles[0]);
    },
    [onFileSelect],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    handleFilesSelected(files, '单文件/多文件选择');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    handleFilesSelected(files, '文件夹导入');
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleArchiveInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archive = e.target.files?.[0];
    if (!archive) return;

    setIsExtractingArchive(true);
    try {
      const zip = await JSZip.loadAsync(archive);
      const pdfEntries: File[] = [];
      const tasks = Object.keys(zip.files).map(async (key) => {
        const entry = zip.files[key];
        if (entry.dir || !key.toLowerCase().endsWith('.pdf')) return;
        const blob = await entry.async('blob');
        pdfEntries.push(new File([blob], key.split('/').pop() ?? key, { type: 'application/pdf' }));
      });
      await Promise.all(tasks);
      handleFilesSelected(pdfEntries, `${archive.name} 压缩包`);
    } catch (error) {
      console.error('Failed to extract archive', error);
      alert('解析压缩包失败，请确认文件是否有效');
    } finally {
      setIsExtractingArchive(false);
      if (archiveInputRef.current) {
        archiveInputRef.current.value = '';
      }
    }
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };

  const handleArchiveClick = () => {
    archiveInputRef.current?.click();
  };

  useEffect(() => {
    const folderInput = folderInputRef.current;
    if (!folderInput) return;
    folderInput.setAttribute('webkitdirectory', '');
    folderInput.setAttribute('directory', '');
  }, []);

  const handleRecentFileClick = (url: string) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
        onFileSelect(file);
      })
      .catch((err) => console.error('Error loading recent file:', err));
  };

  const keyboardShortcuts = useMemo(
    () => [
      { keys: ['←', '→'], description: '页面切换' },
      { keys: ['Ctrl', '+'], description: '放大' },
      { keys: ['Ctrl', '-'], description: '缩小' },
      { keys: ['Ctrl', 'F'], description: '文档内搜索' },
      { keys: ['F11'], description: '全屏/退出全屏' },
      { keys: ['R'], description: '顺时针旋转' },
      { keys: ['Shift', 'R'], description: '逆时针旋转' },
    ],
    [],
  );

  const pendingSectionTitle = pendingFiles.length > 1 ? '待打开的 PDF' : '快速继续';

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
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">SAST Readium</h1>
            <p className="text-sm text-muted-foreground">更高效的 PDF 阅读与批注体验</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr,1fr]">
            <section className="rounded-3xl border border-border bg-card/40 p-8 shadow-sm shadow-primary/5">
              <div className="flex items-center gap-3 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Welcome</span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">快速导入、整理、阅读 PDF</h2>
              <p className="mt-3 text-base text-muted-foreground">
                支持单文件、多选、整个文件夹以及 ZIP 压缩包导入，同时保留最近打开记录和快捷操作，帮助你迅速回到工作流。
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <Layers3 className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 text-base font-medium">批量处理</h3>
                  <p className="text-sm text-muted-foreground">一次性选择多个文件/文件夹，系统会自动排队等候</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <Keyboard className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 text-base font-medium">快捷键友好</h3>
                  <p className="text-sm text-muted-foreground">全键盘操作覆盖，阅读效率拉满</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  快速导入
                </h2>
                <span className="text-xs text-muted-foreground">PDF / Folder / ZIP</span>
              </div>
              <div className="mt-6 space-y-3">
                <Button onClick={handleOpenClick} className="w-full justify-between gap-3 h-12">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">选择 PDF 文件</div>
                      <div className="text-xs text-muted-foreground">支持多选，自动加入导入队列</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Enter</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleFolderClick}
                  className="w-full justify-between gap-3 h-12"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">导入整个文件夹</div>
                      <div className="text-xs text-muted-foreground">自动筛选其中的 PDF 文件</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Ctrl + O</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleArchiveClick}
                  className="w-full justify-between gap-3 h-12"
                  disabled={isExtractingArchive}
                >
                  <div className="flex items-center gap-3">
                    <FileArchive className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">解析 ZIP 压缩包</div>
                      <div className="text-xs text-muted-foreground">
                        {isExtractingArchive ? '正在解压并筛选 PDF...' : '将压缩包内全部 PDF 加入队列'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">ZIP</span>
                </Button>
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                支持将文件直接拖拽到页面任意位置，或使用系统粘贴板（Ctrl + V）快速导入
              </div>
            </section>
          </div>

          {pendingFiles.length > 0 && (
            <section className="rounded-3xl border border-border bg-card/70 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">Import queue</p>
                  <h2 className="text-xl font-semibold">{pendingSectionTitle}</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPendingFiles([])}>
                  清空
                </Button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {pendingFiles.map((pending) => (
                  <div
                    key={pending.id}
                    className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{pending.file.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pending.relativePath ?? '—'} · {pending.origin}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatFileSize(pending.file.size)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Button size="sm" className="flex-1" onClick={() => onFileSelect(pending.file)}>
                        立即打开
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePending(pending.id)}
                      >
                        移除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                最近打开
              </h2>
              {recentFiles.length > 0 ? (
                <div className="space-y-3">
                  {recentFiles.slice(0, 5).map((file, index) => (
                    <button
                      key={`${file.url}-${index}`}
                      onClick={() => handleRecentFileClick(file.url)}
                      className="w-full rounded-2xl border border-border bg-card/60 p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.numPages ? `${file.numPages} 页 · ` : ''}
                            {new Date(file.lastOpened).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">暂无记录，立即导入开始阅读</p>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                键盘快捷键
              </h2>
              <div className="rounded-2xl border border-border bg-card/70 p-5">
                <div className="space-y-3">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <div className="flex flex-wrap gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="lg:col-span-2">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5" />
                特色功能
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: '高级导航',
                    description: '缩略图、目录、搜索定位多种方式快速跳转',
                    icon: <FileText className="h-5 w-5 text-primary" />,
                  },
                  {
                    title: '灵活视图',
                    description: '单页、连续、双页等多种阅读模式随心切换',
                    icon: <Layers3 className="h-5 w-5 text-primary" />,
                  },
                  {
                    title: '强力检索',
                    description: '全文搜索、逐条定位，自动高亮关键内容',
                    icon: <Keyboard className="h-5 w-5 text-primary" />,
                  },
                  {
                    title: '暗色/护眼模式',
                    description: '根据环境快速切换，长时间阅读更舒适',
                    icon: <Info className="h-5 w-5 text-primary" />,
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4"
                  >
                    <div className="rounded-full bg-primary/10 p-2">{feature.icon}</div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Built with Next.js 16 & React 19</p>
          <p>Drag & drop PDF files anywhere to open</p>
        </div>
      </footer>
    </div>
  );
}

