const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let clickerInterval = null;
let isRunning = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 700,
    minWidth: 420,
    minHeight: 600,
    resizable: true,
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

  // Load the app
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

// Simulate key press using PowerShell
function simulateKeyPress(key) {
  const keyMap = {
    // Letters
    'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f',
    'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'q', 'r': 'r',
    's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x',
    'y': 'y', 'z': 'z',
    // Numbers
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    // Special keys
    'Space': ' ',
    'Enter': '{ENTER}',
    'Tab': '{TAB}',
    'Escape': '{ESC}',
    'Backspace': '{BACKSPACE}',
    'Delete': '{DELETE}',
    'ArrowUp': '{UP}',
    'ArrowDown': '{DOWN}',
    'ArrowLeft': '{LEFT}',
    'ArrowRight': '{RIGHT}',
    'Home': '{HOME}',
    'End': '{END}',
    'PageUp': '{PGUP}',
    'PageDown': '{PGDN}',
    'F1': '{F1}', 'F2': '{F2}', 'F3': '{F3}', 'F4': '{F4}',
    'F5': '{F5}', 'F6': '{F6}', 'F7': '{F7}', 'F8': '{F8}',
    'F9': '{F9}', 'F10': '{F10}', 'F11': '{F11}', 'F12': '{F12}',
  };

  const sendKey = keyMap[key] || key;

  // Use PowerShell to send keys
  const psCommand = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')"`;
  exec(psCommand, (error) => {
    if (error && mainWindow) {
      mainWindow.webContents.send('clicker-error', error.message);
    }
  });
}

function startClicker(key, intervalMs) {
  if (isRunning) return;
  isRunning = true;

  clickerInterval = setInterval(() => {
    simulateKeyPress(key);
  }, intervalMs);

  if (mainWindow) {
    mainWindow.webContents.send('clicker-status', { running: true });
  }
}

function stopClicker() {
  if (!isRunning) return;
  isRunning = false;

  if (clickerInterval) {
    clearInterval(clickerInterval);
    clickerInterval = null;
  }

  if (mainWindow) {
    mainWindow.webContents.send('clicker-status', { running: false });
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register global shortcut F6 to toggle
  globalShortcut.register('F6', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-from-hotkey');
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopClicker();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('start-clicker', (event, { key, interval }) => {
  startClicker(key, interval);
  return { success: true };
});

ipcMain.handle('stop-clicker', () => {
  stopClicker();
  return { success: true };
});

ipcMain.handle('get-status', () => {
  return { running: isRunning };
});

// Window controls
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
