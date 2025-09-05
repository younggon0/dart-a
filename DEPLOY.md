# DART-E Deployment Guide

## Overview
Deploy DART-E (Next.js frontend) alongside DART (Streamlit) on Mac mini using Podman containers.

## Architecture
```
Mac mini Host
├── PostgreSQL (port 5432) - Shared database
├── Podman Containers
│   ├── dart-intelligence (port 8501) - Original DART Streamlit
│   ├── dart-e-intelligence (port 3000) - DART-E Next.js
│   └── dart-e-redis (port 6379) - Cache for DART-E
└── Network: dart_dart-network (shared)
```

## Prerequisites
1. DART already deployed on Mac mini
2. PostgreSQL configured to accept container connections
3. Git repository for DART-E (optional)

## Deployment Steps

### 1. Initial Setup (One-time)

#### On your local machine:
```bash
# 1. Ensure the app builds successfully
npm run build

# 2. Test the Docker build locally (optional)
docker build -t dart-e .
```

#### On Mac mini:
```bash
# 1. Create deployment directory
mkdir -p ~/deploy/dart-e
cd ~/deploy/dart-e

# 2. Copy source code (if not using Git)
# From your local machine:
rsync -avz --exclude node_modules --exclude .next /path/to/dart-e/ user@mini:~/deploy/dart-e/

# 3. Create .env.local
cp .env.example .env.local
vim .env.local
# Update:
# - DATABASE_URL to use host.containers.internal
# - Add your ANTHROPIC_API_KEY
# - Set NEXT_PUBLIC_APP_URL to http://10.10.2.11:3000
```

### 2. Deploy

#### Using the deployment script:
```bash
# From your local machine
./deploy-to-mini.sh
```

#### Or manually on Mac mini:
```bash
cd ~/deploy/dart-e

# Build and start containers
podman-compose build
podman-compose up -d

# Check status
podman-compose ps
podman-compose logs -f dart-e
```

## Configuration

### Database Connection
The container uses `host.containers.internal` to connect to PostgreSQL on the host:
```
DATABASE_URL=postgresql://eric@host.containers.internal:5432/dart
```

### Network
DART-E joins the existing network from DART deployment:
```yaml
networks:
  dart-network:
    external: true
    name: dart_dart-network
```

## Access

- **DART-E**: http://10.10.2.11:3000 (or http://mini:3000)
- **Original DART**: http://10.10.2.11:8501
- **Redis**: redis://10.10.2.11:6379

## Maintenance

### View logs:
```bash
podman-compose logs -f dart-e
```

### Restart services:
```bash
podman-compose restart dart-e
```

### Update deployment:
```bash
git pull  # If using Git
podman-compose build dart-e
podman-compose up -d dart-e
```

### Stop services:
```bash
podman-compose stop
```

### Remove containers:
```bash
podman-compose down
```

## Troubleshooting

### Container can't connect to PostgreSQL
1. Check PostgreSQL is listening on all interfaces:
   ```bash
   grep listen_addresses /opt/homebrew/var/postgresql@17/postgresql.conf
   ```

2. Verify pg_hba.conf allows container network:
   ```bash
   grep 10.89 /opt/homebrew/var/postgresql@17/pg_hba.conf
   ```

3. Test connection from container:
   ```bash
   podman exec dart-e-intelligence \
     psql postgresql://eric@host.containers.internal:5432/dart -c "SELECT 1"
   ```

### Build fails
1. Check Node.js version in Dockerfile matches your app requirements
2. Ensure all dependencies are in package.json
3. Verify next.config.ts has `output: 'standalone'`

### App not accessible
1. Check firewall settings on Mac mini
2. Verify container is running: `podman ps`
3. Check port binding: `podman port dart-e-intelligence`

## Performance Tips

1. **Redis Caching**: The deployment includes Redis for caching API responses
2. **Resource Limits**: Add to docker-compose.yml if needed:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

3. **Health Checks**: Monitor endpoint at http://10.10.2.11:3000/api/health

## Security Notes

1. Never commit `.env.local` to Git
2. Use strong API keys
3. Consider adding nginx reverse proxy for production
4. Enable HTTPS for external access