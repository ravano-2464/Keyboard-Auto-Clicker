const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { renderRemoteControlPage } = require('./remoteControlPage.cjs');

let mainWindow;
let clickerInterval = null;
let isRunning = false;
let psProcess = null;
let psReady = false;
let psReadyResolvers = [];

let currentKey = 'Space';
let currentInterval = 100;
let clickerTickCount = 0;

const REMOTE_SERVER_DEFAULT_PORT = 39227;
const REMOTE_SERVER_PORT_SCAN_LIMIT = 25;
const EXPO_MOBILE_DEFAULT_PORT = 8083;
let remoteServer = null;
let remoteServerPort = REMOTE_SERVER_DEFAULT_PORT;
let remoteServerError = '';
const remoteAccessToken = crypto.randomBytes(24).toString('hex');

let macroRecording = [];
let isMacroPlaying = false;
let macroPlaybackSpeed = 1;
let macroContinuousPlayback = false;
let clickerHotkey = 'F6';
let recordHotkey = 'F7';
let playbackHotkey = 'F8';
const macroPlaybackTimers = new Set();
const activeHeldKeys = new Map();
const ELECTRON_HOTKEY_MODIFIER_MAP = {
  Ctrl: 'Control',
  Alt: 'Alt',
  Shift: 'Shift',
  Super: 'Super',
};
const ELECTRON_HOTKEY_KEY_MAP = {
  Space: 'Space',
  Enter: 'Enter',
  Tab: 'Tab',
  Escape: 'Esc',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Up: 'Up',
  Down: 'Down',
  Left: 'Left',
  Right: 'Right',
  CapsLock: 'Capslock',
  NumLock: 'Numlock',
  ScrollLock: 'Scrolllock',
  PrintScreen: 'PrintScreen',
};

function waitForPsReady(timeoutMs = 10000) {
  if (psReady) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const idx = psReadyResolvers.indexOf(done);
      if (idx !== -1) psReadyResolvers.splice(idx, 1);
      resolve(false);
    }, timeoutMs);
    function done(isReady) {
      clearTimeout(timer);
      resolve(Boolean(isReady));
    }
    psReadyResolvers.push(done);
  });
}

function resolvePsReadyWaiters(isReady) {
  psReadyResolvers.forEach((resolver) => resolver(isReady));
  psReadyResolvers = [];
}

function toElectronAccelerator(hotkey) {
  if (typeof hotkey !== 'string') return '';

  const parts = hotkey
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return '';

  return parts
    .map((part) => {
      if (ELECTRON_HOTKEY_MODIFIER_MAP[part]) {
        return ELECTRON_HOTKEY_MODIFIER_MAP[part];
      }
      if (ELECTRON_HOTKEY_KEY_MAP[part]) {
        return ELECTRON_HOTKEY_KEY_MAP[part];
      }
      return part;
    })
    .join('+');
}

function isPrivateLanAddress(address) {
  if (typeof address !== 'string') return false;
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;

  const match = address.match(/^172\.(\d{1,3})\./);
  if (!match) return false;
  const secondOctet = Number(match[1]);
  return Number.isFinite(secondOctet) && secondOctet >= 16 && secondOctet <= 31;
}

function getPreferredLanAddress() {
  const interfaces = os.networkInterfaces();
  let fallbackAddress = '';

  Object.values(interfaces).forEach((entries) => {
    if (!Array.isArray(entries)) return;

    entries.forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4') {
        return;
      }

      if (isPrivateLanAddress(entry.address)) {
        fallbackAddress = entry.address;
      } else if (!fallbackAddress) {
        fallbackAddress = entry.address;
      }
    });
  });

  return fallbackAddress;
}

function buildRemoteControlUrl() {
  if (!remoteServer) return '';
  const host = getPreferredLanAddress();
  if (!host) return '';
  return `http://${host}:${remoteServerPort}/remote?token=${remoteAccessToken}`;
}

function buildExpoGoUrl(host, remoteUrl) {
  if (!host) return '';
  const encodedRemoteUrl = remoteUrl ? encodeURIComponent(remoteUrl) : '';
  if (!encodedRemoteUrl) {
    return `exp://${host}:${EXPO_MOBILE_DEFAULT_PORT}`;
  }
  return `exp://${host}:${EXPO_MOBILE_DEFAULT_PORT}/--/?remoteUrl=${encodedRemoteUrl}`;
}

function getRemoteStatusPayload() {
  return {
    running: isRunning,
    key: currentKey,
    interval: currentInterval,
    clickCount: clickerTickCount,
    simulatorReady: psReady,
  };
}

function getRemoteAccessInfo() {
  const host = getPreferredLanAddress();
  const url = buildRemoteControlUrl();
  const expoUrl = buildExpoGoUrl(host, url);
  const errorMessage =
    remoteServerError || (!host ? 'No LAN IPv4 address detected. Connect to Wi-Fi/LAN first.' : '');

  return {
    enabled: Boolean(remoteServer),
    host: host || '',
    port: remoteServerPort,
    url,
    expoPort: EXPO_MOBILE_DEFAULT_PORT,
    expoUrl,
    error: errorMessage,
  };
}

