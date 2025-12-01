/**
 * Adaptive Quiz Engine
 *
 * Implements adaptive difficulty adjustment based on user performance.
 * The algorithm tracks accuracy across recent answers and topics,
 * adjusting question difficulty to maintain optimal challenge level.
 */

import type {
  Question,
  DifficultyLevel,
  UserAnswer,
  QuizAttempt,
  QuestionType,
} from "../types";

// ============================================================================
// Constants
// ============================================================================

// Number of recent answers to consider for difficulty adjustment
const WINDOW_SIZE = 5;

// Thresholds for difficulty adjustment
const INCREASE_THRESHOLD = 0.8; // 80% correct -> increase difficulty
const DECREASE_THRESHOLD = 0.4; // 40% correct -> decrease difficulty

// Target accuracy for optimal learning (Zone of Proximal Development)
const TARGET_ACCURACY = 0.7;

// Topic proficiency levels
const PROFICIENCY_LEVELS = {
  novice: { min: 0, max: 30 },
  beginner: { min: 30, max: 50 },
  intermediate: { min: 50, max: 70 },
  advanced: { min: 70, max: 85 },
  expert: { min: 85, max: 100 },
};

// ============================================================================
// Core Algorithm
// ============================================================================

/**
 * Adjust difficulty based on recent answers
 */
export function adjustDifficulty(
  currentDifficulty: DifficultyLevel,
  recentAnswers: boolean[]
): DifficultyLevel {
  if (recentAnswers.length < WINDOW_SIZE) {
    return currentDifficulty;
  }

  const windowAnswers = recentAnswers.slice(-WINDOW_SIZE);
  const correctRate =
    windowAnswers.filter(Boolean).length / windowAnswers.length;

  if (correctRate >= INCREASE_THRESHOLD && currentDifficulty !== "hard") {
    return currentDifficulty === "easy" ? "medium" : "hard";
  }

  if (correctRate <= DECREASE_THRESHOLD && currentDifficulty !== "easy") {
    return currentDifficulty === "hard" ? "medium" : "easy";
  }

  return currentDifficulty;
}

/**
 * Calculate topic proficiency based on answer history
 */
export function calculateTopicProficiency(
  topic: string,
  answers: UserAnswer[],
  questions: Question[]
): number {
  // Filter answers for this topic
  const topicQuestionIds = new Set(
    questions.filter((q) => q.topic === topic).map((q) => q.id)
  );
  const topicAnswers = answers.filter((a) =>
    topicQuestionIds.has(a.questionId)
  );

  if (topicAnswers.length === 0) return 0;

  // Weight recent answers more heavily
  let weightedScore = 0;
  let totalWeight = 0;

  topicAnswers.forEach((answer, index) => {
    // More recent answers have higher weight
    const weight = 1 + index / topicAnswers.length;
    const score = answer.isCorrect ? 100 : 0;

    // For short answers, use AI grading score if available
    if (answer.aiGradingScore !== undefined) {
      weightedScore += answer.aiGradingScore * weight;
    } else {
      weightedScore += score * weight;
    }
    totalWeight += weight;
  });

  return Math.round(weightedScore / totalWeight);
}

/**
 * Get proficiency level label
 */
export function getProficiencyLevel(
  proficiency: number
): keyof typeof PROFICIENCY_LEVELS {
  for (const [level, range] of Object.entries(PROFICIENCY_LEVELS)) {
    if (proficiency >= range.min && proficiency < range.max) {
      return level as keyof typeof PROFICIENCY_LEVELS;
    }
  }
  return "expert";
}

// ============================================================================
// Question Selection
// ============================================================================

interface QuestionSelectionOptions {
  currentDifficulty: DifficultyLevel;
  topicProficiency: Record<string, number>;
  answeredQuestionIds: Set<string>;
  preferWeakerTopics?: boolean;
  questionTypeMix?: Partial<Record<QuestionType, number>>;
}

/**
 * Select the next question adaptively
 */
