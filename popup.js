let extractedIssues = [];

document.getElementById('extractBtn').addEventListener('click', async () => {
  const button = document.getElementById('extractBtn');
  const status = document.getElementById('status');
  
  button.disabled = true;
  button.textContent = 'Extracting...';
  
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a GitHub PR page
    if (!tab.url.includes('github.com') || !tab.url.includes('/pull/')) {
      showStatus('Please navigate to a GitHub Pull Request page.', 'error');
      button.disabled = false;
      button.textContent = 'Extract All Issues';
      return;
    }
    
    // Send message to content script to extract issues
    chrome.tabs.sendMessage(tab.id, { action: 'extractIssues', format: 'grouped' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        button.disabled = false;
        button.textContent = 'Extract All Issues';
        return;
      }
      
      if (response.success) {
        extractedIssues = response.issues || [];
        
        if (response.count === 0) {
          showStatus('No bot issues found on this PR.', 'info');
        } else {
          showStatus(`✓ Found ${response.count} issue${response.count !== 1 ? 's' : ''}!`, 'success');
          // Show format options and issues list
          document.getElementById('formatSection').style.display = 'block';
          document.getElementById('issuesSection').style.display = 'block';
          renderIssuesList(extractedIssues);
          // Auto-copy default format
          copyToClipboard(response.text, 'Grouped format copied to clipboard!');
        }
      } else {
        showStatus('Error: ' + response.error, 'error');
      }
      
      button.disabled = false;
      button.textContent = 'Extract All Issues';
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    button.disabled = false;
    button.textContent = 'Extract All Issues';
  }
});

// Format button handlers
document.getElementById('copyGrouped').addEventListener('click', async () => {
  await copyFormat('grouped', 'Grouped format copied!');
});

document.getElementById('copySummary').addEventListener('click', async () => {
  await copyFormat('summary', 'Summary copied!');
});

document.getElementById('copyNoInstructions').addEventListener('click', async () => {
  await copyFormat('no-instructions', 'Copied without instructions!');
});

document.getElementById('copyJSON').addEventListener('click', async () => {
  await copyFormat('json', 'JSON exported to clipboard!');
});

async function copyFormat(format, successMessage) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'extractIssues', format: format }, (response) => {
      if (response.success) {
        copyToClipboard(response.text, successMessage);
      } else {
        showStatus('Error: ' + response.error, 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

function renderIssuesList(issues) {
  const issuesList = document.getElementById('issuesList');
  issuesList.innerHTML = '';
  issuesList.style.display = 'block';
  
  issues.forEach((issue, index) => {
    const issueItem = document.createElement('div');
    issueItem.className = 'issue-item';
    
    const severityClass = `severity-${issue.severity}`;
    const severityEmoji = issue.severity === 'critical' ? '🔴' : 
                         issue.severity === 'warning' ? '🟡' : '🔵';
    
    issueItem.innerHTML = `
      <div class="issue-header">
        <span class="severity-badge ${severityClass}">${severityEmoji} ${issue.severity.toUpperCase()}</span>
        <button class="copy-single" data-index="${index}">Copy</button>
      </div>
      <div class="issue-title">${issue.title}</div>
      <div class="issue-file">📁 ${issue.filePath}</div>
    `;
    
    issuesList.appendChild(issueItem);
  });
  
  // Add event listeners to copy buttons
  document.querySelectorAll('.copy-single').forEach(button => {
    button.addEventListener('click', async (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      const issue = extractedIssues[index];
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { 
          action: 'formatSingleIssue', 
          issue: issue,
          index: index
        }, (response) => {
          if (response.success) {
            copyToClipboard(response.text, `Issue #${index + 1} copied!`);
          }
        });
      } catch (error) {
        showStatus('Error: ' + error.message, 'error');
      }
    });
  });
}

function copyToClipboard(text, successMessage) {
  navigator.clipboard.writeText(text).then(() => {
    showStatus(successMessage, 'success');
  }).catch(err => {
    showStatus('Failed to copy to clipboard: ' + err.message, 'error');
  });
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
  status.style.display = 'block';
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}
