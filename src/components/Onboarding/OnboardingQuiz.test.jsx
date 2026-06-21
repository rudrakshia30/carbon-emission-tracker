import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import OnboardingQuiz from './OnboardingQuiz';

describe('OnboardingQuiz Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the welcome step and navigate through the quiz', async () => {
    const handleComplete = vi.fn();
    const { container } = render(<OnboardingQuiz onComplete={handleComplete} />);

    // Step 0: Welcome
    expect(screen.getByText('CarbonTwin')).toBeInTheDocument();
    expect(screen.getByText('Your lifestyle, visualized')).toBeInTheDocument();
    const beginBtn = container.querySelector('#oq-btn-begin');
    expect(beginBtn).toBeInTheDocument();

    // Click Begin Your Journey
    fireEvent.click(beginBtn);

    // Step 1: Name
    expect(screen.getByText('What should we call you?')).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Your name');
    expect(nameInput).toBeInTheDocument();
    
    // Type name
    fireEvent.change(nameInput, { target: { value: 'Eco Explorer' } });
    const nameNextBtn = container.querySelector('#oq-btn-name-next');
    fireEvent.click(nameNextBtn);

    // Step 2: Region — select India
    expect(screen.getByText('Where are you based?')).toBeInTheDocument();
    const indiaBtn = container.querySelector('#oq-region-india');
    expect(indiaBtn).toBeInTheDocument();
    fireEvent.click(indiaBtn);
    const regionNextBtn = container.querySelector('#oq-btn-region-next');
    fireEvent.click(regionNextBtn);

    // Step 3: Transport
    expect(screen.getByText('How do you get around?')).toBeInTheDocument();
    
    // Choose Train mode
    const trainModeBtn = container.querySelector('#oq-transport-train');
    expect(trainModeBtn).toBeInTheDocument();
    fireEvent.click(trainModeBtn);

    // Adjust distance slider to 20 km
    const distanceSlider = container.querySelector('#oq-distance-slider');
    expect(distanceSlider).toBeInTheDocument();
    fireEvent.change(distanceSlider, { target: { value: '20' } });

    const transportNextBtn = container.querySelector('#oq-btn-transport-next');
    fireEvent.click(transportNextBtn);

    // Step 4: Diet
    expect(screen.getByText('What best describes your diet?')).toBeInTheDocument();
    const dietNextBtn = container.querySelector('#oq-btn-diet-next');
    
    // Diet button should be disabled initially
    expect(dietNextBtn).toBeDisabled();

    // Select vegetarian diet
    const vegDietBtn = container.querySelector('#oq-diet-vegetarian');
    expect(vegDietBtn).toBeInTheDocument();
    fireEvent.click(vegDietBtn);

    // Diet button should now be enabled
    expect(dietNextBtn).not.toBeDisabled();
    fireEvent.click(dietNextBtn);

    // Step 5: Energy
    expect(screen.getByText('Your home energy habits')).toBeInTheDocument();
    
    // Adjust AC hours to 4
    const acSlider = container.querySelector('#oq-ac-slider');
    expect(acSlider).toBeInTheDocument();
    fireEvent.change(acSlider, { target: { value: '4' } });

    // Enable long showers
    const showerToggle = container.querySelector('#oq-shower-toggle');
    expect(showerToggle).toBeInTheDocument();
    fireEvent.click(showerToggle);

    // Enable energy conscious
    const ecoToggle = container.querySelector('#oq-eco-toggle');
    expect(ecoToggle).toBeInTheDocument();
    fireEvent.click(ecoToggle);

    const energyNextBtn = container.querySelector('#oq-btn-energy-next');
    fireEvent.click(energyNextBtn);

    // Step 6: Results
    expect(screen.getByText('Your Carbon Baseline')).toBeInTheDocument();

    // Advance the mock timers so the score counter reaches the target
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Check that score is calculated correctly
    // Calculation:
    // - Transport (train): 0.041 * 20 km = 0.82
    // - Diet (vegetarian): 0.7 * 3 = 2.1
    // - Energy:
    //   - AC hours: 4 * 1.0 = 4.0
    //   - Long showers: true = 1.0
    //   - Energy conscious: true = !true * 2.0 = 0.0
    // Total = 0.82 + 2.1 + 4.0 + 1.0 + 0 = 7.92 -> Rounded to 7.9
    const scoreNum = container.querySelector('.oq-score-number');
    expect(scoreNum).toHaveTextContent('7.9');

    // Click Meet Your Island
    const finishBtn = container.querySelector('#oq-btn-finish');
    expect(finishBtn).toBeInTheDocument();
    fireEvent.click(finishBtn);

    // Verify onComplete callback payload
    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(handleComplete).toHaveBeenCalledWith({
      name: 'Eco Explorer',
      region: 'india',
      transport: { mode: 'train', dailyDistanceKm: 20 },
      diet: 'vegetarian',
      energy: { acHoursPerDay: 4, longShowers: true, energyConscious: true },
      baselineScore: 7.9
    });
  });

  it('should support navigating backward and preserving the values', () => {
    const handleComplete = vi.fn();
    const { container } = render(<OnboardingQuiz onComplete={handleComplete} />);

    // Go to Name step
    fireEvent.click(container.querySelector('#oq-btn-begin'));

    // Fill name
    const nameInput = screen.getByLabelText('Your name');
    fireEvent.change(nameInput, { target: { value: 'Tester' } });

    // Go to Region step (step 2)
    fireEvent.click(container.querySelector('#oq-btn-name-next'));

    // Go back to Name step
    const backBtn = container.querySelector('.oq-step--active .oq-btn-secondary');
    fireEvent.click(backBtn);

    // Verify name is preserved
    expect(screen.getByLabelText('Your name')).toHaveValue('Tester');
  });

  it('should allow selecting a region and show it as selected', () => {
    const { container } = render(<OnboardingQuiz onComplete={vi.fn()} />);

    // Navigate to region step
    fireEvent.click(container.querySelector('#oq-btn-begin'));
    fireEvent.click(container.querySelector('#oq-btn-name-next'));

    // Select Europe
    const europeBtn = container.querySelector('#oq-region-europe');
    fireEvent.click(europeBtn);
    expect(europeBtn).toHaveClass('oq-region-card--selected');
    expect(europeBtn).toHaveAttribute('aria-checked', 'true');

    // Other regions should not be selected
    const usaBtn = container.querySelector('#oq-region-usa');
    expect(usaBtn).not.toHaveClass('oq-region-card--selected');
    expect(usaBtn).toHaveAttribute('aria-checked', 'false');
  });
});