export function selectNextQuestion(
  availableQuestions: Question[],
  options: QuestionSelectionOptions
): Question | null {
  const {
    currentDifficulty,
    topicProficiency,
    answeredQuestionIds,
    preferWeakerTopics = true,
  } = options;

  // Filter out already answered questions
  const unansweredQuestions = availableQuestions.filter(
    (q) => !answeredQuestionIds.has(q.id)
  );

  if (unansweredQuestions.length === 0) return null;

  // Score each question for selection
  const scoredQuestions = unansweredQuestions.map((question) => {
    let score = 0;

    // Difficulty match (prefer questions at current difficulty)
    if (question.difficulty === currentDifficulty) {
      score += 50;
    } else if (
      (question.difficulty === "medium" && currentDifficulty !== "medium") ||
      (question.difficulty !== "medium" && currentDifficulty === "medium")
    ) {
      score += 25; // Adjacent difficulty
    }

    // Topic proficiency consideration
    if (preferWeakerTopics) {
      const topicProf = topicProficiency[question.topic] ?? 50;
      // Lower proficiency topics get higher priority
      score += Math.max(0, 100 - topicProf) * 0.3;
    }

    // Add some randomness to prevent predictability
    score += Math.random() * 20;

    return { question, score };
  });

  // Sort by score and select the best
  scoredQuestions.sort((a, b) => b.score - a.score);
  return scoredQuestions[0].question;
}

/**
 * Get questions filtered by criteria
 */
export function filterQuestions(
  questions: Question[],
  criteria: {
    difficulties?: DifficultyLevel[];
    topics?: string[];
    types?: QuestionType[];
    excludeIds?: string[];
  }
): Question[] {
  return questions.filter((q) => {
    if (
      criteria.difficulties &&
      !criteria.difficulties.includes(q.difficulty)
    ) {
      return false;
    }
    if (criteria.topics && !criteria.topics.includes(q.topic)) {
      return false;
    }
    if (criteria.types && !criteria.types.includes(q.type)) {
      return false;
    }
    if (criteria.excludeIds && criteria.excludeIds.includes(q.id)) {
      return false;
    }
    return true;
  });
}

/**
 * Shuffle questions with optional grouping by topic
 */
export function shuffleQuestions(
  questions: Question[],
  options: {
    shuffle?: boolean;
    groupByTopic?: boolean;
  } = {}
): Question[] {
  const { shuffle = true, groupByTopic = false } = options;

  if (!shuffle) return questions;

  if (groupByTopic) {
    // Group by topic first, then shuffle within groups
    const grouped = new Map<string, Question[]>();
    for (const q of questions) {
      if (!grouped.has(q.topic)) {
        grouped.set(q.topic, []);
      }
      grouped.get(q.topic)!.push(q);
    }

    // Shuffle each group and the groups themselves
    const shuffledGroups = [...grouped.values()].map((group) =>
      fisherYatesShuffle([...group])
    );
    const groupOrder = fisherYatesShuffle(shuffledGroups);

    return groupOrder.flat();
  }

  return fisherYatesShuffle([...questions]);
}

/**
 * Fisher-Yates shuffle algorithm
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================================================
// Answer Grading
// ============================================================================

/**
 * Grade a multiple choice or true/false answer
 */
export function gradeObjectiveAnswer(
  question: Question,
  userAnswer: string | number | boolean | string[]
): { isCorrect: boolean; feedback: string } {
  switch (question.type) {
    case "multiple-choice": {
      const isCorrect = Number(userAnswer) === question.correctIndex;
      return {
        isCorrect,
        feedback: isCorrect
          ? "Correct!"
          : `Incorrect. The correct answer is: ${question.options[question.correctIndex]}`,
      };
    }
    case "true-false": {
      const isCorrect = Boolean(userAnswer) === question.correctAnswer;
      return {
        isCorrect,
        feedback: isCorrect
          ? "Correct!"
          : `Incorrect. The statement is ${question.correctAnswer ? "true" : "false"}.`,
      };
    }
    case "fill-blank": {
      const answers = Array.isArray(userAnswer)
        ? userAnswer
        : [userAnswer as string];
      let correctCount = 0;

      for (let i = 0; i < question.blanks.length; i++) {
        const blank = question.blanks[i];
        const answer = (answers[i] || "").toString().trim().toLowerCase();
        const correctAnswer = blank.answer.toLowerCase();
        const alternatives =
          blank.alternatives?.map((a) => a.toLowerCase()) || [];

        if (answer === correctAnswer || alternatives.includes(answer)) {
          correctCount++;
        }
      }

      const isCorrect = correctCount === question.blanks.length;
      const partialScore = (correctCount / question.blanks.length) * 100;

      return {
        isCorrect,
        feedback: isCorrect
          ? "All blanks filled correctly!"
          : `${correctCount}/${question.blanks.length} correct. Answers: ${question.blanks.map((b) => b.answer).join(", ")}`,
      };
    }
    default:
      return { isCorrect: false, feedback: "Cannot grade this question type." };
  }
}

