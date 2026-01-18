// Review history management for GitHub PR Review Extractor

import type { Issue } from '../types/issue';

export interface ReviewHistoryEntry {
  id: string;
  timestamp: string;
  prUrl: string;
  prTitle: string;
  extractedIssues: Issue[];
  aiGeneratedIssues: Issue[];
  totalIssues: number;
  exportedFormats: string[];
}

export interface HistorySearchFilters {
  query?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'timestamp' | 'totalIssues' | 'prTitle';
  sortOrder?: 'asc' | 'desc';
}

export interface ReviewData {
  prUrl: string;
  prTitle?: string;
  extractedIssues?: Issue[];
  aiGeneratedIssues?: Issue[];
  exportedFormats?: string[];
}

const HISTORY_STORAGE_KEY = 'reviewHistory';
export const MAX_HISTORY_ITEMS = 50;

export async function saveReviewToHistory(reviewData: ReviewData): Promise<ReviewHistoryEntry> {
  try {
    const history = await getReviewHistory();

    const historyEntry: ReviewHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      prUrl: reviewData.prUrl,
      prTitle: reviewData.prTitle || 'Untitled PR',
      extractedIssues: reviewData.extractedIssues || [],
      aiGeneratedIssues: reviewData.aiGeneratedIssues || [],
      totalIssues: (reviewData.extractedIssues?.length || 0) + (reviewData.aiGeneratedIssues?.length || 0),
      exportedFormats: reviewData.exportedFormats || []
    };

    history.unshift(historyEntry);

    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }

    await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history });
    return historyEntry;
  } catch (error) {
    console.error('Failed to save review to history:', error);
    throw error;
  }
}

export async function getReviewHistory(): Promise<ReviewHistoryEntry[]> {
  try {
    const result = await chrome.storage.local.get([HISTORY_STORAGE_KEY]);
    return (result[HISTORY_STORAGE_KEY] as ReviewHistoryEntry[]) || [];
  } catch (error) {
    console.error('Failed to get review history:', error);
    return [];
  }
}

export async function getReviewById(id: string): Promise<ReviewHistoryEntry | null> {
  try {
    const history = await getReviewHistory();
    return history.find(entry => entry.id === id) || null;
  } catch (error) {
    console.error('Failed to get review by ID:', error);
    return null;
  }
}

export async function deleteReviewFromHistory(id: string): Promise<boolean> {
  try {
    const history = await getReviewHistory();
    const filtered = history.filter(entry => entry.id !== id);

    if (filtered.length === history.length) {
      return false;
    }

    await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: filtered });
    return true;
  } catch (error) {
    console.error('Failed to delete review from history:', error);
    return false;
  }
}

export async function clearReviewHistory(): Promise<void> {
  try {
    await chrome.storage.local.remove(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear review history:', error);
    throw error;
  }
}

export async function searchReviewHistory(filters: HistorySearchFilters = {}): Promise<ReviewHistoryEntry[]> {
  try {
    let history = await getReviewHistory();

    if (filters.query) {
      const query = filters.query.toLowerCase();
      history = history.filter(entry =>
        entry.prUrl.toLowerCase().includes(query) ||
        entry.prTitle.toLowerCase().includes(query)
      );
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      history = history.filter(entry => new Date(entry.timestamp) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      history = history.filter(entry => new Date(entry.timestamp) <= end);
    }

    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder || 'desc';

    history.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'totalIssues') {
        comparison = a.totalIssues - b.totalIssues;
      } else if (sortBy === 'prTitle') {
        comparison = a.prTitle.localeCompare(b.prTitle);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return history;
  } catch (error) {
    console.error('Failed to search review history:', error);
    return [];
  }
}

export async function exportHistoryAsJSON(history?: ReviewHistoryEntry[]): Promise<string> {
  try {
    const data = history || await getReviewHistory();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export history:', error);
    throw error;
  }
}

// Expose globally for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).reviewHistory = {
    saveReviewToHistory,
    getReviewHistory,
    getReviewById,
    deleteReviewFromHistory,
    clearReviewHistory,
    searchReviewHistory,
    exportHistoryAsJSON,
    MAX_HISTORY_ITEMS
  };
}











