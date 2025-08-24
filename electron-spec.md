# MCP Server Manager - Electron Implementation Specification

## Overview

Convert the existing Python Streamlit MCP Server Manager into a native Electron desktop application. This is a single-user home application focused on functionality over elaborate architecture. The application manages MCP (Model Context Protocol) servers for Claude Code and Claude Desktop by reading/writing JSON configuration files.

## Core Requirements

### Application Architecture
- **Main Process**: Single Node.js main process handling file I/O and configuration management
- **Renderer Process**: Single HTML/CSS/JavaScript window for the UI
- **IPC Communication**: Simple electron IPC between main and renderer for file operations
- **No Framework Dependencies**: Pure JavaScript/CSS/HTML - no React, Vue, or other frameworks
- **Single Window Application**: One main window, no multi-window complexity

### Configuration File Management

#### Claude Code Configuration
- **File Path**: `~/.claude.json`
- **Structure**: 
  ```json
  {
    "mcpServers": {
      "server-name": {
        "command": "string",
        "args": ["array", "of", "strings"],
        "env": {"KEY": "value"},
        "cwd": "optional-working-directory"
      }
    },
    "projects": {
      "/project/path": {
        "mcpServers": {
          "project-server": { /* same structure as global */ }
        }
      }
    }
  }
  ```

#### Claude Desktop Configuration
- **File Path**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS only)
- **Structure**: 
  ```json
  {
    "mcpServers": {
      "server-name": {
        "command": "string",
        "args": ["array"],
        "env": {"KEY": "value"}
      }
    }
  }
  ```

#### Disabled Server Storage
- **Location**: `~/.mcp-manager/`
- **Files**: 
  - `claude-code-disabled.json`
  - `claude-desktop-disabled.json`
- **Structure**: 
  ```json
  {
    "server-name": {
      "config": { /* original server config */ },
      "disabledAt": "ISO timestamp",
      "originalApp": "claude-code|claude-desktop",
      "projectPath": "/path/to/project|null",
      "projectName": "project-name|null"
    }
  }
  ```

### Main Process Implementation

#### File System Operations
```javascript
// Core file operations using Node.js fs
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ConfigManager {
  // File paths
  getClaudeCodePath() { return path.join(os.homedir(), '.claude.json'); }
  getClaudeDesktopPath() { return path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'); }
  getStorageDir() { return path.join(os.homedir(), '.mcp-manager'); }
  
  // Basic file operations
  async readConfig(filePath) { /* JSON.parse with error handling */ }
  async writeConfig(filePath, data) { /* JSON.stringify with atomic write */ }
  async createBackup(filePath) { /* Copy file with timestamp */ }
}
```

#### Server Management
```javascript
class ServerManager {
  // Parse servers from config files
  async getAllServers() {
    // Return array of server objects:
    // {
    //   name: string,
    //   config: object,
    //   enabled: boolean,
    //   scope: 'global'|'project',
    //   app: 'claude-code'|'claude-desktop',
    //   projectPath: string|null,
    //   projectName: string|null
    // }
  }
  
  // Toggle operations
  async enableServer(serverName, app, projectPath = null) { /* Move from disabled to active */ }
  async disableServer(serverName, app, projectPath = null) { /* Move from active to disabled */ }
}
```

#### IPC Handlers
```javascript
// Main process IPC handlers
ipcMain.handle('get-all-servers', async () => { /* Return server list */ });
ipcMain.handle('toggle-server', async (event, serverName, app, projectPath) => { /* Enable/disable */ });
ipcMain.handle('open-config-file', async (event, app) => { /* Shell.openPath() */ });
ipcMain.handle('refresh-data', async () => { /* Reload all configs */ });
```

### Renderer Process Implementation

#### Data Models
```javascript
// Client-side server representation
class Server {
  constructor(data) {
    this.name = data.name;
    this.config = data.config;
    this.enabled = data.enabled;
    this.scope = data.scope; // 'global' | 'project'
    this.app = data.app; // 'claude-code' | 'claude-desktop'
    this.projectPath = data.projectPath;
    this.projectName = data.projectName;
    this.type = this.detectType(); // 'python' | 'nodejs' | 'binary'
  }
  
  detectType() { /* Detect from command */ }
  getDisplayCommand() { /* Format command + args */ }
  getSensitiveEnvVars() { /* Identify secrets for masking */ }
}
```

