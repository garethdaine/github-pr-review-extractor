// Analytics dashboard for GitHub PR Review Extractor

const HISTORY_STORAGE_KEY = 'reviewHistory';

async function loadAnalytics() {
  try {
    const getReviewHistory = window.reviewHistory?.getReviewHistory || async () => {
      const result = await chrome.storage.local.get(['reviewHistory']);
      return result.reviewHistory || [];
    };
    const history = await getReviewHistory();

    if (!history || history.length === 0) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('noData').style.display = 'block';
      return;
    }

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    // Calculate statistics
    const stats = calculateStats(history);
    displayStats(stats);

    // Create charts
    createSeverityChart(history);
    createAuthorChart(history);
    createFilesChart(history);
    createFrequencyChart(history);
    createAvgIssuesChart(history);
  } catch (error) {
    console.error('Failed to load analytics:', error);
    document.getElementById('loading').textContent = 'Error loading analytics';
  }
}

function calculateStats(history) {
  let totalReviews = history.length;
  let totalIssues = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let suggestionCount = 0;
  let botCount = 0;
  let humanCount = 0;
  let copilotCount = 0;
  let cursorCount = 0;
  const fileMap = {};
  const dateMap = {};

  history.forEach(entry => {
    const allIssues = [...(entry.extractedIssues || []), ...(entry.aiGeneratedIssues || [])];
    totalIssues += allIssues.length;

    allIssues.forEach(issue => {
      // Severity counts
      if (issue.severity === 'critical') criticalCount++;
      else if (issue.severity === 'warning') warningCount++;
      else if (issue.severity === 'suggestion') suggestionCount++;

      // Author type counts
      if (issue.isBot) {
        botCount++;
        if (issue.type === 'GitHub Copilot AI') copilotCount++;
        else if (issue.type === 'Cursor Bot') cursorCount++;
      } else if (issue.isHuman) {
        humanCount++;
      }

      // File counts
      const file = issue.filePath || 'Unknown';
      fileMap[file] = (fileMap[file] || 0) + 1;

      // Date tracking
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });
  });

  const avgIssuesPerPR = totalReviews > 0 ? (totalIssues / totalReviews).toFixed(1) : 0;

  return {
    totalReviews,
    totalIssues,
    criticalCount,
    warningCount,
    suggestionCount,
    botCount,
    humanCount,
    copilotCount,
    cursorCount,
    fileMap,
    dateMap,
    avgIssuesPerPR
  };
}

function displayStats(stats) {
  const statsGrid = document.getElementById('statsGrid');
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalReviews}</div>
      <div class="stat-label">Total Reviews</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalIssues}</div>
      <div class="stat-label">Total Issues</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avgIssuesPerPR}</div>
      <div class="stat-label">Avg Issues per PR</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.criticalCount}</div>
      <div class="stat-label">Critical Issues</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.warningCount}</div>
      <div class="stat-label">Warnings</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.suggestionCount}</div>
      <div class="stat-label">Suggestions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.botCount}</div>
      <div class="stat-label">Bot Comments</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.humanCount}</div>
      <div class="stat-label">Human Comments</div>
    </div>
  `;
}

function createSeverityChart(history) {
  const ctx = document.getElementById('severityChart').getContext('2d');

  // Group by date and severity
  const dataMap = {};
  history.forEach(entry => {
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!dataMap[date]) {
      dataMap[date] = { critical: 0, warning: 0, suggestion: 0 };
    }

    const allIssues = [...(entry.extractedIssues || []), ...(entry.aiGeneratedIssues || [])];
    allIssues.forEach(issue => {
      const severity = issue.severity || 'suggestion';
      if (dataMap[date][severity] !== undefined) {
        dataMap[date][severity]++;
      }
    });
  });

  const dates = Object.keys(dataMap).sort();
  const criticalData = dates.map(d => dataMap[d].critical);
  const warningData = dates.map(d => dataMap[d].warning);
  const suggestionData = dates.map(d => dataMap[d].suggestion);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Critical',
          data: criticalData,
          borderColor: '#f85149',
          backgroundColor: 'rgba(248, 81, 73, 0.1)',
          tension: 0.1
        },
        {
          label: 'Warning',
          data: warningData,
          borderColor: '#d29922',
          backgroundColor: 'rgba(210, 153, 34, 0.1)',
          tension: 0.1
        },
        {
          label: 'Suggestion',
          data: suggestionData,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.1)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function createAuthorChart(history) {
  const ctx = document.getElementById('authorChart').getContext('2d');
  const stats = calculateStats(history);

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Human Reviewers', 'GitHub Copilot', 'Cursor Bot', 'Other Bots'],
      datasets: [{
        data: [
          stats.humanCount,
          stats.copilotCount,
          stats.cursorCount,
          stats.botCount - stats.copilotCount - stats.cursorCount
        ],
        backgroundColor: [
          '#58a6ff',
          '#238636',
          '#8957e5',
          '#8b949e'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        }
      }
    }
  });
}

function createFilesChart(history) {
  const ctx = document.getElementById('filesChart').getContext('2d');
  const stats = calculateStats(history);

  // Get top 10 files
  const fileEntries = Object.entries(stats.fileMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = fileEntries.map(([file]) => file.split('/').pop() || file);
  const data = fileEntries.map(([, count]) => count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Issues',
        data: data,
        backgroundColor: '#58a6ff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function createFrequencyChart(history) {
  const ctx = document.getElementById('frequencyChart').getContext('2d');

  // Get last 30 days
  const last30Days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last30Days.push(date.toISOString().split('T')[0]);
  }

  const reviewCounts = last30Days.map(date => {
    return history.filter(entry => {
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
      return entryDate === date;
    }).length;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last30Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Reviews',
        data: reviewCounts,
        backgroundColor: '#238636'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function createAvgIssuesChart(history) {
  const ctx = document.getElementById('avgIssuesChart').getContext('2d');

  // Calculate average issues per PR over time (rolling average)
  const dates = history.map(entry => new Date(entry.timestamp).toISOString().split('T')[0]);
  const issueCounts = history.map(entry =>
    (entry.extractedIssues?.length || 0) + (entry.aiGeneratedIssues?.length || 0)
  );

  // Calculate rolling average (last 5 reviews)
  const rollingAvg = [];
  for (let i = 0; i < issueCounts.length; i++) {
    const window = issueCounts.slice(Math.max(0, i - 4), i + 1);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    rollingAvg.push(avg.toFixed(1));
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map((d, i) => `Review ${i + 1}`),
      datasets: [
        {
          label: 'Issues per PR',
          data: issueCounts,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.1)',
          tension: 0.1
        },
        {
          label: 'Rolling Average (5 reviews)',
          data: rollingAvg,
          borderColor: '#238636',
          backgroundColor: 'rgba(35, 134, 54, 0.1)',
          borderDash: [5, 5],
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Load analytics when page loads
document.addEventListener('DOMContentLoaded', loadAnalytics);

