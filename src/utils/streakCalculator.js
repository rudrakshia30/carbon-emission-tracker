/**
 * Streak Calculator — Tracks consecutive logging days.
 *
 * @module streakCalculator
 */

import { getLocalDateString } from './carbonCalculator';

/**
 * Calculate the current and best streak from log entries.
 * A streak is consecutive calendar days with at least one log.
 *
 * @param {Array<{date: string}>} logs - Array of log entries with ISO date strings
 * @returns {{ current: number, best: number }}
 */
export function calculateStreak(logs) {
  if (!logs || logs.length === 0) return { current: 0, best: 0 };

  // Extract unique dates (YYYY-MM-DD) and sort ascending
  const uniqueDates = [
    ...new Set(
      logs
        .map((log) => {
          if (!log.date) return null;
          return getLocalDateString(log.date);
        })
        .filter(Boolean)
    ),
  ].sort();

  if (uniqueDates.length === 0) return { current: 0, best: 0 };

  let currentStreak;
  let bestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }

    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  // Check if the latest log date is today or yesterday for "current" streak
  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
  const lastLogDate = uniqueDates[uniqueDates.length - 1];

  if (lastLogDate === today || lastLogDate === yesterday) {
    // Count backwards from the end to find the current streak
    currentStreak = 1;
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  return { current: currentStreak, best: Math.max(bestStreak, currentStreak) };
}
