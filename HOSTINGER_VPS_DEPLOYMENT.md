# Hostinger VPS Deployment Guide
## Complete Step-by-Step Instructions for Ubuntu

This guide will help you deploy the Sugarcane Disease Detection application on your Hostinger VPS running Ubuntu.

---

## Prerequisites

- Hostinger VPS with Ubuntu (you have this ✅)
- SSH access to your VPS
- Your VPS IP address
- Domain name (optional but recommended)

---

## Part 1: Initial VPS Setup

### Step 1: Connect to Your VPS

Open your terminal and connect via SSH:

```bash
ssh root@YOUR_VPS_IP
# Replace YOUR_VPS_IP with your actual Hostinger VPS IP address
```

Enter your password when prompted.

### Step 2: Update System Packages

```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y
```

### Step 3: Install Docker

```bash
# Install required packages
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify Docker installation
docker --version
```

Expected output: `Docker version 24.x.x, build...`

### Step 4: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

Expected output: `Docker Compose version v2.x.x`

### Step 5: Install Git

```bash
sudo apt install -y git

# Verify
git --version
```

---

## Part 2: Deploy Your Application

### Step 6: Upload Your Project Files

You have TWO options:

#### **Option A: Using Git (Recommended if you have GitHub)**

```bash
# Navigate to home directory
cd /root

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Navigate to project
cd YOUR_REPO_NAME
```

#### **Option B: Upload Files Manually (If no GitHub)**

On your local PC:

```bash
# Open PowerShell or Command Prompt
# Navigate to your project folder
cd c:\Users\prajw\OneDrive\Desktop\agriclinic\hosting\AI_sugarcane_Detection

# Create a zip file (you'll need to do this manually or use 7zip)
# Then upload using SFTP or Hostinger File Manager
```

Or use **WinSCP** or **FileZilla**:
1. Connect to your VPS (IP, port 22, username: root)
2. Upload the entire project folder to `/root/AI_sugarcane_Detection`

Then on VPS:
```bash
cd /root/AI_sugarcane_Detection
```

### Step 7: Create Production Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
nano .env
```

**Update these values in the `.env` file:**

```bash
# Change this line:
SECRET_KEY=your-super-secret-key-change-this-in-production

# To a secure random key (generate one):
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

# Or manually paste a random string like:
SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Update iframe settings:
ALLOWED_IFRAME_PARENTS=*
# Or for production with your domain:
# ALLOWED_IFRAME_PARENTS=https://yourdomain.com,https://www.yourdomain.com

# Set workers for production:
WORKERS=4
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 8: Verify Project Files

```bash
# Check if all files are present
ls -la

# You should see:
# - Dockerfile
# - docker-compose.yml
# - .env
# - requirements.txt
# - models/Final_Model.keras
# - app/
# - static/
# - templates/
```

**Important:** Make sure your model file exists:

```bash
ls -lh models/Final_Model.keras
```

If the model is missing, you'll need to upload it separately.

---

## Part 3: Build and Run Docker Container

### Step 9: Build the Docker Image

```bash
# This will take 10-15 minutes (downloads TensorFlow 620MB)
docker-compose build

# Monitor progress
# You'll see packages being downloaded and installed
```

**Note:** This is a ONE-TIME process. Subsequent starts will be fast.

### Step 10: Start the Application

```bash
# Start in detached mode (runs in background)
docker-compose up -d

# Check if container is running
docker-compose ps
```

Expected output:
```
NAME                          IMAGE               STATUS
sugarcane-disease-detection   ...                 Up (healthy)
```

### Step 11: Verify Application is Running

```bash
# Check container logs
docker-compose logs -f sugarcane-app

# Press Ctrl+C to exit logs

# Test health endpoint
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"healthy","timestamp":"2025-12-19T..."}
```

### Step 12: Configure Firewall

```bash
# Allow port 5000 through firewall
sudo ufw allow 5000/tcp

# Or if you haven't enabled UFW yet:
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 5000/tcp  # Your app
sudo ufw status
```

---

## Part 4: Access Your Application

