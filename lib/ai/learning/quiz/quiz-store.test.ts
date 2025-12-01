/**
 * Tests for Quiz Store
 */

import { act } from "@testing-library/react";
import { useQuizStore } from "./quiz-store";
import type { Question } from "../types";

// Helper to create multiple choice question
function createMCQuestion(
  questionText: string,
  correctIndex: number = 0
): Omit<Question, "id" | "quizId"> {
  const optionIds = ["a", "b", "c", "d"];
  return {
    type: "multiple-choice",
    question: questionText,
    options: optionIds.map((id) => ({
      id,
      text: "Option " + id.toUpperCase(),
    })),
    correctOptionId: optionIds[correctIndex],
    explanation: "Test explanation",
    difficulty: "medium",
    topic: "Test Topic",
    points: 1,
  } as Omit<Question, "id" | "quizId">;
}

// Reset store before each test
beforeEach(() => {
  act(() => {
    useQuizStore.getState().clearAllData();
  });
});

describe("quiz-store", () => {
  describe("Quiz CRUD", () => {
    it("should create a quiz", () => {
      let quizId: string;
      act(() => {
        quizId = useQuizStore.getState().createQuiz("Test Quiz");
      });
      const quiz = useQuizStore.getState().getQuizById(quizId!);
      expect(quiz).not.toBeNull();
      expect(quiz?.title).toBe("Test Quiz");
    });

    it("should delete a quiz", () => {
      let quizId: string;
      act(() => {
        quizId = useQuizStore.getState().createQuiz("To Delete");
      });
      expect(useQuizStore.getState().getQuizById(quizId!)).not.toBeNull();
      act(() => {
        useQuizStore.getState().deleteQuiz(quizId!);
      });
      expect(useQuizStore.getState().getQuizById(quizId!)).toBeNull();
    });

    it("should update quiz", () => {
      let quizId: string;
      act(() => {
        quizId = useQuizStore.getState().createQuiz("Original");
      });
      act(() => {
        useQuizStore.getState().updateQuiz(quizId!, { title: "Updated" });
      });
      expect(useQuizStore.getState().getQuizById(quizId!)?.title).toBe(
        "Updated"
      );
    });

    it("should get all quizzes", () => {
      act(() => {
        useQuizStore.getState().createQuiz("Quiz 1");
        useQuizStore.getState().createQuiz("Quiz 2");
      });
      expect(useQuizStore.getState().getAllQuizzes()).toHaveLength(2);
    });
  });

  describe("Question Management", () => {
    let quizId: string;
    beforeEach(() => {
      act(() => {
        quizId = useQuizStore.getState().createQuiz("Test");
      });
    });

    it("should add question", () => {
      act(() => {
        useQuizStore.getState().addQuestion(quizId, createMCQuestion("Q1"));
      });
      expect(
        useQuizStore.getState().getQuizById(quizId)?.questions
      ).toHaveLength(1);
    });

    it("should delete question", () => {
      let qId: string;
      act(() => {
        qId = useQuizStore
          .getState()
          .addQuestion(quizId, createMCQuestion("Q1"));
      });
      act(() => {
        useQuizStore.getState().deleteQuestion(quizId, qId!);
      });
      expect(
        useQuizStore.getState().getQuizById(quizId)?.questions
      ).toHaveLength(0);
    });
  });

  describe("Quiz Taking", () => {
    let quizId: string;
    beforeEach(() => {
      act(() => {
        quizId = useQuizStore.getState().createQuiz("Test");
        useQuizStore
          .getState()
          .addQuestions(quizId, [
            createMCQuestion("Q1", 0),
            createMCQuestion("Q2", 1),
          ]);
      });
    });

    it("should start quiz", () => {
      act(() => {
        useQuizStore.getState().startQuiz(quizId);
      });
      expect(useQuizStore.getState().isTaking).toBe(true);
    });

    it("should submit answer", () => {
      act(() => {
        useQuizStore.getState().startQuiz(quizId);
        useQuizStore.getState().submitAnswer({ answer: "a", timeSpent: 5 });
      });
      expect(useQuizStore.getState().currentAttempt?.answers.length).toBe(1);
    });

    it("should finish quiz", () => {
      act(() => {
        useQuizStore.getState().startQuiz(quizId);
        useQuizStore.getState().finishQuiz();
      });
      expect(useQuizStore.getState().isTaking).toBe(false);
      expect(useQuizStore.getState().attempts.length).toBeGreaterThan(0);
    });
  });

  describe("Timer", () => {
    it("should set time remaining", () => {
      act(() => {
        useQuizStore.getState().setTimeRemaining(300);
      });
      expect(useQuizStore.getState().timeRemaining).toBe(300);
    });

    it("should decrement timer when active", () => {
      act(() => {
        useQuizStore.getState().setTimeRemaining(300);
        useQuizStore.getState().resumeTimer();
        useQuizStore.getState().decrementTimer();
      });
      expect(useQuizStore.getState().timeRemaining).toBe(299);
    });
  });

  describe("Generation State", () => {
    it("should set generating state", () => {
      act(() => {
        useQuizStore.getState().setGenerating(true, 50);
      });
      expect(useQuizStore.getState().isGenerating).toBe(true);
      expect(useQuizStore.getState().generationProgress).toBe(50);
    });
  });

  describe("Clear Operations", () => {
    it("should clear all data", () => {
      act(() => {
        useQuizStore.getState().createQuiz("Test");
        useQuizStore.getState().clearAllData();
      });
      expect(Object.keys(useQuizStore.getState().quizzes)).toHaveLength(0);
    });
  });
});
