/**
 * Quiz Store - Zustand state management for quiz/test system
 *
 * Features:
 * - Quiz management (CRUD operations)
 * - Question management within quizzes
 * - Adaptive difficulty tracking
 * - Quiz attempt tracking with scoring
 * - AI grading for short answers
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Quiz,
  Question,
  QuizSettings,
  QuizAttempt,
  UserAnswer,
  DifficultyLevel,
  QuizStats,
} from "../types";
import {
  adjustDifficulty,
  calculateTopicProficiency,
  selectNextQuestion,
  shuffleQuestions,
  gradeObjectiveAnswer,
  calculateQuizStats,
  analyzeQuestionPerformance,
  getWeakTopics,
} from "./adaptive-engine";

// ============================================================================
// Types
// ============================================================================

interface QuizState {
  // Data
  quizzes: Record<string, Quiz>;
  attempts: QuizAttempt[];

  // Current session
  currentQuizId: string | null;
  currentAttempt: QuizAttempt | null;
  currentQuestionIndex: number;
  questionOrder: string[]; // IDs in display order

  // UI State
  isTaking: boolean;
  isGenerating: boolean;
  isGrading: boolean;
  showResults: boolean;
  timeRemaining: number | null;
  timerActive: boolean;
  generationProgress: number;

  // Actions - Quiz management
  createQuiz: (
    title: string,
    description?: string,
    settings?: Partial<QuizSettings>,
    sourceDoc?: { id: string; name: string }
  ) => string;
  deleteQuiz: (id: string) => void;
  updateQuiz: (
    id: string,
    updates: Partial<Omit<Quiz, "id" | "questions">>
  ) => void;
  setCurrentQuiz: (id: string | null) => void;

  // Actions - Question management
  addQuestion: (
    quizId: string,
    question: Omit<Question, "id" | "quizId">
  ) => string;
  addQuestions: (
    quizId: string,
    questions: Array<Omit<Question, "id" | "quizId">>
  ) => string[];
  updateQuestion: (
    quizId: string,
    questionId: string,
    updates: Partial<Question>
  ) => void;
  deleteQuestion: (quizId: string, questionId: string) => void;
  reorderQuestions: (quizId: string, newOrder: string[]) => void;

  // Actions - Taking quiz
  startQuiz: (quizId: string) => void;
  submitAnswer: (answer: Omit<UserAnswer, "questionId" | "answeredAt">) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  skipQuestion: () => void;
  finishQuiz: () => void;
  cancelQuiz: () => void;

  // Timer
  setTimeRemaining: (time: number) => void;
  decrementTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;

  // Adaptive
  getCurrentDifficulty: () => DifficultyLevel;
  getNextAdaptiveQuestion: () => Question | null;

  // Getters
  getQuizById: (id: string) => Quiz | null;
  getCurrentQuestion: () => Question | null;
  getQuizStats: (quizId: string) => QuizStats;
  getAttemptHistory: (quizId?: string) => QuizAttempt[];
  getTopicProficiency: (quizId: string) => Record<string, number>;
  getWeakTopicsForQuiz: (quizId: string) => string[];
  getAllQuizzes: () => Quiz[];
  getQuestionPerformance: (
    quizId: string,
    questionId: string
  ) => {
    attempts: number;
    correctRate: number;
    averageTime: number;
  };

  // Generation
  setGenerating: (isGenerating: boolean, progress?: number) => void;
  setGrading: (isGrading: boolean) => void;

  // AI Grading callback (to be set externally)
  gradeShortAnswer?: (
    question: Question,
    answer: string
  ) => Promise<{ score: number; feedback: string }>;
  setGradeShortAnswerCallback: (
    callback: (
      question: Question,
      answer: string
    ) => Promise<{ score: number; feedback: string }>
  ) => void;

  // Bulk operations
  importQuiz: (quiz: Quiz) => string;
  exportQuiz: (quizId: string) => Quiz | null;
  clearAllData: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  shuffleQuestions: true,
  shuffleOptions: true,
  showExplanations: true,
  showCorrectAnswer: true,
  timedMode: false,
  adaptiveDifficulty: true,
  allowSkip: true,
  allowReview: true,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      quizzes: {},
      attempts: [],
      currentQuizId: null,
      currentAttempt: null,
      currentQuestionIndex: 0,
      questionOrder: [],
      isTaking: false,
      isGenerating: false,
      isGrading: false,
      showResults: false,
      timeRemaining: null,
      timerActive: false,
      generationProgress: 0,

      // Quiz management
      createQuiz: (title, description = "", settings = {}, sourceDoc) => {
        const id = nanoid();
        const now = Date.now();
        const quiz: Quiz = {
          id,
          title,
          description,
          questions: [],
          createdAt: now,
          updatedAt: now,
          sourceDocumentId: sourceDoc?.id,
          sourceFileName: sourceDoc?.name,
          settings: { ...DEFAULT_QUIZ_SETTINGS, ...settings },
        };

        set((state) => ({
          quizzes: { ...state.quizzes, [id]: quiz },
        }));

        return id;
      },

      deleteQuiz: (id) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: deletedQuiz, ...remainingQuizzes } = state.quizzes;
          return {
            quizzes: remainingQuizzes,
            currentQuizId:
              state.currentQuizId === id ? null : state.currentQuizId,
            // Keep attempts for history
          };
        });
      },

      updateQuiz: (id, updates) => {
        set((state) => {
          const quiz = state.quizzes[id];
          if (!quiz) return state;

          return {
            quizzes: {
              ...state.quizzes,
              [id]: {
                ...quiz,
                ...updates,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      setCurrentQuiz: (id) => {
        set({ currentQuizId: id });
      },

      // Question management
      addQuestion: (quizId, questionData) => {
        const questionId = nanoid();

        set((state) => {
          const quiz = state.quizzes[quizId];
          if (!quiz) return state;

          const newQuestion = {
            ...questionData,
            id: questionId,
            quizId,
          } as Question;

          return {
            quizzes: {
              ...state.quizzes,
              [quizId]: {
                ...quiz,
                questions: [...quiz.questions, newQuestion],
                updatedAt: Date.now(),
              },
            },
          };
        });

        return questionId;
      },

      addQuestions: (quizId, questionsData) => {
        const questionIds: string[] = [];

        set((state) => {
          const quiz = state.quizzes[quizId];
          if (!quiz) return state;

          const newQuestions: Question[] = questionsData.map((qData) => {
            const id = nanoid();
            questionIds.push(id);
            return {
              ...qData,
              id,
              quizId,
            } as Question;
          });

          return {
            quizzes: {
              ...state.quizzes,
              [quizId]: {
                ...quiz,
                questions: [...quiz.questions, ...newQuestions],
                updatedAt: Date.now(),
              },
            },
          };
        });

        return questionIds;
      },

      updateQuestion: (quizId, questionId, updates) => {
        set((state) => {
          const quiz = state.quizzes[quizId];
          if (!quiz) return state;

          const questionIndex = quiz.questions.findIndex(
            (q) => q.id === questionId
          );
          if (questionIndex === -1) return state;

          const updatedQuestions = [...quiz.questions];
          updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            ...updates,
          } as Question;

          return {
            quizzes: {
              ...state.quizzes,
              [quizId]: {
                ...quiz,
                questions: updatedQuestions,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteQuestion: (quizId, questionId) => {
        set((state) => {
          const quiz = state.quizzes[quizId];
          if (!quiz) return state;

          return {
            quizzes: {
              ...state.quizzes,
              [quizId]: {
                ...quiz,
                questions: quiz.questions.filter((q) => q.id !== questionId),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      reorderQuestions: (quizId, newOrder) => {
        set((state) => {
          const quiz = state.quizzes[quizId];
          if (!quiz) return state;

          const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
          const reorderedQuestions = newOrder
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => q !== undefined);

          return {
            quizzes: {
              ...state.quizzes,
              [quizId]: {
                ...quiz,
                questions: reorderedQuestions,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      // Taking quiz
      startQuiz: (quizId) => {
        const state = get();
        const quiz = state.quizzes[quizId];
        if (!quiz || quiz.questions.length === 0) return;

        const attemptId = nanoid();
        const now = Date.now();

        // Prepare question order
        let questions = [...quiz.questions];
        if (quiz.settings.shuffleQuestions) {
          questions = shuffleQuestions(questions, { shuffle: true });
        }
        const questionOrder = questions.map((q) => q.id);

        const attempt: QuizAttempt = {
          id: attemptId,
          quizId,
          startedAt: now,
          answers: [],
          score: 0,
          maxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
          percentage: 0,
          currentDifficulty: "medium",
          topicProficiency: {},
        };

        set({
          currentQuizId: quizId,
          currentAttempt: attempt,
          currentQuestionIndex: 0,
          questionOrder,
          isTaking: true,
          showResults: false,
          timeRemaining: quiz.settings.timedMode
            ? (quiz.settings.totalTimeLimit ?? null)
            : null,
          timerActive: quiz.settings.timedMode,
        });
      },

      submitAnswer: (answerData) => {
        const state = get();
        if (!state.currentAttempt || !state.isTaking) return;

        const quiz = state.quizzes[state.currentAttempt.quizId];
        if (!quiz) return;

        const currentQuestionId =
          state.questionOrder[state.currentQuestionIndex];
        const question = quiz.questions.find((q) => q.id === currentQuestionId);
        if (!question) return;

        // Grade the answer
        let isCorrect = false;
        let aiScore: number | undefined;
        let aiFeedback: string | undefined;

        if (question.type === "short-answer") {
          // Short answers need AI grading (handled externally)
          // For now, mark as pending
          isCorrect = false;
          aiScore = answerData.aiGradingScore;
          aiFeedback = answerData.aiGradingFeedback;
          if (aiScore !== undefined) {
            isCorrect = aiScore >= 70;
          }
        } else {
          const result = gradeObjectiveAnswer(question, answerData.answer);
          isCorrect = result.isCorrect;
        }

        const userAnswer: UserAnswer = {
          questionId: currentQuestionId,
          answer: answerData.answer,
          isCorrect,
          aiGradingScore: aiScore,
          aiGradingFeedback: aiFeedback,
          timeSpent: answerData.timeSpent,
          answeredAt: Date.now(),
        };

        // Update attempt
        const updatedAnswers = [...state.currentAttempt.answers, userAnswer];

        // Calculate score
        const score = updatedAnswers.reduce((sum, a) => {
          const q = quiz.questions.find((q) => q.id === a.questionId);
          if (!q) return sum;
          if (a.isCorrect) return sum + q.points;
          if (a.aiGradingScore !== undefined) {
            return sum + (q.points * a.aiGradingScore) / 100;
          }
          return sum;
        }, 0);

        // Adjust difficulty if adaptive
        let newDifficulty = state.currentAttempt.currentDifficulty;
        if (quiz.settings.adaptiveDifficulty) {
          const recentAnswers = updatedAnswers
            .slice(-5)
            .map((a) => a.isCorrect ?? false);
          newDifficulty = adjustDifficulty(newDifficulty, recentAnswers);
        }

        // Update topic proficiency
        const topicProficiency = { ...state.currentAttempt.topicProficiency };
        topicProficiency[question.topic] = calculateTopicProficiency(
          question.topic,
          updatedAnswers,
          quiz.questions
        );

        set((prevState) => ({
          currentAttempt: {
            ...prevState.currentAttempt!,
            answers: updatedAnswers,
            score,
            percentage: (score / prevState.currentAttempt!.maxScore) * 100,
            currentDifficulty: newDifficulty,
            topicProficiency,
          },
        }));
      },

      nextQuestion: () => {
        const state = get();
        if (state.currentQuestionIndex >= state.questionOrder.length - 1) {
          // Last question - finish quiz
          get().finishQuiz();
          return;
        }
        set({ currentQuestionIndex: state.currentQuestionIndex + 1 });
      },

      previousQuestion: () => {
        const state = get();
        const quiz = state.currentAttempt
          ? state.quizzes[state.currentAttempt.quizId]
          : null;
        if (!quiz?.settings.allowReview) return;
        if (state.currentQuestionIndex <= 0) return;
        set({ currentQuestionIndex: state.currentQuestionIndex - 1 });
      },

      skipQuestion: () => {
        const state = get();
        const quiz = state.currentAttempt
          ? state.quizzes[state.currentAttempt.quizId]
          : null;
        if (!quiz?.settings.allowSkip) return;
        get().nextQuestion();
      },

      finishQuiz: () => {
        const state = get();
        if (!state.currentAttempt) return;

        const completedAttempt: QuizAttempt = {
          ...state.currentAttempt,
          completedAt: Date.now(),
          passed:
            state.currentAttempt.percentage >=
            (state.quizzes[state.currentAttempt.quizId]?.passingScore ?? 60),
        };

        set((prevState) => ({
          attempts: [...prevState.attempts, completedAttempt],
          currentAttempt: completedAttempt,
          isTaking: false,
          showResults: true,
          timerActive: false,
        }));
      },

      cancelQuiz: () => {
        set({
          currentAttempt: null,
          currentQuestionIndex: 0,
          questionOrder: [],
          isTaking: false,
          showResults: false,
          timeRemaining: null,
          timerActive: false,
        });
      },

      // Timer
      setTimeRemaining: (time) => {
        set({ timeRemaining: time });
      },

      decrementTimer: () => {
        const state = get();
        if (!state.timerActive || state.timeRemaining === null) return;

        if (state.timeRemaining <= 1) {
          // Time's up - auto-finish
          get().finishQuiz();
          return;
        }

        set({ timeRemaining: state.timeRemaining - 1 });
      },

      pauseTimer: () => {
        set({ timerActive: false });
      },

      resumeTimer: () => {
        set({ timerActive: true });
      },

      // Adaptive
      getCurrentDifficulty: () => {
        return get().currentAttempt?.currentDifficulty ?? "medium";
      },

      getNextAdaptiveQuestion: () => {
        const state = get();
        if (!state.currentAttempt) return null;

        const quiz = state.quizzes[state.currentAttempt.quizId];
        if (!quiz) return null;

        const answeredIds = new Set(
          state.currentAttempt.answers.map((a) => a.questionId)
        );

        return selectNextQuestion(quiz.questions, {
          currentDifficulty: state.currentAttempt.currentDifficulty,
          topicProficiency: state.currentAttempt.topicProficiency,
          answeredQuestionIds: answeredIds,
          preferWeakerTopics: true,
        });
      },

      // Getters
      getQuizById: (id) => {
        return get().quizzes[id] || null;
      },

      getCurrentQuestion: () => {
        const state = get();
        if (!state.currentAttempt || !state.isTaking) return null;

        const quiz = state.quizzes[state.currentAttempt.quizId];
        if (!quiz) return null;

        const questionId = state.questionOrder[state.currentQuestionIndex];
        return quiz.questions.find((q) => q.id === questionId) || null;
      },

      getQuizStats: (quizId) => {
        const state = get();
        const quizAttempts = state.attempts.filter((a) => a.quizId === quizId);
        const quiz = state.quizzes[quizId];

        const baseStats = calculateQuizStats(quizAttempts);

        // Add question-level accuracy
        const questionAccuracy: Record<string, number> = {};
        if (quiz) {
          for (const question of quiz.questions) {
            const perf = analyzeQuestionPerformance(question.id, quizAttempts);
            questionAccuracy[question.id] = perf.correctRate;
          }
        }

        // Calculate topic mastery
        const topicMastery: Record<string, number> = {};
        if (quizAttempts.length > 0) {
          const latestAttempt = quizAttempts[quizAttempts.length - 1];
          Object.assign(topicMastery, latestAttempt.topicProficiency);
        }

        return {
          ...baseStats,
          questionAccuracy,
          topicMastery,
        };
      },

      getAttemptHistory: (quizId) => {
        const state = get();
        let attempts = state.attempts;
        if (quizId) {
          attempts = attempts.filter((a) => a.quizId === quizId);
        }
        return attempts.sort((a, b) => b.startedAt - a.startedAt);
      },

      getTopicProficiency: (quizId) => {
        const state = get();
        const quizAttempts = state.attempts.filter((a) => a.quizId === quizId);
        if (quizAttempts.length === 0) return {};
        return quizAttempts[quizAttempts.length - 1].topicProficiency;
      },

      getWeakTopicsForQuiz: (quizId) => {
        const proficiency = get().getTopicProficiency(quizId);
        return getWeakTopics(proficiency, 50);
      },

      getAllQuizzes: () => {
        return Object.values(get().quizzes).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
      },

      getQuestionPerformance: (quizId, questionId) => {
        const state = get();
        const quizAttempts = state.attempts.filter((a) => a.quizId === quizId);
        return analyzeQuestionPerformance(questionId, quizAttempts);
      },

      // Generation
      setGenerating: (isGenerating, progress = 0) => {
        set({ isGenerating, generationProgress: progress });
      },

      setGrading: (isGrading) => {
        set({ isGrading });
      },

      setGradeShortAnswerCallback: (callback) => {
        set({ gradeShortAnswer: callback });
      },

      // Bulk operations
      importQuiz: (quiz) => {
        const newQuizId = nanoid();
        const now = Date.now();

        // Remap question IDs
        const newQuestions = quiz.questions.map((q) => ({
          ...q,
          id: nanoid(),
          quizId: newQuizId,
        }));

        const newQuiz: Quiz = {
          ...quiz,
          id: newQuizId,
          questions: newQuestions,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          quizzes: { ...state.quizzes, [newQuizId]: newQuiz },
        }));

        return newQuizId;
      },

      exportQuiz: (quizId) => {
        return get().quizzes[quizId] || null;
      },

      clearAllData: () => {
        set({
          quizzes: {},
          attempts: [],
          currentQuizId: null,
          currentAttempt: null,
          currentQuestionIndex: 0,
          questionOrder: [],
          isTaking: false,
          showResults: false,
          timeRemaining: null,
          timerActive: false,
        });
      },
    }),
    {
      name: "quiz-storage",
      partialize: (state) => ({
        quizzes: state.quizzes,
        attempts: state.attempts.slice(-200), // Keep last 200 attempts
      }),
    }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get current quiz session state
 */
