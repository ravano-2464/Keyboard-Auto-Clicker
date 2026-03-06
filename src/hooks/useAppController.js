import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  THEME_STORAGE_KEY,
  DEFAULT_CLICKER_HOTKEY,
  DEFAULT_RECORD_HOTKEY,
  DEFAULT_PLAYBACK_HOTKEY,
  SPEED_PRESETS,
  getInitialTheme,
  normalizeRecordedKey,
  normalizeHotkeyInput,
  getHotkeyMainKey,
  eventsToSteps,
  stepsToEvents,
  formatMacroDuration,
  simulateKeyInBrowser,
} from './appHelpers';

export function useAppController() {
  const [selectedKey, setSelectedKey] = useState('Space');
  const [interval, setInterval_] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [repeatMode, setRepeatMode] = useState('infinite');
  const [repeatCount, setRepeatCount] = useState(100);
  const [clickCount, setClickCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [theme, setTheme] = useState(getInitialTheme);

  const [isMacroRecording, setIsMacroRecording] = useState(false);
  const [macroEvents, setMacroEvents] = useState([]);
  const [macroError, setMacroError] = useState('');
  const [macroRecordingElapsed, setMacroRecordingElapsed] = useState(0);
  const [isMacroPlaying, setIsMacroPlaying] = useState(false);
  const [continuousPlayback, setContinuousPlayback] = useState(false);
  const [macroSteps, setMacroSteps] = useState([]);
  const [playbackSource, setPlaybackSource] = useState('recorded');
  const [selectedSpeedPreset, setSelectedSpeedPreset] = useState(1);
  const [useCustomSpeed, setUseCustomSpeed] = useState(false);
  const [customSpeed, setCustomSpeed] = useState('1');
  const [clickerHotkey, setClickerHotkey] = useState(DEFAULT_CLICKER_HOTKEY);
  const [recordHotkey, setRecordHotkey] = useState(DEFAULT_RECORD_HOTKEY);
  const [playbackHotkey, setPlaybackHotkey] = useState(DEFAULT_PLAYBACK_HOTKEY);
  const [clickerHotkeyInput, setClickerHotkeyInput] = useState(DEFAULT_CLICKER_HOTKEY);
  const [recordHotkeyInput, setRecordHotkeyInput] = useState(DEFAULT_RECORD_HOTKEY);
  const [playbackHotkeyInput, setPlaybackHotkeyInput] = useState(DEFAULT_PLAYBACK_HOTKEY);

  const clickCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const localIntervalRef = useRef(null);
  const repeatModeRef = useRef(repeatMode);
  const repeatCountRef = useRef(repeatCount);
  const selectedKeyRef = useRef(selectedKey);

  const macroEventsRef = useRef([]);
  const macroStartTimeRef = useRef(0);
  const macroRecordingTimerRef = useRef(null);
  const isMacroRecordingRef = useRef(false);

  const playbackSpeed = useMemo(() => {
    if (!useCustomSpeed) return selectedSpeedPreset;
    const value = Number(customSpeed);
    if (!Number.isFinite(value) || value <= 0) return 1;
    return value;
  }, [useCustomSpeed, customSpeed, selectedSpeedPreset]);

  const manualMacroEvents = useMemo(() => stepsToEvents(macroSteps), [macroSteps]);
  const activeMacroEvents = useMemo(
    () => (playbackSource === 'manual' ? manualMacroEvents : macroEvents),
    [playbackSource, manualMacroEvents, macroEvents]
  );
  const activeMacroDuration = useMemo(
    () => activeMacroEvents[activeMacroEvents.length - 1]?.time || 0,
    [activeMacroEvents]
  );

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    repeatCountRef.current = repeatCount;
  }, [repeatCount]);

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  useEffect(() => {
    macroEventsRef.current = macroEvents;
  }, [macroEvents]);

  useEffect(() => {
    isMacroRecordingRef.current = isMacroRecording;
  }, [isMacroRecording]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isMacroRecording) {
      if (macroRecordingTimerRef.current) {
        clearInterval(macroRecordingTimerRef.current);
        macroRecordingTimerRef.current = null;
      }
      return;
    }

    macroRecordingTimerRef.current = window.setInterval(() => {
      const elapsed = Math.max(0, Math.round(performance.now() - macroStartTimeRef.current));
      setMacroRecordingElapsed(elapsed);
    }, 50);

    return () => {
      if (macroRecordingTimerRef.current) {
        clearInterval(macroRecordingTimerRef.current);
        macroRecordingTimerRef.current = null;
      }
    };
  }, [isMacroRecording]);

  const applySpeedFromValue = useCallback((value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return;

    if (SPEED_PRESETS.includes(numeric)) {
      setUseCustomSpeed(false);
      setSelectedSpeedPreset(numeric);
      setCustomSpeed(String(numeric));
    } else {
      setUseCustomSpeed(true);
      setCustomSpeed(String(numeric));
    }
  }, []);

  const pushMacroToMain = useCallback(async (events) => {
    if (!window.electronAPI?.saveMacroRecording) return;
    await window.electronAPI.saveMacroRecording(events);
  }, []);

  const syncMacroFromSteps = useCallback(
    (nextSteps, persist = true) => {
      setMacroSteps(nextSteps);
      setPlaybackSource('manual');
      const events = stepsToEvents(nextSteps);
      if (persist) {
        pushMacroToMain(events).catch((error) => {
          console.error('[Macro] Failed to save manual steps:', error);
        });
      }
    },
    [pushMacroToMain]
  );

  const stopClicker = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.stopClicker();
    }
    setIsRunning(false);

    if (localIntervalRef.current) {
      clearInterval(localIntervalRef.current);
      localIntervalRef.current = null;
    }
  }, []);

  const startClicker = useCallback(async () => {
    if (!selectedKey) return;

    setClickCount(0);
    clickCountRef.current = 0;
    setElapsedTime(0);

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.startClicker(selectedKey, interval);
        if (!result?.success) {
          setIsRunning(false);
          console.error('[Clicker] Failed to start:', result?.error || 'Unknown error');
          return;
        }
        setIsRunning(Boolean(result.running));
      } catch (error) {
        setIsRunning(false);
        console.error('[Clicker] Failed to start:', error);
      }
    } else {
      setIsRunning(true);
      localIntervalRef.current = window.setInterval(() => {
        simulateKeyInBrowser(selectedKeyRef.current);
        clickCountRef.current += 1;
        setClickCount(clickCountRef.current);

        if (repeatModeRef.current === 'count' && clickCountRef.current >= repeatCountRef.current) {
          stopClicker();
        }
      }, interval);
    }
  }, [selectedKey, interval, stopClicker]);

  const toggleClicker = useCallback(() => {
    if (isRunning) {
      stopClicker();
    } else {
      startClicker();
    }
  }, [isRunning, startClicker, stopClicker]);

  const startMacroRecording = useCallback(async () => {
    setMacroError('');
    if (window.electronAPI?.stopMacroPlayback) {
      await window.electronAPI.stopMacroPlayback();
    }
    setIsMacroPlaying(false);
    setMacroEvents([]);
    macroEventsRef.current = [];
    setMacroRecordingElapsed(0);
    setPlaybackSource('recorded');
    macroStartTimeRef.current = performance.now();
    setIsMacroRecording(true);
  }, []);

  const stopMacroRecording = useCallback(async () => {
    setIsMacroRecording(false);
    const finalEvents = macroEventsRef.current;
    const lastTime = finalEvents[finalEvents.length - 1]?.time || 0;
    setMacroRecordingElapsed(lastTime);
    setPlaybackSource('recorded');
    await pushMacroToMain(finalEvents);
  }, [pushMacroToMain]);

  const toggleMacroRecording = useCallback(() => {
    if (isMacroRecordingRef.current) {
      stopMacroRecording();
    } else {
      startMacroRecording();
    }
  }, [startMacroRecording, stopMacroRecording]);

  const clearMacroRecording = useCallback(async () => {
    if (window.electronAPI?.stopMacroPlayback) {
      await window.electronAPI.stopMacroPlayback();
    }
    setIsMacroRecording(false);
    setIsMacroPlaying(false);
    setMacroEvents([]);
    setMacroSteps([]);
    macroEventsRef.current = [];
    setMacroRecordingElapsed(0);
    setMacroError('');
    setPlaybackSource('recorded');
    setContinuousPlayback(false);
    setUseCustomSpeed(false);
    setSelectedSpeedPreset(1);
    setCustomSpeed('1');
    await pushMacroToMain([]);
  }, [pushMacroToMain]);

  const startMacroPlayback = useCallback(async () => {
    if (!window.electronAPI?.startMacroPlayback) return;
    const eventsForPlayback =
      playbackSource === 'manual' ? manualMacroEvents : macroEventsRef.current;
    if (eventsForPlayback.length === 0) {
      setMacroError('No macro data in selected source');
      return;
    }
    const result = await window.electronAPI.startMacroPlayback({
      events: eventsForPlayback,
      speed: playbackSpeed,
      continuous: continuousPlayback,
    });
    if (!result?.success) {
      setMacroError(result?.error || 'Failed to start playback');
      return;
    }
    setMacroError('');
    setIsMacroPlaying(Boolean(result.playing));
  }, [playbackSpeed, continuousPlayback, playbackSource, manualMacroEvents]);

  const stopMacroPlayback = useCallback(async () => {
    if (!window.electronAPI?.stopMacroPlayback) return;
    await window.electronAPI.stopMacroPlayback();
    setIsMacroPlaying(false);
  }, []);

  const toggleMacroPlayback = useCallback(() => {
    if (isMacroPlaying) {
      stopMacroPlayback();
    } else {
      startMacroPlayback();
    }
  }, [isMacroPlaying, startMacroPlayback, stopMacroPlayback]);

  const addMacroStep = useCallback(() => {
    const nextSteps = [...macroSteps, { key: 'A', delay: 100 }];
    syncMacroFromSteps(nextSteps, true);
  }, [macroSteps, syncMacroFromSteps]);

  const updateMacroStep = useCallback(
    (index, patch) => {
      const nextSteps = macroSteps.map((step, currentIndex) =>
        currentIndex === index ? { ...step, ...patch } : step
      );
      syncMacroFromSteps(nextSteps, true);
    },
    [macroSteps, syncMacroFromSteps]
  );

  const removeMacroStep = useCallback(
    (index) => {
      const nextSteps = macroSteps.filter((_, currentIndex) => currentIndex !== index);
      syncMacroFromSteps(nextSteps, true);
    },
    [macroSteps, syncMacroFromSteps]
  );

  const saveManualMacro = useCallback(async () => {
    setMacroError('');
    const events = stepsToEvents(macroSteps);
    if (events.length === 0) {
      setMacroError('Manual macro is empty');
      return;
    }
    setPlaybackSource('manual');
    await pushMacroToMain(events);
  }, [macroSteps, pushMacroToMain]);

  const applyMacroHotkeys = useCallback(async () => {
    if (!window.electronAPI?.updateMacroSettings) return;
    const nextClickerHotkey = normalizeHotkeyInput(clickerHotkeyInput || DEFAULT_CLICKER_HOTKEY);
    const nextRecordHotkey = normalizeHotkeyInput(recordHotkeyInput || DEFAULT_RECORD_HOTKEY);
    const nextPlaybackHotkey = normalizeHotkeyInput(playbackHotkeyInput || DEFAULT_PLAYBACK_HOTKEY);
    const result = await window.electronAPI.updateMacroSettings({
      clickerHotkey: nextClickerHotkey,
      recordHotkey: nextRecordHotkey,
      playbackHotkey: nextPlaybackHotkey,
    });

    if (!result?.success) {
      setMacroError(result?.error || 'Failed to update hotkeys');
      return;
    }

    setMacroError('');
    setClickerHotkey(result.settings.clickerHotkey);
    setClickerHotkeyInput(result.settings.clickerHotkey);
    setRecordHotkey(result.settings.recordHotkey);
    setPlaybackHotkey(result.settings.playbackHotkey);
    setRecordHotkeyInput(result.settings.recordHotkey);
    setPlaybackHotkeyInput(result.settings.playbackHotkey);
  }, [clickerHotkeyInput, recordHotkeyInput, playbackHotkeyInput]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const onSelectSpeedPreset = useCallback((speed) => {
    setUseCustomSpeed(false);
    setSelectedSpeedPreset(speed);
    setCustomSpeed(String(speed));
  }, []);

  const onClickerHotkeyInputChange = useCallback((value) => {
    setClickerHotkeyInput(normalizeHotkeyInput(value));
  }, []);

  const onRecordHotkeyInputChange = useCallback((value) => {
    setRecordHotkeyInput(normalizeHotkeyInput(value));
  }, []);

  const onPlaybackHotkeyInputChange = useCallback((value) => {
    setPlaybackHotkeyInput(normalizeHotkeyInput(value));
  }, []);

  useEffect(() => {
    if (!isMacroRecording) return;

    const clickerHotkeyMain = getHotkeyMainKey(clickerHotkey);
    const recordHotkeyMain = getHotkeyMainKey(recordHotkey);
    const playbackHotkeyMain = getHotkeyMainKey(playbackHotkey);

    const handleMacroRecord = (event) => {
      if (event.repeat) return;

      const currentKey = event.key.toLowerCase();
      if (
        currentKey === clickerHotkeyMain ||
        currentKey === recordHotkeyMain ||
        currentKey === playbackHotkeyMain
      ) {
        return;
      }

      const normalizedKey = normalizeRecordedKey(event.key);
      if (!normalizedKey) return;

      const elapsed = Math.max(0, Math.round(performance.now() - macroStartTimeRef.current));
      const nextEvents = [...macroEventsRef.current, { key: normalizedKey, time: elapsed }];
      macroEventsRef.current = nextEvents;
      setMacroEvents(nextEvents);
      setMacroRecordingElapsed(elapsed);
    };

    window.addEventListener('keydown', handleMacroRecord, true);
    return () => window.removeEventListener('keydown', handleMacroRecord, true);
  }, [isMacroRecording, clickerHotkey, recordHotkey, playbackHotkey]);

  useEffect(() => {
    if (window.electronAPI?.updateSettings) {
      window.electronAPI.updateSettings(selectedKey, interval);
    }
  }, [selectedKey, interval]);

  useEffect(() => {
    if (window.electronAPI?.updateMacroSettings) {
      window.electronAPI.updateMacroSettings({
        speed: playbackSpeed,
        continuous: continuousPlayback,
      });
    }
  }, [playbackSpeed, continuousPlayback]);

  useEffect(() => {
    if (!window.electronAPI?.getMacroStatus) return;
    let unmounted = false;

    const initMacroState = async () => {
      try {
        const [statusResult, recordingResult] = await Promise.all([
          window.electronAPI.getMacroStatus(),
          window.electronAPI.getMacroRecording?.(),
        ]);
        if (unmounted) return;

        if (statusResult) {
          setIsMacroPlaying(Boolean(statusResult.playing));
          setContinuousPlayback(Boolean(statusResult.continuous));
          setClickerHotkey(statusResult.clickerHotkey || DEFAULT_CLICKER_HOTKEY);
          setClickerHotkeyInput(statusResult.clickerHotkey || DEFAULT_CLICKER_HOTKEY);
          setRecordHotkey(statusResult.recordHotkey || DEFAULT_RECORD_HOTKEY);
          setPlaybackHotkey(statusResult.playbackHotkey || DEFAULT_PLAYBACK_HOTKEY);
          setRecordHotkeyInput(statusResult.recordHotkey || DEFAULT_RECORD_HOTKEY);
          setPlaybackHotkeyInput(statusResult.playbackHotkey || DEFAULT_PLAYBACK_HOTKEY);
          applySpeedFromValue(statusResult.speed || 1);
        }

        if (recordingResult?.success && Array.isArray(recordingResult.events)) {
          setMacroEvents(recordingResult.events);
          macroEventsRef.current = recordingResult.events;
          setMacroSteps(eventsToSteps(recordingResult.events));
          const lastTime = recordingResult.events[recordingResult.events.length - 1]?.time || 0;
          setMacroRecordingElapsed(lastTime);
          setPlaybackSource('recorded');
        }
      } catch (error) {
        if (!unmounted) {
          console.error('[Macro] Failed to initialize state:', error);
        }
      }
    };

    initMacroState();

    const cleanupPlaybackStatus = window.electronAPI.onMacroPlaybackStatus((status) => {
      setIsMacroPlaying(Boolean(status?.playing));
      if (typeof status?.speed === 'number') {
        applySpeedFromValue(status.speed);
      }
      if (typeof status?.continuous === 'boolean') {
        setContinuousPlayback(status.continuous);
      }
      if (status?.clickerHotkey) {
        setClickerHotkey(status.clickerHotkey);
        setClickerHotkeyInput(status.clickerHotkey);
      }
      if (status?.recordHotkey) {
        setRecordHotkey(status.recordHotkey);
        setRecordHotkeyInput(status.recordHotkey);
      }
      if (status?.playbackHotkey) {
        setPlaybackHotkey(status.playbackHotkey);
        setPlaybackHotkeyInput(status.playbackHotkey);
      }
    });

    const cleanupMacroError = window.electronAPI.onMacroError((error) => {
      setMacroError(error?.message || 'Macro error occurred');
    });

    const cleanupRecordToggle = window.electronAPI.onMacroHotkeyRecordToggle(() => {
      if (isMacroRecordingRef.current) {
        stopMacroRecording();
      } else {
        startMacroRecording();
      }
    });

    return () => {
      unmounted = true;
      cleanupPlaybackStatus?.();
      cleanupMacroError?.();
      cleanupRecordToggle?.();
    };
  }, [applySpeedFromValue, startMacroRecording, stopMacroRecording]);

  useEffect(() => {
    if (window.electronAPI) return;
    const clickerHotkeyMain = getHotkeyMainKey(clickerHotkey);
    const handleKeyDown = (event) => {
      if (event.key.toLowerCase() === clickerHotkeyMain) {
        event.preventDefault();
        toggleClicker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleClicker, clickerHotkey]);

  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onClickerTick(() => {
        clickCountRef.current += 1;
        setClickCount(clickCountRef.current);

        if (repeatModeRef.current === 'count' && clickCountRef.current >= repeatCountRef.current) {
          stopClicker();
        }
      });
      return cleanup;
    }
  }, [stopClicker]);

  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onClickerStatus((data) => {
        setIsRunning(data.running);
        if (data.running) {
          setClickCount(0);
          clickCountRef.current = 0;
          setElapsedTime(0);
        } else if (localIntervalRef.current) {
          clearInterval(localIntervalRef.current);
          localIntervalRef.current = null;
        }
      });
      return cleanup;
    }
  }, []);

  const canStartMacroPlayback = activeMacroEvents.length > 0 || isMacroPlaying;
  const recordingLabel = isMacroRecording ? 'Stop Recording' : 'Start Recording';
  const playbackLabel = isMacroPlaying ? 'Stop Playback' : 'Start Playback';

  return {
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
    recordedEventsCount: macroEvents.length,
    manualSteps: macroSteps,
    activeStepsCount: activeMacroEvents.length,
    activeDurationLabel: formatMacroDuration(activeMacroDuration),
    recordingDurationLabel: formatMacroDuration(macroRecordingElapsed),
    addMacroStep,
    saveManualMacro,
    updateMacroStep,
    removeMacroStep,
    normalizeRecordedKey,
    speedPresets: SPEED_PRESETS,
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
    onClickerHotkeyInputChange,
    onRecordHotkeyInputChange,
    onPlaybackHotkeyInputChange,
    applyMacroHotkeys,
    clickerHotkey,
    recordHotkey,
    playbackHotkey,
    macroError,
  };
}
