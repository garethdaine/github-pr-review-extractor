// Unit tests for sorting utilities

import { describe, it, expect } from 'vitest';
import { sortIssues } from '../../src/core/sorters';

describe('Sort Issues', () => {
  const mockIssues = [
    {
      title: 'Suggestion',
      severity: 'suggestion',
      filePath: 'src/z.ts',
      author: 'Bob',
      timestamp: '2024-01-01T10:00:00Z'
    },
    {
      title: 'Critical',
      severity: 'critical',
      filePath: 'src/a.ts',
      author: 'Alice',
      timestamp: '2024-01-02T10:00:00Z'
    },
    {
      title: 'Warning',
      severity: 'warning',
      filePath: 'src/m.ts',
      author: 'Charlie',
      timestamp: '2024-01-03T10:00:00Z'
    }
  ];

  it('should sort by severity (critical first)', () => {
    const sorted = sortIssues(mockIssues, 'severity', 'desc');

    expect(sorted[0].severity).toBe('critical');
    expect(sorted[1].severity).toBe('warning');
    expect(sorted[2].severity).toBe('suggestion');
  });

  it('should sort by file path alphabetically', () => {
    const sorted = sortIssues(mockIssues, 'file', 'asc');

    expect(sorted[0].filePath).toBe('src/a.ts');
    expect(sorted[1].filePath).toBe('src/m.ts');
    expect(sorted[2].filePath).toBe('src/z.ts');
  });

  it('should sort by date (newest first)', () => {
    const sorted = sortIssues(mockIssues, 'date', 'desc');

    expect(sorted[0].timestamp).toBe('2024-01-03T10:00:00Z');
    expect(sorted[2].timestamp).toBe('2024-01-01T10:00:00Z');
  });
});





