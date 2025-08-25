class MCPManager {
  constructor() {
    this.currentTab = 'claude-code';
    this.servers = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadData();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.loadData();
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    this.renderAll();
  }

  async loadData() {
    try {
      this.showLoading(true);
      this.hideError();
      
      const result = await electronAPI.getAllServers();
      
      if (result.success) {
        this.servers = result.data;
        this.renderAll();
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  renderAll() {
    this.renderInfoCard();
    this.renderServers();
  }

  async renderInfoCard() {
    const currentServers = this.servers.filter(s => s.appType === this.currentTab);
    const active = currentServers.filter(s => s.enabled).length;
    const disabled = currentServers.filter(s => !s.enabled).length;
    const global = currentServers.filter(s => s.scope === 'global').length;
    const project = currentServers.filter(s => s.scope === 'project').length;

    try {
      const result = await electronAPI.getConfigInfo(this.currentTab);
      
      if (result.success) {
        const { path, exists } = result.data;
        document.getElementById('stats-container').innerHTML = `
          <div class="info-card">
            <div class="stats-compact">
              <span>Total: ${currentServers.length}</span>
              <span>Active: <strong class="enabled">${active}</strong></span>
              <span>Disabled: <strong class="disabled">${disabled}</strong></span>
              <span>Global: ${global}</span>
              <span>Project: ${project}</span>
            </div>
            <div class="config-compact">
              <code class="config-path">${path}</code>
              <span class="config-status ${exists ? 'exists' : 'missing'}">${exists ? 'EXISTS' : 'MISSING'}</span>
              <button class="btn-small" onclick="mcpManager.openConfigFile()">Open</button>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading config info:', error);
    }
  }

  renderServers() {
    const currentServers = this.servers.filter(s => s.appType === this.currentTab);
    const container = document.getElementById('servers-container');
    
    if (currentServers.length === 0) {
      container.innerHTML = '<div class="no-servers">No servers found</div>';
      return;
    }

    const globalServers = currentServers.filter(s => s.scope === 'global');
    const projectServers = currentServers.filter(s => s.scope === 'project');

    let html = '';

    if (globalServers.length > 0) {
      html += '<div class="server-group-title">Global</div>';
      html += globalServers.map(server => `
        <div class="server-card ${server.enabled ? 'enabled' : 'disabled'} ${server.scope}">
          <div class="server-header">
            <div class="server-info">
              <div class="server-name-row">
                <h3 class="server-name">${server.name}</h3>
                <span class="server-scope ${server.scope} ${!server.enabled ? 'disabled' : ''}" 
                    ${server.enabled ? `onclick="mcpManager.showProjectDropdown(event, '${server.name}', '${server.scope}', ${server.projectPath ? `'${server.projectPath}'` : 'null'})"` : ''}>${server.scope === 'global' ? 'global' : `project: ${server.projectPath}`}</span>
              </div>
            </div>
            <div class="server-controls">
              <label class="toggle-switch">
                <input type="checkbox" ${server.enabled ? 'checked' : ''} 
                       onchange="mcpManager.toggleServer('${server.name}', '${server.appType}', ${server.projectPath ? `'${server.projectPath}'` : 'null'}, this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="server-details">
            <div class="server-config">
              <strong>Configuration:</strong>
              <pre class="config-json">${JSON.stringify(server.config, null, 2)}</pre>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (projectServers.length > 0) {
      if (globalServers.length > 0) {
        html += '<div class="server-separator"></div>';
      }
      html += '<div class="server-group-title">Project</div>';
      html += projectServers.map(server => `
        <div class="server-card ${server.enabled ? 'enabled' : 'disabled'} ${server.scope}">
          <div class="server-header">
            <div class="server-info">
              <div class="server-name-row">
                <h3 class="server-name">${server.name}</h3>
                <span class="server-scope ${server.scope} ${!server.enabled ? 'disabled' : ''}" 
                    ${server.enabled ? `onclick="mcpManager.showProjectDropdown(event, '${server.name}', '${server.scope}', ${server.projectPath ? `'${server.projectPath}'` : 'null'})"` : ''}>${server.scope === 'global' ? 'global' : `project: ${server.projectPath}`}</span>
              </div>
            </div>
            <div class="server-controls">
              <label class="toggle-switch">
                <input type="checkbox" ${server.enabled ? 'checked' : ''} 
                       onchange="mcpManager.toggleServer('${server.name}', '${server.appType}', ${server.projectPath ? `'${server.projectPath}'` : 'null'}, this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="server-details">
            <div class="server-config">
              <strong>Configuration:</strong>
              <pre class="config-json">${JSON.stringify(server.config, null, 2)}</pre>
            </div>
          </div>
        </div>
      `).join('');
    }

    container.innerHTML = html;
  }

  async toggleServer(name, appType, projectPath, enable) {
    try {
      const result = await electronAPI.toggleServer(name, appType, projectPath, enable);
      
      if (result.success) {
        // Reload data to reflect changes
        await this.loadData();
      } else {
        this.showError(`Failed to ${enable ? 'enable' : 'disable'} server: ${result.error}`);
        // Reload to restore correct state
        await this.loadData();
      }
    } catch (error) {
      this.showError(`Error toggling server: ${error.message}`);
      await this.loadData();
    }
  }

  async openConfigFile() {
    try {
      const result = await electronAPI.openConfigFile(this.currentTab);
      if (!result.success) {
        this.showError(`Failed to open config file: ${result.error}`);
      }
    } catch (error) {
      this.showError(`Error opening config file: ${error.message}`);
    }
  }

  showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
  }

  showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => errorEl.classList.add('hidden'), 5000);
  }

  hideError() {
    document.getElementById('error').classList.add('hidden');
  }

  async showProjectDropdown(event, serverName, currentScope, currentProject) {
    event.stopPropagation();
    
    // Close any existing dropdown
    this.closeProjectDropdown();
    
    try {
      // Only works for Claude Code
      if (this.currentTab !== 'claude-code') {
        this.showError('Project operations only available for Claude Code');
        return;
      }

      const projectsResult = await electronAPI.getProjectsList();
      if (!projectsResult.success) {
        this.showError(`Failed to load projects: ${projectsResult.error}`);
        return;
      }
      
      const projects = projectsResult.data;
      const dropdown = this.createProjectDropdown(serverName, currentScope, currentProject, projects);
      
      // Position dropdown
      const scopeElement = event.target;
      const rect = scopeElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      dropdown.style.position = 'absolute';
      dropdown.style.top = `${rect.bottom + scrollTop + 5}px`;
      dropdown.style.left = `${rect.right - 200}px`; // Right align with 200px width
      
      // Adjust if going off screen
      if (dropdown.style.left < '10px') {
        dropdown.style.left = '10px';
      }
      
      document.body.appendChild(dropdown);
      
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', this.closeProjectDropdown.bind(this), { once: true });
      }, 0);
      
    } catch (error) {
      this.showError(`Error showing project dropdown: ${error.message}`);
    }
  }

  createProjectDropdown(serverName, currentScope, currentProject, projects) {
    const dropdown = document.createElement('div');
    dropdown.className = 'project-dropdown';
    dropdown.id = 'project-dropdown';
    
    let html = '';
    
    if (currentScope === 'global') {
      // Global server - can move to any project
      if (projects.length === 0) {
        html = '<div class="dropdown-item">No projects found</div>';
      } else {
        projects.forEach(project => {
          html += `
            <div class="dropdown-item" onclick="mcpManager.moveToProject('${serverName}', '${project.path}')">
              <div class="project-name">${project.name}</div>
              <div class="project-path">${project.path}</div>
            </div>
          `;
        });
      }
    } else {
      // Project server - can move to global or copy to other projects
      html += `
        <div class="dropdown-item move" onclick="mcpManager.moveToGlobal('${serverName}', '${currentProject}')">
          Move to Global
        </div>
      `;
      
      const otherProjects = projects.filter(p => p.path !== currentProject);
      if (otherProjects.length > 0) {
        html += '<div class="dropdown-separator"></div>';
        otherProjects.forEach(project => {
          html += `
            <div class="dropdown-item copy" onclick="mcpManager.copyToProject('${serverName}', '${currentProject}', '${project.path}')">
              <div class="project-name">Copy to ${project.name}</div>
              <div class="project-path">${project.path}</div>
            </div>
          `;
        });
      }
    }
    
    dropdown.innerHTML = html;
    return dropdown;
  }

  closeProjectDropdown() {
    const dropdown = document.getElementById('project-dropdown');
    if (dropdown) {
      dropdown.remove();
    }
  }

  async moveToProject(serverName, projectPath) {
    this.closeProjectDropdown();
    try {
      const result = await electronAPI.moveServer(serverName, 'global', null, 'project', projectPath);
      if (result.success) {
        await this.loadData(); // Refresh entire list
      } else {
        this.showError(`Failed to move server: ${result.error}`);
      }
    } catch (error) {
      this.showError(`Error moving server: ${error.message}`);
    }
  }

  async moveToGlobal(serverName, fromProject) {
    this.closeProjectDropdown();
    try {
      const result = await electronAPI.moveServer(serverName, 'project', fromProject, 'global', null);
      if (result.success) {
        await this.loadData(); // Refresh entire list
      } else {
        this.showError(`Failed to move server: ${result.error}`);
      }
    } catch (error) {
      this.showError(`Error moving server: ${error.message}`);
    }
  }

  async copyToProject(serverName, fromProject, toProject) {
    this.closeProjectDropdown();
    try {
      const result = await electronAPI.copyServer(serverName, fromProject, toProject);
      if (result.success) {
        await this.loadData(); // Refresh entire list
      } else {
        this.showError(`Failed to copy server: ${result.error}`);
      }
    } catch (error) {
      this.showError(`Error copying server: ${error.message}`);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mcpManager = new MCPManager();
});