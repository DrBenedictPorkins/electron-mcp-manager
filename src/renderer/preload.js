const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Server management
  getAllServers: () => ipcRenderer.invoke('get-all-servers'),
  toggleServer: (name, appType, projectPath, enable) => 
    ipcRenderer.invoke('toggle-server', name, appType, projectPath, enable),
  
  // Config file operations
  openConfigFile: (appType) => ipcRenderer.invoke('open-config-file', appType),
  getConfigInfo: (appType) => ipcRenderer.invoke('get-config-info', appType),
  
  // System info
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform
});