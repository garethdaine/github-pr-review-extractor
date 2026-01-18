// Background service worker for GitHub PR Review Extractor
// Handles LLM API calls and cross-origin requests

// Import error handler utilities (inline for service worker)
// Note: In a real implementation, error-handler.js would be imported via importScripts
// For now, we'll add retry logic directly

console.log('GitHub PR Review Extractor background service worker loaded');

type TokenParamName = 'max_tokens' | 'max_completion_tokens';

function preferredTokenParamForModel(modelName: string | undefined): TokenParamName {
  const model = (modelName || '').trim().toLowerCase();
  if (model.startsWith('o1') || model.startsWith('o3')) return 'max_completion_tokens';
  return 'max_tokens';
}

function isUnsupportedTokenParamError(errorText: string, paramName: TokenParamName): boolean {
  if (!errorText) return false;
  if (!errorText.includes('Unsupported parameter')) return false;
  return errorText.includes(`'${paramName}'`) || errorText.includes(`"${paramName}"`);
}

async function postChatCompletions({
  endpoint,
  apiKey,
  modelName,
  messages,
  maxTokens,
  temperature,
  tokenParamName
}: {
  endpoint: string;
  apiKey: string;
  modelName: string;
  messages: any[];
  maxTokens: number;
  temperature?: number;
  tokenParamName: TokenParamName;
}): Promise<{ ok: true; status: number; json: any } | { ok: false; status: number; errorText: string }> {
  const body: Record<string, any> = {
    model: modelName,
    messages,
    temperature: temperature ?? 0.2
  };
  body[tokenParamName] = maxTokens;

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000) // 2 minute timeout
  });

  if (response.ok) {
    return { ok: true, status: response.status, json: await response.json() };
  }

  return { ok: false, status: response.status, errorText: await response.text() };
}

async function postChatCompletionsWithTokenFallback(params: {
  endpoint: string;
  apiKey: string;
  modelName: string;
  messages: any[];
  maxTokens: number;
  temperature?: number;
}): Promise<{ ok: true; status: number; json: any } | { ok: false; status: number; errorText: string }> {
  const preferred = preferredTokenParamForModel(params.modelName);
  const first = await postChatCompletions({ ...params, tokenParamName: preferred });
  if (first.ok) return first;

  if (!isUnsupportedTokenParamError(first.errorText, preferred)) return first;

  const fallback: TokenParamName = preferred === 'max_tokens' ? 'max_completion_tokens' : 'max_tokens';
  return postChatCompletions({ ...params, tokenParamName: fallback });
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request: any, sender, sendResponse) => {
  console.log('Background received message:', request.action);

  // Handle async operations
  if (request.action === 'TEST_LLM_CONNECTION') {
    handleTestConnection(request, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'CALL_LLM') {
    handleLLMCall(request, sendResponse);
    return true;
  } else if (request.action === 'FETCH_PR_DATA') {
    handleFetchPRData(request, sendResponse);
    return true;
  } else if (request.action === 'GET_SETTINGS') {
    handleGetSettings(sendResponse);
    return true;
  } else if (request.action === 'POST_GITHUB_REVIEW') {
    handlePostGitHubReview(request, sendResponse);
    return true;
  }

  return false;
});

