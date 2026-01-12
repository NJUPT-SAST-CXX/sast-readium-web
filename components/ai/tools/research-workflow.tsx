"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAIChatStore,
  type ResearchWorkflow,
  type ResearchStep,
  type ResearchStepStatus,
} from "@/lib/ai/core";
import { useDeepResearch } from "@/hooks/use-deep-research";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTrigger,
  PlanAction,
} from "@/components/ai/elements/plan";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai/elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai/elements/chain-of-thought";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai/elements/tool";
import {
  Search,
  FileSearch,
  Brain,
  Lightbulb,
  CheckCircle,
  ShieldCheck,
  FileText,
  Loader2,
  XCircle,
  Clock,
  Play,
  Square,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Step type to icon mapping
const STEP_ICONS: Record<string, React.ReactNode> = {
  plan: <Lightbulb className="h-4 w-4" />,
  search: <Search className="h-4 w-4" />,
  read: <FileSearch className="h-4 w-4" />,
  analyze: <Brain className="h-4 w-4" />,
  synthesize: <Sparkles className="h-4 w-4" />,
  verify: <ShieldCheck className="h-4 w-4" />,
  report: <FileText className="h-4 w-4" />,
};

// Status badge component
function StatusBadge({ status }: { status: ResearchStepStatus }) {
  const { t } = useTranslation();
  const variants: Record<
    ResearchStepStatus,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: React.ReactNode;
    }
  > = {
    pending: { variant: "outline", icon: <Clock className="h-3 w-3" /> },
    running: {
      variant: "default",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    complete: {
      variant: "secondary",
      icon: <CheckCircle className="h-3 w-3 text-green-500" />,
    },
    error: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    skipped: {
      variant: "outline",
      icon: <Clock className="h-3 w-3 text-muted-foreground" />,
    },
  };

  const { variant, icon } = variants[status];

  return (
    <Badge variant={variant} className="gap-1 text-xs">
      {icon}
      {t(`ai.step_${status}`)}
    </Badge>
  );
}

// Research step card component
function ResearchStepCard({
  step,
  isActive,
}: {
  step: ResearchStep;
  isActive: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isActive && "ring-2 ring-primary/50 shadow-lg",
        step.status === "complete" && "opacity-80"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-1.5 rounded-md",
                step.status === "running"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted"
              )}
            >
              {STEP_ICONS[step.type] || <Brain className="h-4 w-4" />}
            </div>
            <CardTitle className="text-sm font-medium">{step.title}</CardTitle>
          </div>
          <StatusBadge status={step.status} />
        </div>
        {step.description && (
          <CardDescription className="text-xs">
            {step.description}
          </CardDescription>
        )}
      </CardHeader>

      {(step.reasoning || step.result || step.toolCalls) && (
        <CardContent className="pt-0">
          {/* Chain of Thought / Reasoning */}
          {step.reasoning && step.status !== "pending" && (
            <ChainOfThought defaultOpen={isActive}>
              <ChainOfThoughtHeader>
                {t("ai.reasoning_process")}
              </ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                <ChainOfThoughtStep
                  label={step.title}
                  status={
                    step.status === "complete"
                      ? "complete"
                      : step.status === "running"
                        ? "active"
                        : "pending"
                  }
                >
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {step.reasoning}
                  </div>
                </ChainOfThoughtStep>
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {/* Tool Calls */}
          {step.toolCalls && step.toolCalls.length > 0 && (
            <div className="mt-2 space-y-2">
              {step.toolCalls.map((toolCall) => {
                // Map SimpleToolInvocation state to ToolState
                const toolState =
                  toolCall.state === "result"
                    ? ("output-available" as const)
                    : toolCall.state === "error"
                      ? ("output-error" as const)
                      : ("input-available" as const);
                return (
                  <Tool key={toolCall.toolCallId} defaultOpen={false}>
                    <ToolHeader
                      title={toolCall.toolName}
                      type={`tool-${toolCall.toolName}`}
                      state={toolState}
                    />
                    <ToolContent>
                      <ToolInput input={toolCall.input} />
                      <ToolOutput
                        output={toolCall.output}
                        errorText={undefined}
                      />
                    </ToolContent>
                  </Tool>
                );
              })}
            </div>
          )}

          {/* Duration */}
          {step.duration && (
            <div className="mt-2 text-xs text-muted-foreground">
              {t("ai.duration")}: {(step.duration / 1000).toFixed(1)}s
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Main workflow display component
interface ResearchWorkflowDisplayProps {
  workflow: ResearchWorkflow;
  onCancel?: () => void;
  onClear?: () => void;
}

export function ResearchWorkflowDisplay({
  workflow,
  onCancel,
  onClear,
}: ResearchWorkflowDisplayProps) {
  const { t } = useTranslation();
  const progress = Math.round(
    (workflow.steps.filter((s) => s.status === "complete").length /
      Math.max(workflow.steps.length, 1)) *
      100
  );

  const isRunning =
    workflow.status === "planning" ||
    workflow.status === "researching" ||
    workflow.status === "synthesizing";
  const isComplete = workflow.status === "complete";
  const isError = workflow.status === "error";

  return (
    <div className="space-y-4">
      {/* Header with plan */}
      <Plan defaultOpen={true} isStreaming={isRunning}>
        <PlanHeader className="pb-2">
          <div className="flex-1">
            <PlanTitle>{t("ai.deep_research")}</PlanTitle>
            <PlanDescription>{workflow.query}</PlanDescription>
          </div>
          <div className="flex items-center gap-2">
            <PlanAction>
              <PlanTrigger />
            </PlanAction>
          </div>
        </PlanHeader>

        <PlanContent>
          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {t("ai.research_progress")}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Research Plan */}
          {workflow.plan && (
            <Reasoning
              isStreaming={isRunning && !workflow.plan}
              defaultOpen={false}
            >
              <ReasoningTrigger />
              <ReasoningContent>{workflow.plan}</ReasoningContent>
            </Reasoning>
          )}

          {/* Steps */}
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3 mt-4">
              {workflow.steps.map((step, index) => (
                <ResearchStepCard
                  key={step.id}
                  step={step}
                  isActive={index === workflow.currentStepIndex}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Final Report */}
          {isComplete && workflow.finalReport && (
            <Card className="mt-4 bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("ai.research_report")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm">
                    {workflow.finalReport}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {isError && workflow.error && (
            <Card className="mt-4 bg-destructive/10 border-destructive/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{workflow.error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            {isRunning && onCancel && (
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <Square className="h-4 w-4 mr-1" />
                {t("ai.cancel_research")}
              </Button>
            )}
            {(isComplete || isError) && onClear && (
              <Button variant="outline" size="sm" onClick={onClear}>
                <RotateCcw className="h-4 w-4 mr-1" />
                {t("ai.new_research")}
              </Button>
            )}
          </div>
        </PlanContent>
      </Plan>
    </div>
  );
}

// Research input component
interface ResearchInputProps {
  onStart: (query: string) => void;
  disabled?: boolean;
}

export function ResearchInput({ onStart, disabled }: ResearchInputProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onStart(query.trim());
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("ai.research_question")}
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ai.research_placeholder")}
          className="w-full min-h-[80px] p-3 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={disabled}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={disabled || !query.trim()}
      >
        {disabled ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("ai.researching")}
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            {t("ai.start_research")}
          </>
        )}
      </Button>
    </form>
  );
}

// Main research panel component
export function ResearchPanel() {
  const { t } = useTranslation();
  const { currentResearch } = useAIChatStore();
  const { isResearching, startResearch, cancelResearch, clearResearch } =
    useDeepResearch();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {t("ai.deep_research")}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("ai.deep_research_description")}
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {currentResearch ? (
          <ResearchWorkflowDisplay
            workflow={currentResearch}
            onCancel={cancelResearch}
            onClear={clearResearch}
          />
        ) : (
          <div className="space-y-4">
            {/* Research Input */}
            <ResearchInput onStart={startResearch} disabled={isResearching} />

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  {t("ai.research_tips")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• {t("ai.research_tip_1")}</p>
                <p>• {t("ai.research_tip_2")}</p>
                <p>• {t("ai.research_tip_3")}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
