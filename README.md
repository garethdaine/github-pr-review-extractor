# GitHub PR Review Extractor

A Chrome extension that extracts **all review comments** from GitHub Pull Request pages (bots like Copilot/Cursor plus human reviewers), and can optionally generate an LLM-powered review of the PR diff.

## Features

### Core Extraction
- 📝 **Extracts ALL review comments** - bots and humans
- 🤖 Identifies **GitHub Copilot AI** suggestions
- 🤖 Detects **Cursor Bot** and other bot comments
- 👤 Includes **human reviewer** comments
- 🏷️ Labels each comment by author and type
- 🚫 Filters out outdated/resolved comments
- 📊 Shows severity levels (Critical, Warning, Suggestion)

### AI-Powered Reviews
- 🤖 **Generate AI code reviews** using local LLM servers
- 🔄 **Multi-pass review** - Critical issues first, then general review
- 📈 **Confidence scores** for AI-generated issues
- 🎯 **Custom prompts** and prompt templates
- 🔍 **Configurable issue types** (bugs, security, performance, style, error handling)

### Filtering & Sorting
- 🔍 **Advanced filtering** by severity, author type, file paths (regex)
- 🔎 **Search functionality** across titles, content, and file paths
- 📋 **Filter presets** for common scenarios
- 🔄 **Multiple sort options** (severity, file, author, date)

### Export Formats
- 📁 **Grouped**: Comments organized by file with instructions
- 📋 **Summary**: Quick overview by file
- 📄 **No Instructions**: Grouped format without instructions
- { } **JSON**: Machine-readable JSON format
- 🌐 **HTML**: Styled HTML export
- 📊 **CSV**: Spreadsheet-friendly format
- 📄 **PDF**: Print-ready PDF export

### Additional Features
- 📊 **Analytics Dashboard** - Visualize review history and trends
- 🔄 **Batch Processing** - Process multiple PRs at once
- 📚 **Review History** - Track and revisit past reviews
- 🌍 **Internationalization** - Support for English, Spanish, French, German
- 🌙 **Dark Mode** - System preference detection and manual toggle
- ⚡ **Performance Optimized** - Caching, virtual scrolling, debounced inputs

## Installation

### Option 1: Chrome Web Store (Recommended)
*Coming soon - extension will be published to Chrome Web Store*

### Option 2: From Source (Development)

1. **Clone this repository:**
   ```bash
   git clone https://github.com/yourusername/github-pr-bot-extractor.git
   cd github-pr-bot-extractor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```
   This will create a `dist/` directory with the compiled extension.

4. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist/` directory (not the root directory)

5. **Configure settings:**
   - Right-click the extension icon → Options
   - Enter your LLM endpoint URL, API key, and model name
   - (Optional) Add GitHub token for posting reviews and batch processing

## Usage

### Basic Extraction

1. **Navigate** to any GitHub Pull Request page (preferably the **Files changed** tab)
2. **Click** the extension icon in your browser toolbar
3. **Extract** - Click "Extract All Issues" button
4. **Review** the results:
   - See count of all comments found
   - View breakdown by author type
   - Check outdated vs current comments
5. **Filter** (optional):
   - Use severity, author type, file path filters
   - Search across titles and content
   - Apply filter presets
6. **Export** in your preferred format
7. **Copy** individual comments using the Copy button on each item

### AI Code Review

1. **Configure LLM settings** in extension options
2. **Navigate** to a GitHub PR page
3. **Click** "🤖 Generate AI Review" button
4. **Wait** for AI analysis (progress shown in real-time)
5. **Review** AI-generated issues with confidence scores
6. **Preview & Post** to GitHub (optional, requires a GitHub token):
   - Preview all comments before posting
   - Posts a PR review and attempts to place inline comments using model-provided line numbers
   - Any findings that can’t be placed inline are included in the review summary

### Batch Processing

1. **Open** batch processing page (Popup → **🔄 Batch**)
2. **Paste** PR URLs (one per line)
3. **Start Batch Review** to review each PR sequentially
4. **Export** a combined report or JSON to your clipboard

### Analytics Dashboard

1. **Open** analytics page (Popup → **📊 Analytics**)
2. **View** charts showing:
   - Severity distribution
   - Author type breakdown
   - Top files by issues
   - Review frequency over time
   - Average issues per PR

> Analytics is based on your saved history (created when you click **Extract All Issues**).

## Development

### Project Structure

```
github-pr-bot-extractor/
├── src/
│   ├── core/                 # Core extraction and processing logic
│   │   ├── content.ts        # Content script entry point
│   │   ├── extractor.ts      # Issue extraction from DOM
│   │   ├── filters.ts        # Filtering utilities
│   │   ├── formatters.ts     # Export format converters
│   │   └── sorters.ts        # Sorting utilities
│   ├── services/             # External service integrations
│   │   ├── github-api.ts     # GitHub API client
│   │   ├── llm-client.ts    # LLM API client
│   │   ├── review-engine.ts  # AI review orchestration
│   │   └── batch-processor.ts # Batch processing logic
│   ├── ui/                   # UI components
│   │   ├── background/       # Background service worker
│   │   ├── popup/            # Popup interface
│   │   ├── settings/         # Settings page
│   │   ├── analytics/        # Analytics page logic
│   │   └── batch/            # Batch review page logic
│   ├── utils/                # Utility functions
│   │   ├── cache.ts          # Caching utilities
│   │   ├── error-handler.ts  # Error handling
│   │   ├── i18n.ts           # Internationalization
│   │   ├── review-history.ts # Review history storage
│   │   └── virtual-scroll.ts # Virtual scrolling
│   ├── types/                # TypeScript type definitions
│   └── locales/              # i18n message files
│       ├── en/
│       ├── es/
│       ├── fr/
│       └── de/
├── dist/                     # Build output (generated)
├── archive/                  # Archived legacy files
├── build.js                  # Build script (esbuild)
├── manifest.json             # Extension manifest
├── popup.html                # Popup HTML
├── settings.html             # Settings page HTML
├── analytics.html            # Analytics dashboard HTML
├── batch-ui.html             # Batch processing UI HTML
├── history.html              # Review history page HTML
└── package.json              # Project dependencies
```

### Build System

The project uses **esbuild** for fast TypeScript compilation and bundling.

**Build commands:**
- `npm run build` - Build for development (with source maps)
- `npm run build:prod` - Build for production (minified)
- `npm run watch` - Watch mode for development

**Type checking:**
- `npm run type-check` - Run TypeScript type checker

**Testing:**
- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Run tests with coverage

### Development Workflow

1. **Make changes** to TypeScript files in `src/`
2. **Build** the extension: `npm run build`
3. **Reload** the extension in Chrome (`chrome://extensions/`)
4. **Test** your changes on a GitHub PR page

### Code Style

- **TypeScript** - All new code should be in TypeScript
- **Strict mode** - TypeScript strict mode enabled
- **ES Modules** - Use ES6 import/export syntax
- **Type safety** - Avoid `any` types, use proper interfaces

## Architecture

### How It Works

1. **Content Script** (`src/core/content.ts`):
   - Runs automatically on GitHub PR pages
   - Scans DOM for review thread components
   - Identifies comment authors (bots vs humans)
   - Extracts comment content, code context, and metadata
   - Detects outdated/resolved status
   - Classifies severity based on keywords
   - Returns structured data to popup

2. **Popup Interface** (`src/ui/popup/popup.ts`):
   - Triggered when user clicks extension icon
   - Sends extraction request to content script
   - Displays results with filters and options
   - Handles multiple export formats
   - Manages clipboard operations
   - Shows real-time statistics
   - Integrates with AI review engine

