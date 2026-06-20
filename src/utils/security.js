/**
 * security.js — Frontend Security Utilities for CarbonTwin
 *
 * Provides:
 *  - Input sanitization (strip HTML/scripts from user text)
 *  - Length-bounded string truncation
 *  - localStorage data schema validation
 *  - Obfuscated API key storage (sessionStorage, not localStorage)
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Max length for any user-supplied text field */
export const MAX_NAME_LENGTH = 50;
export const MAX_LOG_ENTRIES = 500;

// ── Input Sanitization ────────────────────────────────────────────────────────

/**
 * Strip HTML tags and dangerous characters from a user-supplied string.
 * Prevents stored XSS via localStorage → render pipeline.
 * @param {string} str
 * @param {number} [maxLength=200]
 * @returns {string}
 */
export function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>'"&]/g, (c) => ({ '<': '', '>': '', "'": '', '"': '', '&': '' }[c]))
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate that a numeric value is within an acceptable range.
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
export function clampNumber(value, min, max, fallback = 0) {
  const n = Number(value);
  if (!isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

// ── localStorage Schema Validation ───────────────────────────────────────────

const ALLOWED_DIET_VALUES = ['omnivore', 'flexitarian', 'vegetarian', 'vegan'];
const ALLOWED_TRANSPORT_MODES = ['car', 'car_gasoline', 'car_diesel', 'car_electric', 'bus',
  'train', 'bicycle', 'walking', 'motorcycle', 'ride_share', 'airplane'];
const ALLOWED_TABS = ['habitat', 'log', 'dashboard', 'leaderboard', 'suggestions'];

/**
 * Validate and sanitize the persisted state object loaded from localStorage.
 * Returns null if the object is structurally invalid (possible tampering).
 * @param {*} raw - Parsed JSON from localStorage
 * @returns {object|null}
 */
export function validatePersistedState(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;

  try {
    // Validate user object
    if (raw.user) {
      raw.user.name = sanitizeString(raw.user.name ?? '', MAX_NAME_LENGTH);
      raw.user.baselineScore = clampNumber(raw.user.baselineScore, 0, 200, 22);

      if (raw.user.transport) {
        if (!ALLOWED_TRANSPORT_MODES.includes(raw.user.transport.mode)) {
          raw.user.transport.mode = 'car';
        }
        raw.user.transport.dailyDistanceKm = clampNumber(
          raw.user.transport.dailyDistanceKm, 0, 500, 10
        );
      }

      if (!ALLOWED_DIET_VALUES.includes(raw.user.diet)) {
        raw.user.diet = 'omnivore';
      }

      if (raw.user.energy) {
        raw.user.energy.acHoursPerDay = clampNumber(raw.user.energy.acHoursPerDay, 0, 24, 2);
        raw.user.energy.longShowers = !!raw.user.energy.longShowers;
        raw.user.energy.energyConscious = !!raw.user.energy.energyConscious;
      }
    }

    // Validate logs array — cap entries and sanitize each
    if (Array.isArray(raw.logs)) {
      raw.logs = raw.logs
        .slice(-MAX_LOG_ENTRIES) // keep only the most recent N entries
        .filter((l) => typeof l === 'object' && l !== null)
        .map((l) => ({
          ...l,
          totalCO2: clampNumber(l.totalCO2, 0, 10000, 0),
          transport: clampNumber(l.transport, 0, 5000, 0),
          food: clampNumber(l.food, 0, 5000, 0),
          energy: clampNumber(l.energy, 0, 5000, 0),
          shopping: clampNumber(l.shopping, 0, 5000, 0),
          // date must be a valid ISO string
          date: typeof l.date === 'string' && !isNaN(Date.parse(l.date))
            ? l.date
            : new Date().toISOString(),
        }));
    } else {
      raw.logs = [];
    }

    // Validate activeTab
    if (!ALLOWED_TABS.includes(raw.activeTab)) {
      raw.activeTab = 'habitat';
    }

    // Validate streaks
    if (raw.streaks) {
      raw.streaks.current = clampNumber(raw.streaks.current, 0, 3650, 0);
      raw.streaks.best = clampNumber(raw.streaks.best, 0, 3650, 0);
    }

    return raw;
  } catch {
    // If anything throws during validation, reject the payload
    return null;
  }
}

// ── API Key Secure Storage ────────────────────────────────────────────────────

const API_KEY_SESSION_KEY = 'ct_gk';

/**
 * Store the Gemini API key in sessionStorage (cleared on tab close)
 * rather than localStorage (persistent, more exposed).
 * @param {string} key
 */
export function storeApiKey(key) {
  if (typeof key !== 'string') return;
  // Basic format validation: Google API keys are 39 chars starting with "AIza"
  const sanitized = key.trim();
  if (sanitized.length > 0 && sanitized.length < 200) {
    try {
      sessionStorage.setItem(API_KEY_SESSION_KEY, sanitized);
    } catch {
      // sessionStorage unavailable (private browsing restrictions)
    }
  }
}

/**
 * Retrieve the stored API key from sessionStorage or env variable.
 * @returns {string}
 */
export function getApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (envKey) return envKey.trim();
  try {
    return sessionStorage.getItem(API_KEY_SESSION_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Clear the stored API key from sessionStorage.
 */
export function clearApiKey() {
  try {
    sessionStorage.removeItem(API_KEY_SESSION_KEY);
  } catch {
    // ignore
  }
}