function safeTokensMatch(candidate) {
  if (typeof candidate !== 'string') return false;
  const normalized = candidate.trim();
  if (normalized.length !== remoteAccessToken.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(normalized), Buffer.from(remoteAccessToken));
  } catch {
    return false;
  }
}

function isRemoteApiAuthorized(req, requestUrl) {
  const headerToken = Array.isArray(req.headers['x-kac-token'])
    ? req.headers['x-kac-token'][0]
    : req.headers['x-kac-token'];
  const queryToken = requestUrl.searchParams.get('token') || '';
  return safeTokensMatch(String(headerToken || '')) || safeTokensMatch(queryToken);
}

function normalizeRemoteKey(rawKey) {
  if (typeof rawKey !== 'string') return '';
  const key = rawKey.trim();
  if (!key) return '';
  if (key === ' ') return 'Space';
  if (key.length === 1) return key.toUpperCase();
  if (/^f\d{1,2}$/i.test(key)) return key.toUpperCase();

  const aliases = {
    space: 'Space',
    spacebar: 'Space',
    esc: 'Escape',
    del: 'Delete',
    return: 'Enter',
    pgup: 'PageUp',
    pgdn: 'PageDown',
  };

  const lower = key.toLowerCase();
  if (aliases[lower]) {
    return aliases[lower];
  }

  return key;
}

function normalizeRemoteInterval(rawInterval) {
  const parsed = Number(rawInterval);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  if (rounded < 10 || rounded > 600000) return null;
  return rounded;
}

function writeRemoteCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-KAC-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function writeJsonResponse(res, statusCode, payload) {
  writeRemoteCorsHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function writeHtmlResponse(res, statusCode, htmlContent) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(htmlContent);
}

