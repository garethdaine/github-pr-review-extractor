// Settings management for GitHub PR Review Extractor

import type { ExtensionSettings } from '../../types/settings';

interface PromptTemplates {
  [key: string]: string;
}

const PROMPT_TEMPLATES: PromptTemplates = {
  'security-focused': `You are a security-focused code reviewer. Your primary task is to identify security vulnerabilities, potential exploits, and unsafe coding practices.

Focus on:
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- Authentication and authorization flaws
- Sensitive data exposure
- Insecure dependencies
- Cryptographic weaknesses
- Input validation issues

For each security issue found, provide:
1. Line number (if applicable)
2. Severity (CRITICAL for security issues)
3. A brief title
4. Detailed description of the vulnerability
5. Suggested fix
6. Confidence score (0.0 to 1.0)

Format your response as a JSON array of issues.`,

  'performance-focused': `You are a performance-focused code reviewer. Your task is to identify performance bottlenecks, inefficient algorithms, and optimization opportunities.

Focus on:
- N+1 query problems
- Inefficient loops and iterations
- Memory leaks
- Unnecessary computations
- Missing indexes
- Large data processing without pagination
- Inefficient data structures

For each performance issue found, provide:
1. Line number (if applicable)
2. Severity (WARNING for performance issues)
3. A brief title
4. Detailed description
5. Suggested optimization
6. Confidence score (0.0 to 1.0)

Format your response as a JSON array of issues.`,

  'style-focused': `You are a code style and best practices reviewer. Your task is to ensure code follows best practices, conventions, and maintainability standards.

Focus on:
- Code style consistency
- Naming conventions
- Code organization
- Documentation
- DRY (Don't Repeat Yourself) violations
- SOLID principles
- Design patterns

For each style issue found, provide:
1. Line number (if applicable)
2. Severity (SUGGESTION for style issues)
3. A brief title
4. Detailed description
5. Suggested improvement
6. Confidence score (0.0 to 1.0)

Format your response as a JSON array of issues.`,

  'comprehensive': `You are a senior software engineer conducting a comprehensive code review. Analyze code changes from multiple perspectives.

Focus on:
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Code style and best practices
- Error handling
- Test coverage
- Maintainability
- Documentation

For each issue found, provide:
1. Line number (if applicable)
2. Severity (CRITICAL, WARNING, or SUGGESTION)
3. A brief title
4. Detailed description
5. Suggested fix
6. Confidence score (0.0 to 1.0)

Format your response as a JSON array of issues.`
};

interface ExtendedSettings extends ExtensionSettings {
  multiPassReview?: boolean;
  minConfidence?: number;
  customSystemPrompt?: string;
  promptTemplate?: string;
}

const DEFAULT_SETTINGS: ExtendedSettings = {
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
  checkErrorHandling: true,
  multiPassReview: false,
  minConfidence: 0.5,
  customSystemPrompt: '',
  promptTemplate: ''
};

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

