import { useEffect, useState } from 'react';
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
import MobileBridgePanel from './components/MobileBridgePanel';
import { useAppController } from './hooks/useAppController';
import { getTranslations, translateRuntimeMessage } from './i18n';

function App() {
  const [windowState, setWindowState] = useState({
    isMaximized: false,
    isFullScreen: false,
  });

  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
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

  const copy = getTranslations(language);
  const recordingLabel = isMacroRecording
    ? copy.keyboardRecorder.buttons.stopRecording
    : copy.keyboardRecorder.buttons.startRecording;
  const playbackLabel = isMacroPlaying
    ? copy.keyboardRecorder.buttons.stopPlayback
    : copy.keyboardRecorder.buttons.startPlayback;
  const translatedMacroError = translateRuntimeMessage(language, macroError);

  useEffect(() => {
    if (!window.electronAPI?.getWindowState) return;

    let isMounted = true;

    window.electronAPI
      .getWindowState()
      .then((state) => {
        if (!isMounted) return;
        setWindowState({
          isMaximized: Boolean(state?.isMaximized),
          isFullScreen: Boolean(state?.isFullScreen),
        });
      })
      .catch(() => {});

    const cleanup = window.electronAPI.onWindowStateChange?.((state) => {
      setWindowState({
        isMaximized: Boolean(state?.isMaximized),
        isFullScreen: Boolean(state?.isFullScreen),
      });
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, []);

  const isWindowFullBleed = windowState.isMaximized || windowState.isFullScreen;

  return (
    <div className={`app-container ${isWindowFullBleed ? 'window-full-bleed' : ''}`}>
      <TitleBar
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onLanguageChange={setLanguage}
        copy={copy.titleBar}
      />

      <div className="main-content">
        <StatusOrb
          isRunning={isRunning}
          isMacroRecording={isMacroRecording}
          isMacroPlaying={isMacroPlaying}
          playbackSource={playbackSource}
          selectedKey={selectedKey}
          interval={interval}
          activeStepsCount={activeStepsCount}
          activeDurationLabel={activeDurationLabel}
          recordingDurationLabel={recordingDurationLabel}
          clickerHotkey={clickerHotkey}
          recordHotkey={recordHotkey}
          playbackHotkey={playbackHotkey}
          language={language}
          copy={copy.statusOrb}
        />
        <KeySelector
          selectedKey={selectedKey}
          onKeyChange={setSelectedKey}
          disabled={isRunning}
          language={language}
          copy={copy.keySelector}
        />

        <IntervalSettings
          interval={interval}
          onIntervalChange={setInterval_}
          disabled={isRunning}
          copy={copy.intervalSettings}
        />

        <RepeatMode
          mode={repeatMode}
          onModeChange={setRepeatMode}
          repeatCount={repeatCount}
          onRepeatCountChange={setRepeatCount}
          disabled={isRunning}
          copy={copy.repeatMode}
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
          macroError={translatedMacroError}
          copy={copy.keyboardRecorder}
        />

        <MobileBridgePanel language={language} />

        <div className="action-section">
          <button className={`action-btn ${isRunning ? 'stop' : 'start'}`} onClick={toggleClicker}>
            {isRunning ? (
              <>
                <Square size={18} />
                {copy.actions.stop}
              </>
            ) : (
              <>
                <Play size={18} />
                {copy.actions.start}
              </>
            )}
          </button>
        </div>
      </div>

      <StatsBar
        clickCount={clickCount}
        elapsedTime={elapsedTime}
        selectedKey={selectedKey}
        copy={copy.statsBar}
      />
    </div>
  );
}

export default App;
