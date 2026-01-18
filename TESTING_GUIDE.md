# Testing Guide

This repo includes unit tests for core utilities and a manual checklist for the Chrome extension UI.

## Automated Tests

```bash
npm test
npm run type-check
```

## Manual Smoke Test

### 1) Load the Extension

1. Build: `npm run build`
2. Load `dist/` via `chrome://extensions/` (Developer mode → Load unpacked)

### 2) Extraction (review-thread comments)

On a PR with review comments:

- Open **Files changed**
- Click **Extract All Issues**
- Verify:
  - Items include bots + human reviewers
  - “Exclude outdated issues” changes the count
  - Presets (Bots only / Humans only / Copilot only / Cursor only) change the list
  - File path regex + search work

### 3) Export Buttons (extraction output)

After extraction:

- Copy **Grouped**, **No Instructions**, **Summary**, **JSON**, **HTML**, **CSV**
- Click **PDF** and confirm the print dialog opens

### 4) AI Review

With LLM settings configured:

- Click **🤖 Generate AI Review**
- Verify:
  - Progress updates appear
  - AI findings appear in the **Individual Issues** list (author “Code Reviewer”)

### 5) GitHub Posting (optional)

With a GitHub token configured and a repo you can comment on:

- Generate AI review
- Click **👁️ Preview & Post to GitHub**
- Confirm:
  - A PR review is created
  - Some findings may be “unplaced” and show up in the review summary
