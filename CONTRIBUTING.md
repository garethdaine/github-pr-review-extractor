# Contributing to GitHub PR Review Extractor

## Prerequisites

- Node.js 18+
- npm
- Google Chrome (MV3 extensions)

## Development Setup

```bash
npm install
npm run build
```

Load the extension from `dist/`:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `dist/`

For local development, watch builds:

```bash
npm run watch
```

Then click **Reload** on the extension card in `chrome://extensions/`.

## Useful Commands

- `npm run build` / `npm run watch`
- `npm run type-check`
- `npm test`
- `npm run test:coverage`

## Project Layout (high level)

- `src/core/`: DOM extraction, filtering, sorting, formatters
- `src/services/`: GitHub API client, LLM client, review engine, batch processor
- `src/ui/`: popup/settings/analytics/batch controllers + MV3 background service worker
- `src/utils/`: caching, i18n, review history storage, error handling
- `docs/`: user documentation

The build is driven by `build.js` (esbuild) and writes bundled outputs into `dist/`.

## Making Changes

### Extraction changes

- DOM parsing and classification: `src/core/extractor.ts`
- Export formatting: `src/core/formatters.ts`
- Filters/presets/sorting: `src/core/filters.ts`, `src/core/filter-presets.ts`, `src/core/sorters.ts`

GitHub changes can break selectors. Prefer robust selectors + fallbacks, and test on multiple PRs.

### AI review changes

- LLM prompting/response parsing: `src/services/llm-client.ts`
- PR diff acquisition and chunking: `src/services/github-api.ts`
- Orchestration and multi-pass review: `src/services/review-engine.ts`

### UI changes

- Popup: `src/ui/popup/popup.ts` + `popup.html`
- Options page: `src/ui/settings/settings.ts` + `settings.html`
- Batch page: `src/ui/batch/batch-ui.ts` + `batch-ui.html`
- Analytics: `src/ui/analytics/analytics.ts` + `analytics.html`
- Background service worker (CORS, GitHub API, posting): `src/ui/background/background.ts`

### i18n

User-facing strings should go through `src/utils/i18n.ts` and `src/locales/*/messages.json`.

## Testing

Run unit tests and type checks:

```bash
npm run type-check
npm test
```

Manual testing checklist: `TESTING_GUIDE.md`

## Submitting a PR

- Create a branch: `feature/...`, `fix/...`, `docs/...`
- Keep changes focused and include docs updates when user-visible behavior changes.
- Run `npm run type-check` and `npm test` before opening the PR.

## Code Style

- TypeScript, strict mode: avoid `any` and prefer explicit types.
- Keep functions small and side-effect boundaries clear (core/services/ui separation).
- Prefer early returns and clear error messages surfaced to the UI.
