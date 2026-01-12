"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BlockHandle } from "./block-handle";
import { BlockActionsMenu } from "./block-actions-menu";
import { FloatingToolbar, useFloatingToolbar } from "./floating-toolbar";
import type { Block, BlockType } from "./types";

// Parse markdown content into blocks
function parseMarkdownToBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let currentBlock: string[] = [];
  let currentType: BlockType = "paragraph";
  let inCodeBlock = false;
  let codeBlockLang = "";

  const flushBlock = () => {
    if (currentBlock.length > 0) {
      blocks.push({
        id: nanoid(),
        type: currentType,
        content: currentBlock.join("\n"),
        metadata:
          currentType === "codeBlock" ? { language: codeBlockLang } : undefined,
      });
      currentBlock = [];
      currentType = "paragraph";
      codeBlockLang = "";
    }
  };

  for (const line of lines) {
    // Handle code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        currentBlock.push(line);
        flushBlock();
        inCodeBlock = false;
      } else {
        flushBlock();
        inCodeBlock = true;
        currentType = "codeBlock";
        codeBlockLang = line.slice(3).trim();
        currentBlock.push(line);
      }
      continue;
    }

    if (inCodeBlock) {
      currentBlock.push(line);
      continue;
    }

    // Handle headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushBlock();
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        id: nanoid(),
        type: `heading${level}` as BlockType,
        content: line,
      });
      continue;
    }

    // Handle horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      flushBlock();
      blocks.push({
        id: nanoid(),
        type: "divider",
        content: line,
      });
      continue;
    }

    // Handle bullet list
    if (/^[-*+]\s/.test(line)) {
      if (currentType !== "bulletList") {
        flushBlock();
        currentType = "bulletList";
      }
      currentBlock.push(line);
      continue;
    }

    // Handle numbered list
    if (/^\d+\.\s/.test(line)) {
      if (currentType !== "numberedList") {
        flushBlock();
        currentType = "numberedList";
      }
      currentBlock.push(line);
      continue;
    }

    // Handle task list
    if (/^[-*+]\s\[[ x]\]\s/.test(line)) {
      if (currentType !== "taskList") {
        flushBlock();
        currentType = "taskList";
      }
      currentBlock.push(line);
      continue;
    }

    // Handle blockquote
    if (line.startsWith("> ")) {
      if (currentType !== "quote") {
        flushBlock();
        currentType = "quote";
      }
      currentBlock.push(line);
      continue;
    }

    // Handle empty lines
    if (line.trim() === "") {
      flushBlock();
      continue;
    }

    // Default to paragraph
    if (currentType !== "paragraph") {
      flushBlock();
    }
    currentBlock.push(line);
  }

  flushBlock();
  return blocks;
}

// Convert blocks back to markdown
function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map((block) => block.content).join("\n\n");
}

// Sortable block wrapper
interface SortableBlockProps {
  block: Block;
  children: React.ReactNode;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onOpenMenu: (block: Block, position: { x: number; y: number }) => void;
  onAddBlock: (afterId: string) => void;
}

function SortableBlock({
  block,
  children,
  isHovered,
  onHover,
  onOpenMenu,
  onAddBlock,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group pl-8", isDragging && "z-50")}
      onMouseEnter={() => onHover(block.id)}
      onMouseLeave={() => onHover(null)}
      {...attributes}
    >
      <BlockHandle
        block={block}
        isHovered={isHovered}
        isDragging={isDragging}
        onDragStart={() => {}}
        onDragEnd={() => {}}
        onAddBlockBefore={() => {}}
        onAddBlockAfter={() => onAddBlock(block.id)}
        onOpenMenu={onOpenMenu}
        {...listeners}
      />
      {children}
    </div>
  );
}

export interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
}

