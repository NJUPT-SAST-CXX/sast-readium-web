"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Trash2,
  Copy,
  ClipboardPaste,
  ArrowUp,
  ArrowDown,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Table,
  Minus,
  Type,
  ChevronRight,
  Columns,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Block, BlockType } from "./types";

export interface BlockActionsMenuProps {
  block: Block;
  position: { x: number; y: number };
  isOpen: boolean;
  onClose: () => void;
  onDelete: (block: Block) => void;
  onDuplicate: (block: Block) => void;
  onMoveUp: (block: Block) => void;
  onMoveDown: (block: Block) => void;
  onConvert: (block: Block, newType: BlockType) => void;
  onCopy: (block: Block) => void;
  onCut: (block: Block) => void;
}

const blockTypeIcons: Record<BlockType, React.ElementType> = {
  paragraph: Type,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  heading4: Heading1,
  heading5: Heading1,
  heading6: Heading1,
  bulletList: List,
  numberedList: ListOrdered,
  taskList: ListChecks,
  quote: Quote,
  codeBlock: Code,
  table: Table,
  image: LayoutGrid,
  divider: Minus,
  callout: Quote,
  math: Code,
  mermaid: Code,
  video: LayoutGrid,
  audio: LayoutGrid,
  file: LayoutGrid,
  embed: LayoutGrid,
  columns: Columns,
  tabs: LayoutGrid,
  details: ChevronRight,
};

const convertOptions: { type: BlockType; label: string }[] = [
  { type: "paragraph", label: "正文" },
  { type: "heading1", label: "标题 1" },
  { type: "heading2", label: "标题 2" },
  { type: "heading3", label: "标题 3" },
  { type: "bulletList", label: "无序列表" },
  { type: "numberedList", label: "有序列表" },
  { type: "taskList", label: "任务列表" },
  { type: "quote", label: "引用" },
  { type: "codeBlock", label: "代码块" },
  { type: "callout", label: "提示框" },
];

export function BlockActionsMenu({
  block,
  position,
  isOpen,
  onClose,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onConvert,
  onCopy,
  onCut,
}: BlockActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showConvertMenu, setShowConvertMenu] = useState(false);
  const [search, setSearch] = useState("");

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConvertMenu) {
          setShowConvertMenu(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, showConvertMenu, onClose]);

  const handleAction = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose]
  );

  const handleConvert = useCallback(
    (newType: BlockType) => {
      onConvert(block, newType);
      onClose();
    },
    [block, onConvert, onClose]
  );

  if (!isOpen) return null;

  const CurrentIcon = blockTypeIcons[block.type] || Type;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] overflow-hidden rounded-lg border bg-popover p-0 shadow-lg animate-in fade-in-0 zoom-in-95"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {showConvertMenu ? (
        <Command>
          <CommandInput
            placeholder="转换为..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-64">
            <CommandEmpty>未找到块类型</CommandEmpty>
            <CommandGroup>
              {convertOptions
                .filter(
                  (opt) =>
                    opt.label.toLowerCase().includes(search.toLowerCase()) ||
                    opt.type.toLowerCase().includes(search.toLowerCase())
                )
                .map((opt) => {
                  const Icon = blockTypeIcons[opt.type];
                  return (
                    <CommandItem
                      key={opt.type}
                      value={opt.type}
                      onSelect={() => handleConvert(opt.type)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                      {block.type === opt.type && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          当前
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => setShowConvertMenu(false)}
            >
              ← 返回
            </button>
          </div>
        </Command>
      ) : (
        <div className="p-1">
          {/* Current block type indicator */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
            <CurrentIcon className="h-3.5 w-3.5" />
            <span>
              {convertOptions.find((o) => o.type === block.type)?.label ||
                block.type}
            </span>
          </div>

          {/* Actions */}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setShowConvertMenu(true)}
          >
            <ChevronRight className="h-4 w-4" />
            <span>转换为</span>
            <ChevronRight className="h-3 w-3 ml-auto" />
          </button>

          <div className="h-px bg-border my-1" />

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => handleAction(() => onCopy(block))}
          >
            <Copy className="h-4 w-4" />
            <span>复制</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘C</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => handleAction(() => onCut(block))}
          >
            <ClipboardPaste className="h-4 w-4" />
            <span>剪切</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘X</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => handleAction(() => onDuplicate(block))}
          >
            <Copy className="h-4 w-4" />
            <span>复制块</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘D</span>
          </button>

          <div className="h-px bg-border my-1" />

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => handleAction(() => onMoveUp(block))}
          >
            <ArrowUp className="h-4 w-4" />
            <span>上移</span>
            <span className="ml-auto text-xs text-muted-foreground">⌥↑</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => handleAction(() => onMoveDown(block))}
          >
            <ArrowDown className="h-4 w-4" />
            <span>下移</span>
            <span className="ml-auto text-xs text-muted-foreground">⌥↓</span>
          </button>

          <div className="h-px bg-border my-1" />

          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
              "text-destructive hover:bg-destructive/10"
            )}
            onClick={() => handleAction(() => onDelete(block))}
          >
            <Trash2 className="h-4 w-4" />
            <span>删除</span>
            <span className="ml-auto text-xs">⌫</span>
          </button>
        </div>
      )}
    </div>
  );
}
