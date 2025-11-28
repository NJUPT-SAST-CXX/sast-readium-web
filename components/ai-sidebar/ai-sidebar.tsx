"use client";

import { useAIChatStore } from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";
import {
  X,
  Settings,
  MessageSquare,
  History,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useTranslation } from "react-i18next";
import { AIChatPanel } from "./ai-chat-panel";
import { AISettingsPanel } from "./ai-settings-panel";
import { AIHistoryPanel } from "./ai-history-panel";
import { AIToolsPanel } from "./ai-tools-panel";
import { useEffect, useState, useCallback, useRef } from "react";

interface AISidebarProps {
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

interface AISidebarContentProps {
  isMobile?: boolean;
}

function AISidebarContent({ isMobile = false }: AISidebarContentProps) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
      <TabsList
        className={cn(
          "w-full grid grid-cols-4 rounded-none border-b border-border/50 bg-muted/30",
          isMobile ? "h-12" : "h-11"
        )}
      >
        <TabsTrigger
          value="chat"
          className={cn(
            "gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs sm:text-sm"
          )}
        >
          <MessageSquare className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
          <span
            className={cn(isMobile ? "inline" : "hidden xs:inline sm:inline")}
          >
            {t("ai.chat")}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="tools"
          className={cn(
            "gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs sm:text-sm"
          )}
        >
          <Sparkles className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
          <span
            className={cn(isMobile ? "inline" : "hidden xs:inline sm:inline")}
          >
            {t("ai.tools")}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className={cn(
            "gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs sm:text-sm"
          )}
        >
          <History className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
          <span
            className={cn(isMobile ? "inline" : "hidden xs:inline sm:inline")}
          >
            {t("ai.history")}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className={cn(
            "gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs sm:text-sm"
          )}
        >
          <Settings className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
          <span
            className={cn(isMobile ? "inline" : "hidden xs:inline sm:inline")}
          >
            {t("ai.settings")}
          </span>
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <TabsContent
          value="chat"
          className="h-full m-0 p-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <AIChatPanel />
        </TabsContent>

        <TabsContent
          value="tools"
          className="h-full m-0 p-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <AIToolsPanel />
        </TabsContent>

        <TabsContent
          value="history"
          className="h-full m-0 p-0 overflow-auto data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <AIHistoryPanel />
        </TabsContent>

        <TabsContent
          value="settings"
          className="h-full m-0 p-0 overflow-auto data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <AISettingsPanel />
        </TabsContent>
      </div>
    </Tabs>
  );
}

export function AISidebar({ width, onResizeStart }: AISidebarProps) {
  const { t } = useTranslation();
  const { isSidebarOpen, setSidebarOpen } = useAIChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isResizeHovered, setIsResizeHovered] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle keyboard shortcut to close sidebar
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setSidebarOpen(false);
      }
    },
    [isSidebarOpen, setSidebarOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Mobile: Use bottom drawer with enhanced styling
  if (isMobile) {
    return (
      <Drawer open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent
          className={cn(
            "h-[90vh] max-h-[90vh]",
            "rounded-t-2xl",
            "bg-gradient-to-b from-background via-background to-muted/30",
            "shadow-2xl",
            "pb-safe"
          )}
        >
          {/* Drag handle indicator */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>

          <DrawerHeader
            className={cn(
              "flex flex-row items-center justify-between py-3 px-4",
              "border-b border-border/50",
              "bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <DrawerTitle className="text-lg font-semibold">
                {t("ai.sidebar_title")}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <AISidebarContent isMobile />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use side panel with enhanced animations
  return (
    <div
      ref={sidebarRef}
      className={cn(
        "relative flex flex-col overflow-hidden z-20",
        // Background with subtle gradient
        "bg-gradient-to-br from-background via-background to-muted/20",
        // Border styling
        "border-l border-border/50",
        // Shadow for depth
        "shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.15)]",
        "dark:shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.4)]",
        // Smooth transitions
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "will-change-[width,opacity,transform]",
        // Open/close states
        isSidebarOpen
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-4 pointer-events-none",
        // Ensure smooth initial render
        !isSidebarOpen && "opacity-0"
      )}
      style={{
        width: isSidebarOpen ? `${width}px` : 0,
      }}
    >
      {/* Resize handle on the left edge */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10",
          "transition-all duration-200",
          "group"
        )}
        onMouseDown={onResizeStart}
        onMouseEnter={() => setIsResizeHovered(true)}
        onMouseLeave={() => setIsResizeHovered(false)}
      >
        {/* Visual indicator line */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            "transition-all duration-200",
            isResizeHovered
              ? "bg-primary/60 shadow-[0_0_8px_2px_rgba(var(--primary),0.3)]"
              : "bg-transparent group-hover:bg-primary/40"
          )}
        />
        {/* Grip icon indicator */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "p-1 rounded-md",
            "transition-all duration-200",
            isResizeHovered
              ? "opacity-100 bg-primary/10"
              : "opacity-0 group-hover:opacity-70"
          )}
        >
          <GripVertical className="w-3 h-3 text-primary" />
        </div>
      </div>

      {/* Header with gradient background */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          "border-b border-border/50",
          "bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50",
          "backdrop-blur-sm"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-xl",
              "bg-primary/10 ring-1 ring-primary/20",
              "transition-transform duration-300",
              isSidebarOpen && "animate-in zoom-in-50 duration-300"
            )}
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2
            className={cn(
              "font-semibold text-lg",
              "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
              "transition-opacity duration-300 delay-75",
              isSidebarOpen ? "opacity-100" : "opacity-0"
            )}
          >
            {t("ai.sidebar_title")}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("ai.close_sidebar")}
          className={cn(
            "rounded-full",
            "hover:bg-destructive/10 hover:text-destructive",
            "transition-all duration-200",
            "hover:rotate-90"
          )}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content with staggered animation */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          "transition-opacity duration-300 delay-100",
          isSidebarOpen ? "opacity-100" : "opacity-0"
        )}
      >
        <AISidebarContent />
      </div>
    </div>
  );
}
