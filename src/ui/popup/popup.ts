import type { FilterOptions, Issue } from '../../types/issue';
import { FILTER_PRESETS } from '../../core/filter-presets';
import { filterIssues as filterIssuesUtil } from '../../core/filters';
import { sortIssues as sortIssuesUtil } from '../../core/sorters';
import { initI18n, t } from '../../utils/i18n';

type ReviewHistoryApi = {
  saveReviewToHistory: (data: {
    prUrl: string;
    prTitle?: string;
    extractedIssues?: Issue[];
    aiGeneratedIssues?: Issue[];
    exportedFormats?: string[];
  }) => Promise<unknown>;
};

function getEl<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id "${id}" not found`);
  return element as T;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getReviewHistoryApi(): ReviewHistoryApi | null {
  return (window as any).reviewHistory?.saveReviewToHistory ? ((window as any).reviewHistory as ReviewHistoryApi) : null;
}

function openExtensionPage(pagePath: string): void {
  chrome.tabs.create({ url: chrome.runtime.getURL(pagePath) });
}

let extractedIssues: Issue[] = [];
let aiGeneratedIssues: Issue[] = [];
let currentFilterOptions: FilterOptions = { excludeOutdated: true };
let currentSortBy = 'severity-desc';
let currentTheme = 'light';

// Initialize theme on load
document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  applyPopupTranslations();
  await initializeTheme();
});

function applyPopupTranslations(): void {
  const title = document.getElementById('popupTitle');
  if (title) title.textContent = `📝 ${t('extensionName')}`;

  const description = document.getElementById('popupDescription');
  if (description) description.textContent = t('extensionDescription');

  const extractBtn = document.getElementById('extractBtn');
  if (extractBtn) extractBtn.textContent = t('extractAllIssues');

  const generateReviewBtn = document.getElementById('generateReviewBtn');
  if (generateReviewBtn) generateReviewBtn.textContent = t('generateAIReview');

  const previewPostBtn = document.getElementById('previewPostBtn');
  if (previewPostBtn) previewPostBtn.textContent = t('previewPostToGitHub');

  const postToGitHubBtn = document.getElementById('postToGitHubBtn');
  if (postToGitHubBtn) postToGitHubBtn.textContent = t('postToGitHub');
}

async function initializeTheme() {
  // Check for saved theme preference or default to system preference
  const stored = await chrome.storage.local.get(['theme']);
  if (stored.theme) {
    currentTheme = stored.theme;
  } else {
    // Detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme = 'dark';
    }
  }
  applyTheme(currentTheme);

  // Set up theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    updateThemeToggleIcon();
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
      const stored = await chrome.storage.local.get(['theme']);
      // Only auto-switch if user hasn't manually set a preference
      if (!stored.theme) {
        currentTheme = e.matches ? 'dark' : 'light';
        applyTheme(currentTheme);
        updateThemeToggleIcon();
      }
    });
  }
}

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
}

async function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  await chrome.storage.local.set({ theme: newTheme });
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('title', t('toggleDarkMode'));
  }
}

// Handle filter changes
document.addEventListener('DOMContentLoaded', () => {
  // Outdated checkbox
  const excludeOutdatedCheckbox = document.getElementById('excludeOutdated');
  if (excludeOutdatedCheckbox) {
    excludeOutdatedCheckbox.addEventListener('change', applyFilters);
  }

  // Severity filter
  const severityFilter = document.getElementById('severityFilter');
  if (severityFilter) {
    severityFilter.addEventListener('change', applyFilters);
  }

  // Author type filter
  const authorTypeFilter = document.getElementById('authorTypeFilter');
  if (authorTypeFilter) {
    authorTypeFilter.addEventListener('change', applyFilters);
  }

  // File path filter
  const filePathFilter = document.getElementById('filePathFilter');
  if (filePathFilter) {
    filePathFilter.addEventListener('input', debounce(applyFilters, 300));
  }

  // Search query
  const searchQuery = document.getElementById('searchQuery');
  if (searchQuery) {
    searchQuery.addEventListener('input', debounce(applyFilters, 300));
  }

  // Filter preset
  const filterPreset = document.getElementById('filterPreset');
  if (filterPreset) {
    filterPreset.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement | null;
      if (!target?.value) return;
      applyPreset(target.value);
    });
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }

  // Sort dropdown
  const sortBySelect = document.getElementById('sortBy');
  if (sortBySelect) {
    sortBySelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement | null;
      if (!target?.value) return;
      currentSortBy = target.value;
      if (extractedIssues.length > 0) {
        renderIssuesList(extractedIssues, currentFilterOptions);
      }
    });
  }
});

// Debounce helper function
function debounce(func: () => void, wait: number) {
  let timeoutId: number | undefined;
  return function executedFunction() {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(), wait);
  };
}

// Apply filter preset
function applyPreset(presetKey: string) {
  const preset = FILTER_PRESETS[presetKey];
  if (!preset) return;

  // Apply preset options to form controls
  if (preset.options.excludeOutdated !== undefined) {
    getEl<HTMLInputElement>('excludeOutdated').checked = preset.options.excludeOutdated;
  }

  if (preset.options.severity) {
    const severitySelect = getEl<HTMLSelectElement>('severityFilter');
    if (Array.isArray(preset.options.severity)) {
      severitySelect.value = preset.options.severity.join(',');
    } else {
      severitySelect.value = preset.options.severity as string;
    }
  } else {
    getEl<HTMLSelectElement>('severityFilter').value = '';
  }

  if (preset.options.authorType) {
    getEl<HTMLSelectElement>('authorTypeFilter').value = preset.options.authorType;
  } else {
    getEl<HTMLSelectElement>('authorTypeFilter').value = '';
  }

  // Apply the filters
  applyFilters();

  // Reset preset selector
  getEl<HTMLSelectElement>('filterPreset').value = '';
}

// Clear all filters
function clearAllFilters() {
  getEl<HTMLInputElement>('excludeOutdated').checked = true;
  getEl<HTMLSelectElement>('severityFilter').value = '';
  getEl<HTMLSelectElement>('authorTypeFilter').value = '';
  getEl<HTMLInputElement>('filePathFilter').value = '';
  getEl<HTMLInputElement>('searchQuery').value = '';
  getEl<HTMLSelectElement>('filterPreset').value = '';

  currentFilterOptions = { excludeOutdated: true };
  applyFilters();
}

// Get current filter options from UI
function getCurrentFilterOptions(): FilterOptions {
  const options: FilterOptions = {
    excludeOutdated: getEl<HTMLInputElement>('excludeOutdated').checked
  };

  const severityValue = getEl<HTMLSelectElement>('severityFilter').value;
  if (severityValue) {
    if (severityValue.includes(',')) {
      options.severity = severityValue.split(',');
    } else {
      options.severity = severityValue;
    }
  }

  const authorTypeValue = getEl<HTMLSelectElement>('authorTypeFilter').value;
  if (authorTypeValue) {
    options.authorType = authorTypeValue as FilterOptions['authorType'];
  }

  const filePathValue = getEl<HTMLInputElement>('filePathFilter').value.trim();
  if (filePathValue) {
    options.filePaths = [filePathValue];
  }

  const searchValue = getEl<HTMLInputElement>('searchQuery').value.trim();
  if (searchValue) {
    options.searchQuery = searchValue;
  }

  return options;
}

// Apply filters and re-render
async function applyFilters() {
  if (extractedIssues.length === 0) return;

  currentFilterOptions = getCurrentFilterOptions();

  // Re-extract with new filter options
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return;
    if (!tab.url.includes('github.com') || !tab.url.includes('/pull/')) return;

    chrome.tabs.sendMessage(tab.id, {
      action: 'extractIssues',
      format: 'grouped',
      filterOptions: currentFilterOptions
    }, (response: any) => {
      if (response && response.success) {
        updateFilterStats(response.totalCount, response.outdatedCount, response.count);
        renderIssuesList(extractedIssues, currentFilterOptions);

        // Update format buttons to use new filter
        if (getEl<HTMLElement>('formatSection').style.display !== 'none') {
          // Format section is visible, filters will be applied on next copy
        }
      }
    });
  } catch (error) {
    console.error('Error applying filters:', error);
  }
}


function updateFilterStats(totalCount: number, outdatedCount: number, filteredCount: number | null = null) {
  const statsDiv = document.getElementById('filterStats');
  if (!statsDiv) return;
  let statsText = '';

  if (filteredCount !== null && filteredCount !== totalCount) {
    statsText = `Showing ${filteredCount} of ${totalCount} issues`;
    if (outdatedCount > 0) {
      statsText += ` (${outdatedCount} outdated excluded)`;
    }
  } else if (outdatedCount > 0) {
    statsText = `${outdatedCount} of ${totalCount} issues are outdated`;
  } else {
    statsText = `All ${totalCount} issues are active`;
  }

  statsDiv.textContent = statsText;
  statsDiv.style.display = 'block';
}

// Extract button handler (set up after DOM is ready)
document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  if (extractBtn) {
    extractBtn.addEventListener('click', handleExtract);
  }
});

// AI Review + GitHub posting handlers (set up after DOM is ready)
document.addEventListener('DOMContentLoaded', () => {
  const generateReviewBtn = document.getElementById('generateReviewBtn');
  if (generateReviewBtn) {
    generateReviewBtn.addEventListener('click', handleGenerateReview);
  }

  const previewPostBtn = document.getElementById('previewPostBtn');
  if (previewPostBtn) {
    previewPostBtn.addEventListener('click', handlePreviewPost);
  }

  const postToGitHubBtn = document.getElementById('postToGitHubBtn');
  if (postToGitHubBtn) {
    postToGitHubBtn.addEventListener('click', () => handlePostToGitHub(false));
  }

  const closePreviewModal = document.getElementById('closePreviewModal');
  if (closePreviewModal) {
    closePreviewModal.addEventListener('click', () => {
      const modal = document.getElementById('previewModal');
      if (modal) modal.style.display = 'none';
    });
  }

  const cancelPreview = document.getElementById('cancelPreview');
  if (cancelPreview) {
    cancelPreview.addEventListener('click', () => {
      const modal = document.getElementById('previewModal');
      if (modal) modal.style.display = 'none';
    });
  }

  const confirmPostPreview = document.getElementById('confirmPostPreview');
  if (confirmPostPreview) {
    confirmPostPreview.addEventListener('click', async () => {
      const modal = document.getElementById('previewModal');
      if (modal) modal.style.display = 'none';
      await handlePostToGitHub(false);
    });
  }

  const openHistoryBtn = document.getElementById('openHistoryBtn');
  if (openHistoryBtn) {
    openHistoryBtn.addEventListener('click', () => openExtensionPage('history.html'));
  }

  const openAnalyticsBtn = document.getElementById('openAnalyticsBtn');
  if (openAnalyticsBtn) {
    openAnalyticsBtn.addEventListener('click', () => openExtensionPage('analytics.html'));
  }

  const openBatchBtn = document.getElementById('openBatchBtn');
  if (openBatchBtn) {
    openBatchBtn.addEventListener('click', () => openExtensionPage('batch-ui.html'));
  }
});

async function handleExtract() {
  const button = getEl<HTMLButtonElement>('extractBtn');

  button.disabled = true;
  button.textContent = 'Extracting...';

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) {
      throw new Error('No active tab found');
    }

    // Check if we're on a GitHub PR page
    if (!tab.url.includes('github.com') || !tab.url.includes('/pull/')) {
      showStatus('Please navigate to a GitHub Pull Request page.\n\n• Make sure the URL contains /pull/\n• Refresh the page if you just navigated to a PR', 'error');
      button.disabled = false;
      button.textContent = t('extractAllIssues');
      return;
    }

    // Get filter settings
    currentFilterOptions = getCurrentFilterOptions();
    const filterOptions = currentFilterOptions;

    // Send message to content script to extract issues
    chrome.tabs.sendMessage(tab.id, { action: 'extractIssues', format: 'grouped', filterOptions }, (response: any) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        button.disabled = false;
        button.textContent = t('extractAllIssues');
        return;
      }

      if (response.success) {
        extractedIssues = (response.issues || []) as Issue[];

        // Show filter section if there are issues
        if (response.totalCount > 0) {
          getEl<HTMLElement>('filterSection').style.display = 'block';
          updateFilterStats(response.totalCount, response.outdatedCount);
        }

        if (response.count === 0) {
          const msg = response.totalCount > 0 ?
            `All ${response.totalCount} comments are outdated. Uncheck the filter to see them.` :
            'No review comments found on this PR.';
          showStatus(msg, 'info');
        } else {
          showStatus(`✓ Found ${response.count} comment${response.count !== 1 ? 's' : ''}!`, 'success');
          // Show format options and issues list
          getEl<HTMLElement>('formatSection').style.display = 'block';
          getEl<HTMLElement>('issuesSection').style.display = 'block';
          renderIssuesList(extractedIssues, currentFilterOptions);
          // Auto-copy default format
          copyToClipboard(response.text, 'Grouped format copied to clipboard!');

          // Save to history (defer to avoid blocking UI)
          setTimeout(async () => {
            const historyApi = getReviewHistoryApi();
            if (!historyApi) return;
            try {
              const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
              const prTitle = activeTab?.title?.replace(' · Pull Request #', ' - PR #') || 'PR';
              if (!activeTab?.url) return;
              await historyApi.saveReviewToHistory({
                prUrl: activeTab.url,
                prTitle,
                extractedIssues,
                aiGeneratedIssues: [],
                exportedFormats: ['grouped']
              });
            } catch (error) {
              console.error('Failed to save to history:', error);
            }
          }, 100);
        }
      } else {
        showStatus('Error: ' + response.error, 'error');
      }

      button.disabled = false;
      button.textContent = t('extractAllIssues');
    });
  } catch (error) {
    showStatus('Error: ' + getErrorMessage(error), 'error');
    button.disabled = false;
    button.textContent = t('extractAllIssues');
  }
}

async function copyFormat(format: string, successMessage: string) {
  try {
    const filterOptions = getCurrentFilterOptions();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');
    chrome.tabs.sendMessage(tab.id, { action: 'extractIssues', format: format, filterOptions }, (response: any) => {
      if (response.success) {
        copyToClipboard(response.text, successMessage);
      } else {
        showStatus('Error: ' + response.error, 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + getErrorMessage(error), 'error');
  }
}

// Export as PDF
async function exportAsPDF() {
  try {
    const filterOptions = getCurrentFilterOptions();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');
    chrome.tabs.sendMessage(tab.id, { action: 'extractIssues', format: 'html', filterOptions }, async (response: any) => {
      if (response.success) {
        // Create a blob from HTML
        const blob = new Blob([response.text], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Open in new window for printing
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              // Clean up after a delay
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }, 500);
          };
          showStatus('PDF export opened - use browser print dialog to save as PDF', 'info');
        } else {
          // Fallback: download HTML file
          const a = document.createElement('a');
          a.href = url;
          a.download = `review-${Date.now()}.html`;
          a.click();
          URL.revokeObjectURL(url);
          showStatus('HTML file downloaded - you can convert it to PDF using your browser', 'info');
        }
      } else {
        showStatus('Error: ' + response.error, 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + getErrorMessage(error), 'error');
  }
}

function renderIssuesList(issues: Issue[], filterOptions: FilterOptions | null = null) {
  const issuesList = getEl<HTMLElement>('issuesList');
  issuesList.innerHTML = '';
  issuesList.style.display = 'block';

  // Determine filter options
  const options = filterOptions || currentFilterOptions || {};
  let displayIssues = filterIssuesUtil(issues, options);

  const [sortFieldRaw, sortOrderRaw] = currentSortBy.split('-');
  const sortField = sortFieldRaw || 'severity';
  const sortOrder = sortOrderRaw === 'asc' ? 'asc' : 'desc';
  displayIssues = sortIssuesUtil(displayIssues, sortField, sortOrder);

  // Create mapping for original indices in issues array
  displayIssues.forEach((issue, displayIndex) => {
    // Find the original index in the full issues array
    const originalIndex = issues.findIndex(i =>
      i === issue || (
        i.title === issue.title &&
        i.filePath === issue.filePath &&
        i.author === issue.author &&
        i.severity === issue.severity
      )
    );

    const issueItem = document.createElement('div');
    issueItem.className = 'issue-item';

    const severityClass = `severity-${issue.severity}`;
    const severityEmoji = issue.severity === 'critical' ? '🔴' :
                         issue.severity === 'warning' ? '🟡' : '🔵';
    const outdatedLabel = issue.outdated ? ' <span style="color: #57606a; font-size: 10px;">(Outdated)</span>' : '';
    const authorBadge = issue.isBot ? '🤖' : '👤';

    issueItem.setAttribute('role', 'listitem');
    issueItem.innerHTML = `
      <div class="issue-header">
        <span class="severity-badge ${severityClass}" aria-label="Severity: ${issue.severity}">${severityEmoji} ${issue.severity.toUpperCase()}</span>
        <button class="copy-single" data-original-index="${originalIndex >= 0 ? originalIndex : displayIndex}" aria-label="Copy issue ${displayIndex + 1}: ${issue.title}">Copy</button>
      </div>
      <div class="issue-title" role="heading" aria-level="3">${escapeHtml(issue.title)}${outdatedLabel}</div>
      <div class="issue-file" aria-label="File path">📁 ${escapeHtml(issue.filePath)}</div>
      <div class="issue-file" aria-label="Author: ${issue.author}">${authorBadge} ${escapeHtml(issue.author)}</div>
    `;

    issuesList.appendChild(issueItem);
  });

  // Add event listeners to copy buttons
  document.querySelectorAll<HTMLButtonElement>('.copy-single').forEach((buttonEl) => {
    buttonEl.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const originalIndex = parseInt(target.getAttribute('data-original-index') || '', 10);
      if (isNaN(originalIndex) || originalIndex < 0 || !extractedIssues[originalIndex]) {
        console.error('Invalid issue index:', originalIndex);
        return;
      }
      const issue = extractedIssues[originalIndex];

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) throw new Error('No active tab found');
        chrome.tabs.sendMessage(tab.id, {
          action: 'formatSingleIssue',
          issue: issue,
          index: originalIndex
        }, (response: any) => {
          if (response.success) {
            copyToClipboard(response.text, `Issue #${originalIndex + 1} copied!`);
          }
        });
      } catch (error) {
        showStatus('Error: ' + getErrorMessage(error), 'error');
      }
    });
  });
}

