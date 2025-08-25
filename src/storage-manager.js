const FileOperations = require('./file-operations');
const ConfigManager = require('./config-manager');
const Server = require('./server');

class StorageManager {
  constructor() {
    this.fileOps = new FileOperations();
    this.configMgr = new ConfigManager();
  }

  async loadDisabledServers(appType) {
    const storagePath = this.configMgr.getDisabledServerPath(appType);
    const data = await this.fileOps.loadJSONFile(storagePath);
    
    if (!data || !data.disabledServers) {
      return [];
    }
    
    return data.disabledServers.map(entry => Server.fromDisabledEntry(entry, appType));
  }

  async saveDisabledServers(appType, servers) {
    const storagePath = this.configMgr.getDisabledServerPath(appType);
    const entries = servers.map(server => server.toDisabledEntry());
    
    const data = {
      disabledServers: entries
    };
    
    await this.fileOps.saveJSONFile(storagePath, data);
  }

  async addDisabledServer(appType, server) {
    const existing = await this.loadDisabledServers(appType);
    const uniqueKey = server.getUniqueKey();
    
    // Remove any existing entry with same key
    const filtered = existing.filter(s => s.getUniqueKey() !== uniqueKey);
    
    // Add the new disabled server
    filtered.push(server);
    
    await this.saveDisabledServers(appType, filtered);
  }

  async removeDisabledServer(appType, serverName, projectPath = null) {
    const existing = await this.loadDisabledServers(appType);
    const targetKey = `${appType}:${serverName}:${projectPath || 'global'}`;
    
    const found = existing.find(s => s.getUniqueKey() === targetKey);
    if (!found) {
      throw new Error(`Disabled server not found: ${serverName}`);
    }
    
    const filtered = existing.filter(s => s.getUniqueKey() !== targetKey);
    await this.saveDisabledServers(appType, filtered);
    
    return found;
  }

  async ensureMcpManagerDir() {
    const dir = this.configMgr.getMcpManagerDir();
    const fs = require('fs').promises;
    await fs.mkdir(dir, { recursive: true });
  }
}

module.exports = StorageManager;