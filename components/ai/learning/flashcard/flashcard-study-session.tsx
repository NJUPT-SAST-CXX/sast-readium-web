"use client";

/**
 * Flashcard Study Session Component
 *
 * Displays cards for review with flip animation and rating buttons.
 */

import { useCallback, useMemo } from "react";
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
  }, [showAnswer, revealAnswer, hideAnswer]);

  const handleExit = useCallback(() => {
    endSession();
    onExit?.();
  }, [endSession, onExit]);

  if (!currentCard || !deck) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          {t("learning.flashcard.study.session_complete", "Session Complete!")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {currentSession &&
            t("learning.flashcard.study.cards_studied", {
              count: currentSession.cardsStudied.length,
            })}
        </p>
        {currentSession && (
          <div className="flex gap-4 mb-6 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {currentSession.cardsCorrect.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("learning.flashcard.correct", "Correct")}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {currentSession.cardsIncorrect.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("learning.flashcard.incorrect", "Incorrect")}
              </p>
            </div>
          </div>
        )}
        <Button onClick={onExit} className="w-full sm:w-auto">
          {t("learning.common.close")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="shrink-0 h-8 px-2 sm:px-3"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">
              {t("learning.common.close")}
            </span>
          </Button>
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base truncate">
              {deck.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("learning.flashcard.study.cards_remaining", {
                count: studyQueue.length - currentCardIndex,
              })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 text-xs shrink-0">
          <Target className="w-3 h-3" />
          {currentCardIndex + 1} / {studyQueue.length}
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Card Display */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-auto">
        <div
          className={cn(
            "w-full max-w-md cursor-pointer",
            "transition-transform duration-300 active:scale-[0.98]"
          )}
          onClick={handleFlip}
        >
          <Card className="min-h-[250px] sm:min-h-[300px] flex flex-col shadow-lg">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {currentCard.type === "qa" && "Q&A"}
                  {currentCard.type === "fill-blank" &&
                    t("learning.flashcard.card_types.fill_blank")}
                  {currentCard.type === "matching" &&
                    t("learning.flashcard.card_types.matching")}
                  {currentCard.type === "multiple-choice" &&
                    t("learning.flashcard.card_types.multiple_choice")}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlip}
                  className="h-8 w-8 p-0"
                >
                  {showAnswer ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center px-3 sm:px-6 py-4">
              {!showAnswer ? (
                <FlashcardFront card={currentCard} />
              ) : (
                <FlashcardBack card={currentCard} />
              )}
            </CardContent>
          </Card>
          {/* Tap hint for mobile */}
          <p className="text-center text-[10px] text-muted-foreground mt-2 sm:hidden">
            {t("learning.flashcard.study.tap_to_flip", "Tap card to flip")}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t bg-muted/30">
        {!showAnswer ? (
          <div className="flex justify-center">
            <Button
              onClick={handleFlip}
              size="lg"
              className="gap-2 w-full sm:w-auto h-11 sm:h-12"
            >
              <Eye className="w-4 h-4" />
              {t("learning.flashcard.study.show_answer")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              {t("learning.flashcard.study.rate_card")}
            </p>
            {/* Mobile: 2x2 grid, Desktop: 4 columns */}
            <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-11 sm:h-12 sm:flex-1 sm:max-w-[120px] border-red-200 hover:bg-red-50 hover:text-red-700 text-sm"
                onClick={() => handleRate("again")}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.again", "Again")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 sm:h-12 sm:flex-1 sm:max-w-[120px] border-orange-200 hover:bg-orange-50 hover:text-orange-700 text-sm"
                onClick={() => handleRate("hard")}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.hard", "Hard")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 sm:h-12 sm:flex-1 sm:max-w-[120px] border-green-200 hover:bg-green-50 hover:text-green-700 text-sm"
                onClick={() => handleRate("good")}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.good", "Good")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 sm:h-12 sm:flex-1 sm:max-w-[120px] border-blue-200 hover:bg-blue-50 hover:text-blue-700 text-sm"
                onClick={() => handleRate("easy")}
              >
                <Zap className="w-4 h-4 mr-1" />
                {t("learning.flashcard.study.easy", "Easy")}
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
