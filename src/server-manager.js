const FileOperations = require('./file-operations');
const ConfigManager = require('./config-manager');
const StorageManager = require('./storage-manager');
const Server = require('./server');
const path = require('path');

class ServerManager {
  constructor() {
    this.fileOps = new FileOperations();
    this.configMgr = new ConfigManager();
    this.storage = new StorageManager();
  }

  async loadActiveServers(appType) {
    const configPath = this.configMgr.getConfigPath(appType);
    const config = await this.fileOps.loadJSONFile(configPath);
    
    if (!config) return [];
    
    const servers = [];
    
    // Load global servers
    const globalServers = config.mcpServers || {};
    Object.entries(globalServers).forEach(([name, serverConfig]) => {
      servers.push(new Server({
        name,
        config: serverConfig,
        enabled: true,
        appType,
        scope: 'global',
        projectPath: null,
        projectName: null
      }));
    });
    
    // Load project servers (Claude Code only)
    if (appType === 'claude-code' && config.projects) {
      Object.entries(config.projects).forEach(([projectPath, projectConfig]) => {
        const projectServers = projectConfig.mcpServers || {};
        Object.entries(projectServers).forEach(([name, serverConfig]) => {
          servers.push(new Server({
            name,
            config: serverConfig,
            enabled: true,
            appType,
            scope: 'project',
            projectPath,
            projectName: path.basename(projectPath)
          }));
        });
      });
    }
    
    return servers;
  }

  async getAllServers() {
    const servers = [];
    
    // Load active servers
    const claudeCodeActive = await this.loadActiveServers('claude-code');
    const claudeDesktopActive = await this.loadActiveServers('claude-desktop');
    
    // Load disabled servers
    const claudeCodeDisabled = await this.storage.loadDisabledServers('claude-code');
    const claudeDesktopDisabled = await this.storage.loadDisabledServers('claude-desktop');
    
    // Combine all servers
    const allServers = [
      ...claudeCodeActive,
      ...claudeDesktopActive,
      ...claudeCodeDisabled,
      ...claudeDesktopDisabled
    ];
    
    // Deduplicate by unique key
    const serverMap = new Map();
    allServers.forEach(server => {
      serverMap.set(server.getUniqueKey(), server);
    });
    
    return Array.from(serverMap.values()).sort((a, b) => {
      if (a.appType !== b.appType) return a.appType.localeCompare(b.appType);
      if (a.scope !== b.scope) return a.scope === 'global' ? -1 : 1;
      if (a.projectName !== b.projectName) {
        return (a.projectName || '').localeCompare(b.projectName || '');
      }
      return a.name.localeCompare(b.name);
    });
  }

  async disableServer(appType, serverName, projectPath = null) {
    const configPath = this.configMgr.getConfigPath(appType);
    let config = await this.fileOps.loadJSONFile(configPath);
    
    if (!config) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    
    let serverConfig;
    let originalConfig = JSON.parse(JSON.stringify(config)); // Deep copy for rollback
    
    try {
      // Find and extract server
      if (projectPath) {
        // Project server
        if (!config.projects || !config.projects[projectPath] || 
            !config.projects[projectPath].mcpServers || 
            !config.projects[projectPath].mcpServers[serverName]) {
          throw new Error(`Project server not found: ${serverName} in ${projectPath}`);
        }
        
        serverConfig = config.projects[projectPath].mcpServers[serverName];
        delete config.projects[projectPath].mcpServers[serverName];
        
        // Clean up empty structures
        if (Object.keys(config.projects[projectPath].mcpServers).length === 0) {
          delete config.projects[projectPath];
        }
        if (Object.keys(config.projects).length === 0) {
          delete config.projects;
        }
      } else {
        // Global server
        if (!config.mcpServers || !config.mcpServers[serverName]) {
          throw new Error(`Global server not found: ${serverName}`);
        }
        
        serverConfig = config.mcpServers[serverName];
        delete config.mcpServers[serverName];
      }
      
      // Save updated config
      await this.fileOps.saveJSONFile(configPath, config);
      
      // Create disabled server entry
      const server = new Server({
        name: serverName,
        config: serverConfig,
        enabled: false,
        appType,
        scope: projectPath ? 'project' : 'global',
        projectPath,
        projectName: projectPath ? path.basename(projectPath) : null
      });
      
      // Add to disabled storage
      await this.storage.addDisabledServer(appType, server);
      
    } catch (error) {
      // Rollback on failure
      try {
        await this.fileOps.saveJSONFile(configPath, originalConfig);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
      throw error;
    }
  }

  async enableServer(appType, serverName, projectPath = null) {
    // Find and remove from disabled storage
    const disabledServer = await this.storage.removeDisabledServer(appType, serverName, projectPath);
    
    const configPath = this.configMgr.getConfigPath(appType);
    let config = await this.fileOps.loadJSONFile(configPath);
    
    if (!config) {
      config = { mcpServers: {} };
    }
    
    let originalDisabledServers;
    
    try {
      // Add to active config
      if (projectPath) {
        // Project server
        if (!config.projects) config.projects = {};
        if (!config.projects[projectPath]) {
          config.projects[projectPath] = { mcpServers: {} };
        }
        config.projects[projectPath].mcpServers[serverName] = disabledServer.config;
      } else {
        // Global server
        if (!config.mcpServers) config.mcpServers = {};
        config.mcpServers[serverName] = disabledServer.config;
      }
      
      // Save updated config
      await this.fileOps.saveJSONFile(configPath, config);
      
    } catch (error) {
      // Rollback - add server back to disabled storage
      try {
        await this.storage.addDisabledServer(appType, disabledServer);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
      throw error;
    }
  }
}

module.exports = ServerManager;