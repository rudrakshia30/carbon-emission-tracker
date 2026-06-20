/**
 * App — Main application shell for CarbonTwin.
 * Orchestrates onboarding, tab navigation, and all top-level panels.
 */

import { useRef, useMemo, useState } from 'react';
import { useApp } from './context/AppContext';
import OnboardingQuiz from './components/Onboarding/OnboardingQuiz';
import HabitatCanvas from './components/Habitat/HabitatCanvas';
import QuickLog from './components/QuickLog/QuickLog';
import WeeklyStory from './components/Dashboard/WeeklyStory';
import Dashboard from './components/Dashboard/Dashboard';
import Leaderboard from './components/Leaderboard/Leaderboard';
import Suggestions from './components/Suggestions/Suggestions';
import SidebarWidgets from './components/Habitat/SidebarWidgets';
import BottomNav from './components/UI/BottomNav';
import Toast from './components/UI/Toast';
import { EMISSION_FACTORS } from './data/emissionFactors';
import { getWeeklyAverage, getLocalDateString } from './utils/carbonCalculator';
import { generateMicroAction } from './utils/microActionGenerator';
import './App.css';

function App() {
  const {
    state,
    completeOnboarding,
    addLog,
    setActiveTab,
    addToast,
    dismissToast,
    resetApp,
  } = useApp();

  const habitatRef = useRef(null);

  // Simulation controls state
  const [manualTime, setManualTime] = useState(12);
  const [isRealTime, setIsRealTime] = useState(true);
  const [windSpeed, setWindSpeed] = useState(3);
  const [showEcoHome, setShowEcoHome] = useState(true);

  // Find existing log for today to pre-populate QuickLog
  const todayStr = getLocalDateString();
  const existingLogForToday = useMemo(() => {
    return state.logs.find(l => l.date && l.date.startsWith(todayStr));
  }, [state.logs, todayStr]);

  // Generate daily micro-action suggestion
  const microAction = useMemo(
    () => generateMicroAction(state.logs, state.habitat),
    [state.logs, state.habitat]
  );

  // Weekly CO2 for leaderboard
  const weeklyAvg = useMemo(() => getWeeklyAverage(state.logs), [state.logs]);
  const userWeeklyCO2 = Math.round(weeklyAvg * 7 * 10) / 10 || 98.5;

  /* ── Onboarding ──────────────────────────────────── */
  if (!state.onboarded) {
    return (
      <OnboardingQuiz
        onComplete={(userData) => {
          completeOnboarding(userData);
          addToast({
            message: `Welcome ${userData.name}! Your island is ready 🏝️`,
            type: 'success',
            icon: '🌿',
          });
        }}
      />
    );
  }

  /* ── Log handler ─────────────────────────────────── */
  const handleLog = (logEntry) => {
    addLog(logEntry);

    // Trigger habitat effect
    if (habitatRef.current) {
      if (logEntry.totalCO2 < state.user.baselineScore) {
        habitatRef.current.triggerEffect('sparkle');
      } else {
        habitatRef.current.triggerEffect('smoke');
      }
    }

    // Toast feedback
    const isGood = logEntry.totalCO2 < state.user.baselineScore;
    addToast({
      message: isGood
        ? `Great! Only ${logEntry.totalCO2}kg CO₂ today 🌿`
        : `${logEntry.totalCO2}kg CO₂ logged. Try to go greener tomorrow!`,
      type: isGood ? 'success' : 'warning',
      icon: isGood ? '🌸' : '🔥',
    });
  };

  const handleExportImage = () => {
    if (habitatRef.current) {
      const dataURL = habitatRef.current.exportToPNG();
      if (dataURL) {
        const link = document.createElement('a');
        link.download = `${state.user.name}-island.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast({
          message: 'Island snapshot saved! 📸',
          type: 'success',
          icon: '🖼️',
        });
      }
    }
  };

  /* ── Render panels ───────────────────────────────── */
  return (
    <div className="app">
      {/* Reset button */}
      <button
        id="app-reset-btn"
        className="app__reset-btn"
        onClick={() => {
          if (window.confirm('Reset all data? Your island will be lost.')) {
            resetApp();
          }
        }}
        aria-label="Reset application data"
        type="button"
      >
        ↺ Reset
      </button>

      {/* Toast notifications */}
      {state.toasts.length > 0 && (
        <div className="app__toasts">
          {state.toasts.slice(0, 2).map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              icon={toast.icon}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </div>
      )}

      {/* Content panels */}
      <main className="app__content">
        {/* Habitat panel */}
        <div
          className={`app__panel ${state.activeTab === 'habitat' ? 'app__panel--active' : ''}`}
          id="panel-habitat"
          role="tabpanel"
          aria-labelledby="nav-tab-habitat"
        >
          <div className="app__habitat-panel">
            <div className="app__habitat-main">
              <div className="app__habitat-header">
                <h1 className="app__habitat-title">🏝️ Your Island</h1>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="app__habitat-export-btn"
                    onClick={handleExportImage}
                    title="Export Island as PNG"
                    type="button"
                  >
                    📸 Share
                  </button>
                  <div className="app__habitat-score">
                    <span className="app__habitat-score-dot" />
                    Health: {state.habitat.healthScore}%
                  </div>
                </div>
              </div>

            <HabitatCanvas
              ref={habitatRef}
              habitatState={state.habitat}
              manualTime={isRealTime ? null : manualTime}
              windSpeed={windSpeed}
              showEcoHome={showEcoHome}
            />

            <p className="app__habitat-name">
              <strong>{state.user.name}'s</strong> island · {state.habitat.trees} trees · {state.habitat.flowers} flowers · Air: {state.habitat.smogLevel > 0.7 ? '🌫️ Smoggy' : state.habitat.smogLevel > 0.3 ? '🌤️ Hazy' : '☀️ Clear'} · Water: {state.habitat.waterClarity > 0.7 ? '💧 Crystal' : state.habitat.waterClarity > 0.3 ? '🌊 Cloudy' : '🟫 Murky'}
            </p>

            {/* Simulation Controls Panel */}
            <div className="simulation-panel">
              <h3 className="simulation-panel__title">🛠️ Habitat Simulator</h3>
              <div className="simulation-panel__grid">
                
                {/* Time of Day Control */}
                <div className="sim-control">
                  <div className="sim-control__header">
                    <label className="sim-control__label">
                      🌅 Time of Day: <strong>{isRealTime ? 'Auto (Real-time)' : `${Math.floor(manualTime)}:00`}</strong>
                    </label>
                    <button
                      className={`sim-control__toggle-btn ${isRealTime ? '' : 'sim-control__toggle-btn--active'}`}
                      onClick={() => setIsRealTime(!isRealTime)}
                    >
                      {isRealTime ? '🔓 Unlock' : '🔒 Lock to Real'}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="23.9"
                    step="0.1"
                    disabled={isRealTime}
                    value={isRealTime ? new Date().getHours() : manualTime}
                    onChange={(e) => setManualTime(parseFloat(e.target.value))}
                    className="sim-control__slider"
                  />
                </div>

                {/* Wind Speed Control */}
                <div className="sim-control">
                  <div className="sim-control__header">
                    <label className="sim-control__label">
                      💨 Wind Speed: <strong>{windSpeed}x</strong>
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(parseInt(e.target.value))}
                    className="sim-control__slider"
                  />
                </div>

                {/* Eco-Home Toggle */}
                <div className="sim-control sim-control--full-width">
                  <div className="sim-control__checkbox-wrapper">
                    <label htmlFor="sim-toggle-home" className="sim-control__label">
                      🏡 Render Digital Twin Eco-Home
                    </label>
                    <button
                      id="sim-toggle-home"
                      className={`sim-toggle ${showEcoHome ? 'sim-toggle--on' : ''}`}
                      onClick={() => setShowEcoHome(!showEcoHome)}
                      role="switch"
                      aria-checked={showEcoHome}
                    >
                      <span className="sim-toggle__knob" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            </div>
            <div className="app__habitat-sidebar">
              <SidebarWidgets
                microAction={microAction}
                onAcceptMicroAction={() => {
                  if (habitatRef.current) {
                    habitatRef.current.triggerEffect('bloom');
                  }
                  addToast({
                    message: 'Nice! Your island thanks you 🌿',
                    type: 'achievement',
                    icon: '🌸',
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* QuickLog panel */}
        <div
          className={`app__panel ${state.activeTab === 'log' ? 'app__panel--active' : ''}`}
          id="panel-log"
          role="tabpanel"
          aria-labelledby="nav-tab-log"
        >
          <QuickLog
            onLog={handleLog}
            emissionFactors={EMISSION_FACTORS}
            baselineScore={state.user.baselineScore}
            existingLog={existingLogForToday}
          />
        </div>

        {/* Dashboard panel */}
        <div
          className={`app__panel ${state.activeTab === 'dashboard' ? 'app__panel--active' : ''}`}
          id="panel-dashboard"
          role="tabpanel"
          aria-labelledby="nav-tab-dashboard"
        >
          <Dashboard
            logs={state.logs}
            streaks={state.streaks}
            baselineScore={state.user.baselineScore}
            habitatState={state.habitat}
            userName={state.user.name}
          />
        </div>

        {/* Leaderboard panel */}
        <div
          className={`app__panel ${state.activeTab === 'social' ? 'app__panel--active' : ''}`}
          id="panel-social"
          role="tabpanel"
          aria-labelledby="nav-tab-social"
        >
          <Leaderboard
            logs={state.logs}
            currentStreak={state.streaks.current}
            habitatState={state.habitat}
            userWeeklyCO2={userWeeklyCO2}
          />
        </div>

        {/* Suggestions panel */}
        <div
          className={`app__panel ${state.activeTab === 'suggestions' ? 'app__panel--active' : ''}`}
          id="panel-suggestions"
          role="tabpanel"
          aria-labelledby="nav-tab-suggestions"
        >
          <Suggestions logs={state.logs} />
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav
        activeTab={state.activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

export default App;
