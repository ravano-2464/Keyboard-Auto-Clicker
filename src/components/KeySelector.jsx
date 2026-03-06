import { useState, useEffect, useCallback } from 'react';
import { Keyboard, MousePointerClick, Crosshair } from 'lucide-react';

const QUICK_KEYS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'W',
  'S',
  'Space',
  'Enter',
  '1',
  '2',
];

export default function KeySelector({ selectedKey, onKeyChange, disabled }) {
  const [isListening, setIsListening] = useState(false);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isListening) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'F6') return;

      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';

      onKeyChange(keyName);
      setIsListening(false);
    },
    [isListening, onKeyChange]
  );

  useEffect(() => {
    if (isListening) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isListening, handleKeyDown]);

  const handleQuickKey = (key) => {
    if (disabled) return;
    onKeyChange(key);
  };

  const formatKeyDisplay = (key) => {
    if (!key) return '?';
    if (key === ' ') return 'Space';
    if (key.length === 1) return key.toUpperCase();
    return key;
  };

  return (
    <div className="settings-card">
      <div className="card-header">
        <div className="card-icon">
          <Keyboard size={18} />
        </div>
        <div>
          <div className="card-title">Target Key</div>
          <div className="card-subtitle">Select the key to auto-press</div>
        </div>
      </div>

      <div className="key-selector-grid">
        <div className={`key-display ${isListening ? 'listening' : ''}`}>
          <div className={`key-cap ${isListening ? 'listening' : ''}`}>
            {isListening ? <Crosshair size={20} /> : formatKeyDisplay(selectedKey)}
          </div>
          <div className="key-display-label">
            {isListening
              ? 'Press any key...'
              : selectedKey
                ? `Key: ${formatKeyDisplay(selectedKey)}`
                : 'No key selected'}
          </div>
        </div>

        <button
          className={`key-listen-btn ${isListening ? 'listening' : ''}`}
          onClick={() => {
            if (disabled) return;
            setIsListening(!isListening);
          }}
          disabled={disabled}
        >
          <MousePointerClick size={14} />
          {isListening ? 'Listening... Press a key' : 'Click to detect key press'}
        </button>

        <div className="key-preset-section">
          <div className="key-preset-label">Quick Select</div>
          <div className="key-preset-grid">
            {QUICK_KEYS.map((key) => (
              <button
                key={key}
                className={`key-preset-btn ${selectedKey === key ? 'active' : ''}`}
                onClick={() => handleQuickKey(key)}
                disabled={disabled}
              >
                {key === 'Space' ? 'SPC' : key === 'Enter' ? 'ENT' : key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
