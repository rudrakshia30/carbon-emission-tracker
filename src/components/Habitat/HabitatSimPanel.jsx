/**
 * HabitatSimPanel — Extracted simulation controls for the habitat canvas.
 * Manages time-of-day, wind speed, and eco-home toggle.
 *
 * @module HabitatSimPanel
 */

/**
 * @param {Object} props
 * @param {boolean} props.isRealTime - Whether time tracks real time
 * @param {number} props.manualTime - Manual time of day (0-23.9)
 * @param {number} props.windSpeed - Wind speed multiplier (0-10)
 * @param {boolean} props.showEcoHome - Whether to render eco-home
 * @param {Function} props.onRealTimeToggle - Toggle real-time lock
 * @param {Function} props.onManualTimeChange - Set manual time
 * @param {Function} props.onWindSpeedChange - Set wind speed
 * @param {Function} props.onEcoHomeToggle - Toggle eco-home
 */
export default function HabitatSimPanel({
  isRealTime,
  manualTime,
  windSpeed,
  showEcoHome,
  onRealTimeToggle,
  onManualTimeChange,
  onWindSpeedChange,
  onEcoHomeToggle,
}) {
  return (
    <div className="simulation-panel">
      <h3 className="simulation-panel__title">🛠️ Habitat Simulator</h3>
      <div className="simulation-panel__grid">

        {/* Time of Day Control */}
        <div className="sim-control">
          <div className="sim-control__header">
            <label htmlFor="sim-time-slider" className="sim-control__label">
              🌅 Time of Day: <strong>{isRealTime ? 'Auto (Real-time)' : `${Math.floor(manualTime)}:00`}</strong>
            </label>
            <button
              className={`sim-control__toggle-btn ${isRealTime ? '' : 'sim-control__toggle-btn--active'}`}
              onClick={onRealTimeToggle}
              aria-label={isRealTime ? 'Unlock time of day control' : 'Lock to real time'}
              type="button"
            >
              {isRealTime ? '🔓 Unlock' : '🔒 Lock to Real'}
            </button>
          </div>
          <input
            id="sim-time-slider"
            type="range"
            min="0"
            max="23.9"
            step="0.1"
            disabled={isRealTime}
            value={isRealTime ? new Date().getHours() : manualTime}
            onChange={(e) => onManualTimeChange(parseFloat(e.target.value))}
            className="sim-control__slider"
            aria-label={`Time of day: ${isRealTime ? 'Auto real-time' : `${Math.floor(manualTime)}:00`}`}
            aria-valuemin={0}
            aria-valuemax={23}
            aria-valuenow={isRealTime ? new Date().getHours() : Math.floor(manualTime)}
          />
        </div>

        {/* Wind Speed Control */}
        <div className="sim-control">
          <div className="sim-control__header">
            <label htmlFor="sim-wind-slider" className="sim-control__label">
              💨 Wind Speed: <strong>{windSpeed}x</strong>
            </label>
          </div>
          <input
            id="sim-wind-slider"
            type="range"
            min="0"
            max="10"
            step="1"
            value={windSpeed}
            onChange={(e) => onWindSpeedChange(parseInt(e.target.value))}
            className="sim-control__slider"
            aria-label={`Wind speed: ${windSpeed} out of 10`}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={windSpeed}
          />
        </div>

        {/* Eco-Home Toggle */}
        <div className="sim-control sim-control--full-width">
          <div className="sim-control__checkbox-wrapper">
            <label htmlFor="sim-toggle-home" className="sim-control__label">
              🏡 Render Digital Twin Eco-Home
            </label>
            <button
              id="sim-toggle-home"
              className={`sim-toggle ${showEcoHome ? 'sim-toggle--on' : ''}`}
              onClick={onEcoHomeToggle}
              role="switch"
              aria-checked={showEcoHome}
            >
              <span className="sim-toggle__knob" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
