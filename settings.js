// Settings management for GitHub PR Review Extractor

// Default settings
const DEFAULT_SETTINGS = {
  llmEndpoint: 'http://192.168.1.57:8000/v1',
  apiKey: '',
  modelName: 'deepseek-ai/deepseek-coder-1.3b-instruct',
  githubToken: '',
  maxTokens: 1000,
  temperature: 0.2,
  maxIssuesPerFile: 10,
  checkBugs: true,
  checkSecurity: true,
  checkPerformance: true,
  checkStyle: false,
  checkErrorHandling: true
};

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

// Load settings from chrome.storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    
    // Populate form fields
    document.getElementById('llmEndpoint').value = settings.llmEndpoint || DEFAULT_SETTINGS.llmEndpoint;
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('modelName').value = settings.modelName || DEFAULT_SETTINGS.modelName;
    document.getElementById('githubToken').value = settings.githubToken || '';
    document.getElementById('maxTokens').value = settings.maxTokens || DEFAULT_SETTINGS.maxTokens;
    document.getElementById('temperature').value = settings.temperature || DEFAULT_SETTINGS.temperature;
    document.getElementById('maxIssuesPerFile').value = settings.maxIssuesPerFile || DEFAULT_SETTINGS.maxIssuesPerFile;
    
    // Populate checkboxes
    document.getElementById('checkBugs').checked = settings.checkBugs !== false;
    document.getElementById('checkSecurity').checked = settings.checkSecurity !== false;
    document.getElementById('checkPerformance').checked = settings.checkPerformance !== false;
    document.getElementById('checkStyle').checked = settings.checkStyle === true;
    document.getElementById('checkErrorHandling').checked = settings.checkErrorHandling !== false;
    
    console.log('Settings loaded:', settings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings: ' + error.message, 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('testConnection').addEventListener('click', testConnection);
}

// Save settings to chrome.storage
async function saveSettings() {
  try {
    const settings = {
      llmEndpoint: document.getElementById('llmEndpoint').value.trim(),
      apiKey: document.getElementById('apiKey').value.trim(),
      modelName: document.getElementById('modelName').value.trim(),
      githubToken: document.getElementById('githubToken').value.trim(),
      maxTokens: parseInt(document.getElementById('maxTokens').value),
      temperature: parseFloat(document.getElementById('temperature').value),
      maxIssuesPerFile: parseInt(document.getElementById('maxIssuesPerFile').value),
      checkBugs: document.getElementById('checkBugs').checked,
      checkSecurity: document.getElementById('checkSecurity').checked,
      checkPerformance: document.getElementById('checkPerformance').checked,
      checkStyle: document.getElementById('checkStyle').checked,
      checkErrorHandling: document.getElementById('checkErrorHandling').checked
    };
    
    // Validate settings
    if (!settings.llmEndpoint) {
      showStatus('Please enter an LLM endpoint URL', 'error');
      return;
    }
    
    if (!settings.apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }
    
    if (!settings.modelName) {
      showStatus('Please enter a model name', 'error');
      return;
    }
    
    // Validate URL format
    try {
      new URL(settings.llmEndpoint);
    } catch (e) {
      showStatus('Invalid endpoint URL format', 'error');
      return;
    }
    
    // Save to storage
    await chrome.storage.local.set(settings);
    showStatus('Settings saved successfully!', 'success');
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings: ' + error.message, 'error');
  }
}

// Reset settings to defaults
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    try {
      await chrome.storage.local.set(DEFAULT_SETTINGS);
      await loadSettings();
      showStatus('Settings reset to defaults', 'info');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showStatus('Failed to reset settings: ' + error.message, 'error');
    }
  }
}

// Test LLM connection
async function testConnection() {
  const button = document.getElementById('testConnection');
  const statusIndicator = document.getElementById('connectionStatus');
  
  // Get current settings
  const endpoint = document.getElementById('llmEndpoint').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const modelName = document.getElementById('modelName').value.trim();
  
  if (!endpoint || !apiKey || !modelName) {
    showStatus('Please fill in endpoint URL, API key, and model name before testing', 'error');
    return;
  }
  
  button.disabled = true;
  button.textContent = 'Testing...';
  statusIndicator.style.display = 'none';
  
  try {
    // Send message to background script to test connection
    const response = await chrome.runtime.sendMessage({
      action: 'TEST_LLM_CONNECTION',
      endpoint: endpoint,
      apiKey: apiKey,
      modelName: modelName
    });
    
    if (response.success) {
      showStatus(`✓ Connection successful! Model: ${response.model || modelName}`, 'success');
      updateConnectionStatus(true);
    } else {
      showStatus(`✗ Connection failed: ${response.error}`, 'error');
      updateConnectionStatus(false);
    }
  } catch (error) {
    console.error('Test connection error:', error);
    showStatus(`✗ Connection test failed: ${error.message}`, 'error');
    updateConnectionStatus(false);
  } finally {
    button.disabled = false;
    button.textContent = 'Test Connection';
  }
}

// Update connection status indicator
function updateConnectionStatus(connected) {
  const statusIndicator = document.getElementById('connectionStatus');
  statusIndicator.style.display = 'inline-flex';
  
  if (connected) {
    statusIndicator.className = 'connection-status connected';
    statusIndicator.innerHTML = '<span class="status-dot green"></span> Connected';
  } else {
    statusIndicator.className = 'connection-status disconnected';
    statusIndicator.innerHTML = '<span class="status-dot red"></span> Disconnected';
  }
}

// Show status message
function showStatus(message, type) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';
  
  // Auto-hide after 5 seconds for success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 5000);
  }
}
