# GitHub Integration Guide

The extension can use a GitHub Personal Access Token (PAT) for:

- Higher API rate limits (useful for AI review and large diffs)
- Accessing private repositories via the GitHub API
- Posting AI review findings back to the PR as a GitHub review

## Create a Token

### Option A: Fine‑grained PAT (recommended)

1. Go to `https://github.com/settings/personal-access-tokens/new`
2. Limit the token to the repo(s) you need.
3. Set permissions:
   - **Pull requests:** Read and write
   - **Contents:** Read

### Option B: Classic PAT

1. Go to `https://github.com/settings/tokens`
2. Create a token with **`repo`** scope.

## Add Token to the Extension

1. Right‑click the extension icon → **Options**
2. Set **GitHub Token**
3. Click **Save Settings**

## Posting to GitHub

1. On a PR page, click **🤖 Generate AI Review**
2. Click **👁️ Preview & Post to GitHub**
3. Confirm to post

What happens:

- The extension posts a **PR review** from your GitHub account.
- It attempts to place **inline comments** using the model-provided `line` field.
- Findings that can’t be placed inline are included under **Unplaced Findings** in the review summary.

## Security Notes

- Tokens are stored in `chrome.storage.local` on your machine.
- Treat the PAT like a password; set an expiration and revoke it if you rotate machines or uninstall the extension.

## Troubleshooting

- **401/Bad credentials**: token expired/invalid.
- **403**: missing permissions, SSO not authorized, or rate limit.
- **422**: GitHub couldn’t place one or more inline comments; check the review summary for “Unplaced Findings”.