function readRequestBody(req, maxBytes = 32768) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk.toString();
      if (raw.length > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function handleRemoteApiRequest(req, res, requestUrl) {
  if (req.method === 'OPTIONS') {
    writeRemoteCorsHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!isRemoteApiAuthorized(req, requestUrl)) {
    writeJsonResponse(res, 401, {
      success: false,
      error: 'Unauthorized request',
    });
    return;
  }

  if (requestUrl.pathname === '/api/status' && req.method === 'GET') {
    writeJsonResponse(res, 200, getRemoteStatusPayload());
    return;
  }

  if (requestUrl.pathname === '/api/update-settings' && req.method === 'POST') {
    const payload = await readRequestBody(req);
    const parsedKey = normalizeRemoteKey(
      payload.key === undefined ? currentKey : String(payload.key || '')
    );
    const parsedInterval =
      payload.interval === undefined ? currentInterval : normalizeRemoteInterval(payload.interval);

    if (!parsedKey) {
      writeJsonResponse(res, 400, {
        success: false,
        error: 'Target key is required',
      });
      return;
    }

    if (!Number.isFinite(parsedInterval)) {
      writeJsonResponse(res, 400, {
        success: false,
        error: 'Interval must be between 10 and 600000 ms',
      });
      return;
    }

    currentKey = parsedKey;
    currentInterval = parsedInterval;

    if (isRunning) {
      stopClicker();
      const restartResult = await startClicker(currentKey, currentInterval);
      if (!restartResult?.success) {
        writeJsonResponse(res, 500, {
          success: false,
          error: restartResult?.error || 'Failed to apply settings while running',
          status: getRemoteStatusPayload(),
        });
        return;
      }
    }

    writeJsonResponse(res, 200, {
      success: true,
      status: getRemoteStatusPayload(),
    });
    return;
  }

  if (requestUrl.pathname === '/api/start-clicker' && req.method === 'POST') {
    const payload = await readRequestBody(req);
    const parsedKey = normalizeRemoteKey(
      payload.key === undefined ? currentKey : String(payload.key || '')
    );
    const parsedInterval =
      payload.interval === undefined ? currentInterval : normalizeRemoteInterval(payload.interval);

    if (!parsedKey) {
      writeJsonResponse(res, 400, {
        success: false,
        error: 'Target key is required',
      });
      return;
    }

    if (!Number.isFinite(parsedInterval)) {
      writeJsonResponse(res, 400, {
        success: false,
        error: 'Interval must be between 10 and 600000 ms',
      });
      return;
    }

    const shouldRestart = isRunning && (parsedKey !== currentKey || parsedInterval !== currentInterval);
    if (shouldRestart) {
      stopClicker();
    }

    currentKey = parsedKey;
    currentInterval = parsedInterval;
    const result = await startClicker(currentKey, currentInterval);

    writeJsonResponse(res, result?.success ? 200 : 500, {
      success: Boolean(result?.success),
      running: Boolean(result?.running),
      error: result?.error || '',
      status: getRemoteStatusPayload(),
    });
    return;
  }

  if (requestUrl.pathname === '/api/stop-clicker' && req.method === 'POST') {
    const result = stopClicker();
    writeJsonResponse(res, 200, {
      success: Boolean(result?.success),
      running: Boolean(result?.running),
      status: getRemoteStatusPayload(),
    });
    return;
  }

  writeJsonResponse(res, 404, {
    success: false,
    error: 'API endpoint not found',
  });
}

async function handleRemoteHttpRequest(req, res) {
  const host = req.headers.host || `127.0.0.1:${remoteServerPort}`;
  const requestUrl = new URL(req.url || '/', `http://${host}`);
  const pathname = requestUrl.pathname;

  if (pathname.startsWith('/api/')) {
    await handleRemoteApiRequest(req, res, requestUrl);
    return;
  }

  if (pathname === '/' || pathname === '/remote') {
    if (!safeTokensMatch(requestUrl.searchParams.get('token') || '')) {
      writeHtmlResponse(
        res,
        401,
        '<!doctype html><html><body style="font-family:Segoe UI,sans-serif;padding:18px;background:#0b1020;color:#f8fafc;">Unauthorized remote link. Please scan the latest QR code from the desktop app.</body></html>'
      );
      return;
    }

    writeHtmlResponse(
      res,
      200,
      renderRemoteControlPage({
        token: remoteAccessToken,
      })
    );
    return;
  }

  writeHtmlResponse(
    res,
    404,
    '<!doctype html><html><body style="font-family:Segoe UI,sans-serif;padding:18px;">Not Found</body></html>'
  );
}

async function startRemoteControlServer() {
  if (remoteServer) return;
  remoteServerError = '';

  for (let offset = 0; offset <= REMOTE_SERVER_PORT_SCAN_LIMIT; offset += 1) {
    const candidatePort = REMOTE_SERVER_DEFAULT_PORT + offset;
    const server = http.createServer((req, res) => {
      Promise.resolve(handleRemoteHttpRequest(req, res)).catch((error) => {
        console.error('[Remote] Request error:', error.message);
        if (res.headersSent) {
          try {
            res.end();
          } catch {
            // ignore write errors on half-closed sockets
          }
          return;
        }
        writeJsonResponse(res, 500, {
          success: false,
          error: 'Remote server internal error',
        });
      });
    });

    try {
      await new Promise((resolve, reject) => {
        const onError = (error) => reject(error);
        server.once('error', onError);
        server.listen(candidatePort, '0.0.0.0', () => {
          server.removeListener('error', onError);
          resolve();
        });
      });

      remoteServer = server;
      remoteServerPort = candidatePort;
      console.log(`[Remote] Control server listening on port ${candidatePort}`);
      return;
    } catch (error) {
      try {
        server.close();
      } catch {
        // ignore
      }

      if (error?.code === 'EADDRINUSE') {
        continue;
      }

      remoteServerError = error?.message || 'Unknown remote server error';
      console.error('[Remote] Failed to start control server:', remoteServerError);
      return;
    }
  }

  remoteServerError = `Remote server port ${REMOTE_SERVER_DEFAULT_PORT}-${REMOTE_SERVER_DEFAULT_PORT + REMOTE_SERVER_PORT_SCAN_LIMIT} is unavailable`;
  console.error(`[Remote] ${remoteServerError}`);
}

function stopRemoteControlServer() {
  if (!remoteServer) return;
  try {
    remoteServer.close();
  } catch {
    // ignore close errors
  }
  remoteServer = null;
}

let scriptPath = null;

function initKeySimulator() {
  if (psProcess) return;

  // Native Windows SendInput injection works in more targets than SendKeys,
  // including many apps and games that ignore window-message based input.
  const scriptContent = [
    '$signature = @"',
    'using System;',
    'using System.Collections.Generic;',
    'using System.Runtime.InteropServices;',
    '',
    'public static class KeyboardSender',
    '{',
    '    private const int INPUT_KEYBOARD = 1;',
    '    private const uint KEYEVENTF_EXTENDEDKEY = 0x0001;',
    '    private const uint KEYEVENTF_KEYUP = 0x0002;',
    '    private const uint KEYEVENTF_SCANCODE = 0x0008;',
    '    private const uint MAPVK_VK_TO_VSC = 0;',
    '',
    '    [StructLayout(LayoutKind.Sequential)]',
    '    private struct INPUT',
    '    {',
    '        public uint type;',
    '        public InputUnion U;',
    '    }',
    '',
    '    [StructLayout(LayoutKind.Explicit)]',
    '    private struct InputUnion',
    '    {',
    '        [FieldOffset(0)]',
    '        public MOUSEINPUT mi;',
    '        [FieldOffset(0)]',
    '        public KEYBDINPUT ki;',
    '        [FieldOffset(0)]',
    '        public HARDWAREINPUT hi;',
    '    }',
    '',
    '    [StructLayout(LayoutKind.Sequential)]',
    '    private struct MOUSEINPUT',
    '    {',
    '        public int dx;',
    '        public int dy;',
    '        public uint mouseData;',
    '        public uint dwFlags;',
    '        public uint time;',
    '        public IntPtr dwExtraInfo;',
    '    }',
    '',
    '    [StructLayout(LayoutKind.Sequential)]',
    '    private struct HARDWAREINPUT',
    '    {',
    '        public uint uMsg;',
    '        public ushort wParamL;',
    '        public ushort wParamH;',
    '    }',
    '',
    '    [StructLayout(LayoutKind.Sequential)]',
    '    private struct KEYBDINPUT',
    '    {',
    '        public ushort wVk;',
    '        public ushort wScan;',
    '        public uint dwFlags;',
    '        public uint time;',
    '        public IntPtr dwExtraInfo;',
    '    }',
    '',
    '    [DllImport("user32.dll", SetLastError = true)]',
    '    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);',
    '',
    '    [DllImport("user32.dll", CharSet = CharSet.Unicode)]',
    '    private static extern uint MapVirtualKey(uint uCode, uint uMapType);',
    '',
    '    private static readonly Dictionary<string, ushort> VkMap = new Dictionary<string, ushort>(StringComparer.OrdinalIgnoreCase)',
    '    {',
    '        { "Space", 0x20 },',
    '        { " ", 0x20 },',
    '        { "Enter", 0x0D },',
    '        { "Tab", 0x09 },',
    '        { "Escape", 0x1B },',
    '        { "Esc", 0x1B },',
    '        { "Backspace", 0x08 },',
    '        { "Delete", 0x2E },',
    '        { "Del", 0x2E },',
    '        { "Insert", 0x2D },',
    '        { "Home", 0x24 },',
    '        { "End", 0x23 },',
    '        { "PageUp", 0x21 },',
    '        { "PgUp", 0x21 },',
    '        { "PageDown", 0x22 },',
    '        { "PgDn", 0x22 },',
    '        { "ArrowUp", 0x26 },',
    '        { "Up", 0x26 },',
    '        { "ArrowDown", 0x28 },',
    '        { "Down", 0x28 },',
    '        { "ArrowLeft", 0x25 },',
    '        { "Left", 0x25 },',
    '        { "ArrowRight", 0x27 },',
    '        { "Right", 0x27 },',
    '        { "CapsLock", 0x14 },',
    '        { "Shift", 0xA0 },',
    '        { "ShiftLeft", 0xA0 },',
    '        { "LeftShift", 0xA0 },',
    '        { "ShiftRight", 0xA1 },',
    '        { "RightShift", 0xA1 },',
    '        { "Control", 0xA2 },',
    '        { "Ctrl", 0xA2 },',
    '        { "ControlLeft", 0xA2 },',
    '        { "LeftControl", 0xA2 },',
    '        { "LeftCtrl", 0xA2 },',
    '        { "ControlRight", 0xA3 },',
    '        { "RightControl", 0xA3 },',
    '        { "RightCtrl", 0xA3 },',
    '        { "Alt", 0xA4 },',
    '        { "Menu", 0xA4 },',
    '        { "AltLeft", 0xA4 },',
    '        { "LeftAlt", 0xA4 },',
    '        { "AltRight", 0xA5 },',
    '        { "RightAlt", 0xA5 },',
    '        { "Meta", 0x5B },',
    '        { "Win", 0x5B },',
    '        { "Windows", 0x5B },',
    '        { "MetaLeft", 0x5B },',
    '        { "LeftWin", 0x5B },',
    '        { "MetaRight", 0x5C },',
    '        { "RightWin", 0x5C },',
    '        { "ContextMenu", 0x5D },',
    '        { "PrintScreen", 0x2C },',
    '        { "Pause", 0x13 },',
    '        { "NumLock", 0x90 },',
    '        { "ScrollLock", 0x91 },',
    '        { "Numpad0", 0x60 },',
    '        { "Numpad1", 0x61 },',
    '        { "Numpad2", 0x62 },',
    '        { "Numpad3", 0x63 },',
    '        { "Numpad4", 0x64 },',
    '        { "Numpad5", 0x65 },',
    '        { "Numpad6", 0x66 },',
    '        { "Numpad7", 0x67 },',
    '        { "Numpad8", 0x68 },',
    '        { "Numpad9", 0x69 },',
    '        { "NumpadMultiply", 0x6A },',
    '        { "NumpadAdd", 0x6B },',
    '        { "NumpadSubtract", 0x6D },',
    '        { "NumpadDecimal", 0x6E },',
    '        { "NumpadDivide", 0x6F },',
    '        { ";", 0xBA },',
    '        { ":", 0xBA },',
    '        { "=", 0xBB },',
    '        { "+", 0xBB },',
    '        { ",", 0xBC },',
    '        { "<", 0xBC },',
    '        { "-", 0xBD },',
    '        { "_", 0xBD },',
    '        { ".", 0xBE },',
    '        { ">", 0xBE },',
    '        { "/", 0xBF },',
    '        { "?", 0xBF },',
    '        { "`", 0xC0 },',
    '        { "~", 0xC0 },',
    '        { "[", 0xDB },',
    '        { "{", 0xDB },',
    '        { "\\\\", 0xDC },',
    '        { "|", 0xDC },',
    '        { "]", 0xDD },',
    '        { "}", 0xDD },',
    '        { "\'", 0xDE }',
    '    };',
    '',
    '    private static readonly HashSet<ushort> ExtendedKeys = new HashSet<ushort>',
    '    {',
    '        0x21,',
    '        0x22,',
    '        0x23,',
    '        0x24,',
    '        0x25,',
    '        0x26,',
    '        0x27,',
    '        0x28,',
    '        0x2D,',
    '        0x2E,',
    '        0x5B,',
    '        0x5C,',
    '        0x5D,',
    '        0x6F,',
    '        0x90,',
    '        0xA3,',
    '        0xA5',
    '    };',
    '',
    '    public static string SendKey(string rawKey)',
    '    {',
    '        string keyDownError = SendKeyState(rawKey, false);',
    '        if (keyDownError != null)',
    '        {',
    '            return keyDownError;',
    '        }',
    '',
    '        return SendKeyState(rawKey, true);',
    '    }',
    '',
    '    public static string SendKeyDown(string rawKey)',
    '    {',
    '        return SendKeyState(rawKey, false);',
    '    }',
    '',
    '    public static string SendKeyUp(string rawKey)',
    '    {',
    '        return SendKeyState(rawKey, true);',
    '    }',
    '',
    '    private static string SendKeyState(string rawKey, bool keyUp)',
    '    {',
    '        if (string.IsNullOrWhiteSpace(rawKey))',
    '        {',
    '            return "Empty key value";',
    '        }',
    '',
    '        ushort vk = ResolveVirtualKey(rawKey.Trim());',
    '        if (vk == 0)',
    '        {',
    '            return "Unsupported key: " + rawKey;',
    '        }',
    '',
    '        uint scan = MapVirtualKey(vk, MAPVK_VK_TO_VSC);',
    '        uint flags = scan == 0 ? 0u : KEYEVENTF_SCANCODE;',
    '        if (ExtendedKeys.Contains(vk))',
    '        {',
    '            flags |= KEYEVENTF_EXTENDEDKEY;',
    '        }',
    '',
    '        if (keyUp)',
    '        {',
    '            flags |= KEYEVENTF_KEYUP;',
    '        }',
    '',
    '        INPUT[] inputs = new INPUT[1];',
    '        inputs[0] = CreateKeyboardInput(vk, scan, flags);',
    '',
    '        uint sent = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));',
    '        if (sent != inputs.Length)',
    '        {',
    '            int lastError = Marshal.GetLastWin32Error();',
    '            return "SendInput failed (sent " + sent + "/1, lastError=" + lastError + ")";',
    '        }',
    '',
    '        return null;',
    '    }',
    '',
    '    private static INPUT CreateKeyboardInput(ushort vk, uint scan, uint flags)',
    '    {',
    '        return new INPUT',
    '        {',
    '            type = INPUT_KEYBOARD,',
    '            U = new InputUnion',
    '            {',
    '                ki = new KEYBDINPUT',
    '                {',
    '                    wVk = (ushort)(scan == 0 ? vk : 0),',
    '                    wScan = (ushort)scan,',
    '                    dwFlags = flags,',
    '                    time = 0,',
    '                    dwExtraInfo = IntPtr.Zero',
    '                }',
    '            }',
    '        };',
    '    }',
    '',
    '    private static ushort ResolveVirtualKey(string key)',
    '    {',
    '        if (string.IsNullOrWhiteSpace(key))',
    '        {',
    '            return 0;',
    '        }',
    '',
    '        ushort mapped;',
    '        if (VkMap.TryGetValue(key, out mapped))',
    '        {',
    '            return mapped;',
    '        }',
    '',
    '        if (key.StartsWith("F", StringComparison.OrdinalIgnoreCase))',
    '        {',
    '            int functionKey;',
    '            if (int.TryParse(key.Substring(1), out functionKey) && functionKey >= 1 && functionKey <= 24)',
    '            {',
    '                return (ushort)(0x6F + functionKey);',
    '            }',
    '        }',
    '',
    '        if (key.Length == 1)',
    '        {',
    '            char upper = char.ToUpperInvariant(key[0]);',
    "            if (upper >= 'A' && upper <= 'Z')",
    '            {',
    '                return (ushort)upper;',
    '            }',
    '',
    "            if (upper >= '0' && upper <= '9')",
    '            {',
    '                return (ushort)upper;',
    '            }',
    '',
    '            ushort oemMapped;',
    '            if (VkMap.TryGetValue(upper.ToString(), out oemMapped))',
    '            {',
    '                return oemMapped;',
    '            }',
    '        }',
    '',
    '        return 0;',
    '    }',
    '}',
    '"@',
    '',
    'try {',
    '    Add-Type -TypeDefinition $signature -Language CSharp',
    '} catch {',
    '    [Console]::Error.WriteLine("KSIM_INIT_FAILED: " + $_.Exception.Message)',
    '    exit 1',
    '}',
    '',
    '[Console]::Out.WriteLine("KSIM_READY")',
    '[Console]::Out.Flush()',
    'while ($true) {',
    '    $s = [Console]::In.ReadLine()',
    '    if ($null -eq $s) { break }',
    '    if ($s -ne "") {',
    '        try {',
    '            $parts = $s.Split(@("|"), 2, [System.StringSplitOptions]::None)',
    '            $errorMessage = $null',
    '            if ($parts.Length -eq 2 -and $parts[0] -eq "__KAC_DOWN__") {',
    '                $errorMessage = [KeyboardSender]::SendKeyDown($parts[1])',
    '            } elseif ($parts.Length -eq 2 -and $parts[0] -eq "__KAC_UP__") {',
    '                $errorMessage = [KeyboardSender]::SendKeyUp($parts[1])',
    '            } else {',
    '                $errorMessage = [KeyboardSender]::SendKey($s)',
    '            }',
    '            if ($errorMessage) {',
    '                [Console]::Error.WriteLine("KSIM_SEND_FAILED: " + $errorMessage)',
    '            }',
    '        } catch {',
    '            [Console]::Error.WriteLine("KSIM_SEND_FAILED: " + $_.Exception.Message)',
    '        }',
    '    }',
    '}',
  ].join('\r\n');

  scriptPath = path.join(os.tmpdir(), 'kac-ksim.ps1');
  try {
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
  } catch (e) {
    console.error('[KeySim] Failed to write script file:', e.message);
    return;
  }

  psProcess = spawn(
    'powershell.exe',
    ['-NoProfile', '-NoLogo', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );

  let buffer = '';
  psProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    if (buffer.includes('KSIM_READY')) {
      psReady = true;
      console.log('[KeySim] PowerShell key simulator ready');
      resolvePsReadyWaiters(true);
      buffer = '';
    }
  });

  psProcess.stderr.on('data', (data) => {
    console.error('[KeySim] PS Error:', data.toString());
  });

  psProcess.on('error', (error) => {
    console.error('[KeySim] Failed to launch PowerShell process:', error.message);
    psProcess = null;
    psReady = false;
    resolvePsReadyWaiters(false);
  });

  psProcess.on('close', (code) => {
    console.log('[KeySim] PowerShell process closed with code:', code);
    psProcess = null;
    psReady = false;
    resolvePsReadyWaiters(false);
  });
}

