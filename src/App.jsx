import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import './App.css';
import TitleBar from './components/TitleBar';
import StatusOrb from './components/StatusOrb';
import KeySelector from './components/KeySelector';
import IntervalSettings from './components/IntervalSettings';
import RepeatMode from './components/RepeatMode';
import StatsBar from './components/StatsBar';

function App() {
  const [selectedKey, setSelectedKey] = useState('Space');
  const [interval, setInterval_] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [repeatMode, setRepeatMode] = useState('infinite'); // 'infinite' | 'count'
  const [repeatCount, setRepeatCount] = useState(100);
  const [clickCount, setClickCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const clickCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const localIntervalRef = useRef(null);

  // Refs for values used in interval callbacks
  const repeatModeRef = useRef(repeatMode);
  const repeatCountRef = useRef(repeatCount);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    repeatCountRef.current = repeatCount;
  }, [repeatCount]);

  // Update elapsed time while running
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

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
      // Use Electron IPC
      await window.electronAPI.startClicker(selectedKey, interval);
      setIsRunning(true);

      // Track click count locally
      localIntervalRef.current = window.setInterval(() => {
        clickCountRef.current += 1;
        setClickCount(clickCountRef.current);

        if (repeatModeRef.current === 'count' && clickCountRef.current >= repeatCountRef.current) {
          stopClicker();
        }
      }, interval);
    } else {
      // Fallback for browser dev mode (simulate)
      setIsRunning(true);
      localIntervalRef.current = window.setInterval(() => {
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

  // Listen for F6 hotkey from Electron
  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onToggleFromHotkey(() => {
        toggleClicker();
      });
      return cleanup;
    }
  }, [toggleClicker]);

  // Listen for status updates from Electron
  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onClickerStatus((data) => {
        setIsRunning(data.running);
        if (!data.running) {
          if (localIntervalRef.current) {
            clearInterval(localIntervalRef.current);
            localIntervalRef.current = null;
          }
        }
      });
      return cleanup;
    }
  }, []);

  return (
    <div className="app-container">
      <TitleBar />

      <div className="main-content">
        <StatusOrb isRunning={isRunning} />

        <KeySelector
          selectedKey={selectedKey}
          onKeyChange={setSelectedKey}
          disabled={isRunning}
        />

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

        <div className="action-section">
          <button
            className={`action-btn ${isRunning ? 'stop' : 'start'}`}
            onClick={toggleClicker}
          >
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

      <StatsBar
        clickCount={clickCount}
        elapsedTime={elapsedTime}
        selectedKey={selectedKey}
      />
    </div>
  );
}

export default App;
