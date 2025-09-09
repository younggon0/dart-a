#!/bin/bash

# Clean up Podman containers and free up ports on Mac mini

MINI_HOST="mini"
MINI_USER=$USER

echo "🧹 Cleaning up Podman containers on Mac mini..."

ssh $MINI_USER@$MINI_HOST << 'ENDSSH'
    echo "📍 Current Podman containers:"
    podman ps -a
    
    echo ""
    echo "🛑 Stopping all DART containers..."
    podman stop dart-a-platform 2>/dev/null || true
    podman stop dart-e 2>/dev/null || true
    podman stop dart 2>/dev/null || true
    
    echo "🗑️  Removing all DART containers..."
    podman rm dart-a-platform 2>/dev/null || true
    podman rm dart-e 2>/dev/null || true
    podman rm dart 2>/dev/null || true
    
    # Optional: Stop Podman machine to free all ports
    echo ""
    echo "🔌 Checking Podman machine status..."
    podman machine list
    
    read -p "Do you want to stop Podman machine to free all ports? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping Podman machine..."
        podman machine stop
        echo "✅ Podman machine stopped. All gvproxy ports are now free."
    else
        echo "ℹ️  Podman machine left running."
    fi
    
    echo ""
    echo "📊 Ports that were being used by gvproxy:"
    lsof -i :3000 2>/dev/null | grep gvproxy || echo "   Port 3000: Free"
    lsof -i :3100 2>/dev/null | grep gvproxy || echo "   Port 3100: Free"
    lsof -i :3200 2>/dev/null | grep gvproxy || echo "   Port 3200: Free"
    lsof -i :8501 2>/dev/null | grep gvproxy || echo "   Port 8501: Free"
    
    echo ""
    echo "✅ Cleanup complete!"
ENDSSH

echo ""
echo "🎯 Next steps:"
echo "   1. Deploy directly: ./deploy-to-mini-direct.sh"
echo "   2. Access at: http://10.10.2.11:3100"