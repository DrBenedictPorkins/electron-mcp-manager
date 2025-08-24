document.addEventListener('DOMContentLoaded', () => {
    console.log('Electron MCP Manager loaded');
    
    // Update version in status bar
    if (window.electronAPI) {
        const versionElement = document.querySelector('.status-item:last-child');
        if (versionElement) {
            versionElement.textContent = `Version: 1.0.0 (Electron ${window.electronAPI.getVersion()})`;
        }
        
        // Log platform info
        console.log(`Platform: ${window.electronAPI.getPlatform()}`);
    }
    
    // Add click handlers to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const featureName = card.querySelector('h3').textContent;
            console.log(`${featureName} feature clicked`);
            
            // Future: Add actual functionality here
            alert(`${featureName} feature will be implemented in future versions`);
        });
    });
    
    // Update status
    updateStatus('Application initialized');
});

function updateStatus(message) {
    const statusElement = document.querySelector('.status-item:first-child');
    if (statusElement) {
        statusElement.textContent = `Status: ${message}`;
    }
}