// Helper to escape HTML (simple version for popup.js)
function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyToClipboard(text: string, successMessage: string) {
  navigator.clipboard.writeText(text).then(() => {
    showStatus(successMessage, 'success');
  }).catch(err => {
    showStatus('Failed to copy to clipboard: ' + err.message, 'error');
  });
}

type StatusType = 'success' | 'error' | 'info';

function showStatus(message: string, type: StatusType) {
  const status = getEl<HTMLElement>('status');

  // Format error messages with suggestions if available
  if (type === 'error' && message.includes('\n\n')) {
    // Multi-line error with suggestions
    const lines = message.split('\n\n');
    status.innerHTML = `<div style="font-weight: 600; margin-bottom: 8px;">${lines[0]}</div>` +
                       `<div style="font-size: 11px; line-height: 1.6;">${lines.slice(1).join('<br>')}</div>`;
  } else {
    status.textContent = message;
  }

  status.className = type;
  status.style.display = 'block';

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  // Auto-hide info messages after 5 seconds
  if (type === 'info') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 5000);
  }
}

// AI Review Generation
async function handleGenerateReview() {
  const button = getEl<HTMLButtonElement>('generateReviewBtn');
  const progressSection = getEl<HTMLElement>('reviewProgressSection');
  const progressText = getEl<HTMLElement>('reviewProgress');
  const progressFill = getEl<HTMLElement>('progressFill');

  try {
    // Check if we're on a GitHub PR page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) {
      throw new Error('No active tab found');
    }
    if (!tab.url.includes('github.com') || !tab.url.includes('/pull/')) {
      showStatus('Please navigate to a GitHub Pull Request page.', 'error');
      return;
    }

    // Get settings
    const settingsResponse = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
    if (!settingsResponse.success) {
      showStatus('Failed to load settings', 'error');
      return;
    }

    const settings = settingsResponse.settings;

    // Check if LLM is configured
    if (!settings.llmEndpoint || !settings.apiKey || !settings.modelName) {
      showStatus('Please configure LLM settings first (right-click extension → Options)', 'error');
      return;
    }

    // Disable button and show progress
    button.disabled = true;
    button.textContent = 'Generating Review...';
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';

    // Send message to content script to start review
    chrome.tabs.sendMessage(tab.id, {
      action: 'generateAIReview',
      settings: settings
    }, async (response: any) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        button.disabled = false;
        button.textContent = t('generateAIReview');
        progressSection.style.display = 'none';
        return;
      }

      if (response.success) {
        // Store AI issues separately and merge with extracted issues
        aiGeneratedIssues = (response.issues || []) as Issue[];
        extractedIssues = [...extractedIssues, ...aiGeneratedIssues];

        progressFill.style.width = '100%';
        progressText.textContent = `✓ Generated ${aiGeneratedIssues.length} AI review comment${aiGeneratedIssues.length !== 1 ? 's' : ''}!`;

        // Show results
        if (aiGeneratedIssues.length > 0) {
          showStatus(`✓ AI review complete! Found ${aiGeneratedIssues.length} issue${aiGeneratedIssues.length !== 1 ? 's' : ''}`, 'success');
          getEl<HTMLElement>('formatSection').style.display = 'block';
          getEl<HTMLElement>('issuesSection').style.display = 'block';
          getEl<HTMLButtonElement>('previewPostBtn').style.display = 'block';
          getEl<HTMLButtonElement>('postToGitHubBtn').style.display = 'block';
          renderIssuesList(extractedIssues, null);
        } else {
          showStatus('AI review complete. No issues found.', 'info');
        }

        // Hide progress after 3 seconds
        setTimeout(() => {
          progressSection.style.display = 'none';
        }, 3000);
      } else {
        showStatus('AI review failed: ' + response.error, 'error');
        progressSection.style.display = 'none';
      }

      button.disabled = false;
      button.textContent = t('generateAIReview');
    });

    // Listen for progress updates (per-popup-instance)
    chrome.runtime.onMessage.addListener((request: any) => {
      if (request.action !== 'AI_REVIEW_PROGRESS') return;
      progressText.textContent = request.message;
      if (typeof request.progress === 'number') {
        progressFill.style.width = `${request.progress}%`;
      }
    });

  } catch (error) {
    console.error('Generate review error:', error);
    showStatus('Error: ' + getErrorMessage(error), 'error');
    button.disabled = false;
    button.textContent = t('generateAIReview');
    progressSection.style.display = 'none';
  }
}

