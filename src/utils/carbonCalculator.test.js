import { describe, it, expect } from 'vitest';
import {
  calculateTransportCO2,
  calculateFoodCO2,
  calculateEnergyCO2,
  calculateShoppingCO2,
  calculateDailyTotal,
  getLocalDateString,
} from './carbonCalculator';

describe('Carbon Calculator Utilities', () => {
  describe('calculateTransportCO2', () => {
    it('should correctly calculate emissions for gasoline cars', () => {
      expect(calculateTransportCO2('car_gasoline', 10)).toBe(1.92);
      expect(calculateTransportCO2('car_gasoline', 0)).toBe(0);
    });

    it('should return 0 emissions for walking and cycling', () => {
      expect(calculateTransportCO2('bicycle', 20)).toBe(0);
      expect(calculateTransportCO2('walking', 5)).toBe(0);
    });

    it('should correctly calculate public transit and flight emissions', () => {
      expect(calculateTransportCO2('bus', 15)).toBe(1.34); // 0.089 * 15 = 1.335 rounded to 1.34
      expect(calculateTransportCO2('train_metro', 50)).toBe(2.05); // 0.041 * 50 = 2.05
    });
  });

  describe('calculateFoodCO2', () => {
    it('should return 0 for empty meals array', () => {
      expect(calculateFoodCO2([])).toBe(0);
      expect(calculateFoodCO2(null)).toBe(0);
    });

    it('should sum up different meal types correctly', () => {
      const meals = [
        { type: 'beef_meal' },      // 7.2
        { type: 'vegetarian_meal' }, // 0.7
        { type: 'vegan_meal' },      // 0.4
      ];
      expect(calculateFoodCO2(meals)).toBe(8.3);
    });
  });

  describe('calculateEnergyCO2', () => {
    it('should return 0 for no energy usage', () => {
      expect(calculateEnergyCO2(null)).toBe(0);
    });

    it('should calculate AC and heating usage properly', () => {
      expect(calculateEnergyCO2({ ac: 3 })).toBe(3); // 3 hrs * 1.0 = 3
      expect(calculateEnergyCO2({ heating: 2 })).toBe(3); // 2 hrs * 1.5 = 3
    });

    it('should calculate other appliance and shower impacts', () => {
      const energy = {
        ac: 1,         // 1.0
        shower: true,  // 0.8 (8 minutes * 0.1)
        laundry: true, // 0.6
      };
      expect(calculateEnergyCO2(energy)).toBe(2.4);
    });
  });

  describe('calculateShoppingCO2', () => {
    it('should calculate emissions for manufactured goods', () => {
      const shopping = {
        clothing: 2,    // 2 * 10 = 20
        electronics: 1, // 1 * 70 = 70
      };
      expect(calculateShoppingCO2(shopping)).toBe(90);
    });
  });

  describe('calculateDailyTotal', () => {
    it('should sum up all categories correctly', () => {
      const log = {
        transport: { mode: 'car', distanceKm: 25 }, // car_gasoline: 0.192 * 25 = 4.8
        meals: [{ type: 'chicken_meal' }, { type: 'vegan_meal' }], // 1.8 + 0.4 = 2.2
        energy: { ac: 2 }, // 2 * 1.0 = 2.0
        shopping: { clothing: 1 }, // 10.0
      };

      const breakdown = calculateDailyTotal(log);
      expect(breakdown.transport).toBe(4.8);
      expect(breakdown.food).toBe(2.2);
      expect(breakdown.energy).toBe(2.0);
      expect(breakdown.shopping).toBe(10.0);
      expect(breakdown.total).toBe(19.0);
    });
  });

  describe('getLocalDateString', () => {
    it('should return correct format YYYY-MM-DD for arbitrary date strings', () => {
      const dateStr = '2026-06-20T12:00:00Z';
      // Checks local date conversion
      const localString = getLocalDateString(dateStr);
      expect(localString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should format today correctly when called with no arguments', () => {
      const todayStr = getLocalDateString();
      expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
