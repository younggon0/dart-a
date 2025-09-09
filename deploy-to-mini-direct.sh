#!/bin/bash

# Deploy DART-A (AI Analysis Platform) to Mac mini - Direct (No Container)

MINI_HOST="mini"
MINI_USER=$USER  # Your username on Mac mini
PROJECT_PATH="~/deploy/dart-a"
GIT_REPO="git@github.com:younggon0/dart-a.git"  # Update with your repo URL
APP_PORT="3100"

echo "🚀 Deploying DART-A (AI Analysis Platform) to Mac mini (Direct Mode)"
echo "📦 This will run directly on the host, not in a container"

# Copy .env.local to Mac mini if it exists locally
if [ -f .env.local ]; then
    echo "📤 Copying .env.local to Mac mini..."
    ssh $MINI_USER@$MINI_HOST "mkdir -p ~/deploy/dart-a"
    scp .env.local $MINI_USER@$MINI_HOST:~/deploy/dart-a/.env.local
    echo "✅ Environment file copied"
fi

# SSH to mini and deploy
echo "🔌 Connecting to Mac mini..."
ssh $MINI_USER@$MINI_HOST << 'ENDSSH'
    # Load NVM if available
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Ensure we have Node
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found! Please install Node.js first"
        exit 1
    fi
    
    echo "📍 Node version: $(node --version)"
    echo "📍 NPM version: $(npm --version)"
    
    # Ensure deploy directory exists
    mkdir -p ~/deploy
    
    # Clone or pull latest code
    if [ ! -d ~/deploy/dart-a ]; then
        echo "📥 Cloning repository..."
        cd ~/deploy
        git clone git@github.com:younggon0/dart-a.git
    else
        echo "📥 Pulling latest changes..."
        cd ~/deploy/dart-a
        git pull origin main 2>/dev/null || git pull origin master
    fi
    
    cd ~/deploy/dart-a
    
    # Check for .env.local
    if [ -f .env.local ]; then
        echo "✅ Using existing .env.local"
    else
        echo "📝 Creating template .env.local file..."
        cat > .env.local << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://eric@localhost:5432/dart

# Anthropic API Key (Required for AI agents)
ANTHROPIC_API_KEY=your-api-key-here

# App settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://10.10.2.11:3100
PORT=3100
EOF
        echo "⚠️  Please edit .env.local with your actual API keys"
        echo "   Required: ANTHROPIC_API_KEY for the AI agent system"
    fi
    
    # Stop any existing Node process on port 3100
    echo "🛑 Stopping any existing process on port $APP_PORT..."
    lsof -ti:3100 | xargs kill -9 2>/dev/null || true
    
    # Also stop any PM2 processes if they exist
    if command -v pm2 &> /dev/null; then
        pm2 stop dart-a 2>/dev/null || true
        pm2 delete dart-a 2>/dev/null || true
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Build the application
    echo "🔨 Building the application..."
    if ! npm run build; then
        echo "❌ Build failed! Check the error messages above."
        exit 1
    fi
    
    # Install PM2 if not already installed
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Installing PM2 for process management..."
        npm install -g pm2
    fi
    
    # Start the application with PM2
    echo "🚀 Starting application with PM2..."
    PORT=3100 pm2 start npm --name "dart-a" -- start
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 to start on boot (optional)
    # pm2 startup
    
    # Wait for app to start
    echo "⏳ Waiting for application to start..."
    sleep 5
    
    # Check if app is running
    if pm2 list | grep -q "dart-a.*online"; then
        echo "✅ Application is running!"
    else
        echo "⚠️ Application may not be running properly"
        echo "Check logs with: pm2 logs dart-a"
        pm2 logs dart-a --lines 20 --nostream
    fi
    
    # Check health endpoint
    echo "🏥 Checking application health..."
    for i in {1..10}; do
        if curl -s -f http://localhost:3100/api/health > /dev/null 2>&1; then
            echo "✅ Application is healthy!"
            break
        elif [ $i -eq 10 ]; then
            echo "⚠️ Application health check failed after 10 attempts"
            echo "The app is running but may not be responding properly"
            echo "Check logs with: pm2 logs dart-a"
        else
            echo "  Attempt $i/10 - waiting..."
            sleep 2
        fi
    done
    
    # Show status
    echo ""
    echo "✅ Deployment complete!"
    pm2 list
    echo ""
    echo "🌐 DART-A (AI Analysis Platform) available at: http://10.10.2.11:3100"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:     pm2 logs dart-a"
    echo "   Monitor:       pm2 monit"
    echo "   Restart:       pm2 restart dart-a"
    echo "   Stop:          pm2 stop dart-a"
    echo "   Status:        pm2 list"
ENDSSH

echo ""
echo "📱 Local access after deployment:"
echo "   Direct:    http://10.10.2.11:3100"
echo "   Tunnel:    ssh -L 3100:localhost:3100 $MINI_USER@$MINI_HOST"
echo "   Then visit: http://localhost:3100"