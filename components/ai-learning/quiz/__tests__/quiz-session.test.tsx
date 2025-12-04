/**
 * Tests for QuizSession component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { QuizSession } from "../quiz-session";
import { useQuizStore } from "@/lib/ai/learning";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | object) => {
      if (typeof fallback === "string") return fallback;
      if (typeof fallback === "object") {
        if ("current" in fallback && "total" in fallback) {
          return `Question ${fallback.current} of ${fallback.total}`;
        }
      }
      return key;
    },
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

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="input"
    />
  ),
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, placeholder }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="textarea"
    />
  ),
}));

jest.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({ children, onValueChange }: any) => (
    <div data-testid="radio-group" onClick={() => onValueChange?.("0")}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value }: any) => (
    <input type="radio" value={value} data-testid={`radio-${value}`} />
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

const mockUseQuizStore = useQuizStore as jest.MockedFunction<
  typeof useQuizStore
>;

describe("QuizSession", () => {
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
        type: "true-false" as const,
        statement: "JavaScript is typed",
        correctAnswer: false,
        difficulty: "medium" as const,
      },
    ],
    settings: {
      timedMode: false,
      shuffleQuestions: false,
      showCorrectAnswers: true,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockAttempt = {
    id: "attempt-1",
    quizId: "quiz-1",
    startedAt: Date.now(),
    answers: [],
  };

  const mockSubmitAnswer = jest.fn();
  const mockNextQuestion = jest.fn();
  const mockPreviousQuestion = jest.fn();
  const mockFinishQuiz = jest.fn();
  const mockCancelQuiz = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        currentAttempt: mockAttempt,
        currentQuestionIndex: 0,
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });
  });

  it("should render quiz title", () => {
    render(<QuizSession quizId="quiz-1" />);

    expect(screen.getByText("JavaScript Quiz")).toBeInTheDocument();
  });

  it("should render progress indicator", () => {
    render(<QuizSession quizId="quiz-1" />);

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });

  it("should display current question", () => {
    render(<QuizSession quizId="quiz-1" />);

    expect(screen.getByText("What is JavaScript?")).toBeInTheDocument();
  });

  it("should display multiple choice options", () => {
    render(<QuizSession quizId="quiz-1" />);

    expect(screen.getByText(/A language/)).toBeInTheDocument();
    expect(screen.getByText(/A framework/)).toBeInTheDocument();
    expect(screen.getByText(/A database/)).toBeInTheDocument();
  });

  it("should display question type badge", () => {
    render(<QuizSession quizId="quiz-1" />);

    const badges = screen.getAllByTestId("badge");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("should display difficulty badge", () => {
    render(<QuizSession quizId="quiz-1" />);

    const badges = screen.getAllByTestId("badge");
    expect(badges.some((b) => b.textContent?.includes("easy"))).toBe(true);
  });

  it("should call onExit when exit button is clicked", () => {
    const onExit = jest.fn();
    render(<QuizSession quizId="quiz-1" onExit={onExit} />);

    const exitButton = screen.getByText("learning.common.close");
    fireEvent.click(exitButton);

    expect(mockCancelQuiz).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });

  it("should show previous button disabled on first question", () => {
    render(<QuizSession quizId="quiz-1" />);

    const prevButton = screen.getByText("learning.quiz.session.previous");
    expect(prevButton).toBeDisabled();
  });

  it("should show next button on non-last question", () => {
    render(<QuizSession quizId="quiz-1" />);

    expect(screen.getByText("learning.quiz.session.next")).toBeInTheDocument();
  });

  it("should show submit button on last question", () => {
    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        currentAttempt: mockAttempt,
        currentQuestionIndex: 1, // Last question
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });

    render(<QuizSession quizId="quiz-1" />);

    expect(
      screen.getByText("learning.quiz.session.submit")
    ).toBeInTheDocument();
  });

  it("should call finishQuiz and onComplete when submit is clicked", () => {
    const onComplete = jest.fn();

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        currentAttempt: mockAttempt,
        currentQuestionIndex: 1,
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });

    render(<QuizSession quizId="quiz-1" onComplete={onComplete} />);

    fireEvent.click(screen.getByText("learning.quiz.session.submit"));

    expect(mockFinishQuiz).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it("should render true-false question type", () => {
    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": mockQuiz },
        currentAttempt: mockAttempt,
        currentQuestionIndex: 1, // True-false question
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });

    render(<QuizSession quizId="quiz-1" />);

    expect(screen.getByText("JavaScript is typed")).toBeInTheDocument();
  });

  it("should show error state when quiz not found", () => {
    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: {},
        currentAttempt: null,
        currentQuestionIndex: 0,
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });

    render(<QuizSession quizId="quiz-1" />);

    expect(screen.getByText("learning.common.error")).toBeInTheDocument();
  });

  it("should display timer when timed mode is enabled", () => {
    const timedQuiz = {
      ...mockQuiz,
      settings: {
        ...mockQuiz.settings,
        timedMode: true,
        totalTimeLimit: 300, // 5 minutes
      },
    };

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": timedQuiz },
        currentAttempt: mockAttempt,
        currentQuestionIndex: 0,
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });

    render(<QuizSession quizId="quiz-1" />);

    // Timer badge should be present
    const badges = screen.getAllByTestId("badge");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("should handle short-answer question type", () => {
    const shortAnswerQuiz = {
      ...mockQuiz,
      questions: [
        {
          id: "q1",
          type: "short-answer" as const,
          question: "Explain closures in JavaScript",
          sampleAnswer: "A closure is...",
          difficulty: "hard" as const,
        },
      ],
    };

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": shortAnswerQuiz },
        currentAttempt: mockAttempt,
        currentQuestionIndex: 0,
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });

    render(<QuizSession quizId="quiz-1" />);

    expect(
      screen.getByText("Explain closures in JavaScript")
    ).toBeInTheDocument();
    expect(screen.getByTestId("textarea")).toBeInTheDocument();
  });

  it("should handle fill-blank question type", () => {
    const fillBlankQuiz = {
      ...mockQuiz,
      questions: [
        {
          id: "q1",
          type: "fill-blank" as const,
          sentence: "JavaScript uses {{blank}} typing",
          blanks: [{ answer: "dynamic" }],
          difficulty: "medium" as const,
        },
      ],
    };

    mockUseQuizStore.mockImplementation((selector: any) => {
      const state = {
        quizzes: { "quiz-1": fillBlankQuiz },
        currentAttempt: mockAttempt,
        currentQuestionIndex: 0,
        submitAnswer: mockSubmitAnswer,
        nextQuestion: mockNextQuestion,
        previousQuestion: mockPreviousQuestion,
        finishQuiz: mockFinishQuiz,
        cancelQuiz: mockCancelQuiz,
      };
      return selector(state);
    });

    render(<QuizSession quizId="quiz-1" />);

    expect(
      screen.getByText("JavaScript uses ______ typing")
    ).toBeInTheDocument();
  });
});
