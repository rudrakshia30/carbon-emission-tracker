/**
 * Dashboard — Main insights screen showing carbon data visualization.
 * Features score ring, category breakdown, weekly trend, personalized insights, and streak counter.
 */

import { useMemo } from 'react';
import { getWeeklyTotals, getWeeklyAverage, getCategoryPercentages } from '../../utils/carbonCalculator';
import { generateInsights } from '../../utils/insightGenerator';
import WeeklyStory from './WeeklyStory';
import './Dashboard.css';

const CATEGORY_COLORS = {
  transport: { color: '#3b82f6', icon: '🚗', label: 'Transport' },
  food: { color: '#f59e0b', icon: '🍽️', label: 'Food' },
  energy: { color: '#8b5cf6', icon: '⚡', label: 'Energy' },
  shopping: { color: '#ec4899', icon: '🛍️', label: 'Shopping' },
};

/**
 * @param {Object} props
 * @param {Array} props.logs - All log entries
 * @param {Object} props.streaks - { current, best }
 * @param {number} props.baselineScore - User's baseline daily CO2
 * @param {Object} props.habitatState - Current habitat state
 */
export default function Dashboard({ logs = [], streaks = { current: 0, best: 0 }, baselineScore = 22, habitatState = {} }) {
  // Today's total
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.date?.startsWith(todayStr));
  const todayTotal = todayLogs.reduce((s, l) => s + (l.totalCO2 || 0), 0);
  const todayRounded = Math.round(todayTotal * 10) / 10;

  // Score ring percentage (vs baseline target)
  const scorePercent = Math.min(100, Math.round((todayTotal / baselineScore) * 100));
  const scoreColor = scorePercent < 50 ? '#10b981' : scorePercent < 80 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (scorePercent / 100) * circumference;

  // Category breakdown for today
  const todayBreakdown = useMemo(() => {
    const totals = { transport: 0, food: 0, energy: 0, shopping: 0, total: todayTotal };
    todayLogs.forEach((l) => {
      totals.transport += l.transport || 0;
      totals.food += l.food || 0;
      totals.energy += l.energy || 0;
      totals.shopping += l.shopping || 0;
    });
    return totals;
  }, [todayLogs, todayTotal]);

  const percentages = getCategoryPercentages(todayBreakdown);

  // Weekly data
  const weeklyTotals = useMemo(() => getWeeklyTotals(logs), [logs]);
  const weeklyAvg = useMemo(() => getWeeklyAverage(logs), [logs]);
  const maxWeekly = Math.max(...weeklyTotals.map((d) => d.total), baselineScore, 1);

  // Insights
  const insights = useMemo(() => generateInsights(logs, baselineScore), [logs, baselineScore]);

  return (
    <div className="dashboard" role="main" aria-label="Carbon footprint dashboard">

      {/* Score Ring */}
      <section className="dash-score-section" aria-label="Today's carbon score">
        <div className="dash-score-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={scoreColor} />
                <stop offset="100%" stopColor={scoreColor} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <circle className="dash-ring-bg" cx="60" cy="60" r="54" />
            <circle
              className="dash-ring-fill"
              cx="60" cy="60" r="54"
              stroke="url(#score-gradient)"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="dash-ring-center">
            <span className="dash-ring-value" style={{ color: scoreColor }}>
              {todayRounded}
            </span>
            <span className="dash-ring-unit">kg CO₂</span>
          </div>
        </div>
        <p className="dash-score-label">
          {todayTotal === 0
            ? 'No logs today yet'
            : `${scorePercent}% of your ${baselineScore}kg target`}
        </p>
      </section>

      {/* Category Breakdown */}
      <section className="dash-card" aria-label="Category breakdown">
        <h3 className="dash-card-title">📊 Category Breakdown</h3>
        <div className="dash-categories">
          {Object.entries(CATEGORY_COLORS).map(([key, cfg]) => (
            <div key={key} className="dash-cat-row">
              <span className="dash-cat-icon" aria-hidden="true">{cfg.icon}</span>
              <span className="dash-cat-label">{cfg.label}</span>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-bar-fill"
                  style={{
                    width: `${percentages[key] || 0}%`,
                    backgroundColor: cfg.color,
                  }}
                />
              </div>
              <span className="dash-cat-value">{percentages[key] || 0}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Trend */}
      <section className="dash-card" aria-label="7-day trend">
        <h3 className="dash-card-title">📈 7-Day Trend</h3>
        <div className="dash-chart">
          {weeklyTotals.map((day, i) => (
            <div key={day.date} className="dash-chart-col">
              <div className="dash-chart-bar-container">
                <div
                  className={`dash-chart-bar ${day.date === todayStr ? 'dash-chart-bar--today' : ''}`}
                  style={{ height: `${(day.total / maxWeekly) * 100}%` }}
                  role="meter"
                  aria-valuenow={day.total}
                  aria-valuemin={0}
                  aria-valuemax={maxWeekly}
                  aria-label={`${day.dayName}: ${day.total} kg CO₂`}
                />
                {day.total > 0 && (
                  <span className="dash-chart-value">{day.total}</span>
                )}
              </div>
              <span className={`dash-chart-label ${day.date === todayStr ? 'dash-chart-label--today' : ''}`}>
                {day.dayName}
              </span>
            </div>
          ))}
          {/* Average line */}
          {weeklyAvg > 0 && (
            <div
              className="dash-chart-avg-line"
              style={{ bottom: `${(weeklyAvg / maxWeekly) * 100}%` }}
              aria-hidden="true"
            >
              <span className="dash-chart-avg-label">avg {weeklyAvg}</span>
            </div>
          )}
        </div>
      </section>

      {/* Personalized Insights */}
      <section className="dash-card" aria-label="Personalized insights">
        <h3 className="dash-card-title">💡 Insights</h3>
        <div className="dash-insights">
          {insights.map((insight, i) => (
            <div key={i} className={`dash-insight dash-insight--${insight.type}`}>
              <span className="dash-insight-icon" aria-hidden="true">{insight.icon}</span>
              <p className="dash-insight-text">{insight.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Streak Counter */}
      <section className="dash-card dash-streak-card" aria-label="Logging streak">
        <div className="dash-streak">
          <span className="dash-streak-fire" aria-hidden="true">
            {streaks.current > 0 ? '🔥' : '💤'}
          </span>
          <div className="dash-streak-info">
            <span className="dash-streak-count">{streaks.current} day streak</span>
            <span className="dash-streak-best">Best: {streaks.best} days</span>
          </div>
        </div>
      </section>

      {/* Weekly Story */}
      <WeeklyStory
        weeklyData={weeklyTotals}
        habitatState={habitatState}
        logs={logs}
      />
    </div>
  );
}
