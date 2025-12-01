"use client";

/**
 * Flashcard Study Session Component
 *
 * Displays cards for review with flip animation and rating buttons.
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Zap,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Target,
  CheckCircle2,
} from "lucide-react";
import { useFlashcardStore } from "@/lib/ai/learning";
import type {
  Flashcard,
  QACard,
  FillBlankCard,
  MatchingCard,
  MultipleChoiceCard,
} from "@/lib/ai/learning/types";

interface FlashcardStudySessionProps {
  deckId: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export function FlashcardStudySession({
  deckId,
  onComplete,
  onExit,
}: FlashcardStudySessionProps) {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  const currentSession = useFlashcardStore((state) => state.currentSession);
  const currentCardIndex = useFlashcardStore((state) => state.currentCardIndex);
  const studyQueue = useFlashcardStore((state) => state.studyQueue);
  const showAnswer = useFlashcardStore((state) => state.showAnswer);
  const decks = useFlashcardStore((state) => state.decks);
  const endSession = useFlashcardStore((state) => state.endSession);
  const revealAnswer = useFlashcardStore((state) => state.revealAnswer);
  const hideAnswer = useFlashcardStore((state) => state.hideAnswer);
  const rateCard = useFlashcardStore((state) => state.rateCard);

  const deck = decks[deckId];
  const currentCard = studyQueue[currentCardIndex] || null;

  const progress = useMemo(() => {
    if (studyQueue.length === 0) return 100;
    return Math.round((currentCardIndex / studyQueue.length) * 100);
  }, [currentCardIndex, studyQueue.length]);

  const handleRate = useCallback(
    (rating: "again" | "hard" | "good" | "easy") => {
      rateCard(rating);
      setIsFlipped(false);

      // Check if session is complete
      if (currentCardIndex >= studyQueue.length - 1) {
        onComplete?.();
      }
    },
    [rateCard, currentCardIndex, studyQueue.length, onComplete]
  );

  const handleFlip = useCallback(() => {
    if (!showAnswer) {
      revealAnswer();
    } else {
      hideAnswer();
    }
    setIsFlipped((prev) => !prev);
  }, [showAnswer, revealAnswer, hideAnswer]);

  const handleExit = useCallback(() => {
    endSession();
    onExit?.();
  }, [endSession, onExit]);

  if (!currentCard || !deck) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("learning.flashcard.study.session_complete")}
        </h2>
        <p className="text-muted-foreground mb-4">
          {currentSession &&
            t("learning.flashcard.study.cards_studied", {
              count: currentSession.cardsStudied.length,
            })}
        </p>
        <Button onClick={onExit}>{t("learning.common.close")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleExit}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("learning.common.close")}
          </Button>
          <div>
            <h3 className="font-medium">{deck.name}</h3>
            <p className="text-xs text-muted-foreground">
              {t("learning.flashcard.study.cards_remaining", {
                count: studyQueue.length - currentCardIndex,
              })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Target className="w-3 h-3" />
          {currentCardIndex + 1} / {studyQueue.length}
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Card Display */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className={cn(
            "w-full max-w-md cursor-pointer",
            "transition-transform duration-500"
          )}
          onClick={handleFlip}
        >
          <Card className="min-h-[300px] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {currentCard.type === "qa" && "Q&A"}
                  {currentCard.type === "fill-blank" &&
                    t("learning.flashcard.card_types.fill_blank")}
                  {currentCard.type === "matching" &&
                    t("learning.flashcard.card_types.matching")}
                  {currentCard.type === "multiple-choice" &&
                    t("learning.flashcard.card_types.multiple_choice")}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleFlip}>
                  {showAnswer ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {!showAnswer ? (
                <FlashcardFront card={currentCard} />
              ) : (
                <FlashcardBack card={currentCard} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 border-t bg-muted/30">
        {!showAnswer ? (
          <div className="flex justify-center">
            <Button onClick={handleFlip} size="lg" className="gap-2">
              <Eye className="w-4 h-4" />
              {t("learning.flashcard.study.show_answer")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              {t("learning.flashcard.study.rate_card")}
            </p>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 max-w-[120px] border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleRate("again")}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.again")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 max-w-[120px] border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => handleRate("hard")}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.hard")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 max-w-[120px] border-green-200 hover:bg-green-50 hover:text-green-700"
                onClick={() => handleRate("good")}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.good")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 max-w-[120px] border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleRate("easy")}
              >
                <Zap className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.easy")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Card front display component
function FlashcardFront({ card }: { card: Flashcard }) {
  switch (card.type) {
    case "qa":
      return (
        <div className="text-center">
          <p className="text-lg">{(card as QACard).front}</p>
        </div>
      );
    case "fill-blank": {
      const fillCard = card as FillBlankCard;
      return (
        <div className="text-center">
          <p className="text-lg">
            {fillCard.sentence.replace(/\{\{blank\}\}/g, "______")}
          </p>
        </div>
      );
    }
    case "matching": {
      const matchCard = card as MatchingCard;
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">
            {matchCard.instruction}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {matchCard.pairs.map((pair, i) => (
                <div key={i} className="p-2 bg-muted rounded text-sm">
                  {pair.left}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {matchCard.pairs.map((_, i) => (
                <div key={i} className="p-2 bg-muted rounded text-sm">
                  ?
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case "multiple-choice": {
      const mcCard = card as MultipleChoiceCard;
      return (
        <div className="space-y-4">
          <p className="text-lg">{mcCard.question}</p>
          <div className="space-y-2">
            {mcCard.options.map((option, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg text-sm hover:bg-muted/50 transition-colors"
              >
                {String.fromCharCode(65 + i)}. {option}
              </div>
            ))}
          </div>
        </div>
      );
    }
    default:
      return <p>Unknown card type</p>;
  }
}

// Card back display component
function FlashcardBack({ card }: { card: Flashcard }) {
  switch (card.type) {
    case "qa":
      return (
        <div className="text-center">
          <p className="text-lg font-medium text-green-600">
            {(card as QACard).back}
          </p>
        </div>
      );
    case "fill-blank": {
      const fillCard = card as FillBlankCard;
      return (
        <div className="text-center">
          <p className="text-lg">
            {fillCard.blanks.map((blank, i) => (
              <span key={i} className="font-medium text-green-600">
                {blank.answer}
                {i < fillCard.blanks.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      );
    }
    case "matching": {
      const matchCard = card as MatchingCard;
      return (
        <div className="space-y-2">
          {matchCard.pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="p-2 bg-muted rounded text-sm flex-1">
                {pair.left}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="p-2 bg-green-50 border-green-200 border rounded text-sm flex-1 text-green-700">
                {pair.right}
              </span>
            </div>
          ))}
        </div>
      );
    }
    case "multiple-choice": {
      const mcCard = card as MultipleChoiceCard;
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{mcCard.question}</p>
          <div className="space-y-2">
            {mcCard.options.map((option, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 border rounded-lg text-sm",
                  i === mcCard.correctIndex
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "text-muted-foreground"
                )}
              >
                {String.fromCharCode(65 + i)}. {option}
                {i === mcCard.correctIndex && (
                  <CheckCircle2 className="w-4 h-4 inline ml-2" />
                )}
              </div>
            ))}
          </div>
          {mcCard.explanation && (
            <p className="text-sm text-muted-foreground border-t pt-3">
              {mcCard.explanation}
            </p>
          )}
        </div>
      );
    }
    default:
      return <p>Unknown card type</p>;
  }
}
