# Changelog

## Version 2.0.0 - Enhanced Features

### 🎯 New Features

#### 1. **Grouping by File**
- Issues are now organized by file path
- Files are sorted by number of issues (most issues first)
- Clear file headers with issue count
- Makes it easier to fix all issues in one file at a time

#### 2. **Severity Indicators**
- 🔴 **CRITICAL** - Breaking changes, security issues, regressions
- 🟡 **WARNING** - Unsafe patterns, inconsistencies, UX degradations
- 🔵 **SUGGESTION** - General improvements and best practices
- Summary shows count of each severity level
- Instructions prioritize by severity

#### 3. **Individual Issue Copying**
- New UI panel lists all extracted issues
- Each issue has a "Copy" button
- Severity badges for quick identification
- Perfect for sharing single issues with team members

#### 4. **Multiple Output Formats**
- **📁 Grouped** (Default): Issues grouped by file with instructions
- **📋 Summary**: Minimal format, just file paths and issue titles
- **📄 No Instructions**: Full details without Cursor AI instructions
- **{ } JSON**: Structured data export for programmatic use

#### 5. **JSON Export**
- Complete structured export including:
  - PR metadata (title, URL, extraction timestamp)
  - Summary statistics by severity
  - Full issue details with all fields
- Perfect for integration with other tools

### 🎨 UI Improvements
- Wider popup (400px) for better readability
- Scrollable issue list
- Color-coded severity badges
- Format selector buttons
- Improved status messages

### 🔧 Technical Improvements
- Deduplication logic to prevent duplicate issues
- Content cleaning to remove UI noise
- Severity detection based on keywords
- Modular formatting functions
- Better error handling

### 📊 Output Format Examples

#### Grouped Format (Default)
```markdown
# Code Review Issues - Feature/crm

**Total Issues:** 9 (🔴 2 Critical, 🟡 3 Warnings, 🔵 4 Suggestions)

## 📁 `app/components/permissions/HubTree.vue`
2 issues found

### 🔴 Hierarchical selection broken
**Severity:** CRITICAL
...
```

#### Summary Format
```
app/components/permissions/HubTree.vue:
  🔴 Hierarchical selection broken
  🟡 Indeterminate state removed
app/composables/useConfirmDialog.ts:
  🟡 Unsafe requestId counter
```

#### JSON Format
```json
{
  "pr": {
    "title": "Feature/crm",
    "url": "https://github.com/...",
    "extractedAt": "2026-01-02T11:00:00.000Z"
  },
  "summary": {
    "total": 9,
    "critical": 2,
    "warning": 3,
    "suggestion": 4
  },
  "issues": [...]
}
```

## Version 1.0.0 - Initial Release
- Basic extraction of Copilot and Cursor bot comments
- Simple clipboard copying
- Basic formatting
