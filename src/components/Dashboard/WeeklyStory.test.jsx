import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeeklyStory from './WeeklyStory';

// Mock security utils
vi.mock('../../utils/security', () => ({
  getApiKey: vi.fn(() => null),
  storeApiKey: vi.fn(),
  sanitizeString: vi.fn((str) => str),
}));

// Mock habitatEngine
vi.mock('../Habitat/habitatEngine', () => ({
  getHabitatNarrative: vi.fn(() => 'The island breathes with gentle life.'),
}));

const mockWeeklyData = [
  { date: '2026-06-15', dayName: 'Mon', total: 8.5, hasLog: true },
  { date: '2026-06-16', dayName: 'Tue', total: 12.0, hasLog: true },
  { date: '2026-06-17', dayName: 'Wed', total: 6.2, hasLog: true },
  { date: '2026-06-18', dayName: 'Thu', total: 15.5, hasLog: true },
  { date: '2026-06-19', dayName: 'Fri', total: 9.1, hasLog: true },
  { date: '2026-06-20', dayName: 'Sat', total: 0, hasLog: false },
  { date: '2026-06-21', dayName: 'Sun', total: 7.3, hasLog: true },
];

const mockHabitatState = {
  healthScore: 72,
  trees: 10,
  flowers: 8,
  birds: 2,
  smogLevel: 0.2,
  waterClarity: 0.8,
  hasRainbow: false,
  particles: [],
};

describe('WeeklyStory Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should render the section heading', () => {
    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    expect(screen.getByText("Your Island's Story")).toBeInTheDocument();
  });

  it('should show the Generate Story button', () => {
    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const btn = screen.getByRole('button', { name: /generate weekly story/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('should display a template story when no logs exist', () => {
    render(<WeeklyStory weeklyData={[]} habitatState={mockHabitatState} />);
    expect(screen.getByText(/your island awaits your first week/i)).toBeInTheDocument();
  });

  it('should display a positive template story when healthScore >= 70', () => {
    render(
      <WeeklyStory
        weeklyData={mockWeeklyData}
        habitatState={{ ...mockHabitatState, healthScore: 75 }}
      />
    );
    expect(screen.getByText(/flourished beautifully/i)).toBeInTheDocument();
  });

  it('should display a mixed template story when 40 <= healthScore < 70', () => {
    render(
      <WeeklyStory
        weeklyData={mockWeeklyData}
        habitatState={{ ...mockHabitatState, healthScore: 55 }}
      />
    );
    expect(screen.getByText(/mixed week/i)).toBeInTheDocument();
  });

  it('should display a challenging template story when healthScore < 40', () => {
    render(
      <WeeklyStory
        weeklyData={mockWeeklyData}
        habitatState={{ ...mockHabitatState, healthScore: 20 }}
      />
    );
    expect(screen.getByText(/challenging week/i)).toBeInTheDocument();
  });

  it('should show the settings toggle button', () => {
    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    expect(screen.getByRole('button', { name: /open gemini api key settings/i })).toBeInTheDocument();
  });

  it('should expand settings panel when toggle is clicked', () => {
    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const toggle = screen.getByRole('button', { name: /open gemini api key settings/i });
    fireEvent.click(toggle);
    expect(screen.getByLabelText(/enter gemini api key/i)).toBeInTheDocument();
  });

  it('should collapse settings panel on second click', () => {
    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const toggle = screen.getByRole('button', { name: /open gemini api key settings/i });
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(screen.queryByLabelText(/enter gemini api key/i)).not.toBeInTheDocument();
  });

  it('should show loading shimmer and disable button when generating', async () => {
    const { getApiKey } = await import('../../utils/security');
    getApiKey.mockReturnValue(null);

    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });
    fireEvent.click(generateBtn);

    // Button should be disabled while loading
    expect(generateBtn).toBeDisabled();
  });

  it('should have aria-busy on the story card during generation', async () => {
    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });
    fireEvent.click(generateBtn);

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveAttribute('aria-busy', 'true');
  });

  it('should fall back to template story when no API key and generation completes', async () => {
    // Switch to real timers for this async fallback test to avoid fake-timer/waitFor deadlock
    vi.useRealTimers();

    const { getApiKey } = await import('../../utils/security');
    getApiKey.mockReturnValue(null);

    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });
    fireEvent.click(generateBtn);

    // Button should be disabled immediately after click
    expect(generateBtn).toBeDisabled();

    // Wait for real 1200ms fallback delay to complete
    await waitFor(
      () => expect(screen.getByRole('button', { name: /generate weekly story/i })).not.toBeDisabled(),
      { timeout: 4000 }
    );
  }, 8000);
});
