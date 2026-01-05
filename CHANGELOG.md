# Changelog

## Version 4.0.0 - Major Refactor & New Features (January 2026)

### 🏗️ Architecture Improvements
- ✅ **Full TypeScript Migration** - Complete rewrite with strict types and proper interfaces
- ✅ **Modular Structure** - Organized codebase into `src/core/`, `src/services/`, `src/ui/`, `src/utils/`
- ✅ **Build System** - esbuild for fast TypeScript compilation and bundling
- ✅ **Type Safety** - Comprehensive type definitions for all data structures

### 🤖 AI Code Review Features
- ✅ **AI-Powered Reviews** - Generate code reviews using local LLM servers
- ✅ **Multi-Pass Review** - Critical issues first, then general review pass
- ✅ **Confidence Scores** - AI-generated issues include confidence levels (0.0-1.0)
- ✅ **Custom Prompts** - Override default system prompts with custom instructions
- ✅ **Prompt Templates** - Pre-defined templates (security, performance, style, comprehensive)
- ✅ **Configurable Issue Types** - Select which types to check (bugs, security, performance, style, error handling)
- ✅ **Preview Before Posting** - Review AI comments before posting to GitHub
- ✅ **Draft Reviews** - Post reviews as drafts for manual review

### 📊 Analytics & Batch Processing
- ✅ **Analytics Dashboard** - Visualize review history with Chart.js
  - Severity distribution charts
  - Author type breakdown
  - Top files by issues
  - Review frequency over time
  - Average issues per PR
- ✅ **Batch Processing** - Process multiple PRs at once
  - Select repository and fetch PRs
  - Process selected PRs automatically
  - Batch progress tracking
  - Export batch reports

### 📚 Review History
- ✅ **Review History** - Track and revisit past reviews
  - Store extracted and AI-generated reviews
  - Search and filter history
  - Export history as JSON
  - Delete individual entries

### 🌍 Internationalization
- ✅ **Multi-Language Support** - i18n with Chrome extension API
  - English (default)
  - Spanish
  - French
  - German
- ✅ **Localized UI** - All user-facing strings extracted to message files

### 🎨 UI/UX Enhancements
- ✅ **Dark Mode** - System preference detection and manual toggle
- ✅ **Advanced Filtering** - Filter by severity, author type, file paths (regex)
- ✅ **Search Functionality** - Search across titles, content, and file paths
- ✅ **Filter Presets** - Quick access to common filter combinations
- ✅ **Virtual Scrolling** - Optimized rendering for large issue lists
- ✅ **Debounced Inputs** - Improved performance for filter/search inputs

### 📋 Export Formats
- ✅ **HTML Export** - Styled HTML with embedded CSS
- ✅ **CSV Export** - Spreadsheet-friendly format
- ✅ **PDF Export** - Print-ready PDF via browser print dialog
- ✅ **Enhanced JSON** - Includes confidence scores and AI metadata

### ⚡ Performance Optimizations
- ✅ **Caching Layer** - In-memory cache for extracted issues
- ✅ **API Response Caching** - Cache GitHub API responses with TTL
- ✅ **Virtual Scrolling** - Efficient rendering for 100+ items
- ✅ **Lazy Loading** - Load issue details on demand
- ✅ **Debouncing** - Debounced search and filter inputs

### 🔧 Technical Improvements
- ✅ **Error Handling** - Comprehensive error handling with retry logic
- ✅ **Type Definitions** - Full TypeScript types for all interfaces
- ✅ **Build System** - esbuild for fast, reliable builds
- ✅ **Source Maps** - Development builds include source maps
- ✅ **Code Organization** - Clear separation of concerns

### 📝 Documentation
- ✅ **Updated README** - Comprehensive documentation with new features
- ✅ **Architecture Docs** - Clear project structure documentation
- ✅ **Development Guide** - Setup and build instructions

## Version 3.0.0 - Major Update

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
