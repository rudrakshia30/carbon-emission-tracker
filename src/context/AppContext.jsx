/* eslint-disable react-refresh/only-export-components */
/**
 * AppContext — Global State Management for CarbonTwin
 * 
 * Uses React Context + useReducer with localStorage persistence.
 * Manages user data, activity logs, habitat state, streaks, and insights.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { calculateDailyTotal, getLocalDateString } from '../utils/carbonCalculator';
import { calculateHabitatState } from '../components/Habitat/habitatEngine';
import { calculateStreak } from '../utils/streakCalculator';
import { validatePersistedState } from '../utils/security';

const AppContext = createContext(null);

const STORAGE_KEY = 'carbontwin_v1';

/** Initial state shape */
const initialState = {
  /** Whether onboarding is complete */
  onboarded: false,

  /** User profile from onboarding quiz */
  user: {
    name: '',
    region: 'global',
    transport: { mode: 'car', dailyDistanceKm: 10 },
    diet: 'omnivore',
    energy: { acHoursPerDay: 2, longShowers: false, energyConscious: false },
    baselineScore: 22,
  },

  /** Array of daily log entries */
  logs: [],

  /** Current habitat visual state */
  habitat: {
    healthScore: 50,
    trees: 3,
    flowers: 0,
    birds: 0,
    smogLevel: 0.3,
    waterClarity: 0.7,
    hasRainbow: false,
    particles: [],
  },

  /** Streak data */
  streaks: {
    current: 0,
    best: 0,
  },

  /** AI-generated weekly insights */
  weeklyInsights: [],

  /** Active tab */
  activeTab: 'habitat',

  /** Toast notification queue */
  toasts: [],

  /** Unlocked badge IDs */
  unlockedBadges: [],
};

/** Action type constants — exported for testing */
export const ACTIONS = {
  COMPLETE_ONBOARDING: 'COMPLETE_ONBOARDING',
  ADD_LOG: 'ADD_LOG',
  UPDATE_HABITAT: 'UPDATE_HABITAT',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  ADD_TOAST: 'ADD_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  ADD_WEEKLY_INSIGHT: 'ADD_WEEKLY_INSIGHT',
  UNLOCK_BADGE: 'UNLOCK_BADGE',
  LOAD_STATE: 'LOAD_STATE',
  RESET: 'RESET',
};

/**
 * State reducer
 */
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.COMPLETE_ONBOARDING:
      return {
        ...state,
        onboarded: true,
        user: action.payload,
        habitat: calculateHabitatState([], 0),
      };

    case ACTIONS.ADD_LOG: {
      const breakdown = calculateDailyTotal(action.payload);
      const todayKey = getLocalDateString();

      // Find index of existing log for today
      const existingIndex = state.logs.findIndex(
        (l) => l.date && getLocalDateString(l.date) === todayKey
      );

      let newLogs;
      if (existingIndex > -1) {
        // Overwrite existing log for today
        const updatedLog = {
          ...action.payload,
          rawTransport: action.payload.transport,
          rawEnergy: action.payload.energy,
          rawShopping: action.payload.shopping,
          ...breakdown,
          totalCO2: breakdown.total,
          id: state.logs[existingIndex].id, // Keep original ID
          date: state.logs[existingIndex].date, // Keep original timestamp
        };
        newLogs = [...state.logs];
        newLogs[existingIndex] = updatedLog;
      } else {
        // Add new log
        const logEntry = {
          ...action.payload,
          rawTransport: action.payload.transport,
          rawEnergy: action.payload.energy,
          rawShopping: action.payload.shopping,
          ...breakdown,
          totalCO2: breakdown.total,
          id: Date.now().toString(),
        };
        newLogs = [...state.logs, logEntry];
      }
      const streaks = calculateStreak(newLogs);
      const habitat = calculateHabitatState(newLogs, streaks.current, state.user.region || 'global');

      return {
        ...state,
        logs: newLogs,
        streaks,
        habitat,
      };
    }

    case ACTIONS.UPDATE_HABITAT:
      return {
        ...state,
        habitat: action.payload,
      };

    case ACTIONS.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload,
      };

    case ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }],
      };

    case ACTIONS.DISMISS_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };

    case ACTIONS.ADD_WEEKLY_INSIGHT:
      return {
        ...state,
        weeklyInsights: [...state.weeklyInsights, action.payload],
      };

    case ACTIONS.UNLOCK_BADGE:
      if (state.unlockedBadges.includes(action.payload)) return state;
      return {
        ...state,
        unlockedBadges: [...state.unlockedBadges, action.payload],
      };

    case ACTIONS.LOAD_STATE:
      return { ...initialState, ...action.payload };

    case ACTIONS.RESET:
      return { ...initialState };

    default:
      return state;
  }
}

/** Export reducer and initial state for unit testing */
export { appReducer, initialState };

/**
 * Load state from localStorage
 */
function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate and sanitize before trusting — rejects tampered/corrupted data
    return validatePersistedState(parsed);
  } catch {
    return null;
  }
}

/**
 * Save state to localStorage
 */
function persistState(state) {
  try {
    const toSave = { ...state, toasts: [] }; // Don't persist toasts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // localStorage might be full or unavailable
  }
}

/**
 * AppProvider component
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      dispatch({ type: ACTIONS.LOAD_STATE, payload: persisted });
    }
  }, []);

  // Persist state on every change
  useEffect(() => {
    if (state.onboarded) {
      persistState(state);
    }
  }, [state]);

  // Action creators
  const completeOnboarding = useCallback((userData) => {
    dispatch({ type: ACTIONS.COMPLETE_ONBOARDING, payload: userData });
  }, []);

  const addLog = useCallback((logEntry) => {
    dispatch({ type: ACTIONS.ADD_LOG, payload: logEntry });
  }, []);

  const setActiveTab = useCallback((tab) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab });
  }, []);

  const addToast = useCallback((toast) => {
    dispatch({ type: ACTIONS.ADD_TOAST, payload: toast });
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      dispatch({ type: ACTIONS.DISMISS_TOAST, payload: toast.id || Date.now().toString() });
    }, 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    dispatch({ type: ACTIONS.DISMISS_TOAST, payload: id });
  }, []);

  const addWeeklyInsight = useCallback((insight) => {
    dispatch({ type: ACTIONS.ADD_WEEKLY_INSIGHT, payload: insight });
  }, []);

  const unlockBadge = useCallback((badgeId) => {
    dispatch({ type: ACTIONS.UNLOCK_BADGE, payload: badgeId });
  }, []);

  const resetApp = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: ACTIONS.RESET });
  }, []);

  const value = {
    state,
    dispatch,
    completeOnboarding,
    addLog,
    setActiveTab,
    addToast,
    dismissToast,
    addWeeklyInsight,
    unlockBadge,
    resetApp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Custom hook to use the app context
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
