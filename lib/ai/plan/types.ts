/**
 * AI Plan Types - Data structures for AI planning functionality
 */

import type { SimpleToolInvocation } from "../core/ai-service";

// Plan step status
export type PlanStepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "failed";

// Plan status
export type PlanStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

/**
 * A single step in an AI plan
 */
export interface PlanStep {
  id: string;
  order: number;
  description: string;
  status: PlanStepStatus;
  /** IDs of steps that must complete before this one */
  dependsOn?: string[];
  /** Result/output of executing this step */
  result?: string;
  /** Tool invocations made during this step */
  toolCalls?: SimpleToolInvocation[];
  /** When the step started executing */
  startedAt?: number;
  /** When the step completed */
  completedAt?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Error message if step failed */
  error?: string;
  /** Optional AI reasoning for this step */
  reasoning?: string;
}

/**
 * An AI-generated plan for completing a complex task
 */
export interface AIPlan {
  id: string;
  /** Short title for the plan */
  title: string;
  /** The goal this plan aims to achieve */
  goal: string;
  /** Optional detailed description */
  description?: string;
  /** The steps to complete the plan */
  steps: PlanStep[];
  /** Current status of the plan */
  status: PlanStatus;
  /** When the plan was created */
  createdAt: number;
  /** When the plan was last updated */
  updatedAt: number;
  /** When the plan was completed (if completed) */
  completedAt?: number;
  /** Total duration to complete the plan */
  totalDuration?: number;
  /** Associated PDF file name */
  pdfFileName?: string;
  /** Conversation ID that created this plan */
  conversationId?: string;
  /** Message ID where plan was proposed */
  messageId?: string;
  /** Final summary report after completion */
  summary?: string;
  /** Error message if plan failed */
  error?: string;
}

/**
 * Parameters for creating a new plan via AI tool
 */
export interface CreatePlanParams {
  goal: string;
  steps: Array<{
    description: string;
    dependsOn?: string[];
  }>;
  title?: string;
  description?: string;
}

/**
 * Parameters for updating a plan step
 */
export interface UpdatePlanStepParams {
  planId: string;
  stepId: string;
  status: "completed" | "skipped" | "failed";
  result?: string;
  error?: string;
}

/**
 * Result from the createPlan AI tool
 */
export interface CreatePlanResult {
  planId: string;
  status: "draft";
  message: string;
  plan: {
    title: string;
    goal: string;
    description?: string;
    steps: Array<{
      id: string;
      order: number;
      description: string;
      dependsOn?: string[];
    }>;
  };
}

/**
 * Result from the updatePlanStep AI tool
 */
export interface UpdatePlanStepResult {
  success: boolean;
  planId: string;
  stepId: string;
  newStatus: PlanStepStatus;
  nextSteps?: string[];
  isComplete?: boolean;
  message: string;
}

/**
 * Options for executing a plan
 */
export interface PlanExecutionOptions {
  /** Whether to auto-advance to next step after completion */
  autoAdvance?: boolean;
  /** Maximum time per step in milliseconds */
  stepTimeout?: number;
  /** Whether to skip failed steps and continue */
  continueOnError?: boolean;
}

/**
 * Progress information for a plan
 */
export interface PlanProgress {
  planId: string;
  totalSteps: number;
  completedSteps: number;
  currentStepIndex: number;
  percentComplete: number;
  estimatedRemainingTime?: number;
  status: PlanStatus;
}
