"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronDown, FileText, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { DocNavItem } from "@/lib/ui";

interface HelpSidebarProps {
  navigation: DocNavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface NavItemProps {
  item: DocNavItem;
  level: number;
  currentPath: string;
  onNavigate: (path: string) => void;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
}

function NavItem({
  item,
  level,
  currentPath,
  onNavigate,
  expandedPaths,
  toggleExpanded,
}: NavItemProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedPaths.has(item.path);
  const isActive = currentPath === item.path;
  const isParentOfActive =
    hasChildren && item.children?.some((child) => currentPath === child.path);

  const handleClick = () => {
    if (hasChildren) {
      toggleExpanded(item.path);
    } else {
      onNavigate(item.path);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start gap-2 h-8 px-2 font-normal",
          isActive && "bg-accent text-accent-foreground font-medium",
          isParentOfActive && "text-primary"
        )}
        style={{ paddingLeft: `${8 + level * 12}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm">{item.title}</span>
        {hasChildren && (
          <FolderOpen className="h-3 w-3 ml-auto text-muted-foreground" />
        )}
      </Button>
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {item.children!.map((child) => (
            <NavItem
              key={child.path}
              item={child}
              level={level + 1}
              currentPath={currentPath}
              onNavigate={onNavigate}
              expandedPaths={expandedPaths}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HelpSidebar({
  navigation,
  currentPath,
  onNavigate,
}: HelpSidebarProps) {
  const { t } = useTranslation();

  // Initialize expanded paths based on current path
  const getInitialExpanded = (): Set<string> => {
    const expanded = new Set<string>();
    for (const item of navigation) {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.path === currentPath
        );
        if (hasActiveChild) {
          expanded.add(item.path);
        }
      }
    }
    return expanded;
  };

  const [expandedPaths, setExpandedPaths] =
    useState<Set<string>>(getInitialExpanded);

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-muted/30">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">{t("help.navigation")}</h2>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          {navigation.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              level={0}
              currentPath={currentPath}
              onNavigate={onNavigate}
              expandedPaths={expandedPaths}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
