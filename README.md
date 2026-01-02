# GitHub PR Review Extractor

A Chrome extension that extracts **all review comments** from GitHub Pull Request pages - including bots (Copilot, Cursor, etc.) and human reviewers - and copies them to your clipboard with full context.

## Features

- 📝 **Extracts ALL review comments** - bots and humans
- 🤖 Identifies **GitHub Copilot AI** suggestions
- 🤖 Detects **Cursor Bot** and other bot comments
- 👤 Includes **human reviewer** comments
- 🏷️ Labels each comment by author and type
- 🚫 Filters out outdated/resolved comments
- 📊 Shows severity levels (Critical, Warning, Suggestion)
- 📋 Multiple export formats (Grouped, Summary, JSON)
- ⚡ Simple one-click operation

## Installation

### Option 1: Chrome Web Store (Recommended)
*Coming soon - extension will be published to Chrome Web Store*

### Option 2: From Source (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/github-pr-bot-extractor.git
   cd github-pr-bot-extractor
   ```

2. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the cloned `github-pr-bot-extractor` directory

3. You're ready! The extension icon will appear in your Chrome toolbar.

## Usage

1. **Navigate** to any GitHub Pull Request page
2. **Click** the extension icon in your browser toolbar
3. **Extract** - Click "Extract All Issues" button
4. **Review** the results:
   - See count of all comments found
   - View breakdown by author type
   - Check outdated vs current comments
5. **Filter** (optional):
   - "Exclude outdated issues" is checked by default
   - Uncheck to include resolved/outdated comments
6. **Export** in your preferred format:
   - **📁 Grouped**: Comments organized by file with instructions
   - **📋 Summary**: Quick overview by file
   - **📄 No Instructions**: Grouped format without instructions
   - **{ } JSON**: Machine-readable JSON format
7. **Copy** individual comments using the Copy button on each item
8. **Paste** anywhere you need it - content is automatically copied!

## What Gets Extracted

The extension extracts **all review comments** from a PR, including:

1. **Bot Comments**:
   - GitHub Copilot AI suggestions
   - Cursor Bot comments
   - Any other bot-generated reviews
   
2. **Human Reviewer Comments**:
   - All comments from team members
   - Code review feedback
   - Discussion threads

**For each comment, it captures:**
- Author name and type (Bot/Human)
- File path and line numbers
- Code context from diffs
- Comment content and suggestions
- Timestamp information
- Severity classification
- Outdated/resolved status

## Output Format

The default export format is Markdown, organized by file:

```markdown
# Code Review Comments - Feature/my-feature

**PR:** https://github.com/org/repo/pull/123
**Extracted:** 02/01/2026, 11:30:00
**Total Comments:** 15 (3 outdated excluded, 18 total)

**By Severity:** 🔴 2 Critical, 🟡 5 Warnings, 🔵 8 Suggestions
**By Author Type:** Human Reviewer (8), GitHub Copilot AI (5), Cursor Bot (2)

---

## 📁 `src/components/MyComponent.tsx`

3 issues found

### 🔴 Breaking API Change

**Author:** Copilot (GitHub Copilot AI)
**Severity:** CRITICAL

**Code:**
```typescript
45: export function getData(id: string) {
46:   return api.fetch(id);
47: }
```

**💡 Suggestion:**
The function signature changed from accepting an object to a string...

---

### 🟡 Consider Error Handling

**Author:** John Smith (Human Reviewer)
**Severity:** WARNING

**💡 Suggestion:**
Should we add try-catch here for better error handling?

---
```

## Privacy & Permissions

The extension requires minimal permissions:

- **`activeTab`**: Read the current GitHub PR page content
- **`clipboardWrite`**: Copy extracted comments to your clipboard
- **`https://github.com/*`**: Only runs on GitHub.com pages

**Privacy Promise:**
- ✅ All processing happens locally in your browser
- ✅ No data is sent to external servers
- ✅ No analytics or tracking
- ✅ No data storage beyond clipboard copy
- ✅ Open source - verify the code yourself!

## Architecture

### File Structure

```
github-pr-bot-extractor/
├── manifest.json           # Extension configuration
├── content.js              # Content script - extracts review comments
├── popup.html              # Popup UI structure
├── popup.js                # Popup logic and event handlers
├── icons/                  # Extension icons
│   ├── icon16.png         # 16x16 toolbar icon
│   ├── icon48.png         # 48x48 management icon
│   └── icon128.png        # 128x128 store icon
├── README.md              # This file
├── CONTRIBUTING.md        # Contribution guidelines
└── docs/                  # Additional documentation
    ├── RELEASE_NOTES_*.md
    └── TESTING_GUIDE.md
```

### How It Works

1. **Content Script** (`content.js`):
   - Runs automatically on GitHub PR pages
   - Scans DOM for review thread components
   - Identifies comment authors (bots vs humans)
   - Extracts comment content, code context, and metadata
   - Detects outdated/resolved status
   - Classifies severity based on keywords
   - Returns structured data to popup

2. **Popup Interface** (`popup.html` + `popup.js`):
   - Triggered when user clicks extension icon
   - Sends extraction request to content script
   - Displays results with filters and options
   - Handles multiple export formats
   - Manages clipboard operations
   - Shows real-time statistics

3. **Communication Flow**:
   ```
   User clicks icon → Popup opens → Sends message to content.js
   → content.js extracts comments → Returns data to popup
   → Popup formats and displays → Copies to clipboard
   ```

## Troubleshooting

### Common Issues

**"Please navigate to a GitHub Pull Request page"**
- Ensure you're on a URL matching `https://github.com/*/pull/*`
- Refresh the page and try again
- Check that the extension is enabled

**"No review comments found on this PR"**
- The PR may not have any review comments yet
- Comments might be on the "Conversation" tab instead of "Files changed"
- Try refreshing the PR page

**Copy to clipboard fails**
- Grant clipboard permissions when prompted
- Try clicking the extension icon again
- Check Chrome's site permissions for github.com

**Comments missing or incomplete**
- GitHub may have updated their HTML structure
- Check browser console (F12) for errors
- Report an issue on GitHub with details

**Outdated filter not working**
- Ensure you're on the latest version
- Try unchecking and rechecking the filter
- Reload the extension in `chrome://extensions/`

### Getting Help

- Check [existing issues](https://github.com/yourusername/github-pr-bot-extractor/issues)
- Open a new issue with:
  - Extension version
  - Chrome version
  - PR URL (if public)
  - Browser console errors
  - Screenshots if applicable

## Changelog

### Version 3.0.0 - Major Update
- 🎉 **Now extracts ALL review comments, not just bots!**
- 👤 Identifies and labels human reviewers
- 🤖 Distinguishes between different bot types (Copilot, Cursor, etc.)
- 🏷️ Shows author name and type for each comment
- 📊 Breakdown by author type in summary
- 📝 Renamed to "GitHub PR Review Extractor"

### Version 2.1.1
- ✅ Fixed Cursor bot detection for newer GitHub UI structure
- ✅ Checkbox now defaults to "Exclude outdated issues" checked

### Version 2.1.0
- ✅ Added outdated issue detection and filtering
- ✅ Shows outdated status in issue labels
- ✅ Configurable filter to exclude/include outdated issues
- ✅ Stats showing how many issues are outdated

### Version 2.0.0
- Added multiple export formats
- Severity-based classification
- Individual issue copying
- Improved UI with issue preview

## Future Enhancements

- [ ] Add support for more bot types
- [ ] Allow custom extraction patterns
- [ ] Batch extraction from multiple PRs
- [ ] Filter by severity level

## License

MIT License - feel free to modify and use as needed!
