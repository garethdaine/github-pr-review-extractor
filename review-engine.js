// Review Engine for GitHub PR Review Extractor
// Orchestrates AI code reviews using LLM and GitHub API

class ReviewEngine {
  constructor(settings) {
    this.settings = settings;
    this.llmClient = new LLMClient(settings);
    this.githubClient = new GitHubAPIClient();
    this.maxIssuesPerFile = settings.maxIssuesPerFile || 10;
  }

  /**
   * Generate AI review for the current PR
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - Review results
   */
  async generateReview(progressCallback) {
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
      const allIssues = [];
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
        error: error.message
      };
    }
  }

  /**
   * Review a single file
   * @param {Object} file - File object with patch
   * @param {Object} prMetadata - PR metadata
   * @param {Object} checkTypes - Types of checks to perform
   * @returns {Promise<Array>} - Array of issues
   */
  async reviewFile(file, prMetadata, checkTypes) {
    const context = {
      prTitle: prMetadata.title,
      prDescription: prMetadata.description,
      filePath: file.filename
    };

    // Check if patch needs chunking
    const patchLines = file.patch.split('\n').length;
    
    if (patchLines > 150) {
      // Chunk large files
      return await this.reviewFileChunked(file, context, checkTypes);
    } else {
      // Review entire file at once
      const result = await this.llmClient.reviewCode(file.patch, context, checkTypes);
      
      if (result.success) {
        return result.issues;
      } else {
        console.error(`LLM error for ${file.filename}:`, result.error);
        return [];
      }
    }
  }

  /**
   * Review a file in chunks (for large files)
   * @param {Object} file - File object
   * @param {Object} context - Review context
   * @param {Object} checkTypes - Check types
   * @returns {Promise<Array>} - Array of issues
   */
  async reviewFileChunked(file, context, checkTypes) {
    const chunks = this.githubClient.chunkPatch(file.patch, 100);
    const allIssues = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkContext = {
        ...context,
        filePath: `${file.filename} (part ${i + 1}/${chunks.length})`
      };

      try {
        const result = await this.llmClient.reviewCode(chunks[i], chunkContext, checkTypes);
        
        if (result.success) {
          allIssues.push(...result.issues);
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
  deduplicateIssues(issues) {
    const seen = new Set();
    const deduplicated = [];

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
  filterFiles(files) {
    return files.filter(file => {
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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewEngine;
}