export function useQuizSession() {
  const {
    currentAttempt,
    currentQuestionIndex,
    questionOrder,
    isTaking,
    showResults,
    timeRemaining,
    timerActive,
    getCurrentQuestion,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    skipQuestion,
    finishQuiz,
    cancelQuiz,
  } = useQuizStore();

  const currentQuestion = getCurrentQuestion();
  const totalQuestions = questionOrder.length;
  const progress =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;
  const isComplete = currentQuestionIndex >= totalQuestions - 1;

  // Check if current question is answered
  const isCurrentAnswered =
    currentAttempt?.answers.some((a) => a.questionId === currentQuestion?.id) ??
    false;

  return {
    attempt: currentAttempt,
    currentQuestion,
    currentIndex: currentQuestionIndex,
    totalQuestions,
    progress,
    isTaking,
    showResults,
    timeRemaining,
    timerActive,
    isComplete,
    isCurrentAnswered,
    actions: {
      submit: submitAnswer,
      next: nextQuestion,
      previous: previousQuestion,
      skip: skipQuestion,
      finish: finishQuiz,
      cancel: cancelQuiz,
    },
  };
}

/**
 * Hook to get quiz overview data
 */
export function useQuizOverview(quizId: string | null) {
  const { getQuizById, getQuizStats, getAttemptHistory, getWeakTopicsForQuiz } =
    useQuizStore();

  if (!quizId) return null;

  const quiz = getQuizById(quizId);
  if (!quiz) return null;

  const stats = getQuizStats(quizId);
  const recentAttempts = getAttemptHistory(quizId).slice(0, 5);
  const weakTopics = getWeakTopicsForQuiz(quizId);

  // Get all unique topics
  const allTopics = [...new Set(quiz.questions.map((q) => q.topic))];

  return {
    quiz,
    stats,
    recentAttempts,
    weakTopics,
    allTopics,
    questionCount: quiz.questions.length,
    totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
  };
}
