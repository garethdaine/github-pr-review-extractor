# vLLM Server Configuration

## ✅ Server is Running!

Your vLLM server is now running on the DGX Spark with DeepSeek-Coder model.

## 🔑 Configuration Details

**IMPORTANT: Use these settings in your Chrome Extension**

### Extension Settings (Settings → Options)

```
LLM Endpoint URL: http://192.168.1.57:8000/v1
API Key: sk-vllm-1767360922
Model Name: deepseek-ai/deepseek-coder-1.3b-instruct
Max Tokens: 1000
Temperature: 0.2
```

## 📊 Server Information

- **Container Name:** vllm-code-review
- **Model:** DeepSeek-Coder 1.3B Instruct
- **Port:** 8000
- **Max Context Length:** 65,536 tokens
- **Status:** ✅ Running and tested

## 🛠️ Server Management Commands

### View Logs
```bash
ssh 192.168.1.57 'docker logs -f vllm-code-review'
```

### Check Status
```bash
ssh 192.168.1.57 'docker ps | grep vllm-code-review'
```

### Stop Server
```bash
ssh 192.168.1.57 'docker stop vllm-code-review'
```

### Start Server (if stopped)
```bash
ssh 192.168.1.57 'docker start vllm-code-review'
```

### Restart Server
```bash
ssh 192.168.1.57 'docker restart vllm-code-review'
```

### Start Fresh (with new model)
```bash
ssh 192.168.1.57 '~/llm-server/start-vllm-production.sh'
```

## 🧪 Test Commands

### Check if server is responding
```bash
curl http://192.168.1.57:8000/v1/models
```

### Test code review
```bash
curl http://192.168.1.57:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/deepseek-coder-1.3b-instruct",
    "messages": [
      {"role": "system", "content": "You are a code reviewer."},
      {"role": "user", "content": "Review this code: def add(a,b): return a+b"}
    ],
    "max_tokens": 200
  }'
```

## 📈 Performance Notes

- **First Request:** May take 5-10 seconds (model warmup)
- **Subsequent Requests:** Much faster (1-3 seconds)
- **Model Size:** ~2.8GB loaded in GPU memory
- **Context Window:** 65K tokens (plenty for most code reviews)

## 🔄 Auto-Restart

The container is configured with `--restart unless-stopped`, meaning:
- ✅ Automatically starts when DGX Spark boots
- ✅ Restarts if it crashes
- ❌ Does NOT restart if you manually stop it

## 🎯 Next Steps

1. **Load Extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select: `/Users/garethdaine/Code/github-pr-bot-extractor`

2. **Configure Extension:**
   - Right-click extension icon → Options
   - Copy the settings above
   - Click "Test Connection" (should succeed)
   - Click "Save Settings"

3. **Test on a PR:**
   - Go to any GitHub PR
   - Click the extension icon
   - Click "🤖 Generate AI Review"
   - Wait for results!

## 🚀 Model Upgrade Options

If you want better quality reviews, you can upgrade to a larger model:

### DeepSeek-Coder 6.7B (Better quality)
```bash
ssh 192.168.1.57
docker stop vllm-code-review
docker rm vllm-code-review

# Edit the script to use 6.7B model
nano ~/llm-server/start-vllm-production.sh
# Change MODEL_NAME to: "deepseek-ai/deepseek-coder-6.7b-instruct"

# Run the script
~/llm-server/start-vllm-production.sh
```

Note: Larger models require more VRAM and will be slower.

## 🔒 Security

- Server only accessible on local network (192.168.1.x)
- Not exposed to the internet
- API key is for your extension only
- All code stays on your network

## 📞 Troubleshooting

### Server not responding
```bash
# Check if container is running
ssh 192.168.1.57 'docker ps | grep vllm-code-review'

# Check logs for errors
ssh 192.168.1.57 'docker logs vllm-code-review | tail -50'

# Restart if needed
ssh 192.168.1.57 'docker restart vllm-code-review'
```

### Out of memory
The 1.3B model should work fine. If you get OOM errors:
- Check GPU memory: `ssh 192.168.1.57 nvidia-smi`
- Stop other GPU processes
- Use an even smaller model

### Model loading slowly
First run downloads the model (~3GB). This is normal.
Subsequent starts will be much faster.

---

**Server Setup Date:** January 2, 2026
**Model:** DeepSeek-Coder 1.3B Instruct
**Status:** ✅ Running and tested successfully