function destroyKeySimulator() {
  if (psProcess) {
    try {
      psProcess.stdin.end();
      psProcess.kill();
    } catch (e) {
      // ignore
    }
    psProcess = null;
    psReady = false;
  }

  if (scriptPath) {
    try {
      fs.unlinkSync(scriptPath);
    } catch (_) {}
    scriptPath = null;
  }
}

function writeToKeySimulator(line) {
  if (!psProcess || !psReady) return false;

  try {
    psProcess.stdin.write(`${line}\n`);
    return true;
  } catch (e) {
    console.error('[KeySim] Failed to send key:', e.message);
    return false;
  }
}

function simulateKeyPress(key) {
  if (!psProcess || !psReady) return;

  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  if (!normalizedKey) {
    console.warn('[KeySim] Empty key, skipping');
    return;
  }

  writeToKeySimulator(normalizedKey);
}

function simulateKeyDown(key) {
  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  if (!normalizedKey) {
    console.warn('[KeySim] Empty key-down value, skipping');
    return;
  }

  writeToKeySimulator(`__KAC_DOWN__|${normalizedKey}`);
}

function simulateKeyUp(key) {
  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  if (!normalizedKey) {
    console.warn('[KeySim] Empty key-up value, skipping');
    return;
  }

  writeToKeySimulator(`__KAC_UP__|${normalizedKey}`);
}

