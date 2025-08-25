const ServerManager = require('./src/server-manager');
const path = require('path');
const fs = require('fs').promises;

async function testPhase3() {
  const serverMgr = new ServerManager();
  
  console.log('=== Phase 3 Test ===');
  
  // Create test config file
  const testConfigPath = './test-claude-config.json';
  const testConfig = {
    mcpServers: {
      'test-server': {
        command: 'node',
        args: ['server.js'],
        env: { TEST: 'true' }
      }
    }
  };
  
  try {
    // Create test config
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2));
    console.log('✓ Test config created');
    
    // Temporarily override config path for testing
    const originalGetConfigPath = serverMgr.configMgr.getConfigPath;
    serverMgr.configMgr.getConfigPath = (appType) => {
      if (appType === 'claude-code') return testConfigPath;
      return originalGetConfigPath.call(serverMgr.configMgr, appType);
    };
    
    // Test loading active servers
    const activeServers = await serverMgr.loadActiveServers('claude-code');
    console.log('✓ Loaded active servers:', activeServers.length);
    
    if (activeServers.length > 0) {
      console.log('First server name:', activeServers[0].name);
      console.log('First server enabled:', activeServers[0].enabled);
      console.log('First server type:', activeServers[0].type);
    }
    
    // Test disabling server
    console.log('\nTesting disable operation...');
    await serverMgr.disableServer('claude-code', 'test-server');
    console.log('✓ Server disabled');
    
    // Verify server is gone from config
    const updatedConfig = JSON.parse(await fs.readFile(testConfigPath, 'utf8'));
    console.log('Config after disable has test-server:', 'test-server' in (updatedConfig.mcpServers || {}));
    
    // Test enabling server
    console.log('\nTesting enable operation...');
    await serverMgr.enableServer('claude-code', 'test-server');
    console.log('✓ Server enabled');
    
    // Verify server is back in config
    const restoredConfig = JSON.parse(await fs.readFile(testConfigPath, 'utf8'));
    console.log('Config after enable has test-server:', 'test-server' in (restoredConfig.mcpServers || {}));
    
    // Test getAllServers
    const allServers = await serverMgr.getAllServers();
    console.log('✓ Got all servers:', allServers.length);
    
    // Clean up
    await fs.unlink(testConfigPath);
    console.log('✓ Test config cleaned up');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
    
    // Clean up on error
    try {
      await fs.unlink(testConfigPath);
    } catch {}
  }
}

testPhase3();