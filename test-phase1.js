const FileOperations = require('./src/file-operations.js');
const ConfigManager = require('./src/config-manager.js');

async function testPhase1() {
  const fileOps = new FileOperations();
  const configMgr = new ConfigManager();

  console.log('=== Phase 1 Test ===');
  
  // Test config paths
  console.log('Claude Code config path:', configMgr.getClaudeCodeConfigPath());
  console.log('Claude Desktop config path:', configMgr.getClaudeDesktopConfigPath());
  console.log('MCP Manager dir:', configMgr.getMcpManagerDir());
  
  // Test file operations
  const testFile = './test-config.json';
  const testData = { test: 'data', servers: { example: { command: 'echo' } } };
  
  try {
    console.log('\nTesting file operations...');
    await fileOps.saveJSONFile(testFile, testData);
    console.log('✓ File saved successfully');
    
    const loadedData = await fileOps.loadJSONFile(testFile);
    console.log('✓ File loaded successfully');
    console.log('Data matches:', JSON.stringify(loadedData) === JSON.stringify(testData));
    
    // Clean up
    const fs = require('fs').promises;
    await fs.unlink(testFile);
    console.log('✓ Test file cleaned up');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

testPhase1();