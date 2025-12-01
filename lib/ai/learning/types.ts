/**
 * AI Learning Module - Shared Types
 *
 * This module defines common types shared across PPT, Flashcard, and Quiz features.
 */

// ============================================================================
// Common Types
// ============================================================================

export interface SourceReference {
  documentId?: string;
  fileName?: string;
  pageNumber?: number;
  text?: string;
}

export interface GenerationOptions {
  sourceContent: string;
  sourcePages?: number[];
  language?: "en" | "zh";
}

export interface GenerationProgress {
  status: "idle" | "generating" | "completed" | "error";
  progress: number; // 0-100
  message?: string;
  error?: string;
}

// ============================================================================
// PPT Types
// ============================================================================

export type SlideElementType = "text" | "image" | "shape" | "chart";
export type SlideLayout =
  | "title"
  | "content"
  | "two-column"
  | "image-focus"
  | "blank";
export type ShapeType = "rectangle" | "circle" | "arrow" | "line";

export interface SlideElementStyle {
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
}

export interface SlideElement {
  id: string;
  type: SlideElementType;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  style: SlideElementStyle;
  zIndex: number;
  locked?: boolean;
}

export interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  notes: string;
  layout: SlideLayout;
  backgroundColor?: string;
  backgroundImage?: string;
  order: number;
}

export interface PresentationTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  titleFontSize: number;
  bodyFontSize: number;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: PresentationTheme;
  createdAt: number;
  updatedAt: number;
  sourceDocumentId?: string;
  sourceFileName?: string;
}

// Default themes
export const DEFAULT_THEMES: PresentationTheme[] = [
  {
    id: "default",
    name: "Default",
    primaryColor: "#1a1a2e",
    secondaryColor: "#16213e",
    backgroundColor: "#ffffff",
    fontFamily: "Inter, sans-serif",
    titleFontSize: 36,
    bodyFontSize: 18,
  },
  {
    id: "dark",
    name: "Dark",
    primaryColor: "#ffffff",
    secondaryColor: "#a0a0a0",
    backgroundColor: "#1a1a2e",
    fontFamily: "Inter, sans-serif",
    titleFontSize: 36,
    bodyFontSize: 18,
  },
  {
    id: "minimal",
    name: "Minimal",
    primaryColor: "#333333",
    secondaryColor: "#666666",
    backgroundColor: "#fafafa",
    fontFamily: "system-ui, sans-serif",
    titleFontSize: 32,
    bodyFontSize: 16,
  },
  {
    id: "academic",
    name: "Academic",
    primaryColor: "#1e3a5f",
    secondaryColor: "#3d5a80",
    backgroundColor: "#ffffff",
    fontFamily: "Georgia, serif",
    titleFontSize: 34,
    bodyFontSize: 18,
  },
  {
    id: "creative",
    name: "Creative",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    backgroundColor: "#fef3c7",
    fontFamily: "Poppins, sans-serif",
    titleFontSize: 38,
    bodyFontSize: 18,
  },
];

// ============================================================================
// Flashcard Types
// ============================================================================

export type CardType = "qa" | "fill-blank" | "matching" | "multiple-choice";

export interface FlashcardBase {
  id: string;
  deckId: string;
  type: CardType;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  sourcePageNumber?: number;
  sourceText?: string;
}

export interface QACard extends FlashcardBase {
  type: "qa";
  front: string;
  back: string;
}

export interface FillBlankCard extends FlashcardBase {
  type: "fill-blank";
  sentence: string;
  blanks: Array<{
    position: number;
    answer: string;
    alternatives?: string[];
  }>;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingCard extends FlashcardBase {
  type: "matching";
  pairs: MatchingPair[];
  instruction?: string;
}

export interface MultipleChoiceCard extends FlashcardBase {
  type: "multiple-choice";
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export type Flashcard =
  | QACard
  | FillBlankCard
  | MatchingCard
  | MultipleChoiceCard;

// SM-2 Spaced Repetition System Data
export interface SRSData {
  cardId: string;
  easeFactor: number; // Default 2.5, min 1.3
  interval: number; // Days until next review
  repetitions: number; // Consecutive correct answers
  nextReviewDate: number; // Unix timestamp
  lastReviewDate?: number;
  totalReviews: number;
  correctReviews: number;
}

// SM-2 Quality ratings
export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Complete blackout
// 1 - Incorrect, but remembered upon seeing answer
// 2 - Incorrect, but answer seemed easy to recall
// 3 - Correct with serious difficulty
// 4 - Correct with some hesitation
// 5 - Perfect response

export interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
  sourceDocumentId?: string;
  sourceFileName?: string;
  color: string;
  icon: string;
}

export type StudyMode = "learn" | "review" | "practice";

export interface StudySession {
  id: string;
  deckId: string;
  mode: StudyMode;
  startedAt: number;
  completedAt?: number;
  cardsStudied: string[];
  cardsCorrect: string[];
  cardsIncorrect: string[];
}

export interface DeckStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  masteredCards: number;
  averageEaseFactor: number;
  retentionRate: number;
  streakDays: number;
}

