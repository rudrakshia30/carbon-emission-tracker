import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Suggestions from './Suggestions';

describe('Suggestions Component', () => {
  it('renders standard header instructions', () => {
    render(<Suggestions logs={[]} />);
    expect(screen.getByText('Personalized Tips')).toBeInTheDocument();
    expect(screen.getByText(/Based on your logged data/i)).toBeInTheDocument();
  });

  it('renders fallback tips when there are no logs', () => {
    render(<Suggestions logs={[]} />);
    expect(screen.getByText('🌱 Island Ledger is Clean!')).toBeInTheDocument();
    expect(screen.getByText(/No logged emissions detected yet/i)).toBeInTheDocument();
  });

  it('suggests transport tips when transport has the highest emissions', () => {
    const logs = [
      { date: '2026-06-20T22:00:00.000Z', transport: 25, food: 2, energy: 1, shopping: 3 }
    ];
    render(<Suggestions logs={logs} />);
    expect(screen.getByText('🚗 Transport Emissions Cut')).toBeInTheDocument();
    expect(screen.getByText(/Commutes and travel represent your largest footprint/i)).toBeInTheDocument();
  });

  it('suggests food tips when food has the highest emissions', () => {
    const logs = [
      { date: '2026-06-20T22:00:00.000Z', transport: 2, food: 35, energy: 4, shopping: 1 }
    ];
    render(<Suggestions logs={logs} />);
    expect(screen.getByText('🍽️ Food Footprint Swaps')).toBeInTheDocument();
    expect(screen.getByText(/Your diet accounts for your peak emissions/i)).toBeInTheDocument();
  });

  it('suggests energy tips when energy has the highest emissions', () => {
    const logs = [
      { date: '2026-06-20T22:00:00.000Z', transport: 3, food: 4, energy: 18, shopping: 2 }
    ];
    render(<Suggestions logs={logs} />);
    expect(screen.getByText('⚡ Home Energy Efficiency')).toBeInTheDocument();
    expect(screen.getByText(/Heating, cooling, and appliance usage contributes the most/i)).toBeInTheDocument();
  });

  it('suggests shopping tips when shopping has the highest emissions', () => {
    const logs = [
      { date: '2026-06-20T22:00:00.000Z', transport: 1, food: 2, energy: 3, shopping: 50 }
    ];
    render(<Suggestions logs={logs} />);
    expect(screen.getByText('🛍️ Sustainable Consumer Choices')).toBeInTheDocument();
    expect(screen.getByText(/Shopping and product purchases drive your carbon profile/i)).toBeInTheDocument();
  });
});
