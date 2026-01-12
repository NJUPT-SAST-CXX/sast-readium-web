"use client";

/**
 * Flashcard Deck List Component
 *
 * Displays list of decks with stats and quick actions.
 */

import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  BookOpen,
  Clock,
  Target,
  Sparkles,
  Layers,
} from "lucide-react";
import { useFlashcardStore, calculateDeckStats } from "@/lib/ai/learning";
import type { FlashcardDeck, SRSData } from "@/lib/ai/learning/types";

interface FlashcardDeckListProps {
  onSelectDeck?: (deckId: string) => void;
  onStartStudy?: (deckId: string) => void;
  onCreateDeck?: () => void;
}

export function FlashcardDeckList({
  onSelectDeck,
  onStartStudy,
  onCreateDeck,
}: FlashcardDeckListProps) {
  const { t } = useTranslation();
  const decks = useFlashcardStore((state) => state.decks);
  const deleteDeck = useFlashcardStore((state) => state.deleteDeck);
  const srsData = useFlashcardStore((state) => state.srsData);

  const deckList = useMemo(() => {
    return Object.values(decks).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [decks]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    let totalCards = 0;
    let dueCards = 0;
    let masteredCards = 0;

    for (const deck of deckList) {
      totalCards += deck.cards.length;
      const stats = calculateDeckStats(deck.cards, srsData, []);
      dueCards += stats.reviewCards;
      masteredCards += stats.masteredCards;
    }

    return { totalCards, dueCards, masteredCards };
  }, [deckList, srsData]);

  const handleDelete = useCallback(
    (deckId: string) => {
      deleteDeck(deckId);
    },
    [deleteDeck]
  );

  if (deckList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>
        <h3 className="font-medium text-base sm:text-lg mb-1">
          {t("learning.common.empty")}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-xs">
          {t(
            "learning.flashcard.empty_desc",
            "Create your first flashcard deck to start learning"
          )}
        </p>
        <Button onClick={onCreateDeck} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("learning.flashcard.new_deck")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 shrink-0">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">
                {totalStats.totalCards}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("learning.overview.total_cards", "Total")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">
                {totalStats.dueCards}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("learning.overview.due_today", "Due")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 rounded-lg bg-green-500/10 shrink-0">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">
                {totalStats.masteredCards}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("learning.overview.mastered", "Mastered")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Button */}
      <Button
        onClick={onCreateDeck}
        variant="outline"
        className="w-full gap-2 h-9 sm:h-10"
      >
        <Plus className="w-4 h-4" />
        {t("learning.flashcard.new_deck")}
      </Button>

      {/* Deck List */}
      <div className="space-y-2 sm:space-y-3">
        {deckList.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            srsData={srsData}
            onSelect={() => onSelectDeck?.(deck.id)}
            onStudy={() => onStartStudy?.(deck.id)}
            onDelete={() => handleDelete(deck.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface DeckCardProps {
  deck: FlashcardDeck;
  srsData: Record<string, SRSData>;
  onSelect: () => void;
  onStudy: () => void;
  onDelete: () => void;
}

function DeckCard({
  deck,
  srsData,
  onSelect,
  onStudy,
  onDelete,
}: DeckCardProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    return calculateDeckStats(deck.cards, srsData, []);
  }, [deck.cards, srsData]);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
        "border-l-4"
      )}
      style={{ borderLeftColor: deck.color }}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg sm:text-xl shrink-0">
              {deck.icon || "📚"}
            </span>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base truncate">
                {deck.name}
              </CardTitle>
              {deck.description && (
                <CardDescription className="text-[10px] sm:text-xs line-clamp-1">
                  {deck.description}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t("learning.flashcard.edit_deck")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("learning.flashcard.delete_deck")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2"
            >
              <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {deck.cards.length}
            </Badge>
            {stats.reviewCards > 0 && (
              <Badge
                variant="outline"
                className="gap-1 border-orange-200 text-orange-700 text-[10px] sm:text-xs px-1.5 sm:px-2"
              >
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {stats.reviewCards} {t("learning.due", "due")}
              </Badge>
            )}
            {stats.newCards > 0 && (
              <Badge
                variant="outline"
                className="gap-1 border-blue-200 text-blue-700 text-[10px] sm:text-xs px-1.5 sm:px-2"
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {stats.newCards} {t("learning.flashcard.new", "new")}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            className="gap-1 h-8 sm:h-9 w-full sm:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              onStudy();
            }}
            disabled={deck.cards.length === 0}
          >
            <Play className="w-3 h-3" />
            {t("learning.flashcard.study.start", "Study")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