// ============================================================================
// Quiz Types
// ============================================================================

export type QuestionType =
  | "multiple-choice"
  | "true-false"
  | "short-answer"
  | "fill-blank";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface QuestionBase {
  id: string;
  quizId: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  topic: string;
  points: number;
  timeLimit?: number; // seconds
  explanation?: string;
  sourcePageNumber?: number;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple-choice";
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: "true-false";
  statement: string;
  correctAnswer: boolean;
}

export interface ShortAnswerQuestion extends QuestionBase {
  type: "short-answer";
  question: string;
  rubric: string; // For AI grading
  sampleAnswer: string;
  keywords?: string[]; // Key terms that should appear
}

export interface FillBlankQuestion extends QuestionBase {
  type: "fill-blank";
  sentence: string;
  blanks: Array<{
    position: number;
    answer: string;
    alternatives?: string[];
  }>;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | FillBlankQuestion;

export interface UserAnswer {
  questionId: string;
  answer: string | number | boolean | string[];
  isCorrect?: boolean;
  aiGradingScore?: number; // 0-100 for short answer
  aiGradingFeedback?: string;
  timeSpent: number; // seconds
  answeredAt: number;
}

export interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanations: boolean;
  showCorrectAnswer: boolean;
  timedMode: boolean;
  totalTimeLimit?: number; // seconds
  perQuestionTimeLimit?: number; // seconds
  adaptiveDifficulty: boolean;
  allowSkip: boolean;
  allowReview: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
  sourceDocumentId?: string;
  sourceFileName?: string;
  settings: QuizSettings;
  passingScore?: number; // percentage
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  startedAt: number;
  completedAt?: number;
  answers: UserAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  currentDifficulty: DifficultyLevel;
  topicProficiency: Record<string, number>; // topic -> proficiency 0-100
  passed?: boolean;
}

export interface QuizStats {
  totalAttempts: number;
  bestScore: number;
  averageScore: number;
  averageTime: number;
  questionAccuracy: Record<string, number>; // questionId -> accuracy %
  topicMastery: Record<string, number>;
  improvementTrend: number[]; // recent scores
}

// ============================================================================
// AI Generation Types
// ============================================================================

export interface PPTGenerationOptions extends GenerationOptions {
  slideCount?: number;
  style?: "academic" | "business" | "minimal" | "creative";
  includeImages?: boolean;
  themeId?: string;
}

export interface FlashcardGenerationOptions extends GenerationOptions {
  cardTypes: CardType[];
  count?: number;
  difficulty?: DifficultyLevel;
  focusTopics?: string[];
}

export interface QuizGenerationOptions extends GenerationOptions {
  questionTypes: QuestionType[];
  count?: number;
  difficulties?: DifficultyLevel[];
  topics?: string[];
  includeExplanations?: boolean;
}

// AI-generated slide content (before conversion to Slide)
export interface GeneratedSlideContent {
  title: string;
  bullets: string[];
  visualSuggestion?: string;
  notes: string;
  layout: SlideLayout;
}

// AI-generated flashcard content (before conversion to Flashcard)
export interface GeneratedFlashcardContent {
  type: CardType;
  content: Omit<Flashcard, "id" | "deckId" | "createdAt" | "updatedAt">;
  confidence?: number;
}

// AI-generated question content (before conversion to Question)
export interface GeneratedQuestionContent {
  type: QuestionType;
  content: Omit<Question, "id" | "quizId">;
  confidence?: number;
}

// ============================================================================
// Export/Import Types
// ============================================================================

export interface LearningExportData {
  version: string;
  exportedAt: number;
  presentations?: Presentation[];
  flashcardDecks?: FlashcardDeck[];
  srsData?: Record<string, SRSData>;
  studySessions?: StudySession[];
  quizzes?: Quiz[];
  quizAttempts?: QuizAttempt[];
}

export type LearningExportScope =
  | "all"
  | "presentations"
  | "flashcards"
  | "quizzes"
  | "study-progress";
