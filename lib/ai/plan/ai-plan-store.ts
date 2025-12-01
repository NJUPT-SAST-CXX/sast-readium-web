/**
 * AI Plan Store - Zustand store for managing AI plans
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AIPlan,
  PlanStep,
  PlanStatus,
  PlanStepStatus,
  PlanProgress,
  CreatePlanParams,
} from "./types";

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface AIPlanState {
  // Plans storage
  plans: Record<string, AIPlan>;

  // Current active plan
  currentPlanId: string | null;

  // Plan being executed
  executingPlanId: string | null;

  // History of completed/cancelled plans (limited to 20)
  planHistory: AIPlan[];

  // Actions - Plan Management
  createPlan: (
    params: CreatePlanParams,
    pdfFileName?: string,
    conversationId?: string
  ) => string;
  deletePlan: (planId: string) => void;
  setCurrentPlan: (planId: string | null) => void;

  // Actions - Plan Status
  activatePlan: (planId: string) => void;
  pausePlan: (planId: string) => void;
  cancelPlan: (planId: string) => void;
  completePlan: (planId: string, summary?: string) => void;

  // Actions - Step Management
  updateStepStatus: (
    planId: string,
    stepId: string,
    status: PlanStepStatus,
    result?: string,
    error?: string
  ) => void;
  startStep: (planId: string, stepId: string) => void;
  completeStep: (planId: string, stepId: string, result: string) => void;
  skipStep: (planId: string, stepId: string) => void;
  failStep: (planId: string, stepId: string, error: string) => void;
  retryStep: (planId: string, stepId: string) => void;

  // Actions - Step Modification (for user adjustments)
  addStep: (
    planId: string,
    step: Omit<PlanStep, "id" | "status">,
    afterStepId?: string
  ) => string;
  removeStep: (planId: string, stepId: string) => void;
  updateStepDescription: (
    planId: string,
    stepId: string,
    description: string
  ) => void;
  reorderSteps: (planId: string, stepIds: string[]) => void;

  // Queries
  getPlan: (planId: string) => AIPlan | null;
  getCurrentPlan: () => AIPlan | null;
  getExecutingPlan: () => AIPlan | null;
  getPlanProgress: (planId: string) => PlanProgress | null;
  getNextPendingStep: (planId: string) => PlanStep | null;
  getStepsByStatus: (planId: string, status: PlanStepStatus) => PlanStep[];
  canExecuteStep: (planId: string, stepId: string) => boolean;
  getAllPlans: () => AIPlan[];
  getActivePlans: () => AIPlan[];
}

export const useAIPlanStore = create<AIPlanState>()(
  persist(
    (set, get) => ({
      // Initial state
      plans: {},
      currentPlanId: null,
      executingPlanId: null,
      planHistory: [],

      // Create a new plan
      createPlan: (params, pdfFileName, conversationId) => {
        const planId = generateId("plan");
        const now = Date.now();

        // Create steps with IDs
        const steps: PlanStep[] = params.steps.map((step, index) => ({
          id: generateId("step"),
          order: index,
          description: step.description,
          status: "pending" as PlanStepStatus,
          dependsOn: step.dependsOn,
        }));

        const plan: AIPlan = {
          id: planId,
          title: params.title || `Plan: ${params.goal.slice(0, 50)}`,
          goal: params.goal,
          description: params.description,
          steps,
          status: "draft",
          createdAt: now,
          updatedAt: now,
          pdfFileName,
          conversationId,
        };

        set((state) => ({
          plans: { ...state.plans, [planId]: plan },
          currentPlanId: planId,
        }));

        return planId;
      },

      // Delete a plan
      deletePlan: (planId) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [planId]: _, ...rest } = state.plans;
          return {
            plans: rest,
            currentPlanId:
              state.currentPlanId === planId ? null : state.currentPlanId,
            executingPlanId:
              state.executingPlanId === planId ? null : state.executingPlanId,
          };
        });
      },

      // Set current plan
      setCurrentPlan: (planId) => {
        set({ currentPlanId: planId });
      },

      // Activate a plan (start execution)
      activatePlan: (planId) => {
        set((state) => {
          const plan = state.plans[planId];
          if (
            !plan ||
            plan.status === "completed" ||
            plan.status === "cancelled"
          ) {
            return state;
          }
          return {
            plans: {
              ...state.plans,
              [planId]: {
                ...plan,
                status: "active",
                updatedAt: Date.now(),
              },
            },
            executingPlanId: planId,
          };
        });
      },

      // Pause a plan
      pausePlan: (planId) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan || plan.status !== "active") {
            return state;
          }
          return {
            plans: {
              ...state.plans,
              [planId]: {
                ...plan,
                status: "paused",
                updatedAt: Date.now(),
              },
            },
            executingPlanId:
              state.executingPlanId === planId ? null : state.executingPlanId,
          };
        });
      },

      // Cancel a plan
      cancelPlan: (planId) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) return state;

          const cancelledPlan: AIPlan = {
            ...plan,
            status: "cancelled",
            updatedAt: Date.now(),
          };

          return {
            plans: {
              ...state.plans,
              [planId]: cancelledPlan,
            },
            executingPlanId:
              state.executingPlanId === planId ? null : state.executingPlanId,
            planHistory: [cancelledPlan, ...state.planHistory].slice(0, 20),
          };
        });
      },

      // Complete a plan
      completePlan: (planId, summary) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) return state;

          const completedPlan: AIPlan = {
            ...plan,
            status: "completed",
            updatedAt: Date.now(),
            completedAt: Date.now(),
            totalDuration: Date.now() - plan.createdAt,
            summary,
          };

          return {
            plans: {
              ...state.plans,
              [planId]: completedPlan,
            },
            executingPlanId:
              state.executingPlanId === planId ? null : state.executingPlanId,
            planHistory: [completedPlan, ...state.planHistory].slice(0, 20),
          };
        });
      },

      // Update step status
      updateStepStatus: (planId, stepId, status, result, error) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) return state;

          const now = Date.now();
          const steps = plan.steps.map((step) => {
            if (step.id !== stepId) return step;
            return {
              ...step,
              status,
              result: result ?? step.result,
              error: error ?? step.error,
              completedAt: ["completed", "skipped", "failed"].includes(status)
                ? now
                : step.completedAt,
              duration: step.startedAt ? now - step.startedAt : step.duration,
            };
          });

          // Check if all steps are done
          const allDone = steps.every((s) =>
            ["completed", "skipped"].includes(s.status)
          );
          const hasFailed = steps.some((s) => s.status === "failed");

          return {
            plans: {
              ...state.plans,
              [planId]: {
                ...plan,
                steps,
                status: allDone
                  ? "completed"
                  : hasFailed
                    ? plan.status
                    : plan.status,
                updatedAt: now,
                completedAt: allDone ? now : plan.completedAt,
              },
            },
          };
        });
      },

      // Start a step
      startStep: (planId, stepId) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) return state;

          const steps = plan.steps.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "in_progress" as PlanStepStatus,
                  startedAt: Date.now(),
                }
              : step
          );

          return {
            plans: {
              ...state.plans,
              [planId]: { ...plan, steps, updatedAt: Date.now() },
            },
          };
        });
      },

      // Complete a step
      completeStep: (planId, stepId, result) => {
        get().updateStepStatus(planId, stepId, "completed", result);
      },

      // Skip a step
      skipStep: (planId, stepId) => {
        get().updateStepStatus(planId, stepId, "skipped");
      },

      // Fail a step
      failStep: (planId, stepId, error) => {
        get().updateStepStatus(planId, stepId, "failed", undefined, error);
      },

      // Retry a failed step
      retryStep: (planId, stepId) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) return state;

          const steps = plan.steps.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "pending" as PlanStepStatus,
                  error: undefined,
                  startedAt: undefined,
                  completedAt: undefined,
                }
              : step
          );

          return {
            plans: {
              ...state.plans,
              [planId]: { ...plan, steps, updatedAt: Date.now() },
            },
          };
        });
      },

      // Add a new step to a plan
      addStep: (planId, stepData, afterStepId) => {
        const stepId = generateId("step");

        set((state) => {
          const plan = state.plans[planId];
          if (
            !plan ||
            plan.status === "completed" ||
            plan.status === "cancelled"
          ) {
            return state;
          }

          let steps = [...plan.steps];
          const newStep: PlanStep = {
            ...stepData,
            id: stepId,
            status: "pending",
            order: steps.length,
          };

          if (afterStepId) {
            const index = steps.findIndex((s) => s.id === afterStepId);
            if (index !== -1) {
              steps.splice(index + 1, 0, newStep);
            } else {
              steps.push(newStep);
            }
          } else {
            steps.push(newStep);
          }

          // Reorder
          steps = steps.map((s, i) => ({ ...s, order: i }));

          return {
            plans: {
              ...state.plans,
              [planId]: { ...plan, steps, updatedAt: Date.now() },
            },
          };
        });

        return stepId;
      },

      // Remove a step from a plan
      removeStep: (planId, stepId) => {
        set((state) => {
          const plan = state.plans[planId];
          if (
            !plan ||
            plan.status === "completed" ||
            plan.status === "cancelled"
          ) {
            return state;
          }

          let steps = plan.steps.filter((s) => s.id !== stepId);
          steps = steps.map((s, i) => ({ ...s, order: i }));

          // Remove dependencies on deleted step
          steps = steps.map((s) => ({
            ...s,
            dependsOn: s.dependsOn?.filter((id) => id !== stepId),
          }));

          return {
            plans: {
              ...state.plans,
              [planId]: { ...plan, steps, updatedAt: Date.now() },
            },
          };
        });
      },

      // Update step description
      updateStepDescription: (planId, stepId, description) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) return state;

          const steps = plan.steps.map((step) =>
            step.id === stepId ? { ...step, description } : step
          );

          return {
            plans: {
              ...state.plans,
              [planId]: { ...plan, steps, updatedAt: Date.now() },
            },
          };
        });
      },

      // Reorder steps
      reorderSteps: (planId, stepIds) => {
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) return state;

          const stepMap = new Map(plan.steps.map((s) => [s.id, s]));
          const steps = stepIds
            .map((id, index) => {
              const step = stepMap.get(id);
              return step ? { ...step, order: index } : null;
            })
            .filter((s): s is PlanStep => s !== null);

          return {
            plans: {
              ...state.plans,
              [planId]: { ...plan, steps, updatedAt: Date.now() },
            },
          };
        });
      },

      // Get a plan by ID
      getPlan: (planId) => {
        return get().plans[planId] || null;
      },

      // Get current plan
      getCurrentPlan: () => {
        const { currentPlanId, plans } = get();
        return currentPlanId ? plans[currentPlanId] || null : null;
      },

      // Get executing plan
      getExecutingPlan: () => {
        const { executingPlanId, plans } = get();
        return executingPlanId ? plans[executingPlanId] || null : null;
      },

      // Get plan progress
      getPlanProgress: (planId) => {
        const plan = get().plans[planId];
        if (!plan) return null;

        const totalSteps = plan.steps.length;
        const completedSteps = plan.steps.filter(
          (s) => s.status === "completed" || s.status === "skipped"
        ).length;
        const currentStepIndex = plan.steps.findIndex(
          (s) => s.status === "in_progress"
        );

        return {
          planId,
          totalSteps,
          completedSteps,
          currentStepIndex,
          percentComplete:
            totalSteps > 0
              ? Math.round((completedSteps / totalSteps) * 100)
              : 0,
          status: plan.status,
        };
      },

      // Get next pending step
      getNextPendingStep: (planId) => {
        const plan = get().plans[planId];
        if (!plan) return null;

        return (
          plan.steps
            .filter((s) => s.status === "pending")
            .sort((a, b) => a.order - b.order)
            .find((step) => get().canExecuteStep(planId, step.id)) || null
        );
      },

      // Get steps by status
      getStepsByStatus: (planId, status) => {
        const plan = get().plans[planId];
        if (!plan) return [];
        return plan.steps.filter((s) => s.status === status);
      },

      // Check if a step can be executed (dependencies met)
      canExecuteStep: (planId, stepId) => {
        const plan = get().plans[planId];
        if (!plan) return false;

        const step = plan.steps.find((s) => s.id === stepId);
        if (!step || step.status !== "pending") return false;

        // Check dependencies
        if (step.dependsOn && step.dependsOn.length > 0) {
          const dependencyMet = step.dependsOn.every((depId) => {
            const depStep = plan.steps.find((s) => s.id === depId);
            return (
              depStep &&
              (depStep.status === "completed" || depStep.status === "skipped")
            );
          });
          return dependencyMet;
        }

        return true;
      },

      // Get all plans
      getAllPlans: () => {
        return Object.values(get().plans).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
      },

      // Get active plans
      getActivePlans: () => {
        return Object.values(get().plans)
          .filter(
            (p) =>
              p.status === "active" ||
              p.status === "draft" ||
              p.status === "paused"
          )
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },
    }),
    {
      name: "ai-plan-storage",
      partialize: (state) => ({
        plans: state.plans,
        currentPlanId: state.currentPlanId,
        planHistory: state.planHistory,
      }),
    }
  )
);
