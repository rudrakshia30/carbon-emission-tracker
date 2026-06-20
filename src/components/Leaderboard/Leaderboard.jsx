import { useState, useEffect, useMemo, useCallback } from 'react';
import Confetti from '../UI/Confetti';
import './Leaderboard.css';

/**
 * Badge definitions for the achievement system.
 * Each badge has a unique id, icon, name, description, and a condition function.
 */
const BADGES = [
  {
    id: 'first_log',
    icon: '🌱',
    name: 'Sprouting Habit',
    desc: 'Logged 5 days in total',
    condition: (logs) => logs.length >= 5,
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: 'On Fire',
    desc: '7-day logging streak',
    condition: (_, streak) => streak >= 7,
  },
  {
    id: 'streak_7',
    icon: '⭐',
    name: 'Fortnight Warrior',
    desc: '14-day logging streak',
    condition: (_, streak) => streak >= 14,
  },
  {
    id: 'forest',
    icon: '🌳',
    name: 'Forest Guardian',
    desc: 'Grew 50 trees on your island',
    condition: (_, __, habitat) => habitat.trees >= 50,
  },
  {
    id: 'cyclist',
    icon: '🚴',
    name: 'Cycle Champion',
    desc: 'Biked 20 times',
    condition: (logs) => {
      return logs.filter((l) => {
        const t = l.rawTransport || l.transport;
        if (Array.isArray(t)) {
          return t.some(item => item.mode === 'bicycle' || item.mode === 'bike');
        }
        return t?.mode === 'bicycle' || t?.mode === 'bike';
      }).length >= 20;
    }
  },
  {
    id: 'plant_power',
    icon: '🥗',
    name: 'Plant Power',
    desc: '30 plant-based meals',
    condition: (logs) => {
      const count = logs.reduce(
        (acc, l) =>
          acc +
          (l.meals?.filter((m) =>
            ['vegetarian_meal', 'vegan_meal', 'vegetarian', 'vegan'].includes(m.type)
          ).length || 0),
        0
      );
      return count >= 30;
    },
  },
  {
    id: 'energy_saver',
    icon: '⚡',
    name: 'Energy Saver',
    desc: '14 days with low energy use',
    condition: (logs) =>
      logs.filter((l) => {
        const e = l.rawEnergy || l.energy;
        const acVal = e && typeof e === 'object' ? (e.ac || 0) : (l.energy || 0);
        const heatVal = e && typeof e === 'object' ? (e.heating || 0) : 0;
        return acVal + heatVal <= 2;
      }).length >= 14,
  },
  {
    id: 'under_target',
    icon: '🏆',
    name: 'Below Average',
    desc: 'CO2 under average for 7 days',
    condition: (logs) => {
      return logs.filter(l => l.totalCO2 < 22).length >= 7;
    },
  },
  {
    id: 'half_target',
    icon: '💎',
    name: 'Carbon Cutter',
    desc: 'CO2 under half average for 7 days',
    condition: (logs) => {
      return logs.filter(l => l.totalCO2 < 11).length >= 7;
    },
  },
];



export default function Leaderboard({
  logs = [],
  currentStreak = 0,
  habitatState = { trees: 0, flowers: 0, birds: 0 }
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState(null);
  const [previouslyUnlocked, setPreviouslyUnlocked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ct_unlocked_badges') || '[]');
    } catch {
      return [];
    }
  });


  /** Evaluate which badges are unlocked. */
  const badgeStates = useMemo(() => {
    return BADGES.map((badge) => {
      let unlocked;
      try {
        unlocked = badge.condition(logs, currentStreak, habitatState);
      } catch {
        unlocked = false;
      }
      return { ...badge, unlocked };
    });
  }, [logs, currentStreak, habitatState]);

  /** Track newly unlocked badges and trigger confetti. */
  useEffect(() => {
    const currentUnlocked = badgeStates
      .filter((b) => b.unlocked)
      .map((b) => b.id);
    const newBadges = currentUnlocked.filter(
      (id) => !previouslyUnlocked.includes(id)
    );

    if (newBadges.length > 0) {
      setTimeout(() => {
        setNewlyUnlocked(newBadges[0]);
        setShowConfetti(true);
        setPreviouslyUnlocked(currentUnlocked);
      }, 0);
      localStorage.setItem(
        'ct_unlocked_badges',
        JSON.stringify(currentUnlocked)
      );

      const timer = setTimeout(() => {
        setShowConfetti(false);
        setNewlyUnlocked(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [badgeStates, previouslyUnlocked]);

  /** Handle badge click for details. */
  const handleBadgeClick = useCallback((badge) => {
    if (badge.unlocked) {
      setNewlyUnlocked(badge.id);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setNewlyUnlocked(null);
      }, 3500);
    }
  }, []);

  return (
    <div className="leaderboard" role="main" aria-label="Achievements and badges">
      <Confetti show={showConfetti} />



      {/* ─── BADGES COLLECTION ───────────────────────────────────── */}
      <section className="lb-badges-section" aria-label="Badge collection">
        <h2 className="lb-section-title">
          <span className="lb-section-title__icon" aria-hidden="true">🎖️</span>
          Badges Collection
          <span className="lb-badges-count">
            {badgeStates.filter((b) => b.unlocked).length}/{badgeStates.length}
          </span>
        </h2>

        <div className="lb-badges-grid">
          {badgeStates.map((badge) => (
            <button
              key={badge.id}
              id={`badge-${badge.id}`}
              className={`lb-badge ${badge.unlocked ? 'lb-badge--unlocked' : 'lb-badge--locked'} ${newlyUnlocked === badge.id ? 'lb-badge--new' : ''}`}
              onClick={() => handleBadgeClick(badge)}
              aria-label={`${badge.name}: ${badge.desc}. ${badge.unlocked ? 'Unlocked' : 'Locked'}`}
              type="button"
            >
              <span className="lb-badge__icon" aria-hidden="true">
                {badge.icon}
                {!badge.unlocked && <span className="lb-badge__lock">🔒</span>}
              </span>
              <span className="lb-badge__name">{badge.name}</span>
              <span className="lb-badge__desc">{badge.desc}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