function markHeldKey(key) {
  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  if (!normalizedKey) return;
  activeHeldKeys.set(normalizedKey, (activeHeldKeys.get(normalizedKey) || 0) + 1);
}

function unmarkHeldKey(key) {
  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  if (!normalizedKey) return;
  const currentCount = activeHeldKeys.get(normalizedKey) || 0;
  if (currentCount <= 1) {
    activeHeldKeys.delete(normalizedKey);
    return;
  }
  activeHeldKeys.set(normalizedKey, currentCount - 1);
}

function releaseHeldKeys() {
  activeHeldKeys.forEach((count, key) => {
    for (let index = 0; index < count; index += 1) {
      simulateKeyUp(key);
    }
  });
  activeHeldKeys.clear();
}

function sendMacroError(message) {
  if (mainWindow) {
    mainWindow.webContents.send('macro-error', { message });
  }
}

function sendMacroPlaybackStatus() {
  if (mainWindow) {
    mainWindow.webContents.send('macro-playback-status', {
      playing: isMacroPlaying,
      count: macroRecording.length,
      speed: macroPlaybackSpeed,
      continuous: macroContinuousPlayback,
      clickerHotkey,
      recordHotkey,
      playbackHotkey,
    });
  }
}

function scheduleMacroTimer(handler, delayMs) {
  const timer = setTimeout(() => {
    macroPlaybackTimers.delete(timer);
    handler();
  }, delayMs);
  macroPlaybackTimers.add(timer);
  return timer;
}

