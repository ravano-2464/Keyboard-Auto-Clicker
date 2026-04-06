import { Timer, Gauge } from 'lucide-react';

const PRESETS = [
  { label: '50ms', value: 50 },
  { label: '100ms', value: 100 },
  { label: '250ms', value: 250 },
  { label: '500ms', value: 500 },
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
];

export default function IntervalSettings({ interval, onIntervalChange, disabled, copy }) {
  const handleChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      onIntervalChange(val);
    }
  };

  return (
    <div className="settings-card">
      <div className="card-header">
        <div className="card-icon">
          <Timer size={18} />
        </div>
        <div>
          <div className="card-title">{copy.title}</div>
          <div className="card-subtitle">{copy.subtitle}</div>
        </div>
      </div>

      <div className="interval-controls">
        <div className="interval-input-group">
          <div className="interval-input-wrapper">
            <input
              type="number"
              className="interval-input"
              value={interval}
              onChange={handleChange}
              min={10}
              max={60000}
              disabled={disabled}
              placeholder={copy.placeholder}
            />
            <span className="interval-unit">ms</span>
          </div>
          <div className="interval-speed-indicator">
            <Gauge size={14} className="stat-icon" />
            <span className="interval-speed-label">
              {interval < 100
                ? copy.speedLabel.veryFast
                : interval < 500
                  ? copy.speedLabel.fast
                  : interval < 1000
                    ? copy.speedLabel.normal
                    : copy.speedLabel.slow}
            </span>
          </div>
        </div>

        <div className="interval-presets">
          {PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.value}
              className={`preset-btn ${interval === preset.value ? 'active' : ''}`}
              onClick={() => onIntervalChange(preset.value)}
              disabled={disabled}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
