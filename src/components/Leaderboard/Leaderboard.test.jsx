import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Leaderboard from './Leaderboard';

describe('Leaderboard Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders rank overview and standings table', () => {
    render(
      <Leaderboard
        logs={[]}
        currentStreak={0}
        habitatState={{ healthScore: 75, trees: 10, flowers: 4, birds: 1 }}
        unlockedBadges={[]}
        onUnlockBadge={vi.fn()}
        userName="Aria"
        userWeeklyCO2={42.5}
        baselineScore={22}
      />
    );

    // Rank Hero Card
    expect(screen.getByText(/Greener than/i)).toBeInTheDocument();
    expect(screen.getByText('#')).toBeInTheDocument();

    // Table Standings
    expect(screen.getByText('Social Standings')).toBeInTheDocument();
    expect(screen.getByText('Aria')).toBeInTheDocument();
    expect(screen.getByText('YOU')).toBeInTheDocument();
  });

  it('calculates carbon savings correctly in the Rank Card', () => {
    render(
      <Leaderboard
        logs={[]}
        currentStreak={0}
        habitatState={{ healthScore: 85, trees: 12, flowers: 5, birds: 2 }}
        unlockedBadges={[]}
        onUnlockBadge={vi.fn()}
        userName="Aria"
        userWeeklyCO2={100} // baseline weekly target = 22 * 7 = 154 kg -> Saved 54 kg
        baselineScore={22}
      />
    );

    expect(screen.getByText(/You saved/i)).toBeInTheDocument();
    expect(screen.getByText(/54 kg/i)).toBeInTheDocument();
  });

  it('shows badge collection and triggers confetti on click', async () => {
    const handleUnlockBadge = vi.fn();
    render(
      <Leaderboard
        logs={[]}
        currentStreak={0}
        habitatState={{ healthScore: 90, trees: 15, flowers: 6, birds: 3 }}
        unlockedBadges={['first_log']}
        onUnlockBadge={handleUnlockBadge}
        userName="Aria"
        userWeeklyCO2={50}
        baselineScore={22}
      />
    );

    // Badges collection header
    expect(screen.getByText(/Badges Collection/i)).toBeInTheDocument();

    // Badge click
    const sproutBadge = screen.getByRole('button', { name: /Sprouting Habit/i });
    expect(sproutBadge).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(sproutBadge);
    });

    // CONFETTI should now show and clear after timeout
    act(() => {
      vi.advanceTimersByTime(4000);
    });
  });
});
