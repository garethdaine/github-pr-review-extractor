// Batch UI controller for GitHub PR Review Extractor

import type { BatchProcessor, BatchResult } from '../../services/batch-processor';
import type { ReviewEngine } from '../../services/review-engine';
import type { GitHubAPIClient } from '../../services/github-api';

declare global {
  interface Window {
    ReviewEngine: new (settings: any) => ReviewEngine;
    GitHubAPIClient: new (token: string) => GitHubAPIClient;
    BatchProcessor: new (reviewEngine: ReviewEngine, githubClient: GitHubAPIClient) => BatchProcessor;
  }
}

interface ProgressInfo {
  current: number;
  total: number;
  currentPR: string;
}

let batchProcessor: BatchProcessor | null = null;
let currentResults: BatchResult[] = [];

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

function setupEventListeners(): void {
  getElementById<HTMLButtonElement>('startBatch').addEventListener('click', startBatch);
  getElementById<HTMLButtonElement>('pauseBatch').addEventListener('click', pauseBatch);
  getElementById<HTMLButtonElement>('resumeBatch').addEventListener('click', resumeBatch);
  getElementById<HTMLButtonElement>('cancelBatch').addEventListener('click', cancelBatch);
  getElementById<HTMLButtonElement>('exportReport').addEventListener('click', exportReport);
  getElementById<HTMLButtonElement>('exportJSON').addEventListener('click', exportJSON);
}

async function startBatch(): Promise<void> {
  const urlsText = (getElementById<HTMLTextAreaElement>('prUrls')).value.trim();
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

  const settings = await chrome.storage.local.get(null);

  if (typeof window.ReviewEngine === 'undefined' || typeof window.GitHubAPIClient === 'undefined') {
    showStatus('Review engine not loaded. Please ensure the extension is properly built.', 'error');
    return;
  }

  const reviewEngine = new window.ReviewEngine(settings);
  const githubClient = new window.GitHubAPIClient(settings.githubToken || '');
  batchProcessor = new window.BatchProcessor(reviewEngine, githubClient);

  getElementById<HTMLButtonElement>('startBatch').disabled = true;
  getElementById<HTMLElement>('pauseBatch').style.display = 'inline-block';
  getElementById<HTMLElement>('cancelBatch').style.display = 'inline-block';
  getElementById<HTMLElement>('progressSection').classList.add('active');
  getElementById<HTMLElement>('resultsSection').classList.remove('active');
  currentResults = [];

  try {
    const results = await batchProcessor.processPRs(prUrls, updateProgress);
    currentResults = results as BatchResult[];
    displayResults(currentResults);

    getElementById<HTMLButtonElement>('startBatch').disabled = false;
    getElementById<HTMLElement>('pauseBatch').style.display = 'none';
    getElementById<HTMLElement>('resumeBatch').style.display = 'none';
    getElementById<HTMLElement>('cancelBatch').style.display = 'none';

    showStatus(`Batch review completed! Reviewed ${results.length} PRs.`, 'success');
  } catch (error) {
    showStatus(`Batch review failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    getElementById<HTMLButtonElement>('startBatch').disabled = false;
    getElementById<HTMLElement>('pauseBatch').style.display = 'none';
    getElementById<HTMLElement>('cancelBatch').style.display = 'none';
  }
}

function pauseBatch(): void {
  if (batchProcessor) {
    batchProcessor.pause();
    getElementById<HTMLElement>('pauseBatch').style.display = 'none';
    getElementById<HTMLElement>('resumeBatch').style.display = 'inline-block';
  }
}

function resumeBatch(): void {
  if (batchProcessor) {
    batchProcessor.resume();
    getElementById<HTMLElement>('pauseBatch').style.display = 'inline-block';
    getElementById<HTMLElement>('resumeBatch').style.display = 'none';
  }
}

function cancelBatch(): void {
  if (batchProcessor) {
    batchProcessor.cancel();
    getElementById<HTMLButtonElement>('startBatch').disabled = false;
    getElementById<HTMLElement>('pauseBatch').style.display = 'none';
    getElementById<HTMLElement>('resumeBatch').style.display = 'none';
    getElementById<HTMLElement>('cancelBatch').style.display = 'none';
    showStatus('Batch review cancelled', 'info');
  }
}

function updateProgress(progress: ProgressInfo): void {
  const percent = Math.round((progress.current / progress.total) * 100);
  const progressFill = getElementById<HTMLElement>('progressFill');
  progressFill.style.width = `${percent}%`;
  progressFill.textContent = `${percent}%`;
  getElementById<HTMLElement>('progressText').textContent =
    `Processing ${progress.current} of ${progress.total}: ${progress.currentPR}`;
}

function displayResults(results: BatchResult[]): void {
  const resultsList = getElementById<HTMLElement>('resultsList');
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
        <div>✓ Success | Files: ${result.filesReviewed || 0} | Issues: ${result.issues?.length || 0}</div>
        <div><a href="${result.prUrl}" target="_blank">${result.prUrl}</a></div>
      `;
    } else {
      meta.innerHTML = `
        <div>✗ Failed: ${result.error || 'Unknown error'}</div>
        <div><a href="${result.prUrl}" target="_blank">${result.prUrl}</a></div>
      `;
    }
    item.appendChild(meta);

    resultsList.appendChild(item);
  });

  getElementById<HTMLElement>('resultsSection').classList.add('active');
}

function exportReport(): void {
  if (!batchProcessor || currentResults.length === 0) {
    showStatus('No results to export', 'error');
    return;
  }

  const report = batchProcessor.generateCombinedReport(currentResults);
  copyToClipboard(report);
  showStatus('Combined report copied to clipboard!', 'success');
}

function exportJSON(): void {
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

function copyToClipboard(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  const status = getElementById<HTMLElement>('status');
  status.textContent = message;
  status.className = `status ${type} active`;

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      status.classList.remove('active');
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});





