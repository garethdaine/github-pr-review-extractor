// Extract all review comments from GitHub PR pages

function extractBotIssues() {
  const issues = [];
  const seenComments = new Set(); // Track unique comments by content hash
  
  // Helper to create a unique ID for deduplication
  function getCommentId(filePath, content) {
    return `${filePath}:${content.substring(0, 100)}`;
  }
  
  // Helper to clean text content from UI noise
  function cleanText(text) {
    return text
      .replace(/Copilot uses AI.*?Check for mistakes\.?/gi, '')
      .replace(/Suggested change/gi, '')
      .replace(/Suggestion applied/gi, '')
      .replace(/Commit suggestion/gi, '')
      .replace(/Pending in batch/gi, '')
      .replace(/Remove from batch/gi, '')
      .replace(/Commit suggestions\d*/gi, '')
      .replace(/Add suggestion to batch/gi, '')
      .replace(/Commit changes/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Extract all review comments from review threads
  const reviewThreads = document.querySelectorAll('.review-thread-component');
  
  reviewThreads.forEach((thread) => {
    // Check if thread is outdated or resolved
    const hasOutdatedLabel = thread.querySelector('span[title="Label: Outdated"]') !== null;
    const labelText = thread.querySelector('.Label')?.textContent?.trim();
    const isLabeledOutdated = labelText === 'Outdated';
    const hasResolvedAttribute = thread.hasAttribute('data-resolved') && thread.getAttribute('data-resolved') === 'true';
    
    const isOutdated = hasOutdatedLabel || isLabeledOutdated || hasResolvedAttribute;
    
    const commentGroups = thread.querySelectorAll('.timeline-comment-group');
    
    commentGroups.forEach((group) => {
      // Get author information
      const authorStrong = group.querySelector('strong');
      if (!authorStrong) return;
      
      const authorLink = authorStrong.querySelector('a');
      if (!authorLink) return;
      
      const authorText = authorLink.textContent.trim();
      const authorTextLower = authorText.toLowerCase();
      
      // Look for Label - it might be inside strong or a sibling
      const labelSpan = authorStrong.querySelector('.Label') || 
                        authorLink.parentElement?.querySelector('.Label');
      const labelText = labelSpan ? labelSpan.textContent.toLowerCase() : '';
      
      // Determine comment type/author type
      let commentType = 'Human Reviewer';
      let authorType = authorText; // Default to actual author name
      let source = 'Code Review';
      
      const isCopilot = authorTextLower.includes('copilot') || labelText.includes('ai');
      const isCursorBot = (authorTextLower.includes('cursor') || authorLink.href?.includes('/apps/cursor')) && 
                         (labelText.includes('bot') || labelSpan !== null);
      const isBot = labelText.includes('bot') && !isCopilot && !isCursorBot;
      
      if (isCopilot) {
        commentType = 'GitHub Copilot AI';
        authorType = 'Copilot';
        source = 'Copilot Code Review';
      } else if (isCursorBot) {
        commentType = 'Cursor Bot';
        authorType = 'Cursor';
        source = 'Bot Code Review';
      } else if (isBot) {
        commentType = 'Bot';
        authorType = authorText;
        source = 'Bot Code Review';
      } else {
        commentType = 'Human Reviewer';
        authorType = authorText;
        source = 'Code Review';
      }
      
      // Extract file context
      const fileLink = thread.querySelector('a.text-mono.text-small');
      const filePath = fileLink ? fileLink.textContent.trim() : 'Unknown file';
      
      // Extract code context (the actual code being commented on)
      const codeLines = [];
      const diffTable = thread.querySelector('.diff-table');
      if (diffTable) {
        const rows = diffTable.querySelectorAll('tr');
        rows.forEach(row => {
          const lineNumber = row.querySelector('[data-line-number]');
          const codeCell = row.querySelector('.blob-code-inner');
          if (lineNumber && codeCell) {
            const num = lineNumber.getAttribute('data-line-number');
            const code = codeCell.textContent.trim();
            if (code) {
              codeLines.push(`${num}: ${code}`);
            }
          }
        });
      }
      
      // Extract comment content (clone to avoid modifying DOM)
      const commentBody = group.querySelector('.comment-body.markdown-body');
      if (!commentBody) return;
      
      // Clone the comment body to clean it
      const commentClone = commentBody.cloneNode(true);
      
      // Remove unwanted elements
      commentClone.querySelectorAll('.suggested-change-form-container').forEach(el => el.remove());
      commentClone.querySelectorAll('.js-suggested-changes-template').forEach(el => el.remove());
      commentClone.querySelectorAll('template').forEach(el => el.remove());
      commentClone.querySelectorAll('.copilot-code-review-feedback').forEach(el => el.remove());
      commentClone.querySelectorAll('sup').forEach(el => el.remove());
      commentClone.querySelectorAll('.text-small.color-fg-muted').forEach(el => el.remove());
      
      // Get title
      const title = commentClone.querySelector('h1, h2, h3')?.textContent.trim() || 
                   `${authorType} Comment`;
      
      // Get main content paragraphs
      const paragraphs = Array.from(commentClone.querySelectorAll('p'));
      const contentParts = paragraphs
        .map(p => cleanText(p.textContent))
        .filter(text => text.length > 10); // Filter out very short text
      
      const content = contentParts.join('\n\n');
      if (!content) return;
      
      // Check for duplicates
      const commentId = getCommentId(filePath, content);
      if (seenComments.has(commentId)) return;
      seenComments.add(commentId);
      
      // Get timestamp
      const timestamp = group.querySelector('relative-time')?.getAttribute('datetime') || '';
      
      // Determine severity based on keywords
      const contentLower = content.toLowerCase();
      let severity = 'suggestion';
      if (contentLower.includes('breaking change') || 
          contentLower.includes('breaking api') ||
          contentLower.includes('regression') ||
          contentLower.includes('security') ||
          contentLower.includes('vulnerability')) {
        severity = 'critical';
      } else if (contentLower.includes('could lead to') ||
                 contentLower.includes('unsafe') ||
                 contentLower.includes('not safe') ||
                 contentLower.includes('inconsistent') ||
                 contentLower.includes('degrades ux')) {
        severity = 'warning';
      }
      
      issues.push({
        type: commentType,
        author: authorType,
        title: title,
        content: content,
        filePath: filePath,
        codeContext: codeLines.length > 0 ? codeLines.join('\n') : null,
        timestamp: timestamp,
        source: source,
        severity: severity,
        outdated: isOutdated,
        isBot: isCopilot || isCursorBot || isBot,
        isHuman: !isCopilot && !isCursorBot && !isBot
      });
    });
  });
  
  return issues;
}

// Helper to get severity emoji and label
function getSeverityInfo(severity) {
  switch(severity) {
    case 'critical':
      return { emoji: '🔴', label: 'CRITICAL', color: '#ff0000' };
    case 'warning':
      return { emoji: '🟡', label: 'WARNING', color: '#ffaa00' };
    default:
      return { emoji: '🔵', label: 'SUGGESTION', color: '#0066ff' };
  }
}

// Group issues by file
function groupIssuesByFile(issues) {
  const grouped = {};
  issues.forEach(issue => {
    const file = issue.filePath || 'Unknown file';
    if (!grouped[file]) {
      grouped[file] = [];
    }
    grouped[file].push(issue);
  });
  return grouped;
}

// Filter issues based on criteria
function filterIssues(issues, options = {}) {
  let filtered = [...issues];
  
  // Filter out outdated issues if requested
  if (options.excludeOutdated) {
    filtered = filtered.filter(issue => !issue.outdated);
  }
  
  // Filter by severity if specified
  if (options.severity) {
    filtered = filtered.filter(issue => issue.severity === options.severity);
  }
  
  return filtered;
}

// Format with grouping by file
function formatIssuesGroupedByFile(issues, includeInstructions = true, options = {}) {
  // Apply filters if provided
  const filteredIssues = filterIssues(issues, options);
  
  if (filteredIssues.length === 0) {
    return 'No bot-generated issues or suggestions found on this PR.';
  }
  
  const prUrl = window.location.href;
  const prTitle = document.querySelector('.js-issue-title')?.textContent.trim() || 'PR';
  const grouped = groupIssuesByFile(filteredIssues);
  
  // Count by severity
  const severityCounts = { critical: 0, warning: 0, suggestion: 0 };
  filteredIssues.forEach(issue => severityCounts[issue.severity]++);
  
  // Count by author type
  const authorCounts = {};
  filteredIssues.forEach(issue => {
    authorCounts[issue.type] = (authorCounts[issue.type] || 0) + 1;
  });
  
  // Count outdated
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
  
  // Show author breakdown
  if (Object.keys(authorCounts).length > 0) {
    output += `**By Author Type:** `;
    const authorBreakdown = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');
    output += `${authorBreakdown}\n`;
  }
  
  output += '\n---\n\n';
  
  // Sort files by number of issues (descending)
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

// Format single issue for individual copying
function formatSingleIssue(issue, index) {
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

// Format as summary (no instructions, minimal formatting)
function formatIssuesSummary(issues) {
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

// Export as JSON
function formatIssuesAsJSON(issues) {
  const prUrl = window.location.href;
  const prTitle = document.querySelector('.js-issue-title')?.textContent.trim() || 'PR';
  
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

// Main format function (default)
function formatIssuesForClipboard(issues) {
  return formatIssuesGroupedByFile(issues, true);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractIssues') {
    try {
      const issues = extractBotIssues();
      const format = request.format || 'grouped';
      const filterOptions = request.filterOptions || {};
      
      // Apply filters to get the count
      const filteredIssues = filterIssues(issues, filterOptions);
      
      let formattedText;
      switch(format) {
        case 'grouped':
          formattedText = formatIssuesGroupedByFile(issues, true, filterOptions);
          break;
        case 'summary':
          formattedText = formatIssuesSummary(filteredIssues);
          break;
        case 'json':
          formattedText = formatIssuesAsJSON(filteredIssues);
          break;
        case 'no-instructions':
          formattedText = formatIssuesGroupedByFile(issues, false, filterOptions);
          break;
        default:
          formattedText = formatIssuesGroupedByFile(issues, true, filterOptions);
      }
      
      sendResponse({
        success: true,
        count: filteredIssues.length,
        totalCount: issues.length,
        outdatedCount: issues.filter(i => i.outdated).length,
        text: formattedText,
        issues: issues // Send raw issues for popup to use
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  } else if (request.action === 'formatSingleIssue') {
    try {
      const formattedText = formatSingleIssue(request.issue, request.index);
      sendResponse({
        success: true,
        text: formattedText
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  return true; // Keep channel open for async response
});
