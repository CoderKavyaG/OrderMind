# OrderMind Environment Variables Audit & Checklist

This document details every environment variable referenced across the OrderMind codebase (`process.env.*`), its operational importance, failure impact, free tier access method, and local setup status.

---

## 1. Environment Variable Master Matrix

| Variable Name | Classification | Failure Impact If Missing | Where to Get for Free | Status in `.env.local` |
| :--- | :--- | :--- | :--- | :--- |
| **`MONGODB_URI`** | **Required** | Database fails to connect. All auth, orders, and workspace state storage blocked. In dev/test, falls back to in-memory pseudo-storage. | Free M0 Sandbox (512 MB) on [MongoDB Atlas](https://www.mongodb.com/atlas) with no credit card required. | **SET** |
| **`JWT_SECRET`** | **Required** | Auth token signing and verification fails. Users cannot log in or authenticate session cookies. | Run `openssl rand -base64 32` or any random 32+ character string. | **SET** (63 chars) |
| **`NODE_ENV`** | **Required** | Defaults to `development`. Production optimizations, strict cookie flags, and mock bans will not activate if not set to `production`. | System standard (`development` \| `production` \| `test`). | **SET** (`development`) |
| **`NEXT_PUBLIC_APP_URL`** | **Required** | CSRF origin validation, internal redirects, and share links fall back to `http://localhost:3000`. | Set to local dev URL (`http://localhost:3005`) or production domain (`https://ordermind.pack`). | **SET** |
| **`LLM_PROVIDER`** | **Required** | Determines AI pipeline engine (`gemma` vs `mock`). In production, setting `mock` throws an explicit fatal error at boot. | Built-in configuration. Default: `gemma`. | **SET** (`gemma`) |
| **`LLM_BASE_URL`** | **Required for Gemma** | AI extraction pipeline cannot connect to Gemma engine; marks extraction jobs as failed with connectivity error. | Free local Ollama (`http://localhost:11434`) or free tier hosted endpoints (e.g., Groq, Together, Hugging Face). | **SET** (`http://localhost:11434`) |
| **`LLM_MODEL`** | **Required for Gemma** | Extraction pipeline fails if model tag does not exist on endpoint. | Pull `gemma2:9b` or `gemma2:2b` via Ollama (`ollama pull gemma2:9b`), or hosted tag (`gemma2-9b-it`). | **SET** (`gemma2:9b`) |
| **`LLM_API_KEY`** | **Conditional** | Required only for hosted remote endpoints. If missing on authenticated endpoints, requests fail with HTTP 401. | Free API keys from [Groq Cloud](https://console.groq.com) or [OpenRouter](https://openrouter.ai). Not needed for local Ollama. | **UNSET** (Using local Ollama) |
| **`STT_PROVIDER`** | Optional | Sets voice note transcription engine (`manual` \| `elevenlabs` \| `whisper`). Defaults to `manual`. | Built-in option. Default: `manual`. | **SET** (`manual`) |
| **`ELEVENLABS_API_KEY`** | Conditional | Required only if `STT_PROVIDER=elevenlabs`. If missing, voice messages degrade to manual transcript paste. | Free tier (10,000 characters/mo) at [ElevenLabs.io](https://elevenlabs.io). | **UNSET** |
| **`SENTRY_DSN`** | Optional | Error reporting and agent stage trace metrics will not be sent to external cloud. App degrades gracefully. | Free developer account (5,000 errors/mo) at [Sentry.io](https://sentry.io). | **UNSET** (Degrades gracefully) |
| **`PORT`** | Optional | Server port binding (default: 3000 / 3005). | Local port configuration. | **SET** |
| **`MAX_UPLOAD_SIZE_BYTES`** | Optional | Upload file validation (default: 10485760 = 10MB). | Configurable integer byte limit. | **DEFAULT** (10MB) |

---

## 2. Boot Verification & Automated Check

OrderMind includes a dedicated CLI command to validate your environment before starting:

```bash
npm run check:env
```

### Production Boot Rule
In `NODE_ENV=production`, the application refuses to boot if:
1. `MONGODB_URI` is missing or invalid.
2. `JWT_SECRET` is shorter than 32 characters.
3. `LLM_PROVIDER` is set to `mock` (production strictly mandates real Gemma pipeline).

---

## 3. Recommended Minimal `.env.local`

For local development without paid APIs:

```env
MONGODB_URI=mongodb://localhost:27017/ordermind
JWT_SECRET=development_secret_key_change_in_production_min_32_chars_12345
NEXT_PUBLIC_APP_URL=http://localhost:3005
NODE_ENV=development
LLM_PROVIDER=gemma
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=gemma2:9b
STT_PROVIDER=manual
```
