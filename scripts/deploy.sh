#!/bin/bash
# Deployment script for Sugarcane Disease Detection
# Usage: ./deploy.sh

set -e  # Exit on error

echo "=========================================="
echo "🌾 ऊस एकरी १०० टन - Deployment Script"
echo "🏢 Chordz Technologies"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker  is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
    echo "   Especially set a secure SECRET_KEY!"
    echo ""
    read -p "Press Enter to continue after updating .env file, or Ctrl+C to exit..."
fi

# Check if model file exists
if [ ! -f models/Final_Model.keras ]; then
    echo "❌ Model file not found: models/Final_Model.keras"
    echo "   Please ensure the trained model is in the models directory."
    exit 1
fi

echo ""
echo "🔨 Building Docker image..."
docker-compose build

echo ""
echo "🚀 Starting containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Health check
echo "🏥 Checking application health..."
if curl -f http://localhost:5000/api/health &> /dev/null; then
    echo "✅ Application is healthy!"
else
    echo "⚠️  Health check failed. Checking logs..."
    docker-compose logs sugarcane-app
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Deployment successful!"
echo "=========================================="
echo ""
echo "📱 Access the application:"
echo "   Local: http://localhost:5000"
echo "   Network: http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f sugarcane-app"
echo "   Stop app: docker-compose stop"
echo "   Restart: docker-compose restart"
echo "   Remove: docker-compose down"
echo ""
echo "🎯 To embed in your app, use:"
echo '   <iframe src="http://your-server-ip:5000" width="100%" height="800px"></iframe>'
echo ""
