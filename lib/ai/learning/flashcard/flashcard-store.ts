/**
 * Flashcard Store - Zustand state management for flashcard system
 *
 * Features:
 * - Deck management (CRUD operations)
 * - Card management within decks
 * - SM-2 spaced repetition integration
 * - Study session tracking
 * - Progress persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Flashcard,
  FlashcardDeck,
  SRSData,
  StudySession,
  StudyMode,
  DeckStats,
} from "../types";
import {
  createInitialSRSData,
  calculateSM2,
  getDueCards,
  getNewCards,
  getLearningCards,
  getMasteredCards,
  getStudyQueue,
  calculateDeckStats,
  getReviewForecast,
  getQualityFromLabel,
} from "./srs-algorithm";

// ============================================================================
// Types
// ============================================================================

interface FlashcardState {
  // Data
  decks: Record<string, FlashcardDeck>;
  srsData: Record<string, SRSData>;
  sessions: StudySession[];

  // Current state
  currentDeckId: string | null;
  currentSession: StudySession | null;
  currentCardIndex: number;
  studyQueue: Flashcard[];

  // UI State
  isStudying: boolean;
  isGenerating: boolean;
  showAnswer: boolean;
  generationProgress: number;

  // Actions - Deck management
  createDeck: (
    name: string,
    description?: string,
    sourceDoc?: { id: string; name: string }
  ) => string;
  deleteDeck: (id: string) => void;
  updateDeck: (
    id: string,
    updates: Partial<Omit<FlashcardDeck, "id" | "cards">>
  ) => void;
  setCurrentDeck: (id: string | null) => void;

  // Actions - Card management
  addCard: (
    deckId: string,
    card: Omit<Flashcard, "id" | "deckId" | "createdAt" | "updatedAt">
  ) => string;
  addCards: (
    deckId: string,
    cards: Array<Omit<Flashcard, "id" | "deckId" | "createdAt" | "updatedAt">>
  ) => string[];
  updateCard: (
    deckId: string,
    cardId: string,
    updates: Partial<Flashcard>
  ) => void;
  deleteCard: (deckId: string, cardId: string) => void;
  moveCard: (cardId: string, fromDeckId: string, toDeckId: string) => void;

  // Actions - Study session
  startSession: (deckId: string, mode: StudyMode) => void;
  endSession: () => void;
  nextCard: () => void;
  previousCard: () => void;
  revealAnswer: () => void;
  hideAnswer: () => void;
  rateCard: (rating: "again" | "hard" | "good" | "easy") => void;
  skipCard: () => void;

  // Getters
  getCurrentCard: () => Flashcard | null;
  getDeckById: (id: string) => FlashcardDeck | null;
  getDeckStats: (deckId: string) => DeckStats;
  getDueCardsForDeck: (deckId: string) => Flashcard[];
  getNewCardsForDeck: (deckId: string, limit?: number) => Flashcard[];
  getLearningCardsForDeck: (deckId: string) => Flashcard[];
  getMasteredCardsForDeck: (deckId: string) => Flashcard[];
  getReviewForecastForDeck: (deckId: string, days?: number) => number[];
  getAllDecks: () => FlashcardDeck[];
  getSessionHistory: (deckId?: string) => StudySession[];
  getSRSDataForCard: (cardId: string) => SRSData | null;

  // Generation
  setGenerating: (isGenerating: boolean, progress?: number) => void;

  // Bulk operations
  importDeck: (
    deck: FlashcardDeck,
    srsData?: Record<string, SRSData>
  ) => string;
  exportDeck: (
    deckId: string
  ) => { deck: FlashcardDeck; srsData: Record<string, SRSData> } | null;
  clearAllData: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DECK_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

const DECK_ICONS = [
  "book",
  "bookmark",
  "lightbulb",
  "graduation-cap",
  "brain",
  "star",
  "heart",
  "flag",
  "folder",
  "file-text",
  "layers",
  "target",
];

function getRandomColor(): string {
  return DECK_COLORS[Math.floor(Math.random() * DECK_COLORS.length)];
}

function getRandomIcon(): string {
  return DECK_ICONS[Math.floor(Math.random() * DECK_ICONS.length)];
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      // Initial state
      decks: {},
      srsData: {},
      sessions: [],
      currentDeckId: null,
      currentSession: null,
      currentCardIndex: 0,
      studyQueue: [],
      isStudying: false,
      isGenerating: false,
      showAnswer: false,
      generationProgress: 0,

      // Deck management
      createDeck: (name, description = "", sourceDoc) => {
        const id = nanoid();
        const now = Date.now();
        const deck: FlashcardDeck = {
          id,
          name,
          description,
          cards: [],
          createdAt: now,
          updatedAt: now,
          sourceDocumentId: sourceDoc?.id,
          sourceFileName: sourceDoc?.name,
          color: getRandomColor(),
          icon: getRandomIcon(),
        };

        set((state) => ({
          decks: { ...state.decks, [id]: deck },
        }));

        return id;
      },

      deleteDeck: (id) => {
        set((state) => {
          const { [id]: deletedDeck, ...remainingDecks } = state.decks;

          // Also remove SRS data for cards in this deck
          const newSrsData = { ...state.srsData };
          if (deletedDeck) {
            for (const card of deletedDeck.cards) {
              delete newSrsData[card.id];
            }
          }

          return {
            decks: remainingDecks,
            srsData: newSrsData,
            currentDeckId:
              state.currentDeckId === id ? null : state.currentDeckId,
          };
        });
      },

      updateDeck: (id, updates) => {
        set((state) => {
          const deck = state.decks[id];
          if (!deck) return state;

          return {
            decks: {
              ...state.decks,
              [id]: {
                ...deck,
                ...updates,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      setCurrentDeck: (id) => {
        set({ currentDeckId: id });
      },

      // Card management
      addCard: (deckId, cardData) => {
        const cardId = nanoid();
        const now = Date.now();

        set((state) => {
          const deck = state.decks[deckId];
          if (!deck) return state;

          const newCard = {
            ...cardData,
            id: cardId,
            deckId,
            createdAt: now,
            updatedAt: now,
          } as Flashcard;

          return {
            decks: {
              ...state.decks,
              [deckId]: {
                ...deck,
                cards: [...deck.cards, newCard],
                updatedAt: now,
              },
            },
            srsData: {
              ...state.srsData,
              [cardId]: createInitialSRSData(cardId),
            },
          };
        });

        return cardId;
      },

      addCards: (deckId, cardsData) => {
        const cardIds: string[] = [];
        const now = Date.now();

        set((state) => {
          const deck = state.decks[deckId];
          if (!deck) return state;

          const newCards: Flashcard[] = [];
          const newSrsData: Record<string, SRSData> = {};

          for (const cardData of cardsData) {
            const cardId = nanoid();
            cardIds.push(cardId);

            newCards.push({
              ...cardData,
              id: cardId,
              deckId,
              createdAt: now,
              updatedAt: now,
            } as Flashcard);

            newSrsData[cardId] = createInitialSRSData(cardId);
          }

          return {
            decks: {
              ...state.decks,
              [deckId]: {
                ...deck,
                cards: [...deck.cards, ...newCards],
                updatedAt: now,
              },
            },
            srsData: {
              ...state.srsData,
              ...newSrsData,
            },
          };
        });

        return cardIds;
      },

      updateCard: (deckId, cardId, updates) => {
        set((state) => {
          const deck = state.decks[deckId];
          if (!deck) return state;

          const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
          if (cardIndex === -1) return state;

          const updatedCards = [...deck.cards];
          updatedCards[cardIndex] = {
            ...updatedCards[cardIndex],
            ...updates,
            updatedAt: Date.now(),
          } as Flashcard;

          return {
            decks: {
              ...state.decks,
              [deckId]: {
                ...deck,
                cards: updatedCards,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteCard: (deckId, cardId) => {
        set((state) => {
          const deck = state.decks[deckId];
          if (!deck) return state;

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [cardId]: deletedSrs, ...remainingSrs } = state.srsData;

          return {
            decks: {
              ...state.decks,
              [deckId]: {
                ...deck,
                cards: deck.cards.filter((c) => c.id !== cardId),
                updatedAt: Date.now(),
              },
            },
            srsData: remainingSrs,
          };
        });
      },

      moveCard: (cardId, fromDeckId, toDeckId) => {
        set((state) => {
          const fromDeck = state.decks[fromDeckId];
          const toDeck = state.decks[toDeckId];
          if (!fromDeck || !toDeck) return state;

          const cardIndex = fromDeck.cards.findIndex((c) => c.id === cardId);
          if (cardIndex === -1) return state;

          const card = { ...fromDeck.cards[cardIndex], deckId: toDeckId };
          const now = Date.now();

          return {
            decks: {
              ...state.decks,
              [fromDeckId]: {
                ...fromDeck,
                cards: fromDeck.cards.filter((c) => c.id !== cardId),
                updatedAt: now,
              },
              [toDeckId]: {
                ...toDeck,
                cards: [...toDeck.cards, card],
                updatedAt: now,
              },
            },
          };
        });
      },

      // Study session
      startSession: (deckId, mode) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) return;

        const sessionId = nanoid();
        const now = Date.now();

        // Build study queue based on mode
        let queue: Flashcard[];
        if (mode === "learn") {
          queue = getNewCards(deck.cards, state.srsData, 20);
        } else if (mode === "review") {
          queue = getDueCards(deck.cards, state.srsData);
        } else {
          // practice - all cards shuffled
          queue = getStudyQueue(deck.cards, state.srsData, {
            newCardsLimit: 10,
            reviewLimit: 50,
          });
        }

        const session: StudySession = {
          id: sessionId,
          deckId,
          mode,
          startedAt: now,
          cardsStudied: [],
          cardsCorrect: [],
          cardsIncorrect: [],
        };

        set({
          currentDeckId: deckId,
          currentSession: session,
          currentCardIndex: 0,
          studyQueue: queue,
          isStudying: true,
          showAnswer: false,
        });
      },

      endSession: () => {
        const state = get();
        if (!state.currentSession) return;

        const completedSession: StudySession = {
          ...state.currentSession,
          completedAt: Date.now(),
        };

        set((state) => ({
          sessions: [...state.sessions, completedSession],
          currentSession: null,
          studyQueue: [],
          currentCardIndex: 0,
          isStudying: false,
          showAnswer: false,
        }));
      },

      nextCard: () => {
        set((state) => {
          if (state.currentCardIndex >= state.studyQueue.length - 1) {
            return state;
          }
          return {
            currentCardIndex: state.currentCardIndex + 1,
            showAnswer: false,
          };
        });
      },

      previousCard: () => {
        set((state) => {
          if (state.currentCardIndex <= 0) {
            return state;
          }
          return {
            currentCardIndex: state.currentCardIndex - 1,
            showAnswer: false,
          };
        });
      },

      revealAnswer: () => {
        set({ showAnswer: true });
      },

      hideAnswer: () => {
        set({ showAnswer: false });
      },

      rateCard: (rating) => {
        const state = get();
        const currentCard = state.studyQueue[state.currentCardIndex];
        if (!currentCard || !state.currentSession) return;

        const quality = getQualityFromLabel(rating);
        const currentSrsData =
          state.srsData[currentCard.id] || createInitialSRSData(currentCard.id);
        const newSrsData = calculateSM2(quality, currentSrsData);
        const isCorrect = quality >= 3;

        set((prevState) => {
          const updatedSession = {
            ...prevState.currentSession!,
            cardsStudied: [
              ...prevState.currentSession!.cardsStudied,
              currentCard.id,
            ],
            cardsCorrect: isCorrect
              ? [...prevState.currentSession!.cardsCorrect, currentCard.id]
              : prevState.currentSession!.cardsCorrect,
            cardsIncorrect: !isCorrect
              ? [...prevState.currentSession!.cardsIncorrect, currentCard.id]
              : prevState.currentSession!.cardsIncorrect,
          };

          // Move to next card
          const nextIndex = prevState.currentCardIndex + 1;
          const isComplete = nextIndex >= prevState.studyQueue.length;

          if (isComplete) {
            // Auto-end session when all cards are done
            return {
              srsData: {
                ...prevState.srsData,
                [currentCard.id]: newSrsData,
              },
              sessions: [
                ...prevState.sessions,
                { ...updatedSession, completedAt: Date.now() },
              ],
              currentSession: null,
              studyQueue: [],
              currentCardIndex: 0,
              isStudying: false,
              showAnswer: false,
            };
          }

          return {
            srsData: {
              ...prevState.srsData,
              [currentCard.id]: newSrsData,
            },
            currentSession: updatedSession,
            currentCardIndex: nextIndex,
            showAnswer: false,
          };
        });
      },

      skipCard: () => {
        const state = get();
        if (state.currentCardIndex >= state.studyQueue.length - 1) {
          // End session if no more cards
          get().endSession();
          return;
        }
        set({
          currentCardIndex: state.currentCardIndex + 1,
          showAnswer: false,
        });
      },

      // Getters
      getCurrentCard: () => {
        const state = get();
        if (!state.isStudying || state.studyQueue.length === 0) return null;
        return state.studyQueue[state.currentCardIndex] || null;
      },

      getDeckById: (id) => {
        return get().decks[id] || null;
      },

      getDeckStats: (deckId) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) {
          return {
            totalCards: 0,
            newCards: 0,
            learningCards: 0,
            reviewCards: 0,
            masteredCards: 0,
            averageEaseFactor: 2.5,
            retentionRate: 0,
            streakDays: 0,
          };
        }
        const deckSessions = state.sessions.filter((s) => s.deckId === deckId);
        return calculateDeckStats(deck.cards, state.srsData, deckSessions);
      },

      getDueCardsForDeck: (deckId) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) return [];
        return getDueCards(deck.cards, state.srsData);
      },

      getNewCardsForDeck: (deckId, limit) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) return [];
        return getNewCards(deck.cards, state.srsData, limit);
      },

      getLearningCardsForDeck: (deckId) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) return [];
        return getLearningCards(deck.cards, state.srsData);
      },

      getMasteredCardsForDeck: (deckId) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) return [];
        return getMasteredCards(deck.cards, state.srsData);
      },

      getReviewForecastForDeck: (deckId, days = 7) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) return new Array(days).fill(0);
        return getReviewForecast(deck.cards, state.srsData, days);
      },

      getAllDecks: () => {
        return Object.values(get().decks).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
      },

      getSessionHistory: (deckId) => {
        const state = get();
        let sessions = state.sessions;
        if (deckId) {
          sessions = sessions.filter((s) => s.deckId === deckId);
        }
        return sessions.sort((a, b) => b.startedAt - a.startedAt);
      },

      getSRSDataForCard: (cardId) => {
        return get().srsData[cardId] || null;
      },

      // Generation
      setGenerating: (isGenerating, progress = 0) => {
        set({ isGenerating, generationProgress: progress });
      },

      // Bulk operations
      importDeck: (deck, importedSrsData = {}) => {
        const newDeckId = nanoid();
        const now = Date.now();

        // Remap card IDs
        const cardIdMap: Record<string, string> = {};
        const newCards = deck.cards.map((card) => {
          const newCardId = nanoid();
          cardIdMap[card.id] = newCardId;
          return {
            ...card,
            id: newCardId,
            deckId: newDeckId,
          };
        });

        // Remap SRS data
        const newSrsData: Record<string, SRSData> = {};
        for (const card of newCards) {
          const oldCardId = Object.keys(cardIdMap).find(
            (key) => cardIdMap[key] === card.id
          );
          if (oldCardId && importedSrsData[oldCardId]) {
            newSrsData[card.id] = {
              ...importedSrsData[oldCardId],
              cardId: card.id,
            };
          } else {
            newSrsData[card.id] = createInitialSRSData(card.id);
          }
        }

        const newDeck: FlashcardDeck = {
          ...deck,
          id: newDeckId,
          cards: newCards,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          decks: { ...state.decks, [newDeckId]: newDeck },
          srsData: { ...state.srsData, ...newSrsData },
        }));

        return newDeckId;
      },

      exportDeck: (deckId) => {
        const state = get();
        const deck = state.decks[deckId];
        if (!deck) return null;

        const deckSrsData: Record<string, SRSData> = {};
        for (const card of deck.cards) {
          if (state.srsData[card.id]) {
            deckSrsData[card.id] = state.srsData[card.id];
          }
        }

        return { deck, srsData: deckSrsData };
      },

      clearAllData: () => {
        set({
          decks: {},
          srsData: {},
          sessions: [],
          currentDeckId: null,
          currentSession: null,
          currentCardIndex: 0,
          studyQueue: [],
          isStudying: false,
          showAnswer: false,
        });
      },
    }),
    {
      name: "flashcard-storage",
      partialize: (state) => ({
        decks: state.decks,
        srsData: state.srsData,
        sessions: state.sessions.slice(-100), // Keep last 100 sessions
      }),
    }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get current study session state
 */
