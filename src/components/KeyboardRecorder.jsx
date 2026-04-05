import { Keyboard, Save, Trash2 } from 'lucide-react';

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
}) {
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
            {isListening ? 'Press keys now...' : value || placeholder}
          </span>
          <span className="macro-hotkey-capture-meta">
            {isListening ? 'Esc cancel • Del clear' : 'Click and press your hotkey'}
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
          <div className="card-title">Keyboard Recorder</div>
          <div className="card-subtitle">
            Record keystrokes, set playback speed, and run continuous loop
          </div>
        </div>
      </div>

      <div className="macro-panel">
        <div className="macro-actions-row">
          <button
            className={`preset-btn ${isMacroRecording ? 'active' : ''}`}
            onClick={onToggleRecording}
          >
            {recordingLabel}
          </button>
          <button className="preset-btn" onClick={onClearRecording} disabled={isMacroRecording}>
            <Trash2 size={12} />
            Clear
          </button>
          <button
            className={`preset-btn ${isMacroPlaying ? 'active' : ''}`}
            onClick={onTogglePlayback}
            disabled={!canStartPlayback}
          >
            {playbackLabel}
          </button>
        </div>

        <div className="macro-meta">
          <span>Source: {playbackSource === 'manual' ? 'Manual Editor' : 'Recorded Keys'}</span>
          <span>Steps: {activeStepsCount}</span>
          <span>Duration: {activeDurationLabel}</span>
          {isMacroRecording && <span>Recording: {recordingDurationLabel}</span>}
        </div>

        <div className="macro-source-selector">
          <button
            className={`preset-btn ${playbackSource === 'recorded' ? 'active' : ''}`}
            onClick={() => onPlaybackSourceChange('recorded')}
            disabled={isMacroRecording || recordedEventsCount === 0}
          >
            Use Recorded
          </button>
          <button
            className={`preset-btn ${playbackSource === 'manual' ? 'active' : ''}`}
            onClick={() => onPlaybackSourceChange('manual')}
            disabled={isMacroRecording || manualSteps.length === 0}
          >
            Use Manual Editor
          </button>
        </div>

        <div className="macro-editor-section">
          <div className="macro-editor-head">
            <div className="key-preset-label">Manual Macro Editor</div>
            <div className="macro-editor-actions">
              <button className="preset-btn" onClick={onAddManualStep} disabled={isMacroRecording}>
                Add Step
              </button>
              <button
                className="preset-btn"
                onClick={onSaveManualMacro}
                disabled={isMacroRecording || manualSteps.length === 0}
              >
                Save Manual Macro
              </button>
            </div>
          </div>

          {manualSteps.length === 0 ? (
            <div className="macro-step-empty">
              No steps yet. Add steps manually or start recording inside the app.
            </div>
          ) : (
            <>
              <div className="macro-step-list">
                {manualSteps.map((step, index) => {
                  const isListening = manualStepCaptureIndex === index;

                  return (
                    <div key={`macro-step-${index}`} className="macro-step-card">
                      <div className="macro-step-card-head">
                        <div className="macro-step-index">Step {index + 1}</div>
                        <button
                          type="button"
                          className="preset-btn macro-step-remove-btn"
                          onClick={() => onRemoveManualStep(index)}
                          disabled={isMacroRecording}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="macro-step-grid">
                        <label className="macro-step-field macro-step-field-key">
                          <span className="macro-step-field-label">Key</span>
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
                              placeholder="Key"
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
                              {isListening ? 'Press key...' : 'Record'}
                            </button>
                          </div>
                        </label>

                        <label className="macro-step-field">
                          <span className="macro-step-field-label">Delay</span>
                          <div className="interval-input-wrapper macro-step-delay-wrapper">
                            <input
                              type="number"
                              className="interval-input macro-step-delay-input"
                              value={step.delay}
                              min={0}
                              step={1}
                              onChange={(event) =>
                                onUpdateManualStep(index, {
                                  delay: Number(event.target.value) || 0,
                                })
                              }
                              disabled={isMacroRecording}
                            />
                            <span className="interval-unit">ms</span>
                          </div>
                        </label>

                        <label className="macro-step-field">
                          <span className="macro-step-field-label">Hold</span>
                          <div className="interval-input-wrapper macro-step-hold-wrapper">
                            <input
                              type="number"
                              className="interval-input macro-step-hold-input"
                              value={step.hold ?? 0}
                              min={0}
                              step={1}
                              onChange={(event) =>
                                onUpdateManualStep(index, { hold: Number(event.target.value) || 0 })
                              }
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
                  ? 'Tip: Delay waits before the step starts, and Hold keeps the key pressed for that many milliseconds.'
                  : 'Listening for a step key. Press Esc to cancel or Delete to clear the key.'}
              </div>
            </>
          )}
        </div>

        <div className="macro-speed-section">
          <div className="key-preset-label">Playback Speed</div>
          <div className="interval-presets">
            {speedPresets.map((speed) => (
              <button
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
              <span className="macro-checkbox-label">Custom speed</span>
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
            <span className="macro-checkbox-label">Continuous playback</span>
          </label>
        </div>

        <div className="macro-hotkey-grid">
          {renderHotkeyCapture('clicker', 'Clicker Toggle Hotkey', clickerHotkeyInput, 'F6')}
          {renderHotkeyCapture('record', 'Record Hotkey', recordHotkeyInput, 'F7')}
          {renderHotkeyCapture('playback', 'Playback Hotkey', playbackHotkeyInput, 'F8')}
        </div>

        <div className="macro-hotkey-hint">
          Click one field, press the key or key combo you want, then click Apply Hotkeys.
        </div>

        <div className="macro-hotkey-actions">
          <button className="preset-btn" onClick={onApplyHotkeys}>
            Apply Hotkeys
          </button>
          <div className="macro-hotkey-active">
            Active: CLICKER {clickerHotkey} | REC {recordHotkey} | PLAY {playbackHotkey}
          </div>
        </div>

        {macroError && <div className="macro-error">{macroError}</div>}
      </div>
    </div>
  );
}
