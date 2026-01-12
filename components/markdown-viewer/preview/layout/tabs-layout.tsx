"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsLayoutProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}

export function TabsLayout({ tabs, defaultTab, className }: TabsLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const activeContent = useMemo(
    () => tabs.find((t) => t.id === activeTab)?.content,
    [tabs, activeTab]
  );

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div className={cn("my-4 rounded-lg border", className)}>
      {/* Tab headers */}
      <div className="flex border-b bg-muted/30 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              "hover:bg-muted/50",
              "border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            )}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">{activeContent}</div>
    </div>
  );
}

// Parse tabs from markdown syntax
// :::tabs
// :::tab[Tab 1]
// Content 1
// :::
// :::tab[Tab 2]
// Content 2
// :::
// :::
export function parseTabsFromMarkdown(content: string): TabItem[] {
  const tabRegex = /:::tab\[([^\]]+)\]\n([\s\S]*?)(?=:::tab\[|:::$)/g;
  const tabs: TabItem[] = [];
  let match;

  while ((match = tabRegex.exec(content)) !== null) {
    tabs.push({
      id: `tab-${tabs.length}`,
      label: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return tabs;
}
