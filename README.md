# Electron MCP Manager

Desktop GUI for managing MCP (Model Context Protocol) servers for Claude Code and Claude Desktop.

## What it does

- Enable/disable MCP servers with visual toggle switches
- Move servers between global and project scopes
- View and edit configuration files
- Real-time statistics for active/disabled servers
- Separate tabs for Claude Code and Claude Desktop

## Installation

```bash
git clone https://github.com/DrBenedictPorkins/electron-mcp-manager.git
cd electron-mcp-manager
npm install
```

## Usage

**Development:**
```bash
npm start
```

**Build for production:**
```bash
npm run build
```

## Requirements

- Node.js
- macOS (for .claude.json and Claude Desktop config management)

## Features

- **Safe operations**: Atomic config changes with automatic rollback on errors
- **Visual feedback**: Server status indicators and real-time stats
- **Project management**: Move/copy servers between global and project scopes
- **Search and filter**: Quick server lookup in large project lists

## License

MIT