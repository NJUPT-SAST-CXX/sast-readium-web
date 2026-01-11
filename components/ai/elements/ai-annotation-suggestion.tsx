"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SuggestAnnotationParams } from "@/lib/ai/core";
import {
  CheckIcon,
  EditIcon,
  FileTextIcon,
  HighlighterIcon,
  MapPinIcon,
  MessageSquareIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

export interface AIAnnotationSuggestionProps extends ComponentProps<"div"> {
  /** Unique identifier for the suggestion */
  suggestionId: string;
  /** The annotation suggestion parameters */
  suggestion: SuggestAnnotationParams;
  /** Current page in the PDF viewer */
  currentPage?: number;
  /** PDF file name */
  fileName?: string;
  /** Called when user accepts the suggestion */
  onAccept?: (suggestion: SuggestAnnotationParams) => void;
  /** Called when user rejects the suggestion */
  onReject?: (suggestionId: string) => void;
  /** Called when user modifies and accepts the suggestion */
  onModify?: (suggestion: SuggestAnnotationParams) => void;
  /** Called when user wants to navigate to the annotation location */
  onNavigate?: (pageNumber: number) => void;
  /** Whether the suggestion has been processed */
  status?: "pending" | "accepted" | "rejected" | "modified";
}

export function AIAnnotationSuggestion({
  className,
  suggestionId,
  suggestion,
  currentPage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fileName,
  onAccept,
  onReject,
  onModify,
  onNavigate,
  status = "pending",
  ...props
}: AIAnnotationSuggestionProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(suggestion.content);

  const isPending = status === "pending";
  const isOnSamePage = currentPage === suggestion.pageNumber;

  const handleAccept = () => {
    onAccept?.(suggestion);
  };

  const handleReject = () => {
    onReject?.(suggestionId);
  };

  const handleModifyAndAccept = () => {
    onModify?.({
      ...suggestion,
      content: editedContent,
    });
    setIsEditing(false);
  };

  const handleNavigate = () => {
    onNavigate?.(suggestion.pageNumber);
  };

  const getTypeIcon = () => {
    switch (suggestion.type) {
      case "highlight":
        return <HighlighterIcon className="size-4" />;
      case "comment":
        return <MessageSquareIcon className="size-4" />;
      default:
        return <FileTextIcon className="size-4" />;
    }
  };

  const getConfidenceBadge = () => {
    const confidence = suggestion.confidence ?? 0.8;
    const level =
      confidence >= 0.8 ? "high" : confidence >= 0.5 ? "medium" : "low";
    const colors = {
      high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
      <Badge variant="outline" className={cn("text-xs", colors[level])}>
        {Math.round(confidence * 100)}% {t("ai.confidence", "confidence")}
      </Badge>
    );
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: {
        label: t("ai.annotation.pending", "Pending"),
        className: "bg-blue-100 text-blue-800",
      },
      accepted: {
        label: t("ai.annotation.accepted", "Accepted"),
        className: "bg-green-100 text-green-800",
      },
      rejected: {
        label: t("ai.annotation.rejected", "Rejected"),
        className: "bg-red-100 text-red-800",
      },
      modified: {
        label: t("ai.annotation.modified", "Modified"),
        className: "bg-purple-100 text-purple-800",
      },
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={cn("text-xs", config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20",
        !isPending && "opacity-75",
        className
      )}
      {...props}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-purple-600" />
            <AlertTitle className="text-sm font-medium">
              {t("ai.annotation.suggestion", "AI Annotation Suggestion")}
            </AlertTitle>
          </div>
          <div className="flex items-center gap-2">
            {getConfidenceBadge()}
            {!isPending && getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Annotation Type and Location */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className="gap-1">
            {getTypeIcon()}
            {suggestion.type === "highlight"
              ? t("annotation.highlight", "Highlight")
              : t("annotation.comment", "Comment")}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer gap-1",
              isOnSamePage ? "bg-green-50 text-green-700" : "hover:bg-muted"
            )}
            onClick={handleNavigate}
          >
            <MapPinIcon className="size-3" />
            {t("ai.annotation.page", "Page")} {suggestion.pageNumber}
            {isOnSamePage && (
              <span className="text-xs">
                ({t("ai.annotation.currentPage", "current")})
              </span>
            )}
          </Badge>
        </div>

        {/* Highlighted Text (if available) */}
        {suggestion.highlightText && (
          <Alert className="bg-yellow-50/50 dark:bg-yellow-950/20">
            <HighlighterIcon className="size-4 text-yellow-600" />
            <AlertDescription className="text-sm italic">
              &ldquo;{suggestion.highlightText}&rdquo;
            </AlertDescription>
          </Alert>
        )}

        {/* Annotation Content */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("ai.annotation.content", "Content")}:
          </p>
          {isEditing ? (
            <textarea
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={3}
              autoFocus
            />
          ) : (
            <p className="text-sm">{suggestion.content}</p>
          )}
        </div>

        {/* AI Reasoning */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("ai.annotation.reasoning", "AI Reasoning")}:
          </p>
          <p className="text-xs text-muted-foreground italic">
            {suggestion.reasoning}
          </p>
        </div>
      </CardContent>

      {/* Action Buttons */}
      {isPending && (
        <CardFooter className="flex justify-end gap-2 border-t pt-3">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(suggestion.content);
                }}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleModifyAndAccept}
                className="gap-1"
              >
                <CheckIcon className="size-3" />
                {t("ai.annotation.saveAndAccept", "Save & Accept")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XIcon className="size-3" />
                {t("common.reject", "Reject")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1"
              >
                <EditIcon className="size-3" />
                {t("common.edit", "Edit")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAccept}
                className="gap-1 bg-purple-600 hover:bg-purple-700"
              >
                <CheckIcon className="size-3" />
                {t("common.accept", "Accept")}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact inline version for showing in message content
 */
export interface AIAnnotationLinkProps extends Omit<
  ComponentProps<"button">,
  "type"
> {
  pageNumber: number;
  content: string;
  annotationType: "highlight" | "comment";
  onNavigate?: (pageNumber: number) => void;
}

export function AIAnnotationLink({
  className,
  pageNumber,
  content,
  annotationType,
  onNavigate,
  ...props
}: AIAnnotationLinkProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800",
        className
      )}
      onClick={() => onNavigate?.(pageNumber)}
      title={content}
      {...props}
    >
      <SparklesIcon className="size-3" />
      {annotationType === "highlight" ? (
        <HighlighterIcon className="size-3" />
      ) : (
        <MessageSquareIcon className="size-3" />
      )}
      <span>
        {t("ai.annotation.page", "Page")} {pageNumber}
      </span>
    </button>
  );
}
