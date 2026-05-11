# Torque — Deployment Guide

## Architecture

```
Frontend (Vercel) ──HTTP──▶ Backend (Fly.io / Railway / VPS)
```

The frontend is a static Vite app deployable to Vercel. The backend requires a persistent server — it uses SQLite (file-based database) and Socket.IO (WebSocket for real-time logs), which don't work on Vercel's serverless infrastructure.

---

## Frontend — Vercel

### Setup

1. Push the frontend directory to a GitHub repo (or use the Vercel CLI).

2. In Vercel dashboard:
   - **Framework preset**: Vite
   - **Root directory**: `frontend/`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Environment variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://your-backend.com/api/v1` | Your deployed backend URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | From Clerk Dashboard > API Keys |

3. The `frontend/vercel.json` handles SPA routing automatically.

### Manual deploy

```bash
cd frontend
npx vercel --prod
```

---

## Backend — Options

The backend requires a persistent runtime. Choose one:

### Option A: Fly.io (Recommended)

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
cd backend

# Add healthcheck to the Dockerfile is already configured
fly launch --image node:22
fly secrets set JWT_SECRET="your-secret-32-chars-min!!"
fly secrets set ENCRYPTION_KEY="YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE="
fly secrets set FRONTEND_URL="https://your-frontend.vercel.app"
fly secrets set CLERK_SECRET_KEY="sk_test_..."
fly deploy
```

### Option B: Railway

```bash
# Connect GitHub repo → Railway
# Set build command: npm run build
# Set start command: node dist/index.js
# Add environment variables (same as above)
# Add volume mount for /app/data for SQLite persistence
```

### Option C: VPS (DigitalOcean / Linode)

```bash
git clone <repo>
cd torque/backend
npm install
npm run build

# Create systemd service or run via PM2:
npm install -g pm2
pm2 start dist/index.js --name torque --time

# Set up Caddy or Nginx as reverse proxy for HTTPS
```

### Required Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | — | 32+ char random string for JWT signing |
| `ENCRYPTION_KEY` | ✅ | — | 32-byte base64 key for AES-256-GCM credential encryption |
| `FRONTEND_URL` | ✅ | — | Your frontend deployment URL (for CORS) |
| `CLERK_SECRET_KEY` | ✅ | — | From Clerk Dashboard > API Keys |
| `PORT` | ❌ | `8000` | Server listen port |
| `DATA_DIR` | ❌ | `./data` | SQLite database file location |
| `LOG_LEVEL` | ❌ | `info` | Pino log level |

### Important Notes

- **SQLite persistence**: Mount the `DATA_DIR` directory as a persistent volume. On Fly.io, use `fly volumes create`. On Railway, add a volume mount. Without persistence, all workflows and credentials reset on every deploy.
- **Socket.IO**: Uses WebSocket for real-time log streaming. Ensure your reverse proxy/load balancer supports WebSocket upgrades.
- **Health checks**: `GET /health` returns `{"status":"ok","version":"0.1.0"}` — configure your platform to use this.

---

## Quick Deploy (Both Together)

```bash
# 1. Deploy backend first, get the URL
cd backend
fly launch
fly secrets set ...
fly deploy
# → https://torque-backend.fly.dev

# 2. Deploy frontend with backend URL
cd frontend
npx vercel --prod \
  --build-env VITE_API_BASE_URL=https://torque-backend.fly.dev/api/v1 \
  --env VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
# → https://torque.vercel.app
```
