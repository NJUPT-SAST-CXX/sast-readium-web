"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table,
  CheckSquare,
  Minus,
  Eye,
  Columns,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Copy,
  Download,
  Upload,
  FileText,
  Save,
  Sigma,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { MarkdownPreview, type TOCItem } from "./markdown-preview";

// ============================================================================
// Types
// ============================================================================

export type ViewMode = "edit" | "preview" | "split";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  minHeight?: string;
  maxHeight?: string;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  defaultViewMode?: ViewMode;
  onSave?: (value: string) => void;
  fileName?: string;
}

export interface MarkdownEditorRef {
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after: string) => void;
}

interface HistoryState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

// ============================================================================
// Toolbar Button Component
// ============================================================================

interface ToolbarButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Main Editor Component
// ============================================================================

export const MarkdownEditor = forwardRef<
  MarkdownEditorRef,
  MarkdownEditorProps
>(function MarkdownEditor(
  {
    value,
    onChange,
    className,
    placeholder,
    readOnly = false,
    autoFocus = false,
    minHeight = "400px",
    maxHeight,
    showToolbar = true,
    showStatusBar = true,
    defaultViewMode = "split",
    onSave,
    fileName = "document.md",
  },
  ref
) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [headings, setHeadings] = useState<TOCItem[]>([]);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([
    { value, selectionStart: 0, selectionEnd: 0 },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

  // Debounced history push
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Push to history with debounce
  const pushHistory = useCallback(
    (newValue: string) => {
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return;
      }

      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }

      historyTimeoutRef.current = setTimeout(() => {
        const textarea = textareaRef.current;
        const newState: HistoryState = {
          value: newValue,
          selectionStart: textarea?.selectionStart ?? 0,
          selectionEnd: textarea?.selectionEnd ?? 0,
        };

        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(newState);
          // Limit history size
          if (newHistory.length > 100) {
            newHistory.shift();
            return newHistory;
          }
          return newHistory;
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 99));
      }, 500);
    },
    [historyIndex]
  );

  // Handle value change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      pushHistory(newValue);
    },
    [onChange, pushHistory]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const prevState = history[historyIndex - 1];
      onChange(prevState.value);
      setHistoryIndex((prev) => prev - 1);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = prevState.selectionStart;
          textareaRef.current.selectionEnd = prevState.selectionEnd;
        }
      }, 0);
    }
  }, [history, historyIndex, onChange]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const nextState = history[historyIndex + 1];
      onChange(nextState.value);
      setHistoryIndex((prev) => prev + 1);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = nextState.selectionStart;
          textareaRef.current.selectionEnd = nextState.selectionEnd;
        }
      }, 0);
    }
  }, [history, historyIndex, onChange]);

  // Insert text at cursor
  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.slice(0, start) + text + value.slice(end);

      onChange(newValue);
      pushHistory(newValue);

      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    },
    [value, onChange, pushHistory]
  );

  // Wrap selection with before/after text
  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.slice(start, end);

      const newValue =
        value.slice(0, start) +
        before +
        selectedText +
        after +
        value.slice(end);

      onChange(newValue);
      pushHistory(newValue);

      // Select the wrapped text
      setTimeout(() => {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
        textarea.focus();
      }, 0);
    },
    [value, onChange, pushHistory]
  );

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      focus: () => textareaRef.current?.focus(),
      getValue: () => value,
      setValue: (newValue: string) => onChange(newValue),
      insertText: (text: string) => insertAtCursor(text),
      wrapSelection: (before: string, after: string) =>
        wrapSelection(before, after),
    }),
    [value, onChange, insertAtCursor, wrapSelection]
  );

  // Insert at line start
  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;

      const newValue =
        value.slice(0, lineStart) + prefix + value.slice(lineStart);

      onChange(newValue);
      pushHistory(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
        textarea.focus();
      }, 0);
    },
    [value, onChange, pushHistory]
  );

  // Toolbar actions
  const toolbarActions = useMemo(
    () => ({
      bold: () => wrapSelection("**", "**"),
      italic: () => wrapSelection("*", "*"),
      strikethrough: () => wrapSelection("~~", "~~"),
      code: () => wrapSelection("`", "`"),
      codeBlock: (lang: string = "") =>
        wrapSelection(`\`\`\`${lang}\n`, "\n```"),
      link: () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const selectedText = value.slice(
          textarea.selectionStart,
          textarea.selectionEnd
        );
        if (selectedText) {
          wrapSelection("[", "](url)");
        } else {
          insertAtCursor("[link text](url)");
        }
      },
      image: () => insertAtCursor("![alt text](image-url)"),
      heading1: () => insertAtLineStart("# "),
      heading2: () => insertAtLineStart("## "),
      heading3: () => insertAtLineStart("### "),
      bulletList: () => insertAtLineStart("- "),
      numberedList: () => insertAtLineStart("1. "),
      taskList: () => insertAtLineStart("- [ ] "),
      quote: () => insertAtLineStart("> "),
      horizontalRule: () => insertAtCursor("\n---\n"),
      table: () =>
        insertAtCursor(
          "\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n"
        ),
      inlineMath: () => wrapSelection("$", "$"),
      blockMath: () => wrapSelection("$$\n", "\n$$"),
    }),
    [wrapSelection, insertAtCursor, insertAtLineStart, value]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === "b") {
        e.preventDefault();
        toolbarActions.bold();
      } else if (isMod && e.key === "i") {
        e.preventDefault();
        toolbarActions.italic();
      } else if (isMod && e.key === "k") {
        e.preventDefault();
        toolbarActions.link();
      } else if (isMod && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isMod && e.key === "y") {
        e.preventDefault();
        handleRedo();
      } else if (isMod && e.key === "s") {
        e.preventDefault();
        onSave?.(value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readOnly, toolbarActions, handleUndo, handleRedo, onSave, value]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Download markdown
  const handleDownload = useCallback(() => {
    const blob = new Blob([value], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [value, fileName]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [value]);

  // Import file
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        onChange(text);
        pushHistory(text);
      }
    };
    input.click();
  }, [onChange, pushHistory]);

  // Statistics
  const stats = useMemo(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const chars = value.length;
    const lines = value.split("\n").length;
    return { words, chars, lines };
  }, [value]);

  // Container classes
  const containerClasses = cn(
    "flex flex-col border rounded-lg bg-background overflow-hidden",
    isFullscreen && "fixed inset-0 z-50 rounded-none",
    className
  );

  return (
    <TooltipProvider>
      <div className={containerClasses} style={{ minHeight, maxHeight }}>
        {/* Toolbar */}
        {showToolbar && (
          <div className="flex items-center justify-between border-b bg-muted/30 px-2 py-1 gap-1 overflow-x-auto">
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Text formatting */}
              <ToolbarButton
                icon={Bold}
                label={t("markdown.toolbar.bold", "Bold (Ctrl+B)")}
                onClick={toolbarActions.bold}
                disabled={readOnly}
              />
              <ToolbarButton
                icon={Italic}
                label={t("markdown.toolbar.italic", "Italic (Ctrl+I)")}
                onClick={toolbarActions.italic}
                disabled={readOnly}
              />
              <ToolbarButton
                icon={Strikethrough}
                label={t("markdown.toolbar.strikethrough", "Strikethrough")}
                onClick={toolbarActions.strikethrough}
                disabled={readOnly}
              />
              <ToolbarButton
                icon={Code}
                label={t("markdown.toolbar.code", "Inline Code")}
                onClick={toolbarActions.code}
                disabled={readOnly}
              />

              <Separator orientation="vertical" className="mx-1 h-6" />

              {/* Headings dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={readOnly}
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={toolbarActions.heading1}>
                    <Heading1 className="mr-2 h-4 w-4" />
                    {t("markdown.toolbar.heading1", "Heading 1")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toolbarActions.heading2}>
                    <Heading2 className="mr-2 h-4 w-4" />
                    {t("markdown.toolbar.heading2", "Heading 2")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toolbarActions.heading3}>
                    <Heading3 className="mr-2 h-4 w-4" />
                    {t("markdown.toolbar.heading3", "Heading 3")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* Lists - some hidden on mobile */}
              <ToolbarButton
                icon={List}
                label={t("markdown.toolbar.bullet_list", "Bullet List")}
                onClick={toolbarActions.bulletList}
                disabled={readOnly}
              />
              <div className="hidden sm:flex items-center gap-0.5">
                <ToolbarButton
                  icon={ListOrdered}
                  label={t("markdown.toolbar.numbered_list", "Numbered List")}
                  onClick={toolbarActions.numberedList}
                  disabled={readOnly}
                />
                <ToolbarButton
                  icon={CheckSquare}
                  label={t("markdown.toolbar.task_list", "Task List")}
                  onClick={toolbarActions.taskList}
                  disabled={readOnly}
                />
              </div>

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* Insert - some hidden on mobile */}
              <ToolbarButton
                icon={Link}
                label={t("markdown.toolbar.link", "Link (Ctrl+K)")}
                onClick={toolbarActions.link}
                disabled={readOnly}
              />
              <div className="hidden sm:flex items-center gap-0.5">
                <ToolbarButton
                  icon={Image}
                  label={t("markdown.toolbar.image", "Image")}
                  onClick={toolbarActions.image}
                  disabled={readOnly}
                />
                <ToolbarButton
                  icon={Quote}
                  label={t("markdown.toolbar.quote", "Quote")}
                  onClick={toolbarActions.quote}
                  disabled={readOnly}
                />
              </div>

              {/* Code block with language selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={readOnly}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("")}
                  >
                    Plain Text
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("javascript")}
                  >
                    JavaScript
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("typescript")}
                  >
                    TypeScript
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("python")}
                  >
                    Python
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("rust")}
                  >
                    Rust
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("go")}
                  >
                    Go
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("java")}
                  >
                    Java
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("cpp")}
                  >
                    C++
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("html")}
                  >
                    HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("css")}
                  >
                    CSS
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("json")}
                  >
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("bash")}
                  >
                    Bash
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("sql")}
                  >
                    SQL
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toolbarActions.codeBlock("markdown")}
                  >
                    Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Table and HR - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-0.5">
                <ToolbarButton
                  icon={Table}
                  label={t("markdown.toolbar.table", "Table")}
                  onClick={toolbarActions.table}
                  disabled={readOnly}
                />
                <ToolbarButton
                  icon={Minus}
                  label={t("markdown.toolbar.hr", "Horizontal Rule")}
                  onClick={toolbarActions.horizontalRule}
                  disabled={readOnly}
                />

                {/* Math formulas */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={readOnly}
                    >
                      <Sigma className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={toolbarActions.inlineMath}>
                      {t("markdown.toolbar.inline_math", "Inline Math ($...$)")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toolbarActions.blockMath}>
                      {t("markdown.toolbar.block_math", "Block Math ($$...$$)")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* Undo/Redo */}
              <ToolbarButton
                icon={Undo}
                label={t("markdown.toolbar.undo", "Undo (Ctrl+Z)")}
                onClick={handleUndo}
                disabled={readOnly || historyIndex === 0}
              />
              <ToolbarButton
                icon={Redo}
                label={t("markdown.toolbar.redo", "Redo (Ctrl+Y)")}
                onClick={handleRedo}
                disabled={readOnly || historyIndex >= history.length - 1}
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* View mode toggle */}
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as ViewMode)}
                className="bg-muted rounded-md p-0.5"
              >
                <ToggleGroupItem
                  value="edit"
                  aria-label="Edit mode"
                  className="h-7 px-2 data-[state=on]:bg-background"
                >
                  <FileText className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                {/* Split mode - hidden on mobile */}
                <ToggleGroupItem
                  value="split"
                  aria-label="Split mode"
                  className="h-7 px-2 data-[state=on]:bg-background hidden sm:flex"
                >
                  <Columns className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="preview"
                  aria-label="Preview mode"
                  className="h-7 px-2 data-[state=on]:bg-background"
                >
                  <Eye className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Separator
                orientation="vertical"
                className="mx-1 h-6 hidden sm:block"
              />

              {/* Actions - some hidden on mobile */}
              <div className="hidden sm:flex items-center gap-0.5">
                <ToolbarButton
                  icon={Copy}
                  label={t("markdown.toolbar.copy", "Copy")}
                  onClick={handleCopy}
                />
                <ToolbarButton
                  icon={Download}
                  label={t("markdown.toolbar.download", "Download")}
                  onClick={handleDownload}
                />
                <ToolbarButton
                  icon={Upload}
                  label={t("markdown.toolbar.import", "Import")}
                  onClick={handleImport}
                  disabled={readOnly}
                />
              </div>
              {onSave && (
                <ToolbarButton
                  icon={Save}
                  label={t("markdown.toolbar.save", "Save (Ctrl+S)")}
                  onClick={() => onSave(value)}
                  disabled={readOnly}
                />
              )}
              <ToolbarButton
                icon={isFullscreen ? Minimize2 : Maximize2}
                label={t("markdown.toolbar.fullscreen", "Toggle Fullscreen")}
                onClick={toggleFullscreen}
              />
            </div>
          </div>
        )}

        {/* Editor/Preview area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor pane */}
          {(viewMode === "edit" || viewMode === "split") && (
            <div
              className={cn(
                "flex flex-col",
                viewMode === "split" ? "w-1/2 border-r" : "w-full"
              )}
            >
              <ScrollArea className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleChange}
                  placeholder={
                    placeholder ||
                    t("markdown.placeholder", "Write your markdown here...")
                  }
                  readOnly={readOnly}
                  className={cn(
                    "min-h-full w-full resize-none border-0 rounded-none",
                    "font-mono text-sm leading-relaxed p-4",
                    "focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                  style={{ minHeight: "100%" }}
                />
              </ScrollArea>
            </div>
          )}

          {/* Preview pane */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div
              className={cn(
                "flex flex-col",
                viewMode === "split" ? "w-1/2" : "w-full"
              )}
            >
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <MarkdownPreview
                    content={value}
                    showTOC={false}
                    enableAnchors={true}
                    onHeadingsChange={setHeadings}
                  />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Status bar */}
        {showStatusBar && (
          <div className="flex items-center justify-between border-t bg-muted/30 px-2 sm:px-4 py-1 text-xs text-muted-foreground gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <span>
                {stats.words}{" "}
                <span className="hidden sm:inline">
                  {t("markdown.words", "words")}
                </span>
                <span className="sm:hidden">W</span>
              </span>
              <span className="hidden sm:inline">
                {stats.chars} {t("markdown.chars", "characters")}
              </span>
              <span>
                {stats.lines}{" "}
                <span className="hidden sm:inline">
                  {t("markdown.lines", "lines")}
                </span>
                <span className="sm:hidden">L</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {headings.length > 0 && (
                <span className="hidden sm:inline">
                  {headings.length} {t("markdown.headings", "headings")}
                </span>
              )}
              <span>Markdown</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