async function loadSettings(): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
    const settings = { ...DEFAULT_SETTINGS, ...stored } as ExtendedSettings;

    getElementById<HTMLInputElement>('llmEndpoint').value = settings.llmEndpoint || DEFAULT_SETTINGS.llmEndpoint;
    getElementById<HTMLInputElement>('apiKey').value = settings.apiKey || '';
    getElementById<HTMLInputElement>('modelName').value = settings.modelName || DEFAULT_SETTINGS.modelName;
    getElementById<HTMLInputElement>('githubToken').value = settings.githubToken || '';
    getElementById<HTMLInputElement>('maxTokens').value = String(settings.maxTokens || DEFAULT_SETTINGS.maxTokens);
    getElementById<HTMLInputElement>('temperature').value = String(settings.temperature || DEFAULT_SETTINGS.temperature);
    getElementById<HTMLInputElement>('maxIssuesPerFile').value = String(settings.maxIssuesPerFile || DEFAULT_SETTINGS.maxIssuesPerFile);

    getElementById<HTMLInputElement>('checkBugs').checked = settings.checkBugs !== false;
    getElementById<HTMLInputElement>('checkSecurity').checked = settings.checkSecurity !== false;
    getElementById<HTMLInputElement>('checkPerformance').checked = settings.checkPerformance !== false;
    getElementById<HTMLInputElement>('checkStyle').checked = settings.checkStyle === true;
    getElementById<HTMLInputElement>('checkErrorHandling').checked = settings.checkErrorHandling !== false;
    getElementById<HTMLInputElement>('multiPassReview').checked = settings.multiPassReview !== false;

    const minConfidenceEl = getElementById<HTMLInputElement>('minConfidence');
    minConfidenceEl.value = String(settings.minConfidence !== undefined ? settings.minConfidence : 0.5);

    const customPromptEl = getElementById<HTMLTextAreaElement>('customSystemPrompt');
    customPromptEl.value = settings.customSystemPrompt || '';

    const promptTemplateEl = getElementById<HTMLSelectElement>('promptTemplate');
    promptTemplateEl.value = settings.promptTemplate || '';

    promptTemplateEl.addEventListener('change', (e) => {
      const template = (e.target as HTMLSelectElement).value;
      if (template && PROMPT_TEMPLATES[template]) {
        customPromptEl.value = PROMPT_TEMPLATES[template];
      } else if (!template) {
        customPromptEl.value = '';
      }
    });

    console.log('Settings loaded:', settings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus(`Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }
}

function setupEventListeners(): void {
  getElementById<HTMLButtonElement>('saveSettings').addEventListener('click', saveSettings);
  getElementById<HTMLButtonElement>('resetSettings').addEventListener('click', resetSettings);
  getElementById<HTMLButtonElement>('testConnection').addEventListener('click', testConnection);
}

async function saveSettings(): Promise<void> {
  try {
    const settings: ExtendedSettings = {
      llmEndpoint: getElementById<HTMLInputElement>('llmEndpoint').value.trim(),
      apiKey: getElementById<HTMLInputElement>('apiKey').value.trim(),
      modelName: getElementById<HTMLInputElement>('modelName').value.trim(),
      githubToken: getElementById<HTMLInputElement>('githubToken').value.trim(),
      maxTokens: parseInt(getElementById<HTMLInputElement>('maxTokens').value, 10),
      temperature: parseFloat(getElementById<HTMLInputElement>('temperature').value),
      maxIssuesPerFile: parseInt(getElementById<HTMLInputElement>('maxIssuesPerFile').value, 10),
      checkBugs: getElementById<HTMLInputElement>('checkBugs').checked,
      checkSecurity: getElementById<HTMLInputElement>('checkSecurity').checked,
      checkPerformance: getElementById<HTMLInputElement>('checkPerformance').checked,
      checkStyle: getElementById<HTMLInputElement>('checkStyle').checked,
      checkErrorHandling: getElementById<HTMLInputElement>('checkErrorHandling').checked,
      multiPassReview: getElementById<HTMLInputElement>('multiPassReview').checked,
      minConfidence: parseFloat(getElementById<HTMLInputElement>('minConfidence').value) || 0.5,
      customSystemPrompt: getElementById<HTMLTextAreaElement>('customSystemPrompt').value.trim(),
      promptTemplate: getElementById<HTMLSelectElement>('promptTemplate').value
    };

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

    try {
      new URL(settings.llmEndpoint);
    } catch (e) {
      showStatus('Invalid endpoint URL format', 'error');
      return;
    }

    await chrome.storage.local.set(settings);
    showStatus('Settings saved successfully!', 'success');
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }
}

async function resetSettings(): Promise<void> {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    try {
      await chrome.storage.local.set(DEFAULT_SETTINGS);
      await loadSettings();
      showStatus('Settings reset to defaults', 'info');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showStatus(`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }
}

async function testConnection(): Promise<void> {
  const button = getElementById<HTMLButtonElement>('testConnection');
  const statusIndicator = getElementById<HTMLElement>('connectionStatus');

  const endpoint = getElementById<HTMLInputElement>('llmEndpoint').value.trim();
  const apiKey = getElementById<HTMLInputElement>('apiKey').value.trim();
  const modelName = getElementById<HTMLInputElement>('modelName').value.trim();

  if (!endpoint || !apiKey || !modelName) {
    showStatus('Please fill in endpoint URL, API key, and model name before testing', 'error');
    return;
  }

  button.disabled = true;
  button.textContent = 'Testing...';
  statusIndicator.style.display = 'none';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'TEST_LLM_CONNECTION',
      endpoint: endpoint,
      apiKey: apiKey,
      modelName: modelName
    }) as { success: boolean; model?: string; error?: string };

    if (response.success) {
      showStatus(`✓ Connection successful! Model: ${response.model || modelName}`, 'success');
      updateConnectionStatus(true);
    } else {
      showStatus(`✗ Connection failed: ${response.error || 'Unknown error'}`, 'error');
      updateConnectionStatus(false);
    }
  } catch (error) {
    console.error('Test connection error:', error);
    showStatus(`✗ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    updateConnectionStatus(false);
  } finally {
    button.disabled = false;
    button.textContent = 'Test Connection';
  }
}

function updateConnectionStatus(connected: boolean): void {
  const statusIndicator = getElementById<HTMLElement>('connectionStatus');
  statusIndicator.style.display = 'inline-flex';

  if (connected) {
    statusIndicator.className = 'connection-status connected';
    statusIndicator.innerHTML = '<span class="status-dot green"></span> Connected';
  } else {
    statusIndicator.className = 'connection-status disconnected';
    statusIndicator.innerHTML = '<span class="status-dot red"></span> Disconnected';
  }
}

function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  const statusElement = getElementById<HTMLElement>('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});











