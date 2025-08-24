# Requirements Document

## Introduction

The MCP Server Manager is a native macOS Electron desktop application that provides a simple, basic graphical interface for managing MCP (Model Context Protocol) servers used by Claude Code and Claude Desktop applications. This single-user home application focuses on essential functionality over elaborate architecture, converting the existing Python Streamlit prototype into a lightweight desktop tool that manages MCP server configurations through JSON file manipulation.

The application serves macOS users who need to enable, disable, and monitor MCP servers across both global and project-specific scopes without requiring complex UI interactions or advanced features.

## Alignment with Product Vision

This application supports the home automation and developer productivity goals by providing a straightforward desktop tool for managing MCP server configurations. It follows the KISS (Keep It Simple, Stupid) and YAGNI (You Aren't Gonna Need It) principles, delivering only essential features needed for MCP server management without unnecessary complexity.

## Requirements

### Requirement 1: Configuration File Management

**User Story:** As a macOS user, I want the application to manage my MCP server configurations stored in JSON files, so that I can control which servers are available to Claude Code and Claude Desktop applications.

#### Acceptance Criteria

1. WHEN the application starts THEN it SHALL read configurations from `~/.claude.json` (Claude Code) and `~/Library/Application Support/Claude/claude_desktop_config.json` (Claude Desktop)
2. WHEN reading configuration files THEN the application SHALL handle missing files gracefully by treating them as empty configurations
3. WHEN writing configuration changes THEN the application SHALL use atomic file operations to prevent corruption during concurrent access
4. IF a configuration file is malformed THEN the application SHALL log the error and display a basic alert() dialog to notify the user
5. WHEN backing up configurations THEN the application SHALL create timestamped backup files in `~/.mcp-manager/backups/` before making changes

### Requirement 2: Server Discovery and Display

**User Story:** As a user, I want to see all my MCP servers in a simple list format, so that I can understand what servers are configured across both applications and projects.

#### Acceptance Criteria

1. WHEN the application loads THEN it SHALL discover and display all MCP servers from both Claude Code and Claude Desktop configurations
2. WHEN displaying servers THEN it SHALL show server name, enabled status, application scope (Claude Code/Desktop), and project association (if any)
3. WHEN a server belongs to a project THEN the application SHALL display the project name and path clearly
4. WHEN displaying command information THEN the application SHALL show the complete command and arguments in a readable format

### Requirement 3: Server Toggle Functionality

**User Story:** As a user, I want to enable and disable MCP servers with simple clicks, so that I can quickly activate or deactivate servers without manually editing JSON files.

#### Acceptance Criteria

1. WHEN I click to disable a server THEN the application SHALL move the server configuration from the active config to the appropriate disabled storage file
2. WHEN I click to enable a server THEN the application SHALL move the server configuration from disabled storage back to the active configuration
3. WHEN disabling a server THEN the application SHALL preserve the original configuration, timestamp, application scope, and project context
4. IF a toggle operation fails THEN the application SHALL display an alert() dialog with the error message
5. WHEN a server is toggled THEN the application SHALL immediately refresh the display to show the new status

### Requirement 4: Basic UI Functionality

**User Story:** As a user, I want a simple interface that is easy to navigate, so that I can efficiently manage servers without complications.

#### Acceptance Criteria

1. WHEN the application starts THEN it SHALL display a single window with tabbed navigation between Claude Code and Claude Desktop servers
2. WHEN showing server information THEN it SHALL display each server as a simple card with clear status indicators
3. WHEN errors occur THEN the application SHALL use basic alert() dialogs for user notifications (no custom modal implementations)
4. WHEN the user clicks refresh THEN the application SHALL reload all configuration data and update the display

### Requirement 5: Disabled Server Management

**User Story:** As a user, I want disabled servers to be safely stored and easily restored, so that I can temporarily deactivate servers without losing their configuration details.

#### Acceptance Criteria

1. WHEN a server is disabled THEN the application SHALL store it in `~/.mcp-manager/claude-code-disabled.json` or `~/.mcp-manager/claude-desktop-disabled.json` based on its source application
2. WHEN storing disabled servers THEN the application SHALL include the original configuration, disable timestamp, source application, project path, and project name
3. WHEN the application starts THEN it SHALL read both active and disabled server configurations to provide a complete server list
4. IF the disabled server storage directory doesn't exist THEN the application SHALL create it with appropriate permissions
5. WHEN displaying disabled servers THEN they SHALL be clearly marked as inactive with appropriate visual styling

### Requirement 6: Project Context Preservation

**User Story:** As a user with project-specific MCP servers, I want the application to maintain project associations when toggling servers, so that project servers remain properly categorized and functional.

#### Acceptance Criteria

1. WHEN displaying project servers THEN the application SHALL show the project name and full project path
2. WHEN disabling a project server THEN the application SHALL preserve the project path and name in the disabled server storage
3. WHEN enabling a project server THEN the application SHALL restore it to the correct project section in the configuration
4. IF a project path is invalid or inaccessible THEN the application SHALL display an alert() with the issue but still show the server configuration
5. WHEN handling project paths starting with "~" THEN the application SHALL resolve them to full home directory paths

### Requirement 7: Configuration File Access

**User Story:** As a user, I want to easily open the configuration files in my default editor, so that I can make direct edits when needed for complex configurations.

#### Acceptance Criteria

1. WHEN I click to open a configuration file THEN the application SHALL use the system default application to open the JSON file
2. WHEN opening Claude Code configuration THEN it SHALL open `~/.claude.json`
3. WHEN opening Claude Desktop configuration THEN it SHALL open `~/Library/Application Support/Claude/claude_desktop_config.json`
4. IF a configuration file doesn't exist THEN the application SHALL create an empty file with basic JSON structure before opening
5. WHEN the file opening fails THEN the application SHALL show an alert() dialog with the error details

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: Each module should handle one specific aspect (config management, server operations, UI control)
- **Modular Design**: Separate main process logic (file I/O, IPC) from renderer process logic (UI, user interactions)  
- **Simple Dependencies**: Use only Node.js built-in modules and Electron APIs, avoid external dependencies
- **Clear Interfaces**: Define straightforward IPC communication between main and renderer processes

### Security

- Use Electron's context isolation and disable node integration in renderer process
- Implement secure IPC communication through preload script context bridge
- Validate all configuration data before writing to prevent injection of malicious content
- Use atomic file operations to prevent corruption during concurrent access

### Reliability

- Handle missing, corrupted, or inaccessible configuration files gracefully without crashing
- Provide automatic backup creation before configuration modifications
- Implement basic error recovery for common filesystem issues (permissions, disk space)
- Ensure configuration consistency between enabled and disabled server states

### Usability

- Single window application with intuitive tab-based navigation
- Clear visual hierarchy and status indicators
- Basic alert() dialogs for error notifications (no custom modal complexity)
- Immediate visual feedback for all user actions (toggle, refresh, file operations)
- Minimal learning curve for users familiar with basic desktop applications