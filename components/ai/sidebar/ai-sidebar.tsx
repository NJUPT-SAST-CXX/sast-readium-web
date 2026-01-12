"use client";

import { useAIChatStore } from "@/lib/ai/core";
import { cn } from "@/lib/utils";
import {
  X,
  Settings,
  MessageSquare,
  History,
  Sparkles,
  GripVertical,
  GraduationCap,
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
import { AIChatPanel } from "../chat/ai-chat-panel";
import { AISettingsPanel } from "../settings/ai-settings-panel";
import { AIHistoryPanel } from "../chat/ai-history-panel";
import { AIToolsPanel } from "../tools/ai-tools-panel";
import { LearningTab } from "@/components/ai/learning/shared/learning-tab";
import { useEffect, useState, useCallback, useRef } from "react";

interface AISidebarProps {
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

interface AISidebarContentProps {
  isMobile?: boolean;
  isCompact?: boolean;
}

function AISidebarContent({
  isMobile = false,
  isCompact = false,
}: AISidebarContentProps) {
  const { t } = useTranslation();
  const showLabels = isMobile || !isCompact;

  return (
    <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
      <TabsList
        className={cn(
          "w-full grid grid-cols-5 rounded-none border-b border-border/50 bg-muted/30",
          isMobile ? "h-12" : "h-11"
        )}
      >
        <TabsTrigger
          value="chat"
          className={cn(
            "gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs",
            !showLabels && "px-2"
          )}
          title={!showLabels ? t("ai.chat") : undefined}
        >
          <MessageSquare
            className={cn(isMobile ? "w-5 h-5" : "w-4 h-4 shrink-0")}
          />
          {showLabels && <span className="truncate">{t("ai.chat")}</span>}
        </TabsTrigger>
        <TabsTrigger
          value="tools"
          className={cn(
            "gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs",
            !showLabels && "px-2"
          )}
          title={!showLabels ? t("ai.tools") : undefined}
        >
          <Sparkles className={cn(isMobile ? "w-5 h-5" : "w-4 h-4 shrink-0")} />
          {showLabels && <span className="truncate">{t("ai.tools")}</span>}
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className={cn(
            "gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs",
            !showLabels && "px-2"
          )}
          title={!showLabels ? t("ai.history") : undefined}
        >
          <History className={cn(isMobile ? "w-5 h-5" : "w-4 h-4 shrink-0")} />
          {showLabels && <span className="truncate">{t("ai.history")}</span>}
        </TabsTrigger>
        <TabsTrigger
          value="learn"
          className={cn(
            "gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs",
            !showLabels && "px-2"
          )}
          title={!showLabels ? t("ai.learn", "Learn") : undefined}
        >
          <GraduationCap
            className={cn(isMobile ? "w-5 h-5" : "w-4 h-4 shrink-0")}
          />
          {showLabels && (
            <span className="truncate">{t("ai.learn", "Learn")}</span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className={cn(
            "gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm",
            "transition-all duration-200",
            isMobile ? "text-sm py-2.5" : "text-xs",
            !showLabels && "px-2"
          )}
          title={!showLabels ? t("ai.settings") : undefined}
        >
          <Settings className={cn(isMobile ? "w-5 h-5" : "w-4 h-4 shrink-0")} />
          {showLabels && <span className="truncate">{t("ai.settings")}</span>}
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <TabsContent
          value="chat"
          className="flex-1 min-h-0 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <AIChatPanel />
        </TabsContent>

        <TabsContent
          value="tools"
          className="flex-1 min-h-0 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <AIToolsPanel />
        </TabsContent>

        <TabsContent
          value="history"
          className="flex-1 min-h-0 m-0 p-0 overflow-auto custom-scrollbar data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <AIHistoryPanel />
        </TabsContent>

        <TabsContent
          value="learn"
          className="flex-1 min-h-0 m-0 p-0 overflow-auto custom-scrollbar data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
        >
          <LearningTab />
        </TabsContent>

        <TabsContent
          value="settings"
          className="flex-1 min-h-0 m-0 p-0 overflow-auto custom-scrollbar data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-200"
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
      const newIsMobile = window.innerWidth < 640;
      setIsMobile(newIsMobile);

      // Auto-close sidebar when viewport becomes too narrow for both content and sidebar
      // This prevents layout overflow issues
      if (
        isSidebarOpen &&
        window.innerWidth < 768 &&
        window.innerWidth >= 640
      ) {
        // In tablet range, close sidebar if it would squeeze main content too much
        const mainContentMinWidth = 400;
        if (window.innerWidth - width < mainContentMinWidth) {
          setSidebarOpen(false);
        }
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isSidebarOpen, setSidebarOpen, width]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape to close sidebar
      if (e.key === "Escape" && isSidebarOpen) {
        setSidebarOpen(false);
      }
      // Ctrl/Cmd + Shift + A to toggle sidebar
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "a"
      ) {
        e.preventDefault();
        setSidebarOpen(!isSidebarOpen);
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
        "relative h-full flex flex-col overflow-hidden z-20",
        // Background with subtle gradient
        "bg-gradient-to-br from-background via-background to-muted/20",
        // Border styling
        "border-l border-border/50",
        // Shadow for depth
        "shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.15)]",
        "dark:shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.4)]",
        // Smooth transitions with spring-like easing
        "transition-[width,opacity,transform] duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "will-change-[width,opacity,transform]",
        // Open/close states with slide animation
        isSidebarOpen
          ? "opacity-100 translate-x-0 scale-100"
          : "opacity-0 translate-x-8 scale-[0.98] pointer-events-none"
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
          "flex-1 flex flex-col overflow-hidden min-w-0",
          "transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isSidebarOpen
            ? "opacity-100 translate-y-0 delay-75"
            : "opacity-0 translate-y-2"
        )}
      >
        <AISidebarContent isCompact={width < 360} />
      </div>
    </div>
  );
}
