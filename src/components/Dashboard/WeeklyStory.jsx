/**
 * WeeklyStory — AI-generated weekly narrative about the habitat's journey.
 * Falls back to template-based stories if AI is unavailable.
 */

import { useState, useMemo } from 'react';
import { getHabitatNarrative } from '../Habitat/habitatEngine';
import './WeeklyStory.css';

/**
 * Generate a template-based weekly story from log data.
 * @param {Array} weeklyData - 7-day totals
 * @param {Object} habitatState - Current habitat state
 * @param {Array} logs - All logs
 * @returns {string}
 */
function generateTemplateStory(weeklyData, habitatState, logs) {
  const daysLogged = weeklyData.filter((d) => d.total > 0);
  if (daysLogged.length === 0) {
    return "Your island awaits your first week of adventures. Start logging your daily choices to watch your ecosystem come alive! 🏝️";
  }

  const totalCO2 = daysLogged.reduce((s, d) => s + d.total, 0);
  const avgCO2 = (totalCO2 / daysLogged.length).toFixed(1);
  const bestDay = [...daysLogged].sort((a, b) => a.total - b.total)[0];
  const worstDay = [...daysLogged].sort((a, b) => b.total - a.total)[0];

  const parts = [];

  // Opening
  if (habitatState.healthScore >= 70) {
    parts.push(`This week, your island flourished beautifully! Over ${daysLogged.length} days of logging, you averaged ${avgCO2}kg CO₂ per day.`);
  } else if (habitatState.healthScore >= 40) {
    parts.push(`Your island had a mixed week. With ${daysLogged.length} days logged, your average was ${avgCO2}kg CO₂ per day.`);
  } else {
    parts.push(`It was a challenging week for your island. Across ${daysLogged.length} days, you averaged ${avgCO2}kg CO₂ per day.`);
  }

  // Best day
  if (bestDay) {
    parts.push(`Your greenest day was ${bestDay.dayName} with only ${bestDay.total}kg — the trees swayed happily! 🌳`);
  }

  // Worst day
  if (worstDay && worstDay.date !== bestDay?.date) {
    parts.push(`${worstDay.dayName} was tougher at ${worstDay.total}kg, but every day is a new chance to grow.`);
  }

  // Habitat description
  const narrative = getHabitatNarrative(habitatState);
  if (narrative) {
    parts.push(narrative);
  }

  // Closing tip
  if (habitatState.healthScore >= 70) {
    parts.push("Keep up the amazing work — your island is becoming a paradise! 🌈");
  } else {
    parts.push("Small changes add up. Try one green swap each day and watch your island transform! 🌿");
  }

  return parts.join(' ');
}

/**
 * @param {Object} props
 * @param {Array} props.weeklyData - 7-day totals
 * @param {Object} props.habitatState - Current habitat state
 * @param {Array} props.logs - All logs
 */
export default function WeeklyStory({ weeklyData = [], habitatState = {}, logs = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState(null);

  const templateStory = useMemo(
    () => generateTemplateStory(weeklyData, habitatState, logs),
    [weeklyData, habitatState, logs]
  );

  const displayStory = story || templateStory;

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation with a short delay, then use template
    // In production, this would call Gemini API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setStory(templateStory);
    setIsGenerating(false);
  };

  return (
    <section className="weekly-story" aria-label="Weekly habitat story">
      <h3 className="weekly-story__title">
        <span className="weekly-story__icon" aria-hidden="true">📖</span>
        Your Island's Story
      </h3>

      <div className="weekly-story__card">
        {isGenerating ? (
          <div className="weekly-story__skeleton">
            <div className="weekly-story__skeleton-line" style={{ width: '95%' }} />
            <div className="weekly-story__skeleton-line" style={{ width: '80%' }} />
            <div className="weekly-story__skeleton-line" style={{ width: '88%' }} />
            <div className="weekly-story__skeleton-line" style={{ width: '70%' }} />
          </div>
        ) : (
          <p className="weekly-story__text">{displayStory}</p>
        )}
      </div>

      <button
        id="weekly-story-generate-btn"
        className="weekly-story__generate-btn"
        onClick={handleGenerate}
        disabled={isGenerating}
        aria-label="Generate weekly story"
      >
        {isGenerating ? '✨ Writing...' : '✨ Generate Story'}
      </button>
    </section>
  );
}
