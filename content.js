// Extract bot-generated issues and suggestions from GitHub PR pages

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
  
  // Extract Copilot AI and bot review comments from review threads
  const reviewThreads = document.querySelectorAll('.review-thread-component');
  
  reviewThreads.forEach((thread) => {
    const commentGroups = thread.querySelectorAll('.timeline-comment-group');
    
    commentGroups.forEach((group) => {
      // Check if this is a bot comment (Copilot or Cursor)
      const authorStrong = group.querySelector('strong');
      if (!authorStrong) return;
      
      const authorLink = authorStrong.querySelector('a');
      const labelSpan = authorStrong.querySelector('.Label');
      
      if (!authorLink || !labelSpan) return;
      
      const authorText = authorLink.textContent.toLowerCase();
      const labelText = labelSpan.textContent.toLowerCase();
      
      // Check if it's a bot comment
      const isCopilot = authorText.includes('copilot') || labelText.includes('ai');
      const isCursorBot = authorText.includes('cursor') && labelText.includes('bot');
      
      if (!isCopilot && !isCursorBot) return;
      
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
                   (isCopilot ? 'Copilot Suggestion' : 'Cursor Bot Suggestion');
      
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
        type: isCopilot ? 'GitHub Copilot AI' : 'Cursor Bot',
        title: title,
        content: content,
        filePath: filePath,
        codeContext: codeLines.length > 0 ? codeLines.join('\n') : null,
        timestamp: timestamp,
        source: isCopilot ? 'Copilot Code Review' : 'Bot Code Review',
        severity: severity
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

// Format with grouping by file
function formatIssuesGroupedByFile(issues, includeInstructions = true) {
  if (issues.length === 0) {
    return 'No bot-generated issues or suggestions found on this PR.';
  }
  
  const prUrl = window.location.href;
  const prTitle = document.querySelector('.js-issue-title')?.textContent.trim() || 'PR';
  const grouped = groupIssuesByFile(issues);
  
  // Count by severity
  const severityCounts = { critical: 0, warning: 0, suggestion: 0 };
  issues.forEach(issue => severityCounts[issue.severity]++);
  
  let output = `# Code Review Issues - ${prTitle}\n\n`;
  output += `**PR:** ${prUrl}\n`;
  output += `**Extracted:** ${new Date().toLocaleString()}\n`;
  output += `**Total Issues:** ${issues.length} `;
  output += `(🔴 ${severityCounts.critical} Critical, 🟡 ${severityCounts.warning} Warnings, 🔵 ${severityCounts.suggestion} Suggestions)\n\n`;
  output += '---\n\n';
  
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
      output += `### ${severityInfo.emoji} ${issue.title}\n\n`;
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
    output += `Please review these ${issues.length} code review suggestions grouped by file. `;
    output += `Prioritize 🔴 CRITICAL issues first, then 🟡 WARNINGS, then 🔵 SUGGESTIONS.\n\n`;
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
      
      let formattedText;
      switch(format) {
        case 'grouped':
          formattedText = formatIssuesGroupedByFile(issues, true);
          break;
        case 'summary':
          formattedText = formatIssuesSummary(issues);
          break;
        case 'json':
          formattedText = formatIssuesAsJSON(issues);
          break;
        case 'no-instructions':
          formattedText = formatIssuesGroupedByFile(issues, false);
          break;
        default:
          formattedText = formatIssuesGroupedByFile(issues, true);
      }
      
      sendResponse({
        success: true,
        count: issues.length,
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