#### UI Controller
```javascript
class UIController {
  constructor() {
    this.servers = [];
    this.currentTab = 'claude-code';
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    await this.loadServers();
    this.render();
  }
  
  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => this.refreshData());
  }
  
  async loadServers() {
    this.servers = await window.electronAPI.getAllServers();
  }
  
  render() {
    this.renderStats();
    this.renderServers();
  }
  
  renderStats() { /* Update server count displays */ }
  renderServers() { /* Generate server cards HTML */ }
  
  async toggleServer(serverName, app, projectPath) {
    await window.electronAPI.toggleServer(serverName, app, projectPath);
    await this.loadServers();
    this.render();
  }
}
```

### UI Implementation

#### HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MCP Server Manager</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <header>
      <h1>MCP Server Manager</h1>
      <button id="refresh-btn">Refresh</button>
    </header>
    
    <nav class="tabs">
      <button class="tab-button active" data-tab="claude-code">Claude Code</button>
      <button class="tab-button" data-tab="claude-desktop">Claude Desktop</button>
    </nav>
    
    <main>
      <div class="stats-container">
        <!-- Server count stats -->
      </div>
      
      <div class="config-info">
        <!-- Configuration file info -->
      </div>
      
      <div class="servers-container">
        <!-- Server cards -->
      </div>
    </main>
  </div>
  
  <script src="renderer.js"></script>
</body>
</html>
```

#### Terminal-Style CSS
```css
/* Terminal aesthetic */
body {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  background-color: #000;
  color: #00ff00;
  margin: 0;
  padding: 0;
}

.server-card {
  background-color: #111;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 16px;
  margin: 8px 0;
}

.server-card.disabled {
  color: #666;
  border-color: #222;
}

/* Status indicators */
.status-active { color: #00ff00; }
.status-disabled { color: #ffaa00; }
.status-error { color: #ff0000; }
```

### File Structure
```
mcp-manager-electron/
├── package.json              # Electron app configuration
├── main.js                   # Main process entry point
├── src/
│   ├── main/
│   │   ├── config-manager.js # Configuration file operations
│   │   ├── server-manager.js # Server management logic
│   │   └── ipc-handlers.js   # IPC communication handlers
│   └── renderer/
│       ├── index.html        # Main window HTML
│       ├── styles.css        # Terminal-style CSS
│       ├── renderer.js       # UI controller and logic
│       └── preload.js        # Context bridge for security
└── README.md
```

### Error Handling Strategy

#### File Operations
```javascript
// Basic error handling - log and show user message
async function safeFileOperation(operation, fallbackMessage) {
  try {
    return await operation();
  } catch (error) {
    console.error(`File operation failed: ${error.message}`);
    showUserMessage(fallbackMessage);
    return null;
  }
}
```

#### Config Validation
```javascript
function validateConfig(config) {
  // Basic structure validation
  if (!config || typeof config !== 'object') return false;
  if (!config.mcpServers || typeof config.mcpServers !== 'object') return false;
  return true;
}
```

### Implementation Details

#### Atomic File Operations
```javascript
async function atomicWrite(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}
```

#### Environment Variable Masking
```javascript
function maskSensitiveValue(key, value) {
  const sensitivePatterns = ['key', 'token', 'secret', 'password', 'auth'];
  const isSensitive = sensitivePatterns.some(pattern => 
    key.toLowerCase().includes(pattern)
  );
  
  if (isSensitive && value.length > 8) {
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }
  return value;
}
```

#### Project Path Resolution
```javascript
function resolveProjectPath(projectPath) {
  if (projectPath.startsWith('~')) {
    return path.join(os.homedir(), projectPath.substring(1));
  }
  return projectPath;
}
```

### Security Context Bridge
```javascript
// preload.js - Secure IPC communication
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAllServers: () => ipcRenderer.invoke('get-all-servers'),
  toggleServer: (name, app, projectPath) => ipcRenderer.invoke('toggle-server', name, app, projectPath),
  openConfigFile: (app) => ipcRenderer.invoke('open-config-file', app),
  refreshData: () => ipcRenderer.invoke('refresh-data')
});
```

### Package Configuration
```json
{
  "name": "mcp-server-manager",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

## Key Implementation Notes

1. **Single User Focus**: All file paths assume single macOS user, no multi-user considerations
2. **Home Use Only**: No network features, authentication, or multi-machine synchronization
3. **Basic Error Handling**: Console logging with user notifications, no elaborate retry mechanisms
4. **No Testing**: Implementation focused on functionality, not test coverage
5. **Simple Architecture**: Avoid over-engineering for a single-purpose home tool
6. **Terminal Aesthetic**: Maintain the terminal-style UI that was preferred from prototypes
7. **Atomic Operations**: Ensure config file integrity with atomic writes
8. **Project Context**: Preserve project association when enabling/disabling servers

This specification focuses on the inner workings and implementation details needed to create a functional Electron version of the MCP Server Manager while maintaining simplicity and single-user home usage patterns.