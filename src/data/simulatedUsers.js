/**
 * simulatedUsers.js — Simulated leaderboard peers for CarbonTwin.
 *
 * 15 AI-simulated users with weekly CO2 values spanning a realistic range.
 * Separated into a data module for single-source-of-truth and test reuse.
 */

/** @type {Array<{name: string, emoji: string, weeklyCO2: number, habitatHealth: number}>} */
export const SIMULATED_USERS = [
  { name: 'GreenLeaf_7', emoji: '🌿', weeklyCO2: 45.2, habitatHealth: 88 },
  { name: 'EcoNinja_12', emoji: '🥷', weeklyCO2: 52.8, habitatHealth: 84 },
  { name: 'PlantPower_3', emoji: '🥗', weeklyCO2: 61.1, habitatHealth: 78 },
  { name: 'SunRider_88', emoji: '☀️', weeklyCO2: 74.5, habitatHealth: 72 },
  { name: 'WindChaser_4', emoji: '🍃', weeklyCO2: 83.2, habitatHealth: 68 },
  { name: 'EcoWarrior_42', emoji: '🛡️', weeklyCO2: 95.0, habitatHealth: 65 },
  { name: 'ForestFriend_9', emoji: '🦊', weeklyCO2: 108.4, habitatHealth: 61 },
  { name: 'CleanAir_22', emoji: '💨', weeklyCO2: 115.6, habitatHealth: 58 },
  { name: 'SeaSaver_15', emoji: '🌊', weeklyCO2: 122.9, habitatHealth: 55 },
  { name: 'SolarStar_33', emoji: '⭐', weeklyCO2: 135.2, habitatHealth: 50 },
  { name: 'EarthGuard_50', emoji: '🌍', weeklyCO2: 148.0, habitatHealth: 46 },
  { name: 'GreenLife_8', emoji: '🌱', weeklyCO2: 162.4, habitatHealth: 42 },
  { name: 'EcoPioneer_1', emoji: '🚀', weeklyCO2: 185.0, habitatHealth: 35 },
  { name: 'NatureLover_77', emoji: '🌺', weeklyCO2: 210.5, habitatHealth: 30 },
  { name: 'CarbonCutter_10', emoji: '✂️', weeklyCO2: 232.1, habitatHealth: 25 },
];
