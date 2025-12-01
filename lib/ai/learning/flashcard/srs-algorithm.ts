/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * The SM-2 algorithm was developed by Piotr Wozniak for SuperMemo in 1987.
 * It calculates optimal review intervals based on how well the user remembers each card.
 *
 * Quality ratings:
 * 0 - Complete blackout, no recall
 * 1 - Incorrect response, but upon seeing the answer remembered
 * 2 - Incorrect response, but the answer seemed easy to recall
 * 3 - Correct response with serious difficulty
 * 4 - Correct response after some hesitation
 * 5 - Perfect response with no hesitation
 */

import type { SRSData, SRSQuality, DeckStats, Flashcard } from "../types";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const FIRST_INTERVAL = 1; // 1 day
const SECOND_INTERVAL = 6; // 6 days

// Card is considered "mastered" after this many consecutive correct reviews
const MASTERY_THRESHOLD = 5;

// Card is considered "learning" if interval is less than this many days
const LEARNING_THRESHOLD = 21;

// ============================================================================
// Core Algorithm
// ============================================================================

/**
 * Calculate the next SRS data based on the quality of the response
 */
export function calculateSM2(
  quality: SRSQuality,
  currentData: SRSData
): SRSData {
  const { easeFactor, interval, repetitions } = currentData;
  const now = Date.now();

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = FIRST_INTERVAL;
    } else if (newRepetitions === 1) {
      newInterval = SECOND_INTERVAL;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions++;
  } else {
    // Incorrect response - reset to beginning
    newRepetitions = 0;
    newInterval = FIRST_INTERVAL;
  }

  // Update ease factor based on quality
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure ease factor doesn't go below minimum
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  // Calculate next review date
  const nextReviewDate = now + newInterval * 24 * 60 * 60 * 1000;

  return {
    ...currentData,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
    lastReviewDate: now,
    totalReviews: currentData.totalReviews + 1,
    correctReviews: currentData.correctReviews + (quality >= 3 ? 1 : 0),
  };
}

/**
 * Create initial SRS data for a new card
 */
export function createInitialSRSData(cardId: string): SRSData {
  return {
    cardId,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewDate: Date.now(), // Due immediately
    totalReviews: 0,
    correctReviews: 0,
  };
}

// ============================================================================
// Card Selection
// ============================================================================

/**
 * Get cards that are due for review
 */
export function getDueCards(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>
): Flashcard[] {
  const now = Date.now();
  return cards.filter((card) => {
    const srsData = srsDataMap[card.id];
    if (!srsData) return true; // New cards are always due
    return srsData.nextReviewDate <= now;
  });
}

/**
 * Get new cards (cards that have never been reviewed)
 */
export function getNewCards(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>,
  limit?: number
): Flashcard[] {
  const newCards = cards.filter((card) => {
    const srsData = srsDataMap[card.id];
    return !srsData || srsData.totalReviews === 0;
  });

  if (limit) {
    return newCards.slice(0, limit);
  }
  return newCards;
}

/**
 * Get cards currently in learning phase (interval < 21 days)
 */
export function getLearningCards(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>
): Flashcard[] {
  return cards.filter((card) => {
    const srsData = srsDataMap[card.id];
    if (!srsData) return false;
    return srsData.totalReviews > 0 && srsData.interval < LEARNING_THRESHOLD;
  });
}

/**
 * Get cards that are mastered (5+ consecutive correct reviews)
 */
export function getMasteredCards(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>
): Flashcard[] {
  return cards.filter((card) => {
    const srsData = srsDataMap[card.id];
    if (!srsData) return false;
    return srsData.repetitions >= MASTERY_THRESHOLD;
  });
}

/**
 * Sort cards by urgency (most overdue first)
 */
export function sortByUrgency(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>
): Flashcard[] {
  const now = Date.now();
  return [...cards].sort((a, b) => {
    const aData = srsDataMap[a.id];
    const bData = srsDataMap[b.id];

    // New cards have highest priority
    if (!aData && bData) return -1;
    if (aData && !bData) return 1;
    if (!aData && !bData) return 0;

    // More overdue = higher priority
    const aOverdue = now - aData.nextReviewDate;
    const bOverdue = now - bData.nextReviewDate;
    return bOverdue - aOverdue;
  });
}

/**
 * Get a study queue with mixed new and review cards
 */
