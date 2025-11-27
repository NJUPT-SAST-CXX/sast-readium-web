"use client";

import { useAIChatStore } from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";
import { X, Settings, MessageSquare, History, Sparkles } from "lucide-react";
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
import { useEffect, useState } from "react";

interface AISidebarProps {
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

function AISidebarContent() {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
      <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
        <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
          <MessageSquare className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">{t("ai.chat")}</span>
        </TabsTrigger>
        <TabsTrigger value="tools" className="gap-1.5 text-xs sm:text-sm">
          <Sparkles className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">{t("ai.tools")}</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
          <History className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">{t("ai.history")}</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
          <Settings className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">{t("ai.settings")}</span>
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="chat" className="h-full m-0 p-0">
          <AIChatPanel />
        </TabsContent>

        <TabsContent value="tools" className="h-full m-0 p-0">
          <AIToolsPanel />
        </TabsContent>

        <TabsContent value="history" className="h-full m-0 p-0 overflow-auto">
          <AIHistoryPanel />
        </TabsContent>

        <TabsContent value="settings" className="h-full m-0 p-0 overflow-auto">
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile: Use bottom drawer
  if (isMobile) {
    return (
      <Drawer open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <DrawerTitle>{t("ai.sidebar_title")}</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <AISidebarContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use side panel
  return (
    <div
      className={cn(
        "relative bg-background border-l border-border flex flex-col overflow-hidden",
        "transition-[width,opacity,transform] duration-250 ease-out will-change-transform z-20",
        isSidebarOpen
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-2 pointer-events-none"
      )}
      style={{ width: isSidebarOpen ? `${width}px` : 0 }}
    >
      {/* Resize handle on the left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
        onMouseDown={onResizeStart}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">{t("ai.sidebar_title")}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("ai.close_sidebar")}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <AISidebarContent />
    </div>
  );
}
