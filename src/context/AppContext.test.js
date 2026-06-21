import { describe, it, expect, vi } from 'vitest';
import { appReducer, initialState, ACTIONS } from './AppContext';

// Mock heavy dependencies so reducer tests run in isolation
vi.mock('../components/Habitat/habitatEngine', () => ({
  calculateHabitatState: vi.fn(() => ({
    healthScore: 75,
    trees: 10,
    flowers: 5,
    birds: 2,
    smogLevel: 0.2,
    waterClarity: 0.8,
    hasRainbow: false,
    particles: [],
  })),
}));

vi.mock('../utils/streakCalculator', () => ({
  calculateStreak: vi.fn(() => ({ current: 1, best: 1 })),
}));

vi.mock('../utils/carbonCalculator', () => ({
  calculateDailyTotal: vi.fn((payload) => ({
    transport: payload.transport ? 2.0 : 0,
    food: 3.6,
    energy: 1.0,
    shopping: 0,
    total: 6.6,
  })),
  getLocalDateString: vi.fn(() => '2026-06-21'),
}));

const mockUserData = {
  name: 'Eco Explorer',
  region: 'india',
  transport: { mode: 'train', dailyDistanceKm: 20 },
  diet: 'vegetarian',
  energy: { acHoursPerDay: 2, longShowers: false, energyConscious: true },
  baselineScore: 7.9,
};

const mockLogEntry = {
  date: '2026-06-21T10:00:00.000Z',
  transport: [{ mode: 'train', distanceKm: 20 }],
  meals: [{ type: 'vegetarian', meal: 'lunch' }],
  energy: { ac: 2, heating: 0, shower: false, laundry: false, dishwasher: false },
  shopping: { clothing: 0, electronics: 0, groceriesLocal: 0, groceriesImported: 0, onlineOrders: 0 },
  totalCO2: 6.6,
};

describe('appReducer', () => {
  describe('COMPLETE_ONBOARDING', () => {
    it('should set onboarded to true and store user data', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.COMPLETE_ONBOARDING,
        payload: mockUserData,
      });

      expect(state.onboarded).toBe(true);
      expect(state.user).toEqual(mockUserData);
      expect(state.habitat).toBeDefined();
      expect(state.habitat.healthScore).toBe(75);
    });

    it('should not affect logs or streaks', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.COMPLETE_ONBOARDING,
        payload: mockUserData,
      });

      expect(state.logs).toEqual([]);
      expect(state.streaks.current).toBe(0);
    });
  });

  describe('ADD_LOG', () => {
    it('should add a new log entry', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.ADD_LOG,
        payload: mockLogEntry,
      });

      expect(state.logs).toHaveLength(1);
      expect(state.logs[0].totalCO2).toBe(6.6);
    });

    it('should assign a unique id to the log', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.ADD_LOG,
        payload: mockLogEntry,
      });

      expect(state.logs[0].id).toBeDefined();
      expect(typeof state.logs[0].id).toBe('string');
    });

    it('should update habitat state after logging', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.ADD_LOG,
        payload: mockLogEntry,
      });

      expect(state.habitat.healthScore).toBe(75);
    });

    it('should overwrite existing log for today (not duplicate)', () => {
      const stateWith1Log = appReducer(initialState, {
        type: ACTIONS.ADD_LOG,
        payload: mockLogEntry,
      });

      const stateWith2Logs = appReducer(stateWith1Log, {
        type: ACTIONS.ADD_LOG,
        payload: { ...mockLogEntry, totalCO2: 9.0 },
      });

      // Should overwrite, not add second entry for same day
      expect(stateWith2Logs.logs).toHaveLength(1);
    });
  });

  describe('SET_ACTIVE_TAB', () => {
    it('should update activeTab', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.SET_ACTIVE_TAB,
        payload: 'social',
      });

      expect(state.activeTab).toBe('social');
    });

    it('should not change other state', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.SET_ACTIVE_TAB,
        payload: 'log',
      });

      expect(state.logs).toEqual(initialState.logs);
      expect(state.user).toEqual(initialState.user);
    });
  });

  describe('ADD_TOAST / DISMISS_TOAST', () => {
    it('should add a toast with auto-assigned id', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.ADD_TOAST,
        payload: { message: 'Logged!', type: 'success' },
      });

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe('Logged!');
      expect(state.toasts[0].id).toBeDefined();
    });

    it('should dismiss a toast by id', () => {
      const stateWithToast = appReducer(initialState, {
        type: ACTIONS.ADD_TOAST,
        payload: { message: 'Hello', type: 'info' },
      });

      const toastId = stateWithToast.toasts[0].id;
      const dismissed = appReducer(stateWithToast, {
        type: ACTIONS.DISMISS_TOAST,
        payload: toastId,
      });

      expect(dismissed.toasts).toHaveLength(0);
    });
  });

  describe('UNLOCK_BADGE', () => {
    it('should add a badge id to unlockedBadges', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.UNLOCK_BADGE,
        payload: 'first-log',
      });

      expect(state.unlockedBadges).toContain('first-log');
    });

    it('should not duplicate already-unlocked badges', () => {
      const state1 = appReducer(initialState, {
        type: ACTIONS.UNLOCK_BADGE,
        payload: 'first-log',
      });

      const state2 = appReducer(state1, {
        type: ACTIONS.UNLOCK_BADGE,
        payload: 'first-log',
      });

      expect(state2.unlockedBadges.filter((b) => b === 'first-log')).toHaveLength(1);
    });
  });

  describe('LOAD_STATE', () => {
    it('should replace state with persisted data merged with initial', () => {
      const persisted = {
        onboarded: true,
        user: mockUserData,
        logs: [mockLogEntry],
      };

      const state = appReducer(initialState, {
        type: ACTIONS.LOAD_STATE,
        payload: persisted,
      });

      expect(state.onboarded).toBe(true);
      expect(state.user).toEqual(mockUserData);
      expect(state.logs).toHaveLength(1);
    });
  });

  describe('RESET', () => {
    it('should restore initial state', () => {
      const populated = appReducer(initialState, {
        type: ACTIONS.COMPLETE_ONBOARDING,
        payload: mockUserData,
      });

      const reset = appReducer(populated, { type: ACTIONS.RESET });

      expect(reset.onboarded).toBe(false);
      expect(reset.logs).toEqual([]);
      expect(reset.user.name).toBe('');
    });
  });

  describe('unknown action', () => {
    it('should return unchanged state for unknown action type', () => {
      const state = appReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(state).toEqual(initialState);
    });
  });
});
