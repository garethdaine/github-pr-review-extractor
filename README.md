# GitHub PR Bot Extractor

A Chrome extension that extracts Copilot and Bugbot issues/suggestions from GitHub Pull Request pages and copies them to your clipboard with full context.

## Features

- 🤖 Detects **Cursor Bugbot** notes and summaries
- 🤖 Extracts **GitHub Copilot** suggestions
- 📝 Captures bot-edited comments
- 🔍 Finds bot review comments
- 📋 Formats everything nicely and copies to clipboard
- ⚡ Simple one-click operation

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `github-pr-bot-extractor` directory

### Adding Icons

The extension expects three icon files. A simple SVG template is provided in `icons/icon.svg`.

To create the required PNG icons:
1. Open `icons/icon.svg` in a browser or image editor
2. Export/screenshot it as PNG at these sizes:
   - Save as `icon16.png` (16x16px)
   - Save as `icon48.png` (48x48px)  
   - Save as `icon128.png` (128x128px)
3. Place all three files in the `icons/` directory

Alternatively, you can use any 128x128 PNG image you like - just resize it to create the smaller versions.

## Usage

1. Navigate to any GitHub Pull Request page
2. Click the extension icon in your browser toolbar
3. Click "Extract Bot Issues" button
4. The extracted content will be copied to your clipboard
5. Paste anywhere you need it!

## What Gets Extracted

The extension looks for:

1. **GitHub Copilot AI Comments**: Review comments from Copilot AI
   - Includes file path, line numbers, code context
   - Extracts titles, descriptions, and code suggestions
   - Captures timestamp information

2. **Cursor Bot Reviews**: Comments from cursor[bot]
   - Full review context with file paths
   - Code diff context showing affected lines
   - Issue descriptions and suggestions

3. **BugBot Suggestions**: Alternative bot comment structures
   - Review comments from various bot sources
   - File-level context when available

## Output Format

The clipboard content is formatted as Markdown:

```markdown
# Bot Issues/Suggestions for: [PR Title]
PR: [PR URL]
Extracted: [Timestamp]
Total items: [Count]

---

## 1. [Issue Title]

**Type:** [Bot Type]
**Source:** [Source Type]
**File:** [File path]
**Date:** [Comment timestamp]
**Commit:** [Commit Hash if available]

**Issue Description:**
[Full issue description with suggestions]

**Code Context:**
```
[Line numbers and code that the comment refers to]
```

---
```

## Permissions

The extension requires:
- `activeTab`: To read the current GitHub PR page
- `clipboardWrite`: To copy extracted content to clipboard
- `https://github.com/*`: To run only on GitHub pages

## Development

### File Structure

```
github-pr-bot-extractor/
├── manifest.json       # Extension configuration
├── content.js          # Content script that extracts bot issues
├── popup.html          # Popup UI
├── popup.js            # Popup logic and clipboard handling
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
└── README.md           # This file
```

### How It Works

1. **Content Script** (`content.js`): Runs on GitHub PR pages and contains the extraction logic
   - Searches DOM for bot-generated content using specific selectors
   - Extracts text while preserving context and structure
   - Formats the data into a structured object

2. **Popup** (`popup.html` + `popup.js`): Provides the user interface
   - Shows a simple button to trigger extraction
   - Communicates with content script via Chrome messaging API
   - Handles clipboard copying
   - Displays success/error status

### Customization

You can modify the extraction patterns in `content.js`:
- Add new bot types to detect
- Customize the output format in `formatIssuesForClipboard()`
- Add additional context extraction (like file names, line numbers, etc.)

## Troubleshooting

**"Please navigate to a GitHub Pull Request page"**
- Make sure you're on a URL matching `https://github.com/*/pull/*`

**No issues found**
- The PR may not have any bot-generated content
- The bots may use different HTML structures than currently detected
- Check the browser console for any errors

**Copy to clipboard fails**
- Some browsers require explicit clipboard permissions
- Try clicking the extension icon again

## Future Enhancements

- [ ] Add support for more bot types
- [ ] Allow custom extraction patterns
- [ ] Export to different formats (JSON, CSV)
- [ ] Batch extraction from multiple PRs
- [ ] Filtering options

## License

MIT License - feel free to modify and use as needed!
