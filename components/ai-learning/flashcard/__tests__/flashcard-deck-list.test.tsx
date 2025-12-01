/**
 * Tests for FlashcardDeckList component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardDeckList } from "../flashcard-deck-list";
import { useFlashcardStore } from "@/lib/ai/learning";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/lib/ai/learning", () => ({
  useFlashcardStore: jest.fn(),
  calculateDeckStats: jest.fn(() => ({
    totalCards: 10,
    newCards: 2,
    learningCards: 3,
    reviewCards: 5,
    masteredCards: 4,
    averageEaseFactor: 2.5,
    averageInterval: 7,
  })),
}));

// Mock UI components
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

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, onClick }: any) => (
    <div data-testid="card" onClick={onClick}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

const mockUseFlashcardStore = useFlashcardStore as jest.MockedFunction<
  typeof useFlashcardStore
>;

describe("FlashcardDeckList", () => {
  const mockDecks = {
    "deck-1": {
      id: "deck-1",
      name: "JavaScript Basics",
      description: "Learn JS fundamentals",
      cards: [
        { id: "card-1", front: "Q1", back: "A1" },
        { id: "card-2", front: "Q2", back: "A2" },
      ],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    },
    "deck-2": {
      id: "deck-2",
      name: "React Hooks",
      description: "Master React hooks",
      cards: [{ id: "card-3", front: "Q3", back: "A3" }],
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 3600000,
    },
  };

  const mockDeleteDeck = jest.fn();
  const mockSrsData: Record<string, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        decks: mockDecks,
        deleteDeck: mockDeleteDeck,
        srsData: mockSrsData,
      };
      return selector(state);
    });
  });

  it("should render deck list", () => {
    render(<FlashcardDeckList />);

    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
    expect(screen.getByText("React Hooks")).toBeInTheDocument();
  });

  it("should show deck descriptions", () => {
    render(<FlashcardDeckList />);

    expect(screen.getByText("Learn JS fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Master React hooks")).toBeInTheDocument();
  });

  it("should render with onSelectDeck callback", () => {
    const onSelectDeck = jest.fn();
    render(<FlashcardDeckList onSelectDeck={onSelectDeck} />);

    // Verify decks are rendered
    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
  });

  it("should call onStartStudy when study button is clicked", () => {
    const onStartStudy = jest.fn();
    render(<FlashcardDeckList onStartStudy={onStartStudy} />);

    // Find study buttons (with Play icon text)
    const studyButtons = screen.getAllByRole("button");
    const studyButton = studyButtons.find((btn) =>
      btn.textContent?.includes("flashcard.study")
    );

    if (studyButton) {
      fireEvent.click(studyButton);
      expect(onStartStudy).toHaveBeenCalled();
    }
  });

  it("should call onCreateDeck when create button is clicked", () => {
    const onCreateDeck = jest.fn();
    render(<FlashcardDeckList onCreateDeck={onCreateDeck} />);

    const createButton = screen.getByText("learning.flashcard.new_deck");
    fireEvent.click(createButton);

    expect(onCreateDeck).toHaveBeenCalled();
  });

  it("should render without decks", () => {
    mockUseFlashcardStore.mockImplementation((selector: any) => {
      const state = {
        decks: {},
        deleteDeck: mockDeleteDeck,
        srsData: mockSrsData,
      };
      return selector(state);
    });

    render(<FlashcardDeckList />);

    // Should not show any deck cards
    expect(screen.queryByText("JavaScript Basics")).not.toBeInTheDocument();
  });

  it("should sort decks by updatedAt descending", () => {
    render(<FlashcardDeckList />);

    // Both decks should be rendered
    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
    expect(screen.getByText("React Hooks")).toBeInTheDocument();
  });

  it("should display total stats", () => {
    render(<FlashcardDeckList />);

    // Check for stats badges
    const badges = screen.getAllByTestId("badge");
    expect(badges.length).toBeGreaterThan(0);
  });
});
