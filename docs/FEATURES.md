# Feature Guide

## Quick Start

1. Open a GitHub PR (preferably the **Files changed** tab).
2. Click the extension icon.
3. Click **Extract All Issues**.
4. The **📁 Grouped** format is copied to your clipboard automatically.
5. Use filters/presets, then export to other formats or copy individual items.

## What Gets Extracted

- Review-thread comments on PR files (bots + humans).
- Author/type detection (e.g., GitHub Copilot AI, Cursor Bot, other bots, human reviewers).
- Outdated/resolved detection (toggleable).
- Keyword-based severity: `critical`, `warning`, `suggestion`.

## Export Formats (Extraction)

These buttons re-run extraction from the PR page and export the extracted review-thread comments:

- **📁 Grouped**: grouped by file, includes a short “Instructions for Cursor AI” section at the end (useful for any assistant; safe to ignore).
- **📄 No Instructions**: grouped by file, without the instructions section.
- **📋 Summary**: file path + titles only.
- **{ } JSON**: structured export including `issues[]` items (and optional AI fields like `confidence`/`line` when present).
- **🌐 HTML**: styled export.
- **📊 CSV**: spreadsheet-friendly export.
- **📄 PDF**: opens a print dialog from an HTML export (use “Save as PDF”).

## Filters & Sorting

- **Exclude outdated issues** (default on)
- **Severity** (single or multi-select)
- **Author type** (bot/human/Copilot/Cursor)
- **File path** (regex)
- **Search** (title/content/file path)
- **Presets** (Critical only, Bots only, etc.)
- **Sorting** (severity/file/author/date/title)

## Copying Individual Items (Extraction + AI Review)

The **Individual Issues** list supports copying a single item. After you generate an AI review, AI findings are merged into this list and can be copied one-by-one the same way.

## AI Review

- **🤖 Generate AI Review** analyzes the PR diff via an OpenAI-compatible LLM endpoint and produces review findings.
- **👁️ Preview & Post to GitHub** posts the AI findings as a PR review (requires a GitHub token). Inline placement depends on model-provided line numbers; unplaceable items go into the review summary.

Setup details: `docs/AI_REVIEW_SETUP.md`

## History & Analytics

- The **📚 History** page is populated when you click **Extract All Issues** (the extension saves extracted items to local history).
- The **📊 Analytics** page summarizes what’s in history; if you haven’t extracted anything yet, it will be empty.
