@echo off
REM Deployment script for Windows
REM Sugarcane Disease Detection - Chordz Technologies

echo ==========================================
echo 🌾 ऊस एकरी १०० टन - Deployment Script
echo 🏢 Chordz Technologies
echo ==========================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️ .env file not found. Creating from .env.example...
    copy .env.example .env
    echo ✅ Created .env file. Please update it with your configuration.
    echo    Especially set a secure SECRET_KEY!
    echo.
    pause
)

REM Check if model file exists
if not exist models\Final_Model.keras (
    echo ❌ Model file not found: models\Final_Model.keras
    echo    Please ensure the trained model is in the models directory.
    pause
    exit /b 1
)

echo.
echo 🔨 Building Docker image...
docker-compose build

echo.
echo 🚀 Starting containers...
docker-compose up -d

echo.
echo ⏳ Waiting for application to start...
timeout /t 10 /nobreak >nul

REM Health check
echo 🏥 Checking application health...
curl -f http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Health check failed. Checking logs...
    docker-compose logs sugarcane-app
    pause
    exit /b 1
)

echo ✅ Application is healthy!

echo.
echo ==========================================
echo ✅ Deployment successful!
echo ==========================================
echo.
echo 📱 Access the application:
echo    Local: http://localhost:5000
echo.
echo 📋 Useful commands:
echo    View logs: docker-compose logs -f sugarcane-app
echo    Stop app: docker-compose stop
echo    Restart: docker-compose restart
echo    Remove: docker-compose down
echo.
echo 🎯 To embed in your app, use:
echo    ^<iframe src="http://your-server-ip:5000" width="100%%" height="800px"^>^</iframe^>
echo.
pause
