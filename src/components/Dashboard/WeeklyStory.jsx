/**
 * WeeklyStory — AI-generated weekly narrative about the habitat's journey.
 * Falls back to template-based stories if AI is unavailable.
 *
 * Security: AbortController with 15s timeout, 30s rate limiting, output sanitization.
 * Accessibility: aria-busy on loading, aria-labels on all interactive elements.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { getHabitatNarrative } from '../Habitat/habitatEngine';
import { getApiKey, storeApiKey, sanitizeString } from '../../utils/security';
import './WeeklyStory.css';

/** Rate limit cooldown in milliseconds */
const RATE_LIMIT_MS = 30_000;

/** API request timeout in milliseconds */
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Generate a template-based weekly story from log data.
 * @param {Array} weeklyData - 7-day totals
 * @param {Object} habitatState - Current habitat state
 * @param {Array} _logs - All logs (unused, kept for API compatibility)
 * @returns {string}
 */
function generateTemplateStory(weeklyData, habitatState, _logs) {
  const daysLogged = weeklyData.filter((d) => d.total > 0);
  if (daysLogged.length === 0) {
    return "Your island awaits your first week of adventures. Start logging your daily choices to watch your ecosystem come alive! 🏝️";
  }

  const totalCO2 = daysLogged.reduce((s, d) => s + d.total, 0);
  const avgCO2 = (totalCO2 / daysLogged.length).toFixed(1);

  // Sort once ascending — best is [0], worst is [length-1]
  const sorted = [...daysLogged].sort((a, b) => a.total - b.total);
  const bestDay = sorted[0];
  const worstDay = sorted[sorted.length - 1];

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
 * @param {string} props.userName - User display name
 */
export default function WeeklyStory({ weeklyData = [], habitatState = {}, logs = [], userName = 'Eco Friend' }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (envKey) return '';
    return getApiKey();
  });
  const [showSettings, setShowSettings] = useState(false);

  /** AbortController ref for cleanup on unmount */
  const abortRef = useRef(null);
  /** Timestamp of last successful API call for rate limiting */
  const lastCallRef = useRef(0);

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) clearInterval(interval);
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const templateStory = useMemo(
    () => generateTemplateStory(weeklyData, habitatState, logs),
    [weeklyData, habitatState, logs]
  );

  const displayStory = story || templateStory;

  const handleSaveKey = (e) => {
    const val = e.target.value;
    setApiKeyInput(val);
    storeApiKey(val);
  };

  const handleGenerate = async () => {
    // Rate limiting — prevent spam
    const now = Date.now();
    const timeSinceLast = now - lastCallRef.current;
    if (timeSinceLast < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - timeSinceLast) / 1000);
      setCooldownRemaining(remaining);
      return;
    }

    setIsGenerating(true);
    setStory(null);

    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("No Gemini API key found. Falling back to template story.");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStory(templateStory);
      setIsGenerating(false);
      return;
    }

    // Create AbortController with timeout
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const daysLogged = weeklyData.filter((d) => d.total > 0);
      const totalCO2 = daysLogged.reduce((s, d) => s + d.total, 0);
      const avgCO2 = daysLogged.length > 0 ? (totalCO2 / daysLogged.length).toFixed(1) : '0';

      // Sort once — best ascending, worst at end
      const sorted = [...daysLogged].sort((a, b) => a.total - b.total);
      const bestDay = sorted[0];
      const worstDay = sorted[sorted.length - 1];

      const promptText = `
You are the AI narrator for CarbonTwin, a carbon footprint tracker where the user's carbon footprint is visualized as a digital twin island ecosystem.
Based on the user's data below, write a short, highly engaging, and beautifully descriptive weekly story (max 3-4 sentences) about how their island's ecosystem fared this week.
Integrate their daily habits and the state of their island (e.g., trees growing, smog clearing, or ocean water turning murky) into a poetic and inspiring narrative. Keep it encouraging and positive, even if their footprint was high.
Do not use markdown formatting (no bold asterisks, no headers).

User Name: ${sanitizeString(userName, 50)}
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
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7,
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        // Sanitize AI output before displaying — defense in depth
        setStory(sanitizeString(text.trim(), 1000));
      } else {
        throw new Error("No text content returned from Gemini API");
      }

      lastCallRef.current = Date.now();
      setCooldownRemaining(Math.ceil(RATE_LIMIT_MS / 1000));
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn("AI story generation timed out after 15 seconds.");
      } else {
        console.error("Failed to generate AI story:", err);
      }
      setStory(templateStory);
    } finally {
      clearTimeout(timeoutId);
      abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const isOnCooldown = cooldownRemaining > 0;

  return (
    <section className="weekly-story" aria-label="Weekly habitat story">
      <h3 className="weekly-story__title">
        <span className="weekly-story__icon" aria-hidden="true">📖</span>
        Your Island's Story
      </h3>

      <div
        className="weekly-story__card"
        role="status"
        aria-busy={isGenerating}
        aria-live="polite"
      >
        {isGenerating ? (
          <div className="weekly-story__skeleton" aria-label="Generating story, please wait">
            <span className="sr-only">Generating weekly story, please wait...</span>
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
        disabled={isGenerating || isOnCooldown}
        aria-label={
          isGenerating
            ? 'Generating weekly story'
            : isOnCooldown
              ? `Generate available in ${cooldownRemaining} seconds`
              : 'Generate weekly story'
        }
      >
        {isGenerating
          ? '✨ Writing...'
          : isOnCooldown
            ? `⏳ Wait ${cooldownRemaining}s`
            : '✨ Generate Story'}
      </button>

      {/* API Key Settings Toggle */}
      <div className="weekly-story__settings-toggle">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="weekly-story__settings-btn"
          type="button"
          aria-label={showSettings ? 'Hide Gemini API key settings' : 'Open Gemini API key settings'}
          aria-expanded={showSettings}
        >
          ⚙️ {showSettings ? 'Hide Key Settings' : 'Set Gemini API Key'}
        </button>
      </div>

      {showSettings && (
        <div className="weekly-story__settings">
          <label htmlFor="weekly-story-api-key" className="weekly-story__settings-label">
            Enter Gemini API Key (saved locally):
          </label>
          <input
            id="weekly-story-api-key"
            type="password"
            value={apiKeyInput}
            onChange={handleSaveKey}
            placeholder="AIzaSy..."
            className="weekly-story__settings-input"
            autoComplete="off"
          />
          <p className="weekly-story__settings-tip">
            Or define <code>VITE_GEMINI_API_KEY</code> in a <code>.env</code> file.
          </p>
        </div>
      )}
    </section>
  );
}
