"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAIChatStore } from "@/lib/ai/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
  Search,
  X,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { ConversationEmptyState } from "@/components/ai/elements/conversation";

export function AIHistoryPanel() {
  const { t } = useTranslation();
  const {
    getConversationList,
    setCurrentConversation,
    deleteConversation,
    updateConversationTitle,
    currentConversationId,
  } = useAIChatStore();

  const [searchQuery, setSearchQuery] = useState("");

  const conversations = getConversationList();

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some((msg) =>
          msg.content.toLowerCase().includes(query)
        ) ||
        conv.pdfFileName?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const handleClearAll = () => {
    if (
      confirm(
        t(
          "ai.confirm_clear_all",
          "Are you sure you want to delete all conversations? This cannot be undone."
        )
      )
    ) {
      conversations.forEach((conv) => deleteConversation(conv.id));
    }
  };

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
      <div className="h-full flex-1 min-h-0 flex items-center justify-center">
        <ConversationEmptyState
          icon={<Clock className="h-12 w-12" />}
          title={t("ai.no_history")}
          description={t("ai.no_history_description")}
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full flex-1 min-h-0 custom-scrollbar">
      <div className="p-3 sm:p-4 space-y-2">
        {/* Header with count and actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {t("ai.conversation_history", "Conversation History")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {filteredConversations.length}/{conversations.length}
            </Badge>
            {conversations.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      onClick={handleClearAll}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("ai.clear_all", "Clear all")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t(
              "ai.search_conversations",
              "Search conversations..."
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* No results message */}
        {filteredConversations.length === 0 && searchQuery && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("ai.no_search_results", "No conversations match your search")}
          </div>
        )}

        {/* Conversation list */}
        {filteredConversations.map((conversation) => {
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
