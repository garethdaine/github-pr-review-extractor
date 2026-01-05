// Content script entry point for GitHub PR Review Extractor
// This file replaces content.js and uses the modular structure

import { extractIssues } from './extractor';
import { filterIssues } from './filters';
import {
  formatIssuesGroupedByFile,
  formatSingleIssue,
  formatIssuesSummary,
  formatIssuesAsJSON,
  formatIssuesAsHTML,
  formatIssuesAsCSV
} from './formatters';
import type { Issue, FilterOptions } from '../types/issue';
import cache, { getIssuesCacheKey } from '../utils/cache';

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).extractBotIssues = extractIssues;
  (window as any).filterIssues = filterIssues;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractIssues') {
    try {
      const prUrl = window.location.href;
      const cacheKey = getIssuesCacheKey(prUrl);

      // Check cache first
      let issues = cache.get<Issue[]>(cacheKey);

      if (!issues) {
        // Extract and cache
        issues = extractIssues();
        cache.set(cacheKey, issues, 10 * 60 * 1000); // Cache for 10 minutes
      }

      const format = request.format || 'grouped';
      const filterOptions: FilterOptions = request.filterOptions || {};

      const filteredIssues = filterIssues(issues, filterOptions);

      let formattedText: string;
      switch(format) {
        case 'grouped':
          formattedText = formatIssuesGroupedByFile(issues, true, filterOptions);
          break;
        case 'summary':
          formattedText = formatIssuesSummary(filteredIssues);
          break;
        case 'json':
          formattedText = formatIssuesAsJSON(filteredIssues);
          break;
        case 'no-instructions':
          formattedText = formatIssuesGroupedByFile(issues, false, filterOptions);
          break;
        case 'html':
          formattedText = formatIssuesAsHTML(filteredIssues);
          break;
        case 'csv':
          formattedText = formatIssuesAsCSV(filteredIssues);
          break;
        default:
          formattedText = formatIssuesGroupedByFile(issues, true, filterOptions);
      }

      sendResponse({
        success: true,
        count: filteredIssues.length,
        totalCount: issues.length,
        outdatedCount: issues.filter(i => i.outdated).length,
        text: formattedText,
        issues: issues
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (request.action === 'formatSingleIssue') {
    try {
      const formattedText = formatSingleIssue(request.issue, request.index);
      sendResponse({
        success: true,
        text: formattedText
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (request.action === 'generateAIReview') {
    handleAIReview(request.settings, sendResponse);
    return true; // Keep channel open for async response
  }
  return true; // Keep channel open for async response
});

// AI Review Handler
async function handleAIReview(settings: any, sendResponse: (response: any) => void) {
  try {
    // ReviewEngine should be available from review-engine.js loaded in manifest
    const ReviewEngine = (window as any).ReviewEngine;
    if (!ReviewEngine) {
      throw new Error('ReviewEngine not available');
    }

    const reviewEngine = new ReviewEngine(settings);

    const result = await reviewEngine.generateReview((progress: any) => {
      chrome.runtime.sendMessage({
        action: 'AI_REVIEW_PROGRESS',
        message: progress.message,
        progress: progress.progress
      });
    });

    if (result.success) {
      sendResponse({
        success: true,
        issues: result.issues,
        filesReviewed: result.filesReviewed
      });
    } else {
      sendResponse({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('AI review error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
