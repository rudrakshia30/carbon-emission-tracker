import { describe, it, expect, vi, afterEach } from 'vitest';
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
  afterEach(() => {
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

  it('should call storeApiKey when typing in the API key input field', async () => {
    const { storeApiKey } = await import('../../utils/security');
    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);

    const toggle = screen.getByRole('button', { name: /open gemini api key settings/i });
    fireEvent.click(toggle);

    const input = screen.getByLabelText(/enter gemini api key/i);
    fireEvent.change(input, { target: { value: 'AIzaSyTestKey' } });

    expect(storeApiKey).toHaveBeenCalledWith('AIzaSyTestKey');
  });

  it('should generate AI story successfully when API key is present', async () => {
    const { getApiKey } = await import('../../utils/security');
    getApiKey.mockReturnValue('valid-api-key');

    const mockResponse = {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "The virtual island is blooming and clean!" }] } }]
      })
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText("The virtual island is blooming and clean!")).toBeInTheDocument();
    });

    globalThis.fetch = originalFetch;
  });

  it('should handle API failure gracefully by falling back to template story', async () => {
    const { getApiKey } = await import('../../utils/security');
    getApiKey.mockReturnValue('valid-api-key');

    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      // Should display the template story instead of failing
      expect(screen.getByText(/flourished beautifully/i)).toBeInTheDocument();
    });

    globalThis.fetch = originalFetch;
  });

  it('should handle API fetch timeout gracefully by falling back to template story', async () => {
    const { getApiKey } = await import('../../utils/security');
    getApiKey.mockReturnValue('valid-api-key');

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue({ name: 'AbortError' });

    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/flourished beautifully/i)).toBeInTheDocument();
    });

    globalThis.fetch = originalFetch;
  });

  it('should enforce rate limiting cooldown when clicked twice within RATE_LIMIT_MS', async () => {
    const { getApiKey } = await import('../../utils/security');
    getApiKey.mockReturnValue('valid-api-key');

    const mockResponse = {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Story 1" }] } }]
      })
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });

    // First click
    fireEvent.click(generateBtn);
    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    // Second click should not trigger fetch, and button text should show cooldown
    fireEvent.click(generateBtn);
    expect(screen.getByText(/Wait/i)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1); // Only called once

    globalThis.fetch = originalFetch;
  });

  it('should handle generic API fetch errors gracefully by falling back to template story', async () => {
    const { getApiKey } = await import('../../utils/security');
    getApiKey.mockReturnValue('valid-api-key');

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Generic network error"));

    render(<WeeklyStory weeklyData={mockWeeklyData} habitatState={mockHabitatState} />);
    const generateBtn = screen.getByRole('button', { name: /generate weekly story/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/flourished beautifully/i)).toBeInTheDocument();
    });

    globalThis.fetch = originalFetch;
  });
});
