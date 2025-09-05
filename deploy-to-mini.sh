#!/bin/bash

# Deploy DART-E to Mac mini via Git

MINI_HOST="mini"
MINI_USER=$USER  # Your username on Mac mini
PROJECT_PATH="~/deploy/dart-e"
GIT_REPO="git@github.com:younggon0/dart-e.git"

echo "🚀 Deploying DART-E to Mac mini"

# Copy .env.local to Mac mini if it exists locally
if [ -f .env.local ]; then
    echo "📤 Copying .env.local to Mac mini..."
    ssh $MINI_USER@$MINI_HOST "mkdir -p ~/deploy/dart-e"
    scp .env.local $MINI_USER@$MINI_HOST:~/deploy/dart-e/.env.local
    echo "✅ Environment file copied"
fi

# SSH to mini and deploy
echo "🔗 Connecting to Mac mini..."
ssh $MINI_USER@$MINI_HOST << ENDSSH
    # Set PATH for Homebrew
    export PATH=/opt/homebrew/bin:\$PATH
    
    # Ensure deploy directory exists
    mkdir -p ~/deploy
    
    # Clone or pull latest code
    if [ ! -d ~/deploy/dart-e ]; then
        echo "📥 Cloning repository..."
        cd ~/deploy
        git clone $GIT_REPO
    else
        echo "📥 Pulling latest changes..."
        cd ~/deploy/dart-e
        git pull origin main 2>/dev/null || git pull origin master
    fi
    
    cd ~/deploy/dart-e
    
    # Check for .env.local (either copied from local or existing)
    if [ -f .env.local ]; then
        echo "✅ Using existing .env.local"
    else
        echo "📝 Creating template .env.local file..."
        cat > .env.local << 'EOF'
# Database - use host.containers.internal for container to host connection
DATABASE_URL=postgresql://eric@host.containers.internal:5432/dart

# App settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://10.10.2.11:3000
EOF
        echo "⚠️  Please edit .env.local with your actual API key"
    fi
    
    # Ensure Podman is installed (same as DART)
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
    
    # Build and run with Podman
    echo "🔨 Building and deploying..."
    
    # Stop existing containers
    echo "📦 Stopping existing containers..."
    podman-compose down 2>/dev/null || true
    
    # Build the container
    echo "🏗️  Building container image..."
    if ! podman-compose build; then
        echo "❌ Build failed! Check the error messages above."
        echo "Common issues:"
        echo "  - Missing dependencies in package.json"
        echo "  - TypeScript/ESLint errors"
        echo "  - Dockerfile issues"
        exit 1
    fi
    
    # Start containers
    echo "🚀 Starting containers..."
    if ! podman-compose up -d; then
        echo "❌ Failed to start containers!"
        echo "Check logs with: podman-compose logs"
        exit 1
    fi
    
    # Wait for container to be ready
    echo "⏳ Waiting for services to start..."
    sleep 5
    
    # Check container health
    if ! podman-compose ps | grep -q "dart-e-intelligence.*Up"; then
        echo "⚠️  Warning: dart-e container may not be running properly"
        echo "📋 Container status:"
        podman-compose ps
        echo ""
        echo "📜 Recent logs:"
        podman-compose logs --tail=20 dart-e
        echo ""
        echo "🔍 To debug, run: podman-compose logs -f dart-e"
        exit 1
    fi
    
    # Check health endpoint
    echo "🏥 Checking application health..."
    for i in {1..10}; do
        if curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ Application is healthy!"
            break
        elif [ $i -eq 10 ]; then
            echo "⚠️  Application health check failed after 10 attempts"
            echo "The container is running but the app may not be responding"
            echo "Check logs with: podman-compose logs dart-e"
        else
            echo "  Attempt $i/10 - waiting..."
            sleep 2
        fi
    done
    
    # Success!
    echo "✅ Deployment complete!"
    podman-compose ps
    echo ""
    echo "🌐 DART-E available at: http://10.10.2.11:3000"
    echo "📊 Original DART at: http://10.10.2.11:8501"
    echo ""
    echo "📜 View logs: podman-compose logs -f dart-e"
ENDSSH