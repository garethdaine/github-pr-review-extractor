# Update Summary - Version 2.1.0

> Archived: historical notes for v2.x. The current codebase is TypeScript-based (v4.x). See `README.md` for current behavior.

## Changes Made

### ✅ Outdated Issue Detection
- The extension now detects when GitHub review comments are marked as "Outdated" or "Resolved"
- Detection works by checking for:
  - `data-resolved="true"` attribute on review threads
  - "Outdated" label in the comment UI
  - `span[title="Label: Outdated"]` elements

### ✅ Filter UI
- Added a new "Filters" section in the popup
- Checkbox to "Exclude outdated issues"
- Shows statistics: "X of Y issues are outdated"
- When all issues are outdated, displays helpful message

### ✅ Issue Tracking
- Each extracted issue now includes an `outdated: boolean` property
- Outdated issues are visually marked with "(Outdated)" label in:
  - The issue list preview
  - The exported markdown (with strikethrough: ~~(Outdated)~~)

### ✅ Smart Filtering
- `filterIssues()` function filters issues based on criteria
- Works across all export formats:
  - Grouped format
  - Summary format  
  - JSON export
  - No-instructions format
- Shows accurate counts in the summary header

### ✅ Enhanced Output
- Export headers now show:
  - "Total Issues: X (Y outdated excluded, Z total)" when filtering
  - Severity breakdown (Critical/Warning/Suggestion)
- Instructions section notes when outdated issues are excluded

## Files Modified

1. **content.js**
   - Added `isOutdated` detection logic
   - Added `outdated` property to issue objects
   - Created `filterIssues()` function
   - Updated `formatIssuesGroupedByFile()` to handle filters
   - Modified message listener to accept `filterOptions`

2. **popup.html**
   - Added filter section with checkbox
   - Added filter stats display area

3. **popup.js**
   - Added `updateFilterStats()` function
   - Implemented checkbox change handler
   - Updated extraction calls to pass `filterOptions`
   - Modified `renderIssuesList()` to filter display
   - Enhanced status messages for outdated issues

4. **manifest.json**
   - Updated version to 2.1.0
   - Updated description

5. **README.md**
   - Added feature documentation
   - Updated usage instructions
   - Added changelog section

## Testing Recommendations

1. **Test on PR with outdated comments:**
   - Extract with filter OFF → should show all issues
   - Check filter ON → should exclude outdated issues
   - Verify counts are accurate

2. **Test on PR with no outdated comments:**
   - Should show "No outdated issues found"
   - Filter checkbox should work but not change results

3. **Test all export formats:**
   - Grouped
   - Summary
   - JSON
   - No Instructions
   - Verify filter works for all formats

4. **Edge cases:**
   - PR with all issues outdated
   - PR with no issues
   - Mixed (some outdated, some current)

## How to Reload Extension

1. Go to `chrome://extensions/`
2. Find "GitHub PR Bot Extractor"
3. Click the refresh icon 🔄
4. Navigate to a GitHub PR page
5. Test the new filter functionality

## Example Output

When extracting with "Exclude outdated issues" checked:

```markdown
# Code Review Issues - Feature/crm

**PR:** https://github.com/treeviewdesigns/core-ui/pull/117
**Extracted:** 02/01/2026, 11:19:00
**Total Issues:** 7 (3 outdated excluded, 10 total)
🔴 2 Critical, 🟡 2 Warnings, 🔵 3 Suggestions

---

## 📁 `app/components/users/AddModal.vue`

1 issue found

### 🔵 Copilot Suggestion

**Severity:** SUGGESTION

**💡 Suggestion:**
The code uses a helper function resolveUlid elsewhere...
```

Issues marked as outdated but not filtered will show:
```markdown
### 🔴 Copilot Suggestion ~~(Outdated)~~
```
