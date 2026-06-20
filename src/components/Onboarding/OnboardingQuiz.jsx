/**
 * OnboardingQuiz — Multi-step animated onboarding quiz for CarbonTwin.
 * Establishes the user's carbon baseline through 6 steps.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { EMISSION_FACTORS } from '../../data/emissionFactors';
import './OnboardingQuiz.css';

const STEPS = ['welcome', 'name', 'transport', 'diet', 'energy', 'results'];

const TRANSPORT_OPTIONS = [
  { id: 'car', emoji: '🚗', label: 'Car' },
  { id: 'bus', emoji: '🚌', label: 'Bus' },
  { id: 'train', emoji: '🚇', label: 'Train' },
  { id: 'bicycle', emoji: '🚲', label: 'Bike' },
  { id: 'walking', emoji: '🚶', label: 'Walk' },
  { id: 'motorcycle', emoji: '🏍️', label: 'Motorcycle' },
];

const DIET_OPTIONS = [
  { id: 'omnivore', emoji: '🥩', title: 'Omnivore', desc: 'Meat most days' },
  { id: 'flexitarian', emoji: '🍗', title: 'Flexitarian', desc: 'Meat 2-3x/week' },
  { id: 'vegetarian', emoji: '🥗', title: 'Vegetarian', desc: 'No meat, some dairy' },
  { id: 'vegan', emoji: '🌱', title: 'Vegan', desc: 'Fully plant-based' },
];

/** Calculate baseline score from quiz answers */
function calcBaseline(data) {
  let total = 0;
  const factor = EMISSION_FACTORS.transportation[data.transport.mode] ?? 0;
  total += factor * (data.transport.dailyDistanceKm || 0);
  const dietFactors = { omnivore: 3.6, flexitarian: 2.5, vegetarian: 0.7, vegan: 0.4 };
  total += (dietFactors[data.diet] || 2.5) * 3;
  total += (data.energy.acHoursPerDay || 0) * 1.0;
  if (data.energy.longShowers) total += 1.0;
  if (!data.energy.energyConscious) total += 2.0;
  return Math.round(total * 10) / 10;
}

/**
 * @param {Object} props
 * @param {Function} props.onComplete - Called with user data when quiz finishes
 */
