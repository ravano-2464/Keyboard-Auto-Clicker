export const THEME_STORAGE_KEY = 'kac-theme';
export const DEFAULT_CLICKER_HOTKEY = 'F6';
export const DEFAULT_RECORD_HOTKEY = 'F7';
export const DEFAULT_PLAYBACK_HOTKEY = 'F8';
export const SPEED_PRESETS = [0.5, 1, 2, 100];

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function normalizeRecordedKey(rawKey) {
  if (!rawKey) return '';
  if (rawKey === ' ') return 'Space';
  const lower = rawKey.toLowerCase();
  const keyAliases = {
    spacebar: 'Space',
    esc: 'Escape',
    return: 'Enter',
    del: 'Delete',
  };
  if (keyAliases[lower]) return keyAliases[lower];
  if (lower.startsWith('arrow')) {
    const direction = lower.slice(5);
    return `Arrow${direction.charAt(0).toUpperCase()}${direction.slice(1)}`;
  }
  if (/^f\d{1,2}$/i.test(rawKey)) return rawKey.toUpperCase();
  if (rawKey.length === 1) return rawKey.toUpperCase();
  return rawKey;
}

export function normalizeHotkeyInput(rawValue) {
  return rawValue.replace(/\s+/g, '').toUpperCase();
}

export function getHotkeyMainKey(hotkey) {
  if (!hotkey) return '';
  const parts = hotkey
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts[parts.length - 1].toLowerCase();
}

export function eventsToSteps(events) {
  let prevTime = 0;
  return events.map((event, index) => {
    const delay = index === 0 ? event.time : event.time - prevTime;
    prevTime = event.time;
    return {
      key: event.key,
      delay: Math.max(0, Math.round(delay)),
    };
  });
}

export function stepsToEvents(steps) {
  let elapsed = 0;
  const normalized = [];
  steps.forEach((step) => {
    const key = normalizeRecordedKey((step.key || '').trim());
    if (!key) return;
    const delay = Math.max(0, Math.round(Number(step.delay) || 0));
    elapsed += delay;
    normalized.push({ key, time: elapsed });
  });
  return normalized;
}

export function formatMacroDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function simulateKeyInBrowser(key) {
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

  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: eventKey,
      code: eventCode,
      bubbles: true,
      cancelable: true,
    })
  );

  target.dispatchEvent(
    new KeyboardEvent('keyup', {
      key: eventKey,
      code: eventCode,
      bubbles: true,
      cancelable: true,
    })
  );
}
