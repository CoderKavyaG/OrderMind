# OrderMind — Production Deployment Guide

This document outlines how to deploy OrderMind to cloud platforms (Render, Railway, Docker, or AWS).

---

## 1. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS)
- **MongoDB**: MongoDB Atlas Cluster `v6.0+` or self-hosted MongoDB with replica set (for GridFS and transactions)
- **Ollama / Hosted Gemma**: (Optional for local or cloud AI inference)

---

## 2. Environment Variables

Configure the following variables in your hosting dashboard:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | **Yes** | Connection string for MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/ordermind` |
| `JWT_SECRET` | **Yes** | Random 32+ character key for JWT cookie signing | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public canonical URL for your app | `https://ordermind.onrender.com` |
| `NODE_ENV` | **Yes** | Node environment | `production` |
| `PORT` | No | Listening port (defaults to 3000) | `3000` |
| `LLM_BASE_URL` | No | Ollama or hosted OpenAI-compatible Gemma endpoint | `http://localhost:11434` |
| `LLM_MODEL` | No | Gemma model identifier | `gemma2:9b` |
| `ELEVENLABS_API_KEY` | No | API key for audio transcription (optional) | `sk_...` |
| `SENTRY_DSN` | No | Error tracking DSN (optional) | `https://...@sentry.io/...` |

---

## 3. Render Deployment Steps

1. Connect your GitHub / GitLab repository to Render.
2. Select **Web Service**.
3. Choose **Node** environment.
4. Set Build Command:
   ```bash
   npm install && npm run build
   ```
5. Set Start Command:
   ```bash
   npm run start
   ```
6. Add all environment variables listed above.
7. Configure Health Check Path:
   ```
   /api/health
   ```
8. Deploy! Render will build the Next.js standalone bundle and route traffic to port `3000`.

---

## 4. Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ordermind:latest .
docker run -p 3000:3000 --env-file .env.production ordermind:latest
```
