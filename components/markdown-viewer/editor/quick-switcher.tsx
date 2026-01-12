"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Clock, Search, Hash, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export interface QuickSwitcherItem {
  id: string;
  title: string;
  type: "file" | "heading" | "command" | "recent";
  path?: string;
  icon?: React.ReactNode;
  action?: () => void;
}

export interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuickSwitcherItem[];
  recentItems?: QuickSwitcherItem[];
  onSelect: (item: QuickSwitcherItem) => void;
}

export function QuickSwitcher({
  isOpen,
  onClose,
  items,
  recentItems = [],
  onSelect,
}: QuickSwitcherProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;

    const lowerSearch = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerSearch) ||
        item.path?.toLowerCase().includes(lowerSearch)
    );
  }, [items, search]);

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: Record<string, QuickSwitcherItem[]> = {
      recent: [],
      file: [],
      heading: [],
      command: [],
    };

    // Add recent items first
    if (!search.trim() && recentItems.length > 0) {
      groups.recent = recentItems.slice(0, 5);
    }

    // Add filtered items
    for (const item of filteredItems) {
      if (groups[item.type]) {
        groups[item.type].push(item);
      }
    }

    return groups;
  }, [filteredItems, recentItems, search]);

  const handleSelect = useCallback(
    (item: QuickSwitcherItem) => {
      onSelect(item);
      onClose();
      setSearch("");
    },
    [onSelect, onClose]
  );

  const getIcon = (item: QuickSwitcherItem) => {
    if (item.icon) return item.icon;

    switch (item.type) {
      case "file":
        return <FileText className="h-4 w-4" />;
      case "heading":
        return <Hash className="h-4 w-4" />;
      case "command":
        return <ArrowRight className="h-4 w-4" />;
      case "recent":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <Command className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder={t(
                "quickSwitcher.placeholder",
                "Search files, headings, commands..."
              )}
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              {t("quickSwitcher.noResults", "No results found")}
            </CommandEmpty>

            {/* Recent items */}
            {groupedItems.recent.length > 0 && (
              <>
                <CommandGroup heading={t("quickSwitcher.recent", "Recent")}>
                  {groupedItems.recent.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.path && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {item.path}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Files */}
            {groupedItems.file.length > 0 && (
              <CommandGroup heading={t("quickSwitcher.files", "Files")}>
                {groupedItems.file.slice(0, 10).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {getIcon(item)}
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.path && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {item.path}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Headings */}
            {groupedItems.heading.length > 0 && (
              <CommandGroup heading={t("quickSwitcher.headings", "Headings")}>
                {groupedItems.heading.slice(0, 10).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {getIcon(item)}
                    <span className="flex-1 truncate">{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Commands */}
            {groupedItems.command.length > 0 && (
              <CommandGroup heading={t("quickSwitcher.commands", "Commands")}>
                {groupedItems.command.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {getIcon(item)}
                    <span className="flex-1">{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>

          {/* Footer hint */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd>{" "}
              导航
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">
                Enter
              </kbd>{" "}
              选择
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">
                Esc
              </kbd>{" "}
              关闭
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage quick switcher state
export function useQuickSwitcher() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Keyboard shortcut: Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
