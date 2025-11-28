"use client";

import { useTranslation } from "react-i18next";
import { useAIChatStore } from "@/lib/ai-chat-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  MoreVertical,
  Trash2,
  FileText,
  Pencil,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { ConversationEmptyState } from "@/components/ai-elements/conversation";

export function AIHistoryPanel() {
  const { t } = useTranslation();
  const {
    getConversationList,
    setCurrentConversation,
    deleteConversation,
    updateConversationTitle,
    currentConversationId,
  } = useAIChatStore();

  const conversations = getConversationList();

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t("ai.confirm_delete_conversation"))) {
      deleteConversation(id);
    }
  };

  const handleRenameConversation = (
    id: string,
    currentTitle: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const newTitle = prompt(t("ai.enter_new_title"), currentTitle);
    if (newTitle && newTitle.trim()) {
      updateConversationTitle(id, newTitle.trim());
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <ConversationEmptyState
          icon={<Clock className="h-12 w-12" />}
          title={t("ai.no_history")}
          description={t("ai.no_history_description")}
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {/* Header with count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {t("ai.conversation_history", "Conversation History")}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {conversations.length}
          </Badge>
        </div>

        {/* Conversation list */}
        {conversations.map((conversation) => {
          const isActive = currentConversationId === conversation.id;
          const lastMessage =
            conversation.messages[conversation.messages.length - 1];
          const preview = lastMessage?.content?.slice(0, 60) || "";

          return (
            <div
              key={conversation.id}
              className={cn(
                "group relative rounded-lg border p-3 cursor-pointer transition-all duration-200",
                "hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm",
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/50 bg-background"
              )}
              onClick={() => handleSelectConversation(conversation.id)}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 pl-1">
                  {/* Title */}
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive && "text-primary"
                      )}
                    >
                      {conversation.title}
                    </span>
                  </div>

                  {/* Preview */}
                  {preview && (
                    <p className="text-xs text-muted-foreground truncate mt-1 ml-6">
                      {preview}...
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2 ml-6">
                    {conversation.pdfFileName && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 gap-1"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[80px]">
                                {conversation.pdfFileName}
                              </span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {conversation.pdfFileName}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(conversation.updatedAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(conversation.updatedAt, "PPpp")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-[10px] text-muted-foreground">
                      {conversation.messages.length} {t("ai.messages")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleRenameConversation(
                            conversation.id,
                            conversation.title,
                            e
                          )
                        }
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        {t("ai.rename")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleDeleteConversation(conversation.id, e)
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        {t("ai.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isActive && "text-primary rotate-90"
                    )}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
