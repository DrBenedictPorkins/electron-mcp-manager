# MCP Server Manager - Electron Implementation Design

## Overview

This document provides comprehensive implementation instructions for creating an Electron-based MCP (Model Context Protocol) Server Manager. The application enables users to enable/disable MCP servers for Claude Code and Claude Desktop by manipulating JSON configuration files and maintaining a disabled server storage system.

**Critical Requirement**: The application must maintain full compatibility with existing configuration files and never lose server data during enable/disable operations.

## 1. Configuration File Locations and Structures

### 1.1 Claude Code Configuration

**File Path**: `~/.claude.json`

**Complete JSON Structure**:
```json
{
  "mcpServers": {
    "global-server-name": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "secret-value",
        "DEBUG": "true"
      },
      "cwd": "/optional/working/directory"
    }
  },
  "projects": {
    "/absolute/path/to/project": {
      "mcpServers": {
        "project-specific-server": {
          "command": "python",
          "args": ["server.py"],
          "env": {
            "PROJECT_ROOT": "/path/to/project"
          }
        }
      }
    }
  }
}
```

**Key Points**:
- `mcpServers` section contains global servers
- `projects` section contains project-specific servers (only for Claude Code)
- Each server requires a `command` field
- `args` is optional array of command arguments
- `env` is optional object of environment variables
- `cwd` is optional working directory

### 1.2 Claude Desktop Configuration

**File Paths by Platform**:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**JSON Structure** (simpler than Claude Code):
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

**Key Points**:
- Only has global `mcpServers` section
- No project-specific servers
- Same server structure as Claude Code global servers

## 2. Disabled Server Storage System

### 2.1 Storage Location and Files

**Directory**: `~/.mcp-manager/`

**Files**:
- `claude-code-disabled.json` - Stores disabled Claude Code servers
- `claude-desktop-disabled.json` - Stores disabled Claude Desktop servers

### 2.2 Disabled Server Storage Format

```json
{
  "disabledServers": [
    {
      "name": "server-name",
      "config": {
        "command": "node",
        "args": ["server.js"],
        "env": {"KEY": "value"}
      },
      "disabledAt": "2024-01-15T10:30:00.000Z",
      "originalApp": "claude-code",
      "projectPath": "/path/to/project",
      "projectName": "MyProject"
    }
  ]
}
```

**Field Descriptions**:
- `name`: Original server name
- `config`: Complete original server configuration
- `disabledAt`: ISO timestamp when server was disabled
- `originalApp`: Either "claude-code" or "claude-desktop"
- `projectPath`: Absolute path for project servers, `null` for global servers
- `projectName`: Human-readable project name (derived from path), `null` for global servers

## 3. Critical Enable/Disable Mechanism

### 3.1 Disable Server Operation

**Input**: `(appType, serverName, projectPath?)`

**Steps**:

1. **Load Active Configuration**
   ```javascript
   const configPath = getConfigPath(appType);
   const config = await loadJSONFile(configPath);
   ```

2. **Locate and Extract Server**
   - For global servers: Look in `config.mcpServers[serverName]`
   - For project servers: Look in `config.projects[projectPath].mcpServers[serverName]`
   - **CRITICAL**: Store complete server config before removal

3. **Remove from Active Config**
   - Delete server from appropriate section
   - **CRITICAL**: Use atomic write to save updated config

4. **Add to Disabled Storage**
   ```javascript
   const disabledEntry = {
     name: serverName,
     config: originalServerConfig, // Complete config from step 2
     disabledAt: new Date().toISOString(),
     originalApp: appType,
     projectPath: projectPath || null,
     projectName: projectPath ? path.basename(projectPath) : null
   };
   ```

5. **Rollback on Failure**
   - If storage save fails, restore server to active config
   - Always maintain data integrity

### 3.2 Enable Server Operation

**Input**: `(appType, serverName, projectPath?)`

**Steps**:

1. **Load Disabled Storage**
   ```javascript
   const disabledServers = await loadDisabledServers(appType);
   ```

2. **Find and Remove from Disabled Storage**
   - Locate server by name and projectPath match
   - Extract complete server entry
   - Remove from disabled storage array

3. **Load Active Configuration**
   ```javascript
   const configPath = getConfigPath(appType);
   let config = await loadJSONFile(configPath);
   if (!config) config = { mcpServers: {} }; // Handle missing file
   ```

4. **Add to Active Config**
   - For global servers: `config.mcpServers[serverName] = serverConfig`
   - For project servers:
     ```javascript
     if (!config.projects) config.projects = {};
     if (!config.projects[projectPath]) {
       config.projects[projectPath] = { mcpServers: {} };
     }
     config.projects[projectPath].mcpServers[serverName] = serverConfig;
     ```

5. **Rollback on Failure**
   - If config save fails, restore server to disabled storage
   - Always preserve server data

## 4. File Operations Architecture

### 4.1 Safe JSON File Operations

