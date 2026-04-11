import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Clock3, Command, Keyboard, Loader, Play, Radio, Sparkles } from 'lucide-react';
import { getLocalizedKeyLabel } from '../i18n';

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
  language = 'en',
  copy,
}) {
  const orbShellRef = useRef(null);
  const [isOrbDocked, setIsOrbDocked] = useState(false);

  useEffect(() => {
    const shellEl = orbShellRef.current;
    if (!shellEl) return;

    const scrollHost = shellEl.closest('.main-content');
    if (!scrollHost) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
          setIsOrbDocked(!isVisible);
        },
        {
          root: scrollHost,
          threshold: 0.05,
        }
      );
      observer.observe(shellEl);

      return () => {
        observer.disconnect();
      };
    }

    let frameId = 0;
    const updateDockedState = () => {
      const shellRect = shellEl.getBoundingClientRect();
      const hostRect = scrollHost.getBoundingClientRect();
      const isAboveViewport = shellRect.bottom <= hostRect.top + 12;
      setIsOrbDocked(isAboveViewport);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateDockedState);
    };
    updateDockedState();
    scrollHost.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      cancelAnimationFrame(frameId);
      scrollHost.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  const statusMode = isMacroPlaying
    ? 'playing'
    : isMacroRecording
      ? 'recording'
      : isRunning
        ? 'running'
        : 'idle';
  const keyLabel = selectedKey?.trim()
    ? getLocalizedKeyLabel(selectedKey, language)
    : copy.notSet;
  const playbackSourceLabel = copy.sourceLabel(playbackSource);
  const statusMap = {
    idle: {
      label: copy.idle.label,
      eyebrow: copy.idle.eyebrow,
      description: copy.idle.description,
      hotkey: clickerHotkey,
      hotkeyLabel: copy.idle.hotkeyLabel,
      hotkeyNote: copy.idle.hotkeyNote,
      orbIcon: Sparkles,
    },
    running: {
      label: copy.running.label,
      eyebrow: copy.running.eyebrow,
      description: copy.running.description(keyLabel, interval),
      hotkey: clickerHotkey,
      hotkeyLabel: copy.running.hotkeyLabel,
      hotkeyNote: copy.running.hotkeyNote,
      orbIcon: Loader,
    },
    recording: {
      label: copy.recording.label,
      eyebrow: copy.recording.eyebrow,
      description: copy.recording.description(recordingDurationLabel),
      hotkey: recordHotkey,
      hotkeyLabel: copy.recording.hotkeyLabel,
      hotkeyNote: copy.recording.hotkeyNote,
      orbIcon: Radio,
    },
    playing: {
      label: copy.playing.label,
      eyebrow: copy.playing.eyebrow,
      description: copy.playing.description(playbackSourceLabel, activeStepsCount, activeDurationLabel),
      hotkey: playbackHotkey,
      hotkeyLabel: copy.playing.hotkeyLabel,
      hotkeyNote: copy.playing.hotkeyNote,
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
          ? copy.cards.playbackSource
          : statusMode === 'recording'
            ? copy.cards.inputFeed
            : copy.cards.targetKey,
      value:
        statusMode === 'playing'
          ? playbackSourceLabel
          : statusMode === 'recording'
            ? copy.cards.liveKeyboard
            : keyLabel,
      note:
        statusMode === 'recording'
          ? copy.cards.recordingInputNote
          : statusMode === 'playing'
            ? copy.cards.playingSourceNote
            : statusMode === 'running'
              ? copy.cards.runningTargetNote
              : copy.cards.idleTargetNote,
    },
    {
      icon: Activity,
      label: statusMode === 'recording' ? copy.cards.captureBuffer : copy.cards.macroStack,
      value: activeStepsCount > 0 ? copy.stepCount(activeStepsCount) : copy.cards.empty,
      note:
        statusMode === 'playing'
          ? copy.cards.activeMacroNote
          : copy.cards.defaultMacroNote,
    },
    {
      icon: Clock3,
      label:
        statusMode === 'playing'
          ? copy.cards.timeline
          : statusMode === 'recording'
            ? copy.cards.recordingTime
            : copy.cards.cadence,
      value:
        statusMode === 'playing'
          ? activeDurationLabel
          : statusMode === 'recording'
            ? recordingDurationLabel
            : `${interval} ms`,
      note:
        statusMode === 'playing'
          ? copy.cards.playbackDurationNote
          : statusMode === 'recording'
            ? copy.cards.recordingDurationNote
            : copy.cards.cadenceNote,
    },
    {
      icon: Command,
      label: copy.cards.controlHotkey,
      value: currentStatus.hotkey,
      note: currentStatus.hotkeyNote,
    },
  ];

  return (
    <>
      <section className={`status-section ${statusMode}`}>
      <div className="status-topline">
        <div className={`status-chip primary ${statusMode}`}>
          <span className="status-chip-dot" />
          <span>{currentStatus.eyebrow}</span>
        </div>
        <div className="status-chip ghost">
          <Activity size={12} />
          {activeStepsCount > 0 ? copy.readyMacroSteps(activeStepsCount) : copy.emptyMacroStack}
        </div>
      </div>

      <div className="status-hero">
        <div className="status-orb-shell" ref={orbShellRef}>
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
          <div className="status-kicker">{copy.systemPulse}</div>
          <div className={`status-label ${statusMode}`}>{currentStatus.label}</div>
          <div className="status-description">{currentStatus.description}</div>
        </div>
      </div>

      <div className={`status-hint ${statusMode}`}>
        <span className="status-hint-copy">{copy.quickControl}</span>
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

      {typeof document !== 'undefined'
        ? createPortal(
            <div className={`status-orb-dock ${isOrbDocked ? 'visible' : ''}`} aria-hidden={!isOrbDocked}>
              <div className={`status-orb ${statusMode} compact`}>
                <div className="status-orb-ring" />
                <div className="status-orb-ring secondary" />
                <div className="status-orb-core" />
                <div className="status-orb-icon">
                  <OrbIcon size={22} />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
