import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MicroAction from './MicroAction';

const DEMO_SUGGESTION = {
  text: 'Try biking to work today',
  impact: 'Save 1.9kg CO₂',
  icon: '🚲',
  actionType: 'transport',
};

describe('MicroAction Component', () => {
  it('renders the suggestion text and impact', () => {
    render(<MicroAction suggestion={DEMO_SUGGESTION} />);
    expect(screen.getByText('Try biking to work today')).toBeInTheDocument();
    expect(screen.getByText(/Save 1.9kg/i)).toBeInTheDocument();
    expect(screen.getByText('🚲')).toBeInTheDocument();
  });

  it('renders Accept and Dismiss buttons in idle state', () => {
    render(<MicroAction suggestion={DEMO_SUGGESTION} />);
    expect(screen.getByRole('button', { name: /accept suggestion/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss suggestion/i })).toBeInTheDocument();
  });

  it('calls onAccept when accept button is clicked', () => {
    const mockAccept = vi.fn();
    render(<MicroAction suggestion={DEMO_SUGGESTION} onAccept={mockAccept} />);
    fireEvent.click(screen.getByRole('button', { name: /accept suggestion/i }));
    expect(mockAccept).toHaveBeenCalledWith(DEMO_SUGGESTION);
  });

  it('calls onDismiss and hides when dismiss button is clicked', () => {
    const mockDismiss = vi.fn();
    render(<MicroAction suggestion={DEMO_SUGGESTION} onDismiss={mockDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss suggestion/i }));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    // After dismiss the component should unmount
    expect(screen.queryByText('Try biking to work today')).not.toBeInTheDocument();
  });

  it('shows accepted badge after accepting', () => {
    render(<MicroAction suggestion={DEMO_SUGGESTION} />);
    fireEvent.click(screen.getByRole('button', { name: /accept suggestion/i }));
    expect(screen.getByText(/\+1/i)).toBeInTheDocument();
  });

  it('returns null when suggestion is not provided', () => {
    const { container } = render(<MicroAction suggestion={null} />);
    expect(container.firstChild).toBeNull();
  });
});
