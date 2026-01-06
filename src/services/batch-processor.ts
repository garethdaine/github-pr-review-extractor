// Batch processor for reviewing multiple PRs

import type { Issue } from '../types/issue';

export interface PRInfo {
  url: string;
  owner: string;
  repo: string;
  prNumber: number;
  title?: string;
}

export interface BatchProgress {
  current: number;
  total: number;
  currentPR: string;
  status: 'processing' | 'paused' | 'completed' | 'error';
  results: BatchResult[];
}

export interface BatchResult {
  prUrl: string;
  prTitle: string;
  success: boolean;
  issues: Issue[];
  error?: string;
  filesReviewed?: number;
}

export class BatchProcessor {
  private progressCallback: ((progress: BatchProgress) => void) | null = null;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private currentProgress: BatchProgress;

  constructor(private reviewEngine: any, private githubClient: any) {
    this.currentProgress = {
      current: 0,
      total: 0,
      currentPR: '',
      status: 'processing',
      results: []
    };
  }

  /**
   * Process multiple PRs
   */
  async processPRs(
    prUrls: string[],
    progressCallback: (progress: BatchProgress) => void
  ): Promise<BatchResult[]> {
    this.progressCallback = progressCallback;
    this.isPaused = false;
    this.isCancelled = false;
    this.currentProgress = {
      current: 0,
      total: prUrls.length,
      currentPR: '',
      status: 'processing',
      results: []
    };

    const results: BatchResult[] = [];

    for (let i = 0; i < prUrls.length; i++) {
      // Check if paused or cancelled
      while (this.isPaused && !this.isCancelled) {
        await this.sleep(100);
      }

      if (this.isCancelled) {
        this.currentProgress.status = 'error';
        this.updateProgress();
        break;
      }

      const prUrl = prUrls[i];
      const prInfo = this.parsePRUrl(prUrl);

      if (!prInfo) {
        results.push({
          prUrl,
          prTitle: 'Invalid PR URL',
          success: false,
          issues: [],
          error: 'Invalid PR URL format'
        });
        continue;
      }

      this.currentProgress.current = i + 1;
      this.currentProgress.currentPR = prUrl;
      this.updateProgress();

      try {
        const result = await this.processSinglePR(prInfo);
        results.push(result);
        this.currentProgress.results.push(result);
      } catch (error) {
        const errorResult: BatchResult = {
          prUrl,
          prTitle: prInfo.title || `PR #${prInfo.prNumber}`,
          success: false,
          issues: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.push(errorResult);
        this.currentProgress.results.push(errorResult);
      }

      this.updateProgress();
    }

    this.currentProgress.status = 'completed';
    this.updateProgress();

    return results;
  }

  /**
   * Process a single PR
   */
  private async processSinglePR(prInfo: PRInfo): Promise<BatchResult> {
    // Fetch PR data
    const prData = await this.githubClient.fetchPRData(
      prInfo.owner,
      prInfo.repo,
      prInfo.prNumber
    );

    if (!prData.success) {
      return {
        prUrl: this.buildPRUrl(prInfo),
        prTitle: prInfo.title || `PR #${prInfo.prNumber}`,
        success: false,
        issues: [],
        error: prData.error
      };
    }

    const pr = prData.pr;
    const files = this.githubClient.extractFilePatches(prData.files);

    // Review files
    const allIssues: Issue[] = [];
    const checkTypes = {
      bugs: true,
      security: true,
      performance: true,
      style: false,
      errorHandling: true
    };

    for (const file of files) {
      const prMetadata = {
        title: pr.title,
        description: pr.body || '',
        owner: prInfo.owner,
        repo: prInfo.repo,
        prNumber: prInfo.prNumber
      };

      const fileIssues = await this.reviewEngine.reviewFile(file, prMetadata, checkTypes);
      allIssues.push(...fileIssues);
    }

    return {
      prUrl: this.buildPRUrl(prInfo),
      prTitle: pr.title,
      success: true,
      issues: allIssues,
      filesReviewed: files.length
    };
  }

  /**
   * Parse PR URL into components
   */
  private parsePRUrl(url: string): PRInfo | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) {
      return null;
    }

    return {
      url,
      owner: match[1],
      repo: match[2],
      prNumber: parseInt(match[3])
    };
  }

  /**
   * Build PR URL from info
   */
  private buildPRUrl(prInfo: PRInfo): string {
    return `https://github.com/${prInfo.owner}/${prInfo.repo}/pull/${prInfo.prNumber}`;
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.isPaused = true;
    this.currentProgress.status = 'paused';
    this.updateProgress();
  }

  /**
   * Resume processing
   */
  resume(): void {
    this.isPaused = false;
    this.currentProgress.status = 'processing';
    this.updateProgress();
  }

  /**
   * Cancel processing
   */
  cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
    this.currentProgress.status = 'error';
    this.updateProgress();
  }

  /**
   * Update progress callback
   */
  private updateProgress(): void {
    if (this.progressCallback) {
      this.progressCallback({ ...this.currentProgress });
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate combined report from batch results
   */
  generateCombinedReport(results: BatchResult[]): string {
    let report = '# Batch PR Review Report\n\n';
    report += `**Generated:** ${new Date().toLocaleString()}\n`;
    report += `**PRs Reviewed:** ${results.length}\n\n`;

    const totalIssues = results.reduce((sum, r) => sum + (r.issues?.length || 0), 0);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    report += `**Summary:**\n`;
    report += `- Successful reviews: ${successful}\n`;
    report += `- Failed reviews: ${failed}\n`;
    report += `- Total issues found: ${totalIssues}\n\n`;

    report += '---\n\n';

    results.forEach((result, index) => {
      report += `## ${index + 1}. ${result.prTitle}\n\n`;
      report += `**PR:** ${result.prUrl}\n`;

      if (result.success) {
        report += `**Status:** ✓ Success\n`;
        report += `**Files Reviewed:** ${result.filesReviewed || 0}\n`;
        report += `**Issues Found:** ${result.issues.length}\n\n`;

        if (result.issues.length > 0) {
          const bySeverity = {
            critical: result.issues.filter(i => i.severity === 'critical').length,
            warning: result.issues.filter(i => i.severity === 'warning').length,
            suggestion: result.issues.filter(i => i.severity === 'suggestion').length
          };

          report += `**By Severity:** 🔴 ${bySeverity.critical} Critical, 🟡 ${bySeverity.warning} Warnings, 🔵 ${bySeverity.suggestion} Suggestions\n\n`;

          // Group by file
          const byFile: Record<string, Issue[]> = {};
          result.issues.forEach(issue => {
            const file = issue.filePath || 'Unknown';
            if (!byFile[file]) byFile[file] = [];
            byFile[file].push(issue);
          });

          Object.entries(byFile).forEach(([file, issues]) => {
            report += `### 📁 ${file}\n\n`;
            issues.forEach(issue => {
              const severityEmoji = issue.severity === 'critical' ? '🔴' :
                                   issue.severity === 'warning' ? '🟡' : '🔵';
              report += `- ${severityEmoji} **${issue.title}**\n`;
              if (issue.confidence !== undefined) {
                report += `  *Confidence: ${(issue.confidence * 100).toFixed(0)}%*\n`;
              }
            });
            report += '\n';
          });
        }
      } else {
        report += `**Status:** ✗ Failed\n`;
        report += `**Error:** ${result.error}\n\n`;
      }

      report += '---\n\n';
    });

    return report;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  (window as any).BatchProcessor = BatchProcessor;
}




