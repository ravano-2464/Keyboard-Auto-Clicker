import { Zap, ZapOff, Loader } from 'lucide-react';

export default function StatusOrb({ isRunning }) {
  return (
    <div className="status-section">
      <div className="status-orb-container">
        <div className={`status-orb ${isRunning ? 'running' : 'idle'}`}>
          <div className="status-orb-ring" />
          <div className="status-orb-icon">
            {isRunning ? (
              <Loader size={32} />
            ) : (
              <Zap size={32} />
            )}
          </div>
        </div>
      </div>
      <div className="status-info">
        <div className={`status-label ${isRunning ? 'running' : 'idle'}`}>
          {isRunning ? 'RUNNING' : 'IDLE'}
        </div>
        <div className="status-hint">
          Press
          <span className="hotkey-badge">
            <ZapOff size={10} />
            F6
          </span>
          to toggle
        </div>
      </div>
    </div>
  );
}
