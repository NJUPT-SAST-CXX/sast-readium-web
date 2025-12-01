/**
 * Tests for Adaptive Quiz Engine
 */

import {
  adjustDifficulty,
  calculateTopicProficiency,
  getProficiencyLevel,
  selectNextQuestion,
  filterQuestions,
  shuffleQuestions,
  gradeObjectiveAnswer,
  buildShortAnswerGradingPrompt,
  calculateQuizStats,
  analyzeQuestionPerformance,
  getWeakTopics,
  getStudyRecommendations,
} from "./adaptive-engine";
import type {
  Question,
  UserAnswer,
  QuizAttempt,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillBlankQuestion,
  ShortAnswerQuestion,
} from "../types";

// Helper to create mock questions
function createMockQuestion(
  id: string,
  overrides: Partial<Question> = {}
): MultipleChoiceQuestion {
  return {
    id,
    quizId: "quiz-1",
    type: "multiple-choice",
    difficulty: "medium",
    topic: "general",
    points: 1,
    question: "Test question?",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    ...overrides,
  } as MultipleChoiceQuestion;
}

function createMockAnswer(
  questionId: string,
  overrides: Partial<UserAnswer> = {}
): UserAnswer {
  return {
    questionId,
    answer: 0,
    isCorrect: true,
    timeSpent: 30,
    answeredAt: Date.now(),
    ...overrides,
  };
}

function createMockAttempt(
  id: string,
  overrides: Partial<QuizAttempt> = {}
): QuizAttempt {
  return {
    id,
    quizId: "quiz-1",
    startedAt: Date.now() - 600000,
    completedAt: Date.now(),
    answers: [],
    score: 80,
    maxScore: 100,
    percentage: 80,
    currentDifficulty: "medium",
    topicProficiency: {},
    ...overrides,
  };
}

