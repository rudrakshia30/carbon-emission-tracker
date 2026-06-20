import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from './Dashboard';
import { DEMO_BASELINE_SCORE } from '../../utils/carbonCalculator';
import { getLocalDateString } from '../../utils/carbonCalculator';

describe('Dashboard Component', () => {
  it('renders "No logs today yet" when there are no logs', () => {
    render(
      <Dashboard
        logs={[]}
        baselineScore={DEMO_BASELINE_SCORE}
        streaks={{ current: 0, best: 0 }}
        userName="Test User"
      />
    );
    expect(screen.getByText(/No logs today yet/i)).toBeInTheDocument();
  });

  it('renders "Excellent" status and correct score when today CO2 is low', () => {
    const today = getLocalDateString();
    const logs = [
      // 10 kg is 44% of 22.5 kg baseline → scorePercent < 50 → "Excellent"
      { date: today + 'T10:00:00.000Z', totalCO2: 10 }
    ];

    render(
      <Dashboard
        logs={logs}
        baselineScore={DEMO_BASELINE_SCORE}
        streaks={{ current: 5, best: 10 }}
        userName="Test User"
      />
    );

    // '10' appears in the ring AND in the chart — ensure at least one match exists
    expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    // Status icon aria-label contains "Excellent"
    expect(screen.getByLabelText(/Status: Excellent/i)).toBeInTheDocument();
    expect(screen.getByText(/44% of your 22\.5kg target/i)).toBeInTheDocument();
  });

  it('renders "High Emissions" status when CO2 exceeds 80% of baseline', () => {
    const today = getLocalDateString();
    const logs = [
      // 20 kg is 88% of 22.5 kg → scorePercent > 80 → "High Emissions"
      { date: today + 'T10:00:00.000Z', totalCO2: 20 }
    ];

    render(
      <Dashboard
        logs={logs}
        baselineScore={DEMO_BASELINE_SCORE}
        streaks={{ current: 1, best: 3 }}
        userName="Eco Test"
      />
    );

    // '20' appears in the ring AND in the chart — use getAllByText and ensure at least one exists
    expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Status: High Emissions/i)).toBeInTheDocument();
  });

  it('shows streak information correctly', () => {
    render(
      <Dashboard
        logs={[]}
        baselineScore={DEMO_BASELINE_SCORE}
        streaks={{ current: 7, best: 14 }}
        userName="Streak Master"
      />
    );

    expect(screen.getByText(/7 day streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Best: 14 days/i)).toBeInTheDocument();
  });

  it('renders all category breakdown labels', () => {
    render(
      <Dashboard
        logs={[]}
        baselineScore={DEMO_BASELINE_SCORE}
        streaks={{ current: 0, best: 0 }}
        userName="Test"
      />
    );

    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('uses DEMO_BASELINE_SCORE (22.5) as the comparison target', () => {
    const today = getLocalDateString();
    const logs = [{ date: today + 'T10:00:00.000Z', totalCO2: 11 }];

    render(
      <Dashboard
        logs={logs}
        baselineScore={DEMO_BASELINE_SCORE}
        streaks={{ current: 0, best: 0 }}
        userName="Demo"
      />
    );

    // The baseline (22.5 kg) should appear in the score percentage label
    expect(screen.getByText(/22\.5kg target/i)).toBeInTheDocument();
  });
});
