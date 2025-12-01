/**
 * Tests for SRS (Spaced Repetition System) Algorithm
 */

import {
  calculateSM2,
  createInitialSRSData,
  getDueCards,
  getNewCards,
  getLearningCards,
  getMasteredCards,
  sortByUrgency,
  getStudyQueue,
  calculateDeckStats,
  getReviewForecast,
  estimateReviewTime,
  getNextReviewText,
  getQualityFromLabel,
  getIntervalPreview,
} from "./srs-algorithm";
import type { SRSData, Flashcard } from "../types";

// Helper to create mock flashcard
function createMockCard(
  id: string,
  overrides: Partial<Flashcard> = {}
): Flashcard {
  return {
    id,
    deckId: "deck-1",
    type: "qa",
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    front: "Question",
    back: "Answer",
    ...overrides,
  } as Flashcard;
}

// Helper to create mock SRS data
function createMockSRSData(
  cardId: string,
  overrides: Partial<SRSData> = {}
): SRSData {
  return {
    cardId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: Date.now(),
    totalReviews: 0,
    correctReviews: 0,
    ...overrides,
  };
}

describe("srs-algorithm", () => {
  describe("calculateSM2", () => {
    it("should increase interval on correct response (quality >= 3)", () => {
      const initialData = createMockSRSData("card-1", {
        repetitions: 2,
        interval: 6,
        easeFactor: 2.5,
      });

      const result = calculateSM2(4, initialData);

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBeGreaterThan(initialData.interval);
      expect(result.totalReviews).toBe(1);
      expect(result.correctReviews).toBe(1);
    });

    it("should reset on incorrect response (quality < 3)", () => {
      const initialData = createMockSRSData("card-1", {
        repetitions: 5,
        interval: 30,
        easeFactor: 2.5,
      });

      const result = calculateSM2(2, initialData);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.totalReviews).toBe(1);
      expect(result.correctReviews).toBe(0);
    });

    it("should set first interval to 1 day for new cards", () => {
      const initialData = createMockSRSData("card-1", {
        repetitions: 0,
        interval: 0,
      });

      const result = calculateSM2(4, initialData);

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("should set second interval to 6 days", () => {
      const initialData = createMockSRSData("card-1", {
        repetitions: 1,
        interval: 1,
      });

      const result = calculateSM2(4, initialData);

      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("should not decrease ease factor below minimum (1.3)", () => {
      const initialData = createMockSRSData("card-1", {
        easeFactor: 1.4,
        repetitions: 3,
        interval: 10,
      });

      // Quality 0 should decrease ease factor significantly
      const result = calculateSM2(0, initialData);

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("should increase ease factor on perfect response (quality 5)", () => {
      const initialData = createMockSRSData("card-1", {
        easeFactor: 2.5,
        repetitions: 2,
        interval: 6,
      });

      const result = calculateSM2(5, initialData);

      expect(result.easeFactor).toBeGreaterThan(initialData.easeFactor);
    });

    it("should set nextReviewDate in the future", () => {
      const initialData = createMockSRSData("card-1");
      const before = Date.now();

      const result = calculateSM2(4, initialData);

      expect(result.nextReviewDate).toBeGreaterThan(before);
      expect(result.lastReviewDate).toBeGreaterThanOrEqual(before);
    });
  });

  describe("createInitialSRSData", () => {
    it("should create initial SRS data with correct defaults", () => {
      const data = createInitialSRSData("card-123");

      expect(data.cardId).toBe("card-123");
      expect(data.easeFactor).toBe(2.5);
      expect(data.interval).toBe(0);
      expect(data.repetitions).toBe(0);
      expect(data.totalReviews).toBe(0);
      expect(data.correctReviews).toBe(0);
      expect(data.nextReviewDate).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("getDueCards", () => {
    it("should return cards that are due for review", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const srsDataMap: Record<string, SRSData> = {
        "card-1": createMockSRSData("card-1", {
          nextReviewDate: Date.now() - 1000,
        }),
        "card-2": createMockSRSData("card-2", {
          nextReviewDate: Date.now() + 100000,
        }),
        "card-3": createMockSRSData("card-3", {
          nextReviewDate: Date.now() - 5000,
        }),
      };

      const dueCards = getDueCards(cards, srsDataMap);

      expect(dueCards).toHaveLength(2);
      expect(dueCards.map((c) => c.id)).toContain("card-1");
      expect(dueCards.map((c) => c.id)).toContain("card-3");
    });

    it("should include new cards (no SRS data) as due", () => {
      const cards = [createMockCard("new-card")];
      const srsDataMap: Record<string, SRSData> = {};

      const dueCards = getDueCards(cards, srsDataMap);

      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].id).toBe("new-card");
    });
  });

  describe("getNewCards", () => {
    it("should return cards that have never been reviewed", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const srsDataMap: Record<string, SRSData> = {
        "card-1": createMockSRSData("card-1", { totalReviews: 0 }),
        "card-2": createMockSRSData("card-2", { totalReviews: 5 }),
      };

      const newCards = getNewCards(cards, srsDataMap);

      expect(newCards).toHaveLength(2);
      expect(newCards.map((c) => c.id)).toContain("card-1");
      expect(newCards.map((c) => c.id)).toContain("card-3");
    });

    it("should respect limit parameter", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const newCards = getNewCards(cards, {}, 2);

      expect(newCards).toHaveLength(2);
    });
  });

  describe("getLearningCards", () => {
    it("should return cards in learning phase (interval < 21 days)", () => {
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const srsDataMap: Record<string, SRSData> = {
        "card-1": createMockSRSData("card-1", {
          totalReviews: 3,
          interval: 10,
        }),
        "card-2": createMockSRSData("card-2", {
          totalReviews: 5,
          interval: 30,
        }),
        "card-3": createMockSRSData("card-3", { totalReviews: 0, interval: 0 }),
      };

      const learningCards = getLearningCards(cards, srsDataMap);

      expect(learningCards).toHaveLength(1);
      expect(learningCards[0].id).toBe("card-1");
    });
  });

  describe("getMasteredCards", () => {
    it("should return cards with 5+ consecutive correct reviews", () => {
      const cards = [createMockCard("card-1"), createMockCard("card-2")];

      const srsDataMap: Record<string, SRSData> = {
        "card-1": createMockSRSData("card-1", { repetitions: 5 }),
        "card-2": createMockSRSData("card-2", { repetitions: 3 }),
      };

      const masteredCards = getMasteredCards(cards, srsDataMap);

      expect(masteredCards).toHaveLength(1);
      expect(masteredCards[0].id).toBe("card-1");
    });
  });

  describe("sortByUrgency", () => {
    it("should sort cards by how overdue they are", () => {
      const now = Date.now();
      const cards = [
        createMockCard("card-1"),
        createMockCard("card-2"),
        createMockCard("card-3"),
      ];

      const srsDataMap: Record<string, SRSData> = {
        "card-1": createMockSRSData("card-1", { nextReviewDate: now - 1000 }),
        "card-2": createMockSRSData("card-2", { nextReviewDate: now - 5000 }),
        "card-3": createMockSRSData("card-3", { nextReviewDate: now - 2000 }),
      };

      const sorted = sortByUrgency(cards, srsDataMap);

      expect(sorted[0].id).toBe("card-2"); // Most overdue
      expect(sorted[1].id).toBe("card-3");
      expect(sorted[2].id).toBe("card-1"); // Least overdue
    });

    it("should prioritize new cards (no SRS data)", () => {
      const cards = [createMockCard("old-card"), createMockCard("new-card")];

      const srsDataMap: Record<string, SRSData> = {
        "old-card": createMockSRSData("old-card", {
          nextReviewDate: Date.now() - 10000,
        }),
      };

      const sorted = sortByUrgency(cards, srsDataMap);

      expect(sorted[0].id).toBe("new-card");
    });
  });

  describe("getStudyQueue", () => {
    it("should return a mixed queue of new and review cards", () => {
      const cards = [
        createMockCard("new-1"),
        createMockCard("new-2"),
        createMockCard("review-1"),
        createMockCard("review-2"),
      ];

      const srsDataMap: Record<string, SRSData> = {
        "review-1": createMockSRSData("review-1", {
          totalReviews: 5,
          nextReviewDate: Date.now() - 1000,
        }),
        "review-2": createMockSRSData("review-2", {
          totalReviews: 3,
          nextReviewDate: Date.now() - 2000,
        }),
      };

      const queue = getStudyQueue(cards, srsDataMap, {
        newCardsLimit: 10,
        reviewLimit: 10,
      });

      expect(queue.length).toBeGreaterThan(0);
    });
  });

  describe("calculateDeckStats", () => {
    it("should calculate deck statistics correctly", () => {
      const cards = [
        createMockCard("new-card"),
        createMockCard("learning-card"),
        createMockCard("mastered-card"),
      ];

      const srsDataMap: Record<string, SRSData> = {
        "learning-card": createMockSRSData("learning-card", {
          totalReviews: 3,
          correctReviews: 2,
          interval: 10,
          repetitions: 2,
          easeFactor: 2.5,
        }),
        "mastered-card": createMockSRSData("mastered-card", {
          totalReviews: 10,
          correctReviews: 9,
          interval: 60,
          repetitions: 6,
          easeFactor: 2.7,
        }),
      };

      const sessions = [
        {
          startedAt: Date.now() - 86400000,
          completedAt: Date.now() - 86400000 + 600000,
        },
      ];

      const stats = calculateDeckStats(cards, srsDataMap, sessions);

      expect(stats.totalCards).toBe(3);
      expect(stats.newCards).toBe(1);
      expect(stats.masteredCards).toBe(1);
      expect(stats.retentionRate).toBeGreaterThan(0);
    });

    it("should handle empty deck", () => {
      const stats = calculateDeckStats([], {}, []);

      expect(stats.totalCards).toBe(0);
      expect(stats.retentionRate).toBe(0);
      expect(stats.averageEaseFactor).toBe(2.5);
    });
  });

  describe("getReviewForecast", () => {
    it("should return forecast for next N days", () => {
      const cards = [createMockCard("1"), createMockCard("2")];

      const srsDataMap: Record<string, SRSData> = {
        "1": createMockSRSData("1", { nextReviewDate: Date.now() - 86400000 }), // Overdue
        "2": createMockSRSData("2", {
          nextReviewDate: Date.now() + 2 * 86400000,
        }), // Due in 2 days
      };

      const forecast = getReviewForecast(cards, srsDataMap, 7);

      expect(forecast).toHaveLength(7);
      expect(forecast[0]).toBe(1); // Overdue card counts for today
      // Card due in 2 days - check that it's counted somewhere in the forecast
      expect(forecast.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(2);
    });
  });

  describe("estimateReviewTime", () => {
    it("should estimate time in minutes", () => {
      const time = estimateReviewTime(20, 15);

      expect(time).toBe(5); // 20 cards * 15 seconds = 300 seconds = 5 minutes
    });

    it("should use default seconds per card", () => {
      const time = estimateReviewTime(4);

      expect(time).toBe(1); // 4 cards * 15 seconds = 60 seconds = 1 minute
    });
  });

  describe("getNextReviewText", () => {
    it('should return "Due now" for past dates', () => {
      const text = getNextReviewText(Date.now() - 1000);
      expect(text).toBe("Due now");
    });

    it("should return days format for future dates", () => {
      const twoDaysFromNow = Date.now() + 2 * 24 * 60 * 60 * 1000;
      const text = getNextReviewText(twoDaysFromNow);
      expect(text).toBe("In 2 days");
    });

    it("should return hours format", () => {
      const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;
      const text = getNextReviewText(twoHoursFromNow);
      expect(text).toBe("In 2 hours");
    });

    it("should return minutes format", () => {
      const tenMinutesFromNow = Date.now() + 10 * 60 * 1000;
      const text = getNextReviewText(tenMinutesFromNow);
      expect(text).toBe("In 10 minutes");
    });
  });

  describe("getQualityFromLabel", () => {
    it("should map labels to quality values", () => {
      expect(getQualityFromLabel("again")).toBe(0);
      expect(getQualityFromLabel("hard")).toBe(3);
      expect(getQualityFromLabel("good")).toBe(4);
      expect(getQualityFromLabel("easy")).toBe(5);
    });
  });

  describe("getIntervalPreview", () => {
    it("should return preview intervals for all ratings", () => {
      const srsData = createMockSRSData("card-1", {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      const preview = getIntervalPreview(srsData);

      expect(preview).toHaveProperty("again");
      expect(preview).toHaveProperty("hard");
      expect(preview).toHaveProperty("good");
      expect(preview).toHaveProperty("easy");
      // 'again' should reset to 1 day
      expect(preview.again).toBe("1d");
    });
  });
});