function clearMacroPlaybackTimers() {
  macroPlaybackTimers.forEach((timer) => clearTimeout(timer));
  macroPlaybackTimers.clear();
}

function normalizeRecordedEvents(events) {
  if (!Array.isArray(events)) return [];
  return events
    .map((item) => ({
      key: typeof item?.key === 'string' ? item.key.trim() : '',
      time: Number(item?.time),
      hold: Number(item?.hold ?? 0),
    }))
    .filter((item) => item.key && Number.isFinite(item.time))
    .map((item) => ({
      key: item.key,
      time: Math.max(0, Math.round(item.time)),
      hold: Number.isFinite(item.hold) ? Math.max(0, Math.round(item.hold)) : 0,
    }))
    .sort((a, b) => a.time - b.time);
}

function stopMacroPlayback() {
  const wasPlaying = isMacroPlaying;
  isMacroPlaying = false;
  clearMacroPlaybackTimers();
  releaseHeldKeys();
  if (wasPlaying) {
    sendMacroPlaybackStatus();
  }
  return { success: true, playing: false };
}

async function startMacroPlayback(options = {}) {
  if (isMacroPlaying) return { success: true, playing: true };

  if (Array.isArray(options.events)) {
    macroRecording = normalizeRecordedEvents(options.events);
  }

  if (!macroRecording.length) {
    const error = 'No recorded keys to play';
    sendMacroError(error);
    return { success: false, error };
  }

  const speed = options.speed === undefined ? macroPlaybackSpeed : Number(options.speed);
  if (!Number.isFinite(speed) || speed <= 0) {
    const error = 'Playback speed must be greater than 0';
    sendMacroError(error);
    return { success: false, error };
  }

  const continuous =
    typeof options.continuous === 'boolean' ? options.continuous : macroContinuousPlayback;

  const ready = await waitForPsReady(10000);
  if (!ready) {
    const error = 'Key simulator not ready';
    sendMacroError(error);
    return { success: false, error };
  }

  macroPlaybackSpeed = speed;
  macroContinuousPlayback = continuous;

  const baseTime = macroRecording[0]?.time || 0;
  const timeline = macroRecording.map((event) => ({
    key: event.key,
    time: Math.max(0, event.time - baseTime),
    hold: Math.max(0, event.hold || 0),
  }));
  const totalTimelineDuration = timeline.reduce(
    (maxDuration, event) => Math.max(maxDuration, event.time + event.hold),
    0
  );

  const runCycle = () => {
    if (!isMacroPlaying) return;

    timeline.forEach((event) => {
      const delay = Math.max(0, Math.round(event.time / macroPlaybackSpeed));
      const holdDuration =
        event.hold > 0 ? Math.max(1, Math.round(event.hold / macroPlaybackSpeed)) : 0;
      scheduleMacroTimer(() => {
        if (!isMacroPlaying) return;

        if (holdDuration > 0) {
          simulateKeyDown(event.key);
          markHeldKey(event.key);
          scheduleMacroTimer(() => {
            simulateKeyUp(event.key);
            unmarkHeldKey(event.key);
          }, holdDuration);
        } else {
          simulateKeyPress(event.key);
        }
      }, delay);
    });

    const cycleDuration = Math.max(30, Math.round(totalTimelineDuration / macroPlaybackSpeed) + 30);
    scheduleMacroTimer(() => {
      if (!isMacroPlaying) return;
      if (macroContinuousPlayback) {
        runCycle();
      } else {
        stopMacroPlayback();
      }
    }, cycleDuration);
  };

  isMacroPlaying = true;
  sendMacroPlaybackStatus();
  runCycle();
  return { success: true, playing: true };
}

