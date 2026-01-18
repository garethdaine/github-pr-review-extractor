# Quick Start Guide

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load it in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist/` directory

> Icons are already included in `icons/` and copied into `dist/` during the build. You only need `icons/CREATE_ICONS.md` if you want to replace the icons.

## Extract Review Comments

1. Open a GitHub PR and go to the **Files changed** tab (review threads are rendered there).
2. Click the extension icon.
3. Click **Extract All Issues**.
4. The **Grouped** format is copied to your clipboard automatically.
5. Use filters/presets, then export in other formats (Summary / JSON / HTML / CSV / PDF).

## Generate an LLM Review (Optional)

1. Open extension options (right‑click the extension icon → **Options**).
2. Configure an OpenAI‑compatible endpoint (base URL ending in `/v1`), API key, and model name.
3. On a PR page, click **🤖 Generate AI Review**.
4. Optionally, click **👁️ Preview & Post to GitHub** (requires a GitHub token; see `docs/GITHUB_INTEGRATION.md`).

More details: `docs/AI_REVIEW_SETUP.md`
