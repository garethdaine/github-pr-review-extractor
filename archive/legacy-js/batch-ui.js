// Batch UI controller for GitHub PR Review Extractor

let batchProcessor = null;
let currentResults = [];

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('startBatch').addEventListener('click', startBatch);
  document.getElementById('pauseBatch').addEventListener('click', pauseBatch);
  document.getElementById('resumeBatch').addEventListener('click', resumeBatch);
  document.getElementById('cancelBatch').addEventListener('click', cancelBatch);
  document.getElementById('exportReport').addEventListener('click', exportReport);
  document.getElementById('exportJSON').addEventListener('click', exportJSON);
}

async function startBatch() {
  const urlsText = document.getElementById('prUrls').value.trim();
  if (!urlsText) {
    showStatus('Please enter at least one PR URL', 'error');
    return;
  }

  const prUrls = urlsText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes('github.com'));

  if (prUrls.length === 0) {
    showStatus('No valid PR URLs found', 'error');
    return;
  }

  // Get settings
  const settings = await chrome.storage.local.get(null);

  // Initialize review engine and batch processor
  // Note: These should be loaded from the built files
  if (typeof ReviewEngine === 'undefined' || typeof GitHubAPIClient === 'undefined') {
    showStatus('Review engine not loaded. Please ensure the extension is properly built.', 'error');
    return;
  }

  const reviewEngine = new ReviewEngine(settings);
  const githubClient = new GitHubAPIClient(settings.githubToken);
  batchProcessor = new BatchProcessor(reviewEngine, githubClient);

  // Update UI
  document.getElementById('startBatch').disabled = true;
  document.getElementById('pauseBatch').style.display = 'inline-block';
  document.getElementById('cancelBatch').style.display = 'inline-block';
  document.getElementById('progressSection').classList.add('active');
  document.getElementById('resultsSection').classList.remove('active');
  currentResults = [];

  // Start processing
  try {
    const results = await batchProcessor.processPRs(prUrls, updateProgress);
    currentResults = results;
    displayResults(results);

    document.getElementById('startBatch').disabled = false;
    document.getElementById('pauseBatch').style.display = 'none';
    document.getElementById('resumeBatch').style.display = 'none';
    document.getElementById('cancelBatch').style.display = 'none';

    showStatus(`Batch review completed! Reviewed ${results.length} PRs.`, 'success');
  } catch (error) {
    showStatus(`Batch review failed: ${error.message}`, 'error');
    document.getElementById('startBatch').disabled = false;
    document.getElementById('pauseBatch').style.display = 'none';
    document.getElementById('cancelBatch').style.display = 'none';
  }
}

function pauseBatch() {
  if (batchProcessor) {
    batchProcessor.pause();
    document.getElementById('pauseBatch').style.display = 'none';
    document.getElementById('resumeBatch').style.display = 'inline-block';
  }
}

function resumeBatch() {
  if (batchProcessor) {
    batchProcessor.resume();
    document.getElementById('pauseBatch').style.display = 'inline-block';
    document.getElementById('resumeBatch').style.display = 'none';
  }
}

function cancelBatch() {
  if (batchProcessor) {
    batchProcessor.cancel();
    document.getElementById('startBatch').disabled = false;
    document.getElementById('pauseBatch').style.display = 'none';
    document.getElementById('resumeBatch').style.display = 'none';
    document.getElementById('cancelBatch').style.display = 'none';
    showStatus('Batch review cancelled', 'info');
  }
}

function updateProgress(progress) {
  const percent = Math.round((progress.current / progress.total) * 100);
  document.getElementById('progressFill').style.width = `${percent}%`;
  document.getElementById('progressFill').textContent = `${percent}%`;
  document.getElementById('progressText').textContent =
    `Processing ${progress.current} of ${progress.total}: ${progress.currentPR}`;
}

function displayResults(results) {
  const resultsList = document.getElementById('resultsList');
  resultsList.innerHTML = '';

  results.forEach((result, index) => {
    const item = document.createElement('div');
    item.className = `result-item ${result.success ? 'success' : 'error'}`;

    const title = document.createElement('div');
    title.className = 'result-title';
    title.textContent = `${index + 1}. ${result.prTitle}`;
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'result-meta';
    if (result.success) {
      meta.innerHTML = `
        <div>✓ Success | Files: ${result.filesReviewed || 0} | Issues: ${result.issues.length}</div>
        <div><a href="${result.prUrl}" target="_blank">${result.prUrl}</a></div>
      `;
    } else {
      meta.innerHTML = `
        <div>✗ Failed: ${result.error}</div>
        <div><a href="${result.prUrl}" target="_blank">${result.prUrl}</a></div>
      `;
    }
    item.appendChild(meta);

    resultsList.appendChild(item);
  });

  document.getElementById('resultsSection').classList.add('active');
}

function exportReport() {
  if (!batchProcessor || currentResults.length === 0) {
    showStatus('No results to export', 'error');
    return;
  }

  const report = batchProcessor.generateCombinedReport(currentResults);
  copyToClipboard(report);
  showStatus('Combined report copied to clipboard!', 'success');
}

function exportJSON() {
  if (currentResults.length === 0) {
    showStatus('No results to export', 'error');
    return;
  }

  const json = JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalPRs: currentResults.length,
    results: currentResults
  }, null, 2);

  copyToClipboard(json);
  showStatus('Results exported as JSON to clipboard!', 'success');
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type} active`;

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      status.classList.remove('active');
    }, 5000);
  }
}

