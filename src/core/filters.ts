// Filter utilities for GitHub PR Review Extractor

import type { Issue, FilterOptions } from '../types/issue';

/**
 * Filter issues based on multiple criteria
 */
export function filterIssues(issues: Issue[], options: FilterOptions = {}): Issue[] {
  let filtered = [...issues];

  if (options.excludeOutdated) {
    filtered = filtered.filter(issue => !issue.outdated);
  }

  if (options.severity) {
    if (Array.isArray(options.severity)) {
      filtered = filtered.filter(issue => options.severity!.includes(issue.severity));
    } else {
      filtered = filtered.filter(issue => issue.severity === options.severity);
    }
  }

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

  if (options.authors && Array.isArray(options.authors) && options.authors.length > 0) {
    filtered = filtered.filter(issue => options.authors!.includes(issue.author));
  }

  if (options.filePaths && Array.isArray(options.filePaths) && options.filePaths.length > 0) {
    filtered = filtered.filter(issue => {
      return options.filePaths!.some(pattern => {
        try {
          const regex = new RegExp(pattern);
          return regex.test(issue.filePath);
        } catch (e) {
          return issue.filePath.includes(pattern);
        }
      });
    });
  }

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
 */
export function getAvailableFilterOptions(issues: Issue[]) {
  const severities = new Set<string>();
  const authors = new Set<string>();
  const authorTypes = new Set<string>();
  const filePaths = new Set<string>();

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
 */
export function validateFilterOptions(options: FilterOptions) {
  const errors: string[] = [];

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
        // Invalid regex, but we allow simple string patterns
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}






