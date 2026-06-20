import { describe, it, expect } from 'vitest';
import { generateMicroAction } from './microActionGenerator';

describe('Micro Action Generator', () => {
  it('returns a suggestion object with required fields when called with no logs', () => {
    const action = generateMicroAction([]);
    expect(action).toHaveProperty('text');
    expect(action).toHaveProperty('impact');
    expect(action).toHaveProperty('icon');
    expect(action).toHaveProperty('actionType');
    expect(typeof action.text).toBe('string');
  });

  it('returns a suggestion targeted at the highest-emission category', () => {
    const logs = [
      { transport: 18, food: 2, energy: 1, shopping: 0 }, // transport dominates
    ];
    const action = generateMicroAction(logs);
    // The suggestion should be from the transport category
    expect(action.actionType).toBe('transport');
  });

  it('targets food when food is the dominant category', () => {
    const logs = [
      { transport: 1, food: 20, energy: 2, shopping: 0 },
    ];
    const action = generateMicroAction(logs);
    expect(action.actionType).toBe('food');
  });

  it('targets energy when energy is the dominant category', () => {
    const logs = [
      { transport: 0, food: 2, energy: 15, shopping: 0 },
    ];
    const action = generateMicroAction(logs);
    expect(action.actionType).toBe('energy');
  });

  it('falls back to deterministic daily rotation with empty logs', () => {
    const action1 = generateMicroAction([]);
    const action2 = generateMicroAction([]);
    // Same day → same deterministic suggestion
    expect(action1).toEqual(action2);
  });
});