// Preview AI Review before posting
async function handlePreviewPost() {
  if (aiGeneratedIssues.length === 0) {
    showStatus('No AI review comments to preview', 'error');
    return;
  }

  const previewContent = getEl<HTMLElement>('previewContent');
  const modal = getEl<HTMLElement>('previewModal');

  // Generate preview HTML
  let previewHTML = `<div style="margin-bottom: 16px; padding: 12px; background: var(--bg-primary); border-radius: 4px; border-left: 4px solid var(--status-info-border);">
    <strong style="color: var(--text-primary);">${aiGeneratedIssues.length} comment${aiGeneratedIssues.length !== 1 ? 's' : ''} will be posted to GitHub</strong>
  </div>`;

  // Group by file
  const groupedByFile: Record<string, (Issue & { previewIndex: number })[]> = {};
  aiGeneratedIssues.forEach((issue, index) => {
    if (!groupedByFile[issue.filePath]) {
      groupedByFile[issue.filePath] = [];
    }
    groupedByFile[issue.filePath].push({ ...issue, previewIndex: index });
  });

  Object.entries(groupedByFile).forEach(([filePath, issues]) => {
    previewHTML += `<div style="margin-bottom: 20px; padding: 12px; background: var(--bg-primary); border-radius: 4px; border: 1px solid var(--border-color);">
      <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 12px; font-family: monospace; font-size: 12px;">${filePath}</div>`;

    issues.forEach((issue) => {
      const severityEmoji = issue.severity === 'critical' ? '🔴' :
                           issue.severity === 'warning' ? '🟡' : '🔵';
      const severityLabel = issue.severity.toUpperCase();

      previewHTML += `<div style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 4px; border-left: 3px solid var(--severity-${issue.severity}-border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: var(--text-primary);">${severityEmoji} ${issue.title}</span>
          <span style="font-size: 10px; padding: 2px 6px; background: var(--severity-${issue.severity}-bg); color: var(--severity-${issue.severity}-text); border-radius: 12px;">${severityLabel}</span>
        </div>
        <div style="color: var(--text-secondary); font-size: 12px; line-height: 1.5; white-space: pre-wrap;">${issue.content || issue.suggestion || 'No description'}</div>
      </div>`;
    });

    previewHTML += `</div>`;
  });

  previewContent.innerHTML = previewHTML;
  modal.style.display = 'block';
}

