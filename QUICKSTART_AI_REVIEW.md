# Quick Start: AI Code Review

## ✅ Setup Complete!

Everything is ready. Follow these 3 simple steps:

## Step 1: Load Extension (2 minutes)

1. Open Chrome and go to: `chrome://extensions/`
2. Toggle **"Developer mode"** ON (top right)
3. Click **"Load unpacked"**
4. Navigate to and select: `/Users/garethdaine/Code/github-pr-bot-extractor`
5. The extension icon should appear in your toolbar

## Step 2: Configure Settings (1 minute)

1. **Right-click** the extension icon in Chrome toolbar
2. Click **"Options"**
3. Enter these settings:

```
LLM Endpoint URL: http://192.168.1.57:8000/v1
API Key: sk-vllm-1767360922
Model Name: deepseek-ai/deepseek-coder-1.3b-instruct
Max Tokens: 1000
Temperature: 0.2
Max Issues Per File: 10
```

4. Check these issue types:
   - ✅ Bugs and Logic Errors
   - ✅ Security Vulnerabilities
   - ✅ Performance Issues
   - ✅ Missing Error Handling
   - ⬜ Code Style Violations (optional)

5. Click **"Test Connection"** (should show success!)
6. Click **"Save Settings"**

## Step 3: Try It! (30 seconds)

1. Go to any **GitHub Pull Request** page
2. Click the **extension icon** in Chrome toolbar
3. Click **"🤖 Generate AI Review"** button
4. Watch the progress bar
5. Review the AI-generated issues!

## 🎉 That's It!

The AI will analyze the PR code and suggest improvements.

## 💡 Tips

- **First review might be slower** (10-30 seconds) as the model warms up
- **Subsequent reviews are faster** (5-15 seconds)
- You can **copy individual issues** or export all at once
- AI issues appear alongside **human/bot comments** you extract

## 🔍 What to Expect

The AI will find:
- Logic bugs and errors
- Security vulnerabilities
- Performance issues
- Missing error handling
- Code improvements

## 📚 More Information

- **Full Documentation:** See `IMPLEMENTATION_SUMMARY.md`
- **Server Management:** See `VLLM_SERVER_CONFIG.md`
- **Setup Guide:** See `AI_REVIEW_SETUP.md`

## ❓ Problems?

### Extension won't load
- Make sure Developer mode is enabled
- Check that you selected the correct folder
- Reload the extension

### Can't connect to LLM
- Verify server is running: `ssh 192.168.1.57 'docker ps | grep vllm-code-review'`
- Test endpoint: `curl http://192.168.1.57:8000/v1/models`
- Check API key matches

### No issues found
- This is normal if the code is good!
- Try on a PR with obvious bugs
- Enable more check types in settings

---

**Ready to go!** Open a GitHub PR and try your first AI code review! 🚀
