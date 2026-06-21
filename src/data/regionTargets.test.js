import { describe, it, expect } from 'vitest';
import {
  REGION_TARGETS,
  REGION_ORDER,
  getRegionTarget,
  getRegionAverage,
} from './regionTargets';

describe('regionTargets data module', () => {
  describe('REGION_TARGETS object', () => {
    it('should export all 8 regions', () => {
      expect(Object.keys(REGION_TARGETS)).toHaveLength(8);
    });

    it('should include all expected region IDs', () => {
      const ids = ['india', 'europe', 'usa', 'china', 'uk', 'australia', 'brazil', 'global'];
      ids.forEach((id) => {
        expect(REGION_TARGETS).toHaveProperty(id);
      });
    });

    it('each region should have required fields', () => {
      Object.entries(REGION_TARGETS).forEach(([id, region]) => {
        expect(region, `${id} should have label`).toHaveProperty('label');
        expect(region, `${id} should have flag`).toHaveProperty('flag');
        expect(region, `${id} should have dailyTargetKg`).toHaveProperty('dailyTargetKg');
        expect(region, `${id} should have currentAvgKg`).toHaveProperty('currentAvgKg');
        expect(region, `${id} should have source`).toHaveProperty('source');
        expect(typeof region.dailyTargetKg).toBe('number');
        expect(typeof region.currentAvgKg).toBe('number');
        expect(region.dailyTargetKg).toBeGreaterThan(0);
        expect(region.currentAvgKg).toBeGreaterThan(0);
      });
    });

    it('India should have the lowest daily target', () => {
      const targets = Object.values(REGION_TARGETS).map((r) => r.dailyTargetKg);
      expect(REGION_TARGETS.india.dailyTargetKg).toBe(Math.min(...targets));
    });

    it('USA should have the highest current average', () => {
      const avgs = Object.values(REGION_TARGETS).map((r) => r.currentAvgKg);
      expect(REGION_TARGETS.usa.currentAvgKg).toBe(Math.max(...avgs));
    });
  });

  describe('REGION_ORDER', () => {
    it('should export an ordered array of all 8 region IDs', () => {
      expect(REGION_ORDER).toHaveLength(8);
      REGION_ORDER.forEach((id) => {
        expect(REGION_TARGETS).toHaveProperty(id);
      });
    });
  });

  describe('getRegionTarget()', () => {
    it('should return the correct daily target for India', () => {
      expect(getRegionTarget('india')).toBe(5.6);
    });

    it('should return the correct daily target for USA', () => {
      expect(getRegionTarget('usa')).toBe(15.6);
    });

    it('should return global target for unknown region ID', () => {
      expect(getRegionTarget('atlantis')).toBe(REGION_TARGETS.global.dailyTargetKg);
    });

    it('should return global target for empty string', () => {
      expect(getRegionTarget('')).toBe(REGION_TARGETS.global.dailyTargetKg);
    });

    it('should return global target for undefined', () => {
      expect(getRegionTarget(undefined)).toBe(REGION_TARGETS.global.dailyTargetKg);
    });
  });

  describe('getRegionAverage()', () => {
    it('should return the correct current average for UK', () => {
      expect(getRegionAverage('uk')).toBe(14.2);
    });

    it('should return the correct current average for Brazil', () => {
      expect(getRegionAverage('brazil')).toBe(7.9);
    });

    it('should return global average for unknown region ID', () => {
      expect(getRegionAverage('narnia')).toBe(REGION_TARGETS.global.currentAvgKg);
    });

    it('should return global average for null', () => {
      expect(getRegionAverage(null)).toBe(REGION_TARGETS.global.currentAvgKg);
    });
  });
});
