# vLLM Server Configuration

This extension expects an OpenAI-compatible base URL ending in `/v1` and will call:

- `POST <endpoint>/chat/completions`
- `GET <endpoint>/models` (used by some servers/tools; the extension itself uses a chat request for “Test Connection”)

## Example: Docker (GPU)

```bash
docker run --rm --gpus all -p 8000:8000 vllm/vllm-openai:latest \\
  --model deepseek-ai/deepseek-coder-1.3b-instruct \\
  --host 0.0.0.0 --port 8000
```

## Extension Settings

- **LLM Endpoint URL**: `http://localhost:8000/v1`
- **API Key**: `<YOUR_API_KEY>` (use any value if your server doesn’t validate)
- **Model Name**: `deepseek-ai/deepseek-coder-1.3b-instruct`
- **Max Tokens**: `1000` (adjust based on model/context)
- **Temperature**: `0.2` (lower is more deterministic)

## Quick Test (CLI)

```bash
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -d '{
    "model": "deepseek-ai/deepseek-coder-1.3b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

## Notes

- If you expose vLLM on a LAN, use `http://<host>:8000/v1` in the extension.
- Self‑signed HTTPS endpoints may fail from the extension due to certificate validation.
