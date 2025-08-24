# Implementation Tasks

## Introduction

This document breaks down the implementation of the MCP Server Manager into atomic, actionable coding tasks. Each task is designed to be completed in 15-30 minutes and focuses on specific functionality that builds incrementally toward the complete application.

The tasks follow the approved requirements and design documents, leveraging existing Electron project structure while implementing the core business logic classes (ConfigurationManager, ServerManager, DisabledServerStorage) and basic UI functionality.

## Task Implementation Guidelines

- **File Scope**: Each task touches 1-3 related files maximum
- **Time Boxing**: 15-30 minute completion target
- **Sequential Building**: Each task builds on previous work
- **Requirements Reference**: Each task maps to specific requirements
- **Existing Code Leverage**: Reuse existing Electron setup and patterns

## Core Implementation Tasks

### 1. Core Business Logic Foundation

- [ ] 1.1 Create ConfigurationManager class for centralized config file operations
  - Create `src/main/config-manager.js` with atomic file operations
  - Implement getClaudeCodeConfig(), getClaudeDesktopConfig(), saveConfig(), createBackup()
  - Handle missing files gracefully, use atomic writes with temporary files
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 1.2 Create DisabledServerStorage class for managing disabled servers
  - Create `src/main/disabled-storage.js` with JSON file operations
  - Implement addDisabledServer(), removeDisabledServer(), getDisabledServers()
  - Store disabled servers with metadata (timestamp, original app, project context)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 1.3 Create ServerManager class for server discovery and toggle operations
  - Create `src/main/server-manager.js` with business logic
  - Implement getAllServers(), toggleServer(), isServerEnabled()
  - Integrate ConfigurationManager and DisabledServerStorage dependencies
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 6.1, 6.2, 6.3_

### 2. IPC Communication Layer

- [ ] 2.1 Set up secure IPC handlers in main process
  - Create `src/main/ipc-handlers.js` with all required IPC endpoints
  - Implement handlers for get-all-servers, toggle-server, open-config-file, refresh-data
  - Register handlers in main.js and ensure proper error handling
  - _Requirements: 4.4, 7.1, 7.2, 7.3_
  - _Leverage: src/main.js_

- [ ] 2.2 Update preload script with complete electronAPI bridge
  - Update `src/renderer/preload.js` to expose all required IPC methods
  - Add getAllServers(), toggleServer(), openConfigFile(), refreshData() methods
  - Maintain secure context bridge pattern from existing implementation
  - _Requirements: 4.4_
  - _Leverage: src/renderer/preload.js_

### 3. Server Data Model Implementation

- [ ] 3.1 Create client-side Server data model class
  - Create `src/renderer/server-model.js` with Server class
  - Implement constructor, getDisplayCommand(), detectType(), maskSensitiveEnvVars()
  - Include project path resolution and command formatting logic
  - _Requirements: 2.2, 2.3, 2.4, 6.1, 6.4_

### 4. Core UI Implementation

- [ ] 4.1 Replace welcome UI with tabbed server management interface
  - Update `src/renderer/index.html` with tab navigation and server containers
  - Create tabs for Claude Code and Claude Desktop, statistics display, action buttons
  - Remove existing welcome content and replace with functional layout
  - _Requirements: 4.1, 4.2_
  - _Leverage: src/renderer/index.html_

- [ ] 4.2 Implement UIController class for state management
  - Create core UIController class in `src/renderer/renderer.js`
  - Implement init(), render(), switchTab(), refreshData(), toggleServer()
  - Replace existing renderer.js content with proper controller pattern
  - _Requirements: 4.1, 4.2, 4.4, 3.5_
  - _Leverage: src/renderer/renderer.js_

- [ ] 4.3 Add server display and interaction methods to UIController
  - Add renderServerCard(), updateServerStatus(), handleServerToggle() methods
  - Implement server filtering by application tab and status display
  - Include project context display and command information formatting
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.5, 6.1_

### 5. Configuration File Access Features

- [ ] 5.1 Implement configuration file opening functionality
  - Add shell integration to main process for opening config files
  - Create file opening handlers that use system default applications
  - Handle missing files by creating empty JSON structure before opening
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

### 6. Error Handling and User Feedback

- [ ] 6.1 Add comprehensive error handling to business logic classes
  - Update ConfigurationManager, ServerManager, DisabledServerStorage with try-catch blocks
  - Log errors appropriately and return meaningful error objects for UI display
  - Implement file permission and disk space error handling
  - _Requirements: 1.4, 3.4, 6.4_

- [ ] 6.2 Implement UI error display and user notifications
  - Add error handling to UIController for displaying alert() dialogs
  - Handle IPC communication failures and display appropriate user messages
  - Implement status updates for successful operations (toggle, refresh)
  - _Requirements: 4.3, 3.4, 7.5_

### 7. UI Styling and Visual Polish

- [ ] 7.1 Update CSS for tabbed interface and server cards
  - Update `src/renderer/styles.css` with tab navigation styling
  - Create server card layouts with status indicators and interactive elements
  - Remove existing welcome page styles and implement functional UI styling
  - _Requirements: 4.1, 4.2, 5.5_
  - _Leverage: src/renderer/styles.css_

- [ ] 7.2 Add responsive design and status indicators
  - Implement enabled/disabled visual states for server cards
  - Add hover effects for interactive elements and proper button styling
  - Include project context and command display formatting
  - _Requirements: 4.2, 5.5_

### 8. Integration and Data Flow

- [ ] 8.1 Connect all components and test complete data flow
  - Update main.js to instantiate business logic classes and register IPC handlers
  - Ensure proper initialization order and dependency injection
  - Test complete user workflow: load servers → display → toggle → refresh
  - _Requirements: All requirements validation_
  - _Leverage: src/main.js_

- [ ] 8.2 Add backup system and atomic operations verification
  - Verify ConfigurationManager backup creation before modifications
  - Test atomic file operations under various failure scenarios
  - Ensure disabled server storage integrity during toggle operations
  - _Requirements: 1.5, 3.4, 5.2_

- [ ] 8.3 Implement complete project path handling and resolution
  - Add project path resolution for tilde (~) expansion to home directory
  - Test project server context preservation during enable/disable cycles
  - Verify project name extraction and display in UI
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## Implementation Notes

### Key Patterns to Follow
- **KISS Principle**: Keep implementations simple and straightforward
- **YAGNI Principle**: Implement only what is specified in requirements
- **Atomic Operations**: Use temporary files and atomic renames for configuration changes
- **Error Resilience**: Handle missing files, permission errors, and malformed JSON gracefully
- **Security**: Maintain context isolation and secure IPC communication

### File Organization
- Main process business logic: `src/main/` directory
- Renderer process UI logic: `src/renderer/` directory  
- Leverage existing Electron security configuration from current preload.js
- Maintain separation of concerns between data operations and UI rendering

### Testing Approach
- Manual testing with actual Claude Code and Claude Desktop configuration files
- Test error scenarios: missing files, permission issues, malformed JSON
- Verify atomic operations by interrupting file writes
- Test project server context preservation across toggle operations

This task breakdown provides a systematic approach to implementing the MCP Server Manager while building incrementally from core business logic to complete user interface functionality.