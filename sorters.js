// Sorting utilities for GitHub PR Review Extractor

/**
 * Sort issues by various criteria
 * @param {Array} issues - Array of issue objects
 * @param {string} sortBy - Sort criterion: 'severity', 'file', 'author', 'date', 'file-count'
 * @param {string} order - Sort order: 'asc' or 'desc'
 * @returns {Array} - Sorted issues
 */
function sortIssues(issues, sortBy = 'severity', order = 'desc') {
  const sorted = [...issues];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'severity':
        // Severity order: critical > warning > suggestion
        const severityOrder = { critical: 3, warning: 2, suggestion: 1 };
        const aSeverity = severityOrder[a.severity] || 0;
        const bSeverity = severityOrder[b.severity] || 0;
        comparison = aSeverity - bSeverity;
        break;

      case 'file':
        // Sort by file path alphabetically
        comparison = (a.filePath || '').localeCompare(b.filePath || '');
        break;

      case 'author':
        // Sort by author name alphabetically
        comparison = (a.author || '').localeCompare(b.author || '');
        break;

      case 'date':
        // Sort by timestamp (newest first by default)
        const aDate = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const bDate = b.timestamp ? new Date(b.timestamp) : new Date(0);
        comparison = aDate - bDate;
        break;

      case 'title':
        // Sort by title alphabetically
        comparison = (a.title || '').localeCompare(b.title || '');
        break;

      case 'file-count':
        // This requires grouping by file first, then sorting files by issue count
        // For individual issues, this doesn't apply directly
        // Should be handled at a higher level when grouping by file
        comparison = 0;
        break;

      default:
        comparison = 0;
    }

    // Apply sort order
    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Sort issues grouped by file, with files sorted by issue count
 * @param {Object} groupedIssues - Object with file paths as keys and arrays of issues as values
 * @param {string} sortBy - How to sort files: 'count', 'path'
 * @param {string} order - Sort order: 'asc' or 'desc'
 * @returns {Object} - Sorted grouped issues
 */
function sortGroupedIssues(groupedIssues, sortBy = 'count', order = 'desc') {
  const sorted = {};
  const entries = Object.entries(groupedIssues);

  entries.sort(([fileA, issuesA], [fileB, issuesB]) => {
    let comparison = 0;

    if (sortBy === 'count') {
      comparison = issuesA.length - issuesB.length;
    } else if (sortBy === 'path') {
      comparison = fileA.localeCompare(fileB);
    }

    return order === 'desc' ? -comparison : comparison;
  });

  entries.forEach(([file, issues]) => {
    sorted[file] = issues;
  });

  return sorted;
}

/**
 * Get available sort options
 * @returns {Array} - Array of sort option objects
 */
function getSortOptions() {
  return [
    { value: 'severity', label: 'By Severity (Critical first)' },
    { value: 'file', label: 'By File Path (A-Z)' },
    { value: 'author', label: 'By Author (A-Z)' },
    { value: 'date', label: 'By Date (Newest first)' },
    { value: 'title', label: 'By Title (A-Z)' }
  ];
}

// Export for use in popup and content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sortIssues, sortGroupedIssues, getSortOptions };
}

