import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickLog from './QuickLog';

describe('QuickLog Component', () => {
  it('renders the transport tab by default with all mode cards', () => {
    render(<QuickLog onLog={vi.fn()} baselineScore={22.5} />);

    // All transport mode buttons should be visible
    expect(screen.getByRole('button', { name: /Toggle Car transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Bus transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Train transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Bike transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Walk transport/i })).toBeInTheDocument();
  });

  it('shows the footer baseline score from DEMO_BASELINE_SCORE', () => {
    render(<QuickLog onLog={vi.fn()} baselineScore={22.5} />);
    // Footer should show baseline value
    expect(screen.getByText(/22\.5/i)).toBeInTheDocument();
  });

  it('selects a transport mode and calls onLog with correct transport array on submit', () => {
    const mockOnLog = vi.fn();
    render(<QuickLog onLog={mockOnLog} baselineScore={22.5} />);

    // Click Car to activate it — default distance is 10 km
    const carBtn = screen.getByRole('button', { name: /Toggle Car transport/i });
    fireEvent.click(carBtn);

    // Car range slider should now appear (default 10 km)
    expect(screen.getByRole('slider', { name: /Car distance in kilometers/i })).toBeInTheDocument();

    // Submit the log
    const logBtn = screen.getByRole('button', { name: /Log today's carbon footprint/i });
    fireEvent.click(logBtn);

    expect(mockOnLog).toHaveBeenCalledTimes(1);
    const logEntry = mockOnLog.mock.calls[0][0];

    // transport is an array of { mode, distanceKm }
    expect(Array.isArray(logEntry.transport)).toBe(true);
    expect(logEntry.transport).toHaveLength(1);
    expect(logEntry.transport[0].mode).toBe('car');
    expect(logEntry.transport[0].distanceKm).toBe(10);
    expect(typeof logEntry.totalCO2).toBe('number');
  });

  it('updates distance via range slider before submitting', () => {
    const mockOnLog = vi.fn();
    render(<QuickLog onLog={mockOnLog} baselineScore={22.5} />);

    // Activate car
    fireEvent.click(screen.getByRole('button', { name: /Toggle Car transport/i }));

    // Change slider value to 50 km
    const slider = screen.getByRole('slider', { name: /Car distance in kilometers/i });
    fireEvent.change(slider, { target: { value: '50' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Log today's carbon footprint/i }));

    const logEntry = mockOnLog.mock.calls[0][0];
    expect(logEntry.transport[0].distanceKm).toBe(50);
  });
});
