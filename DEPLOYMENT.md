# Deployment Guide for DART-A

## Mac Mini Deployment (Recommended)

Due to SSE (Server-Sent Events) streaming issues with Podman's gvproxy on macOS, we now deploy directly on the host without containers.

### Prerequisites

- Node.js installed on Mac mini
- PostgreSQL database running
- Port 3100 available

### Quick Deploy

1. **Clean up any existing Podman containers** (if needed):
   ```bash
   ./cleanup-podman-mini.sh
   ```

2. **Deploy directly to Mac mini**:
   ```bash
   ./deploy-to-mini-direct.sh
   ```

3. **Access the application**:
   - From network: http://10.10.2.11:3100
   - Via SSH tunnel: 
     ```bash
     ssh -L 3100:localhost:3100 mini
     # Then visit: http://localhost:3100
     ```

### Process Management

The application runs under PM2 for reliability:

```bash
# View logs
ssh mini "pm2 logs dart-a"

# Monitor
ssh mini "pm2 monit"

# Restart
ssh mini "pm2 restart dart-a"

# Stop
ssh mini "pm2 stop dart-a"

# Status
ssh mini "pm2 list"
```

### Manual Deployment

If you prefer to deploy manually:

```bash
ssh mini
cd ~/deploy/dart-a
git pull
npm install
npm run build
PORT=3100 pm2 start npm --name "dart-a" -- start
```

## Why No Containers?

Podman on macOS uses `gvproxy` for network proxying between the host and containers. This proxy has a 2KB buffer limit that truncates SSE streaming data, causing JSON parsing errors. Running directly on the host avoids this issue entirely.

### If You Must Use Containers

Consider:
1. **Docker Desktop** instead of Podman (different networking stack)
2. **Linux host** where Podman doesn't need gvproxy
3. Implement WebSockets instead of SSE

## Environment Variables

Create `.env.local` with:

```env
# Database
DATABASE_URL=postgresql://eric@localhost:5432/dart

# API Keys
ANTHROPIC_API_KEY=your-api-key-here

# App Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://10.10.2.11:3100
PORT=3100
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3100
lsof -ti:3100 | xargs kill -9
```

### PM2 Not Found
```bash
npm install -g pm2
```

### Database Connection Issues
Ensure PostgreSQL is running and accessible:
```bash
psql -U eric -d dart -c "SELECT 1"
```