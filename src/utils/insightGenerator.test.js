import { describe, it, expect } from 'vitest';
import { generateInsights } from './insightGenerator';
import { getLocalDateString } from './carbonCalculator';

const today = getLocalDateString();
const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getLocalDateString(d); })();
const threeDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 3); return getLocalDateString(d); })();

describe('Insight Generator', () => {
  it('returns a starter tip when logs are empty', () => {
    const result = generateInsights([], 22);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('tip');
    expect(result[0].text).toMatch(/start logging/i);
  });

  it('returns a warning when no logs in the last 7 days', () => {
    // Log from 10 days ago — outside the weekly window
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const logs = [{ date: oldDate.toISOString(), totalCO2: 10 }];
    const result = generateInsights(logs, 22);
    expect(result[0].type).toBe('warning');
    expect(result[0].text).toMatch(/haven't logged/i);
  });

  it('flags transport as dominant when it exceeds 50% of total CO2', () => {
    const logs = [
      { date: today, totalCO2: 20, transport: 15, food: 3, energy: 2, shopping: 0 },
    ];
    const result = generateInsights(logs, 22);
    const transportInsight = result.find((i) => i.icon === '🚗');
    expect(transportInsight).toBeDefined();
    expect(transportInsight.type).toBe('warning');
    expect(transportInsight.text).toMatch(/transport/i);
  });

  it('praises plant-based meals when >50% of meals are plant-based', () => {
    const logs = [
      {
        date: today,
        totalCO2: 5,
        transport: 0, food: 5, energy: 0, shopping: 0,
        meals: [
          { type: 'vegetarian' },
          { type: 'vegan' },
          { type: 'vegetarian' },
        ],
      },
    ];
    const result = generateInsights(logs, 22);
    const mealInsight = result.find((i) => i.icon === '🥗');
    expect(mealInsight).toBeDefined();
    expect(mealInsight.type).toBe('positive');
  });

  it('shows improvement insight when recent logs are better than earlier', () => {
    const logs = [
      { date: threeDaysAgo, totalCO2: 30, transport: 20, food: 10, energy: 0, shopping: 0 },
      { date: threeDaysAgo, totalCO2: 28, transport: 18, food: 10, energy: 0, shopping: 0 },
      { date: yesterday, totalCO2: 8, transport: 3, food: 5, energy: 0, shopping: 0 },
      { date: today, totalCO2: 6, transport: 2, food: 4, energy: 0, shopping: 0 },
    ];
    const result = generateInsights(logs, 22);
    const improvInsight = result.find((i) => i.icon === '📈');
    expect(improvInsight).toBeDefined();
    expect(improvInsight.type).toBe('positive');
  });

  it('shows "below national average" trophy when daily average is good', () => {
    const logs = [
      { date: today, totalCO2: 8, transport: 0, food: 8, energy: 0, shopping: 0 },
    ];
    const result = generateInsights(logs, 22);
    const trophyInsight = result.find((i) => i.icon === '🏆');
    expect(trophyInsight).toBeDefined();
    expect(trophyInsight.type).toBe('positive');
  });

  it('returns at most 3 insights', () => {
    const logs = [
      { date: today, totalCO2: 5, transport: 0, food: 5, energy: 0, shopping: 0 },
    ];
    const result = generateInsights(logs, 22);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
