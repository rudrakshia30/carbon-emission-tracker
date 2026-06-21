/**
 * regionTargets.js — Region-specific daily carbon targets for CarbonTwin
 *
 * Sources:
 *   - IEA World Energy Outlook 2024
 *   - Climate Action Tracker national profiles
 *   - IPCC AR6 WG3 — per-capita budget breakdowns by region
 *   - Our World in Data — CO2 per capita (2023)
 *
 * All values represent a DAILY per-capita CO2e target (kg/day)
 * based on the pathway to stay within 1.5°C warming by 2050.
 */

/** @type {Record<string, {label: string, flag: string, dailyTargetKg: number, currentAvgKg: number, source: string}>} */
export const REGION_TARGETS = {
  india: {
    label: 'India',
    flag: '🇮🇳',
    dailyTargetKg: 5.6,
    currentAvgKg: 5.6,
    gridIntensity: 'high',   // ~0.82 kg CO2/kWh (CEA 2023)
    source: 'IEA 2024 — India per-capita',
  },
  europe: {
    label: 'Europe (EU)',
    flag: '🇪🇺',
    dailyTargetKg: 13.7,
    currentAvgKg: 17.3,
    gridIntensity: 'medium', // ~0.28 kg CO2/kWh (Eurostat 2023)
    source: 'Climate Action Tracker — EU average',
  },
  usa: {
    label: 'United States',
    flag: '🇺🇸',
    dailyTargetKg: 15.6,
    currentAvgKg: 43.8,
    gridIntensity: 'medium', // ~0.38 kg CO2/kWh (EIA 2023)
    source: 'EPA — US per-capita 2023',
  },
  china: {
    label: 'China',
    flag: '🇨🇳',
    dailyTargetKg: 8.2,
    currentAvgKg: 19.7,
    gridIntensity: 'high',   // ~0.58 kg CO2/kWh (NEA 2023)
    source: 'IEA 2024 — China per-capita',
  },
  uk: {
    label: 'United Kingdom',
    flag: '🇬🇧',
    dailyTargetKg: 11.0,
    currentAvgKg: 14.2,
    gridIntensity: 'low',    // ~0.21 kg CO2/kWh (DESNZ 2023)
    source: 'DEFRA GHG Inventory 2024',
  },
  australia: {
    label: 'Australia',
    flag: '🇦🇺',
    dailyTargetKg: 14.8,
    currentAvgKg: 41.9,
    gridIntensity: 'high',   // ~0.60 kg CO2/kWh (AEMO 2023)
    source: 'DCCEEW — Australia per-capita',
  },
  brazil: {
    label: 'Brazil',
    flag: '🇧🇷',
    dailyTargetKg: 6.0,
    currentAvgKg: 7.9,
    gridIntensity: 'low',    // ~0.08 kg CO2/kWh (EPE 2023, hydro-heavy)
    source: 'IEA 2024 — Brazil per-capita',
  },
  global: {
    label: 'Global Average',
    flag: '🌍',
    dailyTargetKg: 11.0,
    currentAvgKg: 11.0,
    gridIntensity: 'medium',
    source: 'IPCC AR6 — global per-capita 1.5°C pathway',
  },
};

/** Ordered list of region IDs for display */
export const REGION_ORDER = ['india', 'europe', 'usa', 'china', 'uk', 'australia', 'brazil', 'global'];

/**
 * Get the daily carbon target for a given region.
 * @param {string} regionId
 * @returns {number} kg CO2e/day
 */
export function getRegionTarget(regionId) {
  return REGION_TARGETS[regionId]?.dailyTargetKg ?? REGION_TARGETS.global.dailyTargetKg;
}

/**
 * Get the current average emissions for a given region.
 * @param {string} regionId
 * @returns {number} kg CO2e/day
 */
export function getRegionAverage(regionId) {
  return REGION_TARGETS[regionId]?.currentAvgKg ?? REGION_TARGETS.global.currentAvgKg;
}
