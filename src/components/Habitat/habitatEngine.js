/**
 * @fileoverview Habitat Engine — maps carbon footprint data to visual habitat state.
 *
 * This module is the bridge between raw carbon log data and the animated
 * island scene rendered by HabitatCanvas. It computes a `habitatState`
 * object that drives every visual element on the canvas: trees, flowers,
 * birds, smog, water clarity, rainbow, and overall health.
 *
 * @module habitatEngine
 */

import { getLocalDateString } from '../../utils/carbonCalculator';
import { getRegionTarget } from '../../data/regionTargets';

/** Fallback national average daily CO₂ emissions in kg (global context) */
const NATIONAL_AVG_DAILY_CO2 = 22;

/** Categories considered high-emission transport */
const HIGH_EMISSION_TRANSPORT = ['car', 'flight', 'taxi', 'rideshare', 'motorbike'];

/** Categories considered plant-based meals */
const PLANT_BASED_MEALS = ['vegan', 'vegetarian', 'plant-based', 'salad', 'fruit'];

/**
 * Computes a 7-day rolling average of daily CO₂ from log entries.
 * @param {Array<{date: string, co2: number}>} logs - Carbon log entries
 * @returns {number} Average daily CO₂ in kg
 */
function getRecentAvgCO2(logs) {
  if (!logs || logs.length === 0) return NATIONAL_AVG_DAILY_CO2;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentLogs = logs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= weekAgo && logDate <= now;
  });

  if (recentLogs.length === 0) return NATIONAL_AVG_DAILY_CO2;

  // Group by day and sum
  const dailyTotals = {};
  recentLogs.forEach((log) => {
    const dayKey = getLocalDateString(log.date);
    dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + (log.totalCO2 || log.total || 0);
  });

  const days = Object.values(dailyTotals);
  const totalCO2 = days.reduce((sum, d) => sum + d, 0);
  return totalCO2 / days.length;
}

/**
 * Counts plant-based meals logged in the past 7 days.
 * @param {Array<{date: string, category?: string, tags?: string[]}>} logs
 * @returns {number} Count of plant-based meal entries (capped at 20)
 */
function countPlantMeals(logs) {
  if (!logs || logs.length === 0) return 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let flowerCount = 0;

  logs.forEach((log) => {
    const logDate = new Date(log.date);
    if (logDate < weekAgo || logDate > now) return;

    if (log.meals && Array.isArray(log.meals)) {
      log.meals.forEach((meal) => {
        const mealType = (meal.type || '').toLowerCase();
        if (PLANT_BASED_MEALS.some((m) => mealType.includes(m))) {
          flowerCount++;
        }
      });
    }
  });

  return Math.min(flowerCount, 20);
}

/**
 * Calculates the proportion of high-emission transport in recent logs.
 * @param {Array<{category?: string, type?: string}>} logs
 * @returns {number} Proportion between 0 and 1
 */
function calculateSmogLevel(logs) {
  if (!logs || logs.length === 0) return 0.3;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentLogs = logs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= weekAgo && logDate <= now;
  });

  if (recentLogs.length === 0) return 0.3;

  let highEmissionDays = 0;
  let totalTransportDays = 0;

  recentLogs.forEach((log) => {
    const transportObj = log.rawTransport || log.transport;
    if (transportObj) {
      if (Array.isArray(transportObj)) {
        transportObj.forEach((t) => {
          if (t && t.mode && t.mode !== 'none') {
            totalTransportDays++;
            const mode = t.mode.toLowerCase();
            const isHigh = HIGH_EMISSION_TRANSPORT.some((h) => mode.includes(h)) || mode === 'airplane' || mode === 'motorcycle';
            if (isHigh) {
              highEmissionDays++;
            }
          }
        });
      } else if (typeof transportObj === 'object' && transportObj.mode && transportObj.mode !== 'none') {
        totalTransportDays++;
        const mode = transportObj.mode.toLowerCase();
        const isHigh = HIGH_EMISSION_TRANSPORT.some((h) => mode.includes(h)) || mode === 'airplane' || mode === 'motorcycle';
        if (isHigh) {
          highEmissionDays++;
        }
      }
    }
  });

  if (totalTransportDays === 0) return 0.1;
  return highEmissionDays / totalTransportDays;
}

/**
 * Takes user's carbon log data and streak count, returns a habitatState
 * object that drives every visual element on the HabitatCanvas.
 *
 * @param {Array<Object>} logs - Array of carbon log entries
 * @param {number} streakCount - Number of consecutive days the user has logged
 * @param {string} [region='global'] - User's selected region ID for region-aware health scoring
 * @returns {Object} habitatState — the full visual state for HabitatCanvas
 *
 * @example
 * const state = calculateHabitatState(userLogs, 10, 'india');
 * // => { healthScore: 78, trees: 11, flowers: 5, birds: 3, ... }
 */
