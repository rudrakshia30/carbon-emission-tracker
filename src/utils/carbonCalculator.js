/**
 * Carbon Calculator Utilities
 * 
 * Pure functions for computing carbon scores from activity logs.
 */

import { EMISSION_FACTORS, NATIONAL_AVG_DAILY_CO2 } from '../data/emissionFactors';
import { REGION_TARGETS } from '../data/regionTargets';

export const DEMO_BASELINE_SCORE = 22.5;

/**
 * Maps grid intensity for a region to a carbon intensity multiplier.
 * @param {string} regionId
 * @returns {number}
 */
export function getGridMultiplier(regionId) {
  const intensity = REGION_TARGETS[regionId]?.gridIntensity || 'medium';
  if (intensity === 'low') return 0.5;
  if (intensity === 'high') return 1.5;
  return 1.0;
}

/**
 * Calculate CO2 from a single transport entry
 * @param {string} mode - Transport mode key
 * @param {number} distanceKm - Distance in km
 * @returns {number} kg CO2e
 */
export function calculateTransportCO2(mode, distanceKm) {
  const factor = EMISSION_FACTORS.transportation[mode] ?? 0;
  return Math.round((factor * distanceKm) * 100) / 100;
}

/**
 * Calculate CO2 from meals
 * @param {Array<{type: string}>} meals - Array of meal objects
 * @returns {number} kg CO2e
 */
