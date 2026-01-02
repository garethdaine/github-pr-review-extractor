# Contributing to GitHub PR Review Extractor

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Project Structure](#project-structure)
- [Adding New Features](#adding-new-features)

## Code of Conduct

### Our Standards

- **Be respectful** and considerate of others
- **Be collaborative** and open to feedback
- **Focus on what is best** for the community
- **Show empathy** towards other community members

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling, insulting, or derogatory comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Google Chrome (latest version)
- Basic knowledge of JavaScript, HTML, and CSS
- Familiarity with Chrome Extension APIs
- Understanding of GitHub's UI structure (helpful but not required)

### Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/github-pr-bot-extractor.git
   cd github-pr-bot-extractor
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Load the extension** in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

## Development Setup

### Project Structure

```
github-pr-bot-extractor/
├── manifest.json       # Extension configuration & permissions
├── content.js          # Main extraction logic (runs on GitHub pages)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic & event handlers
├── icons/              # Extension icons
└── docs/               # Documentation
```

### Key Files

#### `content.js`
- Runs on GitHub PR pages
- Extracts review comments from DOM
- Identifies comment authors and types
- Classifies severity
- Detects outdated/resolved status

**Key functions:**
- `extractBotIssues()` - Main extraction logic
- `getSeverityInfo()` - Severity classification
- `formatIssuesGroupedByFile()` - Output formatting

#### `popup.js`
- Handles user interactions
- Manages filters and export formats
- Communicates with content script
- Handles clipboard operations

**Key functions:**
- `extractedIssues` - Stores extracted data
- `updateFilterStats()` - Updates filter statistics
- `renderIssuesList()` - Displays issues in popup

## Making Changes

### Branch Naming

- `feature/` - New features (e.g., `feature/filter-by-author`)
- `fix/` - Bug fixes (e.g., `fix/cursor-bot-detection`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-function`)

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(extraction): add support for new bot types

Add detection logic for additional GitHub bot integrations
including Dependabot and GitHub Actions bot.

Closes #123
```

```
fix(popup): correct outdated count calculation

The outdated count was including filtered items.
Now correctly counts from the original unfiltered list.

Fixes #456
```

## Testing

### Manual Testing Checklist

Before submitting, test your changes with:

1. **Different PR types:**
   - [ ] PR with only bot comments
   - [ ] PR with only human comments
   - [ ] PR with mixed comments
   - [ ] PR with no comments
   - [ ] PR with outdated comments

2. **Different bot types:**
   - [ ] GitHub Copilot comments
   - [ ] Cursor bot comments
   - [ ] Other bots (Dependabot, etc.)

3. **Filter functionality:**
   - [ ] Exclude outdated filter works
   - [ ] Filter stats are accurate
   - [ ] Filter persists correctly

4. **Export formats:**
   - [ ] Grouped format
   - [ ] Summary format
   - [ ] JSON format
   - [ ] No-instructions format
   - [ ] Individual copy buttons

5. **Edge cases:**
   - [ ] Very long PR (100+ comments)
   - [ ] Comments with special characters
   - [ ] Comments with code blocks
   - [ ] Nested comment threads

### Testing on Real PRs

Test on various public PRs to ensure compatibility:
- Open source projects with active reviews
- PRs with Copilot/bot suggestions
- Different organizations/repos

### Browser Console

Check for errors:
1. Open DevTools (F12)
2. Check Console tab for errors
3. Test all functionality
4. Verify no warnings or errors appear

## Submitting Changes

### Pull Request Process

1. **Update documentation** if needed
2. **Test thoroughly** using the checklist above
3. **Update CHANGELOG** if applicable
4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create Pull Request** on GitHub
6. **Fill out the PR template** completely
7. **Link related issues** using keywords (Closes #123, Fixes #456)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on multiple PRs
- [ ] Tested different bot types
- [ ] Tested all export formats
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots showing the changes

## Checklist
- [ ] Code follows project style
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No breaking changes (or documented)
```

### Review Process

- Maintainers will review your PR
- Address feedback and requested changes
- Once approved, maintainers will merge
- Your contribution will be credited in release notes!

## Code Style

### JavaScript

- **Use ES6+ features** (const/let, arrow functions, template literals)
- **Semicolons**: Use them
- **Quotes**: Single quotes for strings
- **Indentation**: 2 spaces
- **Line length**: Max 100 characters (soft limit)

**Example:**
```javascript
// Good
const extractIssues = () => {
  const issues = [];
  reviewThreads.forEach((thread) => {
    const author = thread.querySelector('a').textContent;
    issues.push({ author });
  });
  return issues;
};

// Avoid
var extractIssues = function() {
  var issues = []
  for (var i = 0; i < reviewThreads.length; i++) {
    var author = reviewThreads[i].querySelector("a").textContent
    issues.push({author: author})
  }
  return issues
}
```

### Naming Conventions

- **Variables/Functions**: camelCase (`extractIssues`, `authorType`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`MAX_ISSUES`)
- **Classes**: PascalCase (if used)
- **Private functions**: Prefix with `_` if applicable

### Comments

- Write **clear, concise** comments
- Explain **WHY**, not WHAT
- Comment **complex logic** and edge cases
- Use JSDoc for functions when helpful

**Example:**
```javascript
// Good - explains reasoning
// GitHub sometimes nests labels as siblings instead of children
// so we check both locations
const labelSpan = strong.querySelector('.Label') || 
                  link.parentElement?.querySelector('.Label');

// Bad - just repeats the code
// Get the label span
const labelSpan = strong.querySelector('.Label');
```

## Project Structure

### Adding New Features

#### 1. Extend Comment Detection

To add support for a new bot type:

```javascript
// In content.js, around line 63
const isNewBot = authorTextLower.includes('newbot') || 
                 labelText.includes('newbot');

// Add to the type assignment logic
if (isNewBot) {
  commentType = 'New Bot Name';
  authorType = 'NewBot';
  source = 'Bot Code Review';
}
```

#### 2. Add New Filter Options

To add a new filter:

1. **Add checkbox in `popup.html`:**
```html
<input type="checkbox" id="yourFilter" style="margin-right: 8px;">
Your Filter Label
```

2. **Read filter in `popup.js`:**
```javascript
const yourFilter = document.getElementById('yourFilter')?.checked || false;
const filterOptions = { excludeOutdated, yourFilter };
```

3. **Apply filter in `content.js`:**
```javascript
function filterIssues(issues, options = {}) {
  let filtered = [...issues];
  
  if (options.yourFilter) {
    filtered = filtered.filter(issue => /* your logic */);
  }
  
  return filtered;
}
```

#### 3. Add New Export Format

To add a new export format:

1. **Add button in `popup.html`:**
```html
<button class="secondary small" id="copyNewFormat">📋 New Format</button>
```

2. **Add event handler in `popup.js`:**
```javascript
document.getElementById('copyNewFormat').addEventListener('click', async () => {
  await copyFormat('new-format', 'New format copied!');
});
```

3. **Add formatter in `content.js`:**
```javascript
function formatIssuesNewFormat(issues) {
  // Your formatting logic
  return formattedOutput;
}

// Add case in message listener
case 'new-format':
  formattedText = formatIssuesNewFormat(filteredIssues);
  break;
```

### Working with GitHub's DOM

GitHub's DOM structure can change. When working with selectors:

- **Use specific classes** that are less likely to change
- **Fallback to alternatives** when possible
- **Test thoroughly** on real PRs
- **Comment your selectors** explaining what they target

**Example:**
```javascript
// Target review threads - these classes are stable
const reviewThreads = document.querySelectorAll('.review-thread-component');

// Author link might be in different structures
const authorLink = authorStrong.querySelector('a') ||
                   authorStrong.querySelector('[href^="/"]');
```

## Questions?

- **Check existing issues** for similar questions
- **Open a discussion** for general questions
- **Open an issue** for bugs or feature requests
- **Email maintainers** for private concerns

## Recognition

Contributors will be:
- Listed in release notes
- Credited in the AUTHORS file (if created)
- Mentioned in significant feature announcements

Thank you for contributing! 🎉
