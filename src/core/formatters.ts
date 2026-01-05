// Format converters for GitHub PR Review Extractor

import type { Issue, FilterOptions } from '../types/issue';
import { filterIssues } from './filters';

interface SeverityInfo {
  emoji: string;
  label: string;
  color: string;
}

function getSeverityInfo(severity: 'critical' | 'warning' | 'suggestion'): SeverityInfo {
  switch(severity) {
    case 'critical':
      return { emoji: '🔴', label: 'CRITICAL', color: '#ff0000' };
    case 'warning':
      return { emoji: '🟡', label: 'WARNING', color: '#ffaa00' };
    default:
      return { emoji: '🔵', label: 'SUGGESTION', color: '#0066ff' };
  }
}

function groupIssuesByFile(issues: Issue[]): Record<string, Issue[]> {
  const grouped: Record<string, Issue[]> = {};
  issues.forEach(issue => {
    const file = issue.filePath || 'Unknown file';
    if (!grouped[file]) {
      grouped[file] = [];
    }
    grouped[file].push(issue);
  });
  return grouped;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function formatIssuesGroupedByFile(
  issues: Issue[],
  includeInstructions: boolean = true,
  options: FilterOptions = {}
): string {
  const filteredIssues = filterIssues(issues, options);

  if (filteredIssues.length === 0) {
    return 'No bot-generated issues or suggestions found on this PR.';
  }

  const prUrl = window.location.href;
  const prTitle = document.querySelector('.js-issue-title')?.textContent?.trim() || 'PR';
  const grouped = groupIssuesByFile(filteredIssues);

  const severityCounts = { critical: 0, warning: 0, suggestion: 0 };
  filteredIssues.forEach(issue => severityCounts[issue.severity]++);

  const authorCounts: Record<string, number> = {};
  filteredIssues.forEach(issue => {
    authorCounts[issue.type] = (authorCounts[issue.type] || 0) + 1;
  });

  const outdatedCount = issues.filter(i => i.outdated).length;
  const totalOriginal = issues.length;

  let output = `# Code Review Comments - ${prTitle}\n\n`;
  output += `**PR:** ${prUrl}\n`;
  output += `**Extracted:** ${new Date().toLocaleString()}\n`;
  output += `**Total Comments:** ${filteredIssues.length}`;
  if (options.excludeOutdated && outdatedCount > 0) {
    output += ` (${outdatedCount} outdated excluded, ${totalOriginal} total)`;
  }
  output += `\n\n**By Severity:** 🔴 ${severityCounts.critical} Critical, 🟡 ${severityCounts.warning} Warnings, 🔵 ${severityCounts.suggestion} Suggestions\n`;

  if (Object.keys(authorCounts).length > 0) {
    output += `**By Author Type:** `;
    const authorBreakdown = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');
    output += `${authorBreakdown}\n`;
  }

  output += '\n---\n\n';

  const sortedFiles = Object.keys(grouped).sort((a, b) =>
    grouped[b].length - grouped[a].length
  );

  sortedFiles.forEach(filePath => {
    const fileIssues = grouped[filePath];
    output += `## 📁 \`${filePath}\`\n\n`;
    output += `${fileIssues.length} issue${fileIssues.length !== 1 ? 's' : ''} found\n\n`;

    fileIssues.forEach((issue, index) => {
      const severityInfo = getSeverityInfo(issue.severity);
      const outdatedLabel = issue.outdated ? ' ~~(Outdated)~~' : '';
      output += `### ${severityInfo.emoji} ${issue.title}${outdatedLabel}\n\n`;
      output += `**Author:** ${issue.author} (${issue.type})\n`;
      output += `**Severity:** ${severityInfo.label}\n\n`;

      if (issue.codeContext) {
        output += `**Code:**\n\`\`\`\n${issue.codeContext}\n\`\`\`\n\n`;
      }

      output += `**💡 Suggestion:**\n${issue.content}\n\n`;

      if (index < fileIssues.length - 1) {
        output += '---\n\n';
      }
    });

    output += '\n---\n\n';
  });

  if (includeInstructions) {
    output += `\n## Instructions for Cursor AI\n\n`;
    output += `Please review these ${filteredIssues.length} code review suggestions grouped by file. `;
    output += `Prioritize 🔴 CRITICAL issues first, then 🟡 WARNINGS, then 🔵 SUGGESTIONS.\n\n`;
    if (options.excludeOutdated && outdatedCount > 0) {
      output += `**Note:** ${outdatedCount} outdated issue${outdatedCount !== 1 ? 's have' : ' has'} been excluded from this report.\n\n`;
    }
    output += `For each issue:\n`;
    output += `1. Read the suggestion carefully\n`;
    output += `2. Locate the relevant code in the file\n`;
    output += `3. Apply the fix if it's valid\n`;
    output += `4. Ensure the fix doesn't break existing functionality\n`;
  }

  return output;
}

export function formatSingleIssue(issue: Issue, index?: number): string {
  const severityInfo = getSeverityInfo(issue.severity);

  let output = `## ${severityInfo.emoji} ${issue.title}\n\n`;
  output += `**Author:** ${issue.author} (${issue.type})\n`;
  output += `**File:** \`${issue.filePath}\`\n`;
  output += `**Severity:** ${severityInfo.label}\n\n`;

  if (issue.codeContext) {
    output += `**Code:**\n\`\`\`\n${issue.codeContext}\n\`\`\`\n\n`;
  }

  output += `**💡 Suggestion:**\n${issue.content}\n`;

  return output;
}

export function formatIssuesSummary(issues: Issue[]): string {
  if (issues.length === 0) {
    return 'No issues found.';
  }

  const grouped = groupIssuesByFile(issues);
  let output = '';

  Object.keys(grouped).sort().forEach(filePath => {
    output += `${filePath}:\n`;
    grouped[filePath].forEach(issue => {
      const severityInfo = getSeverityInfo(issue.severity);
      output += `  ${severityInfo.emoji} ${issue.title}\n`;
    });
    output += '\n';
  });

  return output;
}

export function formatIssuesAsJSON(issues: Issue[]): string {
  const prUrl = window.location.href;
  const prTitle = document.querySelector('.js-issue-title')?.textContent?.trim() || 'PR';

  return JSON.stringify({
    pr: {
      title: prTitle,
      url: prUrl,
      extractedAt: new Date().toISOString()
    },
    summary: {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      suggestion: issues.filter(i => i.severity === 'suggestion').length
    },
    issues: issues
  }, null, 2);
}

export function formatIssuesAsHTML(issues: Issue[]): string {
  const prUrl = window.location.href;
  const prTitle = document.querySelector('.js-issue-title')?.textContent?.trim() || 'PR';
  const grouped = groupIssuesByFile(issues);

  const severityCounts = { critical: 0, warning: 0, suggestion: 0 };
  issues.forEach(issue => severityCounts[issue.severity]++);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Review Comments - ${escapeHtml(prTitle)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #24292f;
      background: #ffffff;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #24292f; border-bottom: 1px solid #d0d7de; padding-bottom: 10px; }
    h2 { color: #0969da; margin-top: 30px; border-bottom: 1px solid #d0d7de; padding-bottom: 8px; }
    h3 { color: #24292f; margin-top: 20px; }
    .meta { color: #57606a; font-size: 14px; margin-bottom: 20px; }
    .summary { background: #f6f8fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
    .issue { margin: 20px 0; padding: 15px; border-left: 4px solid #d0d7de; background: #f6f8fa; border-radius: 4px; }
    .issue.critical { border-left-color: #cf222e; }
    .issue.warning { border-left-color: #9a6700; }
    .issue.suggestion { border-left-color: #0969da; }
    .severity-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-right: 8px; }
    .severity-critical { background: #ffebe9; color: #cf222e; }
    .severity-warning { background: #fff8c5; color: #9a6700; }
    .severity-suggestion { background: #ddf4ff; color: #0969da; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', Monaco, monospace; font-size: 85%; }
    pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow-x: auto; border: 1px solid #d0d7de; }
    .author { color: #57606a; font-size: 13px; margin-top: 8px; }
    @media print {
      body { padding: 0; }
      .issue { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Code Review Comments - ${escapeHtml(prTitle)}</h1>
  <div class="meta">
    <strong>PR:</strong> <a href="${prUrl}">${escapeHtml(prUrl)}</a><br>
    <strong>Extracted:</strong> ${new Date().toLocaleString()}<br>
    <strong>Total Issues:</strong> ${issues.length}
  </div>
  <div class="summary">
    <strong>By Severity:</strong> 🔴 ${severityCounts.critical} Critical, 🟡 ${severityCounts.warning} Warnings, 🔵 ${severityCounts.suggestion} Suggestions
  </div>
`;

  const sortedFiles = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);

  sortedFiles.forEach(filePath => {
    const fileIssues = grouped[filePath];
    html += `\n  <h2>📁 <code>${escapeHtml(filePath)}</code></h2>\n`;
    html += `  <p>${fileIssues.length} issue${fileIssues.length !== 1 ? 's' : ''} found</p>\n\n`;

    fileIssues.forEach((issue) => {
      const severityInfo = getSeverityInfo(issue.severity);
      html += `  <div class="issue ${issue.severity}">\n`;
      html += `    <h3><span class="severity-badge severity-${issue.severity}">${severityInfo.emoji} ${severityInfo.label}</span>${escapeHtml(issue.title)}</h3>\n`;
      html += `    <div class="author"><strong>Author:</strong> ${escapeHtml(issue.author)} (${escapeHtml(issue.type)})</div>\n`;

      if (issue.codeContext) {
        html += `    <p><strong>Code:</strong></p>\n    <pre><code>${escapeHtml(issue.codeContext)}</code></pre>\n`;
      }

      html += `    <p><strong>💡 Suggestion:</strong></p>\n    <p>${escapeHtml(issue.content).replace(/\n/g, '<br>')}</p>\n`;
      html += `  </div>\n\n`;
    });
  });

  html += `</body>\n</html>`;
  return html;
}

export function formatIssuesAsCSV(issues: Issue[]): string {
  const headers = ['File Path', 'Title', 'Severity', 'Author', 'Type', 'Content', 'Code Context', 'Timestamp', 'Outdated'];
  const rows = issues.map(issue => [
    issue.filePath || '',
    issue.title || '',
    issue.severity || '',
    issue.author || '',
    issue.type || '',
    (issue.content || '').replace(/"/g, '""').replace(/\n/g, ' '),
    (issue.codeContext || '').replace(/"/g, '""').replace(/\n/g, ' '),
    issue.timestamp || '',
    issue.outdated ? 'Yes' : 'No'
  ]);

  function escapeCSVField(field: string | number): string {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  const csvRows = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ];

  return csvRows.join('\n');
}

export function formatIssuesForClipboard(issues: Issue[]): string {
  return formatIssuesGroupedByFile(issues, true);
}






