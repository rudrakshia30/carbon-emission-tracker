/**
 * Insight Generator — Creates personalized insights from log data.
 * @module insightGenerator
 */

/**
 * Generate 2-3 personalized insight cards from the user's logs.
 * @param {Array} logs - Array of log entries
 * @param {number} baselineScore - User's baseline daily CO2
 * @returns {Array<{text: string, icon: string, type: 'positive'|'warning'|'tip'}>}
 */
export function generateInsights(logs, baselineScore = 22) {
  const insights = [];

  if (!logs || logs.length === 0) {
    insights.push({
      text: 'Start logging your daily activities to get personalized insights!',
      icon: '🌟',
      type: 'tip',
    });
    return insights;
  }

  // Get last 7 days of logs
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const recentLogs = logs.filter((l) => new Date(l.date) >= weekAgo);

  if (recentLogs.length === 0) {
    insights.push({
      text: "You haven't logged in a while. Come back to keep your island growing!",
      icon: '🏝️',
      type: 'warning',
    });
    return insights;
  }

  // Category breakdown
  const totals = { transport: 0, food: 0, energy: 0, shopping: 0, all: 0 };
  recentLogs.forEach((log) => {
    totals.transport += log.transport || 0;
    totals.food += log.food || 0;
    totals.energy += log.energy || 0;
    totals.shopping += log.shopping || 0;
    totals.all += log.totalCO2 || 0;
  });

  // 1. Check if transport dominates
  if (totals.all > 0 && totals.transport / totals.all > 0.5) {
    const pct = Math.round((totals.transport / totals.all) * 100);
    insights.push({
      text: `Transport makes up ${pct}% of your carbon footprint. Try biking or taking the bus for shorter trips!`,
      icon: '🚗',
      type: 'warning',
    });
  }

  // 2. Check for plant-based meals
  const plantMeals = recentLogs.reduce((count, log) => {
    if (!log.meals) return count;
    return (
      count +
      (log.meals || []).filter((m) =>
        ['vegetarian', 'vegan', 'vegetarian_meal', 'vegan_meal'].includes(m.type)
      ).length
    );
  }, 0);
  const totalMeals = recentLogs.reduce(
    (count, log) => count + (log.meals?.length || 0),
    0
  );

  if (plantMeals > 0 && totalMeals > 0) {
    if (plantMeals / totalMeals > 0.5) {
      insights.push({
        text: `${plantMeals} plant-based meals this week! 🌱 Your food choices are making a real difference.`,
        icon: '🥗',
        type: 'positive',
      });
    } else {
      const savings = (
        (totalMeals - plantMeals) * 2.5 -
        (totalMeals - plantMeals) * 0.7
      ).toFixed(1);
      insights.push({
        text: `Switching ${Math.ceil((totalMeals - plantMeals) / 2)} more meals to plant-based could save ~${savings}kg CO₂/week.`,
        icon: '🌿',
        type: 'tip',
      });
    }
  }

  // 3. Improvement trend
  if (recentLogs.length >= 3) {
    const firstHalf = recentLogs.slice(0, Math.floor(recentLogs.length / 2));
    const secondHalf = recentLogs.slice(Math.floor(recentLogs.length / 2));

    const avgFirst =
      firstHalf.reduce((s, l) => s + (l.totalCO2 || 0), 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((s, l) => s + (l.totalCO2 || 0), 0) / secondHalf.length;

    if (avgSecond < avgFirst * 0.85) {
      const pct = Math.round((1 - avgSecond / avgFirst) * 100);
      insights.push({
        text: `You're improving! Your recent carbon footprint is ${pct}% lower than earlier this week.`,
        icon: '📈',
        type: 'positive',
      });
    } else if (avgSecond > avgFirst * 1.15) {
      insights.push({
        text: `Your carbon footprint has been creeping up. Small swaps can make a big difference!`,
        icon: '⚠️',
        type: 'warning',
      });
    }
  }

  // 4. Below national average
  const avgDaily = totals.all / recentLogs.length;
  if (avgDaily < baselineScore && insights.length < 3) {
    insights.push({
      text: `Your daily average of ${avgDaily.toFixed(1)}kg is below the national average of ${baselineScore}kg. Keep it up!`,
      icon: '🏆',
      type: 'positive',
    });
  }

  // 5. Specific swap suggestion
  if (insights.length < 3) {
    const hasCarTrips = recentLogs.some((l) => {
      const t = l.rawTransport || l.transport;
      return t?.mode === 'car' || t?.mode === 'car_gasoline';
    });
    if (hasCarTrips) {
      insights.push({
        text: 'Switching 2 car trips to bus each week saves ~3.2kg CO₂. That grows 1 more tree on your island! 🌳',
        icon: '🚌',
        type: 'tip',
      });
    }
  }

  return insights.slice(0, 3);
}
