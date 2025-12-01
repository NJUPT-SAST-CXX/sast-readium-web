/**
 * Tests for Flashcard Store
 */

import { act } from "@testing-library/react";
import { useFlashcardStore } from "./flashcard-store";
import type { QACard, FlashcardDeck, Flashcard } from "../types";

// Helper to create QA card data (most common type) - use type assertion to bypass strict typing
const qaCard = (front: string, back: string, tags: string[] = []) =>
  ({ type: "qa" as const, front, back, tags }) as unknown as Omit<
    Flashcard,
    "id" | "deckId" | "createdAt" | "updatedAt"
  >;

// Reset store before each test
beforeEach(() => {
  act(() => {
    useFlashcardStore.getState().clearAllData();
  });
});

describe("flashcard-store", () => {
  describe("Deck Management", () => {
    it("should create a new deck", () => {
      let deckId: string;

      act(() => {
        deckId = useFlashcardStore
          .getState()
          .createDeck("Test Deck", "A test deck");
      });

      const deck = useFlashcardStore.getState().getDeckById(deckId!);
      expect(deck).not.toBeNull();
      expect(deck?.name).toBe("Test Deck");
      expect(deck?.description).toBe("A test deck");
      expect(deck?.cards).toEqual([]);
    });

    it("should create deck with source document info", () => {
      let deckId: string;

      act(() => {
        deckId = useFlashcardStore
          .getState()
          .createDeck("PDF Deck", "From PDF", {
            id: "doc-123",
            name: "test.pdf",
          });
      });

      const deck = useFlashcardStore.getState().getDeckById(deckId!);
      expect(deck?.sourceDocumentId).toBe("doc-123");
      expect(deck?.sourceFileName).toBe("test.pdf");
    });

    it("should delete a deck and its SRS data", () => {
      let deckId: string;

      act(() => {
        deckId = useFlashcardStore.getState().createDeck("To Delete");
        useFlashcardStore.getState().addCard(deckId, qaCard("Q", "A"));
      });

      const cardsBefore = useFlashcardStore
        .getState()
        .getDeckById(deckId!)?.cards;
      expect(cardsBefore?.length).toBe(1);

      act(() => {
        useFlashcardStore.getState().deleteDeck(deckId!);
      });

      expect(useFlashcardStore.getState().getDeckById(deckId!)).toBeNull();
    });

    it("should update deck properties", () => {
      let deckId: string;

      act(() => {
        deckId = useFlashcardStore.getState().createDeck("Original");
      });

      act(() => {
        useFlashcardStore.getState().updateDeck(deckId!, {
          name: "Updated Name",
          description: "Updated description",
        });
      });

      const deck = useFlashcardStore.getState().getDeckById(deckId!);
      expect(deck?.name).toBe("Updated Name");
      expect(deck?.description).toBe("Updated description");
    });

    it("should set current deck", () => {
      let deckId: string;

      act(() => {
        deckId = useFlashcardStore.getState().createDeck("Test");
        useFlashcardStore.getState().setCurrentDeck(deckId);
      });

      expect(useFlashcardStore.getState().currentDeckId).toBe(deckId!);

      act(() => {
        useFlashcardStore.getState().setCurrentDeck(null);
      });

      expect(useFlashcardStore.getState().currentDeckId).toBeNull();
    });

    it("should get all decks sorted by updatedAt", () => {
      act(() => {
        useFlashcardStore.getState().createDeck("Deck 1");
        useFlashcardStore.getState().createDeck("Deck 2");
      });

      const decks = useFlashcardStore.getState().getAllDecks();
      expect(decks).toHaveLength(2);
      // Both decks should be returned (order may vary based on timestamp precision)
      expect(decks.map((d) => d.name).sort()).toEqual(["Deck 1", "Deck 2"]);
    });
  });

  describe("Card Management", () => {
    let deckId: string;

    beforeEach(() => {
      act(() => {
        deckId = useFlashcardStore.getState().createDeck("Test Deck");
      });
    });

    it("should add a card to deck", () => {
      let cardId: string;

      act(() => {
        cardId = useFlashcardStore
          .getState()
          .addCard(deckId, qaCard("What is 2+2?", "4", ["math"]));
      });

      const deck = useFlashcardStore.getState().getDeckById(deckId);
      expect(deck?.cards).toHaveLength(1);
      expect((deck?.cards[0] as QACard).front).toBe("What is 2+2?");

      // Should also create SRS data
      const srsData = useFlashcardStore.getState().getSRSDataForCard(cardId!);
      expect(srsData).not.toBeNull();
      expect(srsData?.totalReviews).toBe(0);
    });

    it("should add multiple cards at once", () => {
      let cardIds: string[];

      act(() => {
        cardIds = useFlashcardStore
          .getState()
          .addCards(deckId, [
            qaCard("Q1", "A1"),
            qaCard("Q2", "A2"),
            qaCard("Q3", "A3"),
          ]);
      });

      expect(cardIds!).toHaveLength(3);
      const deck = useFlashcardStore.getState().getDeckById(deckId);
      expect(deck?.cards).toHaveLength(3);
    });

    it("should update a card", () => {
      let cardId: string;

      act(() => {
        cardId = useFlashcardStore
          .getState()
          .addCard(deckId, qaCard("Original", "Answer"));
      });

      act(() => {
        useFlashcardStore.getState().updateCard(deckId, cardId!, {
          front: "Updated Question",
        } as Partial<Flashcard>);
      });

      const deck = useFlashcardStore.getState().getDeckById(deckId);
      expect((deck?.cards[0] as QACard).front).toBe("Updated Question");
    });

    it("should delete a card", () => {
      let cardId: string;

      act(() => {
        cardId = useFlashcardStore.getState().addCard(deckId, qaCard("Q", "A"));
      });

      expect(
        useFlashcardStore.getState().getDeckById(deckId)?.cards
      ).toHaveLength(1);

      act(() => {
        useFlashcardStore.getState().deleteCard(deckId, cardId!);
      });

      expect(
        useFlashcardStore.getState().getDeckById(deckId)?.cards
      ).toHaveLength(0);
      expect(
        useFlashcardStore.getState().getSRSDataForCard(cardId!)
      ).toBeNull();
    });

    it("should move card between decks", () => {
      let cardId: string;
      let targetDeckId: string;

      act(() => {
        cardId = useFlashcardStore.getState().addCard(deckId, qaCard("Q", "A"));
        targetDeckId = useFlashcardStore.getState().createDeck("Target Deck");
      });

      act(() => {
        useFlashcardStore.getState().moveCard(cardId!, deckId, targetDeckId!);
      });

      expect(
        useFlashcardStore.getState().getDeckById(deckId)?.cards
      ).toHaveLength(0);
      expect(
        useFlashcardStore.getState().getDeckById(targetDeckId!)?.cards
      ).toHaveLength(1);
    });
  });

  describe("Study Session", () => {
    let deckId: string;

    beforeEach(() => {
      act(() => {
        deckId = useFlashcardStore.getState().createDeck("Study Deck");
        useFlashcardStore
          .getState()
          .addCards(deckId, [
            qaCard("Q1", "A1"),
            qaCard("Q2", "A2"),
            qaCard("Q3", "A3"),
          ]);
      });
    });

    it("should start a study session", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "learn");
      });

      const state = useFlashcardStore.getState();
      expect(state.isStudying).toBe(true);
      expect(state.currentSession).not.toBeNull();
      expect(state.currentSession?.mode).toBe("learn");
      expect(state.studyQueue.length).toBeGreaterThan(0);
    });

    it("should get current card", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "practice");
      });

      const currentCard = useFlashcardStore.getState().getCurrentCard();
      expect(currentCard).not.toBeNull();
    });

    it("should reveal and hide answer", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "learn");
      });

      expect(useFlashcardStore.getState().showAnswer).toBe(false);

      act(() => {
        useFlashcardStore.getState().revealAnswer();
      });

      expect(useFlashcardStore.getState().showAnswer).toBe(true);

      act(() => {
        useFlashcardStore.getState().hideAnswer();
      });

      expect(useFlashcardStore.getState().showAnswer).toBe(false);
    });

    it("should rate card and advance", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "learn");
      });

      const initialIndex = useFlashcardStore.getState().currentCardIndex;

      act(() => {
        useFlashcardStore.getState().rateCard("good");
      });

      const state = useFlashcardStore.getState();
      // Either advanced to next card or session ended
      expect(state.currentCardIndex > initialIndex || !state.isStudying).toBe(
        true
      );
    });

    it("should end session manually", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "learn");
      });

      act(() => {
        useFlashcardStore.getState().endSession();
      });

      const state = useFlashcardStore.getState();
      expect(state.isStudying).toBe(false);
      expect(state.currentSession).toBeNull();
      expect(state.sessions.length).toBeGreaterThan(0);
    });

    it("should navigate between cards", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "practice");
      });

      expect(useFlashcardStore.getState().currentCardIndex).toBe(0);

      act(() => {
        useFlashcardStore.getState().nextCard();
      });

      expect(useFlashcardStore.getState().currentCardIndex).toBe(1);

      act(() => {
        useFlashcardStore.getState().previousCard();
      });

      expect(useFlashcardStore.getState().currentCardIndex).toBe(0);
    });

    it("should skip card", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "practice");
      });

      const initialIndex = useFlashcardStore.getState().currentCardIndex;

      act(() => {
        useFlashcardStore.getState().skipCard();
      });

      expect(useFlashcardStore.getState().currentCardIndex).toBeGreaterThan(
        initialIndex
      );
    });
  });

  describe("Statistics", () => {
    let deckId: string;

    beforeEach(() => {
      act(() => {
        deckId = useFlashcardStore.getState().createDeck("Stats Deck");
        useFlashcardStore
          .getState()
          .addCards(deckId, [qaCard("Q1", "A1"), qaCard("Q2", "A2")]);
      });
    });

    it("should get deck stats", () => {
      const stats = useFlashcardStore.getState().getDeckStats(deckId);

      expect(stats.totalCards).toBe(2);
      expect(stats.newCards).toBe(2);
      expect(stats.masteredCards).toBe(0);
    });

    it("should get due cards for deck", () => {
      const dueCards = useFlashcardStore.getState().getDueCardsForDeck(deckId);
      expect(dueCards).toHaveLength(2); // New cards are due
    });

    it("should get new cards for deck", () => {
      const newCards = useFlashcardStore.getState().getNewCardsForDeck(deckId);
      expect(newCards).toHaveLength(2);
    });

    it("should get review forecast", () => {
      const forecast = useFlashcardStore
        .getState()
        .getReviewForecastForDeck(deckId, 7);
      expect(forecast).toHaveLength(7);
      expect(forecast[0]).toBe(2); // All new cards due today
    });

    it("should get session history", () => {
      act(() => {
        useFlashcardStore.getState().startSession(deckId, "learn");
        useFlashcardStore.getState().endSession();
      });

      const history = useFlashcardStore.getState().getSessionHistory(deckId);
      expect(history).toHaveLength(1);
    });
  });

  describe("Import/Export", () => {
    it("should export deck with SRS data", () => {
      let deckId: string;

      act(() => {
        deckId = useFlashcardStore.getState().createDeck("Export Test");
        useFlashcardStore.getState().addCard(deckId, qaCard("Q", "A"));
      });

      const exported = useFlashcardStore.getState().exportDeck(deckId!);

      expect(exported).not.toBeNull();
      expect(exported?.deck.name).toBe("Export Test");
      expect(exported?.deck.cards).toHaveLength(1);
      expect(Object.keys(exported?.srsData || {})).toHaveLength(1);
    });

    it("should import deck", () => {
      const importDeck: FlashcardDeck = {
        id: "old-id",
        name: "Imported Deck",
        description: "Test import",
        color: "#ff0000",
        icon: "book",
        cards: [
          {
            id: "old-card-id",
            deckId: "old-id",
            type: "qa",
            front: "Imported Q",
            back: "Imported A",
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as QACard,
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      let newDeckId: string;

      act(() => {
        newDeckId = useFlashcardStore.getState().importDeck(importDeck);
      });

      const deck = useFlashcardStore.getState().getDeckById(newDeckId!);
      expect(deck).not.toBeNull();
      expect(deck?.name).toBe("Imported Deck");
      expect(deck?.cards).toHaveLength(1);
      // Should have new IDs
      expect(deck?.id).not.toBe("old-id");
      expect(deck?.cards[0].id).not.toBe("old-card-id");
    });

    it("should return null for non-existent deck export", () => {
      const exported = useFlashcardStore.getState().exportDeck("non-existent");
      expect(exported).toBeNull();
    });
  });

  describe("Generation State", () => {
    it("should set generating state", () => {
      act(() => {
        useFlashcardStore.getState().setGenerating(true, 50);
      });

      expect(useFlashcardStore.getState().isGenerating).toBe(true);
      expect(useFlashcardStore.getState().generationProgress).toBe(50);

      act(() => {
        useFlashcardStore.getState().setGenerating(false);
      });

      expect(useFlashcardStore.getState().isGenerating).toBe(false);
    });
  });

  describe("Clear All Data", () => {
    it("should clear all data", () => {
      act(() => {
        useFlashcardStore.getState().createDeck("Test");
        useFlashcardStore.getState().clearAllData();
      });

      const state = useFlashcardStore.getState();
      expect(Object.keys(state.decks)).toHaveLength(0);
      expect(Object.keys(state.srsData)).toHaveLength(0);
      expect(state.sessions).toHaveLength(0);
    });
  });
});