export function BlockEditor({
  value,
  onChange,
  className,
  readOnly = false,
}: BlockEditorProps) {
  useTranslation();
  const [blocks, setBlocks] = useState<Block[]>(() =>
    parseMarkdownToBlocks(value)
  );
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    block: Block | null;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    block: null,
    position: { x: 0, y: 0 },
  });

  const floatingToolbar = useFloatingToolbar();
  const editorRef = useRef<HTMLDivElement>(null);

  // Update parent when blocks change
  const updateContent = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      const markdown = blocksToMarkdown(newBlocks);
      onChange(markdown);
    },
    [onChange]
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        updateContent(newBlocks);
      }
    },
    [blocks, updateContent]
  );

  // Block actions
  const handleOpenMenu = useCallback(
    (block: Block, position: { x: number; y: number }) => {
      setMenuState({ isOpen: true, block, position });
    },
    []
  );

  const handleCloseMenu = useCallback(() => {
    setMenuState({ isOpen: false, block: null, position: { x: 0, y: 0 } });
  }, []);

  const handleDeleteBlock = useCallback(
    (block: Block) => {
      const newBlocks = blocks.filter((b) => b.id !== block.id);
      updateContent(newBlocks);
    },
    [blocks, updateContent]
  );

  const handleDuplicateBlock = useCallback(
    (block: Block) => {
      const index = blocks.findIndex((b) => b.id === block.id);
      const newBlock: Block = {
        ...block,
        id: nanoid(),
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      updateContent(newBlocks);
    },
    [blocks, updateContent]
  );

  const handleMoveUp = useCallback(
    (block: Block) => {
      const index = blocks.findIndex((b) => b.id === block.id);
      if (index > 0) {
        const newBlocks = arrayMove(blocks, index, index - 1);
        updateContent(newBlocks);
      }
    },
    [blocks, updateContent]
  );

  const handleMoveDown = useCallback(
    (block: Block) => {
      const index = blocks.findIndex((b) => b.id === block.id);
      if (index < blocks.length - 1) {
        const newBlocks = arrayMove(blocks, index, index + 1);
        updateContent(newBlocks);
      }
    },
    [blocks, updateContent]
  );

  const handleConvertBlock = useCallback(
    (block: Block, newType: BlockType) => {
      const newBlocks = blocks.map((b) => {
        if (b.id === block.id) {
          // Convert content based on new type
          let newContent = b.content;

          // Remove old type markers
          newContent = newContent.replace(/^#{1,6}\s+/, "");
          newContent = newContent.replace(/^[-*+]\s+(\[[ x]\]\s+)?/, "");
          newContent = newContent.replace(/^\d+\.\s+/, "");
          newContent = newContent.replace(/^>\s+/gm, "");

          // Add new type markers
          switch (newType) {
            case "heading1":
              newContent = `# ${newContent}`;
              break;
            case "heading2":
              newContent = `## ${newContent}`;
              break;
            case "heading3":
              newContent = `### ${newContent}`;
              break;
            case "bulletList":
              newContent = newContent
                .split("\n")
                .map((l) => `- ${l}`)
                .join("\n");
              break;
            case "numberedList":
              newContent = newContent
                .split("\n")
                .map((l, i) => `${i + 1}. ${l}`)
                .join("\n");
              break;
            case "taskList":
              newContent = newContent
                .split("\n")
                .map((l) => `- [ ] ${l}`)
                .join("\n");
              break;
            case "quote":
              newContent = newContent
                .split("\n")
                .map((l) => `> ${l}`)
                .join("\n");
              break;
            case "codeBlock":
              newContent = `\`\`\`\n${newContent}\n\`\`\``;
              break;
          }

          return { ...b, type: newType, content: newContent };
        }
        return b;
      });
      updateContent(newBlocks);
    },
    [blocks, updateContent]
  );

  const handleCopyBlock = useCallback((block: Block) => {
    navigator.clipboard.writeText(block.content);
  }, []);

  const handleCutBlock = useCallback(
    (block: Block) => {
      navigator.clipboard.writeText(block.content);
      handleDeleteBlock(block);
    },
    [handleDeleteBlock]
  );

  const handleAddBlock = useCallback(
    (afterId: string) => {
      const index = blocks.findIndex((b) => b.id === afterId);
      const newBlock: Block = {
        id: nanoid(),
        type: "paragraph",
        content: "",
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      updateContent(newBlocks);
    },
    [blocks, updateContent]
  );

  // Floating toolbar actions
  const handleBold = useCallback(() => {
    // Insert bold markdown around selection
    floatingToolbar.hide();
  }, [floatingToolbar]);

  const handleItalic = useCallback(() => {
    floatingToolbar.hide();
  }, [floatingToolbar]);

  const handleStrikethrough = useCallback(() => {
    floatingToolbar.hide();
  }, [floatingToolbar]);

  const handleCode = useCallback(() => {
    floatingToolbar.hide();
  }, [floatingToolbar]);

  const handleLink = useCallback(() => {
    floatingToolbar.hide();
  }, [floatingToolbar]);

  const handleHighlight = useCallback(() => {
    floatingToolbar.hide();
  }, [floatingToolbar]);

  // Render block content
  const renderBlockContent = useCallback(
    (block: Block) => {
      return (
        <div
          className={cn(
            "py-1 px-2 rounded outline-none",
            "focus:ring-2 focus:ring-primary/20"
          )}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onBlur={(e) => {
            const newContent = e.currentTarget.textContent || "";
            if (newContent !== block.content) {
              const newBlocks = blocks.map((b) =>
                b.id === block.id ? { ...b, content: newContent } : b
              );
              updateContent(newBlocks);
            }
          }}
        >
          {block.content}
        </div>
      );
    },
    [blocks, readOnly, updateContent]
  );

  const activeBlock = useMemo(
    () => blocks.find((b) => b.id === activeId),
    [blocks, activeId]
  );

  return (
    <TooltipProvider>
      <div
        ref={editorRef}
        className={cn(
          "relative min-h-[400px] py-4 px-8 bg-background",
          className
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                isHovered={hoveredBlockId === block.id}
                onHover={setHoveredBlockId}
                onOpenMenu={handleOpenMenu}
                onAddBlock={handleAddBlock}
              >
                {renderBlockContent(block)}
              </SortableBlock>
            ))}
          </SortableContext>

          <DragOverlay>
            {activeBlock && (
              <div className="bg-background border rounded-lg p-2 shadow-lg opacity-90">
                {activeBlock.content}
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Block actions menu */}
        {menuState.isOpen && menuState.block && (
          <BlockActionsMenu
            block={menuState.block}
            position={menuState.position}
            isOpen={menuState.isOpen}
            onClose={handleCloseMenu}
            onDelete={handleDeleteBlock}
            onDuplicate={handleDuplicateBlock}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onConvert={handleConvertBlock}
            onCopy={handleCopyBlock}
            onCut={handleCutBlock}
          />
        )}

        {/* Floating toolbar */}
        <FloatingToolbar
          isVisible={floatingToolbar.isVisible}
          position={floatingToolbar.position}
          selectedText={floatingToolbar.selectedText}
          onBold={handleBold}
          onItalic={handleItalic}
          onStrikethrough={handleStrikethrough}
          onCode={handleCode}
          onLink={handleLink}
          onHighlight={handleHighlight}
        />
      </div>
    </TooltipProvider>
  );
}
