import { Hash, Clock, Keyboard } from 'lucide-react';

export default function StatsBar({ clickCount, elapsedTime, selectedKey }) {
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatKey = (key) => {
    if (!key) return '-';
    if (key === ' ' || key === 'Space') return 'SPC';
    if (key.length === 1) return key.toUpperCase();
    return key.slice(0, 3).toUpperCase();
  };

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <Keyboard size={12} className="stat-icon" />
        <div>
          <div className="stat-label">Key</div>
          <div className="stat-value">{formatKey(selectedKey)}</div>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <Hash size={12} className="stat-icon" />
        <div>
          <div className="stat-label">Clicks</div>
          <div className="stat-value">{clickCount.toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <Clock size={12} className="stat-icon" />
        <div>
          <div className="stat-label">Time</div>
          <div className="stat-value">{formatTime(elapsedTime)}</div>
        </div>
      </div>
    </div>
  );
}
