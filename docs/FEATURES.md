# Feature Guide

## 🚀 Quick Start

1. Click extension icon on any GitHub PR
2. Click "Extract All Issues"
3. Issues automatically copied in grouped format
4. Choose different formats or copy individual issues

## 📋 Format Options

### 📁 Grouped (Default)
**Best for:** Cursor AI, comprehensive review

Issues organized by file with:
- Severity indicators (🔴 🟡 🔵)
- Code context for each issue
- Full suggestions
- Instructions for AI

**Use when:** You want to fix all issues systematically by file

### 📋 Summary
**Best for:** Quick overview, team sharing

Minimal format showing:
- File paths
- Issue titles with severity emoji
- No code context or instructions

**Use when:** You need a quick list or want to share overview with team

### 📄 No Instructions
**Best for:** Documentation, human review

Full details without AI instructions:
- Grouped by file
- All code context
- Suggestions included
- No Cursor AI instructions

**Use when:** Reviewing issues yourself or documenting in wiki/issues

### { } JSON
**Best for:** Automation, integration

Structured data export:
```json
{
  "pr": { "title", "url", "extractedAt" },
  "summary": { "total", "critical", "warning", "suggestion" },
  "issues": [
    {
      "type": "GitHub Copilot AI",
      "title": "...",
      "content": "...",
      "filePath": "...",
      "codeContext": "...",
      "severity": "warning",
      "timestamp": "...",
      "source": "..."
    }
  ]
}
```

**Use when:** Building tools, generating reports, tracking metrics

## 🎯 Severity Levels

### 🔴 CRITICAL
**Triggers:**
- "breaking change"
- "breaking api"  
- "regression"
- "security"
- "vulnerability"

**Action:** Fix immediately, high priority

**Examples:**
- Breaking API changes
- Security vulnerabilities
- Regressions that break functionality

### 🟡 WARNING
**Triggers:**
- "could lead to"
- "unsafe"
- "not safe"
- "inconsistent"
- "degrades ux"

**Action:** Fix soon, medium priority

**Examples:**
- Unsafe patterns that might cause issues
- Code that could lead to bugs
- UX degradations

### 🔵 SUGGESTION
**Default for:** Everything else

**Action:** Fix when convenient, low priority

**Examples:**
- Code style improvements
- Refactoring suggestions
- Best practice recommendations

## 📝 Individual Issue Copying

### When to Use
- Sharing specific issue with teammate
- Creating individual GitHub issues
- Focusing on one problem at a time
- Adding to documentation

### How to Use
1. Extract all issues first
2. Scroll to "Individual Issues" section
3. Find the issue you want
4. Click "Copy" button next to it
5. Paste anywhere!

### What You Get
```markdown
## 🔴 Issue Title

**File:** `path/to/file.ts`
**Severity:** CRITICAL

**Code:**
```
123: const problematic = code;
```

**💡 Suggestion:**
Detailed explanation of the issue and how to fix it.
```

## 💡 Tips & Tricks

### Workflow with Cursor AI
1. Extract issues in **Grouped** format
2. Paste into Cursor chat
3. Let Cursor fix critical issues first
4. Review warnings manually
5. Apply suggestions as needed

### Workflow for Team Review
1. Extract in **Summary** format
2. Share in Slack/Teams
3. Assign issues to team members
4. Use individual copy for specific issues

### Workflow for Documentation
1. Extract in **No Instructions** format
2. Add to PR description or wiki
3. Track which issues are addressed
4. Reference in commit messages

### Workflow for Metrics/Automation
1. Extract in **JSON** format
2. Parse with scripts
3. Track issue trends over time
4. Generate reports
5. Integrate with CI/CD

## 🔍 Understanding the Output

### Header Section
```markdown
# Code Review Issues - PR Title

**PR:** https://github.com/...
**Extracted:** Date and time
**Total Issues:** 9 (🔴 2 Critical, 🟡 3 Warnings, 🔵 4 Suggestions)
```
- Quick overview of what was extracted
- Severity breakdown at a glance

### File Sections
```markdown
## 📁 `path/to/file.ts`
3 issues found
```
- Files with most issues appear first
- Easy to tackle one file at a time

### Issue Details
```markdown
### 🔴 Issue Title
**Severity:** CRITICAL

**Code:**
Shows the actual code being commented on

**💡 Suggestion:**
Explanation and recommendation
```
- Complete context for each issue
- Easy to understand and fix

## 🎨 UI Elements

### Main Button
**"Extract All Issues"** - Primary action, extracts and auto-copies

### Format Buttons
- **📁 Grouped** - Re-copy in grouped format
- **📋 Summary** - Copy summary version
- **📄 No Instructions** - Copy without AI instructions
- **{ } JSON** - Export as JSON

### Issue List
- Scrollable list of all issues
- Color-coded severity badges
- Individual copy buttons
- Shows file path for context

## ❓ FAQ

**Q: Which format should I use?**
A: Start with Grouped (default). Use Summary for quick sharing, JSON for automation.

**Q: Can I copy issues multiple times in different formats?**
A: Yes! Extract once, then use format buttons to re-copy in any format.

**Q: What if I only want one specific issue?**
A: Use the individual copy buttons in the issue list.

**Q: How are severity levels determined?**
A: Based on keywords in the suggestion text (breaking change, security, etc.)

**Q: Can I customize severity detection?**
A: Currently no, but you can edit content.js to adjust keyword matching.

**Q: Does this work with private repos?**
A: Yes, as long as you're authenticated in GitHub and can view the PR.
