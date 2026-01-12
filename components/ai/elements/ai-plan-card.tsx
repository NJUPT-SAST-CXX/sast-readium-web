"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AIPlan, PlanStep, PlanStepStatus } from "@/lib/ai/plan";
import {
  CheckCircle2Icon,
  CircleIcon,
  ClipboardListIcon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  SkipForwardIcon,
  SparklesIcon,
  XCircleIcon,
  XIcon,
  RotateCcwIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

export interface AIPlanCardProps extends Omit<
  ComponentProps<"div">,
  "onPause" | "onCancel"
> {
  /** The plan to display */
  plan: AIPlan;
  /** Whether the card is in compact mode */
  compact?: boolean;
  /** Called when user confirms/activates the plan */
  onActivate?: (planId: string) => void;
  /** Called when user pauses the plan */
  onPausePlan?: (planId: string) => void;
  /** Called when user cancels the plan */
  onCancelPlan?: (planId: string) => void;
  /** Called when user wants to execute the next step */
  onExecuteStep?: (planId: string, stepId: string) => void;
  /** Called when user wants to skip a step */
  onSkipStep?: (planId: string, stepId: string) => void;
  /** Called when user wants to retry a failed step */
  onRetryStep?: (planId: string, stepId: string) => void;
}

const STEP_STATUS_CONFIG: Record<
  PlanStepStatus,
  {
    icon: typeof CheckCircle2Icon;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    icon: CircleIcon,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  in_progress: {
    icon: Loader2Icon,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  completed: {
    icon: CheckCircle2Icon,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  skipped: {
    icon: SkipForwardIcon,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  failed: {
    icon: XCircleIcon,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

function PlanStepItem({
  step,
  isExecutable,
  onExecute,
  onSkip,
  onRetry,
}: {
  step: PlanStep;
  isExecutable: boolean;
  onExecute?: () => void;
  onSkip?: () => void;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const config = STEP_STATUS_CONFIG[step.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 transition-colors",
        config.bgColor
      )}
    >
      <div className={cn("mt-0.5 shrink-0", config.color)}>
        <Icon
          className={cn(
            "size-5",
            step.status === "in_progress" && "animate-spin"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{step.description}</p>

        {step.result && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {step.result}
          </p>
        )}

        {step.error && (
          <p className="mt-1 text-xs text-red-600 line-clamp-2">{step.error}</p>
        )}

        {step.duration && step.status === "completed" && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("ai.plan.duration", "Duration")}:{" "}
            {Math.round(step.duration / 1000)}s
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        {step.status === "pending" && isExecutable && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onExecute}
              title={t("ai.plan.executeStep", "Execute step")}
            >
              <PlayIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onSkip}
              title={t("ai.plan.skipStep", "Skip step")}
            >
              <SkipForwardIcon className="size-4" />
            </Button>
          </>
        )}

        {step.status === "failed" && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onRetry}
            title={t("ai.plan.retryStep", "Retry step")}
          >
            <RotateCcwIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AIPlanCard({
  className,
  plan,
  compact = false,
  onActivate,
  onPausePlan,
  onCancelPlan,
  onExecuteStep,
  onSkipStep,
  onRetryStep,
  ...props
}: AIPlanCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(!compact);

  const completedSteps = plan.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;
  const progress = Math.round((completedSteps / plan.steps.length) * 100);

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: {
        label: t("ai.plan.status.draft", "Draft"),
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      active: {
        label: t("ai.plan.status.active", "Active"),
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      paused: {
        label: t("ai.plan.status.paused", "Paused"),
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      completed: {
        label: t("ai.plan.status.completed", "Completed"),
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      cancelled: {
        label: t("ai.plan.status.cancelled", "Cancelled"),
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
    };

    const config = statusConfig[plan.status];
    return (
      <Badge variant="outline" className={cn("text-xs", config.className)}>
        {config.label}
      </Badge>
    );
  };

  // Find the next executable step
  const nextExecutableStep = plan.steps.find((step) => {
    if (step.status !== "pending") return false;
    if (!step.dependsOn || step.dependsOn.length === 0) return true;
    return step.dependsOn.every((depId) => {
      const depStep = plan.steps.find((s) => s.id === depId);
      return (
        depStep &&
        (depStep.status === "completed" || depStep.status === "skipped")
      );
    });
  });

  return (
    <Card
      className={cn(
        "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20",
        className
      )}
      {...props}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-purple-600" />
            <ClipboardListIcon className="size-4 text-purple-600" />
            <span className="font-medium text-sm">{plan.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedSteps}/{plan.steps.length}{" "}
              {t("ai.plan.stepsCompleted", "steps completed")}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pb-3">
          {/* Goal */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t("ai.plan.goal", "Goal")}:
            </p>
            <p className="text-sm">{plan.goal}</p>
          </div>

          {plan.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t("ai.plan.description", "Description")}:
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.description}
              </p>
            </div>
          )}

          {/* Steps list */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("ai.plan.steps", "Steps")}:
            </p>
            <div className="space-y-2">
              {plan.steps.map((step) => (
                <PlanStepItem
                  key={step.id}
                  step={step}
                  isExecutable={
                    plan.status === "active" &&
                    nextExecutableStep?.id === step.id
                  }
                  onExecute={() => onExecuteStep?.(plan.id, step.id)}
                  onSkip={() => onSkipStep?.(plan.id, step.id)}
                  onRetry={() => onRetryStep?.(plan.id, step.id)}
                />
              ))}
            </div>
          </div>

          {/* Summary if completed */}
          {plan.summary && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t("ai.plan.summary", "Summary")}:
              </p>
              <p className="text-sm">{plan.summary}</p>
            </div>
          )}
        </CardContent>
      )}

      {/* Action buttons */}
      {(plan.status === "draft" ||
        plan.status === "active" ||
        plan.status === "paused") && (
        <CardFooter className="flex justify-end gap-2 border-t pt-3">
          {plan.status === "draft" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelPlan?.(plan.id)}
                className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XIcon className="size-3" />
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onActivate?.(plan.id)}
                className="gap-1 bg-purple-600 hover:bg-purple-700"
              >
                <PlayIcon className="size-3" />
                {t("ai.plan.startPlan", "Start Plan")}
              </Button>
            </>
          )}

          {plan.status === "active" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelPlan?.(plan.id)}
                className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XIcon className="size-3" />
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPausePlan?.(plan.id)}
                className="gap-1"
              >
                <PauseIcon className="size-3" />
                {t("ai.plan.pausePlan", "Pause")}
              </Button>
            </>
          )}

          {plan.status === "paused" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelPlan?.(plan.id)}
                className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XIcon className="size-3" />
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onActivate?.(plan.id)}
                className="gap-1 bg-purple-600 hover:bg-purple-700"
              >
                <PlayIcon className="size-3" />
                {t("ai.plan.resumePlan", "Resume")}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact plan suggestion component for showing in chat messages
 */
export interface AIPlanSuggestionProps extends ComponentProps<"div"> {
  title: string;
  goal: string;
  stepsCount: number;
  onAccept?: () => void;
  onReject?: () => void;
}

export function AIPlanSuggestion({
  className,
  title,
  goal,
  stepsCount,
  onAccept,
  onReject,
  ...props
}: AIPlanSuggestionProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20",
        className
      )}
      {...props}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-purple-600" />
          <ClipboardListIcon className="size-4 text-purple-600" />
          <span className="font-medium text-sm">
            {t("ai.plan.suggestion", "AI Plan Suggestion")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{goal}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {stepsCount} {t("ai.plan.steps", "steps")}
        </Badge>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <XIcon className="size-3" />
          {t("common.reject", "Reject")}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onAccept}
          className="gap-1 bg-purple-600 hover:bg-purple-700"
        >
          <CheckCircle2Icon className="size-3" />
          {t("common.accept", "Accept")}
        </Button>
      </CardFooter>
    </Card>
  );
}
