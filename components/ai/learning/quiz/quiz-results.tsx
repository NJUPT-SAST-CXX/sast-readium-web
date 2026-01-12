"use client";

/**
 * Quiz Results Component
 *
 * Displays quiz attempt results with score breakdown and answer review.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useQuizStore } from "@/lib/ai/learning";
import type {
  QuizAttempt,
  Question,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  FillBlankQuestion,
  DifficultyLevel,
} from "@/lib/ai/learning/types";

interface QuizResultsProps {
  attemptId: string;
  onRetry?: () => void;
  onExit?: () => void;
}

// Helper to calculate single-attempt stats
function calculateAttemptStats(attempt: QuizAttempt, totalQuestions: number) {
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const incorrectCount = attempt.answers.filter(
    (a) => a.isCorrect === false
  ).length;
  const skippedCount = totalQuestions - attempt.answers.length;
  const totalTime = attempt.completedAt
    ? attempt.completedAt - attempt.startedAt
    : Date.now() - attempt.startedAt;

  // Calculate by difficulty
  const byDifficulty: Record<
    DifficultyLevel,
    { correct: number; total: number }
  > = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  return {
    correctCount,
    incorrectCount,
    skippedCount,
    totalQuestions,
    totalTime,
    byDifficulty,
  };
}

export function QuizResults({ attemptId, onRetry, onExit }: QuizResultsProps) {
  const { t } = useTranslation();
  const [showReview, setShowReview] = useState(false);

  const attempts = useQuizStore((state) => state.attempts);
  const quizzes = useQuizStore((state) => state.quizzes);

  const attempt = attempts.find((a) => a.id === attemptId);
  const quiz = attempt ? quizzes[attempt.quizId] : null;

  const stats = useMemo(() => {
    if (!attempt || !quiz) return null;

    const baseStats = calculateAttemptStats(attempt, quiz.questions.length);

    // Calculate difficulty breakdown from questions
    for (const question of quiz.questions) {
      baseStats.byDifficulty[question.difficulty].total++;
      const answer = attempt.answers.find((a) => a.questionId === question.id);
      if (answer?.isCorrect) {
        baseStats.byDifficulty[question.difficulty].correct++;
      }
    }

    return baseStats;
  }, [attempt, quiz]);

  if (!attempt || !quiz || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center">
        <p className="text-muted-foreground">{t("learning.common.error")}</p>
        <Button onClick={onExit} className="mt-4 w-full sm:w-auto">
          {t("learning.common.close")}
        </Button>
      </div>
    );
  }

  const scorePercentage = Math.round(
    (stats.correctCount / stats.totalQuestions) * 100
  );
  const isPassing = scorePercentage >= (quiz.passingScore || 70);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (showReview) {
    return (
      <AnswerReview
        attempt={attempt}
        questions={quiz.questions}
        onBack={() => setShowReview(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="shrink-0 h-8 px-2 sm:px-3"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">
              {t("learning.common.close")}
            </span>
          </Button>
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base truncate">
              {quiz.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("learning.quiz.results.title")}
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Score Card */}
        <Card
          className={cn(
            "border-2",
            isPassing
              ? "border-green-200 bg-green-50/50"
              : "border-red-200 bg-red-50/50"
          )}
        >
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="relative">
                <Trophy
                  className={cn(
                    "w-12 h-12 sm:w-16 sm:h-16",
                    isPassing ? "text-green-500" : "text-gray-400"
                  )}
                />
                {isPassing && (
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
                )}
              </div>
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "text-4xl sm:text-5xl font-bold mb-1 sm:mb-2",
                  getScoreColor(scorePercentage)
                )}
              >
                {scorePercentage}%
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.correctCount} / {stats.totalQuestions}{" "}
                {t("learning.quiz.results.correct")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="p-2.5 sm:p-4 text-center">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {stats.correctCount}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("learning.quiz.results.correct")}
            </p>
          </Card>
          <Card className="p-2.5 sm:p-4 text-center">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {stats.incorrectCount}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("learning.quiz.results.incorrect")}
            </p>
          </Card>
          <Card className="p-2.5 sm:p-4 text-center">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-blue-600">
              {formatDuration(stats.totalTime)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("learning.quiz.results.time_taken")}
            </p>
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm">
              {t(
                "learning.quiz.results.performance_by_difficulty",
                "Performance by Difficulty"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-3 sm:px-6">
            {(["easy", "medium", "hard"] as const).map((difficulty) => {
              const diffStats = stats.byDifficulty[difficulty];
              if (!diffStats || diffStats.total === 0) return null;
              const pct = Math.round(
                (diffStats.correct / diffStats.total) * 100
              );
              return (
                <div key={difficulty} className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="capitalize">
                      {t(`learning.quiz.difficulty.${difficulty}`)}
                    </span>
                    <span>
                      {diffStats.correct}/{diffStats.total} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5 sm:h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10 sm:h-11"
            onClick={() => setShowReview(true)}
          >
            <ChevronRight className="w-4 h-4 mr-1" />
            {t("learning.quiz.results.review_answers")}
          </Button>
          <Button className="flex-1 h-10 sm:h-11" onClick={onRetry}>
            <RotateCcw className="w-4 h-4 mr-1" />
            {t("learning.quiz.results.try_again")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Answer Review Component
function AnswerReview({
  attempt,
  questions,
  onBack,
}: {
  attempt: QuizAttempt;
  questions: Question[];
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("learning.common.close")}
        </Button>
        <h3 className="font-medium">
          {t("learning.quiz.results.review_answers")}
        </h3>
      </div>

      {/* Questions Review */}
      <div className="flex-1 overflow-auto p-4">
        <Accordion type="single" collapsible className="space-y-2">
          {questions.map((question, index) => {
            const answer = attempt.answers.find(
              (a) => a.questionId === question.id
            );
            const isCorrect = answer?.isCorrect;

            return (
              <AccordionItem
                key={question.id}
                value={question.id}
                className={cn(
                  "border rounded-lg px-4",
                  isCorrect === true && "border-green-200 bg-green-50/30",
                  isCorrect === false && "border-red-200 bg-red-50/30",
                  isCorrect === undefined && "border-yellow-200 bg-yellow-50/30"
                )}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 sm:gap-3 text-left">
                    <span className="shrink-0">
                      {isCorrect === true && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {isCorrect === false && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      {isCorrect === undefined && (
                        <Target className="w-5 h-5 text-yellow-500" />
                      )}
                    </span>
                    <span className="text-sm">
                      Q{index + 1}: {getQuestionText(question).slice(0, 60)}...
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  {/* Question */}
                  <div>
                    <p className="text-sm font-medium mb-1">Question:</p>
                    <p className="text-sm text-muted-foreground">
                      {getQuestionText(question)}
                    </p>
                  </div>

                  {/* Your Answer */}
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {t("learning.quiz.results.your_answer")}:
                    </p>
                    <p
                      className={cn(
                        "text-sm p-2 rounded",
                        isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {formatAnswer(question, answer?.answer)}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  {!isCorrect && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        {t("learning.quiz.results.correct_answer")}:
                      </p>
                      <p className="text-sm p-2 rounded bg-green-100 text-green-700">
                        {getCorrectAnswer(question)}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.type === "multiple-choice" &&
                    (question as MultipleChoiceQuestion).explanation && (
                      <div>
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm text-muted-foreground">
                          {(question as MultipleChoiceQuestion).explanation}
                        </p>
                      </div>
                    )}

                  {/* AI Feedback for short answer */}
                  {answer?.aiGradingFeedback && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        {t("learning.quiz.results.feedback")}:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {answer.aiGradingFeedback}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

// Helper functions
function getQuestionText(question: Question): string {
  switch (question.type) {
    case "multiple-choice":
      return (question as MultipleChoiceQuestion).question;
    case "true-false":
      return (question as TrueFalseQuestion).statement;
    case "short-answer":
      return (question as ShortAnswerQuestion).question;
    case "fill-blank":
      return (question as FillBlankQuestion).sentence;
    default:
      return "Unknown question";
  }
}

function formatAnswer(question: Question, answer: unknown): string {
  if (answer === undefined || answer === null) return "Not answered";

  switch (question.type) {
    case "multiple-choice": {
      const mcq = question as MultipleChoiceQuestion;
      const idx = Number(answer);
      return mcq.options[idx] || String(answer);
    }
    case "true-false":
      return answer ? "True" : "False";
    case "fill-blank":
      return Array.isArray(answer) ? answer.join(", ") : String(answer);
    default:
      return String(answer);
  }
}

function getCorrectAnswer(question: Question): string {
  switch (question.type) {
    case "multiple-choice": {
      const mcq = question as MultipleChoiceQuestion;
      return mcq.options[mcq.correctIndex];
    }
    case "true-false": {
      const tfq = question as TrueFalseQuestion;
      return tfq.correctAnswer ? "True" : "False";
    }
    case "short-answer": {
      const saq = question as ShortAnswerQuestion;
      return saq.sampleAnswer || "See rubric";
    }
    case "fill-blank": {
      const fbq = question as FillBlankQuestion;
      return fbq.blanks.map((b) => b.answer).join(", ");
    }
    default:
      return "Unknown";
  }
}
