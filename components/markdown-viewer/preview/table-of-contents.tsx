"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { TOCItem } from "@/lib/utils";

// Re-export TOCItem for convenience
export type { TOCItem } from "@/lib/utils";

// ============================================================================
// Table of Contents Component (Collapsible)
// ============================================================================

export interface TableOfContentsProps {
  items: TOCItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
}

export function TableOfContents({
  items,
  activeId,
  onItemClick,
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between p-2 hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="font-medium">Table of Contents</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <nav className="mt-2 border-l-2 border-muted pl-4">
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              >
                <button
                  onClick={() => onItemClick?.(item.id)}
                  className={cn(
                    "block w-full text-left text-sm py-1 px-2 rounded transition-colors hover:bg-muted",
                    activeId === item.id
                      ? "text-primary font-medium bg-primary/10"
                      : "text-muted-foreground"
                  )}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// TOC Sidebar Component (Standalone)
// ============================================================================

export interface TOCSidebarProps {
  items: TOCItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

export function TOCSidebar({
  items,
  activeId,
  onItemClick,
  className,
}: TOCSidebarProps) {
  if (items.length === 0) return null;

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4">
        <h4 className="mb-4 text-sm font-semibold">On This Page</h4>
        <nav>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              >
                <button
                  onClick={() => onItemClick?.(item.id)}
                  className={cn(
                    "block w-full text-left text-sm py-1 transition-colors hover:text-foreground",
                    activeId === item.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </ScrollArea>
  );
}
