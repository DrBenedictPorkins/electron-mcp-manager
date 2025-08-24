const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Future API methods will go here
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform
});