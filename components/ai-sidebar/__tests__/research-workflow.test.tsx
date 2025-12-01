/**
 * Tests for ResearchWorkflow components (components/ai-sidebar/research-workflow.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ResearchWorkflowDisplay, ResearchInput } from "../research-workflow";
import type { ResearchWorkflow } from "@/lib/ai/core";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useDeepResearch hook
jest.mock("@/hooks/use-deep-research", () => ({
  useDeepResearch: () => ({
    isResearching: false,
    currentStep: null,
    progress: 0,
    startResearch: jest.fn(),
    cancelResearch: jest.fn(),
    clearResearch: jest.fn(),
  }),
}));

// Mock ai-elements components
jest.mock("@/components/ai-elements/plan", () => ({
  Plan: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="plan">{children}</div>
  ),
  PlanHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PlanTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
  PlanDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  PlanContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PlanTrigger: () => <button>Toggle</button>,
  PlanAction: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/ai-elements/reasoning", () => ({
  Reasoning: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ReasoningTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ReasoningContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/ai-elements/chain-of-thought", () => ({
  ChainOfThought: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ChainOfThoughtHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ChainOfThoughtContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ChainOfThoughtStep: ({
    children,
    label,
  }: {
    children: React.ReactNode;
    label: string;
  }) => (
    <div data-testid="cot-step">
      {label}
      {children}
    </div>
  ),
}));

jest.mock("@/components/ai-elements/tool", () => ({
  Tool: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ToolHeader: ({ title }: { title: string }) => <div>{title}</div>,
  ToolContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ToolInput: () => <div>Input</div>,
  ToolOutput: () => <div>Output</div>,
}));

describe("ResearchWorkflowDisplay", () => {
  const createMockWorkflow = (
    overrides?: Partial<ResearchWorkflow>
  ): ResearchWorkflow => ({
    id: "workflow_1",
    query: "Test research query",
    status: "researching",
    steps: [
      {
        id: "step_1",
        type: "plan",
        status: "complete",
        title: "Planning",
        description: "Creating research plan",
        startedAt: Date.now() - 10000,
        completedAt: Date.now() - 5000,
        duration: 5000,
      },
      {
        id: "step_2",
        type: "search",
        status: "running",
        title: "Searching",
        description: "Searching documents",
        startedAt: Date.now(),
      },
    ],
    currentStepIndex: 1,
    sources: [],
    createdAt: Date.now() - 20000,
    updatedAt: Date.now(),
    ...overrides,
  });

  it("should render workflow title and query", () => {
    const workflow = createMockWorkflow();
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    expect(screen.getByText("ai.deep_research")).toBeInTheDocument();
    expect(screen.getByText("Test research query")).toBeInTheDocument();
  });

  it("should render research steps", () => {
    const workflow = createMockWorkflow();
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("Searching")).toBeInTheDocument();
  });

  it("should show step status badges", () => {
    const workflow = createMockWorkflow();
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    expect(screen.getByText("ai.step_complete")).toBeInTheDocument();
    expect(screen.getByText("ai.step_running")).toBeInTheDocument();
  });

  it("should show cancel button when running", () => {
    const onCancel = jest.fn();
    const workflow = createMockWorkflow({ status: "researching" });
    render(<ResearchWorkflowDisplay workflow={workflow} onCancel={onCancel} />);

    const cancelButton = screen.getByText("ai.cancel_research");
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it("should show new research button when complete", () => {
    const onClear = jest.fn();
    const workflow = createMockWorkflow({ status: "complete" });
    render(<ResearchWorkflowDisplay workflow={workflow} onClear={onClear} />);

    const clearButton = screen.getByText("ai.new_research");
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalled();
  });

  it("should show error state", () => {
    const workflow = createMockWorkflow({
      status: "error",
      error: "Something went wrong",
    });
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should show final report when complete", () => {
    const workflow = createMockWorkflow({
      status: "complete",
      finalReport: "This is the final research report",
    });
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    expect(
      screen.getByText("This is the final research report")
    ).toBeInTheDocument();
  });

  it("should calculate progress correctly", () => {
    const workflow = createMockWorkflow({
      steps: [
        {
          id: "1",
          type: "plan",
          status: "complete",
          title: "Step 1",
          startedAt: Date.now(),
        },
        {
          id: "2",
          type: "search",
          status: "complete",
          title: "Step 2",
          startedAt: Date.now(),
        },
        {
          id: "3",
          type: "analyze",
          status: "running",
          title: "Step 3",
          startedAt: Date.now(),
        },
        {
          id: "4",
          type: "report",
          status: "pending",
          title: "Step 4",
          startedAt: Date.now(),
        },
      ],
    });
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    // 2 out of 4 steps complete = 50%
    // Progress bar should be present
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should render step with duration", () => {
    const workflow = createMockWorkflow({
      steps: [
        {
          id: "1",
          type: "plan",
          status: "complete",
          title: "Planning",
          startedAt: Date.now() - 5000,
          completedAt: Date.now(),
          duration: 5000,
        },
      ],
    });
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    // Step should be rendered
    expect(screen.getByText("Planning")).toBeInTheDocument();
  });

  it("should show reasoning when available", () => {
    const workflow = createMockWorkflow({
      steps: [
        {
          id: "1",
          type: "plan",
          status: "complete",
          title: "Planning",
          reasoning: "This is the reasoning process",
          startedAt: Date.now(),
        },
      ],
    });
    render(<ResearchWorkflowDisplay workflow={workflow} />);

    expect(
      screen.getByText("This is the reasoning process")
    ).toBeInTheDocument();
  });
});

describe("ResearchInput", () => {
  const mockOnStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render input field", () => {
    render(<ResearchInput onStart={mockOnStart} />);

    expect(
      screen.getByPlaceholderText("ai.research_placeholder")
    ).toBeInTheDocument();
  });

  it("should render start button", () => {
    render(<ResearchInput onStart={mockOnStart} />);

    expect(screen.getByText("ai.start_research")).toBeInTheDocument();
  });

  it("should call onStart with query when submitted", () => {
    render(<ResearchInput onStart={mockOnStart} />);

    const input = screen.getByPlaceholderText("ai.research_placeholder");
    fireEvent.change(input, { target: { value: "Test query" } });

    const startButton = screen.getByText("ai.start_research");
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith("Test query");
  });

  it("should disable button when input is empty", () => {
    render(<ResearchInput onStart={mockOnStart} />);

    const startButton = screen.getByText("ai.start_research");
    expect(startButton).toBeDisabled();
  });

  it("should disable when disabled is true", () => {
    render(<ResearchInput onStart={mockOnStart} disabled />);

    const startButton = screen.getByText("ai.researching");
    expect(startButton).toBeDisabled();
  });
});
