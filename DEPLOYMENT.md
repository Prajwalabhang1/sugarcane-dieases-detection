# Deployment Guide
## Sugarcane Disease Detection - Docker Deployment

This guide covers deploying the Sugarcane Disease Detection application using Docker.

## Prerequisites

- Docker Desktop (Windows) or Docker Engine (Linux)
- Docker Compose
- At least 4GB RAM available
- 10GB free disk space

### Install Docker (Windows)

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and restart computer
3. Start Docker Desktop
4. Verify installation: `docker --version`

## Local Deployment (Testing)

### Step 1: Prepare Environment

1. **Copy environment template:**
   ```bash
   copy .env.example .env
   ```

2. **Edit `.env` file:**
   - Set a secure `SECRET_KEY` (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
   - Configure `ALLOWED_IFRAME_PARENTS` (use `*` for testing)
   - Review other settings

### Step 2: Verify Model Files

Ensure the model file exists:
```
models/Final_Model.keras
```

If missing, train your model or download from your backup.

### Step 3: Deploy

#### Windows (Automated)

Double-click `scripts\deploy.bat` or run:
```cmd
scripts\deploy.bat
```

#### Linux/Mac

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

#### Manual Deployment

```bash
# Build the image
docker-compose build

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f sugarcane-app
```

### Step 4: Access Application

- **Local:** http://localhost:5000
- **Network:** http://YOUR_LOCAL_IP:5000

### Step 5: Test Embedding

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Embedding</title>
</head>
<body>
    <h1>Embedded Disease Detection</h1>
    <iframe src="http://localhost:5000" width="100%" height="800px" frameborder="0" allow="camera"></iframe>
</body>
</html>
```

## VPS Production Deployment

### Step 1: Prepare VPS

1. **SSH into your VPS:**
   ```bash
   ssh user@your-vps-ip
   ```

2. **Install Docker (Ubuntu/Debian):**
   ```bash
   # Update packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   
   # Logout and login again
   ```

3. **Install Git:**
   ```bash
   sudo apt install git -y
   ```

### Step 2: Clone Repository

```bash
cd /home/your-user/
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Important settings for production:**
```bash
FLASK_CONFIG=production
SECRET_KEY=your-secure-secret-key-here
ALLOWED_IFRAME_PARENTS=https://yourdomain.com
PORT=5000
WORKERS=4
```

### Step 4: Deploy

```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 5: Configure Firewall

```bash
# Allow port 5000
sudo ufw allow 5000/tcp

# Or allow port 80/443 if using Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Step 6: Set Up Domain (Optional)

1. **Point domain to VPS IP** (in your DNS provider)
2. **Install Nginx** (for reverse proxy and SSL)

```bash
sudo apt install nginx -y
```

3. **Create Nginx configuration:**

```nginx
# /etc/nginx/sites-available/sugarcane
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

4. **Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/sugarcane /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

## Common Commands

### View Logs
```bash
docker-compose logs -f sugarcane-app
```

### Restart Application
```bash
docker-compose restart
```

### Stop Application
```bash
docker-compose stop
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Remove Everything
```bash
docker-compose down --volumes --rmi all
```

## Monitoring

### Check Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status": "healthy", "timestamp": "2025-12-19T..."}
```

### Check Resources
```bash
docker stats
```

### Disk Usage
```bash
docker system df
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs sugarcane-app
```

**Common issues:**
- Model file missing
- Invalid SECRET_KEY
- Port already in use

### Port Already in Use

**Find process:**
```bash
# Windows
netstat -ano | findstr :5000

# Linux
sudo lsof -i :5000
```

**Kill process:**
```bash
# Windows
taskkill /F /PID <process_id>

# Linux
sudo kill -9 <process_id>
```

### Out of Memory

**Increase Docker memory:**
- Docker Desktop → Settings → Resources → Memory
- Allocate at least 4GB

### Permission Denied

```bash
# Linux/Mac
sudo chown -R $USER:$USER .
```

## Backup & Restore

### Backup
```bash
# Backup uploads and logs
tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ logs/ .env

# Backup database (if using)
docker-compose exec postgres pg_dump -U user dbname > backup.sql
```

### Restore
```bash
# Restore files
tar -xzf backup-20251219.tar.gz

# Restore database
docker-compose exec -T postgres psql -U user dbname < backup.sql
```

## Performance Tuning

### Adjust Workers

In `.env`:
```bash
WORKERS=4  # Recommended: Number of CPU cores
```

### Resource Limits

In `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
    reservations:
      cpus: '1.0'
      memory: 2G
```

## Security Best Practices

1. ✅ Use strong `SECRET_KEY`
2. ✅ Enable HTTPS in production
3. ✅ Set specific `ALLOWED_IFRAME_PARENTS`
4. ✅ Keep Docker and packages updated
5. ✅ Use firewall to restrict ports
6. ✅ Regular backups
7. ✅ Monitor logs for suspicious activity

## Support

For issues:
1. Check application logs
2. Verify Docker is running
3. Check health endpoint
4. Review this guide
5. Check GitHub issues

## Next Steps

After successful deployment:
1. ✅ Test all features
2. ✅ Set up SSL/HTTPS
3. ✅ Configure monitoring
4. ✅ Set up automatic backups
5. ✅ Test iframe embedding (see IFRAME_INTEGRATION.md)
