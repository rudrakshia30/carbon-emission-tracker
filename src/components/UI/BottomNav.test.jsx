import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BottomNav from './BottomNav';

describe('BottomNav Component', () => {
  it('renders all tab buttons', () => {
    render(<BottomNav activeTab="habitat" onTabChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /Habitat/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Log/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Badges/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tips/i })).toBeInTheDocument();
  });

  it('applies active class to the current active tab', () => {
    render(<BottomNav activeTab="dashboard" onTabChange={vi.fn()} />);
    
    const dashboardTab = screen.getByRole('tab', { name: /Dashboard/i });
    expect(dashboardTab).toHaveClass('bottom-nav__tab--active');
    expect(dashboardTab).toHaveAttribute('aria-selected', 'true');

    const logTab = screen.getByRole('tab', { name: /Log/i });
    expect(logTab).not.toHaveClass('bottom-nav__tab--active');
    expect(logTab).toHaveAttribute('aria-selected', 'false');
  });

  it('triggers onTabChange callback on tab click', () => {
    const mockTabChange = vi.fn();
    render(<BottomNav activeTab="habitat" onTabChange={mockTabChange} />);

    fireEvent.click(screen.getByRole('tab', { name: /Log/i }));
    expect(mockTabChange).toHaveBeenCalledTimes(1);
    expect(mockTabChange).toHaveBeenCalledWith('log');
  });

  it('navigates using keyboard arrow keys', () => {
    const mockTabChange = vi.fn();
    render(<BottomNav activeTab="habitat" onTabChange={mockTabChange} />);

    const firstTab = screen.getByRole('tab', { name: /Habitat/i });
    firstTab.focus();

    // Trigger ArrowRight key down
    fireEvent.keyDown(firstTab, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(mockTabChange).toHaveBeenCalledWith('log');
  });
});