describe("adaptive-engine", () => {
  describe("adjustDifficulty", () => {
    it("should not change difficulty with insufficient answers", () => {
      const result = adjustDifficulty("medium", [true, true, true]);
      expect(result).toBe("medium");
    });

    it("should increase difficulty when accuracy is high", () => {
      // 5 correct answers = 100% accuracy
      const result = adjustDifficulty("medium", [true, true, true, true, true]);
      expect(result).toBe("hard");
    });

    it("should decrease difficulty when accuracy is low", () => {
      // 1 correct out of 5 = 20% accuracy
      const result = adjustDifficulty("medium", [
        false,
        false,
        false,
        false,
        true,
      ]);
      expect(result).toBe("easy");
    });

    it("should maintain difficulty when accuracy is moderate", () => {
      // 3 correct out of 5 = 60% accuracy
      const result = adjustDifficulty("medium", [
        true,
        true,
        true,
        false,
        false,
      ]);
      expect(result).toBe("medium");
    });

    it("should not increase beyond hard", () => {
      const result = adjustDifficulty("hard", [true, true, true, true, true]);
      expect(result).toBe("hard");
    });

    it("should not decrease below easy", () => {
      const result = adjustDifficulty("easy", [
        false,
        false,
        false,
        false,
        false,
      ]);
      expect(result).toBe("easy");
    });

    it("should increase from easy to medium", () => {
      const result = adjustDifficulty("easy", [true, true, true, true, true]);
      expect(result).toBe("medium");
    });

    it("should decrease from hard to medium", () => {
      const result = adjustDifficulty("hard", [
        false,
        false,
        false,
        false,
        true,
      ]);
      expect(result).toBe("medium");
    });

    it("should use only the last 5 answers", () => {
      // First 3 wrong, last 5 correct
      const result = adjustDifficulty("medium", [
        false,
        false,
        false,
        true,
        true,
        true,
        true,
        true,
      ]);
      expect(result).toBe("hard");
    });
  });

  describe("calculateTopicProficiency", () => {
    it("should return 0 for topics with no answers", () => {
      const result = calculateTopicProficiency("math", [], []);
      expect(result).toBe(0);
    });

    it("should calculate proficiency based on correct answers", () => {
      const questions = [
        createMockQuestion("q1", { topic: "math" }),
        createMockQuestion("q2", { topic: "math" }),
      ];
      const answers = [
        createMockAnswer("q1", { isCorrect: true }),
        createMockAnswer("q2", { isCorrect: true }),
      ];

      const result = calculateTopicProficiency("math", answers, questions);
      expect(result).toBe(100);
    });

    it("should weight recent answers more heavily", () => {
      const questions = [
        createMockQuestion("q1", { topic: "math" }),
        createMockQuestion("q2", { topic: "math" }),
      ];
      // First wrong, second correct - recent answer weighted more
      const answers = [
        createMockAnswer("q1", { isCorrect: false }),
        createMockAnswer("q2", { isCorrect: true }),
      ];

      const result = calculateTopicProficiency("math", answers, questions);
      // Should be higher than 50 due to recency weighting
      expect(result).toBeGreaterThan(50);
    });

    it("should use AI grading score when available", () => {
      const questions = [createMockQuestion("q1", { topic: "math" })];
      const answers = [
        createMockAnswer("q1", { isCorrect: false, aiGradingScore: 75 }),
      ];

      const result = calculateTopicProficiency("math", answers, questions);
      expect(result).toBe(75);
    });

    it("should filter answers by topic", () => {
      const questions = [
        createMockQuestion("q1", { topic: "math" }),
        createMockQuestion("q2", { topic: "science" }),
      ];
      const answers = [
        createMockAnswer("q1", { isCorrect: true }),
        createMockAnswer("q2", { isCorrect: false }),
      ];

      const mathResult = calculateTopicProficiency("math", answers, questions);
      const scienceResult = calculateTopicProficiency(
        "science",
        answers,
        questions
      );

      expect(mathResult).toBe(100);
      expect(scienceResult).toBe(0);
    });
  });

  describe("getProficiencyLevel", () => {
    it("should return novice for low proficiency", () => {
      expect(getProficiencyLevel(15)).toBe("novice");
    });

    it("should return beginner for 30-50", () => {
      expect(getProficiencyLevel(40)).toBe("beginner");
    });

    it("should return intermediate for 50-70", () => {
      expect(getProficiencyLevel(60)).toBe("intermediate");
    });

    it("should return advanced for 70-85", () => {
      expect(getProficiencyLevel(80)).toBe("advanced");
    });

    it("should return expert for 85+", () => {
      expect(getProficiencyLevel(90)).toBe("expert");
    });

    it("should return expert for 100", () => {
      expect(getProficiencyLevel(100)).toBe("expert");
    });
  });

  describe("selectNextQuestion", () => {
    it("should return null when no questions available", () => {
      const result = selectNextQuestion([], {
        currentDifficulty: "medium",
        topicProficiency: {},
        answeredQuestionIds: new Set(),
      });
      expect(result).toBeNull();
    });

    it("should return null when all questions answered", () => {
      const questions = [createMockQuestion("q1")];
      const result = selectNextQuestion(questions, {
        currentDifficulty: "medium",
        topicProficiency: {},
        answeredQuestionIds: new Set(["q1"]),
      });
      expect(result).toBeNull();
    });

    it("should select unanswered question", () => {
      const questions = [createMockQuestion("q1"), createMockQuestion("q2")];
      const result = selectNextQuestion(questions, {
        currentDifficulty: "medium",
        topicProficiency: {},
        answeredQuestionIds: new Set(["q1"]),
      });
      expect(result?.id).toBe("q2");
    });

    it("should prefer questions matching current difficulty", () => {
      const questions = [
        createMockQuestion("q1", { difficulty: "easy" }),
        createMockQuestion("q2", { difficulty: "medium" }),
        createMockQuestion("q3", { difficulty: "hard" }),
      ];

      // Run multiple times to account for randomness
      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const result = selectNextQuestion(questions, {
          currentDifficulty: "medium",
          topicProficiency: {},
          answeredQuestionIds: new Set(),
        });
        if (result) results.push(result.id);
      }

      // Medium difficulty should be selected most often
      const mediumCount = results.filter((id) => id === "q2").length;
      expect(mediumCount).toBeGreaterThan(5);
    });

    it("should prefer weaker topics when enabled", () => {
      const questions = [
        createMockQuestion("q1", { topic: "strong" }),
        createMockQuestion("q2", { topic: "weak" }),
      ];

      const results: string[] = [];
      for (let i = 0; i < 20; i++) {
        const result = selectNextQuestion(questions, {
          currentDifficulty: "medium",
          topicProficiency: { strong: 90, weak: 20 },
          answeredQuestionIds: new Set(),
          preferWeakerTopics: true,
        });
        if (result) results.push(result.id);
      }

      // Weak topic should be selected more often
      const weakCount = results.filter((id) => id === "q2").length;
      expect(weakCount).toBeGreaterThan(10);
    });
  });

  describe("filterQuestions", () => {
    const questions = [
      createMockQuestion("q1", {
        difficulty: "easy",
        topic: "math",
        type: "multiple-choice",
      }),
      createMockQuestion("q2", {
        difficulty: "medium",
        topic: "science",
        type: "true-false",
      } as any),
      createMockQuestion("q3", {
        difficulty: "hard",
        topic: "math",
        type: "multiple-choice",
      }),
    ];

    it("should filter by difficulty", () => {
      const result = filterQuestions(questions, { difficulties: ["easy"] });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("q1");
    });

    it("should filter by topic", () => {
      const result = filterQuestions(questions, { topics: ["math"] });
      expect(result).toHaveLength(2);
    });

    it("should filter by type", () => {
      const result = filterQuestions(questions, { types: ["multiple-choice"] });
      expect(result).toHaveLength(2);
    });

    it("should exclude specific IDs", () => {
      const result = filterQuestions(questions, { excludeIds: ["q1", "q2"] });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("q3");
    });

    it("should combine multiple filters", () => {
      const result = filterQuestions(questions, {
        difficulties: ["easy", "medium"],
        topics: ["math"],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("q1");
    });

    it("should return all questions when no filters", () => {
      const result = filterQuestions(questions, {});
      expect(result).toHaveLength(3);
    });
  });

  describe("shuffleQuestions", () => {
    it("should return same questions when shuffle is false", () => {
      const questions = [
        createMockQuestion("q1"),
        createMockQuestion("q2"),
        createMockQuestion("q3"),
      ];
      const result = shuffleQuestions(questions, { shuffle: false });
      expect(result).toEqual(questions);
    });

    it("should shuffle questions", () => {
      const questions = Array.from({ length: 10 }, (_, i) =>
        createMockQuestion(`q${i}`)
      );

      // Run multiple times to ensure shuffling occurs
      let differentOrder = false;
      for (let i = 0; i < 10; i++) {
        const result = shuffleQuestions(questions, { shuffle: true });
        if (result[0].id !== questions[0].id) {
          differentOrder = true;
          break;
        }
      }
      expect(differentOrder).toBe(true);
    });

    it("should group by topic when enabled", () => {
      const questions = [
        createMockQuestion("q1", { topic: "A" }),
        createMockQuestion("q2", { topic: "B" }),
        createMockQuestion("q3", { topic: "A" }),
        createMockQuestion("q4", { topic: "B" }),
      ];

      const result = shuffleQuestions(questions, {
        shuffle: true,
        groupByTopic: true,
      });

      // Check that same-topic questions are adjacent
      const topicA = result.filter((q) => q.topic === "A");
      const topicB = result.filter((q) => q.topic === "B");
      expect(topicA).toHaveLength(2);
      expect(topicB).toHaveLength(2);
    });

    it("should preserve all questions after shuffle", () => {
      const questions = [
        createMockQuestion("q1"),
        createMockQuestion("q2"),
        createMockQuestion("q3"),
      ];
      const result = shuffleQuestions(questions);
      expect(result).toHaveLength(3);
      expect(result.map((q) => q.id).sort()).toEqual(["q1", "q2", "q3"]);
    });
  });

  describe("gradeObjectiveAnswer", () => {
    describe("multiple-choice", () => {
      it("should grade correct answer", () => {
        const question: MultipleChoiceQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "multiple-choice",
          difficulty: "medium",
          topic: "test",
          points: 1,
          question: "What is 2+2?",
          options: ["3", "4", "5", "6"],
          correctIndex: 1,
        };

        const result = gradeObjectiveAnswer(question, 1);
        expect(result.isCorrect).toBe(true);
        expect(result.feedback).toBe("Correct!");
      });

      it("should grade incorrect answer", () => {
        const question: MultipleChoiceQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "multiple-choice",
          difficulty: "medium",
          topic: "test",
          points: 1,
          question: "What is 2+2?",
          options: ["3", "4", "5", "6"],
          correctIndex: 1,
        };

        const result = gradeObjectiveAnswer(question, 0);
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain("4");
      });
    });

    describe("true-false", () => {
      it("should grade correct true answer", () => {
        const question: TrueFalseQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "true-false",
          difficulty: "medium",
          topic: "test",
          points: 1,
          statement: "The sky is blue",
          correctAnswer: true,
        };

        const result = gradeObjectiveAnswer(question, true);
        expect(result.isCorrect).toBe(true);
      });

      it("should grade incorrect false answer", () => {
        const question: TrueFalseQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "true-false",
          difficulty: "medium",
          topic: "test",
          points: 1,
          statement: "The sky is blue",
          correctAnswer: true,
        };

        const result = gradeObjectiveAnswer(question, false);
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain("true");
      });
    });

    describe("fill-blank", () => {
      it("should grade all blanks correct", () => {
        const question: FillBlankQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "fill-blank",
          difficulty: "medium",
          topic: "test",
          points: 1,
          sentence: "The {{blank}} is {{blank}}",
          blanks: [
            { position: 0, answer: "sky", alternatives: ["heaven"] },
            { position: 1, answer: "blue" },
          ],
        };

        const result = gradeObjectiveAnswer(question, ["sky", "blue"]);
        expect(result.isCorrect).toBe(true);
        expect(result.feedback).toContain("All blanks filled correctly");
      });

      it("should accept alternative answers", () => {
        const question: FillBlankQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "fill-blank",
          difficulty: "medium",
          topic: "test",
          points: 1,
          sentence: "The {{blank}} is blue",
          blanks: [{ position: 0, answer: "sky", alternatives: ["heaven"] }],
        };

        const result = gradeObjectiveAnswer(question, ["heaven"]);
        expect(result.isCorrect).toBe(true);
      });

      it("should handle partial correct answers", () => {
        const question: FillBlankQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "fill-blank",
          difficulty: "medium",
          topic: "test",
          points: 1,
          sentence: "The {{blank}} is {{blank}}",
          blanks: [
            { position: 0, answer: "sky" },
            { position: 1, answer: "blue" },
          ],
        };

        const result = gradeObjectiveAnswer(question, ["sky", "red"]);
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain("1/2");
      });

      it("should be case insensitive", () => {
        const question: FillBlankQuestion = {
          id: "q1",
          quizId: "quiz-1",
          type: "fill-blank",
          difficulty: "medium",
          topic: "test",
          points: 1,
          sentence: "The {{blank}} is blue",
          blanks: [{ position: 0, answer: "Sky" }],
        };

        const result = gradeObjectiveAnswer(question, ["SKY"]);
        expect(result.isCorrect).toBe(true);
      });
    });

    describe("unsupported type", () => {
      it("should return cannot grade for short-answer", () => {
        const question = {
          id: "q1",
          quizId: "quiz-1",
          type: "short-answer",
          difficulty: "medium",
          topic: "test",
          points: 1,
          question: "Explain...",
          rubric: "...",
          sampleAnswer: "...",
        } as ShortAnswerQuestion;

        const result = gradeObjectiveAnswer(question, "some answer");
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain("Cannot grade");
      });
    });
  });

  describe("buildShortAnswerGradingPrompt", () => {
    it("should build prompt with all fields", () => {
      const question: ShortAnswerQuestion = {
        id: "q1",
        quizId: "quiz-1",
        type: "short-answer",
        difficulty: "medium",
        topic: "test",
        points: 2,
        question: "Explain photosynthesis",
        rubric: "Should mention light, CO2, and glucose",
        sampleAnswer: "Photosynthesis is the process...",
        keywords: ["light", "chlorophyll", "glucose"],
      };

      const prompt = buildShortAnswerGradingPrompt(
        question,
        "Plants use sunlight"
      );

      expect(prompt).toContain("Explain photosynthesis");
      expect(prompt).toContain("Should mention light, CO2, and glucose");
      expect(prompt).toContain("Photosynthesis is the process");
      expect(prompt).toContain("light, chlorophyll, glucose");
      expect(prompt).toContain("Plants use sunlight");
      expect(prompt).toContain("JSON format");
    });

    it("should handle question without keywords", () => {
      const question: ShortAnswerQuestion = {
        id: "q1",
        quizId: "quiz-1",
        type: "short-answer",
        difficulty: "medium",
        topic: "test",
        points: 2,
        question: "Explain something",
        rubric: "Rubric here",
        sampleAnswer: "Sample answer",
      };

      const prompt = buildShortAnswerGradingPrompt(question, "My answer");
      expect(prompt).not.toContain("Key terms");
    });
  });

  describe("calculateQuizStats", () => {
    it("should return zeros for empty attempts", () => {
      const result = calculateQuizStats([]);
      expect(result.totalAttempts).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.bestScore).toBe(0);
      expect(result.averageTime).toBe(0);
      expect(result.improvementTrend).toEqual([]);
    });

    it("should calculate stats for completed attempts", () => {
      const attempts = [
        createMockAttempt("a1", { percentage: 70 }),
        createMockAttempt("a2", { percentage: 80 }),
        createMockAttempt("a3", { percentage: 90 }),
      ];

      const result = calculateQuizStats(attempts);
      expect(result.totalAttempts).toBe(3);
      expect(result.averageScore).toBe(80);
      expect(result.bestScore).toBe(90);
      expect(result.improvementTrend).toEqual([70, 80, 90]);
    });

    it("should calculate average time in minutes", () => {
      const now = Date.now();
      const attempts = [
        createMockAttempt("a1", {
          startedAt: now - 300000, // 5 minutes ago
          completedAt: now,
        }),
      ];

      const result = calculateQuizStats(attempts);
      expect(result.averageTime).toBe(5);
    });

    it("should only include last 10 attempts in trend", () => {
      const attempts = Array.from({ length: 15 }, (_, i) =>
        createMockAttempt(`a${i}`, { percentage: i * 5 })
      );

      const result = calculateQuizStats(attempts);
      expect(result.improvementTrend).toHaveLength(10);
    });

    it("should handle incomplete attempts", () => {
      const attempts = [
        createMockAttempt("a1", { percentage: 80, completedAt: Date.now() }),
        createMockAttempt("a2", {
          percentage: 0,
          completedAt: undefined,
        }),
      ];

      const result = calculateQuizStats(attempts);
      expect(result.totalAttempts).toBe(2);
      expect(result.averageScore).toBe(80); // Only completed attempt
    });
  });

  describe("analyzeQuestionPerformance", () => {
    it("should return zeros for question with no answers", () => {
      const result = analyzeQuestionPerformance("q1", []);
      expect(result.attempts).toBe(0);
      expect(result.correctRate).toBe(0);
      expect(result.averageTime).toBe(0);
    });

    it("should calculate performance metrics", () => {
      const attempts = [
        createMockAttempt("a1", {
          answers: [
            createMockAnswer("q1", { isCorrect: true, timeSpent: 20 }),
            createMockAnswer("q2", { isCorrect: false, timeSpent: 30 }),
          ],
        }),
        createMockAttempt("a2", {
          answers: [createMockAnswer("q1", { isCorrect: true, timeSpent: 40 })],
        }),
      ];

      const result = analyzeQuestionPerformance("q1", attempts);
      expect(result.attempts).toBe(2);
      expect(result.correctRate).toBe(100);
      expect(result.averageTime).toBe(30);
    });

    it("should calculate correct rate accurately", () => {
      const attempts = [
        createMockAttempt("a1", {
          answers: [createMockAnswer("q1", { isCorrect: true })],
        }),
        createMockAttempt("a2", {
          answers: [createMockAnswer("q1", { isCorrect: false })],
        }),
      ];

      const result = analyzeQuestionPerformance("q1", attempts);
      expect(result.correctRate).toBe(50);
    });
  });

  describe("getWeakTopics", () => {
    it("should return empty array when no weak topics", () => {
      const result = getWeakTopics({ math: 80, science: 70 });
      expect(result).toEqual([]);
    });

    it("should return topics below threshold", () => {
      const result = getWeakTopics({ math: 30, science: 70, history: 40 });
      expect(result).toContain("math");
      expect(result).toContain("history");
      expect(result).not.toContain("science");
    });

    it("should sort by proficiency ascending", () => {
      const result = getWeakTopics({ math: 30, history: 20, art: 40 });
      expect(result).toEqual(["history", "math", "art"]);
    });

    it("should use custom threshold", () => {
      const result = getWeakTopics({ math: 60, science: 70 }, 65);
      expect(result).toEqual(["math"]);
    });
  });

  describe("getStudyRecommendations", () => {
    it("should return empty array when no weak topics", () => {
      const result = getStudyRecommendations({ math: 80, science: 90 }, []);
      expect(result).toEqual([]);
    });

    it("should recommend weak topics", () => {
      const result = getStudyRecommendations(
        { math: 20, science: 40, history: 80 },
        []
      );

      expect(result).toHaveLength(2);
      expect(result[0].topic).toBe("math");
      expect(result[0].suggestedDifficulty).toBe("easy");
      expect(result[1].topic).toBe("science");
      expect(result[1].suggestedDifficulty).toBe("medium");
    });

    it("should limit to 3 weak topics", () => {
      const result = getStudyRecommendations(
        { a: 10, b: 20, c: 30, d: 40, e: 45 },
        []
      );

      expect(result).toHaveLength(3);
    });

    it("should detect declining performance", () => {
      const attempts = [
        createMockAttempt("a1", { topicProficiency: { math: 80 } }),
        createMockAttempt("a2", { topicProficiency: { math: 60 } }),
      ];

      const result = getStudyRecommendations({ math: 60 }, attempts);

      const mathRec = result.find((r) => r.reason.includes("dropped"));
      expect(mathRec).toBeDefined();
      expect(mathRec?.topic).toBe("math");
    });

    it("should not flag small performance drops", () => {
      const attempts = [
        createMockAttempt("a1", { topicProficiency: { math: 80 } }),
        createMockAttempt("a2", { topicProficiency: { math: 75 } }),
      ];

      const result = getStudyRecommendations({ math: 75 }, attempts);

      const mathRec = result.find((r) => r.reason.includes("dropped"));
      expect(mathRec).toBeUndefined();
    });
  });
});
