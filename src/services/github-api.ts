// GitHub API Client for GitHub PR Review Extractor
// Fetches PR data and file diffs from GitHub

import cache, { getPRCacheKey } from '../utils/cache';

export type ParsedPRUrl = { owner: string; repo: string; prNumber: number };

export type FetchPRDataResult =
  | { success: true; pr: any; files: any[] }
  | { success: false; error: string };

export type ReviewableFile = {
  filename: string;
  status?: string;
  additions?: number;
  deletions?: number;
  changes?: number;
  patch: string;
  sha?: string;
  tooLarge?: boolean;
};

export type PRMetadata = {
  title: string;
  description: string;
  url: string;
  owner: string;
  repo: string;
  prNumber: number;
  commits?: Array<{ message: string }>;
  linkedIssues?: string[];
};

export class GitHubAPIClient {
  private githubToken: string | null;

  constructor(githubToken: string | null = null) {
    this.githubToken = githubToken;
  }

  /**
   * Parse PR URL to extract owner, repo, and PR number
   * @param {string} url - GitHub PR URL
   * @returns {Object} - Parsed components
   */
  parsePRUrl(url: string): ParsedPRUrl | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) {
      return null;
    }

    return {
      owner: match[1],
      repo: match[2],
      prNumber: parseInt(match[3])
    };
  }

  /**
   * Fetch PR details and files from GitHub API (with caching)
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} prNumber - PR number
   * @returns {Promise<Object>} - PR data
   */
  async fetchPRData(owner: string, repo: string, prNumber: number): Promise<FetchPRDataResult> {
    // Check cache first
    const cacheKey = getPRCacheKey(owner, repo, prNumber);
    const cached = cache.get<FetchPRDataResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'FETCH_PR_DATA',
        owner: owner,
        repo: repo,
        prNumber: prNumber,
        githubToken: this.githubToken
      });

      if (response.success) {
        const result = {
          success: true,
          pr: response.pr,
          files: response.files
        } as const;
        // Cache for 10 minutes
        cache.set(cacheKey, result, 10 * 60 * 1000);
        return result;
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('Fetch PR data error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract file patches from PR files
   * @param {Array} files - Array of file objects from GitHub API
   * @returns {Array} - Array of file patches
   */
  extractFilePatches(files: any[]): ReviewableFile[] {
    return files.map((file: any) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch || '',
      sha: file.sha
    })).filter(file => file.patch); // Only include files with patches
  }

  /**
   * Chunk a file patch into smaller pieces
   * @param {string} patch - The diff patch
   * @param {number} maxLines - Maximum lines per chunk
   * @returns {Array} - Array of patch chunks
   */
  chunkPatch(patch: string, maxLines = 100): string[] {
    const lines = patch.split('\n');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let contextLines: string[] = []; // Track context lines

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentChunk.push(line);

      // Keep track of context (unchanged lines)
      if (!line.startsWith('+') && !line.startsWith('-') && !line.startsWith('@@')) {
        contextLines.push(line);
        if (contextLines.length > 10) {
          contextLines.shift();
        }
      }

      // Chunk if we reach max lines
      if (currentChunk.length >= maxLines) {
        // Find a good breaking point (prefer breaking at context lines)
        chunks.push(currentChunk.join('\n'));
        // Start next chunk with some context
        currentChunk = contextLines.slice(-5);
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
    }

    return chunks.length > 0 ? chunks : [patch];
  }

  /**
   * Annotate a unified diff patch with line numbers to make LLM "line" output anchorable.
   * - Adds NEW-file line numbers for context/addition lines.
   * - Adds OLD-file line numbers for deletion lines (LLM should omit "line" for deletions).
   */
  annotatePatchWithLineNumbers(patch: string): string {
    const lines = patch.split('\n');
    const out: string[] = [];

    let oldLine = 0;
    let newLine = 0;
    let inHunk = false;

    for (const line of lines) {
      const hunk = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
      if (hunk) {
        oldLine = parseInt(hunk[1], 10);
        newLine = parseInt(hunk[2], 10);
        inHunk = true;
        out.push(line);
        continue;
      }

      if (!inHunk || line.startsWith('\\')) {
        out.push(line);
        continue;
      }

      const prefix = line[0];
      const content = line.slice(1);

      if (prefix === '+') {
        out.push(`+${String(newLine).padStart(6)}|${content}`);
        newLine += 1;
        continue;
      }

      if (prefix === '-') {
        // Deletions don't exist on the RIGHT/new side; omit a number to discourage anchoring.
        out.push(`-${' '.repeat(6)}|${content}`);
        oldLine += 1;
        continue;
      }

      // Context line
      out.push(` ${String(newLine).padStart(6)}|${content}`);
      oldLine += 1;
      newLine += 1;
    }

    return out.join('\n');
  }

  /**
   * Get PR metadata from DOM (faster than API call)
   * @returns {Object} - PR metadata
   */
  getPRMetadataFromDOM() {
    try {
      const prTitle = document.querySelector('.js-issue-title')?.textContent.trim() || '';
      const prDescription = document.querySelector('.comment-body.markdown-body')?.textContent.trim() || '';
      const prUrl = window.location.href;
      const parsed = this.parsePRUrl(prUrl);

      return {
        title: prTitle,
        description: prDescription.substring(0, 500), // Limit description length
        url: prUrl,
        owner: parsed?.owner || '',
        repo: parsed?.repo || '',
        prNumber: parsed?.prNumber || 0
      } as PRMetadata;
    } catch (error) {
      console.error('Failed to extract PR metadata from DOM:', error);
      return null;
    }
  }

  /**
   * Extract diffs from DOM (faster than API, already rendered)
   * This extracts file diffs that are visible on the page
   * @returns {Array} - Array of file diffs
   */
  extractDiffsFromDOM(): Array<
    | { filename: string; patch: string }
    | { filename: string; patch: null; tooLarge: true }
  > {
    const fileDiffs: Array<
      | { filename: string; patch: string }
      | { filename: string; patch: null; tooLarge: true }
    > = [];

    try {
      const fileContainers = document.querySelectorAll('.file');

      fileContainers.forEach(container => {
        // Get file path
        const fileHeader = container.querySelector('.file-header');
        const fileLink = fileHeader?.querySelector('[title]');
        const filename = fileLink?.getAttribute('title') ||
                        fileLink?.textContent.trim() ||
                        'unknown';

        // Check if file is too large (GitHub shows "Large diffs are not rendered by default")
        const loadDiffButton = container.querySelector('.load-diff-button, .js-expand-full-wrapper');
        if (loadDiffButton) {
          console.log(`Skipping large file ${filename} - not rendered in DOM`);
          // Mark this file for API fallback
          fileDiffs.push({
            filename: filename,
            patch: null,
            tooLarge: true
          });
          return;
        }

        // Get the diff content
        const diffTable = container.querySelector('.diff-table');
        if (!diffTable) return;

        let patchLines: string[] = [];
        const rows = diffTable.querySelectorAll('tr');

        rows.forEach(row => {
          const lineNumOld = row.querySelector('.blob-num-deletion')?.textContent.trim();
          const lineNumNew = row.querySelector('.blob-num-addition')?.textContent.trim();
          const codeCell = row.querySelector('.blob-code');

          if (!codeCell) return;

          const code = codeCell.textContent;
          let prefix = ' ';

          if (codeCell.classList.contains('blob-code-deletion')) {
            prefix = '-';
          } else if (codeCell.classList.contains('blob-code-addition')) {
            prefix = '+';
          }

          patchLines.push(`${prefix}${code}`);
        });

        if (patchLines.length > 0) {
          fileDiffs.push({
            filename: filename,
            patch: patchLines.join('\n')
          });
        }
      });
    } catch (error) {
      console.error('Failed to extract diffs from DOM:', error);
    }

    return fileDiffs;
  }

  /**
   * Get reviewable files - combines API data with DOM diffs if available
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} prNumber - PR number
   * @returns {Promise<Array>} - Array of files with patches
   */
  async getReviewableFiles(owner: string, repo: string, prNumber: number): Promise<any> {
    // Try DOM first (faster and already available)
    const domDiffs = this.extractDiffsFromDOM();

    // Check if we have any files that are too large
    const largeFiles = domDiffs.filter((f): f is { filename: string; patch: null; tooLarge: true } => f.patch === null);
    const validDomFiles = domDiffs.filter((f): f is { filename: string; patch: string } => typeof f.patch === 'string');

    if (largeFiles.length > 0) {
      console.log(`Found ${largeFiles.length} large files, fetching from API...`);
      // Fetch large files from API
      const apiResult = await this.fetchPRData(owner, repo, prNumber);
      if (apiResult.success) {
        const apiFiles = this.extractFilePatches(apiResult.files);
        // Merge: use API data for large files, DOM data for others
        const largeFileNames = largeFiles.map(f => f.filename);
        const largePatchesFromAPI = apiFiles.filter(f => largeFileNames.includes(f.filename));
        const allFiles = [...validDomFiles, ...largePatchesFromAPI];
        console.log(`Combined ${validDomFiles.length} DOM files + ${largePatchesFromAPI.length} API files`);
        return {
          success: true,
          files: allFiles,
          source: 'mixed'
        };
      }
      // If API fails, just use DOM files we have
      console.warn('API fetch failed for large files, using DOM files only');
    }

    if (validDomFiles.length > 0) {
      console.log(`Extracted ${validDomFiles.length} files from DOM`);
      return {
        success: true,
        files: validDomFiles,
        source: 'dom'
      };
    }

    // DOM extraction failed - check if we're on the right tab
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/files')) {
      console.log('Not on Files tab, falling back to GitHub API');
    } else {
      console.log('On Files tab but no diffs found, falling back to GitHub API');
    }

    // Fall back to API
    const apiResult = await this.fetchPRData(owner, repo, prNumber);

    if (apiResult.success) {
      const files = this.extractFilePatches(apiResult.files);
      return {
        success: true,
        files: files,
        source: 'api',
        pr: apiResult.pr
      };
    }

    // Both methods failed - provide helpful error message
    if (apiResult.error && apiResult.error.includes('404')) {
      return {
        success: false,
        error: 'Could not access PR data. Please navigate to the "Files changed" tab, or add a GitHub token in extension settings for private repos.'
      };
    }

    return apiResult;
  }
}

// Make available globally for content scripts (loaded as a separate bundle)
if (typeof window !== 'undefined') {
  (window as any).GitHubAPIClient = GitHubAPIClient;
}