export default function OnboardingQuiz({ onComplete }) {
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [transportMode, setTransportMode] = useState('car');
  const [dailyKm, setDailyKm] = useState(10);
  const [diet, setDiet] = useState('');
  const [acHours, setAcHours] = useState(2);
  const [longShowers, setLongShowers] = useState(false);
  const [energyConscious, setEnergyConscious] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const scoreRef = useRef(0);
  const stepName = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  /** One-click demo: fills all fields with realistic sample data and jumps to results */
  const handleDemoFill = useCallback(() => {
    setName('Rudrakshi');
    setTransportMode('bicycle');
    setDailyKm(5);
    setDiet('vegetarian');
    setAcHours(2);
    setLongShowers(false);
    setEnergyConscious(true);
    // Jump straight to the results step
    setStep(STEPS.length - 1);
  }, []);

  /** Animate the score counter on results step */
  useEffect(() => {
    if (stepName !== 'results') return;
    const data = {
      transport: { mode: transportMode, dailyDistanceKm: dailyKm },
      diet,
      energy: { acHoursPerDay: acHours, longShowers, energyConscious },
    };
    const target = calcBaseline(data);
    scoreRef.current = target;

    let frame = 0;
    const totalFrames = 60;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setAnimatedScore(Math.round(target * eased * 10) / 10);
      if (frame >= totalFrames) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [stepName, transportMode, dailyKm, diet, acHours, longShowers, energyConscious]);

  const handleFinish = () => {
    const baseline = scoreRef.current;
    onComplete({
      name: name.trim() || 'Explorer',
      transport: { mode: transportMode, dailyDistanceKm: dailyKm },
      diet: diet || 'omnivore',
      energy: { acHoursPerDay: acHours, longShowers, energyConscious },
      baselineScore: baseline,
    });
  };

  const getStepClass = (idx) => {
    if (idx === step) return 'oq-step oq-step--active';
    if (idx < step) return 'oq-step oq-step--exit-left';
    return 'oq-step oq-step--enter-right';
  };

  return (
    <div className="onboarding-quiz" role="main" aria-label="Onboarding quiz">
      {/* Persistent floating Demo Fill button — visible on all non-results steps */}
      {stepName !== 'results' && (
        <div className="oq-demo-fab-wrapper">
          <button
            id="oq-btn-demo-fab"
            className="oq-demo-fab"
            onClick={handleDemoFill}
            aria-label="Auto-fill quiz with demo data"
            title="Fill quiz instantly with sample eco-friendly data"
          >
            ⚡ Demo Fill
          </button>
        </div>
      )}
      {/* Progress bar */}
      {step > 0 && step < STEPS.length - 1 && (
        <div className="oq-progress">
          <div className="oq-progress-info">
            <span>Step {step} of {STEPS.length - 2}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="oq-progress-track">
            <div className="oq-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="oq-progress-dots">
            {STEPS.slice(1, -1).map((_, i) => (
              <span
                key={i}
                className={`oq-dot ${i + 1 === step ? 'oq-dot--active' : ''} ${i + 1 < step ? 'oq-dot--completed' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="oq-step-container">
        {/* Step 0: Welcome */}
        <div className={getStepClass(0)}>
          <div className="oq-welcome">
            <div className="oq-card">
              <div className="oq-island-preview" aria-hidden="true">🏝️</div>
              <h1 className="oq-app-title">CarbonTwin</h1>
              <p className="oq-tagline">Your lifestyle, visualized</p>
              <button
                id="oq-btn-begin"
                className="oq-btn-primary"
                onClick={goNext}
                aria-label="Begin your journey"
              >
                🌿 Begin Your Journey
              </button>
              <button
                id="oq-btn-demo"
                className="oq-btn-demo"
                onClick={handleDemoFill}
                aria-label="Auto-fill with demo data"
              >
                ⚡ Demo Fill
              </button>
              <p className="oq-demo-hint">Instantly fills the quiz with sample eco-friendly data</p>
            </div>
          </div>
        </div>

        {/* Step 1: Name */}
        <div className={getStepClass(1)}>
          <div className="oq-card">
            <h2 className="oq-heading">What should we call you?</h2>
            <p className="oq-subheading">Personalize your island experience</p>
            <div className="oq-input-group">
              <input
                id="oq-name-input"
                className="oq-input"
                type="text"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoComplete="off"
                aria-label="Your name"
              />
              <label htmlFor="oq-name-input" className="oq-input-label">Your name</label>
            </div>
            <div className="oq-actions">
              <button className="oq-btn-secondary" onClick={goBack}>← Back</button>
              <button
                id="oq-btn-name-next"
                className="oq-btn-primary"
                onClick={goNext}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Transport */}
        <div className={getStepClass(2)}>
          <div className="oq-card">
            <h2 className="oq-heading">How do you get around?</h2>
            <p className="oq-subheading">Select your primary transport mode</p>
            <div className="oq-icon-grid" role="radiogroup" aria-label="Transport modes">
              {TRANSPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  id={`oq-transport-${opt.id}`}
                  className={`oq-icon-option ${transportMode === opt.id ? 'oq-icon-option--selected' : ''}`}
                  onClick={() => setTransportMode(opt.id)}
                  role="radio"
                  aria-checked={transportMode === opt.id}
                  type="button"
                >
                  <span className="oq-icon-emoji" aria-hidden="true">{opt.emoji}</span>
                  <span className="oq-icon-label">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="oq-slider-group">
              <div className="oq-slider-header">
                <span className="oq-slider-label">Daily commute distance</span>
                <span className="oq-slider-value">{dailyKm} km</span>
              </div>
              <input
                id="oq-distance-slider"
                className="oq-slider"
                type="range"
                min="0"
                max="100"
                value={dailyKm}
                onChange={(e) => setDailyKm(Number(e.target.value))}
                aria-label="Daily commute distance in kilometers"
              />
            </div>
            <div className="oq-actions">
              <button className="oq-btn-secondary" onClick={goBack}>← Back</button>
              <button id="oq-btn-transport-next" className="oq-btn-primary" onClick={goNext}>Continue →</button>
            </div>
          </div>
        </div>

        {/* Step 3: Diet */}
        <div className={getStepClass(3)}>
          <div className="oq-card">
            <h2 className="oq-heading">What best describes your diet?</h2>
            <p className="oq-subheading">Your food choices have a huge impact</p>
            <div className="oq-diet-grid" role="radiogroup" aria-label="Diet types">
              {DIET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  id={`oq-diet-${opt.id}`}
                  className={`oq-diet-card ${diet === opt.id ? 'oq-diet-card--selected' : ''}`}
                  onClick={() => setDiet(opt.id)}
                  role="radio"
                  aria-checked={diet === opt.id}
                  type="button"
                >
                  <span className="oq-diet-emoji" aria-hidden="true">{opt.emoji}</span>
                  <span className="oq-diet-title">{opt.title}</span>
                  <span className="oq-diet-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            <div className="oq-actions">
              <button className="oq-btn-secondary" onClick={goBack}>← Back</button>
              <button
                id="oq-btn-diet-next"
                className="oq-btn-primary"
                onClick={goNext}
                disabled={!diet}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>

        {/* Step 4: Energy */}
        <div className={getStepClass(4)}>
          <div className="oq-card">
            <h2 className="oq-heading">Your home energy habits</h2>
            <p className="oq-subheading">Help us estimate your energy footprint</p>
            <div className="oq-toggle-list">
              <div className="oq-toggle-item">
                <div className="oq-toggle-info">
                  <span className="oq-toggle-label">❄️ AC / Heating</span>
                  <span className="oq-toggle-hint">Average hours per day</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    id="oq-ac-slider"
                    className="oq-slider"
                    type="range"
                    min="0"
                    max="12"
                    value={acHours}
                    onChange={(e) => setAcHours(Number(e.target.value))}
                    style={{ width: '100px' }}
                    aria-label="AC hours per day"
                  />
                  <span style={{ color: 'var(--oq-accent-green)', fontWeight: 600, minWidth: '30px' }}>{acHours}h</span>
                </div>
              </div>
              <div className="oq-toggle-item">
                <div className="oq-toggle-info">
                  <span className="oq-toggle-label">🚿 Long showers</span>
                  <span className="oq-toggle-hint">Regularly take 10+ min showers</span>
                </div>
                <label className="oq-toggle-switch">
                  <input
                    id="oq-shower-toggle"
                    type="checkbox"
                    checked={longShowers}
                    onChange={(e) => setLongShowers(e.target.checked)}
                    aria-label="Long showers"
                  />
                  <span className="oq-toggle-track" />
                </label>
              </div>
              <div className="oq-toggle-item">
                <div className="oq-toggle-info">
                  <span className="oq-toggle-label">💡 Energy conscious</span>
                  <span className="oq-toggle-hint">Turn off lights, unplug devices</span>
                </div>
                <label className="oq-toggle-switch">
                  <input
                    id="oq-eco-toggle"
                    type="checkbox"
                    checked={energyConscious}
                    onChange={(e) => setEnergyConscious(e.target.checked)}
                    aria-label="Energy conscious"
                  />
                  <span className="oq-toggle-track" />
                </label>
              </div>
            </div>
            <div className="oq-actions">
              <button className="oq-btn-secondary" onClick={goBack}>← Back</button>
              <button id="oq-btn-energy-next" className="oq-btn-primary" onClick={goNext}>See Results →</button>
            </div>
          </div>
        </div>

        {/* Step 5: Results */}
        <div className={getStepClass(5)}>
          <div className="oq-results">
            <div className="oq-card">
              <h2 className="oq-heading oq-animate-in">Your Carbon Baseline</h2>
              <p className="oq-subheading oq-animate-in oq-animate-in--delay-1">
                Estimated daily CO₂ footprint
              </p>
              <div className="oq-score-container oq-score-reveal">
                <p className="oq-score-number">{animatedScore}</p>
                <p className="oq-score-unit">kg CO₂ / day</p>
              </div>
              <div className="oq-comparison oq-animate-in oq-animate-in--delay-2">
                <div className="oq-comparison-labels">
                  <span className="oq-comparison-label">
                    <span className="oq-comparison-dot oq-comparison-dot--user" />
                    You: {animatedScore} kg/day
                  </span>
                  <span className="oq-comparison-label">
                    <span className="oq-comparison-dot oq-comparison-dot--average" />
                    Target: 22 kg/day
                  </span>
                </div>
                <div className="oq-comparison-bar">
                  <div
                    className="oq-comparison-fill oq-comparison-fill--user"
                    style={{ width: `${Math.min(100, (animatedScore / 30) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="oq-result-message oq-animate-in oq-animate-in--delay-3">
                {animatedScore < 15
                  ? "Great start! You're already below the high-income average target. Let's keep your island thriving! 🌳"
                  : animatedScore < 22
                    ? "Not bad! You're close to the target. Small changes can make your island flourish! 🌿"
                    : "There's room to improve — but that's why you're here! Let's grow your island together. 🏝️"}
              </p>
              <p className="carbon-footnote oq-animate-in oq-animate-in--delay-3">
                Based on India's 2024 per-capita estimate of 5.6 kg/day (IEA) vs. global high-income target of 22 kg/day. Grid & LCA factors verified against IPCC, US EPA, & UK DEFRA (2024).
              </p>
              <div className="oq-actions oq-actions--center oq-animate-in oq-animate-in--delay-3">
                <button
                  id="oq-btn-finish"
                  className="oq-btn-primary"
                  onClick={handleFinish}
                >
                  🏝️ Meet Your Island
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
