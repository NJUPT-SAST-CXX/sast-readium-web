"use client";

/**
 * Quiz Session Component
 *
 * Displays quiz questions with answer input and navigation.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Clock,
  Target,
  CheckCircle2,
  Send,
  SkipForward,
  AlertTriangle,
} from "lucide-react";
import { useQuizStore } from "@/lib/ai/learning";
import type {
  Question,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  FillBlankQuestion,
} from "@/lib/ai/learning/types";

interface QuizSessionProps {
  quizId: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export function QuizSession({ quizId, onComplete, onExit }: QuizSessionProps) {
  const { t } = useTranslation();
  const [currentAnswer, setCurrentAnswer] = useState<
    string | number | boolean | string[]
  >("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const quizzes = useQuizStore((state) => state.quizzes);
  const currentAttempt = useQuizStore((state) => state.currentAttempt);
  const currentQuestionIndex = useQuizStore(
    (state) => state.currentQuestionIndex
  );
  const submitAnswer = useQuizStore((state) => state.submitAnswer);
  const nextQuestion = useQuizStore((state) => state.nextQuestion);
  const previousQuestion = useQuizStore((state) => state.previousQuestion);
  const finishQuiz = useQuizStore((state) => state.finishQuiz);
  const cancelQuiz = useQuizStore((state) => state.cancelQuiz);
  const quiz = quizzes[quizId];
  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleSubmitQuiz = useCallback(() => {
    finishQuiz();
    onComplete?.();
  }, [finishQuiz, onComplete]);

  // Timer effect - uses store-based time remaining
  useEffect(() => {
    if (
      !currentAttempt ||
      !quiz?.settings.timedMode ||
      !quiz?.settings.totalTimeLimit
    )
      return;

    const startTime = currentAttempt.startedAt;
    const timeLimit = quiz.settings.totalTimeLimit * 1000; // Already in seconds

    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        handleSubmitQuiz();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    currentAttempt,
    quiz?.settings.timedMode,
    quiz?.settings.totalTimeLimit,
    handleSubmitQuiz,
  ]);

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  const answeredCount = useMemo(() => {
    if (!currentAttempt) return 0;
    return currentAttempt.answers.length;
  }, [currentAttempt]);

  const handleSubmitAnswer = useCallback(() => {
    if (currentAnswer === "" || currentAnswer === undefined) return;

    submitAnswer({
      answer: currentAnswer,
      timeSpent: 0, // Could track time per question
    });

    setCurrentAnswer("");

    // Auto-advance to next question
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    }
  }, [
    currentAnswer,
    submitAnswer,
    currentQuestionIndex,
    questions.length,
    nextQuestion,
  ]);

  const handleSkip = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
      setCurrentAnswer("");
    }
  }, [currentQuestionIndex, questions.length, nextQuestion]);

  const handleExit = useCallback(() => {
    cancelQuiz();
    onExit?.();
  }, [cancelQuiz, onExit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!quiz || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          {t("learning.common.error")}
        </h2>
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
              {quiz.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("learning.quiz.session.question_of", {
                current: currentQuestionIndex + 1,
                total: questions.length,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {timeRemaining !== null && (
            <Badge
              variant={timeRemaining < 60 ? "destructive" : "outline"}
              className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2"
            >
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2"
          >
            <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {answeredCount} / {questions.length}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Question Display */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <Card className="shadow-sm">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                {currentQuestion.type === "multiple-choice" &&
                  t("learning.quiz.question_types.multiple_choice")}
                {currentQuestion.type === "true-false" &&
                  t("learning.quiz.question_types.true_false")}
                {currentQuestion.type === "short-answer" &&
                  t("learning.quiz.question_types.short_answer")}
                {currentQuestion.type === "fill-blank" &&
                  t("learning.quiz.question_types.fill_blank")}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] sm:text-xs",
                  currentQuestion.difficulty === "easy" &&
                    "bg-green-100 text-green-700",
                  currentQuestion.difficulty === "medium" &&
                    "bg-yellow-100 text-yellow-700",
                  currentQuestion.difficulty === "hard" &&
                    "bg-red-100 text-red-700"
                )}
              >
                {t(`learning.quiz.difficulty.${currentQuestion.difficulty}`)}
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg mt-2 sm:mt-3">
              <QuestionContent question={currentQuestion} />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <AnswerInput
              question={currentQuestion}
              value={currentAnswer}
              onChange={setCurrentAnswer}
            />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t bg-muted/30">
        {/* Mobile: stacked layout, Desktop: row layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 order-2 sm:order-1"
            onClick={() => {
              previousQuestion();
              setCurrentAnswer("");
            }}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("learning.quiz.session.previous")}
          </Button>

          <div className="flex gap-2 order-1 sm:order-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 sm:h-10 flex-1 sm:flex-none"
              onClick={handleSkip}
              disabled={currentQuestionIndex >= questions.length - 1}
            >
              <SkipForward className="w-4 h-4 mr-1" />
              <span className="hidden xs:inline">
                {t("learning.quiz.session.skip")}
              </span>
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                size="sm"
                className="h-9 sm:h-10 flex-1 sm:flex-none"
                onClick={handleSubmitAnswer}
                disabled={currentAnswer === ""}
              >
                <Send className="w-4 h-4 mr-1" />
                {t("learning.quiz.session.next")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-9 sm:h-10 flex-1 sm:flex-none"
                onClick={handleSubmitQuiz}
                variant="default"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {t("learning.quiz.session.submit")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Question content display
function QuestionContent({ question }: { question: Question }) {
  switch (question.type) {
    case "multiple-choice":
    case "short-answer":
      return (
        <span>
          {(question as MultipleChoiceQuestion | ShortAnswerQuestion).question}
        </span>
      );
    case "true-false":
      return <span>{(question as TrueFalseQuestion).statement}</span>;
    case "fill-blank": {
      const fbq = question as FillBlankQuestion;
      return <span>{fbq.sentence.replace(/\{\{blank\}\}/g, "______")}</span>;
    }
    default:
      return <span>Unknown question type</span>;
  }
}

// Answer input component
function AnswerInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | number | boolean | string[];
  onChange: (value: string | number | boolean | string[]) => void;
}) {
  const { t } = useTranslation();

  switch (question.type) {
    case "multiple-choice": {
      const mcq = question as MultipleChoiceQuestion;
      return (
        <RadioGroup
          value={String(value)}
          onValueChange={(v) => onChange(Number(v))}
          className="space-y-3"
        >
          {mcq.options.map((option, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <RadioGroupItem value={String(i)} id={`option-${i}`} />
              <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                {String.fromCharCode(65 + i)}. {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    case "true-false": {
      return (
        <RadioGroup
          value={String(value)}
          onValueChange={(v) => onChange(v === "true")}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true" className="flex-1 cursor-pointer">
              {t("learning.quiz.results.correct")} (True)
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false" className="flex-1 cursor-pointer">
              {t("learning.quiz.results.incorrect")} (False)
            </Label>
          </div>
        </RadioGroup>
      );
    }

    case "short-answer": {
      return (
        <Textarea
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("learning.quiz.question_types.short_answer")}
          className="min-h-[120px]"
        />
      );
    }

    case "fill-blank": {
      const fbq = question as FillBlankQuestion;
      const answers = Array.isArray(value) ? value : [String(value)];

      return (
        <div className="space-y-3">
          {fbq.blanks.map((blank, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Blank {i + 1}:
              </span>
              <Input
                value={answers[i] || ""}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[i] = e.target.value;
                  onChange(newAnswers);
                }}
                placeholder={`Answer ${i + 1}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      );
    }

    default:
      return <p>Unknown question type</p>;
  }
}
