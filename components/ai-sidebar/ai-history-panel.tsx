"use client";

import { useTranslation } from "react-i18next";
import { useAIChatStore } from "@/lib/ai-chat-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreVertical, Trash2, FileText, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  const handleRenameConversation = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt(t("ai.enter_new_title"), currentTitle);
    if (newTitle && newTitle.trim()) {
      updateConversationTitle(id, newTitle.trim());
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t("ai.no_history")}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("ai.no_history_description")}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              currentConversationId === conversation.id
                ? "border-primary bg-muted/30"
                : ""
            }`}
            onClick={() => handleSelectConversation(conversation.id)}
          >
            <CardHeader className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium truncate">
                    {conversation.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {conversation.pdfFileName && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">
                          {conversation.pdfFileName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(conversation.updatedAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {conversation.messages.length} {t("ai.messages")}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) =>
                        handleRenameConversation(
                          conversation.id,
                          conversation.title,
                          e
                        )
                      }
                    >
                      {t("ai.rename")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("ai.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
