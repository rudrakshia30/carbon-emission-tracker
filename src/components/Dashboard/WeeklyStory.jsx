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
export default function WeeklyStory({ weeklyData = [], habitatState = {}, logs = [], userName = 'Eco Friend' }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  const templateStory = useMemo(
    () => generateTemplateStory(weeklyData, habitatState, logs),
    [weeklyData, habitatState, logs]
  );

  const displayStory = story || templateStory;

  const handleSaveKey = (e) => {
    const val = e.target.value;
    setApiKeyInput(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStory(null);

    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '').trim();
    if (!apiKey) {
      console.warn("No Gemini API key found (VITE_GEMINI_API_KEY or localStorage). Falling back to template story.");
      // Short delay for satisfying UX shimmer
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStory(templateStory);
      setIsGenerating(false);
      return;
    }

    try {
      const daysLogged = weeklyData.filter((d) => d.total > 0);
      const totalCO2 = daysLogged.reduce((s, d) => s + d.total, 0);
      const avgCO2 = daysLogged.length > 0 ? (totalCO2 / daysLogged.length).toFixed(1) : '0';
      const bestDay = [...daysLogged].sort((a, b) => a.total - b.total)[0];
      const worstDay = [...daysLogged].sort((a, b) => b.total - a.total)[0];

      const promptText = `
You are the AI narrator for CarbonTwin, a carbon footprint tracker where the user's carbon footprint is visualized as a digital twin island ecosystem.
Based on the user's data below, write a short, highly engaging, and beautifully descriptive weekly story (max 3-4 sentences) about how their island's ecosystem fared this week.
Integrate their daily habits and the state of their island (e.g., trees growing, smog clearing, or ocean water turning murky) into a poetic and inspiring narrative. Keep it encouraging and positive, even if their footprint was high.
Do not use markdown formatting (no bold asterisks, no headers).

User Name: ${userName}
Weekly Average CO2: ${avgCO2} kg CO2/day (National Target is 22 kg CO2/day)
Best Day: ${bestDay ? `${bestDay.dayName} (${bestDay.total} kg CO2)` : 'N/A'}
Worst Day: ${worstDay ? `${worstDay.dayName} (${worstDay.total} kg CO2)` : 'N/A'}
Island Health: ${habitatState.healthScore}%
Trees: ${habitatState.trees}
Flowers: ${habitatState.flowers}
Smog Level: ${habitatState.smogLevel} (0 is clear, 1 is heavy smog)
Water Clarity: ${habitatState.waterClarity} (0 is murky, 1 is crystal clear)
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setStory(text.trim());
      } else {
        throw new Error("No text content returned from Gemini API");
      }
    } catch (err) {
      console.error("Failed to generate AI story:", err);
      setStory(templateStory);
    } finally {
      setIsGenerating(false);
    }
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

      {/* API Key Settings Toggle */}
      <div className="weekly-story__settings-toggle">
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="weekly-story__settings-btn"
          type="button"
        >
          ⚙️ {showSettings ? 'Hide Key Settings' : 'Set Gemini API Key'}
        </button>
      </div>

      {showSettings && (
        <div className="weekly-story__settings">
          <label className="weekly-story__settings-label">
            Enter Gemini API Key (saved locally):
          </label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={handleSaveKey}
            placeholder="AIzaSy..."
            className="weekly-story__settings-input"
          />
          <p className="weekly-story__settings-tip">
            Or define <code>VITE_GEMINI_API_KEY</code> in a <code>.env</code> file.
          </p>
        </div>
      )}
    </section>
  );
}