/**
 * Build AI grading prompt for short answer questions
 */
export function buildShortAnswerGradingPrompt(
  question: Question & { type: "short-answer" },
  userAnswer: string
): string {
  return `Grade this short answer response on a scale of 0-100.

Question: ${question.question}

Grading Rubric: ${question.rubric}

Sample Answer: ${question.sampleAnswer}

${question.keywords ? `Key terms that should appear: ${question.keywords.join(", ")}` : ""}

Student's Answer: ${userAnswer}

Provide your response in JSON format:
{
  "score": <number 0-100>,
  "feedback": "<brief feedback explaining the score>",
  "keyPointsPresent": ["<key points the student included>"],
  "keyPointsMissing": ["<key points the student missed>"]
}`;
}

// ============================================================================
// Statistics & Analysis
// ============================================================================

/**
 * Calculate overall quiz statistics
 */
export function calculateQuizStats(attempts: QuizAttempt[]): {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  averageTime: number;
  improvementTrend: number[];
} {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      averageTime: 0,
      improvementTrend: [],
    };
  }

  const completedAttempts = attempts.filter((a) => a.completedAt);
  const scores = completedAttempts.map((a) => a.percentage);
  const times = completedAttempts
    .filter((a) => a.completedAt && a.startedAt)
    .map((a) => (a.completedAt! - a.startedAt) / 1000 / 60); // minutes

  return {
    totalAttempts: attempts.length,
    averageScore:
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    averageTime:
      times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    improvementTrend: scores.slice(-10), // Last 10 attempts
  };
}

/**
 * Analyze question performance
 */
export function analyzeQuestionPerformance(
  questionId: string,
  attempts: QuizAttempt[]
): {
  attempts: number;
  correctRate: number;
  averageTime: number;
} {
  const answers = attempts
    .flatMap((a) => a.answers)
    .filter((a) => a.questionId === questionId);

  if (answers.length === 0) {
    return { attempts: 0, correctRate: 0, averageTime: 0 };
  }

  const correctAnswers = answers.filter((a) => a.isCorrect);
  const times = answers.map((a) => a.timeSpent);

  return {
    attempts: answers.length,
    correctRate: (correctAnswers.length / answers.length) * 100,
    averageTime: times.reduce((a, b) => a + b, 0) / times.length,
  };
}

/**
 * Get weak topics based on proficiency
 */
export function getWeakTopics(
  topicProficiency: Record<string, number>,
  threshold: number = 50
): string[] {
  return Object.entries(topicProficiency)
    .filter(([, proficiency]) => proficiency < threshold)
    .sort(([, a], [, b]) => a - b)
    .map(([topic]) => topic);
}

/**
 * Recommend next study focus based on quiz performance
 */
export function getStudyRecommendations(
  topicProficiency: Record<string, number>,
  recentAttempts: QuizAttempt[]
): {
  topic: string;
  reason: string;
  suggestedDifficulty: DifficultyLevel;
}[] {
  const recommendations: {
    topic: string;
    reason: string;
    suggestedDifficulty: DifficultyLevel;
  }[] = [];

  // Find weak topics
  const weakTopics = getWeakTopics(topicProficiency, 50);
  for (const topic of weakTopics.slice(0, 3)) {
    const proficiency = topicProficiency[topic];
    recommendations.push({
      topic,
      reason: `Low proficiency (${proficiency}%)`,
      suggestedDifficulty: proficiency < 30 ? "easy" : "medium",
    });
  }

  // Find topics with declining performance
  if (recentAttempts.length >= 2) {
    const latestAttempt = recentAttempts[recentAttempts.length - 1];
    const previousAttempt = recentAttempts[recentAttempts.length - 2];

    for (const [topic, currentProf] of Object.entries(
      latestAttempt.topicProficiency
    )) {
      const previousProf = previousAttempt.topicProficiency[topic];
      if (previousProf && currentProf < previousProf - 10) {
        recommendations.push({
          topic,
          reason: `Performance dropped by ${Math.round(previousProf - currentProf)}%`,
          suggestedDifficulty: "medium",
        });
      }
    }
  }

  return recommendations;
}
