// Sorting utilities for GitHub PR Review Extractor

import type { Issue, SortOptions } from '../types/issue';

/**
 * Sort issues by various criteria
 */
export function sortIssues(issues: Issue[], sortBy: string = 'severity', order: 'asc' | 'desc' = 'desc'): Issue[] {
  const sorted = [...issues];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'severity':
        const severityOrder: Record<string, number> = { critical: 3, warning: 2, suggestion: 1 };
        const aSeverity = severityOrder[a.severity] || 0;
        const bSeverity = severityOrder[b.severity] || 0;
        comparison = aSeverity - bSeverity;
        break;

      case 'file':
        comparison = (a.filePath || '').localeCompare(b.filePath || '');
        break;

      case 'author':
        comparison = (a.author || '').localeCompare(b.author || '');
        break;

      case 'date':
        const aDate = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const bDate = b.timestamp ? new Date(b.timestamp) : new Date(0);
        comparison = aDate.getTime() - bDate.getTime();
        break;

      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;

      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Sort issues grouped by file, with files sorted by issue count
 */
export function sortGroupedIssues(
  groupedIssues: Record<string, Issue[]>,
  sortBy: string = 'count',
  order: 'asc' | 'desc' = 'desc'
): Record<string, Issue[]> {
  const sorted: Record<string, Issue[]> = {};
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
 */
export function getSortOptions() {
  return [
    { value: 'severity', label: 'By Severity (Critical first)' },
    { value: 'file', label: 'By File Path (A-Z)' },
    { value: 'author', label: 'By Author (A-Z)' },
    { value: 'date', label: 'By Date (Newest first)' },
    { value: 'title', label: 'By Title (A-Z)' }
  ];
}






