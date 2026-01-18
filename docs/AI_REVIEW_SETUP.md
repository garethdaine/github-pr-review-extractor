# AI Review Setup Guide

The AI review feature calls an **OpenAI-compatible Chat Completions API** from the extension background service worker.

You configure:

- **LLM Endpoint URL**: base URL ending in `/v1`
- **API Key**: sent as `Authorization: Bearer <key>`
- **Model Name**: value sent in the OpenAI `model` field

The extension sends requests to `POST <LLM Endpoint URL>/chat/completions`.

## Option A: Ollama (simple local setup)

1. Install Ollama and pull a model:
   ```bash
   ollama pull deepseek-coder:6.7b
   ```

2. Configure the extension options:
   - **LLM Endpoint URL**: `http://localhost:11434/v1`
   - **API Key**: any value (Ollama typically ignores it, but the extension still sends one)
   - **Model Name**: `deepseek-coder:6.7b`

If Ollama is running on another machine, bind to the network (example):
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```
and use `http://<host>:11434/v1` in the extension.

## Option B: vLLM (GPU-focused)

Example Docker command:

```bash
docker run --rm --gpus all -p 8000:8000 vllm/vllm-openai:latest \\
  --model deepseek-ai/deepseek-coder-1.3b-instruct \\
  --host 0.0.0.0 --port 8000
```

Then configure:

- **LLM Endpoint URL**: `http://localhost:8000/v1`
- **API Key**: `<YOUR_API_KEY>` (or any value if your server doesn’t validate)
- **Model Name**: `deepseek-ai/deepseek-coder-1.3b-instruct`

More notes: `docs/VLLM_SERVER_CONFIG.md`

## Using AI Review

1. Open a PR page.
2. Click **🤖 Generate AI Review**.
3. (Optional) Click **👁️ Preview & Post to GitHub** (requires a GitHub token; see `docs/GITHUB_INTEGRATION.md`).

## Troubleshooting

- **Test Connection fails**: verify the endpoint is reachable and the model name exists.
- **Self-signed HTTPS**: the extension fetch call may fail certificate validation; prefer HTTP or a valid certificate.
- **Private repos / GitHub 404**: add a GitHub token in options.
- **Large PRs**: try a smaller model, reduce `Max Tokens`, disable multi‑pass review, or reduce “Max Issues Per File”.
