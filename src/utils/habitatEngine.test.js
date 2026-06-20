import { describe, it, expect } from 'vitest';
import { calculateHabitatState, getHabitatNarrative } from '../components/Habitat/habitatEngine';

describe('Habitat Engine', () => {
  describe('calculateHabitatState', () => {
    it('returns a low-health state when CO2 is very high', () => {
      const logs = [
        { date: new Date().toISOString(), totalCO2: 80 },
      ];
      const state = calculateHabitatState(logs, 0);
      expect(state.healthScore).toBeLessThan(50);
      // smogLevel is proportional — just verify it's non-zero for high CO2
      expect(state.smogLevel).toBeGreaterThan(0);
    });

    it('returns a healthy green state when CO2 is very low', () => {
      const logs = [
        { date: new Date().toISOString(), totalCO2: 2 },
      ];
      const state = calculateHabitatState(logs, 0);
      expect(state.healthScore).toBeGreaterThan(70);
      expect(state.waterClarity).toBeGreaterThan(0.5);
    });

    it('gives a rainbow when streak is >= 7', () => {
      const logs = [{ date: new Date().toISOString(), totalCO2: 5 }];
      const state = calculateHabitatState(logs, 7);
      expect(state.hasRainbow).toBe(true);
    });

    it('has no rainbow when streak is below 7', () => {
      const logs = [{ date: new Date().toISOString(), totalCO2: 5 }];
      const state = calculateHabitatState(logs, 3);
      expect(state.hasRainbow).toBe(false);
    });

    it('returns valid state object for empty logs', () => {
      const state = calculateHabitatState([], 0);
      expect(state).toHaveProperty('healthScore');
      expect(state).toHaveProperty('trees');
      expect(state).toHaveProperty('smogLevel');
      expect(state).toHaveProperty('waterClarity');
      expect(state).toHaveProperty('hasRainbow');
    });

    it('counts plant-based meals as flowers', () => {
      const logs = [
        {
          date: new Date().toISOString(),
          totalCO2: 5,
          meals: [{ type: 'vegan' }, { type: 'vegetarian' }],
        },
      ];
      const state = calculateHabitatState(logs, 0);
      expect(state.flowers).toBeGreaterThan(0);
    });
  });

  describe('getHabitatNarrative', () => {
    it('returns a non-empty string for a healthy habitat', () => {
      const state = {
        healthScore: 75,
        trees: 10,
        flowers: 5,
        birds: 2,
        smogLevel: 0.1,
        waterClarity: 0.9,
        hasRainbow: false,
      };
      const narrative = getHabitatNarrative(state);
      expect(typeof narrative).toBe('string');
      expect(narrative.length).toBeGreaterThan(0);
    });

    it('returns a non-empty string for a polluted habitat', () => {
      const state = {
        healthScore: 20,
        trees: 1,
        flowers: 0,
        birds: 0,
        smogLevel: 0.9,
        waterClarity: 0.1,
        hasRainbow: false,
      };
      const narrative = getHabitatNarrative(state);
      expect(narrative.length).toBeGreaterThan(0);
    });
  });
});
