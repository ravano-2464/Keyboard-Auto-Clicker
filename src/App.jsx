import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import './App.css';
import TitleBar from './components/TitleBar';
import StatusOrb from './components/StatusOrb';
import KeySelector from './components/KeySelector';
import IntervalSettings from './components/IntervalSettings';
import RepeatMode from './components/RepeatMode';
import StatsBar from './components/StatsBar';

function simulateKeyInBrowser(key) {
  let eventKey = key;
  let eventCode = '';

  if (key === 'Space' || key === ' ') {
    eventKey = ' ';
    eventCode = 'Space';
  } else if (key === 'Enter') {
    eventKey = 'Enter';
    eventCode = 'Enter';
  } else if (key === 'Tab') {
    eventKey = 'Tab';
    eventCode = 'Tab';
  } else if (key === 'Escape') {
    eventKey = 'Escape';
    eventCode = 'Escape';
  } else if (key === 'Backspace') {
    eventKey = 'Backspace';
    eventCode = 'Backspace';
  } else if (key.length === 1) {
    eventKey = key.toLowerCase();
    eventCode = `Key${key.toUpperCase()}`;
  } else {
    eventCode = key;
  }

  const target = document.activeElement || document.body;

  target.dispatchEvent(new KeyboardEvent('keydown', {
    key: eventKey,
    code: eventCode,
    bubbles: true,
    cancelable: true,
  }));

  target.dispatchEvent(new KeyboardEvent('keyup', {
    key: eventKey,
    code: eventCode,
    bubbles: true,
    cancelable: true,
  }));
}

function App() {
  const [selectedKey, setSelectedKey] = useState('Space');
  const [interval, setInterval_] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [repeatMode, setRepeatMode] = useState('infinite');
  const [repeatCount, setRepeatCount] = useState(100);
  const [clickCount, setClickCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const clickCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const localIntervalRef = useRef(null);

  const repeatModeRef = useRef(repeatMode);
  const repeatCountRef = useRef(repeatCount);
  const selectedKeyRef = useRef(selectedKey);

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

  useEffect(() => {
    if (window.electronAPI?.updateSettings) {
      window.electronAPI.updateSettings(selectedKey, interval);
    }
  }, [selectedKey, interval]);

  useEffect(() => {
    if (window.electronAPI) return;
    const handleKeyDown = (e) => {
      if (e.key === 'F6') {
        e.preventDefault();
        toggleClicker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleClicker]);


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
        } else {
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