Your application is now accessible at:

**http://YOUR_VPS_IP:5000**

For example: `http://123.456.789.012:5000`

Test it:
1. Open your browser
2. Go to `http://YOUR_VPS_IP:5000`
3. You should see the Sugarcane Disease Detection interface!

---

## Part 5 (Optional): Set Up Domain & HTTPS

### Step 13: Point Domain to VPS

In your domain registrar (Namecheap, GoDaddy, etc.):

1. Create an **A Record**:
   - Type: `A`
   - Name: `@` (for yourdomain.com)
   - Value: `YOUR_VPS_IP`
   - TTL: `300`

2. Create another **A Record** for www:
   - Type: `A`
   - Name: `www`
   - Value: `YOUR_VPS_IP`
   - TTL: `300`

Wait 5-30 minutes for DNS propagation.

### Step 14: Install Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 15: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/sugarcane
```

**Paste this configuration** (replace `yourdomain.com`):

```nginx
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

**Save and exit** (`Ctrl+X`, `Y`, `Enter`)

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/sugarcane /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Allow HTTP/HTTPS through firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Now access via: **http://yourdomain.com**

### Step 16: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)
```

**Done!** Your site is now available at:
- **https://yourdomain.com** ✅ (with SSL)

### Step 17: Auto-Renew SSL Certificate

```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal is already set up via cron
```

---

## Part 6: Manage Your Application

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop application
docker-compose stop

# Start application
docker-compose start

# Restart application
docker-compose restart

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check container status
docker-compose ps

# Check resource usage
docker stats
```

### Update Your Application

```bash
# Pull latest code (if using Git)
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

---

## Part 7: Embed in Your Existing Application

Once deployed, embed in your existing app using:

```html
<iframe src="https://yourdomain.com" 
        width="100%" 
        height="800px" 
        frameborder="0" 
        allow="camera; microphone">
</iframe>
```

Or without domain:

```html
<iframe src="http://YOUR_VPS_IP:5000" 
        width="100%" 
        height="800px" 
        frameborder="0" 
        allow="camera; microphone">
</iframe>
```

**Update `.env` for iframe embedding:**

```bash
nano .env

# Change:
ALLOWED_IFRAME_PARENTS=https://your-main-app-domain.com

# Restart after changes:
docker-compose restart
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Check if port is already in use
sudo netstat -tulpn | grep 5000

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Can't access from browser

```bash
# Check firewall
sudo ufw status

# Check if container is running
docker-compose ps

# Check Nginx (if using)
sudo systemctl status nginx
sudo nginx -t
```

### Out of disk space

```bash
# Check disk space
df -h

# Clean up Docker
docker system prune -a
```

### Permission errors

```bash
# Fix permissions
sudo chown -R $USER:$USER /root/AI_sugarcane_Detection
```

---

## Summary Checklist

- [ ] Connected to VPS via SSH
- [ ] Installed Docker & Docker Compose
- [ ] Uploaded/cloned project files
- [ ] Created and configured `.env` file
- [ ] Built Docker image (`docker-compose build`)
- [ ] Started container (`docker-compose up -d`)
- [ ] Configured firewall (port 5000)
- [ ] Tested application (http://VPS_IP:5000)
- [ ] (Optional) Set up domain
- [ ] (Optional) Installed Nginx
- [ ] (Optional) Got SSL certificate
- [ ] Application accessible and working!

---

## Need Help?

**Check logs:**
```bash
docker-compose logs -f sugarcane-app
```

**Restart application:**
```bash
docker-compose restart
```

**Full reset:**
```bash
docker-compose down
docker-compose up -d --build
```

---

## Your Application URLs

After deployment:

- **Direct access:** `http://YOUR_VPS_IP:5000`
- **With domain:** `http://yourdomain.com` (or `https://` with SSL)
- **Health check:** `http://YOUR_VPS_IP:5000/api/health`
- **API endpoint:** `http://YOUR_VPS_IP:5000/api/predict`

---

🎉 **Congratulations!** Your Sugarcane Disease Detection app is now live on Hostinger VPS!
