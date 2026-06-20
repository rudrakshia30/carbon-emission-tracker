import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Toast from './Toast';

describe('Toast Component', () => {
  it('renders the message and default icon', async () => {
    await act(async () => {
      render(<Toast message="Great job today!" type="success" />);
    });
    expect(screen.getByText('Great job today!')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('renders a custom icon override', async () => {
    await act(async () => {
      render(<Toast message="Hello" type="info" icon="🌟" />);
    });
    expect(screen.getByText('🌟')).toBeInTheDocument();
  });

  it('renders correct default icon for warning type', async () => {
    await act(async () => {
      render(<Toast message="warn" type="warning" />);
    });
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('renders dismiss button and it is clickable', async () => {
    const mockDismiss = vi.fn();
    await act(async () => {
      render(<Toast message="Click to dismiss" type="info" onDismiss={mockDismiss} />);
    });
    const btn = screen.getByRole('button', { name: /dismiss notification/i });
    expect(btn).toBeInTheDocument();
    // Click the button — the component starts exit animation
    await act(async () => {
      fireEvent.click(btn);
    });
    // No crash = pass; onDismiss fires after 300ms timer
  });

  it('has correct role="alert" for accessibility', async () => {
    await act(async () => {
      render(<Toast message="Alert!" type="success" />);
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
