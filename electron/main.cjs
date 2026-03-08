const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let clickerInterval = null;
let isRunning = false;
let psProcess = null;
let psReady = false;
let psReadyResolvers = [];

let currentKey = 'Space';
let currentInterval = 100;

let macroRecording = [];
let isMacroPlaying = false;
let macroPlaybackSpeed = 1;
let macroContinuousPlayback = false;
let clickerHotkey = 'F6';
let recordHotkey = 'F7';
let playbackHotkey = 'F8';
const macroPlaybackTimers = new Set();

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

// SendKeys string map (WScript.Shell format) — no C# compilation needed
const SENDKEYS_MAP = {
  space: '{SPACE}',
  ' ': '{SPACE}',
  enter: '{ENTER}',
  tab: '{TAB}',
  escape: '{ESC}',
  backspace: '{BACKSPACE}',
  delete: '{DELETE}',
  arrowup: '{UP}',
  arrowdown: '{DOWN}',
  arrowleft: '{LEFT}',
  arrowright: '{RIGHT}',
  home: '{HOME}',
  end: '{END}',
  pageup: '{PGUP}',
  pagedown: '{PGDN}',
  f1: '{F1}',
  f2: '{F2}',
  f3: '{F3}',
  f4: '{F4}',
  f5: '{F5}',
  f6: '{F6}',
  f7: '{F7}',
  f8: '{F8}',
  f9: '{F9}',
  f10: '{F10}',
  f11: '{F11}',
  f12: '{F12}',
};

// SendKeys chars that must be wrapped in braces to be treated literally
const SENDKEYS_ESCAPE = new Set(['+', '^', '%', '~', '(', ')', '{', '}', '[', ']']);

function getSendKeysStr(key) {
  if (!key) return null;
  const lower = key.toLowerCase();
  if (SENDKEYS_MAP[lower]) return SENDKEYS_MAP[lower];
  if (key.length === 1) {
    if (SENDKEYS_ESCAPE.has(key)) return `{${key}}`;
    return key.toLowerCase();
  }
  return null;
}

let scriptPath = null;

function initKeySimulator() {
  if (psProcess) return;

  // WScript.Shell: no compilation, instant start, uses SendInput internally
  const scriptContent = [
    '$wsh = $null',
    '$useWinForms = $false',
    'try {',
    '    $wsh = New-Object -ComObject WScript.Shell',
    '} catch {',
    '    try {',
    '        Add-Type -AssemblyName System.Windows.Forms',
    '        $useWinForms = $true',
    '    } catch {',
    '        [Console]::Error.WriteLine("KSIM_INIT_FAILED: " + $_.Exception.Message)',
    '        exit 1',
    '    }',
    '}',
    '[Console]::Out.WriteLine("KSIM_READY")',
    '[Console]::Out.Flush()',
    'while ($true) {',
    '    $s = [Console]::In.ReadLine()',
    '    if ($null -eq $s) { break }',
    '    if ($s -ne "") {',
    '        try {',
    '            if ($useWinForms) {',
    '                [System.Windows.Forms.SendKeys]::SendWait($s)',
    '            } else {',
    '                $wsh.SendKeys($s)',
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

function simulateKeyPress(key) {
  if (!psProcess || !psReady) return;

  const s = getSendKeysStr(key);
  if (!s) {
    console.warn('[KeySim] No SendKeys mapping for key:', key);
    return;
  }

  try {
    psProcess.stdin.write(`${s}\n`);
  } catch (e) {
    console.error('[KeySim] Failed to send key:', e.message);
  }
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
    }))
    .filter((item) => item.key && Number.isFinite(item.time))
    .map((item) => ({
      key: item.key,
      time: Math.max(0, Math.round(item.time)),
    }))
    .sort((a, b) => a.time - b.time);
}

function stopMacroPlayback() {
  if (!isMacroPlaying) return { success: true, playing: false };
  isMacroPlaying = false;
  clearMacroPlaybackTimers();
  sendMacroPlaybackStatus();
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
  }));
  const lastTime = timeline[timeline.length - 1]?.time || 0;

  const runCycle = () => {
    if (!isMacroPlaying) return;

    timeline.forEach((event) => {
      const delay = Math.max(0, Math.round(event.time / macroPlaybackSpeed));
      scheduleMacroTimer(() => {
        if (isMacroPlaying) {
          simulateKeyPress(event.key);
        }
      }, delay);
    });

    const cycleDuration = Math.max(30, Math.round(lastTime / macroPlaybackSpeed) + 30);
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
  const registerSafe = (accelerator, handler) => {
    try {
      return globalShortcut.register(accelerator, handler);
    } catch (error) {
      console.error('[Hotkey] Failed to register:', accelerator, error.message);
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

  isRunning = true;

  clickerInterval = setInterval(() => {
    simulateKeyPress(key);
    if (mainWindow) {
      mainWindow.webContents.send('clicker-tick');
    }
  }, intervalMs);

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

app.whenReady().then(() => {
  initKeySimulator();
  createWindow();
  registerGlobalHotkeys();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopClicker();
  stopMacroPlayback();
  destroyKeySimulator();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopClicker();
  stopMacroPlayback();
  destroyKeySimulator();
});

app.on('activate', () => {
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
  return { running: isRunning };
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