// Test LLM connection
async function handleTestConnection(request: any, sendResponse: (response: any) => void) {
  try {
    const { endpoint, apiKey, modelName } = request;

    console.log(`Testing connection to ${endpoint}`);

    const result = await postChatCompletionsWithTokenFallback({
      endpoint,
      apiKey,
      modelName,
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      maxTokens: 10,
      temperature: 0.2
    });

    if (result.ok) {
      console.log('Connection test successful:', result.json);
      sendResponse({
        success: true,
        model: result.json.model || modelName
      });
    } else {
      console.error('Connection test failed:', result.status, result.errorText);
      sendResponse({
        success: false,
        error: `HTTP ${result.status}: ${result.errorText}`
      });
    }
  } catch (error) {
    console.error('Connection test error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors or auth errors
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('401') || message.includes('403') || message.includes('404') || message.includes('422')) {
        throw error as any;
      }

      // Don't retry on last attempt
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Call LLM for code review
async function handleLLMCall(request: any, sendResponse: (response: any) => void) {
  try {
    const { endpoint, apiKey, modelName, messages, maxTokens, temperature } = request;

    console.log(`Calling LLM at ${endpoint} with model ${modelName}`);

    const result = await retryWithBackoff(async () => {
      return await postChatCompletionsWithTokenFallback({
        endpoint,
        apiKey,
        modelName,
        messages: messages,
        maxTokens: maxTokens || 1000,
        temperature: temperature || 0.2
      });
    });

    if (result.ok) {
      console.log('LLM call successful');
      sendResponse({
        success: true,
        data: result.json
      });
    } else {
      console.error('LLM call failed:', result.status, result.errorText);
      sendResponse({
        success: false,
        error: `HTTP ${result.status}: ${result.errorText}`
      });
    }
  } catch (error) {
    console.error('LLM call error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Fetch PR data from GitHub API
async function handleFetchPRData(request: any, sendResponse: (response: any) => void) {
  try {
    const { owner, repo, prNumber, githubToken } = request;

    // Validate inputs
    if (!owner || !repo || !prNumber) {
      sendResponse({
        success: false,
        error: 'Missing required parameters: owner, repo, and prNumber are required'
      });
      return;
    }
    const baseUrl = 'https://api.github.com';

    console.log(`Fetching PR data for ${owner}/${repo}#${prNumber}`);

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };

    // Add auth token if provided
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    const prUrl = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;
    const prResponse = await fetch(prUrl, {
      headers: headers
    });

    if (!prResponse.ok) {
      const errorText = await prResponse.text().catch(() => '');
      const hint = prResponse.status === 404
        ? (githubToken
          ? 'If this is a private repo, verify the token has access (and required scopes) to this repository/PR.'
          : 'If this is a private repo, add a GitHub token in extension Options (or navigate to the "Files changed" tab so the extension can use DOM diffs).')
        : '';
      throw new Error(
        `GitHub API error fetching PR: ${prResponse.status} ${prResponse.statusText}` +
        (hint ? `\n\n${hint}` : '') +
        (errorText ? `\n\n${errorText}` : '')
      );
    }

    const prData = await prResponse.json();

    // Fetch PR files
    const filesUrl = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files`;
    const filesResponse = await fetch(filesUrl, {
      headers: headers
    });

    if (!filesResponse.ok) {
      const errorText = await filesResponse.text().catch(() => '');
      const hint = filesResponse.status === 404
        ? (githubToken
          ? 'If this is a private repo, verify the token has access (and required scopes) to this repository/PR.'
          : 'If this is a private repo, add a GitHub token in extension Options.')
        : '';
      throw new Error(
        `GitHub API error fetching PR files: ${filesResponse.status} ${filesResponse.statusText}` +
        (hint ? `\n\n${hint}` : '') +
        (errorText ? `\n\n${errorText}` : '')
      );
    }

    const filesData = await filesResponse.json();

    console.log(`Fetched PR data: ${filesData.length} files`);

    sendResponse({
      success: true,
      pr: prData,
      files: filesData
    });
  } catch (error) {
    console.error('Fetch PR data error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Get settings from storage
async function handleGetSettings(sendResponse: (response: any) => void) {
  try {
    const settings = await chrome.storage.local.get(null);
    console.log('Retrieved settings from storage');
    sendResponse({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Post review comments to GitHub
async function handlePostGitHubReview(request: any, sendResponse: (response: any) => void) {
  try {
    const { owner, repo, prNumber, comments, githubToken, asDraft = false } = request;

    if (!githubToken) {
      sendResponse({
        success: false,
        error: 'GitHub token not configured. Please add it in extension settings.'
      });
      return;
    }

    console.log(`Posting ${comments.length} review comments to ${owner}/${repo}#${prNumber}${asDraft ? ' as draft' : ''}`);

    const baseUrl = 'https://api.github.com';
    const reviewsUrl = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
    const reviewCommentsUrl = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/comments`;

    function normalizePath(pathValue: unknown): string {
      const raw = (pathValue ?? '').toString().trim();
      // Strip chunk suffix added during chunked reviews
      return raw.replace(/\s*\(part\s+\d+\/\d+\)\s*$/i, '');
    }

    function inferLineFromCodeContext(codeContext: unknown): number | null {
      if (!codeContext) return null;
      const text = String(codeContext);
      // Common patterns:
      // - "Line 123"
      // - "123: some code"
      // - "L123"
      const match =
        text.match(/\bline\s+(\d+)\b/i) ||
        text.match(/\bL(\d+)\b/) ||
        text.match(/^\s*(\d+)\s*:/m);
      if (!match) return null;
      const n = parseInt(match[1], 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    }

    function truncate(text: string, maxLen: number): string {
      if (text.length <= maxLen) return text;
      return text.slice(0, maxLen - 1) + '…';
    }

    function parseHunkHeader(line: string): { oldStart: number; newStart: number } | null {
      const match = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
      if (!match) return null;
      return { oldStart: parseInt(match[1], 10), newStart: parseInt(match[2], 10) };
    }

    function analyzePatch(patch: string): {
      validNewLines: number[];
      patchLineIndexToNewLine: Array<number | null>;
      nonHeaderIndexToNewLine: Array<number | null>;
    } {
      const patchLines = patch.split('\n');
      const validNewLines: number[] = [];
      const patchLineIndexToNewLine: Array<number | null> = [];
      const nonHeaderIndexToNewLine: Array<number | null> = [];

      let oldLine = 0;
      let newLine = 0;
      let inHunk = false;

      for (const line of patchLines) {
        const hunk = parseHunkHeader(line);
        if (hunk) {
          oldLine = hunk.oldStart;
          newLine = hunk.newStart;
          inHunk = true;
          patchLineIndexToNewLine.push(null);
          continue;
        }

        if (!inHunk) {
          patchLineIndexToNewLine.push(null);
          continue;
        }

        if (line.startsWith('\\')) {
          patchLineIndexToNewLine.push(null);
          continue;
        }

        // For mapping, treat all non-header lines as "countable" (LLMs sometimes count diff lines)
        const isDeletion = line.startsWith('-');
        const isAddition = line.startsWith('+');
        const isContext = !isDeletion && !isAddition;

        if (isDeletion) {
          patchLineIndexToNewLine.push(null);
          nonHeaderIndexToNewLine.push(null);
          oldLine += 1;
          continue;
        }

        // Context or addition exist on the RIGHT side
        patchLineIndexToNewLine.push(newLine);
        nonHeaderIndexToNewLine.push(newLine);
        validNewLines.push(newLine);
        if (isContext) oldLine += 1;
        newLine += 1;
      }

      return { validNewLines, patchLineIndexToNewLine, nonHeaderIndexToNewLine };
    }

    function findNearestNonNull(
      arr: Array<number | null>,
      indexZeroBased: number,
      searchRadius: number
    ): number | null {
      if (indexZeroBased < 0 || indexZeroBased >= arr.length) return null;
      if (arr[indexZeroBased] != null) return arr[indexZeroBased] as number;
      for (let delta = 1; delta <= searchRadius; delta++) {
        const left = indexZeroBased - delta;
        if (left >= 0 && arr[left] != null) return arr[left] as number;
        const right = indexZeroBased + delta;
        if (right < arr.length && arr[right] != null) return arr[right] as number;
      }
      return null;
    }

    function snapToNearestValidLine(validLines: number[], desired: number, maxDistance: number): number | null {
      if (!validLines.length) return null;
      let best = validLines[0];
      let bestDist = Math.abs(best - desired);
      for (let i = 1; i < validLines.length; i++) {
        const candidate = validLines[i];
        const dist = Math.abs(candidate - desired);
        if (dist < bestDist) {
          bestDist = dist;
          best = candidate;
        }
      }
      return bestDist <= maxDistance ? best : null;
    }

    function formatInlineBody(comment: any): string {
      const title = comment.title || 'Review Comment';
      const severity = (comment.severity?.toUpperCase?.() || 'SUGGESTION') as string;
      const content = truncate((comment.content || '').toString(), 1500);
      const suggestion = truncate((comment.suggestion || '').toString(), 800);
      return (
        `**${title}** (${severity})\n\n` +
        `${content}\n\n` +
        `${suggestion ? '**Suggestion:** ' + suggestion + '\n\n' : ''}`
      );
    }

    function buildSummaryBody(params: {
      title: string;
      total: number;
      postedInline: number;
      unplaced: Array<{ index: number; title: string; severity: string; file: string; content: string }>;
      severityCounts: { critical: number; warning: number; suggestion: number };
    }): string {
      const { title, unplaced, severityCounts } = params;
      const lines: string[] = [];
      lines.push(`## ${title}`);
      lines.push('');
      lines.push('### Summary');
      lines.push(`- 🔴 **${severityCounts.critical}** critical, 🟡 **${severityCounts.warning}** warning, 🔵 **${severityCounts.suggestion}** suggestion`);
      if (unplaced.length) {
        lines.push('');
        lines.push('### Unplaced Findings');
        lines.push('');
        for (const item of unplaced.slice(0, 20)) {
          lines.push(`#### ${item.index}. ${item.title}`);
          lines.push(`- **Severity:** ${item.severity}`);
          lines.push(`- **File:** \`${item.file}\``);
          lines.push('');
          lines.push(item.content);
          lines.push('');
        }
        if (unplaced.length > 20) {
          lines.push(`_…and ${unplaced.length - 20} more._`);
        }
      }
      return lines.join('\n');
    }

    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    // Fetch PR metadata + files so we can validate/anchor line numbers against the PR diff.
    const prResponse = await fetch(`${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`, { headers });
    if (!prResponse.ok) {
      const errorText = await prResponse.text().catch(() => '');
      throw new Error(`GitHub API error fetching PR: ${prResponse.status} ${prResponse.statusText}${errorText ? ` Details: ${errorText.substring(0, 200)}` : ''}`);
    }
    const prData = await prResponse.json();
    const commitId = prData?.head?.sha;
    if (!commitId || typeof commitId !== 'string') {
      throw new Error('Could not determine PR head commit SHA (head.sha) required for inline review comments.');
    }
    const reviewTitle = typeof prData?.title === 'string' && prData.title.trim()
      ? `Code Review: ${prData.title.trim()}`
      : 'Code Review';

    const filesResponse = await fetch(`${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files`, { headers });
    if (!filesResponse.ok) {
      const errorText = await filesResponse.text().catch(() => '');
      throw new Error(`GitHub API error fetching PR files: ${filesResponse.status} ${filesResponse.statusText}${errorText ? ` Details: ${errorText.substring(0, 200)}` : ''}`);
    }
    const filesData = await filesResponse.json();

    const patchInfoByPath = new Map<
      string,
      {
        patch: string;
        validNewLines: number[];
        validNewLineSet: Set<number>;
        patchLineIndexToNewLine: Array<number | null>;
        nonHeaderIndexToNewLine: Array<number | null>;
      }
    >();

    for (const file of filesData as any[]) {
      if (!file?.filename) continue;
      const patch = (file.patch || '').toString();
      if (!patch) continue;
      const analyzed = analyzePatch(patch);
      patchInfoByPath.set(file.filename, {
        patch,
        validNewLines: analyzed.validNewLines,
        validNewLineSet: new Set(analyzed.validNewLines),
        patchLineIndexToNewLine: analyzed.patchLineIndexToNewLine,
        nonHeaderIndexToNewLine: analyzed.nonHeaderIndexToNewLine
      });
    }

    const severityCounts = { critical: 0, warning: 0, suggestion: 0 };
    for (const c of comments as any[]) {
      const sev = (c?.severity || 'suggestion').toString().toLowerCase();
      if (sev === 'critical') severityCounts.critical++;
      else if (sev === 'warning') severityCounts.warning++;
      else severityCounts.suggestion++;
    }

    const resolvedInline: Array<{
      originalIndex: number;
      path: string;
      line: number;
      side: 'RIGHT';
      body: string;
    }> = [];

    const unplaced: Array<{ index: number; title: string; severity: string; file: string; content: string }> = [];

    for (let i = 0; i < (comments as any[]).length; i++) {
      const comment = (comments as any[])[i];
      const path = normalizePath(comment.filePath);
      const commentTitle = comment?.title || `Issue ${i + 1}`;

      // Don't post parse/unstructured placeholders to GitHub; summarize instead.
      if (
        typeof commentTitle === 'string' &&
        (commentTitle.includes('(parse error)') || commentTitle.includes('(unstructured response)'))
      ) {
        unplaced.push({
          index: i + 1,
          title: 'Review output could not be parsed',
          severity: (comment.severity || 'suggestion').toString().toUpperCase(),
          file: path || 'Unknown file',
          content: 'The review output could not be parsed for this section. Re-run the review to regenerate structured findings.'
        });
        continue;
      }

      if (!path || path === 'Unknown file') {
        unplaced.push({
          index: i + 1,
          title: commentTitle,
          severity: (comment.severity || 'suggestion').toString().toUpperCase(),
          file: path || 'Unknown file',
          content: truncate((comment.content || comment.suggestion || '').toString(), 2000)
        });
        continue;
      }

      const patchInfo = patchInfoByPath.get(path);
      if (!patchInfo || !patchInfo.validNewLines.length) {
        unplaced.push({
          index: i + 1,
          title: commentTitle,
          severity: (comment.severity || 'suggestion').toString().toUpperCase(),
          file: path,
          content: truncate((comment.content || comment.suggestion || '').toString(), 2000)
        });
        continue;
      }

      let desiredLine: number | null = Number.isFinite(comment.line) ? comment.line : null;
      if (!desiredLine || desiredLine < 1) desiredLine = inferLineFromCodeContext(comment.codeContext);

      let resolvedLine: number | null = null;

      if (desiredLine && patchInfo.validNewLineSet.has(desiredLine)) {
        resolvedLine = desiredLine;
      }

      // Heuristic: some models output "line number" as the Nth line in the diff blob.
      if (!resolvedLine && desiredLine && desiredLine >= 1) {
        const asPatchIndex = desiredLine - 1;
        const mappedFromPatchIndex = findNearestNonNull(patchInfo.patchLineIndexToNewLine, asPatchIndex, 3);
        if (mappedFromPatchIndex && patchInfo.validNewLineSet.has(mappedFromPatchIndex)) {
          resolvedLine = mappedFromPatchIndex;
        }
      }

      if (!resolvedLine && desiredLine && desiredLine >= 1) {
        const asNonHeaderIndex = desiredLine - 1;
        const mappedFromNonHeaderIndex = findNearestNonNull(patchInfo.nonHeaderIndexToNewLine, asNonHeaderIndex, 3);
        if (mappedFromNonHeaderIndex && patchInfo.validNewLineSet.has(mappedFromNonHeaderIndex)) {
          resolvedLine = mappedFromNonHeaderIndex;
        }
      }

      // Last resort: snap to the nearest line that exists in the PR diff hunk(s).
      if (!resolvedLine && desiredLine && desiredLine >= 1) {
        const snapped = snapToNearestValidLine(patchInfo.validNewLines, desiredLine, 20);
        if (snapped != null) {
          resolvedLine = snapped;
        }
      }

      if (!resolvedLine) {
        unplaced.push({
          index: i + 1,
          title: commentTitle,
          severity: (comment.severity || 'suggestion').toString().toUpperCase(),
          file: path,
          content: truncate((comment.content || comment.suggestion || '').toString(), 2000)
        });
        continue;
      }

      resolvedInline.push({
        originalIndex: i,
        path,
        line: resolvedLine,
        side: 'RIGHT',
        body: formatInlineBody(comment)
      });
    }

    // Create a draft review, attach inline comments to it, then submit (unless user requested draft).
    const createDraftReviewResponse = await retryWithBackoff(async () => {
      return await fetch(reviewsUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          body: `## ${reviewTitle}`,
          commit_id: commitId
        })
      });
    });

    if (!createDraftReviewResponse.ok) {
      const errorText = await createDraftReviewResponse.text();
      console.error('Failed to create draft review:', createDraftReviewResponse.status, errorText);
      throw new Error(`GitHub API error creating draft review: ${createDraftReviewResponse.status} Details: ${errorText.substring(0, 200)}`);
    }

    const draftReviewData = await createDraftReviewResponse.json();
    const reviewId = draftReviewData.id;

    let inlinePosted = 0;
    const inlineFailed: Array<{ index: number; path: string; line: number; error: string }> = [];

    for (const inline of resolvedInline) {
      const resp = await retryWithBackoff(async () => {
        return await fetch(reviewCommentsUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            body: inline.body,
            commit_id: commitId,
            path: inline.path,
            side: inline.side,
            line: inline.line,
            pull_request_review_id: reviewId
          })
        });
      });

      if (resp.ok) {
        inlinePosted += 1;
        continue;
      }

      const errorText = await resp.text().catch(() => '');
      inlineFailed.push({
        index: inline.originalIndex + 1,
        path: inline.path,
        line: inline.line,
        error: `${resp.status}: ${errorText.substring(0, 200)}`
      });
    }

    // If GitHub rejected some "resolvable" inline comments, list them in the summary instead.
    const finalUnplaced = [...unplaced];
    for (const failed of inlineFailed) {
      const original = (comments as any[])[failed.index - 1] || {};
      finalUnplaced.push({
        index: failed.index,
        title: original.title || `Issue ${failed.index}`,
        severity: (original.severity || 'suggestion').toString().toUpperCase(),
        file: failed.path,
        content:
          truncate((original.content || original.suggestion || '').toString(), 1500) +
          `\n\n_Inline comment failed to post at \`${failed.path}:${failed.line}\` (${failed.error})._`
      });
    }

    const finalSummaryBody = buildSummaryBody({
      title: reviewTitle,
      total: (comments as any[]).length,
      postedInline: inlinePosted,
      unplaced: finalUnplaced,
      severityCounts
    });

    if (!asDraft) {
      const submitResponse = await retryWithBackoff(async () => {
        return await fetch(`${reviewsUrl}/${reviewId}/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'COMMENT',
            body: finalSummaryBody
          })
        });
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text().catch(() => '');
        throw new Error(`GitHub API error submitting review: ${submitResponse.status} ${submitResponse.statusText}${errorText ? ` Details: ${errorText.substring(0, 200)}` : ''}`);
      }
    }

    if (inlineFailed.length) {
      console.warn('Some inline comments failed to post:', inlineFailed);
    }

    // Best-effort update for draft reviews so the user sees the final summary without submitting.
    if (asDraft) {
      try {
        const updateResponse = await fetch(`${reviewsUrl}/${reviewId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ body: finalSummaryBody })
        });
        if (!updateResponse.ok) {
          // Some GitHub API deployments may not support PATCH here; ignore.
          console.warn('Failed to update draft review body:', updateResponse.status, await updateResponse.text().catch(() => ''));
        }
      } catch (e) {
        console.warn('Failed to update draft review body:', e);
      }
    }

    sendResponse({
      success: true,
      reviewId,
      commentsPosted: inlinePosted,
      isDraft: asDraft,
      unplacedCount: finalUnplaced.length,
      inlineFailedCount: inlineFailed.length
    });
  } catch (error) {
    console.error('Post GitHub review error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed - setting default settings');
    // Open settings page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('Extension updated to version', chrome.runtime.getManifest().version);
  }
});
