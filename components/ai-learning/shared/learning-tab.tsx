"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { useFlashcardStore } from "@/lib/ai/learning/flashcard/flashcard-store";
import { useQuizStore } from "@/lib/ai/learning/quiz/quiz-store";
import { usePPTStore } from "@/lib/ai/learning/ppt/ppt-store";

interface LearningTabProps {
  onOpenFlashcards?: () => void;
  onOpenQuiz?: () => void;
  onOpenPPT?: () => void;
}

export function LearningTab({
  onOpenFlashcards,
  onOpenQuiz,
  onOpenPPT,
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

  // Calculate recent activity
  const recentAttempts = getAttemptHistory().slice(0, 3);

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-4 mt-4 grid grid-cols-3 h-10">
          <TabsTrigger value="overview" className="text-xs">
            {t("learning.overview", "Overview")}
          </TabsTrigger>
          <TabsTrigger value="study" className="text-xs">
            {t("learning.study", "Study")}
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs">
            {t("learning.create", "Create")}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <Layers className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("learning.decks", "Decks")}
                      </p>
                      <p className="text-lg font-semibold">{decks.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-500/10">
                      <Target className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("learning.quizzes", "Quizzes")}
                      </p>
                      <p className="text-lg font-semibold">{quizzes.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <Presentation className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("learning.slides", "Slides")}
                      </p>
                      <p className="text-lg font-semibold">
                        {presentations.length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Due Cards Alert */}
              {totalDueCards > 0 && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-500/10">
                          <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {t("learning.cards_due", "Cards Due for Review")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {totalDueCards}{" "}
                            {t("learning.cards_waiting", "cards waiting")}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-500/30 hover:bg-orange-500/10"
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
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {t("learning.recent_activity", "Recent Activity")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentAttempts.map((attempt) => {
                      const quiz = quizzes.find((q) => q.id === attempt.quizId);
                      return (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[150px]">
                              {quiz?.title || "Quiz"}
                            </span>
                          </div>
                          <Badge
                            variant={
                              attempt.percentage >= 70 ? "default" : "secondary"
                            }
                            className="text-xs"
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
                    <CardContent className="p-6 text-center">
                      <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <h3 className="font-medium mb-1">
                        {t("learning.get_started", "Get Started with Learning")}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t(
                          "learning.get_started_desc",
                          "Create flashcards, quizzes, or presentations from your PDF documents"
                        )}
                      </p>
                      <Button size="sm" onClick={() => setActiveTab("create")}>
                        <Plus className="w-4 h-4 mr-1" />
                        {t("learning.create_first", "Create Your First")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            {/* Study Tab */}
            <TabsContent value="study" className="m-0 space-y-4">
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
                          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={onOpenFlashcards}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${deck.color}20` }}
                            >
                              <BookOpen
                                className="w-4 h-4"
                                style={{ color: deck.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {deck.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {deck.cards.length}{" "}
                                {t("learning.cards", "cards")}
                                {dueCount > 0 && (
                                  <span className="text-orange-500 ml-1">
                                    • {dueCount} {t("learning.due", "due")}
                                  </span>
                                )}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-4 border-dashed text-center">
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
                        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={onOpenQuiz}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Target className="w-4 h-4 text-green-500" />
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
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-4 border-dashed text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("learning.no_quizzes", "No quizzes yet")}
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create" className="m-0 space-y-3">
              <Card
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={onOpenFlashcards}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium flex items-center gap-2">
                      {t("learning.create_flashcards", "Create Flashcards")}
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t(
                        "learning.create_flashcards_desc",
                        "Generate Q&A, fill-in-blank, and matching cards from your PDF"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>

              <Card
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={onOpenQuiz}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <GraduationCap className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium flex items-center gap-2">
                      {t("learning.create_quiz", "Create Quiz")}
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t(
                        "learning.create_quiz_desc",
                        "Generate adaptive quizzes with multiple question types"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>

              <Card
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={onOpenPPT}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Presentation className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium flex items-center gap-2">
                      {t("learning.create_ppt", "Create Presentation")}
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t(
                        "learning.create_ppt_desc",
                        "Generate slides with built-in editor and export to PPTX"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>

              <Card className="p-4 border-dashed">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-muted-foreground">
                      {t("learning.import", "Import")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
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
