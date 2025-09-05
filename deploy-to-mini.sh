#!/bin/bash

# Deploy DART-E to Mac mini via Git

MINI_HOST="mini"
MINI_USER=$USER  # Your username on Mac mini
PROJECT_PATH="~/deploy/dart-e"
GIT_REPO="https://github.com/yourusername/dart-e.git"  # Replace with your repo URL

echo "🚀 Deploying DART-E to Mac mini"

# First, ensure git is initialized and push local changes
echo "📦 Preparing local repository..."
if [ ! -d .git ]; then
    git init
    git add .
    git commit -m "Initial commit"
fi

# Push to GitHub (if you have a remote setup)
# git push origin main

# SSH to mini and deploy
echo "🔗 Connecting to Mac mini..."
ssh $MINI_USER@$MINI_HOST << 'ENDSSH'
    # Set PATH for Homebrew
    export PATH=/opt/homebrew/bin:$PATH
    
    # Ensure deploy directory exists
    mkdir -p ~/deploy
    
    # Clone or pull latest code
    if [ ! -d ~/deploy/dart-e ]; then
        echo "📥 Cloning repository..."
        cd ~/deploy
        # For now, we'll use rsync since repo might not be on GitHub yet
        echo "Repository not found. Please set up Git repository first."
        exit 1
    else
        echo "📥 Pulling latest changes..."
        cd ~/deploy/dart-e
        git pull origin main
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
NEXT_PUBLIC_API_URL=http://10.10.2.11:3000
EOF
        echo "⚠️  Please edit .env.local with your actual API key"
    fi
    
    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    podman-compose down 2>/dev/null || true
    
    # Build and run with Podman
    echo "🔨 Building container..."
    podman-compose build
    
    echo "🚀 Starting services..."
    podman-compose up -d
    
    # Wait for service to be healthy
    echo "⏳ Waiting for service to be healthy..."
    sleep 5
    
    # Check if services are running
    podman-compose ps
    
    echo "✅ Deployment complete!"
    echo "🌐 Access DART-E at: http://10.10.2.11:3000"
    echo "📊 Original DART at: http://10.10.2.11:8501"
ENDSSH