3. **Background Service Worker** (`src/ui/background/background.ts`):
   - Handles LLM API calls (cross-origin)
   - Manages GitHub API requests
   - Caches API responses
   - Provides connection testing

4. **AI Review Engine** (`src/services/review-engine.ts`):
   - Orchestrates multi-pass reviews
   - Manages file-by-file analysis
   - Extracts confidence scores
   - Formats review comments

5. **Communication Flow**:
   ```
   User clicks icon → Popup opens → Sends message to content script
   → Content script extracts comments → Returns data to popup
   → Popup formats and displays → User can copy or generate AI review
   → AI review → Background worker → LLM API → Results back to popup
   ```

## Configuration

### LLM Settings

Configure in extension options (`chrome://extensions` → Options):

- **LLM Endpoint URL**: An OpenAI-compatible base URL ending in `/v1` (e.g., `http://localhost:11434/v1` or `http://localhost:8000/v1`)
- **API Key**: Authentication key for your LLM endpoint
- **Model Name**: Model identifier (e.g., `deepseek-ai/deepseek-coder-1.3b-instruct`)
- **Max Tokens**: Maximum response length (default: 1000)
- **Temperature**: Randomness control (default: 0.2)
- **Max Issues Per File**: Limit issues per file (default: 10)

### Review Preferences

- **Issue Types**: Select which types to check (bugs, security, performance, style, error handling)
- **Multi-Pass Review**: Enable two-pass review (critical first, then general)
- **Minimum Confidence**: Stored in settings (not currently used to filter results)
- **Custom System Prompt**: Override default AI prompt
- **Prompt Templates**: Pre-defined templates (security-focused, performance-focused, etc.)

### GitHub Integration

- **GitHub Token** (optional): Personal access token for:
  - Increased API rate limits
  - Posting review comments
  - Batch processing PRs
  - Create at: `github.com/settings/tokens` (needs `repo` scope)

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

**AI Review not working**
- Check LLM endpoint URL is correct
- Verify API key is valid
- Test connection in settings
- Check browser console for errors
- Ensure model name matches your LLM server

**Copy to clipboard fails**
- Grant clipboard permissions when prompted
- Try clicking the extension icon again
- Check Chrome's site permissions for github.com

**Build errors**
- Run `npm install` to ensure dependencies are installed
- Check Node.js version (requires Node 18+)
- Clear `dist/` directory and rebuild

### Getting Help

- Check [existing issues](https://github.com/yourusername/github-pr-bot-extractor/issues)
- Open a new issue with:
  - Extension version
  - Chrome version
  - Node.js version
  - PR URL (if public)
  - Browser console errors
  - Screenshots if applicable

## Changelog

### Version 4.0.0 - Major Refactor & New Features

#### Architecture
- ✅ **TypeScript migration** - Full TypeScript rewrite with strict types
- ✅ **Modular structure** - Organized into `src/core/`, `src/services/`, `src/ui/`
- ✅ **Build system** - esbuild for fast compilation and bundling
- ✅ **Internationalization** - Support for 4+ languages

#### New Features
- 🤖 **AI Code Review** - Generate reviews using local LLM servers
- 📊 **Analytics Dashboard** - Visualize review history and trends
- 🔄 **Batch Processing** - Process multiple PRs at once
- 📚 **Review History** - Track and revisit past reviews
- 🌍 **i18n Support** - English, Spanish, French, German
- 🌙 **Dark Mode** - System preference detection

#### Enhancements
- 🔍 **Advanced filtering** - Severity, author type, file paths (regex), search
- 🔄 **Multi-pass AI review** - Critical issues first, then general
- 📈 **Confidence scores** - AI-generated issues include confidence levels
- 🎯 **Custom prompts** - Override default AI system prompts
- ⚡ **Performance** - Caching, virtual scrolling, debounced inputs
- 📋 **More export formats** - HTML, CSV, PDF support

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## License

MIT License - feel free to modify and use as needed!
