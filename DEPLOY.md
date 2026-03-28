# AI Mafia — Deployment Guide

## Overview

Monorepo with 2 deployable services:
- **Server** (Bun + Hono + WebSocket) → Railway
- **Client** (React + Vite) → Vercel

---

## 1. Server Deployment (Railway)

### Prerequisites
- Railway account: https://railway.app
- Railway CLI: `npm i -g @railway/cli`

### Environment Variables (set in Railway Dashboard)

| Variable | Value | Required |
|----------|-------|----------|
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |
| `FISHJAM_URL` | `wss://<id>.fishjam.io` | Yes |
| `FISHJAM_MANAGEMENT_TOKEN` | Fishjam management token | Yes |
| `PORT` | `3001` | Yes |
| `NODE_ENV` | `production` | Yes |

### Deploy Steps

```bash
# 1. Login to Railway
railway login

# 2. Init project (from repo root)
cd mafia-ai
railway init

# 3. Link to service
railway service

# 4. Set env vars
railway variables set GEMINI_API_KEY=<key>
railway variables set FISHJAM_URL=wss://<id>.fishjam.io
railway variables set FISHJAM_MANAGEMENT_TOKEN=<token>
railway variables set PORT=3001
railway variables set NODE_ENV=production

# 5. Deploy
railway up
```

### Alternative: Deploy via GitHub
1. Go to https://railway.app/new
2. Connect GitHub repo
3. Set root directory: `/` (monorepo root)
4. Railway will detect the Dockerfile at `apps/server/Dockerfile`
5. Add environment variables in Dashboard → Variables

### Dockerfile
Already created at `apps/server/Dockerfile`. Uses `oven/bun:1.3` base image.

### Health Check
Server exposes `GET /health` → `{"status":"ok"}`.
Railway config (`apps/server/railway.toml`) is set to use this.

### What the server does
- WebSocket on `/ws` — game events + player connections
- REST API — room creation, bot management, Fishjam peer tokens
- Gemini Live API — AI game master voice (via Fishjam Agent)
- Game state — in-memory, resets on restart

### Important Notes
- Server needs persistent WebSocket connections — ensure Railway doesn't kill idle connections
- In-memory state means restarting loses all active games
- The Fishjam Agent connects server → Fishjam Cloud → Gemini, so server needs outbound WebSocket access

---

## 2. Client Deployment (Vercel)

### Prerequisites
- Vercel account: https://vercel.com
- Vercel CLI: `npm i -g vercel`

### Environment Variables (set in Vercel Dashboard)

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_SERVER_WS_URL` | `wss://<railway-url>/ws` | Yes |
| `VITE_FISHJAM_ID` | Fishjam ID (from fishjam.io dashboard) | Yes |

### Deploy Steps

```bash
# 1. Build client
cd apps/client
VITE_SERVER_WS_URL=wss://<railway-server-url>/ws \
VITE_FISHJAM_ID=<fishjam-id> \
bun run build

# 2. Deploy to Vercel
npx vercel --prod
```

### Alternative: Deploy via GitHub
1. Go to https://vercel.com/new
2. Import GitHub repo
3. Framework Preset: Vite
4. Root Directory: `apps/client`
5. Build Command: `cd ../.. && bun install && cd apps/client && bun run build`
6. Output Directory: `dist`
7. Add environment variables in Settings → Environment Variables

### Important Notes
- Client is a static SPA — no server-side rendering
- WebSocket URL must use `wss://` (not `ws://`) for production
- Fishjam ID is the subdomain from your Fishjam Cloud URL: `https://<ID>.fishjam.io`

---

## 3. Fishjam Cloud Setup

1. Go to https://fishjam.io and create an account
2. Create an app in the dashboard
3. Copy:
   - **Fishjam ID** — the ID shown in the URL (`<id>.fishjam.io`)
   - **Management Token** — from API tokens section
4. Use these values in both server and client env vars

---

## 4. Post-Deploy Checklist

- [ ] Server health check: `curl https://<railway-url>/health` → `{"status":"ok"}`
- [ ] Client loads: `https://<vercel-url>/`
- [ ] WebSocket connects (check browser console for `Connected to server`)
- [ ] Create room and join — player appears in list
- [ ] Video works (Fishjam camera)
- [ ] Start game with bots — Gemini speaks
- [ ] Full game loop: night → day → voting → game over

---

## 5. Troubleshooting

### WebSocket connection fails
- Check `VITE_SERVER_WS_URL` uses `wss://` not `ws://`
- Check Railway service is running and port is exposed
- Check CORS — server uses `cors()` middleware

### Gemini doesn't speak
- Check `GEMINI_API_KEY` is valid
- Check server logs for `[AgentBridge:gemini] Session opened`
- Gemini has rate limits — check Google AI Studio quota

### Video doesn't work
- Check `VITE_FISHJAM_ID` matches the Fishjam dashboard
- Check `FISHJAM_URL` and `FISHJAM_MANAGEMENT_TOKEN` on server
- Check browser allows camera/microphone permissions

### Bots don't respond
- Check `GEMINI_API_KEY` — bot agents use Gemini Text API
- Check server logs for `[Bot:Alexa]` entries

---

## Architecture Summary

```
Users ──→ Vercel (React SPA)
           │
           │ WebSocket (wss://)
           ▼
         Railway (Bun server)
           │
           ├──→ Fishjam Cloud (WebRTC video + Agent audio)
           │      │
           │      └──→ Gemini Live API (voice AI)
           │
           └──→ Gemini Text API (bot agents)
```
