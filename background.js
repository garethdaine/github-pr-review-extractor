// Background service worker for GitHub PR Review Extractor
// Handles LLM API calls and cross-origin requests

// Import error handler utilities (inline for service worker)
// Note: In a real implementation, error-handler.js would be imported via importScripts
// For now, we'll add retry logic directly

console.log('GitHub PR Review Extractor background service worker loaded');

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
async function handleTestConnection(request, sendResponse) {
  try {
    const { endpoint, apiKey, modelName } = request;

    console.log(`Testing connection to ${endpoint}`);

    // Make a simple test request
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'user', content: 'Hello, are you working?' }
        ],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Connection test successful:', data);
      sendResponse({
        success: true,
        model: data.model || modelName
      });
    } else {
      const errorText = await response.text();
      console.error('Connection test failed:', response.status, errorText);
      sendResponse({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      });
    }
  } catch (error) {
    console.error('Connection test error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors or auth errors
      if (error.message?.includes('401') || error.message?.includes('403') ||
          error.message?.includes('404') || error.message?.includes('422')) {
        throw error;
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
async function handleLLMCall(request, sendResponse) {
  try {
    const { endpoint, apiKey, modelName, messages, maxTokens, temperature } = request;

    console.log(`Calling LLM at ${endpoint} with model ${modelName}`);

    const response = await retryWithBackoff(async () => {
      return await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          max_tokens: maxTokens || 1000,
          temperature: temperature || 0.2
        }),
        signal: AbortSignal.timeout(120000) // 2 minute timeout
      });
    });

    if (response.ok) {
      const data = await response.json();
      console.log('LLM call successful');
      sendResponse({
        success: true,
        data: data
      });
    } else {
      const errorText = await response.text();
      console.error('LLM call failed:', response.status, errorText);
      sendResponse({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      });
    }
  } catch (error) {
    console.error('LLM call error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Fetch PR data from GitHub API
async function handleFetchPRData(request, sendResponse) {
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

    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    // Add auth token if provided
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    // Fetch PR details
    const prResponse = await fetch(`${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: headers
    });

    if (!prResponse.ok) {
      throw new Error(`GitHub API error: ${prResponse.status} ${prResponse.statusText}`);
    }

    const prData = await prResponse.json();

    // Fetch PR files
    const filesResponse = await fetch(`${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
      headers: headers
    });

    if (!filesResponse.ok) {
      throw new Error(`GitHub API error: ${filesResponse.status} ${filesResponse.statusText}`);
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
      error: error.message
    });
  }
}

// Get settings from storage
async function handleGetSettings(sendResponse) {
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
      error: error.message
    });
  }
}

// Post review comments to GitHub
async function handlePostGitHubReview(request, sendResponse) {
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

    // GitHub API endpoint for creating a review
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;

    // Format comments for GitHub API
    // Try to get better line numbers by extracting from code context or using a default
    const reviewComments = comments.map(comment => {
      let line = comment.line;

      // If no line number, try to extract from code context
      if (!line && comment.codeContext) {
        const lines = comment.codeContext.split('\n');
        // Use middle line of context as default
        line = Math.floor(lines.length / 2);
      }

      // Default to line 1 if still no line number
      if (!line || line < 1) {
        line = 1;
      }

      return {
        path: comment.filePath,
        body: `**${comment.title}** (${comment.severity?.toUpperCase() || 'SUGGESTION'})\n\n${comment.content || ''}\n\n${comment.suggestion ? '**Suggestion:** ' + comment.suggestion : ''}\n\n---\n*Generated by AI Code Review*`,
        line: line,
        side: 'RIGHT' // Always comment on the new code in the PR
      };
    });

    const body = {
      body: `## 🤖 AI Code Review\n\nGenerated ${comments.length} review comment${comments.length !== 1 ? 's' : ''}.`,
      event: asDraft ? 'PENDING' : 'COMMENT', // PENDING creates a draft review
      comments: reviewComments
    };

    const response = await retryWithBackoff(async () => {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Posted review successfully${asDraft ? ' as draft' : ''}:`, data);
      sendResponse({
        success: true,
        reviewId: data.id,
        commentsPosted: comments.length,
        isDraft: asDraft
      });
    } else {
      const errorText = await response.text();
      console.error('Failed to post review:', response.status, errorText);

      // Provide more helpful error messages
      let errorMessage = `GitHub API error: ${response.status}`;
      if (response.status === 422) {
        errorMessage += ' - Invalid comment format. Some comments may be missing required fields (file path, line number).';
      } else if (response.status === 403) {
        errorMessage += ' - Forbidden. Check that your token has repo scope and you have write access to the repository.';
      } else if (response.status === 401) {
        errorMessage += ' - Unauthorized. Your GitHub token may be invalid or expired.';
      }
      errorMessage += ` Details: ${errorText.substring(0, 200)}`;

      sendResponse({
        success: false,
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('Post GitHub review error:', error);
    sendResponse({
      success: false,
      error: error.message
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