```javascript
class FileOperations {
  async loadJSONFile(filePath) {
    try {
      if (!await fs.access(filePath).then(() => true).catch(() => false)) {
        return null; // File doesn't exist
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load ${filePath}: ${error.message}`);
    }
  }

  async saveJSONFile(filePath, data) {
    // Create backup if file exists
    if (await this.fileExists(filePath)) {
      await this.createBackup(filePath);
    }

    // Atomic write operation
    const tempPath = `${filePath}.tmp`;
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
      
      // Verify written file is valid JSON
      await this.loadJSONFile(tempPath);
      
      // Atomic rename
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file
      try { await fs.unlink(tempPath); } catch {}
      throw error;
    }
  }

  async createBackup(filePath) {
    const backupPath = `${filePath}.backup.${this.getDateString()}`;
    try {
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      console.warn(`Backup failed: ${error.message}`);
      // Non-fatal - continue with operation
    }
  }

  getDateString() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
```

### 4.2 Configuration Path Resolution

```javascript
const os = require('os');
const path = require('path');

function getConfigPath(appType) {
  const homeDir = os.homedir();
  
  if (appType === 'claude-code') {
    return path.join(homeDir, '.claude.json');
  } else if (appType === 'claude-desktop') {
    const platform = os.platform();
    if (platform === 'darwin') {
      return path.join(homeDir, 'Library/Application Support/Claude/claude_desktop_config.json');
    } else if (platform === 'win32') {
      return path.join(process.env.APPDATA || path.join(homeDir, 'AppData/Roaming'), 'Claude/claude_desktop_config.json');
    } else {
      return path.join(homeDir, '.config/claude/claude_desktop_config.json');
    }
  }
  
  throw new Error(`Unknown app type: ${appType}`);
}

function getDisabledServerPath(appType) {
  return path.join(os.homedir(), '.mcp-manager', `${appType}-disabled.json`);
}
```

## 5. Data Combining Logic

### 5.1 Server Data Structure

```javascript
class Server {
  constructor(data) {
    this.name = data.name;
    this.config = data.config;
    this.enabled = data.enabled;
    this.appType = data.appType; // 'claude-code' | 'claude-desktop'
    this.scope = data.scope; // 'global' | 'project'
    this.projectPath = data.projectPath; // null for global servers
    this.projectName = data.projectName; // null for global servers
    this.type = this.detectServerType();
  }

  detectServerType() {
    const command = this.config.command?.toLowerCase() || '';
    if (command.includes('node') || command.endsWith('.js')) return 'nodejs';
    if (command.includes('python') || command.endsWith('.py')) return 'python';
    return 'binary';
  }

  getUniqueKey() {
    return `${this.appType}:${this.name}:${this.projectPath || 'global'}`;
  }
}
```

### 5.2 Combining Active and Disabled Servers

```javascript
async function getAllServers() {
  const servers = [];

  // Load Claude Code servers
  const claudeCodeServers = await loadClaudeCodeServers();
  const claudeCodeDisabled = await loadDisabledServers('claude-code');
  
  // Load Claude Desktop servers
  const claudeDesktopServers = await loadClaudeDesktopServers();
  const claudeDesktopDisabled = await loadDisabledServers('claude-desktop');

  // Combine and deduplicate
  const allActive = [...claudeCodeServers, ...claudeDesktopServers];
  const allDisabled = [...claudeCodeDisabled, ...claudeDesktopDisabled];

  // Create unified server list
  const serverMap = new Map();
  
  // Add active servers
  allActive.forEach(server => {
    serverMap.set(server.getUniqueKey(), server);
  });

  // Add disabled servers (only if not already present)
  allDisabled.forEach(server => {
    if (!serverMap.has(server.getUniqueKey())) {
      serverMap.set(server.getUniqueKey(), server);
    }
  });

  return Array.from(serverMap.values()).sort((a, b) => {
    // Sort by: app type, scope (global first), project name, server name
    if (a.appType !== b.appType) return a.appType.localeCompare(b.appType);
    if (a.scope !== b.scope) return a.scope === 'global' ? -1 : 1;
    if (a.projectName !== b.projectName) {
      return (a.projectName || '').localeCompare(b.projectName || '');
    }
    return a.name.localeCompare(b.name);
  });
}
```

## 6. Project-Specific Server Handling

### 6.1 Loading Project Servers (Claude Code Only)

```javascript
async function loadClaudeCodeServers() {
  const configPath = getConfigPath('claude-code');
  const config = await loadJSONFile(configPath);
  if (!config) return [];

  const servers = [];

  // Load global servers
  const globalServers = config.mcpServers || {};
  Object.entries(globalServers).forEach(([name, serverConfig]) => {
    servers.push(new Server({
      name,
      config: serverConfig,
      enabled: true,
      appType: 'claude-code',
      scope: 'global',
      projectPath: null,
      projectName: null
    }));
  });

  // Load project servers
  const projects = config.projects || {};
  Object.entries(projects).forEach(([projectPath, projectConfig]) => {
    const projectServers = projectConfig.mcpServers || {};
    Object.entries(projectServers).forEach(([name, serverConfig]) => {
      servers.push(new Server({
        name,
        config: serverConfig,
        enabled: true,
        appType: 'claude-code',
        scope: 'project',
        projectPath,
        projectName: path.basename(projectPath)
      }));
    });
  });

  return servers;
}
```

### 6.2 Preserving Project Association

When disabling a project server, the `projectPath` and `projectName` must be preserved in the disabled storage. When re-enabling, the server must be restored to the exact same project section, not to global servers.

## 7. Main Process Architecture

### 7.1 Module Structure

```
src/main/
├── config-manager.js     # Configuration file operations
├── server-manager.js     # High-level server management
├── storage-manager.js    # Disabled server storage
├── file-operations.js    # Low-level file operations
└── ipc-handlers.js       # IPC communication
```

### 7.2 IPC Communication Pattern

```javascript
// main.js
const { ipcMain } = require('electron');

