import { useState, useMemo, useCallback, useEffect } from 'react';
import { EMISSION_FACTORS as SHARED_FACTORS } from '../../data/emissionFactors';
import './QuickLog.css';

/**
 * Remap shared emission factors to the key structure QuickLog expects.
 * Single source of truth — no duplicated data.
 */
const DEFAULT_EMISSION_FACTORS = {
  transportation: SHARED_FACTORS.transportation,
  food: SHARED_FACTORS.food,
  energy: SHARED_FACTORS.energy,
  shopping: SHARED_FACTORS.shopping,
};

/** Transport mode definitions */
const TRANSPORT_MODES = [
  { id: 'car', label: 'Car', emoji: '🚗', factorKey: 'car_gasoline' },
  { id: 'bus', label: 'Bus', emoji: '🚌', factorKey: 'bus' },
  { id: 'train', label: 'Train', emoji: '🚆', factorKey: 'train_metro' },
  { id: 'bike', label: 'Bike', emoji: '🚲', factorKey: 'bicycle' },
  { id: 'walk', label: 'Walk', emoji: '🚶', factorKey: 'walking' },
  { id: 'motorcycle', label: 'Motorcycle', emoji: '🏍️', factorKey: 'motorcycle' },
  { id: 'airplane', label: 'Airplane', emoji: '✈️', factorKey: 'airplane' }
];

/** Food type definitions */
const FOOD_TYPES = [
  { id: 'beef', label: 'Beef', emoji: '🥩', factorKey: 'beef_meal' },
  { id: 'chicken', label: 'Chicken', emoji: '🍗', factorKey: 'chicken_meal' },
  { id: 'pork', label: 'Pork', emoji: '🐷', factorKey: 'pork_meal' },
  { id: 'fish', label: 'Fish', emoji: '🐟', factorKey: 'fish_meal' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗', factorKey: 'vegetarian_meal' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱', factorKey: 'vegan_meal' },
  { id: 'dairy_heavy', label: 'Dairy-Heavy', emoji: '🧀', factorKey: 'dairy_heavy_meal' }
];

/** Meal slot definitions */
const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'];

/** Energy toggle items */
const ENERGY_ITEMS = [
  { id: 'ac', label: 'AC', emoji: '❄️', hasHours: true, factorKey: 'ac_per_hour' },
  { id: 'heating', label: 'Heating', emoji: '🔥', hasHours: true, factorKey: 'heating_per_hour' },
  { id: 'shower', label: 'Long Shower', emoji: '🚿', hasHours: false, factorKey: 'hot_shower_per_minute', defaultMinutes: 15 },
  { id: 'laundry', label: 'Laundry', emoji: '👕', hasHours: false, factorKey: 'laundry_per_load' },
  { id: 'dishwasher', label: 'Dishwasher', emoji: '🍽️', hasHours: false, factorKey: 'dishwasher_per_cycle' }
];

/** Shopping item definitions */
const SHOPPING_ITEMS = [
  { id: 'clothing', label: 'Clothing', emoji: '👕', factorKey: 'new_clothing_item' },
  { id: 'electronics', label: 'Electronics', emoji: '📱', factorKey: 'electronics_smartphone' },
  { id: 'groceriesLocal', label: 'Groceries (Local)', emoji: '🥬', factorKey: 'groceries_local' },
  { id: 'groceriesImported', label: 'Groceries (Imported)', emoji: '🌍', factorKey: 'groceries_imported' },
  { id: 'onlineOrders', label: 'Online Order', emoji: '📦', factorKey: 'online_order_with_shipping' }
];

