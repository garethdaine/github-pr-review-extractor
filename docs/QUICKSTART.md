# Quick Start Guide

## Setup (5 minutes)

### Step 1: Create Icons
Before loading the extension, you need to create icon files:

1. Navigate to the `icons/` folder
2. Follow the instructions in `icons/CREATE_ICONS.md`
3. Create three PNG files: `icon16.png`, `icon48.png`, and `icon128.png`

**Quick shortcut:** Use any emoji or simple image as a placeholder. Just make sure you have all three sizes!

### Step 2: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `github-pr-bot-extractor` folder
5. The extension icon should appear in your toolbar

## Usage

### Extracting Bot Comments

1. **Navigate to a GitHub PR** (e.g., `https://github.com/user/repo/pull/123`)
2. **Click the extension icon** in your Chrome toolbar (looks like 🤖)
3. **Click "Extract Bot Issues"** button
4. **Success!** The bot comments are now copied to your clipboard

### What Gets Copied

The extension extracts:
- 🤖 **Copilot AI suggestions** with file paths and code context
- 🤖 **Cursor Bot reviews** with detailed line-by-line feedback
- 🐛 **BugBot comments** with issue descriptions

### Example Output

```markdown
# Bot Issues/Suggestions for: Add new feature
PR: https://github.com/user/repo/pull/123
Extracted: 1/2/2026, 10:55:00 AM
Total items: 2

---

## 1. Missing disabled attribute on hub item buttons

**Type:** GitHub Copilot AI
**Source:** Copilot Code Review
**File:** app/components/ContextSwitcher.vue
**Date:** 1/2/2026, 10:41:42 AM

**Issue Description:**
The `:disabled="item.disabled"` attribute was removed from hub item 
buttons during attribute reordering. While `handleItemSelect` checks 
`item.disabled` in JavaScript to prevent selection, the missing native 
`disabled` attribute means disabled buttons remain in the keyboard tab 
order and screen readers won't announce them as disabled.

**Code Context:**
```
393:             :data-last="
394:               !hubItems[idx + 1] ||
395:               (hubItems[idx + 1].depth ?? 0) < (item.depth ?? 0)
396:             "
```

---
```

### Using in Cursor AI

1. **Copy the output** (happens automatically when you click the button)
2. **Open Cursor AI IDE**
3. **Paste into Cursor's chat** (Cmd+V / Ctrl+V)
4. **Add your instruction**, e.g.:
   - "Please fix all these issues"
   - "Implement the suggestions from Copilot"
   - "Review these bot findings and apply appropriate fixes"

## Troubleshooting

### "Please navigate to a GitHub Pull Request page"
- Make sure you're on a URL like `https://github.com/*/pull/*`
- The extension only works on GitHub PR pages

### "No bot issues found"
- The PR might not have any bot comments yet
- Try refreshing the page and clicking the extension again
- Check the PR's "Files changed" tab for bot review comments

### Extension not appearing
- Make sure you created the icon files in the `icons/` folder
- Check that Developer mode is enabled in `chrome://extensions/`
- Try clicking "Reload" on the extension card

### Copy to clipboard fails
- Chrome needs explicit clipboard permissions
- Try clicking the extension button again
- Check Chrome's site permissions

## Tips

- **Best results**: Use on PRs with active Copilot or Cursor bot reviews
- **Batch extraction**: Copy comments from multiple PRs and paste together
- **Context preservation**: All file paths and line numbers are included
- **Timestamps**: Know when each comment was made

## Next Steps

- Check out `README.md` for full documentation
- Customize extraction patterns in `src/core/extractor.ts`
- Report issues or suggest improvements

Happy coding! 🚀
