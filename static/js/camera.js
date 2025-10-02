/* ================================================
   Camera Handler for ऊस एकरी १०० टन
   Professional camera integration with farmer-friendly features
   Chordz Technologies
   ================================================ */

const CameraHandler = {
    // Track last shown toast to prevent duplicates
    _lastToast: { message: '', type: '', timestamp: 0 },
    // Camera state
    state: {
        stream: null,
        video: null,
        canvas: null,
        isActive: false,
        currentFacingMode: 'environment', // Start with rear camera
        supportedConstraints: null,
        captureSettings: {
            width: 1920,
            height: 1080,
            quality: 0.9
        }
    },

    // Camera configuration
    config: {
        preferredFacingMode: 'environment', // Rear camera for better photos
        fallbackFacingMode: 'user',
        idealResolution: { width: 1920, height: 1080 },
        minResolution: { width: 640, height: 480 },
        frameRate: { ideal: 30, min: 15 },
        maxRetries: 3,
        timeoutDuration: 10000
    },

    // Messages in Marathi
    messages: {
        requesting: 'कॅमेरा वापरण्याची परवानगी मागत आहे...',
        starting: 'कॅमेरा सुरू करत आहे...',
        ready: 'कॅमेरा तयार! फोटो काढण्यासाठी बटण दाबा',
        noPermission: 'कॅमेरा वापरण्याची परवानगी नाही',
        noCamera: 'कॅमेरा सापडला नाही',
        error: 'कॅमेरा त्रुटी',
        photoTaken: 'फोटो यशस्वीरित्या काढला!',
        switchCamera: 'कॅमेरा बदलत आहे...',
        focusHelp: 'पानावर फोकस करण्यासाठी स्क्रीनवर टॅप करा'
    },

    // Initialize camera system
    async init() {
        console.log('🎥 Initializing Camera Handler...');
        
        try {
            // Get video and canvas elements
            this.state.video = document.getElementById('camera-video');
            this.state.canvas = document.getElementById('camera-canvas');
            
            if (!this.state.video || !this.state.canvas) {
                console.warn('Camera elements not found');
                return false;
            }
            
            // Check browser support
            if (!this.checkBrowserSupport()) {
                this.showToast('आपला ब्राउझर कॅमेरा सपोर्ट करत नाही', 'error');
                return false;
            }
            
            // Get supported constraints
            this.state.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Camera Handler initialized');
            return true;
            
        } catch (error) {
            console.error('Camera initialization failed:', error);
            return false;
        }
    },

    // Check browser support for camera features
    checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('getUserMedia not supported');
            return false;
        }
        
        if (!navigator.mediaDevices.enumerateDevices) {
            console.warn('enumerateDevices not supported');
            return false;
        }
        
        return true;
    },

    // Setup camera event listeners
    setupEventListeners() {
        const video = this.state.video;
        const captureBtn = document.getElementById('capture-btn');
        const closeBtn = document.getElementById('close-camera');
        const switchBtn = document.getElementById('switch-camera');
        
        if (video) {
            // Video events
            video.addEventListener('loadedmetadata', () => {
                this.onVideoReady();
            });
            
            video.addEventListener('error', (e) => {
                this.handleVideoError(e);
            });
            
            // Touch to focus (mobile)
            video.addEventListener('touchstart', (e) => {
                this.handleTouchFocus(e);
            });
            
            video.addEventListener('click', (e) => {
                this.handleTouchFocus(e);
            });
        }
        
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.capturePhoto();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.stopCamera();
            });
        }
        
        if (switchBtn) {
            switchBtn.addEventListener('click', () => {
                this.switchCamera();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.state.isActive) {
                if (e.key === ' ') {
                    e.preventDefault();
                    this.capturePhoto();
                } else if (e.key === 'c') {
                    e.preventDefault();
                    this.switchCamera();
                }
            }
        });
    },

    // Start camera with enhanced error handling
    async startCamera(retryCount = 0) {
        try {
            this.showToast(this.messages.requesting, 'info');
            
            // Get camera devices first
            const devices = await this.getCameraDevices();
            if (devices.length === 0) {
                throw new Error(this.messages.noCamera);
            }
            
            // Prepare constraints
            const constraints = this.buildConstraints();
            console.log('Camera constraints:', constraints);
            
            // Request camera access
            this.showToast(this.messages.starting, 'info');
            
            const stream = await this.requestCameraAccess(constraints);
            await this.setupVideoStream(stream);
            
            // Show camera container
            this.showCameraContainer();
            
            // Update state
            this.state.stream = stream;
            this.state.isActive = true;
            
            // Setup camera controls
            this.setupCameraControls(devices);
            
            // Show ready message
            this.showToast(this.messages.ready, 'success');
            
            // Add focus help for first-time users
            setTimeout(() => {
                if (this.state.isActive) {
                    this.showToast(this.messages.focusHelp, 'info', 3000);
                }
            }, 2000);
            
            // Analytics
            this.trackCameraUsage('camera_started');
            
        } catch (error) {
            console.error('Camera start error:', error);
            await this.handleCameraError(error, retryCount);
        }
    },

    // Get available camera devices
    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`Found ${videoDevices.length} camera devices`);
            return videoDevices;
            
        } catch (error) {
            console.error('Failed to get camera devices:', error);
            return [];
        }
    },

    // Build camera constraints
    buildConstraints() {
        const constraints = {
            video: {
                facingMode: this.state.currentFacingMode,
                width: { 
                    ideal: this.config.idealResolution.width,
                    min: this.config.minResolution.width
                },
                height: { 
                    ideal: this.config.idealResolution.height,
                    min: this.config.minResolution.height
                },
                frameRate: this.config.frameRate
            },
            audio: false
        };
        
        // Add advanced constraints if supported
        if (this.state.supportedConstraints) {
            if (this.state.supportedConstraints.focusMode) {
                constraints.video.focusMode = 'continuous';
            }
            
            if (this.state.supportedConstraints.exposureMode) {
                constraints.video.exposureMode = 'continuous';
            }
            
            if (this.state.supportedConstraints.whiteBalanceMode) {
                constraints.video.whiteBalanceMode = 'continuous';
            }
        }
        
        return constraints;
    },

    // Request camera access with timeout
    async requestCameraAccess(constraints) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('कॅमेरा एक्सेस टाइमआउट'));
            }, this.config.timeoutDuration);
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    clearTimeout(timeout);
                    resolve(stream);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    },

    // Setup video stream
    async setupVideoStream(stream) {
        const video = this.state.video;
        
        return new Promise((resolve, reject) => {
            video.srcObject = stream;
            
            video.onloadedmetadata = () => {
                video.play()
                    .then(() => resolve())
                    .catch(error => reject(error));
            };
            
            video.onerror = (error) => reject(error);
        });
    },

    // Show camera container with animation
    showCameraContainer() {
        const container = document.getElementById('camera-container');
        if (container) {
            container.classList.remove('hidden');
            
            // Animate in
            requestAnimationFrame(() => {
                container.style.opacity = '0';
                container.style.transform = 'scale(0.9)';
                
                requestAnimationFrame(() => {
                    container.style.transition = 'all 0.3s ease-out';
                    container.style.opacity = '1';
                    container.style.transform = 'scale(1)';
                });
            });
            
            // Auto-focus video for better accessibility
            setTimeout(() => {
                if (this.state.video) {
                    this.state.video.focus();
                }
            }, 500);
        }
    },

    // Setup camera controls based on available devices
    setupCameraControls(devices) {
        const switchBtn = document.getElementById('switch-camera');
        
        // Show/hide camera switch button
        if (switchBtn) {
            if (devices.length > 1) {
                switchBtn.style.display = 'inline-flex';
                switchBtn.title = 'कॅमेरा बदला (C)';
            } else {
                switchBtn.style.display = 'none';
            }
        }
        
        // Add camera info overlay
        this.showCameraInfo();
    },

    // Show camera information overlay
    showCameraInfo() {
        if (!this.state.stream) return;
        
        const track = this.state.stream.getVideoTracks()[0];
        const settings = track.getSettings();
        
        console.log('Camera settings:', settings);
        
        // Update camera info display if exists
        const cameraInfo = document.getElementById('camera-info');
        if (cameraInfo) {
            cameraInfo.textContent = `${settings.width}x${settings.height} @ ${settings.frameRate}fps`;
        }
    },

    // Handle video ready event
    onVideoReady() {
        const video = this.state.video;
        if (!video) return;
        
        console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
        
        // Update canvas size to match video
        this.updateCanvasSize();
        
        // Apply optimal settings
        this.optimizeVideoDisplay();
        
        // Start auto-focus if supported
        this.startAutoFocus();
    },

    // Update canvas size to match video
    updateCanvasSize() {
        const video = this.state.video;
        const canvas = this.state.canvas;
        
        if (video && canvas && video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            console.log(`Canvas updated: ${canvas.width}x${canvas.height}`);
        }
    },

    // Optimize video display for better quality
    optimizeVideoDisplay() {
        const video = this.state.video;
        if (!video) return;
        
        // Set optimal CSS properties
        video.style.objectFit = 'cover';
        video.style.width = '100%';
        video.style.height = '100%';
        
        // Apply image enhancement filters for better leaf detection
        video.style.filter = 'contrast(1.1) saturate(1.1)';
    },

    // Start auto-focus functionality
    startAutoFocus() {
        if (!this.state.stream) return;
        
        const track = this.state.stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            track.applyConstraints({
                advanced: [{ focusMode: 'continuous' }]
            }).catch(error => {
                console.warn('Auto-focus setup failed:', error);
            });
        }
    },

    // Handle touch to focus
    async handleTouchFocus(e) {
        e.preventDefault();
        
        if (!this.state.stream) return;
        
        const video = this.state.video;
        const rect = video.getBoundingClientRect();
        
        // Calculate focus point
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        const relativeX = x / rect.width;
        const relativeY = y / rect.height;
        
        // Show focus indicator
        this.showFocusIndicator(x, y);
        
        // Apply focus if supported
        const track = this.state.stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.focusMode) {
            try {
                await track.applyConstraints({
                    advanced: [{
                        focusMode: 'single-shot',
                        pointsOfInterest: [{ x: relativeX, y: relativeY }]
                    }]
                });
                
                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
                
            } catch (error) {
                console.warn('Manual focus failed:', error);
            }
        }
    },

    // Show focus indicator animation
    showFocusIndicator(x, y) {
        const video = this.state.video;
        if (!video) return;
        
        // Remove existing indicator
        const existing = document.querySelector('.focus-indicator');
        if (existing) existing.remove();
        
        // Create focus indicator
        const indicator = document.createElement('div');
        indicator.className = 'focus-indicator';
        indicator.style.cssText = `
            position: absolute;
            left: ${x - 25}px;
            top: ${y - 25}px;
            width: 50px;
            height: 50px;
            border: 2px solid #4CAF50;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: focusIndicator 1s ease-out forwards;
        `;
        
        // Add animation styles
        if (!document.getElementById('focus-indicator-styles')) {
            const style = document.createElement('style');
            style.id = 'focus-indicator-styles';
            style.textContent = `
                @keyframes focusIndicator {
                    0% { transform: scale(1.5); opacity: 0; }
                    50% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0.8); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to video container
        const container = document.querySelector('.camera-body');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(indicator);
            
            // Remove after animation
            setTimeout(() => {
                if (indicator.parentElement) {
                    indicator.remove();
                }
            }, 1000);
        }
    },

    // Capture photo with enhanced processing
    async capturePhoto() {
        if (!this.state.isActive || !this.state.video || !this.state.canvas) {
            this.showToast('कॅमेरा तयार नाही', 'warning');
            return null;
        }
        
        try {
            // Show capture animation
            this.showCaptureAnimation();
            
            // Capture frame
            const imageData = await this.captureFrame();
            
            // Process image
            const processedImage = await this.processCapture(imageData);
            
            // Hide camera and show preview
            this.stopCamera();
            
            // Update main app state
            if (window.SugarcaneApp && window.SugarcaneApp.state) {
                window.SugarcaneApp.state.currentImage = processedImage;
                window.SugarcaneApp.showImagePreview(processedImage);
            }
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 10, 50]);
            }
            
            this.showToast(this.messages.photoTaken, 'success');
            
            // Analytics
            this.trackCameraUsage('photo_captured');
            
            return processedImage;
            
        } catch (error) {
            console.error('Photo capture failed:', error);
            this.showToast('फोटो काढण्यात त्रुटी', 'error');
            return null;
        }
    },

    // Show capture animation
    showCaptureAnimation() {
        const video = this.state.video;
        if (!video) return;
        
        // Create flash overlay
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            opacity: 0.8;
            z-index: 1000;
            pointer-events: none;
            animation: cameraFlash 0.3s ease-out;
        `;
        
        // Add flash animation
        if (!document.getElementById('camera-flash-styles')) {
            const style = document.createElement('style');
            style.id = 'camera-flash-styles';
            style.textContent = `
                @keyframes cameraFlash {
                    0% { opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to camera body
        const container = document.querySelector('.camera-body');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(flash);
            
            setTimeout(() => {
                if (flash.parentElement) {
                    flash.remove();
                }
            }, 300);
        }
        
        // Camera shutter sound (if enabled)
        this.playCameraSound();
    },

    // Play camera shutter sound
    playCameraSound() {
        try {
            // Create audio context for shutter sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            
        } catch (error) {
            // Silent fail for audio
            console.warn('Camera sound failed:', error);
        }
    },

    // Capture frame from video
    async captureFrame() {
        const video = this.state.video;
        const canvas = this.state.canvas;
        
        if (!video || !canvas) {
            throw new Error('Video या Canvas उपलब्ध नाही');
        }
        
        // Ensure canvas matches video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        
        // Apply image enhancement before capture
        ctx.filter = 'contrast(1.1) saturate(1.15)';
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const dataURL = canvas.toDataURL('image/jpeg', this.state.captureSettings.quality);
        
        return {
            dataURL,
            width: canvas.width,
            height: canvas.height,
            timestamp: new Date().toISOString()
        };
    },

    // Process captured image
    async processCapture(imageData) {
        try {
            // Convert dataURL to blob for processing
            const response = await fetch(imageData.dataURL);
            const blob = await response.blob();
            
            // Create file object
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            // Process through main app image processor
            if (window.SugarcaneApp && window.SugarcaneApp.processImageFile) {
                return await window.SugarcaneApp.processImageFile(file);
            } else {
                // Fallback processing
                return {
                    original: file,
                    processed: imageData.dataURL,
                    canvas: this.state.canvas,
                    dimensions: { width: imageData.width, height: imageData.height },
                    originalDimensions: { width: imageData.width, height: imageData.height },
                    size: blob.size,
                    type: 'image/jpeg',
                    name: file.name,
                    processedSize: blob.size,
                    quality: { level: 'good', label: 'चांगली', score: 4 }
                };
            }
            
        } catch (error) {
            console.error('Image processing failed:', error);
            throw new Error('छायाचित्र प्रक्रिया अपयशी');
        }
    },

    // Switch camera (front/back)
    async switchCamera() {
        if (!this.state.isActive) return;
        
        try {
            this.showToast(this.messages.switchCamera, 'info');
            
            // Toggle facing mode
            this.state.currentFacingMode = this.state.currentFacingMode === 'environment' ? 'user' : 'environment';
            
            // Stop current stream
            if (this.state.stream) {
                this.state.stream.getTracks().forEach(track => track.stop());
            }
            
            // Start with new facing mode
            await this.startCamera();
            
            // Analytics
            this.trackCameraUsage('camera_switched', { facingMode: this.state.currentFacingMode });
            
        } catch (error) {
            console.error('Camera switch failed:', error);
            this.showToast('कॅमेरा बदलण्यात त्रुटी', 'error');
            
            // Revert to original facing mode
            this.state.currentFacingMode = this.state.currentFacingMode === 'environment' ? 'user' : 'environment';
        }
    },

    // Stop camera with cleanup
    stopCamera() {
        try {
            // Stop all tracks
            if (this.state.stream) {
                this.state.stream.getTracks().forEach(track => {
                    track.stop();
                });
                this.state.stream = null;
            }
            
            // Clear video source
            if (this.state.video) {
                this.state.video.srcObject = null;
            }
            
            // Hide camera container with animation
            const container = document.getElementById('camera-container');
            if (container && !container.classList.contains('hidden')) {
                container.style.transition = 'all 0.3s ease-out';
                container.style.opacity = '0';
                container.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    container.classList.add('hidden');
                    container.style.opacity = '';
                    container.style.transform = '';
                    container.style.transition = '';
                }, 300);
            }
            
            // Update state
            this.state.isActive = false;
            
            // Update main app state
            if (window.SugarcaneApp && window.SugarcaneApp.state) {
                window.SugarcaneApp.state.cameraActive = false;
            }
            
            console.log('📷 Camera stopped');
            
            // Analytics
            this.trackCameraUsage('camera_stopped');
            
        } catch (error) {
            console.error('Camera stop error:', error);
        }
    },

    // Pause camera (for page visibility changes)
    pauseCamera() {
        if (this.state.video && this.state.isActive) {
            this.state.video.pause();
        }
    },

    // Resume camera
    resumeCamera() {
        if (this.state.video && this.state.isActive) {
            this.state.video.play().catch(error => {
                console.warn('Camera resume failed:', error);
            });
        }
    },

    // Handle camera errors
    async handleCameraError(error, retryCount = 0) {
        console.error('Camera error:', error);
        
        let errorMessage = this.messages.error;
        let canRetry = false;
        
        // Determine error type and appropriate response
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = this.messages.noPermission;
            this.showPermissionHelp();
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage = this.messages.noCamera;
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage = 'कॅमेरा दुसऱ्या अॅपमध्ये वापरात आहे';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            errorMessage = 'कॅमेरा सेटिंग्ज सपोर्ट नाहीत';
            canRetry = true;
        } else if (error.name === 'TypeError') {
            errorMessage = 'कॅमेरा API समर्थित नाही';
        } else {
            canRetry = retryCount < this.config.maxRetries;
        }
        
        // Show error message
        this.showToast(errorMessage, 'error', 8000);
        
        // Retry with fallback settings
        if (canRetry && retryCount < this.config.maxRetries) {
            setTimeout(async () => {
                console.log(`Retrying camera access (attempt ${retryCount + 1})`);
                
                // Try with fallback settings
                if (retryCount === 1) {
                    this.state.currentFacingMode = this.config.fallbackFacingMode;
                }
                
                await this.startCamera(retryCount + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
            // Show alternative options
            this.showCameraAlternatives();
        }
        
        // Analytics
        this.trackCameraUsage('camera_error', { 
            error: error.name,
            message: error.message,
            retryCount 
        });
    },

    // Show permission help
    showPermissionHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'permission-help-modal';
        helpModal.innerHTML = `
            <div class="permission-help-content">
                <div class="permission-help-header">
                    <h3>कॅमेरा परवानगी आवश्यक</h3>
                </div>
                <div class="permission-help-body">
                    <p>छायाचित्र काढण्यासाठी कॅमेरा परवानगी द्या:</p>
                    <ol>
                        <li>ब्राउझर address bar मधील 🔒 आयकन क्लिक करा</li>
                        <li>"Camera" परवानगी "Allow" करा</li>
                        <li>पेज रीलोड करा</li>
                    </ol>
                    <p><strong>Alternative:</strong> Settings → Privacy → Camera मधून परवानगी द्या</p>
                </div>
                <div class="permission-help-footer">
                    <button class="btn btn-primary" onclick="location.reload()">
                        पेज रीलोड करा
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.permission-help-modal').remove()">
                        बंद करा
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
    },

    // Show camera alternatives
    showCameraAlternatives() {
        setTimeout(() => {
            if (window.SugarcaneApp && window.SugarcaneApp.showToast) {
                window.SugarcaneApp.showToast(
                    '💡 कॅमेरा काम करत नसल्यास गॅलरी वापरा',
                    'info',
                    6000
                );
            }
        }, 2000);
    },

    // Handle video errors
    handleVideoError(e) {
        console.error('Video error:', e);
        this.showToast('व्हिडिओ प्रदर्शनात त्रुटी', 'error');
    },

    // Update camera size on window resize
    updateCameraSize() {
        if (this.state.isActive) {
            this.updateCanvasSize();
            this.optimizeVideoDisplay();
        }
    },

    // Toggle camera (external interface)
    async toggleCamera() {
        if (this.state.isActive) {
            this.stopCamera();
        } else {
            // Initialize if needed
            if (!this.state.video) {
                const initialized = await this.init();
                if (!initialized) {
                    this.showToast('कॅमेरा सिस्टम तयार करता आली नाही', 'error');
                    return;
                }
            }
            
            await this.startCamera();
        }
    },

    // Utility functions
    showToast(message, type = 'info', duration = 5000) {
        // Always delegate to SugarcaneApp for toast logic (no duplicate suppression here)
        if (window.SugarcaneApp && window.SugarcaneApp.showToast) {
            window.SugarcaneApp.showToast(message, type, duration);
        } else {
            // Fallback: simple log
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },

    // Track camera usage analytics
    trackCameraUsage(event, data = {}) {
        try {
            // Basic analytics tracking
            const analyticsData = {
                event,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                deviceType: this.getDeviceType(),
                cameraFacing: this.state.currentFacingMode,
                ...data
            };
            
            console.log('Camera Analytics:', analyticsData);
            
            // Store in local storage for later analysis
            const analytics = JSON.parse(localStorage.getItem('camera-analytics') || '[]');
            analytics.push(analyticsData);
            
            // Keep only last 100 events
            analytics.splice(100);
            
            localStorage.setItem('camera-analytics', JSON.stringify(analytics));
            
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
    },

    // Get device type for analytics
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/tablet|ipad/i.test(userAgent)) return 'tablet';
        if (/mobile|iphone|android/i.test(userAgent)) return 'mobile';
        return 'desktop';
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    CameraHandler.init();
    // Add event listener for camera open button
    const openCameraBtn = document.getElementById('camera-btn');
    if (openCameraBtn) {
        openCameraBtn.addEventListener('click', () => {
            CameraHandler.toggleCamera();
        });
    }
});

// Export for global access
window.CameraHandler = CameraHandler;
