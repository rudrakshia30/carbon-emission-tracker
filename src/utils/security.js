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
    .replace(/[&<>'"]/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#x27;',
      '"': '&quot;',
    }[c]))
    .trim()
    .slice(0, maxLength);
}

/**
 * Decode common HTML entities back to their original characters for display.
 * @param {string} str
 * @returns {string}
 */
export function decodeEntities(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&(amp|lt|gt|quot|#x27);/g, (match, entity) => {
    const map = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      '#x27': "'",
    };
    return map[entity] || match;
  });
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
  'train', 'train_metro', 'bicycle', 'bike', 'walking', 'walk', 'motorcycle', 'ride_share', 'airplane'];
const ALLOWED_TABS = ['habitat', 'log', 'dashboard', 'leaderboard', 'suggestions'];
export const ALLOWED_REGIONS = ['india', 'europe', 'usa', 'china', 'uk', 'australia', 'brazil', 'global'];

/**
 * Validate and sanitize the persisted state object loaded from localStorage.
 * Returns null if the object is structurally invalid (possible tampering).
 * @param {*} raw - Parsed JSON from localStorage
 * @returns {object|null}
 */
export function validatePersistedState(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;

  try {
    // 1. Validate user name (strictly alphanumeric/spaces/dashes/underscores)
    const rawName = raw.user && typeof raw.user.name === 'string' ? raw.user.name : '';
    const cleanName = rawName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().slice(0, MAX_NAME_LENGTH);

    const user = {
      name: cleanName,
      baselineScore: clampNumber(raw.user?.baselineScore, 0, 200, 22),
      region: ALLOWED_REGIONS.includes(raw.user?.region) ? raw.user.region : 'global',
      transport: {
        mode: ALLOWED_TRANSPORT_MODES.includes(raw.user?.transport?.mode)
          ? raw.user.transport.mode
          : 'car',
        dailyDistanceKm: clampNumber(raw.user?.transport?.dailyDistanceKm, 0, 500, 10),
      },
      diet: ALLOWED_DIET_VALUES.includes(raw.user?.diet) ? raw.user.diet : 'omnivore',
      energy: {
        acHoursPerDay: clampNumber(raw.user?.energy?.acHoursPerDay, 0, 24, 2),
        longShowers: !!raw.user?.energy?.longShowers,
        energyConscious: !!raw.user?.energy?.energyConscious,
      },
    };

    // 2. Validate logs array — cap entries and deeply sanitize each log structure
    let logs = [];
    if (Array.isArray(raw.logs)) {
      logs = raw.logs
        .slice(-MAX_LOG_ENTRIES)
        .filter((l) => typeof l === 'object' && l !== null)
        .map((l) => {
          // Validate rawTransport array
          const rawTransport = Array.isArray(l.rawTransport)
            ? l.rawTransport
              .filter((t) => typeof t === 'object' && t !== null)
              .map((t) => ({
                mode: ALLOWED_TRANSPORT_MODES.includes(t.mode) ? t.mode : 'car',
                distanceKm: clampNumber(t.distanceKm, 0, 10000, 0),
              }))
            : [];

          // Validate meals array
          const meals = Array.isArray(l.meals)
            ? l.meals
              .filter((m) => typeof m === 'object' && m !== null)
              .map((m) => ({
                type: sanitizeString(m.type, 50),
                meal: ['breakfast', 'lunch', 'dinner'].includes(m.meal) ? m.meal : 'breakfast',
              }))
            : [];

          // Validate rawEnergy object
          const rawEnergy = typeof l.rawEnergy === 'object' && l.rawEnergy !== null
            ? {
              ac: clampNumber(l.rawEnergy.ac, 0, 24, 0),
              heating: clampNumber(l.rawEnergy.heating, 0, 24, 0),
              shower: !!l.rawEnergy.shower,
              laundry: !!l.rawEnergy.laundry,
              dishwasher: !!l.rawEnergy.dishwasher,
            }
            : { ac: 0, heating: 0, shower: false, laundry: false, dishwasher: false };

          // Validate rawShopping object
          const rawShopping = typeof l.rawShopping === 'object' && l.rawShopping !== null
            ? Object.fromEntries(
              Object.entries(l.rawShopping).map(([k, v]) => [
                sanitizeString(k, 50),
                clampNumber(v, 0, 100, 0),
              ])
            )
            : {};

          return {
            id: typeof l.id === 'string' ? sanitizeString(l.id, 50) : Date.now().toString(),
            // Keep plain YYYY-MM-DD strings as-is (avoid UTC-parsing them which shifts date in negative timezones)
            // Also accept full ISO timestamps. Anything else falls back to today.
            date: typeof l.date === 'string' && (
              /^\d{4}-\d{2}-\d{2}$/.test(l.date) || !isNaN(Date.parse(l.date))
            )
              ? l.date
              : new Date().toISOString(),
            totalCO2: clampNumber(l.totalCO2, 0, 10000, 0),
            transport: clampNumber(l.transport, 0, 5000, 0),
            food: clampNumber(l.food, 0, 5000, 0),
            energy: clampNumber(l.energy, 0, 5000, 0),
            shopping: clampNumber(l.shopping, 0, 5000, 0),
            rawTransport,
            meals,
            rawEnergy,
            rawShopping,
          };
        });
    }

    // 3. Validate habitat state
    let habitat;
    if (raw.habitat && typeof raw.habitat === 'object') {
      habitat = {
        healthScore: clampNumber(raw.habitat.healthScore, 0, 100, 50),
        trees: clampNumber(raw.habitat.trees, 0, 100, 3),
        flowers: clampNumber(raw.habitat.flowers, 0, 100, 0),
        birds: clampNumber(raw.habitat.birds, 0, 100, 0),
        smogLevel: clampNumber(raw.habitat.smogLevel, 0, 1, 0.3),
        waterClarity: clampNumber(raw.habitat.waterClarity, 0, 1, 0.7),
        hasRainbow: !!raw.habitat.hasRainbow,
        particles: [],
      };
    } else {
      habitat = {
        healthScore: 50,
        trees: 3,
        flowers: 0,
        birds: 0,
        smogLevel: 0.3,
        waterClarity: 0.7,
        hasRainbow: false,
        particles: [],
      };
    }

    // 4. Validate streaks
    const streaks = {
      current: clampNumber(raw.streaks?.current, 0, 3650, 0),
      best: clampNumber(raw.streaks?.best, 0, 3650, 0),
    };

    // 5. Validate weeklyInsights
    let weeklyInsights = [];
    if (Array.isArray(raw.weeklyInsights)) {
      weeklyInsights = raw.weeklyInsights
        .filter((ins) => typeof ins === 'object' && ins !== null)
        .map((ins) => ({
          text: sanitizeString(ins.text, 500),
          icon: sanitizeString(ins.icon, 10),
          type: ['positive', 'warning', 'tip'].includes(ins.type) ? ins.type : 'tip',
        }));
    }

    // 6. Validate activeTab
    const activeTab = ALLOWED_TABS.includes(raw.activeTab) ? raw.activeTab : 'habitat';

    // 7. Validate unlockedBadges array
    const ALLOWED_BADGES = [
      'first_log', 'streak_3', 'streak_7', 'forest', 'cyclist',
      'plant_power', 'energy_saver', 'under_target', 'half_target'
    ];
    let unlockedBadges = [];
    if (Array.isArray(raw.unlockedBadges)) {
      unlockedBadges = raw.unlockedBadges
        .filter((b) => typeof b === 'string' && ALLOWED_BADGES.includes(b));
    }

    // 8. Reconstruct clean, validated state
    return {
      onboarded: !!raw.onboarded,
      user,
      logs,
      habitat,
      streaks,
      weeklyInsights,
      activeTab,
      unlockedBadges,
    };
  } catch {
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
