export const THEME_STORAGE_KEY = 'kac-theme';
export const DEFAULT_CLICKER_HOTKEY = 'F6';
export const DEFAULT_RECORD_HOTKEY = 'F7';
export const DEFAULT_PLAYBACK_HOTKEY = 'F8';
export const SPEED_PRESETS = [0.5, 1, 2, 100];
const HOTKEY_MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Super'];
const HOTKEY_MODIFIER_MAP = {
  ctrl: 'Ctrl',
  control: 'Ctrl',
  alt: 'Alt',
  option: 'Alt',
  shift: 'Shift',
  meta: 'Super',
  command: 'Super',
  cmd: 'Super',
  super: 'Super',
  win: 'Super',
  windows: 'Super',
  os: 'Super',
};
const HOTKEY_KEY_MAP = {
  ' ': 'Space',
  space: 'Space',
  spacebar: 'Space',
  esc: 'Escape',
  escape: 'Escape',
  return: 'Enter',
  enter: 'Enter',
  tab: 'Tab',
  backspace: 'Backspace',
  del: 'Delete',
  delete: 'Delete',
  ins: 'Insert',
  insert: 'Insert',
  home: 'Home',
  end: 'End',
  pgup: 'PageUp',
  pageup: 'PageUp',
  pgdn: 'PageDown',
  pagedown: 'PageDown',
  arrowup: 'Up',
  up: 'Up',
  arrowdown: 'Down',
  down: 'Down',
  arrowleft: 'Left',
  left: 'Left',
  arrowright: 'Right',
  right: 'Right',
};
const HOTKEY_EVENT_CODE_MAP = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  NumpadEnter: 'Enter',
};
const HOTKEY_MODIFIER_KEYS = new Set(['Ctrl', 'Alt', 'Shift', 'Super']);

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
  if (typeof rawValue !== 'string') return '';
  const parts = rawValue
    .split('+')
    .map((part) => part.trim())
    .map(normalizeHotkeyToken)
    .filter(Boolean);

  const modifiers = new Set();
  let mainKey = '';

  parts.forEach((part) => {
    if (HOTKEY_MODIFIER_KEYS.has(part)) {
      modifiers.add(part);
      return;
    }
    mainKey = part;
  });

  const orderedModifiers = HOTKEY_MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));
  return [...orderedModifiers, mainKey].filter(Boolean).join('+');
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

export function getHotkeyFromKeyboardEvent(event) {
  if (!event) return '';

  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Super');

  const mainKey = normalizeHotkeyEventKey(event);
  if (!mainKey || HOTKEY_MODIFIER_KEYS.has(mainKey)) return '';

  return normalizeHotkeyInput([...modifiers, mainKey].join('+'));
}

export function hotkeyMatchesKeyboardEvent(hotkey, event) {
  const normalizedHotkey = normalizeHotkeyInput(hotkey);
  const eventHotkey = getHotkeyFromKeyboardEvent(event);
  return Boolean(normalizedHotkey) && normalizedHotkey === eventHotkey;
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

function normalizeHotkeyToken(token) {
  if (!token) return '';
  const trimmed = token.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (HOTKEY_MODIFIER_MAP[lower]) return HOTKEY_MODIFIER_MAP[lower];
  if (HOTKEY_KEY_MAP[lower]) return HOTKEY_KEY_MAP[lower];
  if (/^f\d{1,2}$/i.test(trimmed)) return trimmed.toUpperCase();
  if (trimmed.length === 1) return trimmed.toUpperCase();

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function normalizeHotkeyEventKey(event) {
  if (!event) return '';

  if (typeof event.code === 'string' && HOTKEY_EVENT_CODE_MAP[event.code]) {
    return HOTKEY_EVENT_CODE_MAP[event.code];
  }

  if (typeof event.code === 'string' && /^Key[A-Z]$/.test(event.code)) {
    return event.code.slice(3);
  }

  if (typeof event.code === 'string' && /^Digit\d$/.test(event.code)) {
    return event.code.slice(5);
  }

  const rawKey = typeof event.key === 'string' ? event.key : '';
  return normalizeHotkeyToken(rawKey);
}
