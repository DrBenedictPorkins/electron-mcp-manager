# Electron MCP Manager

Desktop GUI for managing MCP (Model Context Protocol) servers for Claude Code and Claude Desktop.

## What It Does

- Enable/disable MCP servers with visual toggles
- Move servers between global and project scopes  
- View and edit server configurations with collapsible blocks
- Real-time statistics and visual server status indicators
- Safe atomic operations with automatic rollback on errors

## Key Features

- **Server Management**: Toggle, move, and copy servers between scopes
- **Collapsible Configs**: Individual and group toggles for configuration blocks
- **Visual Interface**: Color-coded cards (blue=global, green=project) with status indicators
- **Smart Dropdowns**: Move/copy operations with search filtering for large project lists  
- **Safe Operations**: Atomic config changes with automatic backup/rollback

## Development Rules

- Use subagents for complex tasks
- Never add unrequested features  
- Follow instructions precisely
- Test incrementally

## Build & Run

```bash
npm start          # Development
npm run build      # Production build
```

## Technical Notes

- Uses atomic config operations with rollback protection
- Manages `~/.claude.json` for Claude Code and platform-specific paths for Claude Desktop
- Filters root path "/" from project lists
- Only enabled servers show move/copy operations