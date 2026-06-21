import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QuickLog from './QuickLog';

const mockEmissionFactors = {
  transportation: {
    car_gasoline: 0.192, car_diesel: 0.171, car_electric: 0.053,
    bus: 0.089, train_metro: 0.041, bicycle: 0.0, walking: 0.0,
    motorcycle: 0.113, ride_share: 0.096, airplane: 0.180
  },
  food: {
    beef_meal: 7.2, chicken_meal: 1.8, pork_meal: 2.4, fish_meal: 1.8,
    vegetarian_meal: 0.7, vegan_meal: 0.4, dairy_heavy_meal: 2.8
  },
  energy: {
    ac_per_hour: 1.0, heating_per_hour: 1.5, laundry_per_load: 0.6,
    dishwasher_per_cycle: 0.7, hot_shower_per_minute: 0.1
  },
  shopping: {
    new_clothing_item: 10.0, electronics_smartphone: 70.0,
    groceries_local: 2.0, groceries_imported: 5.0, online_order_with_shipping: 1.5
  }
};

describe('QuickLog Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the transport tab by default with all mode cards', () => {
    render(<QuickLog onLog={vi.fn()} baselineScore={22.5} emissionFactors={mockEmissionFactors} />);
    expect(screen.getByRole('button', { name: /Toggle Car transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Bus transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Train transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Bike transport/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle Walk transport/i })).toBeInTheDocument();
  });

  it('shows the footer baseline score from baselineScore prop', () => {
    render(<QuickLog onLog={vi.fn()} baselineScore={22.5} emissionFactors={mockEmissionFactors} />);
    expect(screen.getByText(/22\.5/i)).toBeInTheDocument();
  });

  it('selects a transport mode and calls onLog with correct transport array on submit', () => {
    const mockOnLog = vi.fn();
    render(<QuickLog onLog={mockOnLog} baselineScore={22.5} emissionFactors={mockEmissionFactors} />);

    // Click Car to activate it
    const carBtn = screen.getByRole('button', { name: /Toggle Car transport/i });
    fireEvent.click(carBtn);

    // Car range slider should now appear (default 10 km)
    expect(screen.getByRole('slider', { name: /Car distance in kilometers/i })).toBeInTheDocument();

    // Submit the log
    const logBtn = screen.getByRole('button', { name: /Log today's carbon footprint/i });
    fireEvent.click(logBtn);

    expect(mockOnLog).toHaveBeenCalledTimes(1);
    const logEntry = mockOnLog.mock.calls[0][0];

    expect(Array.isArray(logEntry.transport)).toBe(true);
    expect(logEntry.transport).toHaveLength(1);
    expect(logEntry.transport[0].mode).toBe('car');
    expect(logEntry.transport[0].distanceKm).toBe(10);
  });

  it('updates distance via range slider before submitting', () => {
    const mockOnLog = vi.fn();
    render(<QuickLog onLog={mockOnLog} baselineScore={22.5} emissionFactors={mockEmissionFactors} />);

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

  it('switches tabs and logs food, energy, and shopping data', () => {
    const mockOnLog = vi.fn();
    render(<QuickLog onLog={mockOnLog} baselineScore={22.5} emissionFactors={mockEmissionFactors} />);

    // Switch to Food Tab
    const foodTab = screen.getByRole('tab', { name: /Food/i });
    fireEvent.click(foodTab);

    // Select beef for breakfast and vegetarian for lunch
    fireEvent.click(screen.getByRole('button', { name: /Select Beef for breakfast/i }));
    fireEvent.click(screen.getByRole('button', { name: /Select Vegetarian for lunch/i }));

    // Switch to Energy Tab
    const energyTab = screen.getByRole('tab', { name: /Energy/i });
    fireEvent.click(energyTab);

    // Toggle AC and hot shower
    fireEvent.click(screen.getByRole('switch', { name: /Toggle AC/i }));
    fireEvent.click(screen.getByRole('switch', { name: /Toggle Long Shower/i }));

    // Switch to Shopping Tab
    const shoppingTab = screen.getByRole('tab', { name: /Shopping/i });
    fireEvent.click(shoppingTab);

    // Add clothing and electronics items
    fireEvent.click(screen.getByRole('button', { name: /Add Clothing/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add Electronics/i }));
    // Add one more clothing
    fireEvent.click(screen.getByRole('button', { name: /Add one more Clothing/i }));

    // Submit log
    const logBtn = screen.getByRole('button', { name: /Log today's carbon footprint/i });
    fireEvent.click(logBtn);

    expect(mockOnLog).toHaveBeenCalledTimes(1);
    const logEntry = mockOnLog.mock.calls[0][0];

    // Check meals
    expect(logEntry.meals).toHaveLength(2);
    expect(logEntry.meals).toContainEqual({ meal: 'breakfast', type: 'beef_meal' });
    expect(logEntry.meals).toContainEqual({ meal: 'lunch', type: 'vegetarian_meal' });

    // Check energy
    expect(logEntry.energy.ac).toBe(2); // default AC hours
    expect(logEntry.energy.shower).toBe(true);

    // Check shopping
    expect(logEntry.shopping.clothing).toBe(2);
    expect(logEntry.shopping.electronics).toBe(1);
  });

  it('allows decrementing shopping count and removing transport options', () => {
    const mockOnLog = vi.fn();
    render(<QuickLog onLog={mockOnLog} baselineScore={22.5} emissionFactors={mockEmissionFactors} />);

    // Activate car
    fireEvent.click(screen.getByRole('button', { name: /Toggle Car transport/i }));
    expect(screen.getByText(/Car:/i)).toBeInTheDocument();

    // Click remove button on Car
    fireEvent.click(screen.getByRole('button', { name: /Remove Car/i }));
    expect(screen.queryByText(/Car:/i)).not.toBeInTheDocument();

    // Switch to Shopping tab
    fireEvent.click(screen.getByRole('tab', { name: /Shopping/i }));

    // Add and decrement clothing
    fireEvent.click(screen.getByRole('button', { name: /Add Clothing/i }));
    expect(screen.getByLabelText(/1 items/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Remove one Clothing/i }));
    expect(screen.queryByLabelText(/1 items/i)).not.toBeInTheDocument();
  });

  it('pre-populates the inputs when existingLog is provided', async () => {
    const existingLog = {
      rawTransport: [{ mode: 'car', distanceKm: 42 }],
      meals: [{ meal: 'lunch', type: 'vegan_meal' }],
      rawEnergy: { ac: 5, heating: 0, shower: true, laundry: false, dishwasher: true },
      rawShopping: { clothing: 1, electronics: 0, groceriesLocal: 3, groceriesImported: 0, onlineOrders: 2 }
    };

    render(
      <QuickLog onLog={vi.fn()} baselineScore={22.5} emissionFactors={mockEmissionFactors} existingLog={existingLog} />
    );

    // Wait for the useEffect timeout to run and set values
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Car should be active and distance should be 42 km
    expect(screen.getByRole('slider', { name: /Car distance in kilometers/i })).toHaveValue('42');

    // Switch to Food and check
    fireEvent.click(screen.getByRole('tab', { name: /Food/i }));
    expect(screen.getByRole('button', { name: /Select Vegan for lunch/i })).toHaveAttribute('aria-pressed', 'true');

    // Switch to Energy and check
    fireEvent.click(screen.getByRole('tab', { name: /Energy/i }));
    expect(screen.getByRole('switch', { name: /Toggle AC/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('slider', { name: /AC hours/i })).toHaveValue('5');

    // Switch to Shopping and check
    fireEvent.click(screen.getByRole('tab', { name: /Shopping/i }));
    expect(screen.getByLabelText(/3 items/i)).toBeInTheDocument();
  });

  it('navigates category tabs using keyboard arrow keys', () => {
    render(<QuickLog onLog={vi.fn()} baselineScore={22.5} emissionFactors={mockEmissionFactors} />);
    const transportTab = screen.getByRole('tab', { name: /Transport/i });

    // Press ArrowRight to move focus to Food tab
    fireEvent.keyDown(transportTab, { key: 'ArrowRight' });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    const foodTab = screen.getByRole('tab', { name: /Food/i });
    expect(foodTab).toHaveFocus();

    // Press ArrowRight to move to Energy tab
    fireEvent.keyDown(foodTab, { key: 'ArrowRight' });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    const energyTab = screen.getByRole('tab', { name: /Energy/i });
    expect(energyTab).toHaveFocus();

    // Press ArrowLeft to move back to Food tab
    fireEvent.keyDown(energyTab, { key: 'ArrowLeft' });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(foodTab).toHaveFocus();
  });
});
