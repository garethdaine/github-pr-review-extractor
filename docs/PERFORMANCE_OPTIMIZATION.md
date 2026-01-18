# Performance Optimization Guide

This guide covers practical ways to speed up extraction and AI review.

## Extraction Performance

- Prefer the **Files changed** tab so review threads/diffs are already in the DOM.
- Large diffs that GitHub doesn’t render are detected and fetched via the GitHub API when needed (see `src/services/github-api.ts`).

## AI Review Performance

What impacts speed the most:

- Model size and hardware (CPU vs GPU)
- Multi-pass review (enabled by default)
- `Max Tokens`
- PR size (number of changed files + diff size)

Tips:

- Use a smaller model for interactive speed.
- Lower `Max Tokens` if you only need short findings.
- Disable multi-pass review for faster single-pass output.
- Reduce “Max Issues Per File” to limit long reviews.

## GitHub API Rate Limits

- Unauthenticated requests are heavily rate-limited.
- Add a GitHub token in **Options** to improve rate limits and support private repos.

See `docs/GITHUB_INTEGRATION.md`.

## Troubleshooting Slow Reviews

- If the extension says “No files to review”, ensure you’re on a PR page and the PR has file changes.
- If reviews stall on large PRs, try disabling multi-pass review and/or using a smaller model.
- If API calls fail on private repos, configure a GitHub token.
