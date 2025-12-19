# Quick Fix: Upload Both Model Files to VPS

## Your Models Folder Has:
1. ✅ `Final_Model.keras` (9.8 MB) - Main TensorFlow model
2. ✅ `mobilenet.weights.h5` (9.4 MB) - MobileNet weights  
3. ✅ `class_mapping.json` (already on VPS)
4. ✅ `disease_solutions.json` (already on VPS)

**You need to upload BOTH model files!**

---

## Fastest Solution: Using Python HTTP Server + wget

### Step 1: On Your Windows PC (PowerShell)

```powershell
# Navigate to models folder
cd c:\Users\prajw\OneDrive\Desktop\agriclinic\hosting\AI_sugarcane_Detection\models

# Start HTTP server
python -m http.server 8888

# Keep this window open!
```

### Step 2: Open Windows Firewall (Allow Port 8888)

```powershell
# In ANOTHER PowerShell window (as Administrator)
netsh advfirewall firewall add rule name="Python Server" dir=in action=allow protocol=TCP localport=8888
```

### Step 3: On Your VPS Terminal

```bash
# Navigate to models directory
cd /root/sugarcane-app/models/

# Download Final_Model.keras
wget http://72.61.238.154:8888/Final_Model.keras

# Download mobilenet.weights.h5
wget http://72.61.238.154:8888/mobilenet.weights.h5

# Or if that doesn't work, try your local IP instead of VPS IP
```

**Wait! This won't work because your PC and VPS aren't on the same network.**

---

## BEST Solution: Use Base64 Encoding + Paste

### On Your PC (PowerShell):

```powershell
cd c:\Users\prajw\OneDrive\Desktop\agriclinic\hosting\AI_sugarcane_Detection\models

# Convert Final_Model.keras to base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("Final_Model.keras")) | Out-File final_model_base64.txt

# Convert mobilenet to base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("mobilenet.weights.h5")) | Out-File mobilenet_base64.txt
```

**This creates text files you can copy-paste, but they'll be huge (13MB+ text).**

---

## RECOMMENDED: Use This Simple Script

I'll create a script that uploads via VPS terminal directly!

### On Your VPS, run this:

```bash
cd /root/sugarcane-app/models/

# Create a script to download from a temporary host
cat > download_models.sh << 'EOF'
#!/bin/bash
# This will download the models from your GitHub release or temporary host

echo "Downloading Final_Model.keras..."
# You'll need to host these files temporarily or use GitHub Releases
wget -O Final_Model.keras "YOUR_DOWNLOAD_URL_HERE"

echo "Downloading mobilenet.weights.h5..."
wget -O mobilenet.weights.h5 "YOUR_DOWNLOAD_URL_HERE"

echo "Done! Models downloaded."
EOF

chmod +x download_models.sh
```

---

## EASIEST Solution: Use Transfer.sh (Temporary File Hosting)

### On Your PC (PowerShell):

```powershell
cd c:\Users\prajw\OneDrive\Desktop\agriclinic\hosting\AI_sugarcane_Detection\models

# Upload Final_Model.keras to transfer.sh (gets you a download URL)
curl --upload-file Final_Model.keras https://transfer.sh/Final_Model.keras

# It will return a URL like: https://transfer.sh/abc123/Final_Model.keras
# COPY THIS URL!

# Upload mobilenet.weights.h5
curl --upload-file mobilenet.weights.h5 https://transfer.sh/mobilenet.weights.h5

# COPY THIS URL TOO!
```

### Then on VPS:

```bash
cd /root/sugarcane-app/models/

# Download using the URLs you got
wget -O Final_Model.keras "https://transfer.sh/abc123/Final_Model.keras"
wget -O mobilenet.weights.h5 "https://transfer.sh/xyz456/mobilenet.weights.h5"

# Restart container
cd /root/sugarcane-app
docker-compose restart

# Verify
docker-compose exec sugarcane-app ls -lh /app/models/
```

---

## After Upload - Restart & Test

```bash
cd /root/sugarcane-app

# Restart
docker-compose restart

# Check models loaded
docker-compose logs sugarcane-app --tail=100

# Test
curl http://localhost:5000/api/health
```

**Then test in browser:** http://72.61.238.154:5000

---

**Try the transfer.sh method - it's the EASIEST!** Just run curl commands and get download URLs.

Let me know which method you want to use! 🚀
