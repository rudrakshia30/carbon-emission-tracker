import { useMemo } from 'react';
import './Suggestions.css';

/**
 * Suggestions mapping based on user's highest emission category.
 */
const SUGGESTIONS = {
  transport: {
    title: '🚗 Transport Emissions Cut',
    desc: 'Commutes and travel represent your largest footprint category. Transport is a massive contributor to global emissions. Swapping trips to cleaner modes makes the fastest impact on your island health:',
    tips: [
      { text: 'Walk or bike for shorter trips under 5 km. This eliminates 100% of transport CO₂ for the trip and improves your physical health.', icon: '🚲' },
      { text: 'Take public transit (metro, train, or bus). A full bus can take 40+ cars off the road, drastically reducing per-capita emissions.', icon: '🚇' },
      { text: 'Carpool or use rideshares. Sharing a ride cuts your vehicle footprint in half. Better yet, consider electric vehicles (EVs) for your next car purchase.', icon: '👥' },
      { text: 'Reduce air travel. Flights are highly carbon-intensive. Opt for local vacations or train travel when possible.', icon: '✈️' }
    ]
  },
  food: {
    title: '🍽️ Food Footprint Swaps',
    desc: 'Your diet accounts for your peak emissions. The agriculture industry (especially meat) requires huge amounts of land and water. Swapping meals can dramatically clear up your island smog:',
    tips: [
      { text: 'Replace one red meat meal (beef/pork) with vegetarian/vegan options to save up to 6.8kg CO₂ per meal.', icon: '🥗' },
      { text: 'Switch beef meals to chicken or sustainably caught fish to reduce meal carbon by over 70%.', icon: '🍗' },
      { text: 'Swap out dairy-heavy meals for plant-based alternatives like oat milk or almond milk.', icon: '🥛' },
      { text: 'Reduce food waste. Plan your meals and compost food scraps. Rotting food in landfills produces potent methane gas.', icon: '🗑️' }
    ]
  },
  energy: {
    title: '⚡ Home Energy Efficiency',
    desc: 'Heating, cooling, and appliance usage contributes the most to your energy score. Fossil fuels power most grids, so optimizing home habits is key:',
    tips: [
      { text: 'Adjust AC settings (aim for 24-26°C) and shut them off when rooms are empty. A 1°C change can save 10% on energy.', icon: '❄️' },
      { text: 'Shorten shower runtimes to 5-8 minutes and install low-flow showerheads to reduce water-heating emissions.', icon: '🚿' },
      { text: 'Run washing machines and dishwashers on full loads using cold-water eco settings. Air-dry clothes when possible.', icon: '👕' },
      { text: 'Switch all bulbs to LEDs and unplug "vampire" electronics that draw power even when turned off.', icon: '💡' }
    ]
  },
  shopping: {
    title: '🛍️ Sustainable Consumer Choices',
    desc: 'Shopping and product purchases drive your carbon profile due to manufacturing, packaging, and shipping. Transition to mindful consumption:',
    tips: [
      { text: 'Choose high-quality, durable clothes over fast-fashion items. Repair clothing instead of throwing it away.', icon: '👕' },
      { text: 'Extend device lifespans (phones/laptops) instead of upgrading every year. Buy refurbished electronics.', icon: '📱' },
      { text: 'Purchase local produce instead of imported alternatives to avoid cargo flight footprints. Support local farmer markets.', icon: '🥬' },
      { text: 'Bring reusable bags and avoid single-use plastics. Vote with your wallet by buying from eco-friendly brands.', icon: '♻️' }
    ]
  },
  none: {
    title: '🌱 Island Ledger is Clean!',
    desc: 'No logged emissions detected yet, or all categories are clean. Start logging daily activities to receive custom, data-driven footprint tips!',
    tips: [
      { text: 'Log your transportation, meals, and home energy daily using the Log tab.', icon: '📝' },
      { text: 'Check the Habitat tab to see your digital twin ecosystem respond in real time to your emissions.', icon: '🏝️' },
      { text: 'Review the Dashboard breakdown to watch your green patterns grow over the week.', icon: '📊' },
      { text: 'Check the Badges tab and aim to unlock your first achievement!', icon: '🏆' }
    ]
  }
};

export default function Suggestions({ logs = [] }) {
  // Calculate carbon category totals over all logs to find the highest category
  const categoryTotals = useMemo(() => {
    const totals = { transport: 0, food: 0, energy: 0, shopping: 0 };
    logs.forEach((log) => {
      totals.transport += log.transport || 0;
      totals.food += log.food || 0;
      totals.energy += log.energy || 0;
      totals.shopping += log.shopping || 0;
    });
    return totals;
  }, [logs]);

  // Find the category with maximum emissions
  const maxCategory = useMemo(() => {
    let maxKey = 'none';
    let maxVal = 0.1; // ignore tiny values
    Object.entries(categoryTotals).forEach(([key, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxKey = key;
      }
    });
    return maxKey;
  }, [categoryTotals]);

  // Get active suggestion card
  const activeSuggestion = useMemo(() => {
    return SUGGESTIONS[maxCategory] || SUGGESTIONS.none;
  }, [maxCategory]);

  return (
    <div className="suggestions" aria-label="Personalized Suggestions">
      <div className="suggestions__header">
        <h1 className="suggestions__title">Personalized Tips</h1>
        <p className="suggestions__subtitle">
          Based on your logged data, here are the most effective ways to reduce your carbon footprint and improve your island's health.
        </p>
      </div>

      <section className="sug-card">
        <div className="sug-card__glow" />
        <h2 className="sug-card__title">
          {activeSuggestion.title}
        </h2>
        <p className="sug-card__desc">{activeSuggestion.desc}</p>
        
        <div className="sug-tips">
          {activeSuggestion.tips.map((tip, index) => (
            <div key={index} className="sug-tip">
              <div className="sug-tip__icon-wrapper">
                <span className="sug-tip__icon" aria-hidden="true">{tip.icon}</span>
              </div>
              <div className="sug-tip__content">
                <span className="sug-tip__text">{tip.text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="carbon-footnote">
        Action-impact conversions and diet offsets calculated from academic meta-analyses (Poore & Nemecek, Science 2018) and EPA carbon metrics.
      </p>
    </div>
  );
}