// Post AI Review to GitHub
async function handlePostToGitHub(asDraft = false) {
  const button = asDraft ? getEl<HTMLButtonElement>('postDraftBtn') : getEl<HTMLButtonElement>('postToGitHubBtn');

  try {
    // Check if we have AI generated issues
    if (aiGeneratedIssues.length === 0) {
      showStatus('No AI review comments to post', 'error');
      return;
    }

    // Get settings for GitHub token
    const settingsResponse = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
    if (!settingsResponse.success) {
      showStatus('Failed to load settings', 'error');
      return;
    }

    const githubToken = settingsResponse.settings.githubToken;
    if (!githubToken) {
      showStatus('GitHub token not configured. Please add it in extension settings.', 'error');
      return;
    }

    // Get current PR info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) throw new Error('No active tab found');
    const prUrl = tab.url;
    const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);

    if (!match) {
      showStatus('Not on a GitHub PR page', 'error');
      return;
    }

    const [, owner, repo, prNumber] = match;

    button.disabled = true;
    button.textContent = asDraft ? 'Posting as draft...' : 'Posting...';

    // Post to GitHub
    const response = await chrome.runtime.sendMessage({
      action: 'POST_GITHUB_REVIEW',
      owner: owner,
      repo: repo,
      prNumber: parseInt(prNumber),
      comments: aiGeneratedIssues,
      githubToken: githubToken,
      asDraft: asDraft
    });

    if (response.success) {
      const draftMsg = asDraft ? ' as draft' : '';
      showStatus(`✓ Posted ${response.commentsPosted} AI review comment${response.commentsPosted !== 1 ? 's' : ''} to GitHub${draftMsg}!`, 'success');
      button.textContent = asDraft ? '✓ Posted as Draft' : '✓ Posted to GitHub';
      button.style.background = '#2da44e';
      button.style.color = 'white';
    } else {
      showStatus(`Failed to post: ${response.error}`, 'error');
      button.disabled = false;
      button.textContent = asDraft ? '📝 Post as Draft' : '📤 Post Review';
    }
  } catch (error) {
    console.error('Post to GitHub error:', error);
    showStatus('Error: ' + getErrorMessage(error), 'error');
    button.disabled = false;
    button.textContent = asDraft ? '📝 Post as Draft' : '📤 Post Review';
  }
}
