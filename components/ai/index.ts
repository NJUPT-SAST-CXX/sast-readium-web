/**
 * AI Components - Public Exports
 *
 * This module exports all AI-related components organized by feature:
 * - chat: Chat panel and history
 * - elements: Reusable AI UI elements (messages, prompts, etc.)
 * - learning: Learning features (flashcards, quizzes, PPT)
 * - settings: AI settings panel
 * - sidebar: Main AI sidebar container
 * - tools: AI tools panel and utilities
 */

// Sidebar
export { AISidebar } from "./sidebar";

// Chat
export { AIChatPanel, AIHistoryPanel } from "./chat";

// Settings
export { AISettingsPanel } from "./settings";

// Tools
export {
  AIToolsPanel,
  AIChartInsight,
  AIReportGenerator,
  MCPToolSelector,
  ResearchPanel,
} from "./tools";

// Learning
export {
  LearningTab,
  FlashcardStudySession,
  FlashcardDeckList,
  QuizSession,
  QuizResults,
  SlideEditor,
  PresentationList,
  SlidePanel,
} from "./learning";

// Elements - Re-export commonly used elements
export * from "./elements";
