# Testing Guide - Outdated Issue Filter

## Quick Test Steps

### 1. Load the Extension
```bash
# Navigate to Chrome extensions page
chrome://extensions/

# Enable Developer Mode (top right)
# Click "Load unpacked"
# Select: /Users/garethdaine/Code/github-pr-bot-extractor
```

### 2. Test on the Example PR
The PR you showed has both outdated and current issues:
- **URL:** https://github.com/treeviewdesigns/core-ui/pull/117

**Expected Results:**
- Total issues: 10
- Outdated issues: 3 (based on the HTML you provided)
- Current issues: 7

### 3. Test Scenarios

#### Scenario A: Extract All Issues (Filter OFF)
1. Navigate to the PR
2. Click extension icon
3. Click "Extract All Issues"
4. **Expected:**
   - Status: "✓ Found 10 issues!"
   - Filter stats: "3 of 10 issues are outdated"
   - Issue list shows all 10 issues
   - Outdated issues marked with "(Outdated)" label

#### Scenario B: Exclude Outdated Issues (Filter ON)
1. Check "Exclude outdated issues"
2. Click "Extract All Issues" again
3. **Expected:**
   - Status: "✓ Found 7 issues!"
   - Filter stats: "3 of 10 issues are outdated"
   - Issue list shows only 7 current issues
   - Exported text header: "Total Issues: 7 (3 outdated excluded, 10 total)"

#### Scenario C: Toggle Filter
1. Uncheck "Exclude outdated issues"
2. Check it again
3. **Expected:**
   - Re-extraction happens automatically
   - Counts update correctly
   - Issue list refreshes

### 4. Verify Export Formats

Test each format button with filter ON:

#### 📁 Grouped Format
```markdown
**Total Issues:** 7 (3 outdated excluded, 10 total)
🔴 X Critical, 🟡 X Warnings, 🔵 X Suggestions

## Instructions for Cursor AI

**Note:** 3 outdated issues have been excluded from this report.
```

#### 📋 Summary Format
Should only list the 7 current issues, grouped by file.

#### { } JSON Format
```json
{
  "summary": {
    "total": 7,
    "critical": X,
    "warning": X,
    "suggestion": X
  },
  "issues": [
    // Only 7 issues, no outdated ones
  ]
}
```

### 5. Edge Case Tests

#### Test A: All Issues Outdated
If you find a PR where all bot issues are outdated:
- Filter OFF: Shows all issues
- Filter ON: 
  - Status: "All X issues are outdated. Uncheck the filter to see them."
  - No issues in list

#### Test B: No Outdated Issues
Find a PR with only current issues:
- Filter stats: "No outdated issues found"
- Filter checkbox has no effect on count

#### Test C: No Bot Issues
Navigate to a PR with no bot comments:
- Status: "No bot issues found on this PR."
- Filter section should not appear

### 6. Visual Verification Checklist

✅ Outdated issues show "(Outdated)" in gray text in the issue list  
✅ Filter section appears after first extraction  
✅ Stats update correctly showing "X of Y issues are outdated"  
✅ Re-clicking Extract button respects current filter state  
✅ Checkbox changes trigger automatic re-extraction  
✅ All format buttons respect the filter setting  
✅ Individual "Copy" buttons work for filtered issues  

### 7. Console Testing (Optional)

Open browser DevTools Console and check for:
- No JavaScript errors
- Clean extraction messages
- Proper filter application

### 8. Known Good Test Data

From your example PR, these issues should be **outdated**:
1. HubTree.vue - Line 212-213 (Copilot Suggestion about toggle logic)
2. HubTree.vue - Line 243-248 (Copilot Suggestion about indeterminate state)
3. (Third outdated issue - check PR for details)

These should be **current** (7 total):
1. HubTree.vue - Parent node state inconsistent (Warning)
2. useConfirmDialog.ts - requestId counter (Warning)
3. useTicketCategories.ts - Inconsistent identifier (Warning)
4. AddModal.vue - resolveUlid helper (Suggestion)
5. RichTextEditor.vue - modelValue breaking change (Critical)
6. ServiceTimeline.vue - Label fallback (Suggestion)
7. ContextTreeNode.vue - Tailwind opacity (Suggestion)

## Troubleshooting

**Filter doesn't seem to work:**
- Check browser console for errors
- Reload extension: chrome://extensions/ → Click refresh icon
- Hard refresh the PR page: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Counts seem wrong:**
- Verify the HTML structure matches what we expect
- Check if GitHub has changed their UI
- Look for `data-resolved="true"` or `<span title="Label: Outdated">` in page source

**Issues not detected:**
- Make sure you're on a PR page (not Issues page)
- Ensure there are actually bot comments (Copilot/Cursor) on the PR
- Try refreshing the page and re-extracting