export function calculateHabitatState(logs = [], streakCount = 0, region = 'global') {
  const avgCO2 = getRecentAvgCO2(logs);

  // Use region-specific daily target for health score calculation
  // This ensures Indian users aren't penalised against a 22kg global baseline
  const regionalTarget = getRegionTarget(region) || NATIONAL_AVG_DAILY_CO2;

  // Health score: 100 means pristine (zero emissions), 0 means heavy polluter
  // Formula: 100 - (avgDailyCO2 / regionalTarget * 50), clamped 0-100
  const rawHealth = 100 - (avgCO2 / regionalTarget) * 50;
  const healthScore = Math.max(0, Math.min(100, Math.round(rawHealth)));

  // Trees: 0-14 based on health score
  const trees = Math.min(15, Math.floor(healthScore / 7));

  // Flowers: count of plant-based meals this week (0-20)
  const flowers = countPlantMeals(logs);

  // Birds: appear when healthScore > 60, scale with score
  const birds = healthScore > 60 ? Math.min(5, Math.floor((healthScore - 60) / 8)) : 0;

  // Smog: driven by high-emission transport proportion
  const smogLevel = calculateSmogLevel(logs);

  // Water clarity: inverse of smog
  const waterClarity = Math.max(0, Math.min(1, 1 - smogLevel));

  // Rainbow: streak bonus at 7+ days
  const hasRainbow = streakCount >= 7;

  // Particles: populated by triggerEffect, starts empty
  const particles = [];

  return {
    healthScore,
    trees,
    flowers,
    birds,
    smogLevel,
    waterClarity,
    hasRainbow,
    particles,
  };
}

/**
 * Generates a human-readable narrative description of the current habitat state.
 * This text can be fed to an AI for story generation or displayed as a status message.
 *
 * @param {Object} habitatState - The habitat state object from calculateHabitatState
 * @returns {string} A descriptive paragraph about the habitat
 *
 * @example
 * const narrative = getHabitatNarrative(state);
 * // => "Your island is thriving! 11 tall trees sway in the breeze..."
 */
export function getHabitatNarrative(habitatState) {
  const { healthScore, trees, flowers, birds, smogLevel, waterClarity, hasRainbow } =
    habitatState || {};

  const parts = [];

  // Overall mood
  if (healthScore >= 80) {
    parts.push(
      'Your island is thriving — a lush paradise full of life and color.'
    );
  } else if (healthScore >= 60) {
    parts.push(
      'Your island looks healthy, with greenery spreading across the terrain.'
    );
  } else if (healthScore >= 40) {
    parts.push(
      'Your island is recovering. Some areas are green, but others still need care.'
    );
  } else if (healthScore >= 20) {
    parts.push(
      'Your island is struggling. The landscape looks sparse and tired.'
    );
  } else {
    parts.push(
      'Your island is in distress — the air is thick and the ground is barren.'
    );
  }

  // Trees
  if (trees > 10) {
    parts.push(`${trees} tall trees form a dense canopy, swaying gently in the breeze.`);
  } else if (trees > 5) {
    parts.push(`${trees} trees dot the landscape, their green crowns catching the light.`);
  } else if (trees > 0) {
    parts.push(`A few small trees — ${trees} in total — are beginning to take root.`);
  } else {
    parts.push('No trees grow here yet. The island awaits new life.');
  }

  // Flowers
  if (flowers > 10) {
    parts.push(`Wildflowers carpet the ground — ${flowers} colorful blooms dance in the wind.`);
  } else if (flowers > 0) {
    parts.push(`${flowers} delicate flowers have sprouted among the grass.`);
  }

  // Birds
  if (birds > 3) {
    parts.push(`A flock of ${birds} birds soars overhead, filling the air with song.`);
  } else if (birds > 0) {
    parts.push(`${birds} bird${birds > 1 ? 's circle' : ' circles'} lazily above the island.`);
  }

  // Atmosphere
  if (smogLevel > 0.6) {
    parts.push('A heavy haze hangs over the water, dimming the sunlight.');
  } else if (smogLevel > 0.3) {
    parts.push('A thin mist lingers in the air, but the sky is starting to clear.');
  } else {
    parts.push('The air is crystal clear, and sunlight sparkles on the water.');
  }

  // Water
  if (waterClarity > 0.7) {
    parts.push('The surrounding ocean is a brilliant, clear blue.');
  } else if (waterClarity > 0.4) {
    parts.push('The water has a slight greenish tint but is mostly clear.');
  } else {
    parts.push('The waters are murky and dark, clouded by runoff.');
  }

  // Rainbow
  if (hasRainbow) {
    parts.push(
      'A radiant rainbow arcs across the sky — a reward for your dedication!'
    );
  }

  return parts.join(' ');
}

/**
 * Returns the default habitat state used when no log data is available.
 * Shows a moderately healthy island to welcome new users.
 *
 * @returns {Object} Default habitatState
 */
export function getDefaultHabitatState() {
  return {
    healthScore: 50,
    trees: 7,
    flowers: 3,
    birds: 1,
    smogLevel: 0.2,
    waterClarity: 0.8,
    hasRainbow: false,
    particles: [],
  };
}
