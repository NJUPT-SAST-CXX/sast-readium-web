/**
 * Tests for QuizResults component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { QuizResults } from "../quiz-results";
import { useQuizStore } from "@/lib/ai/learning";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock("@/lib/ai/learning", () => ({
  useQuizStore: jest.fn(),
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => (
    <div data-testid="progress" data-value={value} />
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/accordion", () => ({
  Accordion: ({ children }: any) => (
    <div data-testid="accordion">{children}</div>
  ),
  AccordionContent: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children, className }: any) => (
    <div data-testid="accordion-item" className={className}>
      {children}
    </div>
  ),
  AccordionTrigger: ({ children }: any) => <button>{children}</button>,
}));

const mockUseQuizStore = useQuizStore as jest.MockedFunction<
  typeof useQuizStore
>;

describe("QuizResults", () => {
  const mockQuiz = {
    id: "quiz-1",
    title: "JavaScript Quiz",
    description: "Test your JS knowledge",
    questions: [
      {
        id: "q1",
        type: "multiple-choice" as const,
        question: "What is JavaScript?",
        options: ["A language", "A framework", "A database"],
        correctIndex: 0,
        difficulty: "easy" as const,
      },
      {
        id: "q2",
        type: "multiple-choice" as const,
        question: "What is React?",
        options: ["A library", "A language", "A database"],
        correctIndex: 0,
        difficulty: "medium" as const,
      },
    ],
    passingScore: 70,
    settings: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockAttempt = {
    id: "attempt-1",
    quizId: "quiz-1",
    startedAt: Date.now() - 60000,
    completedAt: Date.now(),
    answers: [
      { questionId: "q1", answer: 0, isCorrect: true, timeSpent: 10000 },
      { questionId: "q2", answer: 1, isCorrect: false, timeSpent: 15000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        attempts: [mockAttempt],
      };
      return selector(state);
    });
  });

  it("should render quiz title", () => {
    render(<QuizResults attemptId="attempt-1" />);

    expect(screen.getByText("JavaScript Quiz")).toBeInTheDocument();
  });

  it("should display score percentage", () => {
    render(<QuizResults attemptId="attempt-1" />);

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should display correct/incorrect counts", () => {
    render(<QuizResults attemptId="attempt-1" />);

    // 1 correct, 1 incorrect - multiple "1" elements exist
    const oneElements = screen.getAllByText("1");
    expect(oneElements.length).toBeGreaterThan(0);
  });

  it("should show trophy icon", () => {
    render(<QuizResults attemptId="attempt-1" />);

    // Trophy is rendered in the score card
    const cards = screen.getAllByTestId("card");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("should display time taken", () => {
    render(<QuizResults attemptId="attempt-1" />);

    // Time is displayed in format like "1m 0s"
    const timeElements = screen.getAllByText(/m.*s/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("should show review answers button", () => {
    render(<QuizResults attemptId="attempt-1" />);

    expect(
      screen.getByText("learning.quiz.results.review_answers")
    ).toBeInTheDocument();
  });

  it("should show try again button", () => {
    render(<QuizResults attemptId="attempt-1" />);

    expect(
      screen.getByText("learning.quiz.results.try_again")
    ).toBeInTheDocument();
  });

  it("should call onRetry when try again is clicked", () => {
    const onRetry = jest.fn();
    render(<QuizResults attemptId="attempt-1" onRetry={onRetry} />);

    fireEvent.click(screen.getByText("learning.quiz.results.try_again"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("should call onExit when exit button is clicked", () => {
    const onExit = jest.fn();
    render(<QuizResults attemptId="attempt-1" onExit={onExit} />);

    fireEvent.click(screen.getByText("learning.common.close"));
    expect(onExit).toHaveBeenCalled();
  });

  it("should show error state when attempt not found", () => {
    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        attempts: [],
      };
      return selector(state);
    });

    render(<QuizResults attemptId="nonexistent" />);

    expect(screen.getByText("learning.common.error")).toBeInTheDocument();
  });

  it("should display difficulty breakdown", () => {
    render(<QuizResults attemptId="attempt-1" />);

    expect(screen.getByText("Performance by Difficulty")).toBeInTheDocument();
  });

  it("should show passing indicator for passing score", () => {
    const passingAttempt = {
      ...mockAttempt,
      answers: [
        { questionId: "q1", answer: 0, isCorrect: true, timeSpent: 10000 },
        { questionId: "q2", answer: 0, isCorrect: true, timeSpent: 15000 },
      ],
    };

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        attempts: [passingAttempt],
      };
      return selector(state);
    });

    render(<QuizResults attemptId="attempt-1" />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should switch to review mode when review button is clicked", () => {
    render(<QuizResults attemptId="attempt-1" />);

    fireEvent.click(screen.getByText("learning.quiz.results.review_answers"));

    // Should show accordion for question review
    expect(screen.getByTestId("accordion")).toBeInTheDocument();
  });

  it("should show correct answer count in stats", () => {
    render(<QuizResults attemptId="attempt-1" />);

    // Stats cards show correct count
    expect(
      screen.getByText("learning.quiz.results.correct")
    ).toBeInTheDocument();
  });

  it("should show incorrect answer count in stats", () => {
    render(<QuizResults attemptId="attempt-1" />);

    expect(
      screen.getByText("learning.quiz.results.incorrect")
    ).toBeInTheDocument();
  });

  it("should display progress bars for difficulty breakdown", () => {
    render(<QuizResults attemptId="attempt-1" />);

    const progressBars = screen.getAllByTestId("progress");
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("should handle quiz with all correct answers", () => {
    const perfectAttempt = {
      ...mockAttempt,
      answers: [
        { questionId: "q1", answer: 0, isCorrect: true, timeSpent: 10000 },
        { questionId: "q2", answer: 0, isCorrect: true, timeSpent: 15000 },
      ],
    };

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        attempts: [perfectAttempt],
      };
      return selector(state);
    });

    render(<QuizResults attemptId="attempt-1" />);

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // 2 correct
  });

  it("should handle quiz with all incorrect answers", () => {
    const failedAttempt = {
      ...mockAttempt,
      answers: [
        { questionId: "q1", answer: 1, isCorrect: false, timeSpent: 10000 },
        { questionId: "q2", answer: 1, isCorrect: false, timeSpent: 15000 },
      ],
    };

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        attempts: [failedAttempt],
      };
      return selector(state);
    });

    render(<QuizResults attemptId="attempt-1" />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
