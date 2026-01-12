/**
 * Tests for FlashcardStudySession component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardStudySession } from "../flashcard-study-session";
import { useFlashcardStore } from "@/lib/ai/learning";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | object) => {
      if (typeof fallback === "string") return fallback;
      if (typeof fallback === "object" && "count" in fallback)
        return `${fallback.count} cards`;
      return key;
    },
  }),
}));

jest.mock("@/lib/ai/learning", () => ({
  useFlashcardStore: jest.fn(),
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
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
  Card: ({ children, onClick, className }: any) => (
    <div data-testid="card" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
}));

const mockUseFlashcardStore = useFlashcardStore as jest.MockedFunction<
  typeof useFlashcardStore
>;

describe("FlashcardStudySession", () => {
  const mockDeck = {
    id: "deck-1",
    name: "JavaScript Basics",
    description: "Learn JS",
    cards: [
      {
        id: "card-1",
        type: "qa" as const,
        front: "What is JS?",
        back: "A programming language",
      },
      {
        id: "card-2",
        type: "qa" as const,
        front: "What is React?",
        back: "A UI library",
      },
    ],
    color: "#3b82f6",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockSession = {
    id: "session-1",
    deckId: "deck-1",
    startedAt: Date.now(),
    cardsStudied: [],
    cardsCorrect: [],
    cardsIncorrect: [],
  };

  const mockEndSession = jest.fn();
  const mockRevealAnswer = jest.fn();
  const mockHideAnswer = jest.fn();
  const mockRateCard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: mockSession,
        currentCardIndex: 0,
        studyQueue: mockDeck.cards,
        showAnswer: false,
        decks: { "deck-1": mockDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });
  });

  it("should render deck name and card count", () => {
    render(<FlashcardStudySession deckId="deck-1" />);

    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
  });

  it("should render progress indicator", () => {
    render(<FlashcardStudySession deckId="deck-1" />);

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });

  it("should show card front initially", () => {
    render(<FlashcardStudySession deckId="deck-1" />);

    expect(screen.getByText("What is JS?")).toBeInTheDocument();
  });

  it("should show 'Show Answer' button when answer is hidden", () => {
    render(<FlashcardStudySession deckId="deck-1" />);

    expect(
      screen.getByText("learning.flashcard.study.show_answer")
    ).toBeInTheDocument();
  });

  it("should call revealAnswer when 'Show Answer' is clicked", () => {
    render(<FlashcardStudySession deckId="deck-1" />);

    const showButton = screen.getByText("learning.flashcard.study.show_answer");
    fireEvent.click(showButton);

    expect(mockRevealAnswer).toHaveBeenCalled();
  });

  it("should show rating buttons when answer is revealed", () => {
    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: mockSession,
        currentCardIndex: 0,
        studyQueue: mockDeck.cards,
        showAnswer: true,
        decks: { "deck-1": mockDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });

    render(<FlashcardStudySession deckId="deck-1" />);

    expect(screen.getByText("Again")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("should call rateCard with 'again' when Again button is clicked", () => {
    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: mockSession,
        currentCardIndex: 0,
        studyQueue: mockDeck.cards,
        showAnswer: true,
        decks: { "deck-1": mockDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });

    render(<FlashcardStudySession deckId="deck-1" />);

    fireEvent.click(screen.getByText("Again"));
    expect(mockRateCard).toHaveBeenCalledWith("again");
  });

  it("should call rateCard with 'good' when Good button is clicked", () => {
    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: mockSession,
        currentCardIndex: 0,
        studyQueue: mockDeck.cards,
        showAnswer: true,
        decks: { "deck-1": mockDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });

    render(<FlashcardStudySession deckId="deck-1" />);

    fireEvent.click(screen.getByText("Good"));
    expect(mockRateCard).toHaveBeenCalledWith("good");
  });

  it("should call onExit when exit button is clicked", () => {
    const onExit = jest.fn();
    render(<FlashcardStudySession deckId="deck-1" onExit={onExit} />);

    const exitButton = screen.getByText("learning.common.close");
    fireEvent.click(exitButton);

    expect(mockEndSession).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });

  it("should show completion screen when no current card", () => {
    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: {
          ...mockSession,
          cardsStudied: ["card-1", "card-2"],
          cardsCorrect: ["card-1"],
          cardsIncorrect: ["card-2"],
        },
        currentCardIndex: 2,
        studyQueue: [],
        showAnswer: false,
        decks: { "deck-1": mockDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });

    render(<FlashcardStudySession deckId="deck-1" />);

    expect(screen.getByText("Session Complete!")).toBeInTheDocument();
  });

  it("should call onComplete when last card is rated", () => {
    const onComplete = jest.fn();

    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: mockSession,
        currentCardIndex: 1, // Last card
        studyQueue: mockDeck.cards,
        showAnswer: true,
        decks: { "deck-1": mockDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });

    render(<FlashcardStudySession deckId="deck-1" onComplete={onComplete} />);

    fireEvent.click(screen.getByText("Good"));
    expect(onComplete).toHaveBeenCalled();
  });

  it("should display card type badge", () => {
    render(<FlashcardStudySession deckId="deck-1" />);

    expect(screen.getByText("Q&A")).toBeInTheDocument();
  });

  it("should handle fill-blank card type", () => {
    const fillBlankDeck = {
      ...mockDeck,
      cards: [
        {
          id: "card-1",
          type: "fill-blank" as const,
          sentence: "JavaScript is a {{blank}} language",
          blanks: [{ answer: "programming" }],
        },
      ],
    };

    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: mockSession,
        currentCardIndex: 0,
        studyQueue: fillBlankDeck.cards,
        showAnswer: false,
        decks: { "deck-1": fillBlankDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });

    render(<FlashcardStudySession deckId="deck-1" />);

    expect(
      screen.getByText("JavaScript is a ______ language")
    ).toBeInTheDocument();
  });

  it("should handle multiple-choice card type", () => {
    const mcDeck = {
      ...mockDeck,
      cards: [
        {
          id: "card-1",
          type: "multiple-choice" as const,
          question: "Which is a JS framework?",
          options: ["React", "Django", "Rails"],
          correctIndex: 0,
        },
      ],
    };

    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        currentSession: mockSession,
        currentCardIndex: 0,
        studyQueue: mcDeck.cards,
        showAnswer: false,
        decks: { "deck-1": mcDeck },
        endSession: mockEndSession,
        revealAnswer: mockRevealAnswer,
        hideAnswer: mockHideAnswer,
        rateCard: mockRateCard,
      };
      return selector(state);
    });

    render(<FlashcardStudySession deckId="deck-1" />);

    expect(screen.getByText("Which is a JS framework?")).toBeInTheDocument();
    expect(screen.getByText("A. React")).toBeInTheDocument();
  });
});
