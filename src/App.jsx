import { Play, Square } from 'lucide-react';
import './components/styles/colors.css';
import './components/styles/typography.css';
import './App.css';
import TitleBar from './components/TitleBar';
import StatusOrb from './components/StatusOrb';
import KeySelector from './components/KeySelector';
import IntervalSettings from './components/IntervalSettings';
import RepeatMode from './components/RepeatMode';
import KeyboardRecorder from './components/KeyboardRecorder';
import StatsBar from './components/StatsBar';
import { useAppController } from './hooks/useAppController';

function App() {
  const {
    theme,
    toggleTheme,
    isRunning,
    toggleClicker,
    selectedKey,
    setSelectedKey,
    interval,
    setInterval_,
    repeatMode,
    setRepeatMode,
    repeatCount,
    setRepeatCount,
    clickCount,
    elapsedTime,
    isMacroRecording,
    isMacroPlaying,
    recordingLabel,
    playbackLabel,
    canStartMacroPlayback,
    toggleMacroRecording,
    clearMacroRecording,
    toggleMacroPlayback,
    playbackSource,
    setPlaybackSource,
    recordedEventsCount,
    manualSteps,
    activeStepsCount,
    activeDurationLabel,
    recordingDurationLabel,
    addMacroStep,
    saveManualMacro,
    updateMacroStep,
    removeMacroStep,
    normalizeRecordedKey,
    speedPresets,
    useCustomSpeed,
    selectedSpeedPreset,
    onSelectSpeedPreset,
    setUseCustomSpeed,
    customSpeed,
    setCustomSpeed,
    continuousPlayback,
    setContinuousPlayback,
    clickerHotkeyInput,
    recordHotkeyInput,
    playbackHotkeyInput,
    hotkeyCaptureTarget,
    beginHotkeyCapture,
    cancelHotkeyCapture,
    manualStepCaptureIndex,
    beginManualStepCapture,
    cancelManualStepCapture,
    applyMacroHotkeys,
    clickerHotkey,
    recordHotkey,
    playbackHotkey,
    macroError,
  } = useAppController();

  return (
    <div className="app-container">
      <TitleBar theme={theme} onToggleTheme={toggleTheme} />

      <div className="main-content">
        <StatusOrb isRunning={isRunning} />

        <KeySelector selectedKey={selectedKey} onKeyChange={setSelectedKey} disabled={isRunning} />

        <IntervalSettings
          interval={interval}
          onIntervalChange={setInterval_}
          disabled={isRunning}
        />

        <RepeatMode
          mode={repeatMode}
          onModeChange={setRepeatMode}
          repeatCount={repeatCount}
          onRepeatCountChange={setRepeatCount}
          disabled={isRunning}
        />

        <KeyboardRecorder
          isMacroRecording={isMacroRecording}
          isMacroPlaying={isMacroPlaying}
          recordingLabel={recordingLabel}
          playbackLabel={playbackLabel}
          canStartPlayback={canStartMacroPlayback}
          onToggleRecording={toggleMacroRecording}
          onClearRecording={clearMacroRecording}
          onTogglePlayback={toggleMacroPlayback}
          playbackSource={playbackSource}
          onPlaybackSourceChange={setPlaybackSource}
          recordedEventsCount={recordedEventsCount}
          manualSteps={manualSteps}
          activeStepsCount={activeStepsCount}
          activeDurationLabel={activeDurationLabel}
          recordingDurationLabel={recordingDurationLabel}
          onAddManualStep={addMacroStep}
          onSaveManualMacro={saveManualMacro}
          onUpdateManualStep={updateMacroStep}
          onRemoveManualStep={removeMacroStep}
          normalizeRecordedKey={normalizeRecordedKey}
          speedPresets={speedPresets}
          useCustomSpeed={useCustomSpeed}
          selectedSpeedPreset={selectedSpeedPreset}
          onSelectSpeedPreset={onSelectSpeedPreset}
          onToggleUseCustomSpeed={setUseCustomSpeed}
          customSpeed={customSpeed}
          onCustomSpeedChange={setCustomSpeed}
          continuousPlayback={continuousPlayback}
          onContinuousPlaybackChange={setContinuousPlayback}
          clickerHotkeyInput={clickerHotkeyInput}
          recordHotkeyInput={recordHotkeyInput}
          playbackHotkeyInput={playbackHotkeyInput}
          hotkeyCaptureTarget={hotkeyCaptureTarget}
          onBeginHotkeyCapture={beginHotkeyCapture}
          onCancelHotkeyCapture={cancelHotkeyCapture}
          manualStepCaptureIndex={manualStepCaptureIndex}
          onBeginManualStepCapture={beginManualStepCapture}
          onCancelManualStepCapture={cancelManualStepCapture}
          onApplyHotkeys={applyMacroHotkeys}
          clickerHotkey={clickerHotkey}
          recordHotkey={recordHotkey}
          playbackHotkey={playbackHotkey}
          macroError={macroError}
        />

        <div className="action-section">
          <button className={`action-btn ${isRunning ? 'stop' : 'start'}`} onClick={toggleClicker}>
            {isRunning ? (
              <>
                <Square size={18} />
                STOP AUTO CLICKER
              </>
            ) : (
              <>
                <Play size={18} />
                START AUTO CLICKER
              </>
            )}
          </button>
        </div>
      </div>

      <StatsBar clickCount={clickCount} elapsedTime={elapsedTime} selectedKey={selectedKey} />
    </div>
  );
}

export default App;
