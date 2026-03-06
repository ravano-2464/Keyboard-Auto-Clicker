const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startClicker: (key, interval) => ipcRenderer.invoke('start-clicker', { key, interval }),
  stopClicker: () => ipcRenderer.invoke('stop-clicker'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  updateSettings: (key, interval) => ipcRenderer.invoke('update-settings', { key, interval }),

  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

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
});