function registerGlobalHotkeys() {
  globalShortcut.unregisterAll();

  const failedHotkeys = [];
  const registerSafe = (hotkey, handler) => {
    const accelerator = toElectronAccelerator(hotkey);
    try {
      if (!accelerator) {
        return false;
      }
      return globalShortcut.register(accelerator, handler);
    } catch (error) {
      console.error('[Hotkey] Failed to register:', hotkey, '=>', accelerator, error.message);
      return false;
    }
  };

  if (
    !registerSafe(clickerHotkey, () => {
      if (isRunning) {
        stopClicker();
      } else {
        startClicker(currentKey, currentInterval);
      }
    })
  ) {
    failedHotkeys.push(clickerHotkey);
  }

  if (
    !registerSafe(recordHotkey, () => {
      if (mainWindow) {
        mainWindow.webContents.send('macro-hotkey-record-toggle');
      }
    })
  ) {
    failedHotkeys.push(recordHotkey);
  }

  if (
    !registerSafe(playbackHotkey, () => {
      if (isMacroPlaying) {
        stopMacroPlayback();
      } else {
        startMacroPlayback().catch((error) => {
          sendMacroError(error?.message || 'Failed to start playback');
        });
      }
    })
  ) {
    failedHotkeys.push(playbackHotkey);
  }

  if (failedHotkeys.length > 0) {
    const error = `Unable to register hotkey(s): ${failedHotkeys.join(', ')}`;
    sendMacroError(error);
    return { success: false, error };
  }

  sendMacroPlaybackStatus();
  return { success: true };
}

function updateMacroSettings(settings = {}) {
  const prevClickerHotkey = clickerHotkey;
  const prevRecordHotkey = recordHotkey;
  const prevPlaybackHotkey = playbackHotkey;

  if (typeof settings.clickerHotkey === 'string' && settings.clickerHotkey.trim()) {
    clickerHotkey = settings.clickerHotkey.trim();
  }
  if (typeof settings.recordHotkey === 'string' && settings.recordHotkey.trim()) {
    recordHotkey = settings.recordHotkey.trim();
  }
  if (typeof settings.playbackHotkey === 'string' && settings.playbackHotkey.trim()) {
    playbackHotkey = settings.playbackHotkey.trim();
  }
  if (settings.speed !== undefined) {
    const speed = Number(settings.speed);
    if (!Number.isFinite(speed) || speed <= 0) {
      return { success: false, error: 'Playback speed must be greater than 0' };
    }
    macroPlaybackSpeed = speed;
  }
  if (typeof settings.continuous === 'boolean') {
    macroContinuousPlayback = settings.continuous;
  }

  const registerResult = registerGlobalHotkeys();
  if (!registerResult.success) {
    clickerHotkey = prevClickerHotkey;
    recordHotkey = prevRecordHotkey;
    playbackHotkey = prevPlaybackHotkey;
    registerGlobalHotkeys();
    return registerResult;
  }

  return {
    success: true,
    settings: {
      clickerHotkey,
      recordHotkey,
      playbackHotkey,
      speed: macroPlaybackSpeed,
      continuous: macroContinuousPlayback,
    },
  };
}

