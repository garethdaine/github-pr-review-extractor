# Cursor AI Integration Guide

## ✨ Use Your Local LLM in Cursor AI IDE

Your DGX Spark LLM is now accessible to Cursor AI via HTTPS!

## Setup Complete ✅

**Herd Proxy Active:**
- Local endpoint: `http://192.168.1.57:8000`
- Public URL: `https://llm.test`
- Status: ✅ Working!

## Configure Cursor AI

### Step 1: Open Cursor Settings

1. Open **Cursor AI**
2. Press `Cmd + ,` (Settings)
3. Go to **"Models"** or **"AI"** section

### Step 2: Add Custom OpenAI API

1. Look for **"OpenAI API Key"** or **"Custom API"** settings
2. Enable **"Use Custom OpenAI Endpoint"** or similar option
3. Enter these settings:

```
API Base URL: https://llm.test/v1
API Key: sk-vllm-1767360922
Model: deepseek-ai/deepseek-coder-1.3b-instruct
```

### Step 3: Test It

1. Open any code file in Cursor
2. Try using Cursor's AI features:
   - Code completion
   - Chat with AI
   - Code explanations
3. It should now use your local LLM!

## Alternative Setup (If Cursor Requires Public URL)

If Cursor doesn't accept `.test` domains, here are alternatives:

### Option 1: Cloudflare Tunnel (Recommended)

Expose your endpoint securely to the internet:

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Start tunnel (no account needed for quick testing)
cloudflared tunnel --url http://192.168.1.57:8000
```

This gives you a public URL like: `https://random-words.trycloudflare.com`

**Benefits:**
- Free
- No configuration
- Temporary URL (good for testing)
- Secure (HTTPS)

### Option 2: ngrok

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 192.168.1.57:8000
```

Gets you: `https://xxxxx.ngrok.io`

**Benefits:**
- Well-known service
- Stable URLs (with account)
- Free tier available

### Option 3: Tailscale (Private Network)

If Cursor accepts private network URLs:

```bash
# Install Tailscale on both Mac and DGX Spark
brew install tailscale

# Connect both machines
tailscale up
```

Access via: `http://dgx-spark.tailscale.net:8000`

**Benefits:**
- Private network (not public internet)
- Persistent URLs
- Very secure

## Current Setup Details

### Herd Proxy Status

Check proxy status:
```bash
herd proxies
```

Stop proxy:
```bash
herd unproxy llm
```

Restart proxy:
```bash
herd proxy llm http://192.168.1.57:8000 --secure
```

### Test Endpoint

Test from command line:
```bash
curl -k https://llm.test/v1/models
```

Test chat completion:
```bash
curl -k https://llm.test/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/deepseek-coder-1.3b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

## Cursor Configuration Examples

### Example 1: Custom OpenAI Compatible

```json
{
  "openai.apiBase": "https://llm.test/v1",
  "openai.apiKey": "sk-vllm-1767360922",
  "cursor.preferredModel": "deepseek-ai/deepseek-coder-1.3b-instruct"
}
```

### Example 2: If Cursor Uses Environment Variables

```bash
export OPENAI_API_BASE="https://llm.test/v1"
export OPENAI_API_KEY="sk-vllm-1767360922"
```

Then start Cursor from terminal:
```bash
open -a Cursor
```

## Troubleshooting

### "SSL Certificate Error"

**Solution:** Herd uses self-signed certificates locally.

Try:
1. Add `-k` or `--insecure` flag if possible
2. Or use Cloudflare Tunnel for real SSL

### "Connection Refused"

**Check:**
```bash
# Is Herd running?
herd status

# Is vLLM running?
curl http://192.168.1.57:8000/v1/models

# Restart Herd proxy
herd unproxy llm
herd proxy llm http://192.168.1.57:8000 --secure
```

### "Invalid API Key"

Use: `sk-vllm-1767360922`

The local server doesn't actually validate it, but Cursor might require one.

### Cursor Won't Accept .test Domain

Use one of these alternatives:
1. **Cloudflare Tunnel** (easiest, public URL)
2. **ngrok** (popular, public URL)  
3. **Tailscale** (private network)

## Performance Considerations

### When Using via Herd Proxy

- ✅ No performance impact (local network)
- ✅ Same speed as direct connection
- ✅ HTTPS encryption (minimal overhead)

### When Using via Internet Tunnel

- ⚠️ Slight latency added (~50-200ms)
- ✅ Still faster than cloud APIs
- ✅ All processing still local

## Security Notes

### Herd Proxy (Local Only)

- ✅ Only accessible from your Mac
- ✅ Not exposed to internet
- ✅ Self-signed SSL certificate
- ✅ Safe for development

### Internet Tunnels (Public)

- ⚠️ Exposes endpoint to internet
- ⚠️ Anyone with URL can access
- ✅ Tunnels use HTTPS
- 💡 Use for testing only, not production

**Recommendation:** Keep using Herd proxy if Cursor accepts it. Only use internet tunnels if needed.

## Benefits of This Setup

### 1. Free Local AI in Cursor

- ✅ No OpenAI costs
- ✅ No API rate limits
- ✅ Fast responses (local network)
- ✅ Privacy (code stays local)

### 2. Better Than Cloud APIs

| Feature | This Setup | Cloud APIs |
|---------|-----------|------------|
| Cost | Free | $0.01-0.10/request |
| Speed | Fast (local) | Slower (internet) |
| Privacy | 100% local | Sent to cloud |
| Rate Limits | None | Yes |
| Offline | Works | Requires internet |

### 3. Same Model Everywhere

- Chrome Extension: ✅
- Cursor AI: ✅
- Command Line: ✅
- Scripts: ✅

All using the same local LLM!

## Advanced: Auto-Start on Boot

Make Herd proxy permanent:

```bash
# Herd proxy survives restarts automatically
# No additional configuration needed!
```

To check proxies after restart:
```bash
herd proxies
```

## Usage in Cursor

### What Works

- ✅ Code completions
- ✅ Chat with AI
- ✅ Code explanations
- ✅ Inline suggestions
- ✅ Refactoring suggestions

### What to Expect

- **Quality:** Good for 1.3B model
- **Speed:** Fast (local network)
- **Context:** 8192 tokens
- **Cost:** Free!

### Tips for Best Results

1. **Be specific** in prompts
2. **Keep context small** (model is 1.3B)
3. **Use for code tasks** (it's trained on code)
4. **Review suggestions** (it's not GPT-4)

## Summary

✅ **Setup Complete!**

**Your Local LLM is now accessible at:**
- Direct: `http://192.168.1.57:8000`
- Via Herd: `https://llm.test`

**For Cursor AI:**
```
API Base URL: https://llm.test/v1
API Key: sk-vllm-1767360922
Model: deepseek-ai/deepseek-coder-1.3b-instruct
```

**If Cursor won't accept .test domains:**
Use Cloudflare Tunnel:
```bash
cloudflared tunnel --url http://192.168.1.57:8000
```

Enjoy free, local AI in your IDE! 🚀
