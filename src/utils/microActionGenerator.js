/**
 * Micro-Action Generator — Creates daily one-tap suggestions.
 * @module microActionGenerator
 */

const SUGGESTIONS = [
  { text: 'Try biking to work today', impact: 'Save 1.9kg CO₂', icon: '🚲', actionType: 'transport' },
  { text: 'Skip beef today — go veggie!', impact: 'Save 6.8kg CO₂', icon: '🥗', actionType: 'food' },
  { text: 'Take a shorter shower', impact: 'Save 0.5kg CO₂', icon: '🚿', actionType: 'energy' },
  { text: 'Walk for errands under 2km', impact: 'Save 0.4kg CO₂', icon: '🚶', actionType: 'transport' },
  { text: 'Try a vegan lunch today', impact: 'Save 1.4kg CO₂', icon: '🌱', actionType: 'food' },
  { text: 'Air-dry your laundry', impact: 'Save 0.6kg CO₂', icon: '👕', actionType: 'energy' },
  { text: 'Take the bus instead of driving', impact: 'Save 1.0kg CO₂', icon: '🚌', actionType: 'transport' },
  { text: 'Turn off AC for an hour', impact: 'Save 1.0kg CO₂', icon: '❄️', actionType: 'energy' },
  { text: 'Cook with local ingredients', impact: 'Save 3.0kg CO₂', icon: '🥬', actionType: 'shopping' },
  { text: 'Try a plant-based dinner', impact: 'Save 5.0kg CO₂', icon: '🌿', actionType: 'food' },
  { text: 'Carpool with a colleague', impact: 'Save 0.9kg CO₂', icon: '🤝', actionType: 'transport' },
  { text: 'Skip online shopping today', impact: 'Save 1.5kg CO₂', icon: '📦', actionType: 'shopping' },
];

/**
 * Generate a daily micro-action suggestion based on user patterns.
 * @param {Array} logs - Array of log entries
 * @param {Object} habitatState - Current habitat state
 * @returns {{ text: string, impact: string, icon: string, actionType: string }}
 */
export function generateMicroAction(logs = []) {
  // Find the user's highest-impact category
  if (logs.length > 0) {
    const lastLogs = logs.slice(-7);
    const totals = { transport: 0, food: 0, energy: 0, shopping: 0 };

    lastLogs.forEach((log) => {
      totals.transport += log.transport || 0;
      totals.food += log.food || 0;
      totals.energy += log.energy || 0;
      totals.shopping += log.shopping || 0;
    });

    // Find dominant category
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted[0][0];

    // Try to find a suggestion matching the top category
    const matching = SUGGESTIONS.filter((s) => s.actionType === topCategory);
    if (matching.length > 0) {
      // Use day of year for pseudo-random but deterministic daily selection
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
      );
      return matching[dayOfYear % matching.length];
    }
  }

  // Fallback: deterministic daily rotation
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return SUGGESTIONS[dayOfYear % SUGGESTIONS.length];
}
