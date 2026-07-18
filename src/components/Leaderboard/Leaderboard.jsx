import { useState, useEffect, useMemo, useCallback } from 'react';
import Confetti from '../UI/Confetti';
import { SIMULATED_USERS } from '../../data/simulatedUsers';
import { decodeEntities } from '../../utils/security';
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
  habitatState = { trees: 0, flowers: 0, birds: 0 },
  unlockedBadges = [],
  onUnlockBadge,
  userName = 'You',
  userWeeklyCO2 = 98.5,
  weeklyDaysLogged = 7,
  baselineScore = 22,
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState(null);

  /** Combine and sort user standings. */
  const leaderboardData = useMemo(() => {
    const userRow = {
      name: (userName ? decodeEntities(userName.trim()) : '') || 'You',
      emoji: '🏝️',
      weeklyCO2: userWeeklyCO2,
      habitatHealth: habitatState.healthScore || 50,
      isCurrentUser: true,
    };
    const combined = [...SIMULATED_USERS, userRow];
    combined.sort((a, b) => a.weeklyCO2 - b.weeklyCO2);
    return combined.map((u, i) => ({ ...u, rank: i + 1 }));
  }, [userName, userWeeklyCO2, habitatState.healthScore]);

  const userRankInfo = useMemo(() => {
    const self = leaderboardData.find((u) => u.isCurrentUser);
    if (!self) return { rank: 1, total: leaderboardData.length, percentile: 100 };
    const rank = self.rank;
    const total = leaderboardData.length;
    const percentile = Math.round(((total - rank) / (total - 1)) * 100);
    return { rank, total, percentile };
  }, [leaderboardData]);

  const co2Difference = useMemo(() => {
    const target = baselineScore * 7;
    const diff = target - userWeeklyCO2;
    return Math.round(diff * 10) / 10;
  }, [baselineScore, userWeeklyCO2]);

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
      (id) => !unlockedBadges.includes(id)
    );

    if (newBadges.length > 0) {
      const firstNew = newBadges[0];
      let timer;

      const setupTimer = setTimeout(() => {
        setNewlyUnlocked(firstNew);
        setShowConfetti(true);
        if (onUnlockBadge) {
          onUnlockBadge(firstNew);
        }

        timer = setTimeout(() => {
          setShowConfetti(false);
          setNewlyUnlocked(null);
        }, 3500);
      }, 0);

      return () => {
        clearTimeout(setupTimer);
        if (timer) clearTimeout(timer);
      };
    }
  }, [badgeStates, unlockedBadges, onUnlockBadge]);

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
    <div className="leaderboard" aria-label="Achievements and badges">
      <Confetti show={showConfetti} />

      {/* ─── YOUR RANK HERO CARD ─────────────────────────────────── */}
      <section className="lb-rank-card" aria-label="Your rank overview">
        <div className="lb-rank-card__glow" />
        <div className="lb-rank-card__content">
          <div className="lb-rank-card__percentile-info">
            <h2 className="lb-rank-card__percentile-title">
              Greener than <span className="lb-rank-card__percent-highlight">{userRankInfo.percentile}%</span> of users
            </h2>
            <p className="lb-rank-card__comparison-text">
              {co2Difference > 0 ? (
                <span>
                  🌸 Great job! You saved <strong>{co2Difference} kg</strong> of CO₂ this week compared to your baseline.
                </span>
              ) : (
                <span>
                  ⚠️ You emitted <strong>{Math.abs(co2Difference)} kg</strong> more than your weekly baseline target. Try a green swap!
                </span>
              )}
            </p>
          </div>
          <div className="lb-rank-card__badge-wrapper">
            <div className="lb-rank-card__badge" aria-label={`Rank ${userRankInfo.rank} of ${userRankInfo.total}`}>
              <span className="lb-rank-card__badge-hash">#</span>
              <span className="lb-rank-card__badge-num">{userRankInfo.rank}</span>
            </div>
            <span className="lb-rank-card__badge-label">Rank</span>
          </div>
        </div>
      </section>

      {/* ─── LEADERBOARD TABLE ───────────────────────────────────── */}
      <section className="lb-table-section" aria-label="Social Leaderboard">
        <h2 className="lb-section-title">
          <span className="lb-section-title__icon" aria-hidden="true">🏆</span>
          Social Standings
        </h2>
        {weeklyDaysLogged < 7 && (
          <p className="lb-table-notice">
            📅 Rank based on <strong>{weeklyDaysLogged}/7 days</strong> logged this week — keep logging daily to climb!
          </p>
        )}
        <div className="lb-table-container">
          <table className="lb-table">
            <thead>
              <tr>
                <th scope="col" className="lb-table__th lb-table__th--rank">Rank</th>
                <th scope="col" className="lb-table__th">Warrior</th>
                <th scope="col" className="lb-table__th lb-table__th--right">Weekly CO₂</th>
                <th scope="col" className="lb-table__th lb-table__th--right">Habitat Health</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((player) => (
                <tr
                  key={player.name}
                  className={`lb-table__tr ${player.isCurrentUser ? 'lb-table__tr--current' : ''}`}
                >
                  <td className="lb-table__td lb-table__td--rank">
                    {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                  </td>
                  <td className="lb-table__td">
                    <span className="lb-table__avatar" aria-hidden="true">{player.emoji}</span>
                    <span className="lb-table__name">
                      {player.name}
                      {player.isCurrentUser && <span className="lb-table__you-badge">YOU</span>}
                    </span>
                  </td>
                  <td className="lb-table__td lb-table__td--right lb-table__td--co2">
                    {player.weeklyCO2.toFixed(1)} kg
                    {player.isCurrentUser && weeklyDaysLogged < 7 && (
                      <span className="lb-table__days-tag">{weeklyDaysLogged}/7d</span>
                    )}
                  </td>
                  <td className="lb-table__td lb-table__td--right">
                    <span className="lb-table__health-val">{player.habitatHealth}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
