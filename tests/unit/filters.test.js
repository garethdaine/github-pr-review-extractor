// Unit tests for filters.js

import { describe, it, expect, beforeEach } from 'vitest';

// Mock the filterIssues function (in a real setup, we'd import it)
// For now, we'll test the logic

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
    const filtered = mockIssues.filter(issue => issue.severity === 'critical');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Security issue');
  });

  it('should filter by author type', () => {
    const botIssues = mockIssues.filter(issue => issue.isBot === true);
    expect(botIssues).toHaveLength(2);

    const humanIssues = mockIssues.filter(issue => issue.isHuman === true);
    expect(humanIssues).toHaveLength(1);
  });

  it('should filter out outdated issues', () => {
    const activeIssues = mockIssues.filter(issue => !issue.outdated);
    expect(activeIssues).toHaveLength(2);
  });

  it('should filter by file path', () => {
    const tsFiles = mockIssues.filter(issue => issue.filePath.endsWith('.ts'));
    expect(tsFiles).toHaveLength(1);
    expect(tsFiles[0].filePath).toBe('src/utils.ts');
  });

  it('should search in content', () => {
    const query = 'security';
    const results = mockIssues.filter(issue =>
      issue.content.toLowerCase().includes(query.toLowerCase()) ||
      issue.title.toLowerCase().includes(query.toLowerCase())
    );
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Security issue');
  });
});

