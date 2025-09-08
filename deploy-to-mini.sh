#!/bin/bash

# Deploy DART-A (AI Analysis Platform) to Mac mini via Git

MINI_HOST="mini"
MINI_USER=$USER  # Your username on Mac mini
PROJECT_PATH="~/deploy/dart-a"
GIT_REPO="git@github.com:younggon0/dart-a.git"  # Update with your repo URL
APP_PORT="3100"  # Using 3100 since 3000 is taken by dart-e

echo "=€ Deploying DART-A (AI Analysis Platform) to Mac mini"

# Copy .env.local to Mac mini if it exists locally
if [ -f .env.local ]; then
    echo "=ä Copying .env.local to Mac mini..."
    ssh $MINI_USER@$MINI_HOST "mkdir -p ~/deploy/dart-a"
    scp .env.local $MINI_USER@$MINI_HOST:~/deploy/dart-a/.env.local
    echo " Environment file copied"
fi

# SSH to mini and deploy
echo "= Connecting to Mac mini..."
ssh $MINI_USER@$MINI_HOST << ENDSSH
    # Set PATH for Homebrew
    export PATH=/opt/homebrew/bin:\$PATH
    
    # Ensure deploy directory exists
    mkdir -p ~/deploy
    
    # Clone or pull latest code
    if [ ! -d ~/deploy/dart-a ]; then
        echo "=å Cloning repository..."
        cd ~/deploy
        git clone $GIT_REPO
    else
        echo "=å Pulling latest changes..."
        cd ~/deploy/dart-a
        git pull origin main 2>/dev/null || git pull origin master
    fi
    
    cd ~/deploy/dart-a
    
    # Check for .env.local (either copied from local or existing)
    if [ -f .env.local ]; then
        echo " Using existing .env.local"
    else
        echo "=Ý Creating template .env.local file..."
        cat > .env.local << 'EOF'
# Database - use host.containers.internal for container to host connection
DATABASE_URL=postgresql://eric@host.containers.internal:5432/dart

# Anthropic API Key (Required for AI agents)
ANTHROPIC_API_KEY=your-api-key-here

# App settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://10.10.2.11:3100
PORT=3100

# Optional: OpenAI API Key (for comparison/fallback)
# OPENAI_API_KEY=your-openai-key-here
EOF
        echo "   Please edit .env.local with your actual API keys"
        echo "   Required: ANTHROPIC_API_KEY for the AI agent system"
    fi
    
    # Ensure Podman is installed
    if ! command -v podman &> /dev/null; then
        echo "Installing Podman..."
        brew install podman
        podman machine init
        podman machine start
    fi
    
    if ! command -v podman-compose &> /dev/null; then
        echo "Installing podman-compose..."
        brew install podman-compose
    fi
    
    # Create docker-compose.yml if it doesn't exist
    if [ ! -f docker-compose.yml ]; then
        echo "=Ý Creating docker-compose.yml..."
        cat > docker-compose.yml << 'EOFDOCKER'
version: '3.8'

services:
  dart-a:
    container_name: dart-a-platform
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=production
      - PORT=3100
    env_file:
      - .env.local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3100/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - dart-network

networks:
  dart-network:
    name: dart-network
    external: true
EOFDOCKER
    fi
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f Dockerfile ]; then
        echo "=Ý Creating Dockerfile..."
        cat > Dockerfile << 'EOFDOCKER'
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3100

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3100

ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOFDOCKER
    fi
    
    # Ensure network exists (shared with other DART services)
    echo "< Ensuring Docker network exists..."
    podman network create dart-network 2>/dev/null || true
    
    # Build and run with Podman
    echo "=( Building and deploying..."
    
    # Stop existing containers
    echo "=æ Stopping existing containers..."
    podman-compose down 2>/dev/null || true
    
    # Build the container
    echo "<×  Building container image..."
    if ! podman-compose build; then
        echo "L Build failed! Check the error messages above."
        echo "Common issues:"
        echo "  - Missing dependencies in package.json"
        echo "  - TypeScript/ESLint errors"
        echo "  - Dockerfile issues"
        echo "  - Missing ANTHROPIC_API_KEY in .env.local"
        exit 1
    fi
    
    # Start containers
    echo "=€ Starting containers..."
    if ! podman-compose up -d; then
        echo "L Failed to start containers!"
        echo "Check logs with: podman-compose logs"
        exit 1
    fi
    
    # Wait for container to be ready
    echo "ó Waiting for services to start..."
    sleep 5
    
    # Check container health
    if ! podman-compose ps | grep -q "dart-a-platform.*Up"; then
        echo "   Warning: dart-a container may not be running properly"
        echo "=Ë Container status:"
        podman-compose ps
        echo ""
        echo "=Ü Recent logs:"
        podman-compose logs --tail=20 dart-a
        echo ""
        echo "= To debug, run: podman-compose logs -f dart-a"
        exit 1
    fi
    
    # Check health endpoint
    echo "<å Checking application health..."
    for i in {1..10}; do
        if curl -s -f http://localhost:3100/api/health > /dev/null 2>&1; then
            echo " Application is healthy!"
            break
        elif [ \$i -eq 10 ]; then
            echo "   Application health check failed after 10 attempts"
            echo "The container is running but the app may not be responding"
            echo "Check logs with: podman-compose logs dart-a"
            echo ""
            echo "Common issues:"
            echo "  - Missing ANTHROPIC_API_KEY in .env.local"
            echo "  - Database connection issues"
            echo "  - Port 3100 already in use"
        else
            echo "  Attempt \$i/10 - waiting..."
            sleep 2
        fi
    done
    
    # Success!
    echo " Deployment complete!"
    podman-compose ps
    echo ""
    echo "> DART-A (AI Analysis Platform) available at: http://10.10.2.11:3100"
    echo "=Ê DART-E (Earnings) at: http://10.10.2.11:3000"
    echo "=È Original DART at: http://10.10.2.11:8501"
    echo ""
    echo "=Ü View logs: podman-compose logs -f dart-a"
    echo "= Restart: podman-compose restart dart-a"
    echo "ù  Stop: podman-compose down"
ENDSSH

echo ""
echo "=Ì Local access after deployment:"
echo "   ssh -L 3100:localhost:3100 $MINI_USER@$MINI_HOST"
echo "   Then visit: http://localhost:3100"