export function useStudySession() {
  const {
    currentSession,
    currentCardIndex,
    studyQueue,
    isStudying,
    showAnswer,
    getCurrentCard,
    nextCard,
    previousCard,
    revealAnswer,
    hideAnswer,
    rateCard,
    skipCard,
    endSession,
  } = useFlashcardStore();

  const currentCard = getCurrentCard();
  const totalCards = studyQueue.length;
  const progress =
    totalCards > 0 ? ((currentCardIndex + 1) / totalCards) * 100 : 0;
  const isComplete = currentCardIndex >= totalCards - 1 && showAnswer;

  return {
    session: currentSession,
    currentCard,
    currentIndex: currentCardIndex,
    totalCards,
    progress,
    isStudying,
    showAnswer,
    isComplete,
    actions: {
      next: nextCard,
      previous: previousCard,
      reveal: revealAnswer,
      hide: hideAnswer,
      rate: rateCard,
      skip: skipCard,
      end: endSession,
    },
  };
}

/**
 * Hook to get deck overview data
 */
export function useDeckOverview(deckId: string | null) {
  const {
    getDeckById,
    getDeckStats,
    getDueCardsForDeck,
    getNewCardsForDeck,
    getReviewForecastForDeck,
  } = useFlashcardStore();

  if (!deckId) {
    return null;
  }

  const deck = getDeckById(deckId);
  if (!deck) return null;

  const stats = getDeckStats(deckId);
  const dueCards = getDueCardsForDeck(deckId);
  const newCards = getNewCardsForDeck(deckId);
  const forecast = getReviewForecastForDeck(deckId);

  return {
    deck,
    stats,
    dueCount: dueCards.length,
    newCount: newCards.length,
    forecast,
  };
}
