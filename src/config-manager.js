const os = require('os');
const path = require('path');

class ConfigManager {
  getClaudeCodeConfigPath() {
    return path.join(os.homedir(), '.claude.json');
  }

  getClaudeDesktopConfigPath() {
    const homeDir = os.homedir();
    const platform = os.platform();
    
    if (platform === 'darwin') {
      return path.join(homeDir, 'Library/Application Support/Claude/claude_desktop_config.json');
    } else if (platform === 'win32') {
      return path.join(process.env.APPDATA || path.join(homeDir, 'AppData/Roaming'), 'Claude/claude_desktop_config.json');
    } else {
      return path.join(homeDir, '.config/claude/claude_desktop_config.json');
    }
  }

  getConfigPath(appType) {
    if (appType === 'claude-code') {
      return this.getClaudeCodeConfigPath();
    } else if (appType === 'claude-desktop') {
      return this.getClaudeDesktopConfigPath();
    }
    throw new Error(`Unknown app type: ${appType}`);
  }

  getDisabledServerPath(appType) {
    return path.join(os.homedir(), '.mcp-manager', `${appType}-disabled.json`);
  }

  getMcpManagerDir() {
    return path.join(os.homedir(), '.mcp-manager');
  }
}

module.exports = ConfigManager;