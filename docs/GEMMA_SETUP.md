# Gemma Pipeline Setup & Transport Guide

OrderMind's AI core is powered by Google's open-source **Gemma 2** architecture. The application accesses the model strictly through the `LLMProvider` interface, allowing you to swap between local execution on your machine and hosted cloud endpoints with zero code modifications.

---

## 1. Transport Mode A: Local Ollama (Recommended for Development)

Running Gemma locally requires zero API keys, incur zero costs, and preserves complete data privacy.

### Step 1: Install Ollama
Download and install Ollama from [ollama.com](https://ollama.com):
- **macOS / Linux**: `curl -fsSL https://ollama.com/install.sh | sh`
- **Windows**: Download the official Windows installer.

### Step 2: Pull the Gemma 2 Model
Open your terminal and pull your preferred Gemma model:

```bash
# Recommended baseline (high precision, fits in 8GB VRAM / 16GB RAM):
ollama pull gemma2:9b

# Lightweight option for older/slower laptops (fits in 4GB RAM):
ollama pull gemma2:2b

# Multimodal option if reference image dieline extraction is needed:
ollama pull llava-phi3
```

### Step 3: Start the Ollama Service
```bash
ollama serve
```
By default, Ollama listens on `http://localhost:11434`.

### Step 4: Configure OrderMind
In your `.env.local`:
```env
LLM_PROVIDER=gemma
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=gemma2:9b
LLM_API_KEY=
```

### Step 5: Test the Pipeline
Run the built-in diagnostic suite:
```bash
npm run check:gemma
```
This probes the endpoint, lists all installed tags, and runs 4 real test calls (English extraction, Hinglish, reference phrase, and vision capability).

---

## 2. Transport Mode B: Hosted Remote Endpoint (Production / Render Deployments)

For production deployment on Render, Fly.io, or AWS where a local GPU is not available, connect OrderMind to any hosted OpenAI-compatible endpoint serving Gemma.

### Free & Low-Cost Providers:
1. **Groq Cloud (Fastest Inference)**:
   - Sign up at [console.groq.com](https://console.groq.com) (free tier available).
   - Create an API key (`gsk_...`).
   - Model tag: `gemma2-9b-it`.
   - `.env.production`:
     ```env
     LLM_PROVIDER=gemma
     LLM_BASE_URL=https://api.groq.com/openai/v1
     LLM_MODEL=gemma2-9b-it
     LLM_API_KEY=gsk_your_groq_api_key_here
     ```

2. **OpenRouter**:
   - Sign up at [openrouter.ai](https://openrouter.ai).
   - Model tag: `google/gemma-2-9b-it`.
   - `.env.production`:
     ```env
     LLM_PROVIDER=gemma
     LLM_BASE_URL=https://openrouter.ai/api/v1
     LLM_MODEL=google/gemma-2-9b-it
     LLM_API_KEY=sk-or-your_openrouter_key
     ```

3. **Self-Hosted vLLM / Ollama on Render**:
   - Deploy an Ollama Docker service on Render (Private Service).
   - Point `LLM_BASE_URL` to your Render internal service address (e.g., `http://ollama-service:11434`).

---

## 3. What to Do If Your Laptop is Slow or Low on RAM

If your computer lags when running `gemma2:9b`:

1. **Switch to Gemma 2 2B**:
   - Run `ollama pull gemma2:2b`.
   - Update `.env.local`:
     ```env
     LLM_MODEL=gemma2:2b
     ```
   - Gemma 2 2B uses ~1.6 GB of RAM, loads instantly, and runs comfortably on standard CPU-only laptops.

2. **Offload to Free Hosted API**:
   - Use Groq Cloud (`gemma2-9b-it`) which generates responses at ~300 tokens/sec for free without heating your laptop.

3. **Concurrency Limiting**:
   - OrderMind processes conversation messages sequentially in windows of 6 messages to avoid GPU/CPU thermal throttling.

---

## 4. Multimodal & Vision Capabilities

- Standard Gemma 2 models (`gemma2:9b`, `gemma2:2b`) are **text-only**.
- If a client uploads a CAD dieline or box image while a text-only model is active, OrderMind's `supportsVision()` guard detects this and:
  1. Flags the extraction stage with `vision_unsupported`.
  2. Degrades gracefully to text and caption analysis.
  3. Displays an informative notice on the order card: *"Reference file attached; visual substrate analysis bypassed on text-only model."*
- To enable full multimodal parsing, configure a multimodal tag such as `llava` or `paligemma`.
