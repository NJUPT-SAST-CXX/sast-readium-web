/**
 * AI Module - All AI-related functionality
 *
 * This module provides:
 * - Core AI services (chat, tools, providers)
 * - AI memory management
 * - AI plan management
 * - AI learning features (flashcards, quizzes, presentations)
 */

// Core AI functionality
export * from "./core";

// AI Memory - re-export with namespace to avoid conflicts
export {
  useAIMemoryStore,
  type AIMemory,
  type MemoryType,
  type MemoryScope,
  type MemorySource,
  type AIMemoryStore,
  type MemoryRetrievalOptions,
  type MemoryRetrievalResult,
  type CreateMemoryParams,
  type MemoryExtractionResult,
  type MemoryStats,
  type MemoryExportData,
} from "./memory";

// AI Plan - re-export with explicit names to avoid conflicts with core
export {
  useAIPlanStore,
  type AIPlan,
  type PlanStep,
  type PlanStatus,
  type PlanStepStatus,
  type PlanProgress,
  type CreatePlanParams as AIPlanCreateParams,
  type UpdatePlanStepParams as AIPlanUpdateStepParams,
  type CreatePlanResult,
  type UpdatePlanStepResult,
  type PlanExecutionOptions,
} from "./plan";

// AI Learning
export * from "./learning";
