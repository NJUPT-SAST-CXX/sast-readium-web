"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
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
  Image,
  Link,
  AlertCircle,
  Lightbulb,
  Info,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Sigma,
  FileText,
  Bookmark,
  Star,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: string;
  markdown: string;
  cursorOffset?: number;
}

const slashCommands: SlashCommandItem[] = [
  // Headings
  {
    id: "h1",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    category: "Headings",
    markdown: "# ",
  },
  {
    id: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    category: "Headings",
    markdown: "## ",
  },
  {
    id: "h3",
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    category: "Headings",
    markdown: "### ",
  },
  // Lists
  {
    id: "bullet",
    label: "Bullet List",
    description: "Create a simple bullet list",
    icon: List,
    category: "Lists",
    markdown: "- ",
  },
  {
    id: "numbered",
    label: "Numbered List",
    description: "Create a numbered list",
    icon: ListOrdered,
    category: "Lists",
    markdown: "1. ",
  },
  {
    id: "todo",
    label: "Task List",
    description: "Create a task/todo list",
    icon: ListChecks,
    category: "Lists",
    markdown: "- [ ] ",
  },
  // Blocks
  {
    id: "quote",
    label: "Quote",
    description: "Capture a quote",
    icon: Quote,
    category: "Blocks",
    markdown: "> ",
  },
  {
    id: "code",
    label: "Code Block",
    description: "Add a code snippet",
    icon: Code,
    category: "Blocks",
    markdown: "```\n\n```",
    cursorOffset: -4,
  },
  {
    id: "table",
    label: "Table",
    description: "Add a simple table",
    icon: Table,
    category: "Blocks",
    markdown:
      "| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n",
  },
  {
    id: "divider",
    label: "Divider",
    description: "Visual divider line",
    icon: Minus,
    category: "Blocks",
    markdown: "\n---\n",
  },
  {
    id: "details",
    label: "Collapsible",
    description: "Expandable/collapsible section",
    icon: ChevronDown,
    category: "Blocks",
    markdown:
      "<details>\n<summary>Click to expand</summary>\n\nContent here...\n\n</details>\n",
    cursorOffset: -20,
  },
  // Media
  {
    id: "image",
    label: "Image",
    description: "Embed an image",
    icon: Image,
    category: "Media",
    markdown: "![Alt text](url)",
    cursorOffset: -1,
  },
  {
    id: "link",
    label: "Link",
    description: "Add a hyperlink",
    icon: Link,
    category: "Media",
    markdown: "[Link text](url)",
    cursorOffset: -1,
  },
  // Math
  {
    id: "math-inline",
    label: "Inline Math",
    description: "Inline LaTeX formula",
    icon: Sigma,
    category: "Math",
    markdown: "$ $",
    cursorOffset: -2,
  },
  {
    id: "math-block",
    label: "Block Math",
    description: "Display LaTeX formula",
    icon: Sigma,
    category: "Math",
    markdown: "$$\n\n$$",
    cursorOffset: -3,
  },
  // Callouts
  {
    id: "note",
    label: "Note",
    description: "Information callout",
    icon: FileText,
    category: "Callouts",
    markdown: ":::note\nNote content here\n:::\n",
  },
  {
    id: "tip",
    label: "Tip",
    description: "Helpful tip callout",
    icon: Lightbulb,
    category: "Callouts",
    markdown: ":::tip\nTip content here\n:::\n",
  },
  {
    id: "info",
    label: "Info",
    description: "Information callout",
    icon: Info,
    category: "Callouts",
    markdown: ":::info\nInfo content here\n:::\n",
  },
  {
    id: "success",
    label: "Success",
    description: "Success message",
    icon: CheckCircle,
    category: "Callouts",
    markdown: ":::success\nSuccess content here\n:::\n",
  },
  {
    id: "warning",
    label: "Warning",
    description: "Warning callout",
    icon: AlertTriangle,
    category: "Callouts",
    markdown: ":::warning\nWarning content here\n:::\n",
  },
  {
    id: "danger",
    label: "Danger",
    description: "Danger/error callout",
    icon: AlertCircle,
    category: "Callouts",
    markdown: ":::danger\nDanger content here\n:::\n",
  },
  {
    id: "highlight",
    label: "Highlight",
    description: "Highlighted content",
    icon: Star,
    category: "Callouts",
    markdown: ":::highlight\nHighlighted content here\n:::\n",
  },
  {
    id: "bookmark",
    label: "Bookmark",
    description: "Bookmarked content",
    icon: Bookmark,
    category: "Callouts",
    markdown: ":::bookmark\nBookmarked content here\n:::\n",
  },
  {
    id: "discussion",
    label: "Discussion",
    description: "Discussion point",
    icon: MessageSquare,
    category: "Callouts",
    markdown: ":::discussion\nDiscussion content here\n:::\n",
  },
];

