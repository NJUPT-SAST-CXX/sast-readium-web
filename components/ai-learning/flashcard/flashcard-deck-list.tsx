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
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Layers className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-1">
          {t("learning.common.empty")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("learning.flashcard.decks")}
        </p>
        <Button onClick={onCreateDeck} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("learning.flashcard.new_deck")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalStats.totalCards}</p>
              <p className="text-xs text-muted-foreground">
                {t("learning.overview.total_cards")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{totalStats.dueCards}</p>
              <p className="text-xs text-muted-foreground">
                {t("learning.overview.due_today")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{totalStats.masteredCards}</p>
              <p className="text-xs text-muted-foreground">
                {t("learning.overview.mastered")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Button */}
      <Button onClick={onCreateDeck} variant="outline" className="w-full gap-2">
        <Plus className="w-4 h-4" />
        {t("learning.flashcard.new_deck")}
      </Button>

      {/* Deck List */}
      <div className="space-y-3">
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
        "cursor-pointer transition-all hover:shadow-md",
        "border-l-4",
        stats.reviewCards > 0 ? "border-l-orange-500" : "border-l-green-500"
      )}
      style={{ borderLeftColor: deck.color }}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{deck.icon || "📚"}</span>
            <div>
              <CardTitle className="text-base">{deck.name}</CardTitle>
              {deck.description && (
                <CardDescription className="text-xs line-clamp-1">
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="w-3 h-3" />
              {deck.cards.length}
            </Badge>
            {stats.reviewCards > 0 && (
              <Badge
                variant="outline"
                className="gap-1 border-orange-200 text-orange-700"
              >
                <Clock className="w-3 h-3" />
                {stats.reviewCards} due
              </Badge>
            )}
            {stats.newCards > 0 && (
              <Badge
                variant="outline"
                className="gap-1 border-blue-200 text-blue-700"
              >
                <Sparkles className="w-3 h-3" />
                {stats.newCards} new
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onStudy();
            }}
            disabled={deck.cards.length === 0}
          >
            <Play className="w-3 h-3" />
            {t("learning.flashcard.study.start")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
