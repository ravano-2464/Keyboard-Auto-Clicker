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

  globalShortcut.register('F6', () => {
    if (isRunning) {
      stopClicker();
    } else {
      startClicker(currentKey, currentInterval);
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopClicker();
  destroyKeySimulator();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopClicker();
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
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});
