const StorageManager = require('./src/storage-manager');
const Server = require('./src/server');

async function testPhase2() {
  const storage = new StorageManager();
  
  console.log('=== Phase 2 Test ===');
  
  try {
    // Ensure MCP manager directory exists
    await storage.ensureMcpManagerDir();
    console.log('✓ MCP manager directory ensured');
    
    // Create test server
    const testServer = new Server({
      name: 'test-server',
      config: { command: 'node', args: ['server.js'] },
      enabled: false,
      appType: 'claude-code',
      scope: 'global',
      projectPath: null,
      projectName: null
    });
    
    console.log('✓ Test server created');
    console.log('Server type detected:', testServer.type);
    console.log('Unique key:', testServer.getUniqueKey());
    
    // Test adding disabled server
    await storage.addDisabledServer('claude-code', testServer);
    console.log('✓ Server added to disabled storage');
    
    // Test loading disabled servers
    const loaded = await storage.loadDisabledServers('claude-code');
    console.log('✓ Loaded disabled servers:', loaded.length);
    
    if (loaded.length > 0) {
      console.log('First server name:', loaded[0].name);
      console.log('First server enabled:', loaded[0].enabled);
    }
    
    // Test removing disabled server
    const removed = await storage.removeDisabledServer('claude-code', 'test-server');
    console.log('✓ Server removed from disabled storage');
    console.log('Removed server name:', removed.name);
    
    // Verify removal
    const afterRemoval = await storage.loadDisabledServers('claude-code');
    console.log('✓ After removal, disabled servers:', afterRemoval.length);
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

testPhase2();