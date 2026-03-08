const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startClicker: (key, interval) => ipcRenderer.invoke('start-clicker', { key, interval }),
  stopClicker: () => ipcRenderer.invoke('stop-clicker'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  updateSettings: (key, interval) => ipcRenderer.invoke('update-settings', { key, interval }),
  saveMacroRecording: (events) => ipcRenderer.invoke('save-macro-recording', { events }),
  getMacroRecording: () => ipcRenderer.invoke('get-macro-recording'),
  startMacroPlayback: (options) => ipcRenderer.invoke('start-macro-playback', options),
  stopMacroPlayback: () => ipcRenderer.invoke('stop-macro-playback'),
  getMacroStatus: () => ipcRenderer.invoke('get-macro-status'),
  updateMacroSettings: (settings) => ipcRenderer.invoke('update-macro-settings', settings),

  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),

  onClickerStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('clicker-status', handler);
    return () => ipcRenderer.removeListener('clicker-status', handler);
  },
  onClickerTick: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('clicker-tick', handler);
    return () => ipcRenderer.removeListener('clicker-tick', handler);
  },
  onClickerError: (callback) => {
    const handler = (event, error) => callback(error);
    ipcRenderer.on('clicker-error', handler);
    return () => ipcRenderer.removeListener('clicker-error', handler);
  },
  onToggleFromHotkey: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('toggle-from-hotkey', handler);
    return () => ipcRenderer.removeListener('toggle-from-hotkey', handler);
  },
  onMacroPlaybackStatus: (callback) => {
    const handler = (event, status) => callback(status);
    ipcRenderer.on('macro-playback-status', handler);
    return () => ipcRenderer.removeListener('macro-playback-status', handler);
  },
  onMacroHotkeyRecordToggle: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('macro-hotkey-record-toggle', handler);
    return () => ipcRenderer.removeListener('macro-hotkey-record-toggle', handler);
  },
  onMacroError: (callback) => {
    const handler = (event, error) => callback(error);
    ipcRenderer.on('macro-error', handler);
    return () => ipcRenderer.removeListener('macro-error', handler);
  },
  onWindowStateChange: (callback) => {
    const handler = (event, state) => callback(state);
    ipcRenderer.on('window-state-changed', handler);
    return () => ipcRenderer.removeListener('window-state-changed', handler);
  },
});
