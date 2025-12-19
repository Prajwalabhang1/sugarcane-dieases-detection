# Quick Start Guide 🚀

## For Local Testing (Right Now!)

### Step 1: Create `.env` file
The `.env` file has been created. You can use it as-is for testing!

### Step 2: Check Model File
Ensure your model exists:
```
models/Final_Model.keras
```

### Step 3: Start Docker
Open Command Prompt and run:
```cmd
cd c:\Users\prajw\OneDrive\Desktop\agriclinic\hosting\AI_sugarcane_Detection

scripts\deploy.bat
```

Or run manually:
```cmd
docker-compose up --build
```

### Step 4: Access Application

**Standalone:** http://localhost:5000

**Embedded Test:** Open`test-embedding.html` in your browser

## Testing Checklist

- [ ] Docker builds successfully
- [ ] Container starts without errors
- [ ] Health endpoint works: http://localhost:5000/api/health
- [ ] Can access UI at http://localhost:5000
- [ ] Can upload image and get prediction
- [ ] Iframe embedding works (open test-embedding.html)
- [ ] Camera works (requires localhost for testing)

## If Something Goes Wrong

### Docker Not Found
- Install Docker Desktop from docker.com
- Restart computer after installation

### Port 5000 Already in Use
```cmd
netstat -ano | findstr :5000
taskkill /F /PID <process_id>
```

### Model Not Found
- Ensure `models/Final_Model.keras` exists
- Check file permissions

### View Logs
```cmd
docker-compose logs -f
```

## After Testing Locally

Once everything works:
1. ✅ Update `.env` with production values
2. ✅ Deploy to VPS (see DEPLOYMENT.md)
3. ✅ Get SSL certificate (required for camera in production)
4. ✅ Update `ALLOWED_IFRAME_PARENTS` with your domain
5. ✅ Embed in your existing app (see IFRAME_INTEGRATION.md)

## Key Files Created

- `Dockerfile` - Production image configuration
- `docker-compose.yml` - Container orchestration
- `.env` - Environment variables (ALREADY CREATED)
- `wsgi.py` - Production WSGI entry point
- `scripts/deploy.bat` - Automated deployment  
- `test-embedding.html` - Test iframe integration
- `DEPLOYMENT.md` - Full deployment guide
- `IFRAME_INTEGRATION.md` - Integration guide

## Quick Commands

```cmd
# Start
docker-compose up -d

# Stop
docker-compose stop

# Restart
docker-compose restart

# View logs
docker-compose logs -f

# Remove everything
docker-compose down
```

## Ready to Deploy to VPS?

See `DEPLOYMENT.md` for complete VPS deployment instructions!
