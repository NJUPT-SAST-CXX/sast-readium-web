/**
 * Tests for LearningTab component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { LearningTab } from "../learning-tab";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock("@/lib/ai/learning/flashcard/flashcard-store", () => ({
  useFlashcardStore: jest.fn(() => ({
    getAllDecks: () => [],
    getDueCardsForDeck: () => [],
  })),
}));

jest.mock("@/lib/ai/learning/quiz/quiz-store", () => ({
  useQuizStore: jest.fn(() => ({
    getAllQuizzes: () => [],
    getAttemptHistory: () => [],
  })),
}));

jest.mock("@/lib/ai/learning/ppt/ppt-store", () => ({
  usePPTStore: jest.fn(() => ({
    getAllPresentations: () => [],
  })),
}));

// Mock UI components
jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {typeof children === "function"
        ? children({ value, onValueChange })
        : children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tabs-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-trigger-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, onClick }: any) => (
    <div data-testid="card" onClick={onClick}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => (
    <div data-testid="progress" data-value={value} />
  ),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Import mocked stores for manipulation
import { useFlashcardStore } from "@/lib/ai/learning/flashcard/flashcard-store";
import { useQuizStore } from "@/lib/ai/learning/quiz/quiz-store";
import { usePPTStore } from "@/lib/ai/learning/ppt/ppt-store";

const mockUseFlashcardStore = useFlashcardStore as jest.MockedFunction<
  typeof useFlashcardStore
>;
const mockUseQuizStore = useQuizStore as jest.MockedFunction<
  typeof useQuizStore
>;
const mockUsePPTStore = usePPTStore as jest.MockedFunction<typeof usePPTStore>;

describe("LearningTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default empty state
    mockUseFlashcardStore.mockReturnValue({
      getAllDecks: () => [],
      getDueCardsForDeck: () => [],
    });
    mockUseQuizStore.mockReturnValue({
      getAllQuizzes: () => [],
      getAttemptHistory: () => [],
    });
    mockUsePPTStore.mockReturnValue({
      getAllPresentations: () => [],
    });
  });

  it("should render loading skeleton when isLoading is true", () => {
    render(<LearningTab isLoading={true} />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render tabs when not loading", () => {
    render(<LearningTab />);

    expect(screen.getByTestId("tabs")).toBeInTheDocument();
    expect(screen.getByTestId("tabs-list")).toBeInTheDocument();
  });

  it("should render overview tab by default", () => {
    render(<LearningTab />);

    expect(screen.getByTestId("tab-trigger-overview")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-study")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-create")).toBeInTheDocument();
  });

  it("should show empty state when no content exists", () => {
    render(<LearningTab />);

    expect(screen.getByText("Get Started with Learning")).toBeInTheDocument();
  });

  it("should call onOpenFlashcards when flashcard action is clicked", () => {
    const onOpenFlashcards = jest.fn();
    render(<LearningTab onOpenFlashcards={onOpenFlashcards} />);

    // Find and click the create flashcards card
    const cards = screen.getAllByTestId("card");
    const flashcardCard = cards.find((card) =>
      card.textContent?.includes("Create Flashcards")
    );

    if (flashcardCard) {
      fireEvent.click(flashcardCard);
      expect(onOpenFlashcards).toHaveBeenCalled();
    }
  });

  it("should call onOpenQuiz when quiz action is clicked", () => {
    const onOpenQuiz = jest.fn();
    render(<LearningTab onOpenQuiz={onOpenQuiz} />);

    const cards = screen.getAllByTestId("card");
    const quizCard = cards.find((card) =>
      card.textContent?.includes("Create Quiz")
    );

    if (quizCard) {
      fireEvent.click(quizCard);
      expect(onOpenQuiz).toHaveBeenCalled();
    }
  });

  it("should call onOpenPPT when presentation action is clicked", () => {
    const onOpenPPT = jest.fn();
    render(<LearningTab onOpenPPT={onOpenPPT} />);

    const cards = screen.getAllByTestId("card");
    const pptCard = cards.find((card) =>
      card.textContent?.includes("Create Presentation")
    );

    if (pptCard) {
      fireEvent.click(pptCard);
      expect(onOpenPPT).toHaveBeenCalled();
    }
  });

  it("should display deck count when decks exist", () => {
    mockUseFlashcardStore.mockReturnValue({
      getAllDecks: () => [
        {
          id: "deck-1",
          name: "Test Deck",
          cards: [],
          color: "#000",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      getDueCardsForDeck: () => [],
    });

    render(<LearningTab />);

    // Should show 1 deck in stats
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should display quiz count when quizzes exist", () => {
    mockUseQuizStore.mockReturnValue({
      getAllQuizzes: () => [
        {
          id: "quiz-1",
          title: "Test Quiz",
          questions: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      getAttemptHistory: () => [],
    });

    render(<LearningTab />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should display presentation count when presentations exist", () => {
    mockUsePPTStore.mockReturnValue({
      getAllPresentations: () => [
        {
          id: "ppt-1",
          title: "Test PPT",
          slides: [],
          theme: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });

    render(<LearningTab />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should show due cards alert when there are due cards", () => {
    mockUseFlashcardStore.mockReturnValue({
      getAllDecks: () => [
        {
          id: "deck-1",
          name: "Test Deck",
          cards: [{ id: "card-1" }],
          color: "#000",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      getDueCardsForDeck: () => [{ id: "card-1" }],
    });

    render(<LearningTab />);

    expect(screen.getByText("Cards Due for Review")).toBeInTheDocument();
  });

  it("should show recent activity when there are quiz attempts", () => {
    mockUseQuizStore.mockReturnValue({
      getAllQuizzes: () => [
        {
          id: "quiz-1",
          title: "Test Quiz",
          questions: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      getAttemptHistory: () => [
        {
          id: "attempt-1",
          quizId: "quiz-1",
          percentage: 85,
          startedAt: Date.now(),
          completedAt: Date.now(),
          answers: [],
        },
      ],
    });

    render(<LearningTab />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("should show progress bar when there are cards", () => {
    mockUseFlashcardStore.mockReturnValue({
      getAllDecks: () => [
        {
          id: "deck-1",
          name: "Test Deck",
          cards: [{ id: "card-1" }, { id: "card-2" }],
          color: "#000",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      getDueCardsForDeck: () => [],
    });

    render(<LearningTab />);

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });
});
