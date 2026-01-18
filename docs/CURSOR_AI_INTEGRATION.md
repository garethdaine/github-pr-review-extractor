# Cursor Integration (Optional)

This extension does not configure Cursor for you, but you can point Cursor at the same **OpenAI-compatible** endpoint you use for the extension.

## What You Need

- An OpenAI-compatible base URL ending in `/v1` (for example: `http://localhost:11434/v1` or `http://localhost:8000/v1`)
- An API key value (some local servers ignore it, but clients often require one)
- A model name your server supports

## Cursor Settings

In Cursor, configure a custom OpenAI endpoint (wording varies by version), using:

- **API Base URL**: `<YOUR_ENDPOINT>/v1`
- **API Key**: `<YOUR_API_KEY>`
- **Model**: `<YOUR_MODEL>`

Example values:

- `http://localhost:11434/v1` + `deepseek-coder:6.7b` (Ollama)
- `http://localhost:8000/v1` + `deepseek-ai/deepseek-coder-1.3b-instruct` (vLLM)

## HTTPS Notes

Some apps require HTTPS or reject self‑signed certificates. If that happens:

- Prefer running the server with a valid certificate, or
- Use a private tunnel/VPN solution (e.g., Tailscale), or
- Use a temporary HTTPS tunnel for testing (e.g., Cloudflare Tunnel / ngrok)

Be careful with public tunnels: anyone with the URL may be able to access your endpoint.
