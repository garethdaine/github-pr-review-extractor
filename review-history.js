// Review history management for GitHub PR Review Extractor

const HISTORY_STORAGE_KEY = 'reviewHistory';
const MAX_HISTORY_ITEMS = 50;

/**
 * Save a review to history
 * @param {Object} reviewData - Review data to save
 * @returns {Promise<void>}
 */
async function saveReviewToHistory(reviewData) {
  try {
    const history = await getReviewHistory();

    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      prUrl: reviewData.prUrl,
      prTitle: reviewData.prTitle || 'Untitled PR',
      extractedIssues: reviewData.extractedIssues || [],
      aiGeneratedIssues: reviewData.aiGeneratedIssues || [],
      totalIssues: (reviewData.extractedIssues?.length || 0) + (reviewData.aiGeneratedIssues?.length || 0),
      exportedFormats: reviewData.exportedFormats || []
    };

    // Add to beginning of array (newest first)
    history.unshift(historyEntry);

    // Limit history size
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

/**
 * Get all review history
 * @returns {Promise<Array>} - Array of history entries
 */
async function getReviewHistory() {
  try {
    const result = await chrome.storage.local.get([HISTORY_STORAGE_KEY]);
    return result[HISTORY_STORAGE_KEY] || [];
  } catch (error) {
    console.error('Failed to get review history:', error);
    return [];
  }
}

/**
 * Get a specific review by ID
 * @param {string} id - Review ID
 * @returns {Promise<Object|null>} - Review entry or null if not found
 */
async function getReviewById(id) {
  try {
    const history = await getReviewHistory();
    return history.find(entry => entry.id === id) || null;
  } catch (error) {
    console.error('Failed to get review by ID:', error);
    return null;
  }
}

/**
 * Delete a review from history
 * @param {string} id - Review ID to delete
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function deleteReviewFromHistory(id) {
  try {
    const history = await getReviewHistory();
    const filtered = history.filter(entry => entry.id !== id);

    if (filtered.length === history.length) {
      return false; // Not found
    }

    await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: filtered });
    return true;
  } catch (error) {
    console.error('Failed to delete review from history:', error);
    return false;
  }
}

/**
 * Clear all review history
 * @returns {Promise<void>}
 */
async function clearReviewHistory() {
  try {
    await chrome.storage.local.remove(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear review history:', error);
    throw error;
  }
}

/**
 * Search/filter review history
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - Filtered history entries
 */
async function searchReviewHistory(filters = {}) {
  try {
    let history = await getReviewHistory();

    // Filter by PR URL or title
    if (filters.query) {
      const query = filters.query.toLowerCase();
      history = history.filter(entry =>
        entry.prUrl.toLowerCase().includes(query) ||
        entry.prTitle.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      history = history.filter(entry => new Date(entry.timestamp) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      history = history.filter(entry => new Date(entry.timestamp) <= end);
    }

    // Sort
    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder || 'desc';

    history.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp) - new Date(b.timestamp);
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

/**
 * Export history as JSON
 * @param {Array} history - History entries to export (optional, exports all if not provided)
 * @returns {Promise<string>} - JSON string
 */
async function exportHistoryAsJSON(history = null) {
  try {
    const data = history || await getReviewHistory();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export history:', error);
    throw error;
  }
}

// Export for use in popup and history page
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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

