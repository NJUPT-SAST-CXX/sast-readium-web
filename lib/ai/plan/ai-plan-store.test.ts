/**
 * Tests for AI Plan Store
 */

import { act } from "@testing-library/react";
import { useAIPlanStore } from "./ai-plan-store";
import type { CreatePlanParams, PlanStep } from "./types";

// Reset store before each test
beforeEach(() => {
  act(() => {
    useAIPlanStore.setState({
      plans: {},
      currentPlanId: null,
      executingPlanId: null,
      planHistory: [],
    });
  });
});

// Helper to create plan params
function createPlanParams(
  goal: string,
  steps: Array<{ description: string; dependsOn?: string[] }> = [],
  overrides: Partial<CreatePlanParams> = {}
): CreatePlanParams {
  return {
    goal,
    steps: steps.length > 0 ? steps : [{ description: "Default step" }],
    title: `Plan: ${goal}`,
    ...overrides,
  };
}

// Helper to create step data
function createStepData(
  description: string,
  overrides: Partial<Omit<PlanStep, "id" | "status">> = {}
): Omit<PlanStep, "id" | "status"> {
  return {
    description,
    order: 0,
    ...overrides,
  };
}

describe("ai-plan-store", () => {
  describe("Plan CRUD Operations", () => {
    it("should create a new plan", () => {
      let planId: string;

      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(
            createPlanParams("Test goal", [
              { description: "Step 1" },
              { description: "Step 2" },
            ]),
            "test.pdf",
            "conv-123"
          );
      });

      const plan = useAIPlanStore.getState().getPlan(planId!);
      expect(plan).not.toBeNull();
      expect(plan?.goal).toBe("Test goal");
      expect(plan?.pdfFileName).toBe("test.pdf");
      expect(plan?.conversationId).toBe("conv-123");
      expect(plan?.status).toBe("draft");
      expect(plan?.steps).toHaveLength(2);
    });

    it("should delete a plan", () => {
      let planId: string;

      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(createPlanParams("To Delete"));
      });

      expect(useAIPlanStore.getState().getPlan(planId!)).not.toBeNull();

      act(() => {
        useAIPlanStore.getState().deletePlan(planId!);
      });

      expect(useAIPlanStore.getState().getPlan(planId!)).toBeNull();
    });

    it("should get all plans", () => {
      act(() => {
        useAIPlanStore.getState().createPlan(createPlanParams("Plan 1"));
        useAIPlanStore.getState().createPlan(createPlanParams("Plan 2"));
        useAIPlanStore.getState().createPlan(createPlanParams("Plan 3"));
      });

      const plans = useAIPlanStore.getState().getAllPlans();
      expect(plans).toHaveLength(3);
    });

    it("should set current plan", () => {
      let planId: string;

      act(() => {
        planId = useAIPlanStore.getState().createPlan(createPlanParams("Test"));
      });

      act(() => {
        useAIPlanStore.getState().setCurrentPlan(planId!);
      });

      expect(useAIPlanStore.getState().currentPlanId).toBe(planId!);

      act(() => {
        useAIPlanStore.getState().setCurrentPlan(null);
      });

      expect(useAIPlanStore.getState().currentPlanId).toBeNull();
    });
  });

  describe("Plan Lifecycle", () => {
    let planId: string;

    beforeEach(() => {
      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(
            createPlanParams("Lifecycle Test", [{ description: "Step 1" }])
          );
      });
    });

    it("should activate a plan", () => {
      act(() => {
        useAIPlanStore.getState().activatePlan(planId);
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.status).toBe("active");
      expect(useAIPlanStore.getState().executingPlanId).toBe(planId);
    });

    it("should pause an active plan", () => {
      act(() => {
        useAIPlanStore.getState().activatePlan(planId);
      });

      act(() => {
        useAIPlanStore.getState().pausePlan(planId);
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.status).toBe("paused");
    });

    it("should cancel a plan", () => {
      act(() => {
        useAIPlanStore.getState().activatePlan(planId);
      });

      act(() => {
        useAIPlanStore.getState().cancelPlan(planId);
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.status).toBe("cancelled");
      expect(useAIPlanStore.getState().executingPlanId).toBeNull();
    });

    it("should complete a plan", () => {
      act(() => {
        useAIPlanStore.getState().activatePlan(planId);
        // Complete all steps first
        const plan = useAIPlanStore.getState().getPlan(planId);
        plan?.steps.forEach((step) => {
          useAIPlanStore
            .getState()
            .updateStepStatus(planId, step.id, "completed");
        });
      });

      act(() => {
        useAIPlanStore
          .getState()
          .completePlan(planId, "Plan completed successfully");
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.status).toBe("completed");
      expect(plan?.completedAt).toBeDefined();
      expect(plan?.summary).toBe("Plan completed successfully");
    });

    it("should not activate completed plan", () => {
      act(() => {
        useAIPlanStore.getState().activatePlan(planId);
        useAIPlanStore.getState().completePlan(planId);
      });

      act(() => {
        useAIPlanStore.getState().activatePlan(planId);
      });

      // Should still be completed
      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.status).toBe("completed");
    });
  });

  describe("Step Management", () => {
    let planId: string;

    beforeEach(() => {
      act(() => {
        // Create plan with empty steps array
        planId = useAIPlanStore
          .getState()
          .createPlan({ goal: "Step Test", steps: [], title: "Step Test" });
      });
    });

    it("should add a step to a plan", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("New Step"));
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.steps).toHaveLength(1);
      expect(plan?.steps[0].id).toBe(stepId!);
      expect(plan?.steps[0].description).toBe("New Step");
    });

    it("should add multiple steps", () => {
      act(() => {
        useAIPlanStore.getState().addStep(planId, createStepData("Step 1"));
        useAIPlanStore.getState().addStep(planId, createStepData("Step 2"));
        useAIPlanStore.getState().addStep(planId, createStepData("Step 3"));
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.steps).toHaveLength(3);
    });

    it("should remove a step", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("To Remove"));
      });

      expect(useAIPlanStore.getState().getPlan(planId)?.steps).toHaveLength(1);

      act(() => {
        useAIPlanStore.getState().removeStep(planId, stepId!);
      });

      expect(useAIPlanStore.getState().getPlan(planId)?.steps).toHaveLength(0);
    });

    it("should update step status", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("Status Test"));
      });

      act(() => {
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepId!, "in_progress");
      });

      let plan = useAIPlanStore.getState().getPlan(planId);
      let step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.status).toBe("in_progress");

      act(() => {
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepId!, "completed", "Done!");
      });

      plan = useAIPlanStore.getState().getPlan(planId);
      step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.status).toBe("completed");
      expect(step?.result).toBe("Done!");
      expect(step?.completedAt).toBeDefined();
    });

    it("should start a step", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("Start Test"));
      });

      act(() => {
        useAIPlanStore.getState().startStep(planId, stepId!);
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      const step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.status).toBe("in_progress");
      expect(step?.startedAt).toBeDefined();
    });

    it("should complete a step", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("Complete Test"));
        useAIPlanStore.getState().startStep(planId, stepId);
      });

      act(() => {
        useAIPlanStore.getState().completeStep(planId, stepId!, "Step result");
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      const step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.status).toBe("completed");
      expect(step?.result).toBe("Step result");
    });

    it("should skip a step", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("Skip Test"));
      });

      act(() => {
        useAIPlanStore.getState().skipStep(planId, stepId!);
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      const step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.status).toBe("skipped");
    });

    it("should fail a step", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("Fail Test"));
        useAIPlanStore.getState().startStep(planId, stepId);
      });

      act(() => {
        useAIPlanStore
          .getState()
          .failStep(planId, stepId!, "Something went wrong");
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      const step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.status).toBe("failed");
      expect(step?.error).toBe("Something went wrong");
    });

    it("should retry a failed step", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("Retry Test"));
        useAIPlanStore.getState().failStep(planId, stepId, "Error");
      });

      act(() => {
        useAIPlanStore.getState().retryStep(planId, stepId!);
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      const step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.status).toBe("pending");
      expect(step?.error).toBeUndefined();
    });

    it("should update step description", () => {
      let stepId: string;

      act(() => {
        stepId = useAIPlanStore
          .getState()
          .addStep(planId, createStepData("Original"));
      });

      act(() => {
        useAIPlanStore
          .getState()
          .updateStepDescription(planId, stepId!, "Updated description");
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      const step = plan?.steps.find((s) => s.id === stepId!);
      expect(step?.description).toBe("Updated description");
    });

    it("should reorder steps", () => {
      const stepIds: string[] = [];

      act(() => {
        stepIds.push(
          useAIPlanStore.getState().addStep(planId, createStepData("Step A"))
        );
        stepIds.push(
          useAIPlanStore.getState().addStep(planId, createStepData("Step B"))
        );
        stepIds.push(
          useAIPlanStore.getState().addStep(planId, createStepData("Step C"))
        );
      });

      // Reverse the order
      act(() => {
        useAIPlanStore
          .getState()
          .reorderSteps(planId, [stepIds[2], stepIds[1], stepIds[0]]);
      });

      const plan = useAIPlanStore.getState().getPlan(planId);
      expect(plan?.steps[0].description).toBe("Step C");
      expect(plan?.steps[1].description).toBe("Step B");
      expect(plan?.steps[2].description).toBe("Step A");
    });
  });

  describe("Step Dependencies", () => {
    let planId: string;
    let stepIds: string[];

    beforeEach(() => {
      stepIds = [];
      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(
            createPlanParams("Dependency Test", [
              { description: "Step 1" },
              { description: "Step 2", dependsOn: [] },
              { description: "Step 3" },
            ])
          );
        // Get step IDs
        const plan = useAIPlanStore.getState().getPlan(planId);
        stepIds = plan?.steps.map((s) => s.id) || [];
      });
    });

    it("should check if step can execute based on dependencies", () => {
      // Step without dependencies can execute
      expect(useAIPlanStore.getState().canExecuteStep(planId, stepIds[0])).toBe(
        true
      );
    });

    it("should block step with incomplete dependencies", () => {
      // Add a step that depends on step 1
      let dependentStepId: string;
      act(() => {
        dependentStepId = useAIPlanStore.getState().addStep(planId, {
          description: "Dependent step",
          order: 3,
          dependsOn: [stepIds[0]],
        });
      });

      // Should not be able to execute until dependency is complete
      expect(
        useAIPlanStore.getState().canExecuteStep(planId, dependentStepId!)
      ).toBe(false);

      // Complete the dependency
      act(() => {
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepIds[0], "completed");
      });

      // Now should be able to execute
      expect(
        useAIPlanStore.getState().canExecuteStep(planId, dependentStepId!)
      ).toBe(true);
    });
  });

  describe("Progress Tracking", () => {
    let planId: string;
    let stepIds: string[];

    beforeEach(() => {
      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(
            createPlanParams("Progress Test", [
              { description: "Step 1" },
              { description: "Step 2" },
              { description: "Step 3" },
              { description: "Step 4" },
            ])
          );
        const plan = useAIPlanStore.getState().getPlan(planId);
        stepIds = plan?.steps.map((s) => s.id) || [];
      });
    });

    it("should calculate plan progress", () => {
      let progress = useAIPlanStore.getState().getPlanProgress(planId);
      expect(progress?.percentComplete).toBe(0);

      act(() => {
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepIds[0], "completed");
      });

      progress = useAIPlanStore.getState().getPlanProgress(planId);
      expect(progress?.percentComplete).toBe(25);

      act(() => {
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepIds[1], "completed");
      });

      progress = useAIPlanStore.getState().getPlanProgress(planId);
      expect(progress?.percentComplete).toBe(50);
    });

    it("should get next pending step", () => {
      act(() => {
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepIds[0], "completed");
      });

      const nextStep = useAIPlanStore.getState().getNextPendingStep(planId);
      expect(nextStep?.id).toBe(stepIds[1]);
    });

    it("should get steps by status", () => {
      act(() => {
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepIds[0], "completed");
        useAIPlanStore
          .getState()
          .updateStepStatus(planId, stepIds[1], "completed");
      });

      const completedSteps = useAIPlanStore
        .getState()
        .getStepsByStatus(planId, "completed");
      expect(completedSteps).toHaveLength(2);

      const pendingSteps = useAIPlanStore
        .getState()
        .getStepsByStatus(planId, "pending");
      expect(pendingSteps).toHaveLength(2);
    });
  });

  describe("Current and Executing Plan", () => {
    it("should get current plan", () => {
      let planId: string;

      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(createPlanParams("Current Test"));
        useAIPlanStore.getState().setCurrentPlan(planId);
      });

      const currentPlan = useAIPlanStore.getState().getCurrentPlan();
      expect(currentPlan?.id).toBe(planId!);
    });

    it("should get executing plan", () => {
      let planId: string;

      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(createPlanParams("Executing Test"));
        useAIPlanStore.getState().activatePlan(planId);
      });

      const executingPlan = useAIPlanStore.getState().getExecutingPlan();
      expect(executingPlan?.id).toBe(planId!);
    });

    it("should return null when no current plan", () => {
      const currentPlan = useAIPlanStore.getState().getCurrentPlan();
      expect(currentPlan).toBeNull();
    });

    it("should return null when no executing plan", () => {
      const executingPlan = useAIPlanStore.getState().getExecutingPlan();
      expect(executingPlan).toBeNull();
    });
  });

  describe("Active Plans", () => {
    it("should get active plans", () => {
      act(() => {
        const id1 = useAIPlanStore
          .getState()
          .createPlan(createPlanParams("Plan 1"));
        const id2 = useAIPlanStore
          .getState()
          .createPlan(createPlanParams("Plan 2"));
        useAIPlanStore.getState().createPlan(createPlanParams("Plan 3"));

        useAIPlanStore.getState().activatePlan(id1);
        useAIPlanStore.getState().completePlan(id2);
      });

      const activePlans = useAIPlanStore.getState().getActivePlans();
      // Should include draft, active, and paused plans (not completed)
      expect(activePlans.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Plan History", () => {
    it("should add completed plans to history", () => {
      let planId: string;

      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(createPlanParams("History Test"));
        useAIPlanStore.getState().activatePlan(planId);
        useAIPlanStore.getState().completePlan(planId);
      });

      expect(useAIPlanStore.getState().planHistory).toHaveLength(1);
      expect(useAIPlanStore.getState().planHistory[0].id).toBe(planId!);
    });

    it("should add cancelled plans to history", () => {
      let planId: string;

      act(() => {
        planId = useAIPlanStore
          .getState()
          .createPlan(createPlanParams("Cancel Test"));
        useAIPlanStore.getState().activatePlan(planId);
        useAIPlanStore.getState().cancelPlan(planId);
      });

      expect(useAIPlanStore.getState().planHistory).toHaveLength(1);
      expect(useAIPlanStore.getState().planHistory[0].status).toBe("cancelled");
    });
  });
});