/** Category tab definitions */
const CATEGORIES = [
  { id: 'transport', label: 'Transport', emoji: '🚗' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'energy', label: 'Energy', emoji: '⚡' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' }
];


/**
 * QuickLog — A minimal-friction daily carbon logging panel.
 * Users log transport, food, energy, and shopping activities via a tabbed interface
 * and see a running CO2 total before submitting.
 *
 * @param {Object} props
 * @param {Function} props.onLog — callback receiving the log entry object
 * @param {Object} [props.emissionFactors] — custom emission factors
 * @param {number} [props.baselineScore=22] — user's baseline daily CO2 in kg
 */
export default function QuickLog({ onLog, emissionFactors, baselineScore = 22, existingLog }) {
  const factors = emissionFactors || DEFAULT_EMISSION_FACTORS;

  /* ── state ─────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('transport');

  // Transport
  const [transportLogs, setTransportLogs] = useState({});

  // Food — { [mealSlot]: foodTypeId }
  const [meals, setMeals] = useState({});

  // Energy
  const [energyState, setEnergyState] = useState({
    ac: { on: false, hours: 2 },
    heating: { on: false, hours: 2 },
    shower: { on: false },
    laundry: { on: false },
    dishwasher: { on: false }
  });

  // Shopping — { [itemId]: count }
  const [shoppingCounts, setShoppingCounts] = useState({
    clothing: 0, electronics: 0, groceriesLocal: 0, groceriesImported: 0, onlineOrders: 0
  });

  // UI
  const [submitted, setSubmitted] = useState(false);
  const [pulseCard, setPulseCard] = useState(null);

  // Sync state with existingLog when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (existingLog) {
        // Transport
        const t = existingLog.rawTransport || existingLog.transport;
        if (t) {
          if (Array.isArray(t)) {
            const logsObj = {};
            t.forEach(item => {
              logsObj[item.mode] = item.distanceKm || 10;
            });
            setTransportLogs(logsObj);
          } else if (t.mode && t.mode !== 'none') {
            setTransportLogs({ [t.mode]: t.distanceKm || 10 });
          } else {
            setTransportLogs({});
          }
        } else {
          setTransportLogs({});
        }

        // Food
        const mealsObj = {};
        if (existingLog.meals && Array.isArray(existingLog.meals)) {
          existingLog.meals.forEach(m => {
            const foundFood = FOOD_TYPES.find(f => f.factorKey === m.type);
            mealsObj[m.meal] = foundFood ? foundFood.id : m.type;
          });
        }
        setMeals(mealsObj);

        // Energy
        const e = existingLog.rawEnergy || existingLog.energy;
        if (e) {
          setEnergyState({
            ac: { on: (e.ac || 0) > 0, hours: e.ac || 2 },
            heating: { on: (e.heating || 0) > 0, hours: e.heating || 2 },
            shower: { on: !!e.shower },
            laundry: { on: !!e.laundry },
            dishwasher: { on: !!e.dishwasher }
          });
        }

        // Shopping
        const s = existingLog.rawShopping || existingLog.shopping;
        if (s) {
          setShoppingCounts({
            clothing: s.clothing || 0,
            electronics: s.electronics || 0,
            groceriesLocal: s.groceriesLocal || 0,
            groceriesImported: s.groceriesImported || 0,
            onlineOrders: s.onlineOrders || 0
          });
        }
      } else {
        setTransportLogs({});
        setMeals({});
        setEnergyState({
          ac: { on: false, hours: 2 },
          heating: { on: false, hours: 2 },
          shower: { on: false },
          laundry: { on: false },
          dishwasher: { on: false }
        });
        setShoppingCounts({
          clothing: 0, electronics: 0, groceriesLocal: 0, groceriesImported: 0, onlineOrders: 0
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [existingLog]);

  /* ── CO2 calculations ──────────────────────────────── */
  const transportCO2 = useMemo(() => {
    return Object.entries(transportLogs).reduce((sum, [modeId, dist]) => {
      const mode = TRANSPORT_MODES.find(m => m.id === modeId);
      if (!mode) return sum;
      return sum + (factors.transportation[mode.factorKey] || 0) * dist;
    }, 0);
  }, [transportLogs, factors]);

  const foodCO2 = useMemo(() => {
    return Object.values(meals).reduce((sum, foodId) => {
      const food = FOOD_TYPES.find(f => f.id === foodId);
      return sum + (food ? (factors.food[food.factorKey] || 0) : 0);
    }, 0);
  }, [meals, factors]);

  const energyCO2 = useMemo(() => {
    let total = 0;
    if (energyState.ac.on) total += factors.energy.ac_per_hour * energyState.ac.hours;
    if (energyState.heating.on) total += factors.energy.heating_per_hour * energyState.heating.hours;
    if (energyState.shower.on) total += factors.energy.hot_shower_per_minute * 15;
    if (energyState.laundry.on) total += factors.energy.laundry_per_load;
    if (energyState.dishwasher.on) total += factors.energy.dishwasher_per_cycle;
    return total;
  }, [energyState, factors]);

  const shoppingCO2 = useMemo(() => {
    return SHOPPING_ITEMS.reduce((sum, item) => {
      return sum + (shoppingCounts[item.id] || 0) * (factors.shopping[item.factorKey] || 0);
    }, 0);
  }, [shoppingCounts, factors]);

  const totalCO2 = useMemo(
    () => transportCO2 + foodCO2 + energyCO2 + shoppingCO2,
    [transportCO2, foodCO2, energyCO2, shoppingCO2]
  );
  const delta = totalCO2 - baselineScore;
  const isWorse = delta > 0;
  const isBetter = delta < 0;

  /* ── interaction helpers ───────────────────────────── */
  const triggerPulse = useCallback((id) => {
    setPulseCard(id);
    setTimeout(() => setPulseCard(null), 400);
  }, []);

  const selectTransport = (modeId) => {
    setTransportLogs(prev => {
      const copy = { ...prev };
      if (copy[modeId] !== undefined) {
        delete copy[modeId]; // toggle off
      } else {
        copy[modeId] = 10; // toggle on with default 10km
      }
      return copy;
    });
    triggerPulse(`transport-${modeId}`);
  };

  const setMealForSlot = (slot, foodId) => {
    setMeals(prev => {
      const updated = { ...prev };
      if (updated[slot] === foodId) {
        delete updated[slot];
      } else {
        updated[slot] = foodId;
      }
      return updated;
    });
    triggerPulse(`food-${slot}-${foodId}`);
  };

  const toggleEnergy = (itemId) => {
    setEnergyState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], on: !prev[itemId].on }
    }));
    triggerPulse(`energy-${itemId}`);
  };

  const setEnergyHours = (itemId, hours) => {
    setEnergyState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], hours: Number(hours) }
    }));
  };

  const incrementShopping = (itemId) => {
    setShoppingCounts(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    triggerPulse(`shop-${itemId}`);
  };

  const decrementShopping = (itemId) => {
    setShoppingCounts(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) - 1) }));
  };

  /* ── submit ────────────────────────────────────────── */
  const handleSubmit = () => {
    const mealEntries = Object.entries(meals).map(([slot, foodId]) => {
      const food = FOOD_TYPES.find(f => f.id === foodId);
      return {
        type: food ? food.factorKey : foodId,
        meal: slot
      };
    });

    const transportEntries = Object.entries(transportLogs).map(([modeId, dist]) => ({
      mode: modeId,
      distanceKm: dist
    }));

    const logEntry = {
      date: new Date().toISOString(),
      transport: transportEntries,
      meals: mealEntries,
      energy: {
        ac: energyState.ac.on ? energyState.ac.hours : 0,
        heating: energyState.heating.on ? energyState.heating.hours : 0,
        shower: energyState.shower.on,
        laundry: energyState.laundry.on,
        dishwasher: energyState.dishwasher.on
      },
      shopping: { ...shoppingCounts },
      totalCO2: Math.round(totalCO2 * 100) / 100
    };

    setSubmitted(true);
    if (onLog) onLog(logEntry);

    setTimeout(() => setSubmitted(false), 3000);
  };

  /* ── render helpers ────────────────────────────────── */

  /** Transport tab content */
  const renderTransport = () => (
    <div className="ql-tab-content" role="tabpanel" id="ql-panel-transport" aria-labelledby="ql-tab-transport">
      <h3 className="ql-section-title">Select transport modes (multi-select)</h3>
      <div className="ql-icon-grid">
        {TRANSPORT_MODES.map(mode => (
          <button
            key={mode.id}
            id={`ql-transport-${mode.id}`}
            className={`ql-icon-card ${transportLogs[mode.id] !== undefined ? 'ql-icon-card--selected' : ''} ${pulseCard === `transport-${mode.id}` ? 'ql-pulse' : ''}`}
            onClick={() => selectTransport(mode.id)}
            aria-pressed={transportLogs[mode.id] !== undefined}
            aria-label={`Toggle ${mode.label} transport`}
          >
            <span className="ql-icon-card__emoji" aria-hidden="true">{mode.emoji}</span>
            <span className="ql-icon-card__label">{mode.label}</span>
            <span className="ql-icon-card__co2">{(factors.transportation[mode.factorKey] * 10).toFixed(1)} kg/10km</span>
          </button>
        ))}
      </div>

      {Object.keys(transportLogs).length > 0 && (
        <div className="ql-distance-section">
          <h4 className="ql-distance-section__title">
            Set travel distances:
          </h4>
          <div className="ql-distance-rows-container">
            {Object.entries(transportLogs).map(([modeId, dist]) => {
              const mode = TRANSPORT_MODES.find(m => m.id === modeId);
              if (!mode) return null;
              const factor = factors.transportation[mode.factorKey] || 0;
              const modeCO2 = factor * dist;
              const isZeroEmission = factor === 0;
              return (
                <div key={modeId} className="ql-distance-row">
                  <div className="ql-distance-row__header">
                    <span className="ql-distance-row__label">
                      {mode.emoji} {mode.label}: <strong>{dist} km</strong>
                    </span>
                    <span className={`ql-distance-row__co2-live ${isZeroEmission ? 'ql-distance-row__co2-live--zero' : ''}`}>
                      {isZeroEmission
                        ? '♻️ Zero CO₂'
                        : `+${modeCO2.toFixed(2)} kg CO₂`}
                    </span>
                    <button 
                      className="ql-distance-row__remove-btn" 
                      onClick={() => setTransportLogs(prev => {
                        const copy = { ...prev };
                        delete copy[modeId];
                        return copy;
                      })}
                      aria-label={`Remove ${mode.label}`}
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={dist}
                    onChange={e => setTransportLogs(prev => ({
                      ...prev,
                      [modeId]: Number(e.target.value)
                    }))}
                    className="ql-range-slider"
                    aria-label={`${mode.label} distance in kilometers`}
                  />
                  {!isZeroEmission && (
                    <div className="ql-distance-row__quick-btns">
                      {[5, 10, 20, 50, 100].map(km => (
                        <button
                          key={km}
                          className={`ql-distance-row__quick-btn ${dist === km ? 'ql-distance-row__quick-btn--active' : ''}`}
                          onClick={() => setTransportLogs(prev => ({ ...prev, [modeId]: km }))}
                          aria-label={`Set ${mode.label} distance to ${km} km`}
                        >
                          {km}km
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  /** Food tab content */
  const renderFood = () => (
    <div className="ql-tab-content" role="tabpanel" id="ql-panel-food" aria-labelledby="ql-tab-food">
      {MEAL_SLOTS.map(slot => (
        <div key={slot} className="ql-meal-slot">
          <h3 className="ql-section-title">{slot.charAt(0).toUpperCase() + slot.slice(1)}</h3>
          <div className="ql-icon-grid ql-icon-grid--food">
            {FOOD_TYPES.map(food => (
              <button
                key={food.id}
                id={`ql-food-${slot}-${food.id}`}
                className={`ql-icon-card ql-icon-card--small ${meals[slot] === food.id ? 'ql-icon-card--selected' : ''} ${pulseCard === `food-${slot}-${food.id}` ? 'ql-pulse' : ''}`}
                onClick={() => setMealForSlot(slot, food.id)}
                aria-pressed={meals[slot] === food.id}
                aria-label={`Select ${food.label} for ${slot}`}
              >
                <span className="ql-icon-card__emoji" aria-hidden="true">{food.emoji}</span>
                <span className="ql-icon-card__label">{food.label}</span>
                <span className="ql-icon-card__co2">{factors.food[food.factorKey]} kg</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  /** Energy tab content */
  const renderEnergy = () => (
    <div className="ql-tab-content" role="tabpanel" id="ql-panel-energy" aria-labelledby="ql-tab-energy">
      <h3 className="ql-section-title">Today's energy usage</h3>
      <div className="ql-energy-list">
        {ENERGY_ITEMS.map(item => (
          <div
            key={item.id}
            className={`ql-energy-item ${energyState[item.id].on ? 'ql-energy-item--active' : ''} ${pulseCard === `energy-${item.id}` ? 'ql-pulse' : ''}`}
          >
            <div className="ql-energy-item__main">
              <span className="ql-energy-item__emoji" aria-hidden="true">{item.emoji}</span>
              <span className="ql-energy-item__label">{item.label}</span>
              <button
                id={`ql-energy-toggle-${item.id}`}
                className={`ql-toggle ${energyState[item.id].on ? 'ql-toggle--on' : ''}`}
                onClick={() => toggleEnergy(item.id)}
                role="switch"
                aria-checked={energyState[item.id].on}
                aria-label={`Toggle ${item.label}`}
              >
                <span className="ql-toggle__knob" />
              </button>
            </div>
            {item.hasHours && energyState[item.id].on && (
              <div className="ql-energy-item__hours">
                <label htmlFor={`ql-energy-hours-${item.id}`}>Hours:</label>
                <input
                  id={`ql-energy-hours-${item.id}`}
                  type="range"
                  min="1"
                  max="24"
                  value={energyState[item.id].hours}
                  onChange={e => setEnergyHours(item.id, e.target.value)}
                  className="ql-range-slider ql-range-slider--small"
                  aria-label={`${item.label} hours`}
                />
                <span className="ql-energy-item__hours-value">{energyState[item.id].hours}h</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /** Shopping tab content */
  const renderShopping = () => (
    <div className="ql-tab-content" role="tabpanel" id="ql-panel-shopping" aria-labelledby="ql-tab-shopping">
      <h3 className="ql-section-title">Quick add purchases</h3>
      <div className="ql-shopping-grid">
        {SHOPPING_ITEMS.map(item => (
          <div
            key={item.id}
            className={`ql-shop-card ${shoppingCounts[item.id] > 0 ? 'ql-shop-card--has-items' : ''} ${pulseCard === `shop-${item.id}` ? 'ql-pulse' : ''}`}
          >
            <button
              id={`ql-shop-add-${item.id}`}
              className="ql-shop-card__btn"
              onClick={() => incrementShopping(item.id)}
              aria-label={`Add ${item.label}`}
            >
              <span className="ql-shop-card__emoji" aria-hidden="true">{item.emoji}</span>
              <span className="ql-shop-card__label">{item.label}</span>
              <span className="ql-shop-card__co2">{factors.shopping[item.factorKey]} kg each</span>
            </button>
            {shoppingCounts[item.id] > 0 && (
              <div className="ql-shop-card__counter">
                <button
                  id={`ql-shop-dec-${item.id}`}
                  className="ql-shop-card__counter-btn"
                  onClick={() => decrementShopping(item.id)}
                  aria-label={`Remove one ${item.label}`}
                >
                  −
                </button>
                <span className="ql-shop-card__badge" aria-label={`${shoppingCounts[item.id]} items`}>
                  {shoppingCounts[item.id]}
                </span>
                <button
                  id={`ql-shop-inc-${item.id}`}
                  className="ql-shop-card__counter-btn"
                  onClick={() => incrementShopping(item.id)}
                  aria-label={`Add one more ${item.label}`}
                >
                  +
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const TAB_RENDERERS = {
    transport: renderTransport,
    food: renderFood,
    energy: renderEnergy,
    shopping: renderShopping
  };

  /** Handles keyboard navigation between category tabs. */
  const handleTabKeyDown = (e, currentIndex) => {
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % CATEGORIES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = CATEGORIES.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextCat = CATEGORIES[nextIndex];
      setActiveTab(nextCat.id);
      setTimeout(() => {
        const btn = document.getElementById(`ql-tab-${nextCat.id}`);
        btn?.focus();
      }, 0);
    }
  };

  /* ── submission overlay ────────────────────────────── */
  const renderSubmitOverlay = () => {
    const isGood = totalCO2 < baselineScore;
    return (
      <div className={`ql-submit-overlay ${submitted ? 'ql-submit-overlay--visible' : ''}`} aria-live="polite">
        <div className="ql-submit-overlay__content">
          <span className="ql-submit-overlay__emoji" aria-hidden="true">
            {isGood ? '🌸' : '🔥'}
          </span>
          <p className="ql-submit-overlay__text">
            {isGood
              ? `Great day! Only ${totalCO2.toFixed(1)} kg CO₂. Your island flourishes!`
              : `${totalCO2.toFixed(1)} kg CO₂ logged. Let's aim lower tomorrow!`}
          </p>
        </div>
      </div>
    );
  };

  /* ── main render ───────────────────────────────────── */
  return (
    <section className="ql" aria-label="Quick Log — daily carbon tracker">
      <header className="ql__header">
        <h2 className="ql__title">Quick Log</h2>
        <p className="ql__subtitle">Log your day in a few taps</p>
      </header>

      {/* Tab bar */}
      <nav className="ql-tabs" role="tablist" aria-label="Activity categories">
        {CATEGORIES.map((cat, index) => (
          <button
            key={cat.id}
            id={`ql-tab-${cat.id}`}
            role="tab"
            aria-selected={activeTab === cat.id}
            aria-controls={`ql-panel-${cat.id}`}
            className={`ql-tabs__tab ${activeTab === cat.id ? 'ql-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(cat.id)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
            tabIndex={activeTab === cat.id ? 0 : -1}
          >
            <span className="ql-tabs__emoji" aria-hidden="true">{cat.emoji}</span>
            <span className="ql-tabs__label">{cat.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="ql__body">
        {TAB_RENDERERS[activeTab]()}
      </div>

      {/* Floating total bar */}
      <footer className="ql-footer">
        <div className="ql-footer__total">
          <span className="ql-footer__label">Today's Impact:</span>
          <span className={`ql-footer__value ${isWorse ? 'ql-footer__value--worse' : ''} ${isBetter ? 'ql-footer__value--better' : ''}`}>
            {isWorse && <span className="ql-footer__arrow" aria-hidden="true">▲</span>}
            {isBetter && <span className="ql-footer__arrow" aria-hidden="true">▼</span>}
            {totalCO2.toFixed(1)} kg CO₂
          </span>
          <span className="ql-footer__baseline">
            baseline {baselineScore} kg
          </span>
        </div>
        <button
          id="ql-submit-btn"
          className="ql-footer__submit"
          onClick={handleSubmit}
          disabled={submitted}
          aria-label="Log today's carbon footprint"
        >
          {submitted ? '✓ Logged!' : '🌿 Log Day'}
        </button>
      </footer>

      {renderSubmitOverlay()}
    </section>
  );
}
