import { useRef, useMemo, useState } from 'react';
import { useApp } from './context/AppContext';
import OnboardingQuiz from './components/Onboarding/OnboardingQuiz';
import HabitatCanvas from './components/Habitat/HabitatCanvas';
import HabitatSimPanel from './components/Habitat/HabitatSimPanel';
import QuickLog from './components/QuickLog/QuickLog';

import Dashboard from './components/Dashboard/Dashboard';
import Leaderboard from './components/Leaderboard/Leaderboard';
import Suggestions from './components/Suggestions/Suggestions';
import SidebarWidgets from './components/Habitat/SidebarWidgets';
import BottomNav from './components/UI/BottomNav';
import Toast from './components/UI/Toast';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { EMISSION_FACTORS } from './data/emissionFactors';
import { getWeeklyTotals, getLocalDateString } from './utils/carbonCalculator';
import { generateMicroAction } from './utils/microActionGenerator';
import { decodeEntities } from './utils/security';
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
    unlockBadge,
  } = useApp();

  const habitatRef = useRef(null);

  const [manualTime, setManualTime] = useState(12);
  const [isRealTime, setIsRealTime] = useState(true);
  const [windSpeed, setWindSpeed] = useState(3);
  const [showEcoHome, setShowEcoHome] = useState(true);

  // Find existing log for today to pre-populate QuickLog
  const todayStr = getLocalDateString();
  const existingLogForToday = useMemo(() => {
    return state.logs.find(l => l.date && getLocalDateString(l.date) === todayStr);
  }, [state.logs, todayStr]);

  // Generate daily micro-action suggestion
  const microAction = useMemo(
    () => generateMicroAction(state.logs, state.habitat),
    [state.logs, state.habitat]
  );

  const weeklyDayTotals = useMemo(() => getWeeklyTotals(state.logs), [state.logs]);
  const userWeeklyCO2 = useMemo(() => {
    const actual = Math.round(
      weeklyDayTotals.reduce((sum, d) => sum + d.total, 0) * 10
    ) / 10;
    // Fallback 98.5 only when user has genuinely no logs this week
    return actual > 0 ? actual : 98.5;
  }, [weeklyDayTotals]);

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

    // Auto-navigate to dashboard so the user sees their data immediately
    setTimeout(() => setActiveTab('dashboard'), 800);
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
              <strong>{decodeEntities(state.user.name)}'s</strong> island · {state.habitat.trees} trees · {state.habitat.flowers} flowers · Air: {state.habitat.smogLevel > 0.7 ? '🌫️ Smoggy' : state.habitat.smogLevel > 0.3 ? '🌤️ Hazy' : '☀️ Clear'} · Water: {state.habitat.waterClarity > 0.7 ? '💧 Crystal' : state.habitat.waterClarity > 0.3 ? '🌊 Cloudy' : '🟫 Murky'}
            </p>

            {/* Simulation Controls Panel */}
            <HabitatSimPanel
              isRealTime={isRealTime}
              manualTime={manualTime}
              windSpeed={windSpeed}
              showEcoHome={showEcoHome}
              onRealTimeToggle={() => setIsRealTime(!isRealTime)}
              onManualTimeChange={setManualTime}
              onWindSpeedChange={setWindSpeed}
              onEcoHomeToggle={() => setShowEcoHome(!showEcoHome)}
            />

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
          <ErrorBoundary>
            <QuickLog
              onLog={handleLog}
              emissionFactors={EMISSION_FACTORS}
              baselineScore={state.user.baselineScore}
              existingLog={existingLogForToday}
            />
          </ErrorBoundary>
        </div>

        {/* Dashboard panel */}
        <div
          className={`app__panel ${state.activeTab === 'dashboard' ? 'app__panel--active' : ''}`}
          id="panel-dashboard"
          role="tabpanel"
          aria-labelledby="nav-tab-dashboard"
        >
          <ErrorBoundary>
            <Dashboard
              logs={state.logs}
              streaks={state.streaks}
              baselineScore={state.user.baselineScore}
              habitatState={state.habitat}
              userName={state.user.name}
              region={state.user.region || 'global'}
            />
          </ErrorBoundary>
        </div>

        {/* Leaderboard panel */}
        <div
          className={`app__panel ${state.activeTab === 'social' ? 'app__panel--active' : ''}`}
          id="panel-social"
          role="tabpanel"
          aria-labelledby="nav-tab-social"
        >
          <ErrorBoundary>
            <Leaderboard
              logs={state.logs}
              currentStreak={state.streaks.current}
              habitatState={state.habitat}
              userWeeklyCO2={userWeeklyCO2}
              weeklyDaysLogged={weeklyDayTotals.filter(d => d.hasLog).length}
              unlockedBadges={state.unlockedBadges}
              onUnlockBadge={unlockBadge}
              userName={state.user.name}
              baselineScore={state.user.baselineScore}
            />
          </ErrorBoundary>
        </div>

        {/* Suggestions panel */}
        <div
          className={`app__panel ${state.activeTab === 'suggestions' ? 'app__panel--active' : ''}`}
          id="panel-suggestions"
          role="tabpanel"
          aria-labelledby="nav-tab-suggestions"
        >
          <ErrorBoundary>
            <Suggestions logs={state.logs} />
          </ErrorBoundary>
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
