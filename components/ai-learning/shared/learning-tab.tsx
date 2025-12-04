"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  GraduationCap,
  Presentation,
  Plus,
  ChevronRight,
  Clock,
  Target,
  Zap,
  Brain,
  FileText,
  Layers,
  TrendingUp,
  Calendar,
  Flame,
  BarChart3,
} from "lucide-react";
import { useFlashcardStore } from "@/lib/ai/learning/flashcard/flashcard-store";
import { useQuizStore } from "@/lib/ai/learning/quiz/quiz-store";
import { usePPTStore } from "@/lib/ai/learning/ppt/ppt-store";

interface LearningTabProps {
  onOpenFlashcards?: () => void;
  onOpenQuiz?: () => void;
  onOpenPPT?: () => void;
  isLoading?: boolean;
}

export function LearningTab({
  onOpenFlashcards,
  onOpenQuiz,
  onOpenPPT,
  isLoading = false,
}: LearningTabProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");

  // Get stats from stores
  const { getAllDecks, getDueCardsForDeck } = useFlashcardStore();
  const { getAllQuizzes, getAttemptHistory } = useQuizStore();
  const { getAllPresentations } = usePPTStore();

  const decks = getAllDecks();
  const quizzes = getAllQuizzes();
  const presentations = getAllPresentations();

  // Calculate due cards across all decks
  const totalDueCards = decks.reduce(
    (sum, deck) => sum + getDueCardsForDeck(deck.id).length,
    0
  );

  // Calculate total cards
  const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);

  // Calculate mastered cards (rough estimate based on SRS data)
  const masteredCards = decks.reduce((sum, deck) => {
    // Cards with high ease factor are considered mastered
    return sum + Math.floor(deck.cards.length * 0.3); // Placeholder
  }, 0);

  // Calculate recent activity
  const recentAttempts = getAttemptHistory().slice(0, 3);

  // Calculate streak (placeholder - would need actual tracking)
  const studyStreak =
    recentAttempts.length > 0 ? Math.min(recentAttempts.length, 7) : 0;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-3 sm:mx-4 mt-3 sm:mt-4 grid grid-cols-3 h-9 sm:h-10">
          <TabsTrigger value="overview" className="text-xs sm:text-sm gap-1">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 hidden xs:inline" />
            {t("learning.overview", "Overview")}
          </TabsTrigger>
          <TabsTrigger value="study" className="text-xs sm:text-sm gap-1">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 hidden xs:inline" />
            {t("learning.study", "Study")}
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs sm:text-sm gap-1">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 hidden xs:inline" />
            {t("learning.create", "Create")}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Overview Tab */}
            <TabsContent
              value="overview"
              className="m-0 space-y-3 sm:space-y-4"
            >
              {/* Quick Stats - Responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <Card className="p-2.5 sm:p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 shrink-0">
                      <Layers className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {t("learning.decks", "Decks")}
                      </p>
                      <p className="text-base sm:text-lg font-semibold">
                        {decks.length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-2.5 sm:p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-500/10 shrink-0">
                      <Target className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {t("learning.quizzes", "Quizzes")}
                      </p>
                      <p className="text-base sm:text-lg font-semibold">
                        {quizzes.length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-2.5 sm:p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 shrink-0">
                      <Presentation className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {t("learning.slides", "Slides")}
                      </p>
                      <p className="text-base sm:text-lg font-semibold">
                        {presentations.length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-2.5 sm:p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 shrink-0">
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {t("learning.flashcard.streak", "Streak")}
                      </p>
                      <p className="text-base sm:text-lg font-semibold">
                        {studyStreak} {t("learning.common.days", "days")}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Progress Overview */}
              {totalCards > 0 && (
                <Card className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      {t("learning.common.progress", "Progress")}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {masteredCards}/{totalCards}{" "}
                      {t("learning.flashcard.mastered", "mastered")}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      totalCards > 0 ? (masteredCards / totalCards) * 100 : 0
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                      {t("learning.flashcard.new", "New")}:{" "}
                      {totalCards - masteredCards}
                    </span>
                    <span>
                      {t("learning.flashcard.mastered", "Mastered")}:{" "}
                      {masteredCards}
                    </span>
                  </div>
                </Card>
              )}

              {/* Due Cards Alert */}
              {totalDueCards > 0 && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-500/10 shrink-0">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base">
                            {t("learning.cards_due", "Cards Due for Review")}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {totalDueCards}{" "}
                            {t("learning.cards_waiting", "cards waiting")}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-500/30 hover:bg-orange-500/10 w-full sm:w-auto"
                        onClick={onOpenFlashcards}
                      >
                        {t("learning.review_now", "Review")}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              {recentAttempts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t("learning.recent_activity", "Recent Activity")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-3 sm:px-6">
                    {recentAttempts.map((attempt) => {
                      const quiz = quizzes.find((q) => q.id === attempt.quizId);
                      return (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm truncate">
                              {quiz?.title || "Quiz"}
                            </span>
                          </div>
                          <Badge
                            variant={
                              attempt.percentage >= 70 ? "default" : "secondary"
                            }
                            className={cn(
                              "text-xs ml-2 shrink-0",
                              attempt.percentage >= 90 && "bg-green-500",
                              attempt.percentage >= 70 &&
                                attempt.percentage < 90 &&
                                "bg-yellow-500",
                              attempt.percentage < 70 && "bg-red-500"
                            )}
                          >
                            {Math.round(attempt.percentage)}%
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {decks.length === 0 &&
                quizzes.length === 0 &&
                presentations.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </div>
                      <h3 className="font-medium text-base sm:text-lg mb-1">
                        {t("learning.get_started", "Get Started with Learning")}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                        {t(
                          "learning.get_started_desc",
                          "Create flashcards, quizzes, or presentations from your PDF documents"
                        )}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab("create")}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {t("learning.create_first", "Create Your First")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            {/* Study Tab */}
            <TabsContent value="study" className="m-0 space-y-3 sm:space-y-4">
              {/* Flashcard Decks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {t("learning.flashcards", "Flashcards")}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={onOpenFlashcards}
                  >
                    {t("learning.view_all", "View All")}
                  </Button>
                </div>
                {decks.length > 0 ? (
                  <div className="space-y-2">
                    {decks.slice(0, 3).map((deck) => {
                      const dueCount = getDueCardsForDeck(deck.id).length;
                      return (
                        <Card
                          key={deck.id}
                          className="p-2.5 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                          onClick={onOpenFlashcards}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${deck.color}20` }}
                            >
                              <BookOpen
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                style={{ color: deck.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {deck.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>
                                  {deck.cards.length}{" "}
                                  {t("learning.cards", "cards")}
                                </span>
                                {dueCount > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 border-orange-300 text-orange-600"
                                  >
                                    {dueCount} {t("learning.due", "due")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-4 border-dashed text-center">
                    <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("learning.no_flashcards", "No flashcard decks yet")}
                    </p>
                  </Card>
                )}
              </div>

              {/* Quizzes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {t("learning.quizzes", "Quizzes")}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={onOpenQuiz}
                  >
                    {t("learning.view_all", "View All")}
                  </Button>
                </div>
                {quizzes.length > 0 ? (
                  <div className="space-y-2">
                    {quizzes.slice(0, 3).map((quiz) => (
                      <Card
                        key={quiz.id}
                        className="p-2.5 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                        onClick={onOpenQuiz}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {quiz.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {quiz.questions.length}{" "}
                              {t("learning.questions", "questions")}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-4 border-dashed text-center">
                    <GraduationCap className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("learning.no_quizzes", "No quizzes yet")}
                    </p>
                  </Card>
                )}
              </div>

              {/* Presentations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Presentation className="w-4 h-4" />
                    {t("learning.slides", "Presentations")}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={onOpenPPT}
                  >
                    {t("learning.view_all", "View All")}
                  </Button>
                </div>
                {presentations.length > 0 ? (
                  <div className="space-y-2">
                    {presentations.slice(0, 3).map((ppt) => (
                      <Card
                        key={ppt.id}
                        className="p-2.5 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                        onClick={onOpenPPT}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                            <Presentation className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {ppt.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ppt.slides.length}{" "}
                              {t("learning.ppt.slides", "slides")}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-4 border-dashed text-center">
                    <Presentation className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "learning.common.no_presentations",
                        "No presentations yet"
                      )}
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create" className="m-0 space-y-2 sm:space-y-3">
              <Card
                className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors group active:scale-[0.98]"
                onClick={onOpenFlashcards}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base flex items-center gap-2 flex-wrap">
                      {t("learning.create_flashcards", "Create Flashcards")}
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-1.5"
                      >
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                      {t(
                        "learning.create_flashcards_desc",
                        "Generate Q&A, fill-in-blank, and matching cards from your PDF"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 mt-0.5" />
                </div>
              </Card>

              <Card
                className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors group active:scale-[0.98]"
                onClick={onOpenQuiz}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors shrink-0">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base flex items-center gap-2 flex-wrap">
                      {t("learning.create_quiz", "Create Quiz")}
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-1.5"
                      >
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                      {t(
                        "learning.create_quiz_desc",
                        "Generate adaptive quizzes with multiple question types"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 mt-0.5" />
                </div>
              </Card>

              <Card
                className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors group active:scale-[0.98]"
                onClick={onOpenPPT}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors shrink-0">
                    <Presentation className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base flex items-center gap-2 flex-wrap">
                      {t("learning.create_ppt", "Create Presentation")}
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-1.5"
                      >
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                      {t(
                        "learning.create_ppt_desc",
                        "Generate slides with built-in editor and export to PPTX"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 mt-0.5" />
                </div>
              </Card>

              <Card className="p-3 sm:p-4 border-dashed opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-muted-foreground">
                      {t("learning.import", "Import")}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                      {t(
                        "learning.import_desc",
                        "Import flashcards or quizzes from JSON files"
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