function syncFloatingMode() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const shouldFloat = !mainWindow.isMaximized() && !mainWindow.isFullScreen();
  mainWindow.setAlwaysOnTop(shouldFloat);
}

function sendWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('window-state-changed', {
    isMaximized: mainWindow.isMaximized(),
    isFullScreen: mainWindow.isFullScreen(),
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 700,
    minWidth: 420,
    minHeight: 600,
    resizable: true,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const syncWindowState = () => {
    syncFloatingMode();
    sendWindowState();
  };

  mainWindow.on('maximize', syncWindowState);
  mainWindow.on('unmaximize', syncWindowState);
  mainWindow.on('enter-full-screen', syncWindowState);
  mainWindow.on('leave-full-screen', syncWindowState);
  mainWindow.on('restore', syncWindowState);
  mainWindow.on('resize', sendWindowState);
  mainWindow.webContents.on('did-finish-load', sendWindowState);

  syncFloatingMode();
}

async function startClicker(key, intervalMs) {
  if (isRunning) {
    return { success: true, running: true };
  }

  if (!Number.isFinite(intervalMs) || intervalMs < 10) {
    const error = 'Invalid interval value';
    console.error(`[KeySim] ${error}:`, intervalMs);
    if (mainWindow) {
      mainWindow.webContents.send('clicker-status', { running: false, error });
      mainWindow.webContents.send('clicker-error', { message: error });
    }
    return { success: false, error };
  }

  const ready = await waitForPsReady(10000);
  if (!ready) {
    const error = 'Key simulator not ready';
    console.error('[KeySim] PowerShell not ready, cannot start clicker');
    if (mainWindow) {
      mainWindow.webContents.send('clicker-status', { running: false, error });
      mainWindow.webContents.send('clicker-error', { message: error });
    }
    return { success: false, error };
  }

  currentKey = key;
  currentInterval = intervalMs;
  clickerTickCount = 0;
  isRunning = true;

  clickerInterval = setInterval(() => {
    simulateKeyPress(currentKey);
    clickerTickCount += 1;
    if (mainWindow) {
      mainWindow.webContents.send('clicker-tick');
    }
  }, currentInterval);

  if (mainWindow) {
    mainWindow.webContents.send('clicker-status', { running: true });
  }

  return { success: true, running: true };
}

function stopClicker() {
  if (!isRunning) return { success: true, running: false };
  isRunning = false;

  if (clickerInterval) {
    clearInterval(clickerInterval);
    clickerInterval = null;
  }

  if (mainWindow) {
    mainWindow.webContents.send('clicker-status', { running: false });
  }

  return { success: true, running: false };
}

app.whenReady().then(async () => {
  initKeySimulator();
  await startRemoteControlServer();
  createWindow();
  registerGlobalHotkeys();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopClicker();
  stopMacroPlayback();
  destroyKeySimulator();
  stopRemoteControlServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopClicker();
  stopMacroPlayback();
  destroyKeySimulator();
  stopRemoteControlServer();
});

app.on('activate', () => {
  if (!remoteServer) {
    startRemoteControlServer().catch((error) => {
      remoteServerError = error?.message || 'Failed to start remote server';
    });
  }
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('update-settings', (event, { key, interval }) => {
  currentKey = key;
  currentInterval = interval;
  return { success: true };
});

ipcMain.handle('start-clicker', async (event, { key, interval }) => {
  currentKey = key;
  currentInterval = interval;
  return await startClicker(key, interval);
});

ipcMain.handle('stop-clicker', () => {
  return stopClicker();
});

ipcMain.handle('get-status', () => {
  return getRemoteStatusPayload();
});

ipcMain.handle('get-remote-access', () => {
  return getRemoteAccessInfo();
});

ipcMain.handle('save-macro-recording', (event, { events }) => {
  macroRecording = normalizeRecordedEvents(events);
  sendMacroPlaybackStatus();
  return { success: true, count: macroRecording.length };
});

ipcMain.handle('get-macro-recording', () => {
  return { success: true, events: macroRecording };
});

ipcMain.handle('start-macro-playback', async (event, options = {}) => {
  return await startMacroPlayback(options);
});

ipcMain.handle('stop-macro-playback', () => {
  return stopMacroPlayback();
});

ipcMain.handle('get-macro-status', () => {
  return {
    playing: isMacroPlaying,
    count: macroRecording.length,
    speed: macroPlaybackSpeed,
    continuous: macroContinuousPlayback,
    clickerHotkey,
    recordHotkey,
    playbackHotkey,
  };
});

ipcMain.handle('update-macro-settings', (event, settings = {}) => {
  return updateMacroSettings(settings);
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    syncFloatingMode();
    sendWindowState();
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('get-window-state', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { isMaximized: false, isFullScreen: false };
  }
  return {
    isMaximized: mainWindow.isMaximized(),
    isFullScreen: mainWindow.isFullScreen(),
  };
});
