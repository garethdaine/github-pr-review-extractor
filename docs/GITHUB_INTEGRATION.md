# GitHub Integration Guide

## ✨ New Feature: Post AI Reviews Directly to GitHub!

The extension can now automatically post AI-generated review comments directly to your GitHub PRs.

## Setup (5 minutes)

### Step 1: Create a GitHub Personal Access Token

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `PR Review Extractor`
4. Set expiration: Choose your preference (90 days recommended)
5. Select scopes:
   - ✅ **`repo`** (Full control of private repositories)
     - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events
6. Click **"Generate token"**
7. **IMPORTANT**: Copy the token immediately (starts with `ghp_`)
   - You won't be able to see it again!

### Step 2: Add Token to Extension

1. Right-click the extension icon → **Options**
2. Scroll to **"GitHub Token (Optional)"** field
3. Paste your token (e.g., `ghp_xxxxxxxxxxxxxxxxxxxx`)
4. Click **"Save Settings"**

### Step 3: Use It!

1. Generate an AI review on any PR
2. Click the new **"📤 Post AI Review to GitHub"** button
3. Done! Comments appear on the PR instantly

## How It Works

### What Gets Posted

Each AI-generated issue becomes a review comment on the PR:

```
**Missing error handling** (WARNING)

This function doesn't handle potential errors from the API call.
Consider wrapping it in a try-catch block.

**Suggestion:** Add error handling for network failures

---
*(No signature is added to posted reviews/comments)*
```

### Where Comments Appear

- Posted as a **GitHub Review** (not individual comments)
- Appears in the "Files changed" tab
- Attached to the specific line/file mentioned
- Shows as a review from your GitHub account

### Comment Format

Each comment includes:
- **Title** with severity badge
- **Description** of the issue
- **Suggestion** for how to fix it
- AI attribution footer

## Benefits

### 1. GitHub API Rate Limits
Without token: **60 requests/hour**
With token: **5,000 requests/hour** ✅

### 2. Private Repositories
- Without token: Can't access private repos
- With token: Full access to your private repos ✅

### 3. Post Comments
- Automatically post AI reviews to PRs ✅
- No copy/paste needed ✅
- Professional review format ✅

## Security

### Is it safe?

✅ **Yes!** Here's why:

1. **Token stored securely**
   - Encrypted by Chrome in local storage
   - Never sent to any external server
   - Only used to call GitHub API

2. **Minimal permissions**
   - Only needs `repo` scope
   - Can't delete repos or change settings
   - Limited to PR comments

3. **You control it**
   - Can revoke token anytime at github.com/settings/tokens
   - Can regenerate if compromised
   - Extension is open source

### Best Practices

1. **Set an expiration** (90 days recommended)
2. **Regenerate periodically** for security
3. **Don't share your token** with anyone
4. **Revoke if extension is uninstalled**

## Alternative: SSH Keys

**Q: Can I use my SSH key instead of a token?**

A: No, the GitHub API requires a Personal Access Token (PAT) or OAuth. SSH keys only work for git operations (push/pull), not API calls.

**Why tokens are better for this:**
- Scoped permissions (only what's needed)
- Easy to revoke without affecting SSH access
- Works with 2FA enabled
- Can set expiration dates

## Troubleshooting

### "GitHub token not configured"

**Solution**: Add your token in extension settings:
1. Right-click extension → Options
2. Add token in "GitHub Token (Optional)" field
3. Save settings

### "GitHub API error: 401"

**Solution**: Token is invalid or expired
1. Check token at: github.com/settings/tokens
2. Generate new token if needed
3. Update in extension settings

### "GitHub API error: 403"

**Solution**: Rate limit hit or insufficient permissions
1. Make sure token has `repo` scope
2. Wait if rate limit exceeded (resets hourly)
3. Check token hasn't been revoked

### "GitHub API error: 422"

**Solution**: Invalid comment format
- AI comment may not have proper line number
- File may not exist in PR
- Check browser console (F12) for details

### Comments not appearing

**Check:**
1. Token has `repo` scope
2. You have write access to the repository
3. PR is still open (can't comment on closed PRs)
4. Comments posted to correct repository

## Usage Tips

### When to Post

✅ **Good times to post:**
- After generating review on your own PRs
- When helping team members with reviews
- For automated review workflows

❌ **Avoid posting:**
- On PRs you don't have write access to
- Multiple times (will create duplicate reviews)
- Without reviewing the AI suggestions first

### Manual Review First

**Recommended workflow:**
1. Generate AI review
2. **Review the suggestions yourself**
3. Remove any false positives
4. Post the good ones to GitHub

This ensures high-quality reviews!

### Editing Comments

After posting, you can:
- Edit comments on GitHub
- Delete individual comments
- Resolve conversations
- Reply to comments

The review is just like any manual review.

## Rate Limits

### API Usage

| Action | API Calls | With Token Limit |
|--------|-----------|------------------|
| Generate Review (5 files) | 1-2 | Plenty |
| Post Review | 2 + N (inline comments) | Plenty |
| Hourly Limit | N/A | 5,000 |

You're unlikely to hit the limit in normal usage!

### What Counts Toward Limit

- Fetching PR data via API (when not on Files tab)
- Posting reviews
- Each API call in `src/ui/background/background.ts`

### What Doesn't Count

- DOM extraction (when on Files tab) ✅
- LLM calls (local server) ✅
- Copying to clipboard ✅

## Advanced: Fine-grained Tokens

GitHub now offers **fine-grained personal access tokens** with more granular permissions.

### To use fine-grained tokens:

1. Go to: github.com/settings/tokens?type=beta
2. Generate new token (fine-grained)
3. Select specific repositories only
4. Permissions needed:
   - Pull requests: Read and write
   - Contents: Read
5. Use this token in extension

**Benefits:**
- More secure (limited to specific repos)
- Better audit log
- More control

## Summary

✅ **GitHub token is optional** but highly recommended

**Adds these features:**
- Post AI reviews directly to PRs
- Higher API rate limits (5000/hour)
- Access to private repositories
- Professional review workflow

**Setup time**: 5 minutes
**Security**: Very safe with best practices
**Alternative to SSH**: No, SSH doesn't work with API

Ready to try it? Follow Step 1 above to create your token! 🚀
