// Review Engine for GitHub PR Review Extractor
// Orchestrates AI code reviews using LLM and GitHub API

import type { Issue } from '../types/issue';
import { GitHubAPIClient } from './github-api';
import { LLMClient, type ReviewFocusSeverity } from './llm-client';

export class ReviewEngine {
  private settings: any;
  private llmClient: LLMClient;
  private githubClient: GitHubAPIClient;
  private maxIssuesPerFile: number;

  constructor(settings: any) {
    this.settings = settings;
    this.llmClient = new LLMClient(settings);
    this.githubClient = new GitHubAPIClient(settings?.githubToken || null);
    this.maxIssuesPerFile = settings.maxIssuesPerFile || 10;
  }

  /**
   * Generate AI review for the current PR
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - Review results
   */
  async generateReview(progressCallback: (progress: any) => void): Promise<any> {
    try {
      // Step 1: Get PR metadata
      progressCallback({ status: 'fetching', message: 'Fetching PR data...' });
      const prMetadata = this.githubClient.getPRMetadataFromDOM();

      if (!prMetadata) {
        return {
          success: false,
          error: 'Failed to extract PR metadata'
        };
      }

      // Step 2: Get reviewable files
      progressCallback({ status: 'extracting', message: 'Extracting file changes...' });
      const filesResult = await this.githubClient.getReviewableFiles(
        prMetadata.owner,
        prMetadata.repo,
        prMetadata.prNumber
      );

      if (!filesResult.success) {
        return {
          success: false,
          error: filesResult.error
        };
      }

      const files = filesResult.files;
      if (files.length === 0) {
        return {
          success: true,
          issues: [],
          message: 'No files to review'
        };
      }

      // Step 3: Review each file
      const allIssues: Issue[] = [];
      const checkTypes = {
        bugs: this.settings.checkBugs !== false,
        security: this.settings.checkSecurity !== false,
        performance: this.settings.checkPerformance !== false,
        style: this.settings.checkStyle === true,
        errorHandling: this.settings.checkErrorHandling !== false
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        progressCallback({
          status: 'reviewing',
          message: `Reviewing ${file.filename}... (${i + 1}/${files.length})`,
          progress: Math.round(((i + 1) / files.length) * 100)
        });

        try {
          const fileIssues = await this.reviewFile(file, prMetadata, checkTypes);

          // Limit issues per file
          const limitedIssues = fileIssues.slice(0, this.maxIssuesPerFile);
          allIssues.push(...limitedIssues);

          if (fileIssues.length > this.maxIssuesPerFile) {
            console.log(`Limited issues for ${file.filename}: ${fileIssues.length} -> ${this.maxIssuesPerFile}`);
          }
        } catch (error) {
          console.error(`Error reviewing ${file.filename}:`, error);
          // Continue with other files
        }
      }

      return {
        success: true,
        issues: allIssues,
        filesReviewed: files.length
      };
    } catch (error) {
      console.error('Review generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Review a single file with multi-pass support
   * @param {Object} file - File object with patch
   * @param {Object} prMetadata - PR metadata
   * @param {Object} checkTypes - Types of checks to perform
   * @returns {Promise<Array>} - Array of issues
   */
  async reviewFile(file: any, prMetadata: any, checkTypes: any): Promise<Issue[]> {
    const enhancedContext = await this._buildEnhancedContext(file, prMetadata);
    const patchForLLM = this.githubClient.annotatePatchWithLineNumbers(file.patch || '');

    // Check if patch needs chunking
    const patchLines = patchForLLM.split('\n').length;

    // Multi-pass review if enabled
    if (this.settings.multiPassReview !== false) {
      return await this.reviewFileMultiPass(file, enhancedContext, checkTypes);
    }

    if (patchLines > 150) {
      // Chunk large files
      return await this.reviewFileChunked({ ...file, patch: patchForLLM }, enhancedContext, checkTypes);
    } else {
      // Review entire file at once
      const result = await this.llmClient.reviewCode(patchForLLM, enhancedContext, checkTypes);

      if (result.success) {
        return result.issues;
      } else {
        console.error(`LLM error for ${file.filename}:`, result.error);
        return [];
      }
    }
  }

  /**
   * Multi-pass review: Pass 1 for critical, Pass 2 for warnings/suggestions
   */
  async reviewFileMultiPass(file: any, context: any, checkTypes: any): Promise<Issue[]> {
    const allIssues: Issue[] = [];
    const patchForLLM = this.githubClient.annotatePatchWithLineNumbers(file.patch || '');
    const patchLines = patchForLLM.split('\n').length;
    const needsChunking = patchLines > 150;

    // Pass 1: Critical issues only
    const pass1Context = {
      ...context,
      reviewPass: 1,
      focusOn: 'critical'
    };

    const pass1CheckTypes = {
      ...checkTypes,
      focusSeverity: 'critical'
    };

    let pass1Result;
    if (needsChunking) {
      pass1Result = await this.reviewFileChunked({ ...file, patch: patchForLLM }, pass1Context, pass1CheckTypes, 'critical');
    } else {
      pass1Result = await this.llmClient.reviewCode(patchForLLM, pass1Context, pass1CheckTypes, 'critical');
      if (pass1Result.success) {
        pass1Result = { issues: pass1Result.issues };
      }
    }

    if (pass1Result && pass1Result.issues) {
      allIssues.push(...pass1Result.issues.filter((i: Issue) => i.severity === 'critical'));
    }

    // Pass 2: Warnings and suggestions
    const pass2Context = {
      ...context,
      reviewPass: 2,
      focusOn: 'warnings-suggestions'
    };

    const pass2CheckTypes = {
      ...checkTypes,
      focusSeverity: 'warnings-suggestions'
    };

    let pass2Result;
    if (needsChunking) {
      pass2Result = await this.reviewFileChunked({ ...file, patch: patchForLLM }, pass2Context, pass2CheckTypes, 'warnings-suggestions');
    } else {
      pass2Result = await this.llmClient.reviewCode(patchForLLM, pass2Context, pass2CheckTypes, 'warnings-suggestions');
      if (pass2Result.success) {
        pass2Result = { issues: pass2Result.issues };
      }
    }

    if (pass2Result && pass2Result.issues) {
      allIssues.push(...pass2Result.issues.filter((i: Issue) => i.severity !== 'critical'));
    }

    return this.deduplicateIssues(allIssues);
  }

  /**
   * Build enhanced context with PR description, commits, file stats
   */
  async _buildEnhancedContext(file: any, prMetadata: any): Promise<any> {
    const context: any = {
      prTitle: prMetadata.title,
      prDescription: prMetadata.description || '',
      filePath: file.filename,
      fileStats: {
        additions: file.additions || 0,
        deletions: file.deletions || 0,
        changes: file.changes || 0
      }
    };

    // Add commit messages if available
    if (prMetadata.commits) {
      context.commitMessages = prMetadata.commits.map((c: any) => c.message).join('\n');
    }

    // Add linked issues if available
    if (prMetadata.linkedIssues) {
      context.linkedIssues = prMetadata.linkedIssues;
    }

    return context;
  }

  /**
   * Review a file in chunks (for large files)
   * @param {Object} file - File object
   * @param {Object} context - Review context
   * @param {Object} checkTypes - Check types
   * @param {string} focusSeverity - Optional: 'critical', 'warnings-suggestions', or null
   * @returns {Promise<Array>} - Array of issues
   */
  async reviewFileChunked(
    file: any,
    context: any,
    checkTypes: any,
    focusSeverity: ReviewFocusSeverity = null
  ): Promise<Issue[]> {
    const chunks = this.githubClient.chunkPatch(file.patch, 100);
    const allIssues: Issue[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkContext = {
        ...context,
        filePath: file.filename,
        chunkInfo: `part ${i + 1}/${chunks.length}`
      };

      try {
        const result = await this.llmClient.reviewCode(chunks[i], chunkContext, checkTypes, focusSeverity);

        if (result.success) {
          allIssues.push(...(result.issues as Issue[]));
        }
      } catch (error) {
        console.error(`Error reviewing chunk ${i + 1} of ${file.filename}:`, error);
      }
    }

    // Deduplicate issues
    return this.deduplicateIssues(allIssues);
  }

  /**
   * Deduplicate similar issues
   * @param {Array} issues - Array of issues
   * @returns {Array} - Deduplicated issues
   */
  deduplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Set();
    const deduplicated: Issue[] = [];

    for (const issue of issues) {
      // Create a fingerprint based on title and file
      const fingerprint = `${issue.filePath}:${issue.title}`.toLowerCase();

      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        deduplicated.push(issue);
      }
    }

    return deduplicated;
  }

  /**
   * Filter files to review based on settings
   * @param {Array} files - Array of files
   * @returns {Array} - Filtered files
   */
  filterFiles(files: any[]): any[] {
    return files.filter((file: any) => {
      // Skip certain file types that don't need review
      const skipExtensions = ['.lock', '.min.js', '.min.css', '.svg', '.png', '.jpg', '.gif'];
      const skipPaths = ['node_modules/', 'vendor/', 'dist/', 'build/'];

      // Check extension
      for (const ext of skipExtensions) {
        if (file.filename.endsWith(ext)) {
          return false;
        }
      }

      // Check path
      for (const path of skipPaths) {
        if (file.filename.includes(path)) {
          return false;
        }
      }

      return true;
    });
  }
}

// Make available globally for content scripts (loaded as a separate bundle)
if (typeof window !== 'undefined') {
  (window as any).ReviewEngine = ReviewEngine;
}