export function calculateFoodCO2(meals) {
  if (!meals || !meals.length) return 0;
  const total = meals.reduce((sum, meal) => {
    const factor = EMISSION_FACTORS.food[meal.type] ?? 0;
    return sum + factor;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculate CO2 from energy usage
 * @param {Object} energy - Energy usage data
 * @param {number} [multiplier=1.0] - grid intensity multiplier
 * @returns {number} kg CO2e
 */
export function calculateEnergyCO2(energy, multiplier = 1.0) {
  if (!energy) return 0;
  let total = 0;
  if (energy.ac) total += energy.ac * EMISSION_FACTORS.energy.ac_per_hour;
  if (energy.heating) total += energy.heating * EMISSION_FACTORS.energy.heating_per_hour;
  if (energy.shower) total += 8 * EMISSION_FACTORS.energy.hot_shower_per_minute; // assume 8 min long shower
  if (energy.laundry) total += EMISSION_FACTORS.energy.laundry_per_load;
  if (energy.dishwasher) total += EMISSION_FACTORS.energy.dishwasher_per_cycle;
  return Math.round(total * multiplier * 100) / 100;
}

/**
 * Calculate CO2 from shopping
 * @param {Object} shopping - Shopping data with item counts
 * @returns {number} kg CO2e
 */
export function calculateShoppingCO2(shopping) {
  if (!shopping) return 0;
  let total = 0;
  if (shopping.clothing) total += shopping.clothing * EMISSION_FACTORS.shopping.new_clothing_item;
  if (shopping.electronics) total += shopping.electronics * EMISSION_FACTORS.shopping.electronics_smartphone;
  if (shopping.groceriesLocal) total += shopping.groceriesLocal * EMISSION_FACTORS.shopping.groceries_local;
  if (shopping.groceriesImported) total += shopping.groceriesImported * EMISSION_FACTORS.shopping.groceries_imported;
  if (shopping.onlineOrders) total += shopping.onlineOrders * EMISSION_FACTORS.shopping.online_order_with_shipping;
  return Math.round(total * 100) / 100;
}

/**
 * Maps common UI transport modes to internal emission factor keys.
 * @param {string} modeKey
 * @returns {string}
 */
function normalizeTransportMode(modeKey) {
  const mapping = {
    walk: 'walking',
    bike: 'bicycle',
    train: 'train_metro',
    car: 'car_gasoline',
  };
  return mapping[modeKey] || modeKey;
}

/**
 * Calculate total CO2 for a daily log entry
 * @param {Object} logEntry - Complete log entry
 * @param {string} [region='global'] - User's selected region
 * @returns {Object} Breakdown by category and total
 */
export function calculateDailyTotal(logEntry, region = 'global') {
  let transport = 0;
  if (logEntry.transport) {
    if (Array.isArray(logEntry.transport)) {
      transport = logEntry.transport.reduce((sum, t) => {
        const modeKey = normalizeTransportMode(t.mode);
        return sum + calculateTransportCO2(modeKey, t.distanceKm);
      }, 0);
    } else {
      const modeKey = normalizeTransportMode(logEntry.transport.mode);
      transport = calculateTransportCO2(modeKey, logEntry.transport.distanceKm);
    }
  }
  const food = calculateFoodCO2(logEntry.meals);
  const gridMultiplier = getGridMultiplier(region);
  const energy = calculateEnergyCO2(logEntry.energy, gridMultiplier);
  const shopping = calculateShoppingCO2(logEntry.shopping);
  const total = Math.round((transport + food + energy + shopping) * 100) / 100;

  return { transport, food, energy, shopping, total };
}

/**
 * Calculate category breakdown as percentages
 * @param {Object} breakdown - { transport, food, energy, shopping, total }
 * @returns {Object} Percentages for each category
 */
export function getCategoryPercentages(breakdown) {
  if (breakdown.total === 0) {
    return { transport: 0, food: 0, energy: 0, shopping: 0 };
  }
  return {
    transport: Math.round((breakdown.transport / breakdown.total) * 100),
    food: Math.round((breakdown.food / breakdown.total) * 100),
    energy: Math.round((breakdown.energy / breakdown.total) * 100),
    shopping: Math.round((breakdown.shopping / breakdown.total) * 100),
  };
}

/**
 * Calculate the user's baseline daily CO2 from onboarding quiz
 * @param {Object} userData - Onboarding quiz results
 * @returns {number} Estimated daily CO2 in kg
 */
export function calculateBaselineScore(userData) {
  let total = 0;

  // Transport
  if (userData.transport) {
    const factor = EMISSION_FACTORS.transportation[userData.transport.mode] ?? 0;
    total += factor * (userData.transport.dailyDistanceKm || 0);
  }

  // Diet (3 meals per day)
  const dietFactors = {
    omnivore: 3.6,    // avg of meat meals
    flexitarian: 2.5,  // mix of meat and veg
    vegetarian: 0.7,
    vegan: 0.4,
  };
  total += (dietFactors[userData.diet] || 2.5) * 3;

  // Energy
  if (userData.energy) {
    total += (userData.energy.acHoursPerDay || 0) * EMISSION_FACTORS.energy.ac_per_hour;
    if (userData.energy.longShowers) total += 1.0;
    if (!userData.energy.energyConscious) total += 2.0;
  }

  return Math.round(total * 10) / 10;
}

/**
 * Get the health percentage compared to national average
 * @param {number} dailyCO2 - User's daily CO2 in kg
 * @returns {number} 0-100 health score (100 = much better than average)
 */
export function getHealthScore(dailyCO2) {
  const ratio = dailyCO2 / NATIONAL_AVG_DAILY_CO2;
  const score = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100 + 50)));
  return score;
}

/**
 * Get the week's daily totals
 * @param {Array} logs - All log entries
 * @returns {Array<{date: string, total: number}>} Last 7 days
 */
export function getWeeklyTotals(logs) {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = getLocalDateString(date);

    const dayLogs = logs.filter(
      (log) => log.date && getLocalDateString(log.date) === dateStr
    );

    const total = dayLogs.reduce((sum, log) => sum + (log.totalCO2 || 0), 0);

    days.push({
      date: dateStr,
      dayName: date.toLocaleDateString('en', { weekday: 'short' }),
      total: Math.round(total * 10) / 10,
      hasLog: dayLogs.length > 0,
    });
  }

  return days;
}

/**
 * Calculate the overall weekly average
 * @param {Array} logs - All log entries
 * @returns {number} Average daily CO2 this week
 */
export function getWeeklyAverage(logs) {
  const weeklyTotals = getWeeklyTotals(logs);
  const daysWithData = weeklyTotals.filter((d) => d.hasLog);
  if (daysWithData.length === 0) return 0;
  const avg = daysWithData.reduce((s, d) => s + d.total, 0) / daysWithData.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Format a Date object (or date string) to local YYYY-MM-DD format.
 * Prevents timezone shift issues.
 * @param {Date|string} [date]
 * @returns {string} YYYY-MM-DD
 */
export function getLocalDateString(date) {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