ipcMain.handle('get-all-servers', async () => {
  try {
    return await serverManager.getAllServers();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('toggle-server', async (event, serverName, appType, projectPath, enable) => {
  try {
    if (enable) {
      await serverManager.enableServer(appType, serverName, projectPath);
    } else {
      await serverManager.disableServer(appType, serverName, projectPath);
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('open-config-file', async (event, appType) => {
  const { shell } = require('electron');
  const configPath = getConfigPath(appType);
  return await shell.openPath(configPath);
});
```

### 7.3 Error Handling Strategy

```javascript
class MCPManagerError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Usage
throw new MCPManagerError(
  'Failed to disable server',
  'DISABLE_FAILED',
  { serverName, appType, originalError: error.message }
);
```

## 8. Renderer Process Requirements

### 8.1 Required IPC Calls

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAllServers: () => ipcRenderer.invoke('get-all-servers'),
  toggleServer: (name, appType, projectPath, enable) => 
    ipcRenderer.invoke('toggle-server', name, appType, projectPath, enable),
  openConfigFile: (appType) => ipcRenderer.invoke('open-config-file', appType),
  refreshData: () => ipcRenderer.invoke('get-all-servers')
});
```

### 8.2 Basic UI Components

**Required Elements**:
1. **Tab Navigation**: Switch between Claude Code and Claude Desktop
2. **Stats Display**: Show server counts (total, active, disabled, global, project)
3. **Config File Info**: Display config file path and existence
4. **Server Cards**: Show each server with enable/disable toggle
5. **Server Details**: Expandable sections for command, env vars, raw config

**Minimal HTML Structure**:
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
    
    <main id="main-content">
      <div id="stats-container"></div>
      <div id="config-info"></div>
      <div id="servers-container"></div>
    </main>
  </div>
  
  <script src="renderer.js"></script>
</body>
</html>
```

## 9. Critical Implementation Notes

### 9.1 Data Integrity Requirements

1. **Never lose server data**: Every enable/disable operation must preserve complete server configuration
2. **Atomic operations**: Use atomic file writes to prevent partial updates
3. **Rollback capability**: If any step fails, rollback to previous state
4. **Backup system**: Create daily backups of configuration files before modification

### 9.2 Compatibility Requirements

1. **Existing config compatibility**: Must work with existing Claude Code/Desktop configurations
2. **Cross-platform paths**: Handle different config file locations per platform
3. **JSON structure preservation**: Don't modify unrelated parts of config files

### 9.3 Error Recovery

1. **Missing files**: Handle gracefully, create empty structures as needed
2. **Corrupted JSON**: Provide clear error messages, suggest using backups
3. **Permission errors**: Inform user about file access issues
4. **Partial operations**: Never leave the system in an inconsistent state

### 9.4 Security Considerations

1. **Environment variable masking**: Hide sensitive values in UI (keys, tokens, secrets)
2. **File permissions**: Respect existing file permissions
3. **Input validation**: Validate server names and paths before operations

## 10. Implementation Checklist

### Phase 1: Core File Operations
- [ ] Implement safe JSON file loading with error handling
- [ ] Implement atomic JSON file saving with backup creation
- [ ] Create platform-specific config path resolution
- [ ] Test file operations with missing/corrupted files

### Phase 2: Storage System
- [ ] Implement disabled server storage format
- [ ] Create storage directory management
- [ ] Implement disabled server add/remove operations
- [ ] Test storage system with various server types

### Phase 3: Server Management
- [ ] Implement server disable operation with rollback
- [ ] Implement server enable operation with rollback
- [ ] Test with both global and project-specific servers
- [ ] Verify data preservation in all scenarios

### Phase 4: Data Integration
- [ ] Implement server data combining logic
- [ ] Handle deduplication of active vs disabled servers
- [ ] Implement proper sorting and grouping
- [ ] Test with complex configurations

### Phase 5: Main Process
- [ ] Set up IPC handlers for all operations
- [ ] Implement comprehensive error handling
- [ ] Add logging for troubleshooting
- [ ] Test IPC communication

### Phase 6: Renderer Process
- [ ] Create basic functional UI
- [ ] Implement server card rendering
- [ ] Add toggle functionality
- [ ] Test UI with various data states

This design document provides the complete specification needed to implement a fully functional MCP Server Manager in Electron. The implementation must prioritize data integrity and compatibility with existing systems above all other concerns.