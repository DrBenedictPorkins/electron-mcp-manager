# Electron MCP Manager

A desktop application for managing MCP (Model Context Protocol) servers for Claude Code and Claude Desktop applications.

## Project Overview

This Electron application provides a GUI to enable/disable MCP servers, move them between global and project scopes, and manage their configurations safely with atomic operations and rollback protection.

## Architecture

- **Main Process**: `src/main.js` - Electron main process setup
- **Renderer**: `src/renderer/` - Frontend UI (HTML/CSS/JS)
- **Core Modules**:
  - `src/file-operations.js` - Atomic file operations with backup/rollback
  - `src/config-manager.js` - Platform-specific config path resolution
  - `src/server-manager.js` - Server management logic and operations
  - `src/storage-manager.js` - Disabled server storage (~/.mcp-manager/)
  - `src/ipc-handlers.js` - IPC communication between main and renderer

## Key Features

### Server Management
- **Enable/Disable**: Safely toggle MCP servers with rollback protection
- **Move/Copy Operations**: 
  - Global servers → Move to specific project
  - Project servers → Move to global OR copy to other projects
- **Atomic Operations**: All config changes use backup/restore for safety
- **Never edits .claude.json directly** - maintains data integrity

### UI Features
- **Tabbed Interface**: Separate tabs for Claude Code and Claude Desktop
- **Visual Differentiation**: 
  - Global servers: Blue background
  - Project servers: Green background
- **Smart Dropdowns**: 
  - Click scope labels to access move/copy options
  - Search filtering when >6 projects available
  - Proper positioning and overflow handling
- **Real-time Stats**: Shows active/disabled/global/project counts

### Configuration Paths
- **Claude Code**: `~/.claude.json`
- **Claude Desktop**: Platform-specific paths
- **Disabled Storage**: `~/.mcp-manager/disabled-servers.json`

## Development Guidelines

### Critical Rules
- **NEVER add features not explicitly requested**
- **NEVER make assumptions about user needs**
- **Follow instructions literally and precisely**
- **Use subagents for complex tasks**
- **Test between phases**

### File Structure
```
src/
├── main.js                 # Electron main process
├── file-operations.js      # Atomic file operations
├── config-manager.js       # Config path management
├── server-manager.js       # Core server operations
├── storage-manager.js      # Disabled server storage
├── ipc-handlers.js         # IPC communication
└── renderer/
    ├── index.html          # Main UI
    ├── renderer.js         # Frontend logic
    ├── preload.js          # Electron preload script
    └── styles.css          # UI styling
```

## Key Methods

### ServerManager
- `getAllServers()` - Get all servers with current state
- `enableServer(appType, serverName, projectPath)` - Enable with rollback
- `disableServer(appType, serverName, projectPath)` - Disable with backup
- `moveGlobalToProject(serverName, projectPath)` - Move global → project
- `moveProjectToGlobal(serverName, fromProject)` - Move project → global
- `copyProjectToProject(serverName, fromProject, toProject)` - Copy between projects

### IPC Handlers
- `get-all-servers` - Fetch all servers with status
- `toggle-server` - Enable/disable server
- `move-server` - Move server between scopes
- `copy-server` - Copy server to another project
- `get-projects-list` - Get available projects (excludes root "/")
- `open-config-file` - Open config file in default editor

## Testing

Project was developed in phases with incremental testing. Test files have been removed after successful completion.

## Data Safety

- **Atomic Operations**: All config changes are atomic with rollback
- **Backup System**: Automatic backups before any modifications
- **Validation**: Config validation before applying changes
- **Error Recovery**: Automatic rollback on operation failures

## UI Behavior

### Dropdown Operations
- **Global Servers**: Click scope → Show projects to move to
- **Project Servers**: Click scope → Show "Move to Global" + copy options
- **Search**: Auto-enabled when >6 projects, filters by project name
- **Positioning**: Smart positioning to stay within viewport

### Visual Indicators
- **Enabled**: Green left border, full opacity
- **Disabled**: Red left border, reduced opacity
- **Global**: Blue background tint
- **Project**: Green background tint

## Git Workflow

Commit with succinct messages focusing on functionality added. Only commit source files in `src/` directory.

## Build & Run

Standard Electron application:
```bash
npm start          # Development
npm run build      # Production build
```

## Important Notes

- Root path "/" is filtered from project lists (entire disk as project is unrealistic)
- Only enabled servers show move/copy options (disabled servers are locked)
- Project operations only available for Claude Code (Claude Desktop uses global only)
- All operations maintain config file integrity with proper error handling