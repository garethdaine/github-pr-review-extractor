# Quick Start: AI Review

## 1) Build + Load the Extension

```bash
npm install
npm run build
```

Then load `dist/` at `chrome://extensions/` (Developer mode → Load unpacked).

## 2) Configure LLM Settings

Open extension **Options** and set:

- **LLM Endpoint URL**: OpenAI-compatible base URL ending in `/v1` (example: `http://localhost:11434/v1`)
- **API Key**: any required key (some local servers ignore it; the extension still sends a Bearer token header)
- **Model Name**: model identifier used by your server

Click **Test Connection**, then **Save Settings**.

## 3) Run the Review

On a PR page, click **🤖 Generate AI Review**.

More details (Ollama / vLLM examples, troubleshooting): `docs/AI_REVIEW_SETUP.md`
