import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  sanitizeString,
  decodeEntities,
  clampNumber,
  validatePersistedState,
  storeApiKey,
  getApiKey,
  clearApiKey,
  MAX_NAME_LENGTH,
} from './security';

describe('Security Utilities', () => {
  // ── sanitizeString ────────────────────────────────────────────────────────
  describe('sanitizeString', () => {
    it('escapes HTML tags and special characters in input', () => {
      expect(sanitizeString('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('escapes < and > characters', () => {
      expect(sanitizeString('Hello <World>')).toBe('Hello &lt;World&gt;');
    });

    it('escapes single and double quotes and ampersands', () => {
      expect(sanitizeString(`say "hi" & 'bye'`)).toBe('say &quot;hi&quot; &amp; &#x27;bye&#x27;');
    });

    it('truncates to maxLength', () => {
      const long = 'a'.repeat(300);
      expect(sanitizeString(long, 50).length).toBe(50);
    });

    it('respects MAX_NAME_LENGTH constant', () => {
      expect(MAX_NAME_LENGTH).toBe(50);
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
  });

  // ── decodeEntities ────────────────────────────────────────────────────────
  describe('decodeEntities', () => {
    it('decodes HTML entities back to characters', () => {
      expect(decodeEntities('&lt;script&gt;')).toBe('<script>');
      expect(decodeEntities('Hello &lt;World&gt;')).toBe('Hello <World>');
      expect(decodeEntities('say &quot;hi&quot; &amp; &#x27;bye&#x27;')).toBe(`say "hi" & 'bye'`);
    });

    it('returns empty string for non-string input', () => {
      expect(decodeEntities(null)).toBe('');
      expect(decodeEntities(undefined)).toBe('');
    });
  });

  // ── clampNumber ────────────────────────────────────────────────────────────
  describe('clampNumber', () => {
    it('clamps value below min', () => {
      expect(clampNumber(-5, 0, 100)).toBe(0);
    });

    it('clamps value above max', () => {
      expect(clampNumber(999, 0, 100)).toBe(100);
    });

    it('passes valid values through', () => {
      expect(clampNumber(42, 0, 100)).toBe(42);
    });

    it('returns fallback for NaN', () => {
      expect(clampNumber('abc', 0, 100, 50)).toBe(50);
    });

    it('returns fallback for Infinity', () => {
      expect(clampNumber(Infinity, 0, 100, 10)).toBe(10);
    });
  });

  // ── validatePersistedState ────────────────────────────────────────────────
  describe('validatePersistedState', () => {
    it('returns null for non-object inputs', () => {
      expect(validatePersistedState(null)).toBeNull();
      expect(validatePersistedState('string')).toBeNull();
      expect(validatePersistedState([])).toBeNull();
    });

    it('sanitizes user name field', () => {
      const raw = {
        user: { name: '<script>evil</script>', baselineScore: 22, transport: { mode: 'car', dailyDistanceKm: 10 }, diet: 'vegan', energy: {} },
        logs: [],
        activeTab: 'habitat',
        streaks: { current: 3, best: 5 },
      };
      const result = validatePersistedState(raw);
      expect(result.user.name).not.toContain('<');
      expect(result.user.name).not.toContain('>');
    });

    it('rejects unknown diet values and replaces with omnivore', () => {
      const raw = {
        user: { name: 'Test', baselineScore: 22, diet: 'carnivore', transport: { mode: 'car', dailyDistanceKm: 10 }, energy: {} },
        logs: [],
        activeTab: 'habitat',
        streaks: { current: 0, best: 0 },
      };
      const result = validatePersistedState(raw);
      expect(result.user.diet).toBe('omnivore');
    });

    it('rejects invalid transport mode and defaults to car', () => {
      const raw = {
        user: { name: 'Test', baselineScore: 22, diet: 'vegan', transport: { mode: 'hovercraft', dailyDistanceKm: 10 }, energy: {} },
        logs: [],
        activeTab: 'habitat',
        streaks: { current: 0, best: 0 },
      };
      const result = validatePersistedState(raw);
      expect(result.user.transport.mode).toBe('car');
    });

    it('rejects invalid activeTab', () => {
      const raw = {
        user: { name: 'Test', baselineScore: 22, diet: 'vegan', transport: { mode: 'car', dailyDistanceKm: 5 }, energy: {} },
        logs: [],
        activeTab: 'evil-tab',
        streaks: { current: 0, best: 0 },
      };
      const result = validatePersistedState(raw);
      expect(result.activeTab).toBe('habitat');
    });

    it('caps CO2 values in logs to prevent injection of extreme numbers', () => {
      const raw = {
        user: { name: 'T', baselineScore: 22, diet: 'vegan', transport: { mode: 'car', dailyDistanceKm: 5 }, energy: {} },
        logs: [{ date: new Date().toISOString(), totalCO2: 999999, transport: 0, food: 0, energy: 0, shopping: 0 }],
        activeTab: 'habitat',
        streaks: { current: 0, best: 0 },
      };
      const result = validatePersistedState(raw);
      expect(result.logs[0].totalCO2).toBe(10000); // capped at max
    });
  });

  // ── API Key sessionStorage ────────────────────────────────────────────────
  describe('storeApiKey / getApiKey / clearApiKey', () => {
    beforeEach(() => clearApiKey());
    afterEach(() => clearApiKey());

    it('stores and retrieves a key from sessionStorage', () => {
      storeApiKey('AIzaTestKey123456789012345678901234567');
      expect(getApiKey()).toBe('AIzaTestKey123456789012345678901234567');
    });

    it('ignores empty strings', () => {
      storeApiKey('');
      expect(getApiKey()).toBe('');
    });

    it('clears the key', () => {
      storeApiKey('AIzaSomeKey');
      clearApiKey();
      expect(getApiKey()).toBe('');
    });

    it('ignores non-string input', () => {
      storeApiKey(null);
      expect(getApiKey()).toBe('');
    });
  });
});
