import {
  Clock3,
  Keyboard,
  Layers3,
  Play,
  Radio,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';

export default function KeyboardRecorder({
  isMacroRecording,
  isMacroPlaying,
  recordingLabel,
  playbackLabel,
  canStartPlayback,
  onToggleRecording,
  onClearRecording,
  onTogglePlayback,
  playbackSource,
  onPlaybackSourceChange,
  recordedEventsCount,
  manualSteps,
  activeStepsCount,
  activeDurationLabel,
  recordingDurationLabel,
  onAddManualStep,
  onSaveManualMacro,
  onUpdateManualStep,
  onRemoveManualStep,
  normalizeRecordedKey,
  speedPresets,
  useCustomSpeed,
  selectedSpeedPreset,
  onSelectSpeedPreset,
  onToggleUseCustomSpeed,
  customSpeed,
  onCustomSpeedChange,
  continuousPlayback,
  onContinuousPlaybackChange,
  clickerHotkeyInput,
  recordHotkeyInput,
  playbackHotkeyInput,
  hotkeyCaptureTarget,
  onBeginHotkeyCapture,
  onCancelHotkeyCapture,
  manualStepCaptureIndex,
  onBeginManualStepCapture,
  onCancelManualStepCapture,
  onApplyHotkeys,
  clickerHotkey,
  recordHotkey,
  playbackHotkey,
  macroError,
  copy,
}) {
  const playbackSourceLabel = copy.sourceLabel(playbackSource);
  const macroStatusTone = isMacroPlaying ? 'playing' : isMacroRecording ? 'recording' : 'idle';
  const selectedSourceItems =
    playbackSource === 'manual' ? manualSteps.length : recordedEventsCount;
  const StatusIcon = isMacroPlaying ? Play : isMacroRecording ? Radio : Sparkles;
  const macroStatusBadge = isMacroPlaying
    ? copy.status.playingBadge
    : isMacroRecording
      ? copy.status.recordingBadge
      : copy.status.idleBadge;
  const macroStatusLabel = isMacroPlaying
    ? copy.status.playingTitle(playbackSourceLabel)
    : isMacroRecording
      ? copy.status.recordingTitle
      : copy.status.idleTitle;
  const macroStatusDescription = isMacroPlaying
    ? copy.status.playingDescription(playbackSourceLabel, playbackHotkey)
    : isMacroRecording
      ? copy.status.recordingDescription(recordHotkey)
      : copy.status.idleDescription;
  const macroQuickHotkey = isMacroPlaying
    ? playbackHotkey
    : isMacroRecording
      ? recordHotkey
      : playbackHotkey;
  const macroQuickLabel = isMacroPlaying
    ? copy.status.quickActionLabel.playing
    : isMacroRecording
      ? copy.status.quickActionLabel.recording
      : copy.status.quickActionLabel.idle;
  const macroStatusCards = [
    {
      icon: Keyboard,
      label: copy.cards.selectedSource,
      value: playbackSourceLabel,
      note: copy.cards.selectedSourceNote(selectedSourceItems),
    },
    {
      icon: Layers3,
      label: isMacroRecording ? copy.cards.capturedSteps : copy.cards.activeSteps,
      value: activeStepsCount > 0 ? `${activeStepsCount}` : '0',
      note: isMacroRecording
        ? copy.cards.capturedStepsNote
        : copy.cards.activeStepsNote,
    },
    {
      icon: Clock3,
      label: isMacroRecording ? copy.cards.recordingTime : copy.cards.timeline,
      value: isMacroRecording ? recordingDurationLabel : activeDurationLabel,
      note: isMacroRecording ? copy.cards.recordingTimeNote : copy.cards.timelineNote,
    },
    {
      icon: RotateCw,
      label: copy.cards.loopMode,
      value: continuousPlayback ? copy.cards.continuous : copy.cards.singleRun,
      note: continuousPlayback
        ? copy.cards.continuousNote
        : copy.cards.singleRunNote,
    },
  ];

  const renderHotkeyCapture = (target, label, value, placeholder) => {
    const isListening = hotkeyCaptureTarget === target;

    return (
      <div className="macro-hotkey-field">
        <div className="key-preset-label">{label}</div>
        <button
          type="button"
          className={`macro-hotkey-capture ${isListening ? 'listening' : ''}`}
          onClick={() => (isListening ? onCancelHotkeyCapture() : onBeginHotkeyCapture(target))}
          disabled={isMacroRecording}
        >
          <span className="macro-hotkey-capture-value">
            {isListening ? copy.hotkeyCapture.listeningValue : value || placeholder}
          </span>
          <span className="macro-hotkey-capture-meta">
            {isListening ? copy.hotkeyCapture.listeningMeta : copy.hotkeyCapture.idleMeta}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="settings-card">
      <div className="card-header">
        <div className="card-icon">
          <Save size={18} />
        </div>
        <div>
          <div className="card-title">{copy.title}</div>
          <div className="card-subtitle">{copy.subtitle}</div>
        </div>
      </div>

      <div className="macro-panel">
        <div className="macro-actions-row">
          <button
            type="button"
            className={`preset-btn ${isMacroRecording ? 'active' : ''}`}
            onClick={onToggleRecording}
          >
            {recordingLabel}
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={onClearRecording}
            disabled={isMacroRecording}
          >
            <Trash2 size={12} />
            {copy.buttons.clear}
          </button>
          <button
            type="button"
            className={`preset-btn ${isMacroPlaying ? 'active' : ''}`}
            onClick={onTogglePlayback}
            disabled={!canStartPlayback}
          >
            {playbackLabel}
          </button>
        </div>

        <div className={`macro-status-board ${macroStatusTone}`}>
          <div className="macro-status-board-head">
            <div className={`macro-status-badge ${macroStatusTone}`}>
              <span className="macro-status-badge-dot" />
              <span>{macroStatusBadge}</span>
            </div>
            <div className="macro-status-source-tag">{playbackSourceLabel}</div>
          </div>

          <div className="macro-status-main">
            <div className="macro-status-main-copy">
              <div className={`macro-status-icon ${macroStatusTone}`}>
                <StatusIcon size={18} />
              </div>
              <div className="macro-status-copy">
                <div className="macro-status-title">{macroStatusLabel}</div>
                <div className="macro-status-description">{macroStatusDescription}</div>
              </div>
            </div>

            <div className="macro-status-quick">
              <div className="macro-status-quick-label">{macroQuickLabel}</div>
              <div className="macro-status-quick-hotkey">{macroQuickHotkey}</div>
            </div>
          </div>

          <div className="macro-status-grid">
            {macroStatusCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="macro-status-card">
                  <div className="macro-status-card-icon">
                    <Icon size={14} />
                  </div>
                  <div className="macro-status-card-copy">
                    <div className="macro-status-card-label">{card.label}</div>
                    <div className="macro-status-card-value">{card.value}</div>
                    <div className="macro-status-card-note">{card.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="macro-source-selector">
          <button
            type="button"
            className={`preset-btn ${playbackSource === 'recorded' ? 'active' : ''}`}
            onClick={() => onPlaybackSourceChange('recorded')}
            disabled={isMacroRecording || isMacroPlaying || recordedEventsCount === 0}
          >
            {copy.buttons.useRecorded}
          </button>
          <button
            type="button"
            className={`preset-btn ${playbackSource === 'manual' ? 'active' : ''}`}
            onClick={() => onPlaybackSourceChange('manual')}
            disabled={isMacroRecording || isMacroPlaying || manualSteps.length === 0}
          >
            {copy.buttons.useManual}
          </button>
        </div>

        <div className="macro-editor-section">
          <div className="macro-editor-head">
            <div className="key-preset-label">{copy.fields.manualEditor}</div>
            <div className="macro-editor-actions">
              <button
                type="button"
                className="preset-btn"
                onClick={onAddManualStep}
                disabled={isMacroRecording}
              >
                {copy.buttons.addStep}
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={onSaveManualMacro}
                disabled={isMacroRecording || manualSteps.length === 0}
              >
                {copy.buttons.saveManual}
              </button>
            </div>
          </div>

          {manualSteps.length === 0 ? (
            <div className="macro-step-empty">{copy.emptyManual}</div>
          ) : (
            <>
              <div className="macro-step-list">
                {manualSteps.map((step, index) => {
                  const isListening = manualStepCaptureIndex === index;

                  return (
                    <div key={`macro-step-${index}`} className="macro-step-card">
                      <div className="macro-step-card-head">
                        <div className="macro-step-index">{copy.stepLabel(index + 1)}</div>
                        <button
                          type="button"
                          className="preset-btn macro-step-remove-btn"
                          onClick={() => onRemoveManualStep(index)}
                          disabled={isMacroRecording}
                        >
                          {copy.buttons.remove}
                        </button>
                      </div>

                      <div className="macro-step-grid">
                        <label className="macro-step-field macro-step-field-key">
                          <span className="macro-step-field-label">{copy.fields.key}</span>
                          <div className="macro-step-key-group">
                            <input
                              type="text"
                              className="interval-input macro-step-key-input"
                              value={step.key}
                              onChange={(event) =>
                                onUpdateManualStep(index, {
                                  key: normalizeRecordedKey(event.target.value),
                                })
                              }
                              placeholder={copy.fields.key}
                              disabled={isMacroRecording}
                            />
                            <button
                              type="button"
                              className={`preset-btn macro-step-capture-btn ${isListening ? 'active' : ''}`}
                              onClick={() =>
                                isListening
                                  ? onCancelManualStepCapture()
                                  : onBeginManualStepCapture(index)
                              }
                              disabled={isMacroRecording}
                            >
                              <Keyboard size={12} />
                              {isListening ? copy.buttons.listening : copy.buttons.record}
                            </button>
                          </div>
                        </label>

                        <label className="macro-step-field">
                          <span className="macro-step-field-label">{copy.fields.delay}</span>
                          <div className="interval-input-wrapper macro-step-delay-wrapper">
                            <input
                              type="number"
                              className="interval-input macro-step-delay-input"
                              value={step.delay ?? ''}
                              min={0}
                              step={1}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                onUpdateManualStep(index, {
                                  delay:
                                    nextValue === ''
                                      ? ''
                                      : Math.max(0, parseInt(nextValue, 10) || 0),
                                });
                              }}
                              disabled={isMacroRecording}
                            />
                            <span className="interval-unit">ms</span>
                          </div>
                        </label>

                        <label className="macro-step-field">
                          <span className="macro-step-field-label">{copy.fields.hold}</span>
                          <div className="interval-input-wrapper macro-step-hold-wrapper">
                            <input
                              type="number"
                              className="interval-input macro-step-hold-input"
                              value={step.hold ?? ''}
                              min={0}
                              step={1}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                onUpdateManualStep(index, {
                                  hold:
                                    nextValue === ''
                                      ? ''
                                      : Math.max(0, parseInt(nextValue, 10) || 0),
                                });
                              }}
                              disabled={isMacroRecording}
                            />
                            <span className="interval-unit">ms</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="macro-step-hint">
                {manualStepCaptureIndex === null
                  ? copy.hints.manualIdle
                  : copy.hints.manualListening}
              </div>
            </>
          )}
        </div>

        <div className="macro-speed-section">
          <div className="key-preset-label">{copy.fields.playbackSpeed}</div>
          <div className="interval-presets">
            {speedPresets.map((speed) => (
              <button
                type="button"
                key={speed}
                className={`preset-btn ${!useCustomSpeed && selectedSpeedPreset === speed ? 'active' : ''}`}
                onClick={() => onSelectSpeedPreset(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="macro-custom-speed-row">
            <label className="macro-checkbox">
              <span className="macro-checkbox-control">
                <input
                  type="checkbox"
                  checked={useCustomSpeed}
                  onChange={(event) => onToggleUseCustomSpeed(event.target.checked)}
                />
                <span className="macro-checkbox-indicator" aria-hidden="true" />
              </span>
              <span className="macro-checkbox-label">{copy.fields.customSpeed}</span>
            </label>
            <div className="interval-input-wrapper macro-speed-input-wrapper">
              <input
                type="number"
                className="interval-input macro-speed-input"
                value={customSpeed}
                onChange={(event) => onCustomSpeedChange(event.target.value)}
                min={0.01}
                step={0.01}
                disabled={!useCustomSpeed}
              />
              <span className="interval-unit">x</span>
            </div>
          </div>

          <label className="macro-checkbox">
            <span className="macro-checkbox-control">
              <input
                type="checkbox"
                checked={continuousPlayback}
                onChange={(event) => onContinuousPlaybackChange(event.target.checked)}
              />
              <span className="macro-checkbox-indicator" aria-hidden="true" />
            </span>
            <span className="macro-checkbox-label">{copy.fields.continuousPlayback}</span>
          </label>
        </div>

        <div className="macro-hotkey-grid">
          {renderHotkeyCapture('clicker', copy.fields.clickerHotkey, clickerHotkeyInput, 'F6')}
          {renderHotkeyCapture('record', copy.fields.recordHotkey, recordHotkeyInput, 'F7')}
          {renderHotkeyCapture(
            'playback',
            copy.fields.playbackHotkey,
            playbackHotkeyInput,
            'F8'
          )}
        </div>

        <div className="macro-hotkey-hint">{copy.hints.hotkey}</div>

        <div className="macro-hotkey-actions">
          <button type="button" className="preset-btn" onClick={onApplyHotkeys}>
            {copy.buttons.applyHotkeys}
          </button>
          <div className="macro-hotkey-active">
            {copy.activeHotkeys(clickerHotkey, recordHotkey, playbackHotkey)}
          </div>
        </div>

        {macroError && <div className="macro-error">{macroError}</div>}
      </div>
    </div>
  );
}
