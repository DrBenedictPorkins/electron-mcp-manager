class Server {
  constructor(data) {
    this.name = data.name;
    this.config = data.config;
    this.enabled = data.enabled;
    this.appType = data.appType; // 'claude-code' | 'claude-desktop'
    this.scope = data.scope; // 'global' | 'project'
    this.projectPath = data.projectPath || null;
    this.projectName = data.projectName || null;
    this.type = this.detectServerType();
  }

  detectServerType() {
    const command = this.config.command?.toLowerCase() || '';
    if (command.includes('node') || command.includes('.js')) return 'nodejs';
    if (command.includes('python') || command.includes('.py')) return 'python';
    return 'binary';
  }

  getUniqueKey() {
    return `${this.appType}:${this.name}:${this.projectPath || 'global'}`;
  }

  toDisabledEntry() {
    return {
      name: this.name,
      config: this.config,
      disabledAt: new Date().toISOString(),
      projectPath: this.projectPath,
      projectName: this.projectName
    };
  }

  static fromDisabledEntry(entry, appType) {
    return new Server({
      name: entry.name,
      config: entry.config,
      enabled: false,
      appType: appType,
      scope: entry.projectPath ? 'project' : 'global',
      projectPath: entry.projectPath,
      projectName: entry.projectName
    });
  }
}

module.exports = Server;