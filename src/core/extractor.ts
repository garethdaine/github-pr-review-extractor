// Issue extraction logic for GitHub PR Review Extractor

import type { Issue } from '../types/issue';

/**
 * Extract all review comments from GitHub PR pages
 */
export function extractIssues(): Issue[] {
  const issues: Issue[] = [];
  const seenComments = new Set<string>();

  function getCommentId(filePath: string, content: string): string {
    return `${filePath}:${content.substring(0, 100)}`;
  }

  function cleanText(text: string): string {
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

  function determineSeverity(content: string): 'critical' | 'warning' | 'suggestion' {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('breaking change') ||
        contentLower.includes('breaking api') ||
        contentLower.includes('regression') ||
        contentLower.includes('security') ||
        contentLower.includes('vulnerability')) {
      return 'critical';
    } else if (contentLower.includes('could lead to') ||
               contentLower.includes('unsafe') ||
               contentLower.includes('not safe') ||
               contentLower.includes('inconsistent') ||
               contentLower.includes('degrades ux')) {
      return 'warning';
    }
    return 'suggestion';
  }

  const reviewThreads = document.querySelectorAll('.review-thread-component');

  reviewThreads.forEach((thread) => {
    const hasOutdatedLabel = thread.querySelector('span[title="Label: Outdated"]') !== null;
    const labelText = thread.querySelector('.Label')?.textContent?.trim();
    const isLabeledOutdated = labelText === 'Outdated';
    const hasResolvedAttribute = thread.hasAttribute('data-resolved') &&
                                  thread.getAttribute('data-resolved') === 'true';

    const isOutdated = hasOutdatedLabel || isLabeledOutdated || hasResolvedAttribute;

    const commentGroups = thread.querySelectorAll('.timeline-comment-group');

    commentGroups.forEach((group) => {
      const authorStrong = group.querySelector('strong');
      if (!authorStrong) return;

      const authorLink = authorStrong.querySelector('a');
      if (!authorLink) return;

      const authorText = authorLink.textContent?.trim() || '';
      const authorTextLower = authorText.toLowerCase();

      const labelSpan = authorStrong.querySelector('.Label') ||
                        authorLink.parentElement?.querySelector('.Label');
      const labelTextValue = labelSpan ? labelSpan.textContent?.toLowerCase() || '' : '';

      let commentType = 'Human Reviewer';
      let authorType = authorText;
      let source = 'Code Review';

      const isCopilot = authorTextLower.includes('copilot') || labelTextValue.includes('ai');
      const isCursorBot = (authorTextLower.includes('cursor') || authorLink.getAttribute('href')?.includes('/apps/cursor')) &&
                         (labelTextValue.includes('bot') || labelSpan !== null);
      const isBot = labelTextValue.includes('bot') && !isCopilot && !isCursorBot;

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

      const fileLink = thread.querySelector('a.text-mono.text-small');
      const filePath = fileLink?.textContent?.trim() || 'Unknown file';

      const codeLines: string[] = [];
      const diffTable = thread.querySelector('.diff-table');
      if (diffTable) {
        const rows = diffTable.querySelectorAll('tr');
        rows.forEach(row => {
          const lineNumber = row.querySelector('[data-line-number]');
          const codeCell = row.querySelector('.blob-code-inner');
          if (lineNumber && codeCell) {
            const num = lineNumber.getAttribute('data-line-number');
            const code = codeCell.textContent?.trim();
            if (code && num) {
              codeLines.push(`${num}: ${code}`);
            }
          }
        });
      }

      const commentBody = group.querySelector('.comment-body.markdown-body');
      if (!commentBody) return;

      const commentClone = commentBody.cloneNode(true) as Element;

      commentClone.querySelectorAll('.suggested-change-form-container').forEach(el => el.remove());
      commentClone.querySelectorAll('.js-suggested-changes-template').forEach(el => el.remove());
      commentClone.querySelectorAll('template').forEach(el => el.remove());
      commentClone.querySelectorAll('.copilot-code-review-feedback').forEach(el => el.remove());
      commentClone.querySelectorAll('sup').forEach(el => el.remove());
      commentClone.querySelectorAll('.text-small.color-fg-muted').forEach(el => el.remove());

      const title = commentClone.querySelector('h1, h2, h3')?.textContent?.trim() ||
                   `${authorType} Comment`;

      const paragraphs = Array.from(commentClone.querySelectorAll('p'));
      const contentParts = paragraphs
        .map(p => cleanText(p.textContent || ''))
        .filter(text => text.length > 10);

      const content = contentParts.join('\n\n');
      if (!content) return;

      const commentId = getCommentId(filePath, content);
      if (seenComments.has(commentId)) return;
      seenComments.add(commentId);

      const timestamp = group.querySelector('relative-time')?.getAttribute('datetime') || '';
      const severity = determineSeverity(content);

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











