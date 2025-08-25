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

    ipcMain.handle('get-projects-list', async () => {
      try {
        const configPath = this.serverManager.configMgr.getConfigPath('claude-code');
        const config = await this.serverManager.fileOps.loadJSONFile(configPath);
        
        if (!config || !config.projects) {
          return { success: true, data: [] };
        }
        
        const projects = Object.keys(config.projects)
          .filter(projectPath => projectPath !== '/')
          .map(projectPath => ({
            path: projectPath,
            name: require('path').basename(projectPath)
          }));
        
        return { success: true, data: projects };
      } catch (error) {
        console.error('get-projects-list error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('move-server', async (event, serverName, fromScope, fromProject, toScope, toProject) => {
      try {
        if (fromScope === 'global' && toScope === 'project') {
          // Move from global to project
          await this.serverManager.moveGlobalToProject(serverName, toProject);
        } else if (fromScope === 'project' && toScope === 'global') {
          // Move from project to global
          await this.serverManager.moveProjectToGlobal(serverName, fromProject);
        }
        return { success: true };
      } catch (error) {
        console.error('move-server error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('copy-server', async (event, serverName, fromProject, toProject) => {
      try {
        // Copy from one project to another
        await this.serverManager.copyProjectToProject(serverName, fromProject, toProject);
        return { success: true };
      } catch (error) {
        console.error('copy-server error:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

module.exports = IPCHandlers;