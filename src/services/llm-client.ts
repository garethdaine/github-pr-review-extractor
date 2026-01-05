// LLM Client for GitHub PR Review Extractor
// OpenAI-compatible client for local LLM

class LLMClient {
  constructor(settings) {
    this.endpoint = settings.llmEndpoint;
    this.apiKey = settings.apiKey;
    this.modelName = settings.modelName;
    this.maxTokens = settings.maxTokens || 1000;
    this.temperature = settings.temperature || 0.2;
    this.settings = settings;
  }

  /**
   * Send a chat completion request to the LLM
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Optional parameters (maxTokens, temperature, etc.)
   * @returns {Promise<Object>} - Response from LLM
   */
  async chat(messages, options = {}) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'CALL_LLM',
        endpoint: this.endpoint,
        apiKey: this.apiKey,
        modelName: this.modelName,
        messages: messages,
        maxTokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature
      });

      if (response.success) {
        return {
          success: true,
          content: response.data.choices[0]?.message?.content || '',
          fullResponse: response.data
        };
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('LLM chat error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Review code using the LLM
   * @param {string} code - The code diff or content to review
   * @param {Object} context - Context about the code (file path, PR title, etc.)
   * @param {Object} checkTypes - Types of checks to perform
   * @param {string} focusSeverity - Optional: 'critical', 'warnings-suggestions', or null
   * @returns {Promise<Object>} - Review results
   */
  async reviewCode(code, context, checkTypes, focusSeverity = null) {
    const systemPrompt = this._buildSystemPrompt(checkTypes, focusSeverity);
    const userPrompt = this._buildReviewPrompt(code, context);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const result = await this.chat(messages);

    if (result.success) {
      // Parse the LLM response into structured issues with confidence scores
      const issues = this._parseReviewResponse(result.content, context);
      return {
        success: true,
        issues: issues,
        rawResponse: result.content
      };
    } else {
      return result;
    }
  }

  /**
   * Build system prompt based on check types and custom prompt
   */
  _buildSystemPrompt(checkTypes, focusSeverity = null) {
    // Use custom prompt if provided
    if (this.settings.customSystemPrompt) {
      return this.settings.customSystemPrompt;
    }

    let prompt = 'You are a senior software engineer conducting a code review. ';
    prompt += 'Your task is to analyze code changes and identify issues.\n\n';

    // Focus on specific severity if in multi-pass mode
    if (focusSeverity === 'critical') {
      prompt += '**PASS 1 - CRITICAL ISSUES ONLY:**\n';
      prompt += 'Focus ONLY on critical issues: security vulnerabilities, breaking changes, bugs that will cause failures, regressions.\n';
      prompt += 'Ignore warnings and suggestions in this pass.\n\n';
    } else if (focusSeverity === 'warnings-suggestions') {
      prompt += '**PASS 2 - WARNINGS AND SUGGESTIONS:**\n';
      prompt += 'Focus on warnings and suggestions. Critical issues should have been found in Pass 1.\n';
      prompt += 'Look for: code quality issues, performance improvements, style violations, best practices.\n\n';
    }

    prompt += 'Focus on:\n';
    const checks = [];
    if (checkTypes.bugs) checks.push('- Bugs or logic errors');
    if (checkTypes.security) checks.push('- Security vulnerabilities');
    if (checkTypes.performance) checks.push('- Performance issues');
    if (checkTypes.style) checks.push('- Code style violations');
    if (checkTypes.errorHandling) checks.push('- Missing error handling');

    prompt += checks.join('\n');
    prompt += '\n\nFor each issue found, provide:\n';
    prompt += '1. Line number (if applicable)\n';
    prompt += '2. Severity (CRITICAL, WARNING, or SUGGESTION)\n';
    prompt += '3. A brief title\n';
    prompt += '4. Detailed description\n';
    prompt += '5. Suggested fix\n';
    prompt += '6. Confidence score (0.0 to 1.0) - how confident you are this is a real issue\n\n';
    prompt += 'Format your response as a JSON array of issues. ';
    prompt += 'If no issues are found, return an empty array: []\n\n';
    prompt += 'Example format:\n';
    prompt += '[\n';
    prompt += '  {\n';
    prompt += '    "line": 42,\n';
    prompt += '    "severity": "WARNING",\n';
    prompt += '    "title": "Potential null pointer",\n';
    prompt += '    "description": "Variable may be null when accessed",\n';
    prompt += '    "suggestion": "Add null check before accessing",\n';
    prompt += '    "confidence": 0.85\n';
    prompt += '  }\n';
    prompt += ']\n';

    return prompt;
  }

  /**
   * Build review prompt with enhanced context
   */
  _buildReviewPrompt(code, context) {
    let prompt = 'Review the following code change:\n\n';

    if (context.prTitle) {
      prompt += `**PR Title:** ${context.prTitle}\n`;
    }

    if (context.prDescription) {
      prompt += `**PR Description:** ${context.prDescription}\n\n`;
    }

    if (context.filePath) {
      prompt += `**File:** ${context.filePath}\n`;
    }

    if (context.fileStats) {
      prompt += `**File Statistics:** +${context.fileStats.additions} / -${context.fileStats.deletions} (${context.fileStats.changes} total changes)\n`;
    }

    if (context.commitMessages) {
      prompt += `\n**Related Commits:**\n${context.commitMessages}\n`;
    }

    if (context.linkedIssues && context.linkedIssues.length > 0) {
      prompt += `\n**Linked Issues:** ${context.linkedIssues.join(', ')}\n`;
    }

    prompt += '\n**Code Changes:**\n```diff\n';
    prompt += code;
    prompt += '\n```\n\n';
    prompt += 'Analyze this code and provide your review as a JSON array of issues with confidence scores.';

    return prompt;
  }

  /**
   * Parse LLM response into structured issues
   */
  _parseReviewResponse(response, context) {
    try {
      // Try to extract JSON from the response
      let jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in response');
        return [];
      }

      const issues = JSON.parse(jsonMatch[0]);

      // Validate and enhance each issue with confidence scores
      return issues.map((issue, index) => ({
        type: 'AI Review',
        author: 'AI Code Reviewer',
        title: issue.title || `Issue ${index + 1}`,
        content: issue.description || issue.suggestion || '',
        filePath: context.filePath || 'Unknown file',
        codeContext: issue.line ? `Line ${issue.line}` : null,
        timestamp: new Date().toISOString(),
        source: 'AI Code Review',
        severity: (issue.severity || 'SUGGESTION').toLowerCase(),
        outdated: false,
        isBot: true,
        isHuman: false,
        suggestion: issue.suggestion || '',
        line: issue.line || null,
        confidence: typeof issue.confidence === 'number' ? Math.max(0, Math.min(1, issue.confidence)) : 0.7 // Default to 0.7 if not provided
      }));
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.log('Raw response:', response);
      return [];
    }
  }

  /**
   * Test connection to LLM
   */
  async testConnection() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'TEST_LLM_CONNECTION',
        endpoint: this.endpoint,
        apiKey: this.apiKey,
        modelName: this.modelName
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Make available globally for content scripts (loaded as a separate bundle)
if (typeof window !== 'undefined') {
  (window as any).LLMClient = LLMClient;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LLMClient;
}
