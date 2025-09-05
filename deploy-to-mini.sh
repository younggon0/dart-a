#!/bin/bash

# Deploy DART-E to Mac mini via Git

MINI_HOST="mini"
MINI_USER=$USER  # Your username on Mac mini
PROJECT_PATH="~/deploy/dart-e"
GIT_REPO="git@github.com:younggon0/dart-e.git"

echo "🚀 Deploying DART-E to Mac mini"

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
    
    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
        echo "📝 Creating .env.local file..."
        cat > .env.local << 'EOF'
# Database - use host.containers.internal for container to host connection
DATABASE_URL=postgresql://eric@host.containers.internal:5432/dart

# Claude API
ANTHROPIC_API_KEY=your-api-key-here

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
    podman-compose down 2>/dev/null || true
    podman-compose build
    podman-compose up -d
    
    # Check status
    podman-compose ps
    
    echo "✅ Deployment complete!"
    echo "🌐 DART-E available at: http://10.10.2.11:3000"
    echo "📊 Original DART at: http://10.10.2.11:8501"
ENDSSH