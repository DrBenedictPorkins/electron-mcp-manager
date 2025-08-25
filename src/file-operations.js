const fs = require('fs').promises;
const path = require('path');

class FileOperations {
  async loadJSONFile(filePath) {
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
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
      try { 
        await fs.unlink(tempPath); 
      } catch {}
      throw error;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
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

module.exports = FileOperations;