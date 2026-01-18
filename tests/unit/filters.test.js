// Unit tests for filter utilities

import { describe, it, expect } from 'vitest';
import { filterIssues, validateFilterOptions } from '../../src/core/filters';

describe('Filter Issues', () => {
  const mockIssues = [
    {
      type: 'GitHub Copilot AI',
      author: 'Copilot',
      title: 'Security issue',
      content: 'This is a security vulnerability',
      filePath: 'src/auth.js',
      severity: 'critical',
      outdated: false,
      isBot: true,
      isHuman: false
    },
    {
      type: 'Human Reviewer',
      author: 'John Doe',
      title: 'Style suggestion',
      content: 'Consider using const instead of let',
      filePath: 'src/utils.ts',
      severity: 'suggestion',
      outdated: false,
      isBot: false,
      isHuman: true
    },
    {
      type: 'Cursor Bot',
      author: 'Cursor',
      title: 'Warning',
      content: 'This could lead to issues',
      filePath: 'src/main.js',
      severity: 'warning',
      outdated: true,
      isBot: true,
      isHuman: false
    }
  ];

  it('should filter by severity', () => {
    const filtered = filterIssues(mockIssues, { severity: 'critical' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Security issue');
  });

  it('should filter by author type', () => {
    const botIssues = filterIssues(mockIssues, { authorType: 'bot' });
    expect(botIssues).toHaveLength(2);

    const humanIssues = filterIssues(mockIssues, { authorType: 'human' });
    expect(humanIssues).toHaveLength(1);
  });

  it('should filter out outdated issues', () => {
    const activeIssues = filterIssues(mockIssues, { excludeOutdated: true });
    expect(activeIssues).toHaveLength(2);
  });

  it('should filter by file path', () => {
    const tsFiles = filterIssues(mockIssues, { filePaths: ['\\.ts$'] });
    expect(tsFiles).toHaveLength(1);
    expect(tsFiles[0].filePath).toBe('src/utils.ts');
  });

  it('should search in content', () => {
    const results = filterIssues(mockIssues, { searchQuery: 'security' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Security issue');
  });

  it('should validate filter options', () => {
    expect(validateFilterOptions({ severity: 'critical' }).isValid).toBe(true);
    expect(validateFilterOptions({ severity: 'nope' }).isValid).toBe(false);
    expect(validateFilterOptions({ authorType: 'robot' }).isValid).toBe(false);
  });
});










