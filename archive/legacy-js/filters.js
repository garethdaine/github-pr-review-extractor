// Filter utilities for GitHub PR Review Extractor

/**
 * Filter issues based on multiple criteria
 * @param {Array} issues - Array of issue objects
 * @param {Object} options - Filter options
 * @returns {Array} - Filtered issues
 */
function filterIssues(issues, options = {}) {
  let filtered = [...issues];

  // Filter out outdated issues if requested
  if (options.excludeOutdated) {
    filtered = filtered.filter(issue => !issue.outdated);
  }

  // Filter by severity (can be single value or array)
  if (options.severity) {
    if (Array.isArray(options.severity)) {
      filtered = filtered.filter(issue => options.severity.includes(issue.severity));
    } else {
      filtered = filtered.filter(issue => issue.severity === options.severity);
    }
  }

  // Filter by author type
  if (options.authorType) {
    if (options.authorType === 'bot') {
      filtered = filtered.filter(issue => issue.isBot === true);
    } else if (options.authorType === 'human') {
      filtered = filtered.filter(issue => issue.isHuman === true);
    } else if (options.authorType === 'copilot') {
      filtered = filtered.filter(issue => issue.type === 'GitHub Copilot AI');
    } else if (options.authorType === 'cursor') {
      filtered = filtered.filter(issue => issue.type === 'Cursor Bot');
    }
  }

  // Filter by specific authors (array of author names)
  if (options.authors && Array.isArray(options.authors) && options.authors.length > 0) {
    filtered = filtered.filter(issue => options.authors.includes(issue.author));
  }

  // Filter by file paths (regex patterns)
  if (options.filePaths && Array.isArray(options.filePaths) && options.filePaths.length > 0) {
    filtered = filtered.filter(issue => {
      return options.filePaths.some(pattern => {
        try {
          const regex = new RegExp(pattern);
          return regex.test(issue.filePath);
        } catch (e) {
          // If regex is invalid, treat as simple string match
          return issue.filePath.includes(pattern);
        }
      });
    });
  }

  // Search query (searches in title, content, and file path)
  if (options.searchQuery && options.searchQuery.trim()) {
    const query = options.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(issue => {
      const searchableText = [
        issue.title || '',
        issue.content || '',
        issue.filePath || '',
        issue.author || ''
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }

  return filtered;
}

/**
 * Get unique values for filter options
 * @param {Array} issues - Array of all issues
 * @returns {Object} - Available filter options
 */
function getAvailableFilterOptions(issues) {
  const severities = new Set();
  const authors = new Set();
  const authorTypes = new Set();
  const filePaths = new Set();

  issues.forEach(issue => {
    if (issue.severity) severities.add(issue.severity);
    if (issue.author) authors.add(issue.author);
    if (issue.type) authorTypes.add(issue.type);
    if (issue.filePath) filePaths.add(issue.filePath);
  });

  return {
    severities: Array.from(severities).sort(),
    authors: Array.from(authors).sort(),
    authorTypes: Array.from(authorTypes).sort(),
    filePaths: Array.from(filePaths).sort()
  };
}

/**
 * Validate filter options
 * @param {Object} options - Filter options
 * @returns {Object} - Validation result with isValid and errors
 */
function validateFilterOptions(options) {
  const errors = [];

  if (options.severity) {
    const validSeverities = ['critical', 'warning', 'suggestion'];
    if (Array.isArray(options.severity)) {
      options.severity.forEach(sev => {
        if (!validSeverities.includes(sev)) {
          errors.push(`Invalid severity: ${sev}`);
        }
      });
    } else if (!validSeverities.includes(options.severity)) {
      errors.push(`Invalid severity: ${options.severity}`);
    }
  }

  if (options.authorType && !['bot', 'human', 'copilot', 'cursor'].includes(options.authorType)) {
    errors.push(`Invalid author type: ${options.authorType}`);
  }

  if (options.filePaths && Array.isArray(options.filePaths)) {
    options.filePaths.forEach(pattern => {
      try {
        new RegExp(pattern);
      } catch (e) {
        // Invalid regex, but we allow simple string patterns so this is okay
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Export for use in content script and popup
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { filterIssues, getAvailableFilterOptions, validateFilterOptions };
}

