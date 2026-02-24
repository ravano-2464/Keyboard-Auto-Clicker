import { Repeat, Infinity as InfinityIcon, Hash } from 'lucide-react';

export default function RepeatMode({ mode, onModeChange, repeatCount, onRepeatCountChange, disabled }) {
  return (
    <div className="settings-card">
      <div className="card-header">
        <div className="card-icon">
          <Repeat size={18} />
        </div>
        <div>
          <div className="card-title">Repeat Mode</div>
          <div className="card-subtitle">Choose how many times to repeat</div>
        </div>
      </div>

      <div className="repeat-mode-group">
        <div className="repeat-toggle-row">
          <button
            className={`repeat-option ${mode === 'infinite' ? 'active' : ''}`}
            onClick={() => onModeChange('infinite')}
            disabled={disabled}
          >
            <span className="repeat-option-icon">
              <InfinityIcon size={16} />
            </span>
            Infinite
          </button>
          <button
            className={`repeat-option ${mode === 'count' ? 'active' : ''}`}
            onClick={() => onModeChange('count')}
            disabled={disabled}
          >
            <span className="repeat-option-icon">
              <Hash size={16} />
            </span>
            Custom Count
          </button>
        </div>

        {mode === 'count' && (
          <div className="repeat-count-input">
            <div className="interval-input-wrapper" style={{ flex: 1 }}>
              <input
                type="number"
                className="interval-input"
                value={repeatCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    onRepeatCountChange(val);
                  }
                }}
                min={1}
                max={999999}
                disabled={disabled}
                placeholder="Count"
              />
              <span className="interval-unit">times</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
