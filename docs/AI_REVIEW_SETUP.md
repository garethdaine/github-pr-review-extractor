# AI Code Review Setup Guide

This guide will help you set up the AI code review feature for the GitHub PR Review Extractor extension.

## Prerequisites

- DGX Spark (or any server with GPU/sufficient RAM)
- Chrome Extension installed
- Network access between your Mac and the DGX Spark

## Step 1: Set Up LLM Server on DGX Spark

### Option A: Using Ollama (Recommended - Easiest)

1. **SSH into DGX Spark:**
   ```bash
   ssh 192.168.1.57
   ```

2. **Install Ollama:**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sudo sh
   ```

3. **Pull a code-specialized model:**
   ```bash
   # Smaller, faster model (recommended for testing)
   ollama pull deepseek-coder:6.7b
   
   # OR larger, more capable model
   ollama pull deepseek-coder:33b
   ```

4. **Start Ollama server (accessible from network):**
   ```bash
   OLLAMA_HOST=0.0.0.0:11434 ollama serve
   ```

5. **Test the server:**
   ```bash
   curl http://192.168.1.57:11434/api/generate -d '{
     "model": "deepseek-coder:6.7b",
     "prompt": "Hello, are you working?",
     "stream": false
   }'
   ```

6. **Configure extension:**
   - LLM Endpoint: `http://192.168.1.57:11434/v1`
   - API Key: `ollama` (Ollama doesn't require real auth)
   - Model Name: `deepseek-coder:6.7b`

### Option B: Using vLLM (More Advanced)

1. **Install NVIDIA Container Toolkit:**
   ```bash
   sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

2. **Run the startup script:**
   ```bash
   ~/llm-server/start-vllm.sh
   ```

3. **Save the API key** that's displayed when the server starts

4. **Wait for model to download** (this may take 10-15 minutes for first run)

5. **Test endpoint:**
   ```bash
   ~/llm-server/test-vllm.sh http://192.168.1.57:8000 YOUR_API_KEY
   ```

## Step 2: Configure Chrome Extension

1. **Open extension settings:**
   - Right-click the extension icon in Chrome
   - Select "Options"

2. **Enter LLM configuration:**
   - **For Ollama:**
     - Endpoint: `http://192.168.1.57:11434/v1`
     - API Key: `ollama`
     - Model: `deepseek-coder:6.7b`
   
   - **For vLLM:**
     - Endpoint: `http://192.168.1.57:8000/v1`
     - API Key: (the key from startup script)
     - Model: `deepseek-ai/deepseek-coder-1.3b-instruct`

3. **Click "Test Connection"** to verify it works

4. **Configure review preferences:**
   - Max Tokens: 1000 (default)
   - Temperature: 0.2 (deterministic reviews)
   - Max Issues Per File: 10
   - Check the issue types you want to detect

5. **Click "Save Settings"**

## Step 3: Use AI Code Review

1. **Navigate to a GitHub PR page**

2. **Click the extension icon**

3. **Click "🤖 Generate AI Review"**

4. **Wait for review to complete:**
   - You'll see progress updates
   - Large PRs may take 1-2 minutes

5. **View and copy results:**
   - AI-generated issues appear alongside extracted comments
   - Use the copy buttons to export reviews

## Troubleshooting

### Connection Test Fails

**Problem:** "Connection failed: Network error"

**Solutions:**
- Verify DGX Spark IP address (192.168.1.57)
- Check if LLM server is running: `ssh 192.168.1.57 'ps aux | grep ollama'`
- Test from Mac: `curl http://192.168.1.57:11434/api/tags`
- Check firewall rules on DGX Spark

### "Failed to load settings"

**Solution:** Open extension options and save settings at least once

### AI Review Generates No Issues

This is normal if the code is good! Try:
- Lower the temperature setting (makes it less conservative)
- Enable more check types in settings
- Try reviewing a different PR with more obvious issues

### Review Takes Too Long

**Solutions:**
- Use a smaller model (e.g., deepseek-coder:1.3b)
- Reduce "Max Issues Per File" setting
- The extension automatically chunks large files

## Recommended Models

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| deepseek-coder:1.3b | 1.3B | Fast | Good | Quick reviews, testing |
| deepseek-coder:6.7b | 6.7B | Medium | Better | Daily use |
| deepseek-coder:33b | 33B | Slow | Best | Thorough reviews |
| codellama:7b | 7B | Medium | Good | Alternative option |

## Performance Tips

1. **Ollama is easier** than vLLM for local setup
2. **Smaller models** (1.3B-6.7B) are usually sufficient
3. **First request** will be slow as model loads into memory
4. **Subsequent requests** will be much faster
5. **Keep the server running** for best performance

## Network Configuration

If you need to access from other machines:

1. **Configure DGX firewall:**
   ```bash
   sudo ufw allow 11434/tcp  # For Ollama
   sudo ufw allow 8000/tcp   # For vLLM
   ```

2. **Use IP address** (not localhost) in extension settings

## Advanced: Running as System Service

To keep Ollama running permanently:

1. **Create systemd service:**
   ```bash
   sudo nano /etc/systemd/system/ollama.service
   ```

2. **Add configuration:**
   ```ini
   [Unit]
   Description=Ollama LLM Server
   After=network.target

   [Service]
   Type=simple
   User=yourusername
   Environment="OLLAMA_HOST=0.0.0.0:11434"
   ExecStart=/usr/local/bin/ollama serve
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start:**
   ```bash
   sudo systemctl enable ollama
   sudo systemctl start ollama
   ```

## Security Notes

- The LLM server is **not** exposed to the internet
- Only accessible on local network (192.168.1.x)
- API keys are stored securely in Chrome's encrypted storage
- Code is sent to **your local** LLM, not external services

## Support

For issues or questions:
1. Check the browser console (F12) for detailed error messages
2. Check DGX Spark logs
3. Verify network connectivity
4. Test with curl commands first
