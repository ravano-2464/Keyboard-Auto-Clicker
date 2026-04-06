import { Activity, Clock3, Command, Keyboard, Loader, Play, Radio, Sparkles } from 'lucide-react';

export default function StatusOrb({
  isRunning,
  isMacroRecording = false,
  isMacroPlaying = false,
  playbackSource = 'recorded',
  selectedKey = 'Space',
  interval = 100,
  activeStepsCount = 0,
  activeDurationLabel = '0s',
  recordingDurationLabel = '0s',
  clickerHotkey = 'F6',
  recordHotkey = 'F7',
  playbackHotkey = 'F8',
}) {
  const statusMode = isMacroPlaying
    ? 'playing'
    : isMacroRecording
      ? 'recording'
      : isRunning
        ? 'running'
        : 'idle';
  const keyLabel = (selectedKey || 'Not Set').trim() || 'Not Set';
  const playbackSourceLabel = playbackSource === 'manual' ? 'Manual Editor' : 'Recorded Keys';
  const statusMap = {
    idle: {
      label: 'IDLE',
      eyebrow: 'System Ready',
      description: 'Everything is armed. Pick a key or a macro source, then launch it instantly.',
      hotkey: clickerHotkey,
      hotkeyLabel: 'to toggle auto clicker',
      hotkeyNote: 'Quick start or stop',
      orbIcon: Sparkles,
    },
    running: {
      label: 'RUNNING',
      eyebrow: 'Auto Clicker Live',
      description: `Auto clicker is pressing ${keyLabel} every ${interval} ms.`,
      hotkey: clickerHotkey,
      hotkeyLabel: 'to stop auto clicker',
      hotkeyNote: 'Toggle active click loop',
      orbIcon: Loader,
    },
    recording: {
      label: 'RECORDING',
      eyebrow: 'Keyboard Capture Live',
      description: `Capturing live keystrokes now. Current session length: ${recordingDurationLabel}.`,
      hotkey: recordHotkey,
      hotkeyLabel: 'to stop recording',
      hotkeyNote: 'Finish capture and save events',
      orbIcon: Radio,
    },
    playing: {
      label: 'PLAYING',
      eyebrow: 'Macro Playback Active',
      description: `Running ${playbackSourceLabel} with ${activeStepsCount} step${activeStepsCount === 1 ? '' : 's'} across ${activeDurationLabel}.`,
      hotkey: playbackHotkey,
      hotkeyLabel: 'to stop playback',
      hotkeyNote: 'Stop macro playback instantly',
      orbIcon: Play,
    },
  };
  const currentStatus = statusMap[statusMode];
  const OrbIcon = currentStatus.orbIcon;
  const statCards = [
    {
      icon: Keyboard,
      label:
        statusMode === 'playing'
          ? 'Playback Source'
          : statusMode === 'recording'
            ? 'Input Feed'
            : 'Target Key',
      value:
        statusMode === 'playing'
          ? playbackSourceLabel
          : statusMode === 'recording'
            ? 'Live Keyboard'
            : keyLabel,
      note:
        statusMode === 'recording'
          ? 'Listening to live keyboard input'
          : statusMode === 'playing'
            ? 'Source currently driving macro playback'
            : statusMode === 'running'
              ? 'Primary auto click target'
              : 'Ready for the next trigger',
    },
    {
      icon: Activity,
      label: statusMode === 'recording' ? 'Capture Buffer' : 'Macro Stack',
      value: activeStepsCount > 0 ? `${activeStepsCount} steps` : 'Empty',
      note:
        statusMode === 'playing'
          ? 'Current loaded macro is executing'
          : 'Recorded and manual steps stay ready here',
    },
    {
      icon: Clock3,
      label:
        statusMode === 'playing'
          ? 'Timeline'
          : statusMode === 'recording'
            ? 'Recording Time'
            : 'Cadence',
      value:
        statusMode === 'playing'
          ? activeDurationLabel
          : statusMode === 'recording'
            ? recordingDurationLabel
            : `${interval} ms`,
      note:
        statusMode === 'playing'
          ? 'Total macro playback duration'
          : statusMode === 'recording'
            ? 'Elapsed live capture length'
            : 'Current click interval',
    },
    {
      icon: Command,
      label: 'Control Hotkey',
      value: currentStatus.hotkey,
      note: currentStatus.hotkeyNote,
    },
  ];

  return (
    <section className={`status-section ${statusMode}`}>
      <div className="status-topline">
        <div className={`status-chip primary ${statusMode}`}>
          <span className="status-chip-dot" />
          <span>{currentStatus.eyebrow}</span>
        </div>
        <div className="status-chip ghost">
          <Activity size={12} />
          {activeStepsCount > 0 ? `${activeStepsCount} macro steps ready` : 'Macro stack is empty'}
        </div>
      </div>

      <div className="status-hero">
        <div className="status-orb-shell">
          <div className="status-orb-container">
            <div className={`status-orb ${statusMode}`}>
              <div className="status-orb-ring" />
              <div className="status-orb-ring secondary" />
              <div className="status-orb-core" />
              <div className="status-orb-icon">
                <OrbIcon size={34} />
              </div>
            </div>
          </div>
        </div>

        <div className="status-info">
          <div className="status-kicker">System Pulse</div>
          <div className={`status-label ${statusMode}`}>{currentStatus.label}</div>
          <div className="status-description">{currentStatus.description}</div>
        </div>
      </div>

      <div className={`status-hint ${statusMode}`}>
        <span className="status-hint-copy">Quick control</span>
        <span className="hotkey-badge">
          <Command size={10} />
          {currentStatus.hotkey}
        </span>
        <span>{currentStatus.hotkeyLabel}</span>
      </div>

      <div className="status-stat-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="status-stat-card">
              <div className="status-stat-icon">
                <Icon size={14} />
              </div>
              <div className="status-stat-copy">
                <div className="status-stat-label">{card.label}</div>
                <div className="status-stat-value">{card.value}</div>
                <div className="status-stat-note">{card.note}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
