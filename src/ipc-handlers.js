const { ipcMain, shell } = require('electron');
const ServerManager = require('./server-manager');

class IPCHandlers {
  constructor() {
    this.serverManager = new ServerManager();
    this.setupHandlers();
  }

  setupHandlers() {
    ipcMain.handle('get-all-servers', async () => {
      try {
        const servers = await this.serverManager.getAllServers();
        return { success: true, data: servers };
      } catch (error) {
        console.error('get-all-servers error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('toggle-server', async (event, serverName, appType, projectPath, enable) => {
      try {
        if (enable) {
          await this.serverManager.enableServer(appType, serverName, projectPath);
        } else {
          await this.serverManager.disableServer(appType, serverName, projectPath);
        }
        return { success: true };
      } catch (error) {
        console.error('toggle-server error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('open-config-file', async (event, appType) => {
      try {
        const configPath = this.serverManager.configMgr.getConfigPath(appType);
        await shell.openPath(configPath);
        return { success: true };
      } catch (error) {
        console.error('open-config-file error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-config-info', async (event, appType) => {
      try {
        const configPath = this.serverManager.configMgr.getConfigPath(appType);
        const exists = await this.serverManager.fileOps.fileExists(configPath);
        return { 
          success: true, 
          data: { 
            path: configPath, 
            exists 
          } 
        };
      } catch (error) {
        console.error('get-config-info error:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

module.exports = IPCHandlers;