export function getStudyQueue(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>,
  options: {
    newCardsLimit?: number;
    reviewLimit?: number;
    interleaveFactor?: number; // How often to show new cards vs reviews
  } = {}
): Flashcard[] {
  const {
    newCardsLimit = 20,
    reviewLimit = 100,
    interleaveFactor = 5, // 1 new card every 5 cards
  } = options;

  const newCards = getNewCards(cards, srsDataMap, newCardsLimit);
  const dueCards = getDueCards(cards, srsDataMap)
    .filter((card) => {
      const srsData = srsDataMap[card.id];
      return srsData && srsData.totalReviews > 0;
    })
    .slice(0, reviewLimit);

  const sortedDueCards = sortByUrgency(dueCards, srsDataMap);
  const queue: Flashcard[] = [];

  let newIndex = 0;
  let reviewIndex = 0;
  let counter = 0;

  while (newIndex < newCards.length || reviewIndex < sortedDueCards.length) {
    // Interleave new cards based on factor
    if (
      newIndex < newCards.length &&
      (counter % interleaveFactor === 0 || reviewIndex >= sortedDueCards.length)
    ) {
      queue.push(newCards[newIndex]);
      newIndex++;
    } else if (reviewIndex < sortedDueCards.length) {
      queue.push(sortedDueCards[reviewIndex]);
      reviewIndex++;
    }
    counter++;
  }

  return queue;
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>,
  sessions: Array<{ startedAt: number; completedAt?: number }>
): DeckStats {
  const totalCards = cards.length;
  const now = Date.now();

  let newCards = 0;
  let learningCards = 0;
  let reviewCards = 0;
  let masteredCards = 0;
  let totalEaseFactor = 0;
  let totalCorrect = 0;
  let totalReviews = 0;

  for (const card of cards) {
    const srsData = srsDataMap[card.id];

    if (!srsData || srsData.totalReviews === 0) {
      newCards++;
    } else if (srsData.repetitions >= MASTERY_THRESHOLD) {
      masteredCards++;
      totalEaseFactor += srsData.easeFactor;
    } else if (srsData.interval < LEARNING_THRESHOLD) {
      learningCards++;
      totalEaseFactor += srsData.easeFactor;
    } else {
      reviewCards++;
      totalEaseFactor += srsData.easeFactor;
    }

    if (srsData) {
      totalCorrect += srsData.correctReviews;
      totalReviews += srsData.totalReviews;
    }
  }

  // Calculate retention rate
  const retentionRate =
    totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;

  // Calculate average ease factor (only for cards with reviews)
  const cardsWithReviews = totalCards - newCards;
  const averageEaseFactor =
    cardsWithReviews > 0
      ? totalEaseFactor / cardsWithReviews
      : DEFAULT_EASE_FACTOR;

  // Calculate streak days
  const streakDays = calculateStreakDays(sessions);

  return {
    totalCards,
    newCards,
    learningCards,
    reviewCards,
    masteredCards,
    averageEaseFactor,
    retentionRate,
    streakDays,
  };
}

/**
 * Calculate consecutive days of study
 */
function calculateStreakDays(
  sessions: Array<{ startedAt: number; completedAt?: number }>
): number {
  if (sessions.length === 0) return 0;

  // Sort sessions by date
  const sortedSessions = [...sessions].sort(
    (a, b) => b.startedAt - a.startedAt
  );

  // Get unique study days
  const studyDays = new Set<string>();
  for (const session of sortedSessions) {
    const date = new Date(session.startedAt).toDateString();
    studyDays.add(date);
  }

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  // Check if studied today or yesterday
  if (!studyDays.has(today) && !studyDays.has(yesterday)) {
    return 0;
  }

  // Count consecutive days backward
  let streak = 0;
  let currentDate = studyDays.has(today)
    ? new Date()
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  while (studyDays.has(currentDate.toDateString())) {
    streak++;
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

/**
 * Calculate review forecast for next N days
 */
export function getReviewForecast(
  cards: Flashcard[],
  srsDataMap: Record<string, SRSData>,
  days: number = 7
): number[] {
  const forecast: number[] = new Array(days).fill(0);
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  for (const card of cards) {
    const srsData = srsDataMap[card.id];
    if (!srsData) {
      // New cards are due today
      forecast[0]++;
      continue;
    }

    const daysUntilDue = Math.floor((srsData.nextReviewDate - now) / msPerDay);
    if (daysUntilDue >= 0 && daysUntilDue < days) {
      forecast[daysUntilDue]++;
    } else if (daysUntilDue < 0) {
      // Overdue cards count for today
      forecast[0]++;
    }
  }

  return forecast;
}

/**
 * Estimate time to complete reviews
 */
export function estimateReviewTime(
  cardCount: number,
  averageSecondsPerCard: number = 15
): number {
  return Math.ceil((cardCount * averageSecondsPerCard) / 60); // minutes
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a human-readable description of the next review time
 */
export function getNextReviewText(nextReviewDate: number): string {
  const now = Date.now();
  const diff = nextReviewDate - now;

  if (diff <= 0) return "Due now";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `In ${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `In ${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `In ${minutes} minute${minutes > 1 ? "s" : ""}`;
  return "Due soon";
}

/**
 * Get quality rating from user-friendly button labels
 */
export function getQualityFromLabel(
  label: "again" | "hard" | "good" | "easy"
): SRSQuality {
  switch (label) {
    case "again":
      return 0;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
    default:
      return 3;
  }
}

/**
 * Get expected interval change for each rating
 */
export function getIntervalPreview(
  currentData: SRSData
): Record<"again" | "hard" | "good" | "easy", string> {
  const previewData = (quality: SRSQuality) => {
    const result = calculateSM2(quality, currentData);
    return formatInterval(result.interval);
  };

  return {
    again: previewData(0),
    hard: previewData(3),
    good: previewData(4),
    easy: previewData(5),
  };
}

/**
 * Format interval in days to human-readable string
 */
function formatInterval(days: number): string {
  if (days < 1) return "<1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
