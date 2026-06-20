/**
 * Carbon Emission Factors — Hardcoded Lookup Tables
 * 
 * Sources:
 *   - UK DEFRA/DESNZ GHG Conversion Factors 2024
 *   - US EPA GHG Emission Factors Hub
 *   - Poore & Nemecek (2018) — Science meta-analysis
 *   - Our World in Data
 *   - IPCC AR6
 *   - Carbon Trust LCA studies
 * 
 * All values in kg CO2 equivalent (CO2e)
 */

export const EMISSION_FACTORS = {
  transportation: {
    _unit: 'kg CO2e per passenger-km',
    car: 0.192,
    car_gasoline: 0.192,
    car_diesel: 0.171,
    car_electric: 0.053,
    bus: 0.089,
    train: 0.041,
    train_metro: 0.041,
    bicycle: 0.0,
    walking: 0.0,
    motorcycle: 0.113,
    ride_share: 0.096,
    airplane: 0.180,
    airplane_domestic: 0.255,
    airplane_short_haul: 0.156,
    airplane_long_haul: 0.150,
  },

  food: {
    _unit: 'kg CO2e per meal (single serving)',
    beef_meal: 7.2,
    chicken_meal: 1.8,
    pork_meal: 2.4,
    fish_meal: 1.8,
    vegetarian_meal: 0.7,
    vegan_meal: 0.4,
    dairy_heavy_meal: 2.8,
  },

  energy: {
    _unit: 'kg CO2e per unit as specified',
    ac_per_hour: 1.0,
    heating_per_hour: 1.5,
    laundry_per_load: 0.6,
    dishwasher_per_cycle: 0.7,
    hot_shower_per_minute: 0.1,
    lighting_led_per_hour: 0.005,
    lighting_incandescent_per_hour: 0.05,
  },

  shopping: {
    _unit: 'kg CO2e per item/event',
    new_clothing_item: 10.0,
    electronics_smartphone: 70.0,
    electronics_laptop: 300.0,
    groceries_local: 2.0,
    groceries_imported: 5.0,
    online_order_with_shipping: 1.5,
  },
};

/** National average daily CO2 emissions per person (kg) */
export const NATIONAL_AVG_DAILY_CO2 = 22;

/** Transport mode display configuration */
export const TRANSPORT_MODES = [
  { id: 'car', label: 'Car', icon: '🚗', factor: 0.192 },
  { id: 'bus', label: 'Bus', icon: '🚌', factor: 0.089 },
  { id: 'train', label: 'Train', icon: '🚇', factor: 0.041 },
  { id: 'bicycle', label: 'Bike', icon: '🚲', factor: 0.0 },
  { id: 'walking', label: 'Walk', icon: '🚶', factor: 0.0 },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️', factor: 0.113 },
  { id: 'airplane', label: 'Airplane', icon: '✈️', factor: 0.180 },
];

/** Food type display configuration */
export const FOOD_TYPES = [
  { id: 'beef_meal', label: 'Beef', icon: '🥩', factor: 7.2, color: '#ef4444' },
  { id: 'chicken_meal', label: 'Chicken', icon: '🍗', factor: 1.8, color: '#f59e0b' },
  { id: 'pork_meal', label: 'Pork', icon: '🐷', factor: 2.4, color: '#f97316' },
  { id: 'fish_meal', label: 'Fish', icon: '🐟', factor: 1.8, color: '#3b82f6' },
  { id: 'vegetarian_meal', label: 'Vegetarian', icon: '🥗', factor: 0.7, color: '#10b981' },
  { id: 'vegan_meal', label: 'Vegan', icon: '🌱', factor: 0.4, color: '#34d399' },
  { id: 'dairy_heavy_meal', label: 'Dairy Heavy', icon: '🧀', factor: 2.8, color: '#fbbf24' },
];

/** Energy activity display configuration */
export const ENERGY_ACTIVITIES = [
  { id: 'ac', label: 'AC / Cooling', icon: '❄️', factor: 1.0, hasHours: true },
  { id: 'heating', label: 'Heating', icon: '🔥', factor: 1.5, hasHours: true },
  { id: 'shower', label: 'Long Shower', icon: '🚿', factor: 0.8, hasHours: false },
  { id: 'laundry', label: 'Laundry', icon: '👕', factor: 0.6, hasHours: false },
  { id: 'dishwasher', label: 'Dishwasher', icon: '🍽️', factor: 0.7, hasHours: false },
];

/** Shopping item display configuration */
export const SHOPPING_ITEMS = [
  { id: 'clothing', label: 'Clothing', icon: '👕', factor: 10.0 },
  { id: 'electronics', label: 'Electronics', icon: '📱', factor: 70.0 },
  { id: 'groceries_local', label: 'Local Groceries', icon: '🥬', factor: 2.0 },
  { id: 'groceries_imported', label: 'Imported Groceries', icon: '🌍', factor: 5.0 },
  { id: 'online_order', label: 'Online Order', icon: '📦', factor: 1.5 },
];

export default EMISSION_FACTORS;
