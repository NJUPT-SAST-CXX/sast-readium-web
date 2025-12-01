/**
 * AI Learning Module - Public Exports
 *
 * This module provides learning features including:
 * - PPT Generation and Editing
 * - Flashcard System with Spaced Repetition
 * - Quiz/Test System with Adaptive Difficulty
 */

// ============================================================================
// Types
// ============================================================================

export * from "./types";

// ============================================================================
// Flashcard System
// ============================================================================

export {
  useFlashcardStore,
  useStudySession,
  useDeckOverview,
} from "./flashcard/flashcard-store";

export {
  calculateSM2,
  createInitialSRSData,
  getDueCards,
  getNewCards,
  getLearningCards,
  getMasteredCards,
  getStudyQueue,
  calculateDeckStats,
  getReviewForecast,
  getNextReviewText,
  getQualityFromLabel,
  getIntervalPreview,
  estimateReviewTime,
  sortByUrgency,
} from "./flashcard/srs-algorithm";

// ============================================================================
// Quiz System
// ============================================================================

export {
  useQuizStore,
  useQuizSession,
  useQuizOverview,
} from "./quiz/quiz-store";

export {
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
} from "./quiz/adaptive-engine";

// ============================================================================
// PPT System
// ============================================================================

export { usePPTStore, usePPTEditor, usePPTPreview } from "./ppt/ppt-store";

export {
  exportToPPTX,
  downloadPPTX,
  generateSlideFromContent,
  createPresentationFromContent,
} from "./ppt/pptx-exporter";

// ============================================================================
// AI Content Generation Prompts
// ============================================================================

/**
 * System prompt for PPT generation
 */
export const PPT_GENERATION_SYSTEM_PROMPT = `You are an expert presentation designer. Generate structured slide content from document text.

For each slide, provide:
1. A concise title (max 8 words)
2. 3-5 bullet points (max 15 words each)
3. Suggested visual element description
4. Speaker notes (2-3 sentences)

Output format as JSON:
{
  "slides": [{
    "title": string,
    "bullets": string[],
    "visualSuggestion": string,
    "notes": string,
    "layout": "title" | "content" | "two-column" | "image-focus"
  }]
}

Guidelines:
- First slide should be a title slide
- Maintain logical flow between slides
- Keep text concise and scannable
- Suggest relevant visuals for complex concepts`;

/**
 * System prompt for flashcard generation
 */
export const FLASHCARD_GENERATION_SYSTEM_PROMPT = `You are an expert educator creating flashcards for spaced repetition learning.

Generate flashcards that:
1. Focus on key concepts, definitions, and relationships
2. Use clear, unambiguous language
3. Include context clues when helpful
4. Vary difficulty appropriately

Output format depends on card type:

For Q&A cards:
{
  "type": "qa",
  "front": "Question text",
  "back": "Answer text",
  "tags": ["tag1", "tag2"]
}

For fill-in-the-blank:
{
  "type": "fill-blank",
  "sentence": "The {{blank}} is the process of...",
  "blanks": [{ "position": 0, "answer": "correct answer", "alternatives": ["alt1"] }],
  "tags": []
}

For multiple choice:
{
  "type": "multiple-choice",
  "question": "Which of the following...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "A is correct because...",
  "tags": []
}

For matching:
{
  "type": "matching",
  "pairs": [{ "left": "Term", "right": "Definition" }],
  "instruction": "Match the terms with their definitions",
  "tags": []
}`;

/**
 * System prompt for quiz generation
 */
export const QUIZ_GENERATION_SYSTEM_PROMPT = `You are an expert test creator generating assessment questions.

Create questions that:
1. Test understanding, not just memorization
2. Have clear, unambiguous correct answers
3. Include plausible distractors for multiple choice
4. Cover different cognitive levels (recall, comprehension, application)
5. Include helpful explanations

Difficulty guidelines:
- easy: Basic recall and recognition. Direct quotes from source.
- medium: Comprehension and application. Requires understanding context.
- hard: Analysis and synthesis. Requires connecting multiple concepts.

Output format:

For multiple choice:
{
  "type": "multiple-choice",
  "question": "Question text",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "Explanation of correct answer",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "Topic name",
  "points": 1
}

For true/false:
{
  "type": "true-false",
  "statement": "Statement to evaluate",
  "correctAnswer": true | false,
  "explanation": "Why this is true/false",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "Topic name",
  "points": 1
}

For short answer:
{
  "type": "short-answer",
  "question": "Open-ended question",
  "rubric": "Grading criteria",
  "sampleAnswer": "Model answer",
  "keywords": ["key", "terms"],
  "difficulty": "easy" | "medium" | "hard",
  "topic": "Topic name",
  "points": 2
}

For fill-in-blank:
{
  "type": "fill-blank",
  "sentence": "The {{blank}} is important because...",
  "blanks": [{ "position": 0, "answer": "answer", "alternatives": ["alt"] }],
  "explanation": "Explanation",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "Topic name",
  "points": 1
}`;

/**
 * Build prompt for AI grading of short answers
 */
export function buildGradingPrompt(
  question: string,
  rubric: string,
  sampleAnswer: string,
  userAnswer: string,
  keywords?: string[]
): string {
  return `Grade this short answer response on a scale of 0-100.

Question: ${question}

Grading Rubric: ${rubric}

Sample Answer: ${sampleAnswer}

${keywords ? `Key terms that should appear: ${keywords.join(", ")}` : ""}

Student's Answer: ${userAnswer}

Provide your response in JSON format:
{
  "score": <number 0-100>,
  "feedback": "<brief feedback explaining the score>",
  "keyPointsPresent": ["<key points the student included>"],
  "keyPointsMissing": ["<key points the student missed>"]
}`;
}
