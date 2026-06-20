import { describe, it, expect } from 'vitest';
import {
  calculateTransportCO2,
  calculateFoodCO2,
  calculateEnergyCO2,
  calculateShoppingCO2,
  calculateDailyTotal,
  getLocalDateString,
  getCategoryPercentages,
  getHealthScore,
  calculateBaselineScore,
  getWeeklyTotals,
  getWeeklyAverage,
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
  describe('getCategoryPercentages', () => {
    it('should calculate correct percentages', () => {
      const breakdown = { transport: 10, food: 5, energy: 3, shopping: 2, total: 20 };
      expect(getCategoryPercentages(breakdown)).toEqual({
        transport: 50,
        food: 25,
        energy: 15,
        shopping: 10,
      });
    });

    it('should return 0s if total is 0', () => {
      const breakdown = { transport: 0, food: 0, energy: 0, shopping: 0, total: 0 };
      expect(getCategoryPercentages(breakdown)).toEqual({
        transport: 0,
        food: 0,
        energy: 0,
        shopping: 0,
      });
    });
  });

  describe('getHealthScore', () => {
    it('should return a score based on national average', () => {
      // 22 kg is national average. (1 - 22/22) * 100 + 50 = 50
      expect(getHealthScore(22)).toBe(50);
      // 11 kg is half. (1 - 11/22) * 100 + 50 = 100
      expect(getHealthScore(11)).toBe(100);
      // 44 kg is double. (1 - 44/22) * 100 + 50 = -50 -> floored to 0
      expect(getHealthScore(44)).toBe(0);
    });
  });

  describe('calculateBaselineScore', () => {
    it('should correctly estimate daily baseline from user data', () => {
      const userData = {
        transport: { mode: 'car_gasoline', dailyDistanceKm: 10 }, // 10 * 0.192 = 1.92
        diet: 'vegan', // 0.4 * 3 = 1.2
        energy: { acHoursPerDay: 2, longShowers: true, energyConscious: true } // 2*1 + 1 + 0 = 3
      };
      // Total = 1.92 + 1.2 + 3 = 6.12 -> rounds to 6.1
      expect(calculateBaselineScore(userData)).toBeCloseTo(6.1);
    });
  });

  describe('Weekly Aggregations', () => {
    it('should calculate getWeeklyTotals and getWeeklyAverage accurately', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      // Use getLocalDateString to build the date prefix, appending a local time
      // so the filter in getWeeklyTotals correctly matches local date
      const todayStr = getLocalDateString(today);
      const yesterdayStr = getLocalDateString(yesterday);

      const logs = [
        { date: todayStr + 'T10:00:00', totalCO2: 10.5 },
        { date: yesterdayStr + 'T10:00:00', totalCO2: 5.5 },
        { date: yesterdayStr + 'T18:00:00', totalCO2: 4.0 }, // second log for yesterday
      ];

      const totals = getWeeklyTotals(logs);
      expect(totals.length).toBe(7); // Always returns 7 days
      
      // Last element is today
      expect(totals[6].total).toBe(10.5);
      expect(totals[6].hasLog).toBe(true);
      
      // Second to last is yesterday
      expect(totals[5].total).toBe(9.5); // 5.5 + 4.0
      expect(totals[5].hasLog).toBe(true);

      // Third to last should be empty
      expect(totals[4].total).toBe(0);
      expect(totals[4].hasLog).toBe(false);

      // Average should be (10.5 + 9.5) / 2 = 10
      expect(getWeeklyAverage(logs)).toBe(10);
    });
  });
});
