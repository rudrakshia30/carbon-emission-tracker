import { describe, it, expect } from 'vitest';
import { calculateStreak } from './streakCalculator';

describe('Streak Calculator Utility', () => {
  it('should return 0 current and best streak for empty logs', () => {
    expect(calculateStreak([])).toEqual({ current: 0, best: 0 });
    expect(calculateStreak(null)).toEqual({ current: 0, best: 0 });
  });

  it('should calculate streak of 1 if user logged only today', () => {
    const logs = [{ date: new Date() }];
    expect(calculateStreak(logs)).toEqual({ current: 1, best: 1 });
  });

  it('should calculate streak of 1 if user logged only yesterday', () => {
    const logs = [{ date: new Date(Date.now() - 86400000) }];
    expect(calculateStreak(logs)).toEqual({ current: 1, best: 1 });
  });

  it('should return 0 current streak if last log was 2 days ago, but maintain best streak', () => {
    const logs = [{ date: new Date(Date.now() - 2 * 86400000) }];
    expect(calculateStreak(logs)).toEqual({ current: 0, best: 1 });
  });

  it('should calculate active consecutive day streaks ending today', () => {
    const logs = [
      { date: new Date(Date.now() - 2 * 86400000) },
      { date: new Date(Date.now() - 86400000) },
      { date: new Date() },
    ];
    expect(calculateStreak(logs)).toEqual({ current: 3, best: 3 });
  });

  it('should correctly handle multiple entries logged on the same day', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const logs = [
      { date: yesterday }, // yesterday
      { date: yesterday }, // yesterday duplicate
      { date: today }, // today
      { date: today }, // today duplicate
    ];
    expect(calculateStreak(logs)).toEqual({ current: 2, best: 2 });
  });

  it('should identify historic best streaks when the current streak is broken', () => {
    const logs = [
      // 3-day streak
      { date: new Date(Date.now() - 5 * 86400000) },
      { date: new Date(Date.now() - 4 * 86400000) },
      { date: new Date(Date.now() - 3 * 86400000) },
      // gap on 2 days ago
      // 2-day current streak
      { date: new Date(Date.now() - 86400000) },
      { date: new Date() },
    ];

    expect(calculateStreak(logs)).toEqual({ current: 2, best: 3 });
  });
});