export interface SlashCommandMenuProps {
  onSelect: (markdown: string, cursorOffset?: number) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function SlashCommandMenu({
  onSelect,
  trigger,
  className,
}: SlashCommandMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCommands = useMemo(() => {
    if (!search) return slashCommands;
    const lowerSearch = search.toLowerCase();
    return slashCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerSearch) ||
        cmd.description.toLowerCase().includes(lowerSearch) ||
        cmd.category.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, SlashCommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const handleSelect = useCallback(
    (cmd: SlashCommandItem) => {
      onSelect(cmd.markdown, cmd.cursorOffset);
      setOpen(false);
      setSearch("");
    },
    [onSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "h-8 w-8",
              className
            )}
          >
            /
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" sideOffset={5}>
        <Command>
          <CommandInput
            placeholder="Search commands..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-80">
            <CommandEmpty>No commands found.</CommandEmpty>
            {Object.entries(groupedCommands).map(
              ([category, commands], idx) => (
                <div key={category}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup heading={category}>
                    {commands.map((cmd) => (
                      <CommandItem
                        key={cmd.id}
                        value={cmd.id}
                        onSelect={() => handleSelect(cmd)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{cmd.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {cmd.description}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              )
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface SlashCommandInputProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsert: (text: string, cursorOffset?: number) => void;
}

export function useSlashCommand({
  textareaRef,
  onInsert,
}: SlashCommandInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = useMemo(() => {
    if (!search) return slashCommands;
    const lowerSearch = search.toLowerCase();
    return slashCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerSearch) ||
        cmd.description.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Detect "/" key press at start of line or after space
      if (e.key === "/" && !isOpen) {
        const { selectionStart, value } = textarea;
        const beforeCursor = value.slice(0, selectionStart);
        const lastNewline = beforeCursor.lastIndexOf("\n");
        const lineStart = lastNewline + 1;
        const currentLine = beforeCursor.slice(lineStart);

        // Only open if at start of line or after whitespace
        if (currentLine.trim() === "" || currentLine.endsWith(" ")) {
          // Get cursor position for menu placement
          const rect = textarea.getBoundingClientRect();
          const lineHeight =
            parseInt(getComputedStyle(textarea).lineHeight) || 20;
          const lines = beforeCursor.split("\n").length;

          setPosition({
            top: rect.top + lines * lineHeight + window.scrollY,
            left: rect.left + window.scrollX,
          });
          setIsOpen(true);
          setSearch("");
        }
      }

      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearch("");
      }
    },
    [textareaRef, isOpen]
  );

  const handleSelect = useCallback(
    (cmd: SlashCommandItem) => {
      onInsert(cmd.markdown, cmd.cursorOffset);
      setIsOpen(false);
      setSearch("");
    },
    [onInsert]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener("keydown", handleKeyDown);
    return () => textarea.removeEventListener("keydown", handleKeyDown);
  }, [textareaRef, handleKeyDown]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return {
    isOpen,
    position,
    search,
    setSearch,
    filteredCommands,
    handleSelect,
    menuRef,
    close: () => {
      setIsOpen(false);
      setSearch("");
    },
  };
}

export { slashCommands };
