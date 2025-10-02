/* ================================================
   ऊस एकरी १०० टन - Complete Application JavaScript
   Professional AI-powered Sugarcane Disease Detection
   Chordz Technologies - Farmer-Friendly Interface
   ================================================ */

// Global App Namespace
const SugarcaneApp = {
  // Track last shown toast to prevent duplicates
  _lastToast: { message: '', type: '', timestamp: 0 },
  // Configuration
  config: {
    apiUrl: "/api/predict",
    healthUrl: "/api/health",
    supportUrl: "/api/farmer-support",
    diseasesUrl: "/api/all-diseases",
    language: "marathi",
    farmerMode: true,
    autoCheckHealth: true,
    maxFileSize: 16 * 1024 * 1024, // 16MB
    supportedFormats: ["jpg", "jpeg", "png", "bmp", "gif"],
    predictionTimeout: 30000, // 30 seconds
    healthCheckInterval: 60000, // 1 minute
  },

  // State Management
  state: {
    isOnline: navigator.onLine,
    systemHealth: null,
    currentImage: null,
    currentPrediction: null,
    isProcessing: false,
    cameraActive: false,
    lastHealthCheck: null,
    userPreferences: {},
    failedRequests: [],
  },

  // Messages in Marathi & English
  messages: {
    marathi: {
      // System messages
      loading: "कृपया थांबा...",
      processing: "AI आपल्या पिकाचे विश्लेषण करत आहे",
      success: "यश! निदान पूर्ण झाले",
      error: "काहीतरी चूक झाली",

      // File messages
      fileTooBig: "फाइल खूप मोठी आहे, कृपया १६MB पेक्षा लहान फाइल वापरा",
      fileNotSupported: "या फाइल प्रकाराचे समर्थन नाही",
      fileError: "फाइल वाचण्यात त्रुटी",

      // Camera messages
      cameraPermission: "कॅमेरा वापरण्यासाठी परवानगी द्या",
      cameraError: "कॅमेरा चालू करता आला नाही",
      photoTaken: "फोटो यशस्वीरित्या काढला!",

      // Network messages
      offline: "इंटरनेट कनेक्शन नाही",
      online: "इंटरनेट कनेक्शन परत आले",
      networkError: "नेटवर्क त्रुटी, कृपया पुन्हा प्रयत्न करा",

      // Prediction messages
      predictionSuccess: "रोग यशस्वीरित्या ओळखला!",
      predictionError: "रोग ओळखण्यात अयशस्वी",
      lowConfidence: "कमी विश्वास - कृपया स्पष्ट फोटो वापरा",
      highRisk: "धोकादायक रोग - तत्काळ तज्ञांशी संपर्क साधा!",

      // UI messages
      selectImage: "कृपया पहिले छायाचित्र निवडा",
      processingImage: "छायाचित्र प्रक्रिया करत आहे...",
      analyzing: "विश्लेषण करत आहे...",
      readyForNew: "नवीन तपासणीसाठी तयार!",
      retryAvailable: "पुन्हा प्रयत्न करा",
    },
  },

  // Initialize Application
  init(options = {}) {
    console.log("🌾 Initializing ऊस एकरी १०० टन App...");

    try {
      // Merge configuration
      this.config = { ...this.config, ...options };

      // Load user preferences
      this.loadUserPreferences();

      // Initialize all components
      this.initializeEventListeners();
      this.initializeNetworkMonitoring();
      this.initializeHealthChecks();
      this.initializeServiceWorker();
      this.initializeAccessibility();

      // Initialize UI components
      this.initializeUI();

      // Load initial data
      if (this.config.autoCheckHealth) {
        this.checkSystemHealth();
      }

      this.loadCommonDiseases();

      console.log("✅ App initialized successfully!");
      this.showToast("ऊस एकरी १०० टन तयार आहे!", "success");
    } catch (error) {
      console.error("App initialization failed:", error);
      this.showToast("अॅप सुरू करण्यात त्रुटी", "error");
    }
  },

  // Initialize UI Components
  initializeUI() {
    // Set up loading overlay click handler
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.addEventListener("click", (e) => {
        if (e.target === loadingOverlay) {
          // Allow cancellation if not critical
          if (!this.state.isProcessing) {
            this.hideLoadingOverlay();
          }
        }
      });
    }

    // Initialize tooltips and help text
    this.initializeHelpSystem();

    // Initialize progressive disclosure
    this.initializeProgressiveDisclosure();
  },

  // Event Listeners Setup
  initializeEventListeners() {
    // File input handling
    const fileInput = document.getElementById("file-input");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileSelect(e));

      // Drag and drop support
      fileInput.addEventListener("dragover", this.handleDragOver);
      fileInput.addEventListener("drop", (e) => this.handleFileDrop(e));
    }

    // Camera button
    const cameraBtn = document.getElementById("camera-btn");
    if (cameraBtn) {
      cameraBtn.addEventListener("click", () => this.toggleCamera());
    }

    // Analysis button
    const analyzeBtn = document.getElementById("analyze-btn");
    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", () => this.performAnalysis());
    }

    // Retake button
    const retakeBtn = document.getElementById("retake-btn");
    if (retakeBtn) {
      retakeBtn.addEventListener("click", () => this.resetImageInput());
    }

    // Preview close button
    const previewClose = document.getElementById("preview-close");
    if (previewClose) {
      previewClose.addEventListener("click", () => this.resetImageInput());
    }

    // Form submissions
    document.addEventListener("submit", (e) => {
      if (e.target.classList.contains("prediction-form")) {
        e.preventDefault();
        this.handleFormSubmit(e);
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Touch gestures for mobile
    if ("ontouchstart" in window) {
      this.initializeTouchGestures();
    }

    // Page visibility changes
    document.addEventListener("visibilitychange", () => {
      this.handleVisibilityChange();
    });

    // Before unload warning
    window.addEventListener("beforeunload", (e) => {
      if (this.state.isProcessing) {
        e.preventDefault();
        e.returnValue =
          "निदान प्रक्रिया चालू आहे. खात्री आहे की आपण पेज बंद करू इच्छिता?";
      }
    });

    // Resize handling
    window.addEventListener(
      "resize",
      this.debounce(() => {
        this.handleResize();
      }, 250)
    );

    // Scroll handling for sticky elements
    window.addEventListener(
      "scroll",
      this.throttle(() => {
        this.handleScroll();
      }, 16)
    );
  },

  // File Selection Handler
  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        this.showToast(validation.message, "error");
        return;
      }

      // Show loading
      this.showLoadingOverlay("फाइल प्रक्रिया करत आहे...");

      // Process file
      const imageData = await this.processImageFile(file);

      // Update state
      this.state.currentImage = imageData;

      // Show preview
      this.showImagePreview(imageData);

      // Hide loading
      this.hideLoadingOverlay();

      // Haptic feedback for mobile
      this.hapticFeedback("light");

      this.showToast("फाइल यशस्वीरित्या लोड झाली!", "success");
    } catch (error) {
      console.error("File processing error:", error);
      this.hideLoadingOverlay();
      this.showToast(this.getMessage("fileError"), "error");
    }
  },

  // Drag and Drop Handlers
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";

    // Add visual feedback
    const inputCard = document.querySelector(".input-card");
    if (inputCard) {
      inputCard.classList.add("drag-over");
    }
  },

  async handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    // Remove visual feedback
    const inputCard = document.querySelector(".input-card");
    if (inputCard) {
      inputCard.classList.remove("drag-over");
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Simulate file input change
      const fileInput = document.getElementById("file-input");
      if (fileInput) {
        // Create new file list
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        fileInput.files = dt.files;

        // Trigger change event
        this.handleFileSelect({ target: { files: [files[0]] } });
      }
    }
  },

  // File Validation
  validateFile(file) {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        message: this.getMessage("fileTooBig"),
      };
    }

    // Check file type
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!this.config.supportedFormats.includes(fileExtension)) {
      return {
        valid: false,
        message: this.getMessage("fileNotSupported"),
      };
    }

    // Check if it's actually an image
    if (!file.type.startsWith("image/")) {
      return {
        valid: false,
        message: "कृपया फक्त छायाचित्र फाइल निवडा",
      };
    }

    // Additional validation for corrupted files
    if (file.size < 1000) {
      // Less than 1KB probably corrupted
      return {
        valid: false,
        message: "फाइल दूषित असू शकते, दुसरी फाइल वापरा",
      };
    }

    return { valid: true };
  },

  // Process Image File with Quality Enhancement
  async processImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          try {
            // Create canvas for processing
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Calculate optimal dimensions (maintain aspect ratio)
            const maxDimension = 800;
            let { width, height } = img;

            if (width > height && width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Apply image processing
            this.enhanceImageQuality(ctx, img, width, height);

            // Get processed data
            const processedDataUrl = canvas.toDataURL("image/jpeg", 0.9);

            // Create result object
            const result = {
              original: file,
              processed: processedDataUrl,
              canvas: canvas,
              dimensions: { width, height },
              originalDimensions: { width: img.width, height: img.height },
              size: file.size,
              type: file.type,
              name: file.name,
              processedSize: this.getBase64Size(processedDataUrl),
              quality: this.assessImageQuality(
                img.width,
                img.height,
                file.size
              ),
            };

            resolve(result);
          } catch (error) {
            reject(new Error("छायाचित्र प्रक्रिया अपयशी: " + error.message));
          }
        };

        img.onerror = () => reject(new Error("अवैध छायाचित्र फाइल"));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error("फाइल वाचण्यात अयशस्वी"));
      reader.readAsDataURL(file);
    });
  },

  // Enhanced Image Quality Processing
  enhanceImageQuality(ctx, img, width, height) {
    // Draw original image
    ctx.drawImage(img, 0, 0, width, height);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Apply basic enhancement (contrast and brightness)
    for (let i = 0; i < data.length; i += 4) {
      // Slight contrast enhancement
      data[i] = Math.min(255, data[i] * 1.1); // Red
      data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Green
      data[i + 2] = Math.min(255, data[i + 2] * 1.1); // Blue
      // Alpha channel remains unchanged
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);
  },

  // Show Enhanced Image Preview
  showImagePreview(imageData) {
    const previewContainer = document.getElementById("preview-container");
    const previewImage = document.getElementById("preview-image");
    const imageSizeElement = document.getElementById("image-size");
    const imageTypeElement = document.getElementById("image-type");
    const imageQualityElement = document.getElementById("image-quality");

    if (previewContainer && previewImage) {
      // Show preview with processed image
      previewImage.src = imageData.processed;
      previewContainer.classList.remove("hidden");

      // Update image information
      if (imageSizeElement) {
        const originalSizeKB = Math.round(imageData.size / 1024);
        const processedSizeKB = Math.round(imageData.processedSize / 1024);
        imageSizeElement.textContent = `${originalSizeKB} KB → ${processedSizeKB} KB`;
      }

      if (imageTypeElement) {
        imageTypeElement.textContent = imageData.type;
      }

      if (imageQualityElement) {
        imageQualityElement.textContent = imageData.quality.label;
        imageQualityElement.className = `info-value quality-${imageData.quality.level}`;
      }

      // Show additional options
      const additionalOptions = document.getElementById("additional-options");
      if (additionalOptions) {
        additionalOptions.classList.remove("hidden");
      }

      // Add image enhancement tips if quality is low
      if (imageData.quality.level === "low") {
        this.showImageTips();
      }

      // Smooth scroll to preview
      setTimeout(() => {
        previewContainer.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  },

  // Show Image Quality Tips
  showImageTips() {
    const tips = [
      "चांगल्या प्रकाशात फोटो काढा",
      "फोन स्थिर धरा",
      "पानाजवळ जाऊन फोटो काढा",
      "स्पष्ट आणि तीक्ष्ण फोटो वापरा",
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.showToast(`💡 सुचना: ${randomTip}`, "info", 7000);
  },

  // Assess Image Quality
  assessImageQuality(width, height, fileSize) {
    const pixelCount = width * height;
    const bytesPerPixel = fileSize / pixelCount;

    let level, label, score;

    // Calculate quality based on resolution and compression
    if (pixelCount < 100000) {
      level = "low";
      label = "कमी";
      score = 2;
    } else if (pixelCount < 500000) {
      level = "medium";
      label = "मध्यम";
      score = 3;
    } else if (pixelCount > 1000000 && bytesPerPixel > 2) {
      level = "excellent";
      label = "उत्कृष्ट";
      score = 5;
    } else {
      level = "good";
      label = "चांगली";
      score = 4;
    }

    return { level, label, score };
  },

  // Get Base64 String Size
  getBase64Size(base64String) {
    const base64Data = base64String.split(",")[1];
    return Math.round(base64Data.length * 0.75); // Base64 is ~25% larger than binary
  },

  // Toggle Camera
  async toggleCamera() {
    if (this.state.cameraActive) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  },

  // Start Camera
  async startCamera() {
    try {
      // Check if camera handler is available
      if (typeof CameraHandler === "undefined") {
        this.showToast("कॅमेरा मॉड्यूल लोड नाही", "error");
        return;
      }

      this.showLoadingOverlay("कॅमेरा सुरू करत आहे...");

      await CameraHandler.startCamera();
      this.state.cameraActive = true;

      this.hideLoadingOverlay();
      this.showToast("कॅमेरा तयार आहे!", "success");
    } catch (error) {
      console.error("Camera start error:", error);
      this.hideLoadingOverlay();
      this.showToast(this.getMessage("cameraError"), "error");
    }
  },

  // Stop Camera
  stopCamera() {
    if (typeof CameraHandler !== "undefined") {
      CameraHandler.stopCamera();
      this.state.cameraActive = false;
    }
  },

  // Fixed analysis function with better error handling
  async performAnalysis() {
    if (!this.state.currentImage) {
      this.showToast("कृपया प्रथम छायाचित्र निवडा", "warning");
      return;
    }
    if (this.state.isProcessing) return;
    try {
      this.state.isProcessing = true;
      this.showLoadingOverlay("AI विश्लेषण करत आहे...");
      this.disableAnalysisButton();
      const formData = this.prepareFormData();
      const result = await this.makeAPIRequestWithRetry(formData);
      if (result && result.success) {
        await this.handleAnalysisSuccess(result);
      } else {
        this.handleAnalysisError(result || { message: "विश्लेषणात अपयश" });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      this.handleAnalysisError({
        message: error.message || "तांत्रिक त्रुटी आली आहे",
        error_marathi: "विश्लेषण करताना त्रुटी आली",
      });
    } finally {
      this.state.isProcessing = false;
      this.hideLoadingOverlay();
      this.enableAnalysisButton();
    }
  },

  // Enhanced API request with retry logic
  async makeAPIRequestWithRetry(formData, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`API request attempt ${attempt}/${retries}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.predictionTimeout
        );
        const response = await fetch(this.config.apiUrl, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error("छायाचित्र खूप मोठे आहे");
          } else if (response.status === 503) {
            throw new Error("सेवा सध्या उपलब्ध नाही");
          } else if (response.status === 500) {
            throw new Error("सर्व्हर त्रुटी आली आहे");
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
        const result = await response.json();
        console.log("API response:", result);
        return result;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === retries) {
          if (error.name === "AbortError") {
            throw new Error("विनंती वेळेत पूर्ण होऊ शकली नाही");
          }
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  },

  // Fixed form data preparation
  prepareFormData() {
    const formData = new FormData();
    try {
      const imageBlob = this.dataURLToBlob(this.state.currentImage.processed);
      formData.append("image", imageBlob, this.generateImageName());
      const farmSize = document.getElementById("farm-size")?.value || "1";
      const location = document.getElementById("location")?.value || "";
      const cropStage = document.getElementById("crop-stage")?.value || "";
      const experience = document.getElementById("experience")?.value || "";
      formData.append("farmsize", farmSize);
      formData.append("location", location);
      formData.append("cropstage", cropStage);
      formData.append("experience", experience);
      formData.append("timestamp", new Date().toISOString());
      formData.append("devicetype", this.getDeviceType());
      formData.append(
        "imagequality",
        this.state.currentImage.quality.score.toString()
      );
      console.log("FormData prepared successfully");
      return formData;
    } catch (error) {
      console.error("FormData preparation error:", error);
      throw new Error("डेटा तयार करताना त्रुटी");
    }
  },

  // Enhanced error handling
  handleAnalysisError(error) {
    console.error("Analysis failed:", error);
    if (this.state.progressInterval) {
      clearInterval(this.state.progressInterval);
    }
    let message = "विश्लेषणात अपयश आला";
    if (error.error_marathi) {
      message = error.error_marathi;
    } else if (error.message) {
      message = error.message;
    }
    this.showErrorWithRetry(message, error);
    this.hapticFeedback("error");
  },

  // Fixed error display with retry
  showErrorWithRetry(message, error) {
    const errorToast = document.createElement("div");
    errorToast.className = "flash-message flash-error";
    errorToast.innerHTML = `
            <span class=\"flash-icon\">❌</span>
            <span class=\"flash-text\">${message}</span>
            <button class=\"retry-btn\" onclick=\"this.parentElement.remove(); SugarcaneApp.performAnalysis()\">\n+                🔄 पुन्हा प्रयत्न करा\n+            </button>\n+            <button class=\"flash-close\" onclick=\"this.parentElement.remove()\">×</button>\n+        `;
    let container = document.querySelector(".flash-messages");
    if (!container) {
      container = document.createElement("div");
      container.className = "flash-messages";
      document.body.appendChild(container);
    }
    container.appendChild(errorToast);
    setTimeout(() => {
      if (errorToast.parentElement) {
        errorToast.remove();
      }
    }, 10000);
  },

  // Show Analysis Progress
  showAnalysisProgress() {
    this.showLoadingOverlay("AI आपल्या पिकाचे विश्लेषण करत आहे...");

    // Add progress messages
    const progressMessages = [
      "छायाचित्र प्रक्रिया करत आहे...",
      "रोग ओळखण्यासाठी विश्लेषण करत आहे...",
      "उपचाराची माहिती तयार करत आहे...",
      "निकाल तयार करत आहे...",
    ];

    let messageIndex = 0;
    const progressInterval = setInterval(() => {
      if (this.state.isProcessing && messageIndex < progressMessages.length) {
        const loadingText = document.querySelector(".loading-text");
        if (loadingText) {
          loadingText.textContent = progressMessages[messageIndex];
        }
        messageIndex++;
      } else {
        clearInterval(progressInterval);
      }
    }, 3000);

    // Store interval for cleanup
    this.state.progressInterval = progressInterval;
  },

  // Disable/Enable Analysis Button
  disableAnalysisButton() {
    const analyzeBtn = document.getElementById("analyze-btn");
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML =
        '<span class="btn-icon">⏳</span><span class="btn-text">विश्लेषण करत आहे...</span>';
      analyzeBtn.classList.add("processing");
    }
  },

  enableAnalysisButton() {
    const analyzeBtn = document.getElementById("analyze-btn");
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML =
        '<span class="btn-icon">🔍</span><span class="btn-text">आजार ओळखा</span>';
      analyzeBtn.classList.remove("processing");
    }
  },

  // Prepare Form Data for API
  prepareFormData() {
    const formData = new FormData();

    // Add image (convert from data URL to blob)
    const imageBlob = this.dataURLToBlob(this.state.currentImage.processed);
    formData.append("image", imageBlob, this.generateImageName());

    // Add farmer context
    const farmSize = document.getElementById("farm-size")?.value || "1";
    const location = document.getElementById("location")?.value || "";
    const cropStage = document.getElementById("crop-stage")?.value || "वाढ";
    const experience = document.getElementById("experience")?.value || "मध्यम";

    formData.append("farm_size", farmSize);
    formData.append("location", location);
    formData.append("crop_stage", cropStage);
    formData.append("experience", experience);

    // Add metadata
    formData.append("timestamp", new Date().toISOString());
    formData.append("device_type", this.getDeviceType());
    formData.append("image_quality", this.state.currentImage.quality.score);
    formData.append(
      "original_dimensions",
      JSON.stringify(this.state.currentImage.originalDimensions)
    );
    formData.append(
      "processed_dimensions",
      JSON.stringify(this.state.currentImage.dimensions)
    );

    return formData;
  },

  // Generate Unique Image Name
  generateImageName() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const random = Math.random().toString(36).substr(2, 5);
    return `sugarcane-${timestamp}-${random}.jpg`;
  },

  // Make API Request with Progress Tracking
  async makeAPIRequest(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set timeout
      const timeout = setTimeout(() => {
        xhr.abort();
        reject(new Error("विनंती वेळ संपला - कृपया पुन्हा प्रयत्न करा"));
      }, this.config.predictionTimeout);

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          this.updateLoadingProgress(percent);
        }
      });

      // Handle state changes
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          clearTimeout(timeout);

          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(new Error("अवैध प्रतिसाद स्वरूप"));
            }
          } else if (xhr.status === 413) {
            reject(new Error("फाइल खूप मोठी आहे"));
          } else if (xhr.status === 503) {
            reject(new Error("सेवा सध्या उपलब्ध नाही"));
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("नेटवर्क त्रुटी - कृपया इंटरनेट कनेक्शन तपासा"));
      };

      xhr.open("POST", this.config.apiUrl);
      xhr.send(formData);
    });
  },

  // Update Loading Progress
  updateLoadingProgress(percent) {
    const loadingSubtext = document.querySelector(".loading-subtext");
    if (loadingSubtext) {
      loadingSubtext.textContent = `प्रगती: ${percent}%`;
    }
  },

  // Handle Analysis Success
  async handleAnalysisSuccess(result) {
    try {
      // Clear progress interval
      if (this.state.progressInterval) {
        clearInterval(this.state.progressInterval);
      }

      // Store result
      this.state.currentPrediction = result;

      // Save to local storage
      this.saveRecentResult(result);

      // Haptic feedback
      this.hapticFeedback("medium");

      // Show success message
      this.showToast(this.getMessage("predictionSuccess"), "success");

      // Check for critical diseases first
      if (result.expert_guidance?.urgency_required) {
        await this.showUrgentAlert(result);
      }

      // Display results
      await this.displayResults(result);

      // Add Marathi warning message below solution cards, prevent duplicates
      const resultContainer = document.getElementById("prediction-result") || document.querySelector(".result-container");
      if (resultContainer) {
        let warningBox = document.getElementById("ai-warning-box");
        if (warningBox) {
          warningBox.remove(); // Remove previous warning if exists
        }
        warningBox = document.createElement("div");
        warningBox.id = "ai-warning-box";
        warningBox.style.cssText = `
          border: 2px solid #d32f2f;
          background: #ffebee;
          color: #b71c1c;
          padding: 16px;
          margin: 24px 0 0 0;
          border-radius: 8px;
          font-size: 1.1em;
          font-weight: bold;
          text-align: center;
          box-shadow: 0 2px 8px rgba(211,47,47,0.08);
        `;
        warningBox.innerText =
          "कृपया लक्षात घ्या: हा परिणाम AI तंत्रज्ञानावर आधारित आहे आणि सतत प्रशिक्षण घेत आहे. त्यामुळे निदान बरोबर नसेल अशी शक्यता आहे. कृपया नेहमी तज्ञांचा सल्ला घ्या.";

        // Insert after solution cards (try to find treatment card)
        const treatmentCard = resultContainer.querySelector('.treatment-section') || resultContainer.querySelector('.info-section.treatment-section');
        if (treatmentCard && treatmentCard.parentNode) {
          treatmentCard.parentNode.insertBefore(warningBox, treatmentCard.nextSibling);
        } else {
          resultContainer.appendChild(warningBox);
        }
      }
    } catch (error) {
      console.error("Error handling success:", error);
      this.showToast("परिणाम दाखवण्यात त्रुटी", "error");
    }
  },

  // Show Urgent Alert for Critical Diseases
  async showUrgentAlert(result) {
    const diseaseName = result.diagnosis?.disease_name || "अज्ञात रोग";

    // Create urgent alert modal
    const alertModal = document.createElement("div");
    alertModal.className = "urgent-alert-modal";
    alertModal.innerHTML = `
            <div class="urgent-alert-content">
                <div class="urgent-alert-header">
                    <span class="urgent-icon">🚨</span>
                    <h2>तत्काळ लक्ष द्या!</h2>
                </div>
                <div class="urgent-alert-body">
                    <p><strong>${diseaseName}</strong> हा गंभीर रोग आहे.</p>
                    <p>तत्काळ कृषी तज्ञांशी संपर्क साधा:</p>
                    <div class="urgent-actions">
                        <a href="tel:1800-XXX-XXXX" class="urgent-btn call-btn">
                            📞 तत्काळ कॉल करा
                        </a>
                        <a href="https://wa.me/91XXXXXXXXXX" class="urgent-btn whatsapp-btn">
                            💬 WhatsApp पाठवा
                        </a>
                    </div>
                </div>
                <div class="urgent-alert-footer">
                    <button class="urgent-btn secondary" onclick="this.closest('.urgent-alert-modal').remove()">
                        परिणाम पहा
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(alertModal);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (alertModal.parentElement) {
        alertModal.remove();
      }
    }, 30000);

    // Continuous haptic feedback for critical cases
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  },

  // Display Results
  async displayResults(result) {
    // Check if we're on home page or results page
    if (window.location.pathname === "/") {
      this.displayResultsInline(result);
    } else {
      // Navigate to results page
      this.navigateToResults(result);
    }
  },

  // Navigate to Results Page
  navigateToResults(result) {
    try {
      const resultData = encodeURIComponent(JSON.stringify(result));
      window.location.href = `/results?data=${resultData}`;
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to inline display
      this.displayResultsInline(result);
    }
  },

  // Display Results Inline
  displayResultsInline(result) {
    // Remove any existing results
    const existingResults = document.querySelector(".results-section");
    if (existingResults) {
      existingResults.remove();
    }

    // Create results HTML
    const resultsHTML = this.generateResultsHTML(result);

    // Find insertion point
    const inputSection = document.querySelector(".input-section");
    if (inputSection) {
      // Create results section
      const resultsSection = document.createElement("section");
      resultsSection.className = "results-section";
      resultsSection.innerHTML = resultsHTML;

      // Insert after input section
      inputSection.parentNode.insertBefore(
        resultsSection,
        inputSection.nextSibling
      );

      // Initialize result interactions
      this.initializeResultInteractions(resultsSection);

      // Scroll to results with delay for rendering
      setTimeout(() => {
        resultsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  },

  // Generate Results HTML
  generateResultsHTML(result) {
    const diagnosis = result.diagnosis;
    const farmerInfo = result.farmerinfo;
    const actionPlan = result.actionplan;

    return `
        <div class="result-container">
            <!-- Main Diagnosis Card -->
            <div class="diagnosis-header">
                <div class="diagnosis-card" style="border-left-color: ${
                  result.display_settings?.primary_color || "#4CAF50"
                }">
                    <div class="diagnosis-main">
                        <div class="diagnosis-icon" style="background-color: ${
                          result.display_settings?.primary_color || "#4CAF50"
                        }20">
                            ${this.getDiseaseIcon(diagnosis.diseasenameenglish)}
                        </div>
                        <div class="diagnosis-content">
                            <h2 class="disease-name">${
                              diagnosis.diseasename || "अज्ञात रोग"
                            }</h2>
                            <h3 class="disease-name-english">${
                              diagnosis.diseasenameenglish || "Unknown"
                            }</h3>
                            <div class="confidence-section">
                                <span class="confidence-badge" style="background-color: ${
                                  result.display_settings?.primary_color ||
                                  "#4CAF50"
                                }">
                                    ${
                                      diagnosis.confidencetext ||
                                      diagnosis.confidence + "%"
                                    }
                                </span>
                                <span class="confidence-level">${
                                  diagnosis.confidencelevel
                                }</span>
                            </div>
                            ${
                              diagnosis.severity
                                ? `
                                <div class="severity-section">
                                    <span class="severity-badge severity-${diagnosis.severity.toLowerCase()}">
                                        ${diagnosis.severity}
                                    </span>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
            </div>

          
            <!-- Information Grid -->
<div class="information-grid">
    ${this.generateInfoCard('symptoms', farmerInfo.symptoms, '🔍', 'लक्षणे')}
    ${this.generateInfoCard('treatment', farmerInfo.treatment, '💊', 'उपचार')}
    ${this.generateInfoCard('prevention', farmerInfo.prevention, '🛡️', 'प्रतिबंध')}
    ${this.generateInfoCard('cost', farmerInfo.costinfo, '💰', 'खर्च माहिती')}
</div>


            <!-- Action Plan -->
            ${this.generateActionPlan(actionPlan)}

            <!-- Expert Guidance -->
            ${
              result.expert_guidance?.consultation_needed
                ? this.generateExpertGuidance(result.expert_guidance)
                : ""
            }

            <!-- Action Buttons -->
            <div class="result-actions">
                <div class="actions-grid">
                    <button class="action-btn primary-btn" onclick="SugarcaneApp.resetImageInput()">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">नवीन तपासणी</span>
                    </button>
                   <!-- <button class="action-btn secondary-btn" onclick="SugarcaneApp.shareResult()">
                        <span class="btn-icon">📤</span>
                        <span class="btn-text">शेअर करा</span>
                    </button> -->
                    <button class="action-btn info-btn" onclick="SugarcaneApp.saveResultToPDF()">
                        <span class="btn-icon">📄</span>
                        <span class="btn-text">PDF सेव्ह करा</span>
                    </button> 
          <button class="action-btn secondary-btn" onclick="SugarcaneApp.shareResult()">
            <span class="btn-icon">📤</span>
            <span class="btn-text">शेअर करा</span>
          </button>
                </div>
            </div>
        </div>
    `;
  },

 // Enhanced Generate Info Card HTML - Replace existing function
generateInfoCard(type, info, icon, title) {
  if (!info) return '';

  // Check for new fields
  const hasValidBasic = info.basic && info.basic !== "Not available" && info.basic.trim() !== "";
  const hasValidContent = info.content && info.content !== "Not available" && info.content.trim() !== "";
  const hasValidTotal = info.total && info.total !== "Not available" && info.total.trim() !== "";
  const hasValidDetailed = info.detailed && info.detailed.length > 0 && 
               info.detailed.some(item => item && item !== "Not available" && item.trim() !== "");
  const hasValidBreakdown = info.breakdown && Object.keys(info.breakdown).length > 0;
  const hasOrganicSolutions = info.organic_solutions && Array.isArray(info.organic_solutions) && info.organic_solutions.length > 0;
  const hasImmediateCare = info.immediate_care && Array.isArray(info.immediate_care) && info.immediate_care.length > 0;
  const hasSolution = info.solution && info.solution !== "Not available" && info.solution.trim() !== "";
  const hasCostEstimate = info.cost_estimate && info.cost_estimate !== "Not available" && info.cost_estimate.trim() !== "";
  const hasRecoveryTime = info.recovery_time && info.recovery_time !== "Not available" && info.recovery_time.trim() !== "";

  // If no valid content exists, don't show the card
  if (!hasValidBasic && !hasValidContent && !hasValidTotal && !hasValidDetailed && !hasValidBreakdown && !hasOrganicSolutions && !hasImmediateCare && !hasSolution && !hasCostEstimate && !hasRecoveryTime) {
    return `
      <div class="info-card ${type}-card no-data">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <h3 class="card-title">${title}</h3>
        </div>
        <div class="card-content">
          <div class="no-data-message">
            <p class="no-data-text">या रोगासाठी माहिती उपलब्ध नाही</p>
            <p class="contact-expert">तज्ञांशी संपर्क करा अधिक माहितीसाठी</p>
          </div>
        </div>
      </div>
    `;
  }

  // Treatment card: show solution and organic_solutions
  if (type === 'treatment') {
    return `
      <div class="info-card ${type}-card">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <h3 class="card-title">${title}</h3>
        </div>
        <div class="card-content">
          ${hasSolution ? `<div class="main-solution"><strong>मुख्य उपाय:</strong><br>${info.solution.replace(/\n/g, '<br>')}</div>` : ''}
          ${hasOrganicSolutions ? `
            <div class="organic-solutions">
              <h4 class="detail-heading">सेंद्रिय उपाय:</h4>
              <ul class="detail-list">
                ${info.organic_solutions
                  .filter(item => item && item !== "Not available" && item.trim() !== "")
                  .map(item => `<li class="detail-item">${item.replace(/\n/g, '<br>')}</li>`)
                  .join('')
                }
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Prevention card: show immediate_care
  if (type === 'prevention') {
    return `
      <div class="info-card ${type}-card">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <h3 class="card-title">${title}</h3>
        </div>
        <div class="card-content">
          ${hasImmediateCare ? `
            <div class="immediate-care">
              <h4 class="detail-heading">तातडीची काळजी:</h4>
              <ul class="detail-list">
                ${info.immediate_care
                  .filter(item => item && item !== "Not available" && item.trim() !== "")
                  .map(item => `<li class="detail-item">${item.replace(/\n/g, '<br>')}</li>`)
                  .join('')
                }
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Default rendering for other cards
  return `
    <div class="info-card ${type}-card">
      <div class="card-header">
        <span class="card-icon">${icon}</span>
        <h3 class="card-title">${title}</h3>
      </div>
      <div class="card-content">
        <!-- Basic Information -->
        <div class="main-info">
          ${hasValidBasic ? `<p class="basic-content">${info.basic}</p>` : ''}
          ${hasValidContent ? `<div class="content-text">${info.content.replace(/\n/g, '<br>')}</div>` : ''}
          ${hasValidTotal ? `<p class="total-cost"><strong>एकूण खर्च:</strong> ${info.total}</p>` : ''}
          ${hasCostEstimate ? `<p class="cost-estimate"><strong>खर्चाचा अंदाज:</strong> ${info.cost_estimate}</p>` : ''}
          ${hasRecoveryTime ? `<p class="recovery-time"><strong>सुधारण्याचा कालावधी:</strong> ${info.recovery_time}</p>` : ''}
        </div>

        <!-- Detailed Information -->
        ${hasValidDetailed ? `
          <div class="detailed-info">
            <h4 class="detail-heading">तपशील:</h4>
            <ul class="detail-list">
              ${info.detailed
                .filter(item => item && item !== "Not available" && item.trim() !== "")
                .map(item => `<li class="detail-item">${item.replace(/\n/g, '<br>')}</li>`)
                .join('')
              }
            </ul>
          </div>
        ` : ''}

        <!-- Cost Breakdown -->
        ${hasValidBreakdown ? `
          <div class="cost-breakdown">
            <h4 class="breakdown-heading">खर्चाचा तपशील:</h4>
            <div class="breakdown-items">
              ${Object.entries(info.breakdown)
                .filter(([key, value]) => value && value !== "Not available")
                .map(([key, value]) => `
                  <div class="breakdown-item">
                    <span class="item-label">${key}:</span>
                    <span class="item-value">${value}</span>
                  </div>
                `).join('')
              }
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
},



  // Generate Action Plan HTML
  generateActionPlan(actionPlan) {
    if (!actionPlan || Object.keys(actionPlan).length === 0) return "";

    return `
        <div class="action-plan-section">
            <h2 class="section-title">
                <span class="title-icon">📋</span>
                कृती आराखडा
            </h2>
            <div class="action-grid">
                ${
                  actionPlan.nextsteps
                    ? `
                    <div class="action-card">
                        <div class="action-header">
                            <span class="action-icon">➡️</span>
                            <h3 class="action-title">पुढील पावले</h3>
                        </div>
                        <ul class="action-list">
                            ${
                              actionPlan.nextsteps.steps
                                ? actionPlan.nextsteps.steps
                                    .map(
                                      (step) =>
                                        `<li class="action-item">${step}</li>`
                                    )
                                    .join("")
                                : ""
                            }
                        </ul>
                    </div>
                `
                    : ""
                }
                ${
                  actionPlan.warning_signs
                    ? `
                    <div class="action-card warning-card">
                        <div class="action-header">
                            <span class="action-icon">⚠️</span>
                            <h3 class="action-title">चेतावणी चिन्हे</h3>
                        </div>
                        <ul class="warning-list">
                            ${
                              actionPlan.warning_signs.signs
                                ? actionPlan.warning_signs.signs
                                    .map(
                                      (sign) =>
                                        `<li class="warning-item">${sign}</li>`
                                    )
                                    .join("")
                                : ""
                            }
                        </ul>
                    </div>
                `
                    : ""
                }
            </div>
        </div>
    `;
  },

  // Generate Expert Guidance HTML
  generateExpertGuidance(expertGuidance) {
    return `
            <div class="expert-section">
                <div class="expert-card ${
                  expertGuidance.urgency_required ? "urgent" : ""
                }">
                    <div class="expert-header">
                        <span class="expert-icon">👨‍🌾</span>
                        <h3 class="expert-title">तज्ञ सल्ला ${
                          expertGuidance.urgency_required
                            ? "(तत्काळ आवश्यक)"
                            : ""
                        }</h3>
                        <span class="urgency-level">${
                          expertGuidance.urgency_level || ""
                        }</span>
                    </div>
                    <div class="expert-content">
                        <p class="expert-advice">${
                          expertGuidance.when_to_consult ||
                          "तज्ञांचा सल्ला घेण्याची शिफारस"
                        }</p>
                        <div class="expert-actions">
                            <a href="tel:1800-XXX-XXXX" class="expert-btn primary">
                                <span class="btn-icon">📞</span>
                                <span class="btn-text">तत्काळ कॉल करा</span>
                            </a>
                            <a href="#local-experts" class="expert-btn secondary" onclick="SugarcaneApp.showLocalExperts()">
                                <span class="btn-icon">🏥</span>
                                <span class="btn-text">स्थानिक तज्ञ</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
  },

  // Initialize Result Interactions
  initializeResultInteractions(resultsSection) {
    // Add click handlers for expandable sections
    const expandableHeaders = resultsSection.querySelectorAll(
      ".card-header, .action-header"
    );
    expandableHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const card = header.closest(".info-card, .action-card");
        if (card) {
          card.classList.toggle("expanded");
        }
      });
    });

    // Initialize copy buttons for text content
    const copyButtons = resultsSection.querySelectorAll(".copy-btn");
    copyButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const textToCopy = e.target.dataset.text;
        this.copyToClipboard(textToCopy);
      });
    });
  },

  // Get Disease Icon
  getDiseaseIcon(diseaseName) {
    const icons = {
      Healthy: "🌱",
      RedRot: "🔴",
      "Brown Spot": "🟤",
      "Yellow Leaf": "🟡",
      Rust: "🦠",
      Mosaic: "🟢",
      "Banded Chlorosis": "🟨",
      "Sett Rot": "⚫",
      "Grassy shoot": "🌿",
    };

    return icons[diseaseName] || "🦠";
  },

  // Handle Analysis Error
  handleAnalysisError(error) {
    console.error("Analysis failed:", error);

    // Clear progress interval
    if (this.state.progressInterval) {
      clearInterval(this.state.progressInterval);
    }

    // Store failed request for retry
    this.state.failedRequests.push({
      timestamp: Date.now(),
      error: error,
      imageData: this.state.currentImage,
    });

    // Haptic feedback
    this.hapticFeedback("heavy");

    // Determine error message
    let message = this.getMessage("predictionError");

    if (error.error_marathi) {
      message = error.error_marathi;
    } else if (error.message) {
      message = error.message;
    }

    // Show error with retry option
    this.showErrorWithRetry(message, error);
  },

  // Show Error with Retry Option
  showErrorWithRetry(message, error) {
    const errorToast = this.showToast(message, "error", 10000);

    // Add retry button to toast
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-btn";
    retryBtn.innerHTML = "🔄 पुन्हा प्रयत्न करा";
    retryBtn.onclick = () => {
      errorToast.remove();
      this.performAnalysis();
    };

    errorToast.appendChild(retryBtn);

    // Show detailed error info for debugging (only in dev mode)
    if (this.config.debug || window.location.hostname === "localhost") {
      console.log("Detailed error:", error);
    }
  },

  // Reset Image Input
  resetImageInput() {
    try {
      // Clear state
      this.state.currentImage = null;
      this.state.currentPrediction = null;

      // Clear progress interval if exists
      if (this.state.progressInterval) {
        clearInterval(this.state.progressInterval);
      }

      // Reset file input
      const fileInput = document.getElementById("file-input");
      if (fileInput) {
        fileInput.value = "";
      }

      // Hide preview and options
      const elementsToHide = ["preview-container", "additional-options"];

      elementsToHide.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.classList.add("hidden");
        }
      });

      // Remove results
      const resultsSection = document.querySelector(".results-section");
      if (resultsSection) {
        resultsSection.remove();
      }

      // Remove urgent alerts
      const urgentAlerts = document.querySelectorAll(".urgent-alert-modal");
      urgentAlerts.forEach((alert) => alert.remove());

      // Stop camera if active
      if (this.state.cameraActive) {
        this.stopCamera();
      }

      // Re-enable analysis button
      this.enableAnalysisButton();

      // Scroll to input section
      const inputSection = document.querySelector(".input-section");
      if (inputSection) {
        inputSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      this.showToast(this.getMessage("readyForNew"), "info");
    } catch (error) {
      console.error("Reset error:", error);
      // Force page reload as fallback
      window.location.reload();
    }
  },

  // Share Result
  async shareResult() {
    if (!this.state.currentPrediction) {
      this.showToast("शेअर करण्यासाठी कोणताही परिणाम नाही", "warning");
      return;
    }

    const result = this.state.currentPrediction;
    const shareData = {
      title: "ऊस एकरी १०० टन - रोग निदान परिणाम",
      text: `माझ्या ऊसाच्या रोगाचे AI निदान: ${
        result.diagnosis?.disease_name || "अज्ञात रोग"
      } (${result.diagnosis?.confidence || 0}% विश्वास)`,
      url: window.location.href,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        this.showToast("परिणाम यशस्वीरित्या शेअर केले!", "success");
      } else {
        // Fallback: Copy to clipboard
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await this.copyToClipboard(shareText);
        this.showToast("परिणाम क्लिपबोर्डवर कॉपी केले!", "success");
      }
    } catch (error) {
      console.error("Share error:", error);
      this.showToast("शेअर करण्यात त्रुटी", "error");
    }
  },

  // Save Result to PDF
  async saveResultToPDF() {
    if (!this.state.currentPrediction) {
      this.showToast("PDF साठवण्यासाठी कोणताही परिणाम नाही", "warning");
      return;
    }

    try {
      this.showLoadingOverlay("PDF तयार करत आहे...");

      // Create printable version
      const printContent = this.createPrintableContent(
        this.state.currentPrediction
      );

      // Open print dialog
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>ऊस रोग निदान परिणाम</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
                        .diagnosis { background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }
                        .info-section { margin: 20px 0; padding: 15px; border-left: 4px solid #4CAF50; }
                        .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>${printContent}</body>
                </html>
            `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        this.hideLoadingOverlay();
        this.showToast("PDF साठवण्यासाठी तयार!", "success");
      }, 1000);
    } catch (error) {
      console.error("PDF creation error:", error);
      this.hideLoadingOverlay();
      this.showToast("PDF तयार करण्यात त्रुटी", "error");
    }
  },

  // Create Printable Content - Updated Version
createPrintableContent(result) {
    const diagnosis = result.diagnosis || {};
    const farmerInfo = result.farmerinfo || {}; // Note: 'farmerinfo' not 'farmer_info'
    const actionPlan = result.actionplan || {};

  // Helper function to check if content is valid
  const isValidContent = (content) => {
    return content && content !== "Not available" && content.trim() !== "";
  };

  // Helper function to format detailed list
  const formatDetailedList = (detailed) => {
    if (!detailed || !Array.isArray(detailed)) return "";
    const validItems = detailed.filter(item => isValidContent(item));
    if (validItems.length === 0) return "";
    return validItems.map(item => `• ${item}`).join('<br>');
  };

  // Helper for organic solutions
  const formatOrganicSolutions = (organic) => {
    if (!organic || !Array.isArray(organic)) return "";
    const validItems = organic.filter(item => isValidContent(item));
    if (validItems.length === 0) return "";
    return `<div class="organic-solutions"><strong>सेंद्रिय उपाय:</strong><br>${validItems.map(item => `• ${item}`).join('<br>')}</div>`;
  };

  // Helper for immediate care
  const formatImmediateCare = (care) => {
    if (!care || !Array.isArray(care)) return "";
    const validItems = care.filter(item => isValidContent(item));
    if (validItems.length === 0) return "";
    return `<div class="immediate-care"><strong>तातडीची काळजी:</strong><br>${validItems.map(item => `• ${item}`).join('<br>')}</div>`;
  };

  return `
    <div class="printable-content">
      <div class="header">
        <h1>🌾 ऊस एकरी १०० टन</h1>
        <h2>Chordz Technologies</h2>
        <p>ऊसाच्या रोगाचे AI निदान परिणाम</p>
        <p>दिनांक: ${new Date().toLocaleDateString("mr-IN")}</p>
        <p>वेळ: ${new Date().toLocaleTimeString("mr-IN")}</p>
      </div>
            
      <div class="diagnosis-section">
        <h2>📋 निदान परिणाम</h2>
        <div class="diagnosis-details">
          <p><strong>रोग:</strong> ${diagnosis.diseasename || "अज्ञात रोग"}</p>
          <p><strong>English Name:</strong> ${diagnosis.diseasenameenglish || "Unknown"}</p>
          <p><strong>विश्वास पातळी:</strong> ${diagnosis.confidencetext || diagnosis.confidence + "%" || "0%"}</p>
          <p><strong>विश्वासार्हता:</strong> ${diagnosis.confidencelevel || "अज्ञात"}</p>
          <p><strong>गंभीरता:</strong> ${diagnosis.severity || "मध्यम"}</p>
        </div>
      </div>
            
      <div class="info-section symptoms-section">
        <h3>🔍 रोगाची लक्षणे</h3>
        ${isValidContent(farmerInfo.symptoms?.symptoms) ? 
          `<p><strong>मुख्य लक्षणे:</strong> ${farmerInfo.symptoms.symptoms}</p>` : ''
        }
        ${formatDetailedList(farmerInfo.symptoms?.detailed) ? 
          `<div class="detailed-info">
            <p><strong>तपशीलवार लक्षणे:</strong></p>
            <div class="detail-content">${formatDetailedList(farmerInfo.symptoms.detailed)}</div>
          </div>` : ''
        }
      </div>
            
      <div class="info-section treatment-section">
        <h3>💊 उपचार पद्धती</h3>
        ${isValidContent(farmerInfo.treatment?.solution) ? 
          `<div class="treatment-content"><strong>मुख्य उपाय:</strong><br>${farmerInfo.treatment.solution.replace(/\n/g, '<br>')}</div>` : ''
        }
        ${formatOrganicSolutions(farmerInfo.treatment?.organic_solutions)}
      </div>
            
      <div class="info-section prevention-section">
        <h3>🛡️ प्रतिबंधक उपाय</h3>
        ${formatImmediateCare(farmerInfo.prevention?.immediate_care)}
      </div>
            
      <div class="info-section cost-section">
        <h3>💰 अंदाजित खर्च</h3>
        ${isValidContent(farmerInfo.costinfo?.cost_estimate) ? 
          `<p><strong>खर्चाचा अंदाज:</strong> ${farmerInfo.costinfo.cost_estimate}</p>` : ''
        }
        ${isValidContent(farmerInfo.costinfo?.recovery_time) ? 
          `<p><strong>सुधारण्याचा कालावधी:</strong> ${farmerInfo.costinfo.recovery_time}</p>` : ''
        }
      </div>
            
      ${actionPlan.nextsteps?.steps && actionPlan.nextsteps.steps.length > 0 ? `
        <div class="info-section action-plan-section">
          <h3>📋 कृती आराखडा</h3>
          <div class="action-steps">
            <p><strong>पुढील पावले:</strong></p>
            ${actionPlan.nextsteps.steps.map(step => `<p>• ${step}</p>`).join('')}
          </div>
        </div>
      ` : ''}
            
      <div class="recommendations-section">
        <h3>⚠️ महत्वाच्या सूचना</h3>
        <ul class="recommendations">
          <li>हे निदान AI तंत्रज्ञानावर आधारित आहे</li>
          <li>कृपया कृषी तज्ञांचा सल्ला घ्या</li>
          <li>उपचार सुरू करण्यापूर्वी स्थानिक कृषी सल्लागारांशी संपर्क करा</li>
          <li>नियमित तपासणी करत राहा</li>
          ${diagnosis.confidence && diagnosis.confidence < 50 ? 
            '<li style="color: #ff6b35;"><strong>विश्वासार्हता कमी आहे - तज्ञांचा सल्ला आवश्यक</strong></li>' : ''
          }
        </ul>
      </div>
            
      <div class="footer">
        <div class="contact-info">
          <p><strong>संपर्क माहिती:</strong></p>
          <p>📧 Email: support@chordztechnologies.com</p>
          <p>📱 Phone: +91 XXXXX XXXXX</p>
        </div>
        <div class="copyright">
          <p>© 2025 Chordz Technologies | ऊस एकरी १०० टन</p>
          <p>Generated on: ${new Date().toLocaleString("mr-IN")}</p>
        </div>
      </div>
    </div>
        
    <style>
      @media print {
        .printable-content {
          font-family: 'Noto Sans Devanagari', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
                
        .header {
          text-align: center;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
                
        .header h1 {
          color: #4CAF50;
          margin-bottom: 10px;
        }
                
        .header h2 {
          color: #666;
          margin-bottom: 15px;
        }
                
        .diagnosis-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
                
        .info-section {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
                
        .info-section h3 {
          color: #2c3e50;
          border-left: 4px solid #4CAF50;
          padding-left: 10px;
          margin-bottom: 15px;
        }
                
        .detail-content {
          margin-left: 20px;
          color: #555;
        }
                
        .no-data {
          color: #999;
          font-style: italic;
        }
                
        .recommendations ul {
          padding-left: 20px;
        }
                
        .recommendations li {
          margin-bottom: 8px;
        }
                
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #4CAF50;
          text-align: center;
          color: #666;
        }
                
        .contact-info {
          margin-bottom: 20px;
        }
      }
    </style>
  `;
}
,

  // Get Expert Help
  getExpertHelp() {
    const helpModal = document.createElement("div");
    helpModal.className = "help-modal";
    helpModal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h3>तज्ञ सहाय्य</h3>
                    <button class="help-modal-close" onclick="this.closest('.help-modal').remove()">✕</button>
                </div>
                <div class="help-modal-body">
                    <div class="help-options">
                        <a href="tel:1800-XXX-XXXX" class="help-option">
                            <span class="help-icon">📞</span>
                            <div class="help-text">
                                <strong>कृषी हेल्पलाइन</strong>
                                <p>1800-XXX-XXXX (विनामूल्य)</p>
                            </div>
                        </a>
                        
                        <a href="https://wa.me/91XXXXXXXXXX" class="help-option">
                            <span class="help-icon">💬</span>
                            <div class="help-text">
                                <strong>WhatsApp सहाय्य</strong>
                                <p>तत्काळ मदत मिळवा</p>
                            </div>
                        </a>
                        
                        <a href="mailto:support@chordz.tech" class="help-option">
                            <span class="help-icon">✉️</span>
                            <div class="help-text">
                                <strong>ईमेल सहाय्य</strong>
                                <p>support@chordz.tech</p>
                            </div>
                        </a>
                        
                        <button class="help-option" onclick="SugarcaneApp.showLocalExperts()">
                            <span class="help-icon">🏥</span>
                            <div class="help-text">
                                <strong>स्थानिक तज्ञ</strong>
                                <p>जवळच्या कृषी तज्ञांची माहिती</p>
                            </div>
                        </button>
                    </div>
                    
                    <div class="emergency-note">
                        <p><strong>आपातकाल:</strong> गंभीर रोगाच्या प्रकरणात तत्काळ स्थानिक कृषी अधिकाऱ्यांशी संपर्क साधा.</p>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(helpModal);
  },

  // Show Local Experts
  showLocalExperts() {
    // This would typically fetch local experts based on user location
    const expertsModal = document.createElement("div");
    expertsModal.className = "experts-modal";
    expertsModal.innerHTML = `
            <div class="experts-modal-content">
                <div class="experts-modal-header">
                    <h3>स्थानिक कृषी तज्ञ</h3>
                    <button class="experts-modal-close" onclick="this.closest('.experts-modal').remove()">✕</button>
                </div>
                <div class="experts-modal-body">
                    <div class="location-input">
                        <label for="location-search">आपले ठिकाण प्रविष्ट करा:</label>
                        <input type="text" id="location-search" placeholder="जिल्हा/तालुका" class="input-field">
                        <button class="btn btn-primary" onclick="SugarcaneApp.searchLocalExperts()">शोधा</button>
                    </div>
                    
                    <div class="experts-list" id="experts-list">
                        <div class="expert-card">
                            <h4>कृषी विकास अधिकारी</h4>
                            <p>जिल्हा कार्यालय - सामान्य कृषी सल्ला</p>
                            <p>📞 कार्यालयाशी संपर्क साधा</p>
                        </div>
                        
                        <div class="expert-card">
                            <h4>प्लांट पॅथॉलॉजिस्ट</h4>
                            <p>कृषी महाविद्यालय - रोग तज्ञ</p>
                            <p>📞 महाविद्यालयाशी संपर्क साधा</p>
                        </div>
                        
                        <div class="expert-card">
                            <h4>कृषी सल्लागार</h4>
                            <p>खाजगी सल्लागार सेवा</p>
                            <p>📞 नियुक्तीसाठी कॉल करा</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(expertsModal);
  },

  // Search Local Experts
  searchLocalExperts() {
    const location = document.getElementById("location-search")?.value;
    if (!location) {
      this.showToast("कृपया ठिकाण प्रविष्ट करा", "warning");
      return;
    }

    this.showToast(`${location} मधील तज्ञ शोधत आहे...`, "info");

    // Here you would typically make an API call to find local experts
    // For now, we'll show a placeholder message
    setTimeout(() => {
      this.showToast("स्थानिक तज्ञांची संपूर्ण यादी लवकरच उपलब्ध होईल", "info");
    }, 2000);
  },

  // Copy to Clipboard
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        textArea.remove();
        return successful;
      }
    } catch (error) {
      console.error("Copy failed:", error);
      return false;
    }
  },

  // Network Monitoring
  initializeNetworkMonitoring() {
    window.addEventListener("online", () => {
      this.state.isOnline = true;
      this.hideOfflineMessage();
      this.showToast(this.getMessage("online"), "success");

      // Retry failed requests
      this.retryFailedRequests();
    });

    window.addEventListener("offline", () => {
      this.state.isOnline = false;
      this.showOfflineMessage();
      this.showToast(this.getMessage("offline"), "warning");
    });

    // Network quality detection
    if ("connection" in navigator) {
      const connection = navigator.connection;
      this.monitorNetworkQuality(connection);

      connection.addEventListener("change", () => {
        this.monitorNetworkQuality(connection);
      });
    }
  },

  // Monitor Network Quality
  monitorNetworkQuality(connection) {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;

    if (effectiveType === "slow-2g" || downlink < 0.5) {
      this.showToast("इंटरनेट स्पीड कमी आहे - कृपया धीर धरा", "warning", 3000);
      // Increase timeout for slow connections
      this.config.predictionTimeout = 60000; // 60 seconds
    } else if (effectiveType === "4g" || downlink > 10) {
      this.config.predictionTimeout = 30000; // Reset to 30 seconds
    }
  },

  // Show/Hide Offline Message
  showOfflineMessage() {
    const offlineMessage = document.getElementById("offline-message");
    if (offlineMessage) {
      offlineMessage.classList.remove("hidden");
    }
  },

  hideOfflineMessage() {
    const offlineMessage = document.getElementById("offline-message");
    if (offlineMessage) {
      offlineMessage.classList.add("hidden");
    }
  },

  // Retry Failed Requests
  async retryFailedRequests() {
    if (this.state.failedRequests.length === 0) return;

    this.showToast("अयशस्वी विनंत्या पुन्हा प्रयत्न करत आहे...", "info");

    const failedRequests = [...this.state.failedRequests];
    this.state.failedRequests = [];

    for (const request of failedRequests) {
      try {
        // Only retry recent failures (within last 10 minutes)
        if (Date.now() - request.timestamp < 600000) {
          // Restore image data and retry
          this.state.currentImage = request.imageData;
          await this.performAnalysis();
          break; // Only retry one request at a time
        }
      } catch (error) {
        console.warn("Retry failed:", error);
      }
    }
  },

  // Health Checks
  initializeHealthChecks() {
    if (this.config.autoCheckHealth) {
      // Initial health check
      this.checkSystemHealth();

      // Periodic health checks
      setInterval(() => {
        this.checkSystemHealth();
      }, this.config.healthCheckInterval);
    }
  },

  async checkSystemHealth() {
    try {
      const response = await fetch(this.config.healthUrl, {
        cache: "no-cache",
        timeout: 5000,
      });
      const health = await response.json();

      this.state.systemHealth = health;
      this.state.lastHealthCheck = new Date();

      this.updateSystemStatus(health);
    } catch (error) {
      console.warn("Health check failed:", error);
      this.updateSystemStatus({ status: "unhealthy", error: error.message });
    }
  },

  updateSystemStatus(health) {
    const statusIndicator = document.getElementById("system-status");
    if (!statusIndicator) return;

    const statusDot = statusIndicator.querySelector(".status-dot");
    const statusText = statusIndicator.querySelector(".status-text");

    if (!statusDot || !statusText) return;

    if (health.status === "healthy" && health.system_status?.model_loaded) {
      statusDot.className = "status-dot ready";
      statusText.textContent = "सिस्टम तयार";
    } else if (health.status === "healthy") {
      statusDot.className = "status-dot loading";
      statusText.textContent = "लोड होत आहे...";
    } else {
      statusDot.className = "status-dot error";
      statusText.textContent = "सिस्टम त्रुटी";
    }

    // Update tooltip with more details
    if (health.system_status) {
      const tooltip = `AI मॉडेल: ${
        health.system_status.model_loaded ? "तयार" : "लोड नाही"
      }\nरोग डेटा: ${
        health.system_status.diseases_available || 0
      }\nशेवटची तपासणी: ${new Date(
        this.state.lastHealthCheck
      ).toLocaleTimeString("mr-IN")}`;
      statusIndicator.title = tooltip;
    }
  },

  // Load Common Diseases
  async loadCommonDiseases() {
    try {
      const response = await fetch(this.config.diseasesUrl);
      const data = await response.json();

      if (data.success && data.diseases) {
        this.displayCommonDiseases(data.diseases);
      }
    } catch (error) {
      console.warn("Failed to load diseases:", error);
      // Show default diseases as fallback
      this.displayDefaultDiseases();
    }
  },

  // Display Common Diseases
  displayCommonDiseases(diseases) {
    const diseasesGrid = document.getElementById("common-diseases");
    if (!diseasesGrid || !diseases) return;

    // Show first 4 most common diseases
    const commonDiseases = diseases.filter((d) => d.common).slice(0, 4);

    if (commonDiseases.length === 0) {
      this.displayDefaultDiseases();
      return;
    }

    diseasesGrid.innerHTML = "";

    commonDiseases.forEach((disease) => {
      const diseaseElement = document.createElement("div");
      diseaseElement.className = "disease-item";
      diseaseElement.innerHTML = `
                <div class="disease-icon">${this.getDiseaseIcon(
                  disease.english_name
                )}</div>
                <div class="disease-info">
                    <h4 class="disease-name">${disease.marathi_name}</h4>
                    <p class="disease-desc">${disease.english_name}</p>
                    <span class="disease-severity ${this.getSeverityClass(
                      disease
                    )}">
                        ${this.getSeverityText(disease)}
                    </span>
                </div>
            `;

      // Add click handler for more info
      diseaseElement.addEventListener("click", () => {
        this.showDiseaseDetails(disease);
      });

      diseasesGrid.appendChild(diseaseElement);
    });
  },

  // Display Default Diseases (fallback)
  displayDefaultDiseases() {
    const diseasesGrid = document.getElementById("common-diseases");
    if (!diseasesGrid) return;

    const defaultDiseases = [
      { english_name: "RedRot", marathi_name: "लाल कुजणे", emergency: true },
      {
        english_name: "Brown Spot",
        marathi_name: "तपकिरी ठिपके",
        emergency: false,
      },
      {
        english_name: "Yellow Leaf",
        marathi_name: "पिवळी पाने",
        emergency: false,
      },
      { english_name: "Healthy", marathi_name: "निरोगी पान", emergency: false },
    ];

    diseasesGrid.innerHTML = "";

    defaultDiseases.forEach((disease) => {
      const diseaseElement = document.createElement("div");
      diseaseElement.className = "disease-item";
      diseaseElement.innerHTML = `
                <div class="disease-icon">${this.getDiseaseIcon(
                  disease.english_name
                )}</div>
                <div class="disease-info">
                    <h4 class="disease-name">${disease.marathi_name}</h4>
                    <p class="disease-desc">${disease.english_name}</p>
                    <span class="disease-severity ${
                      disease.emergency ? "critical" : "moderate"
                    }">
                        ${disease.emergency ? "गंभीर" : "मध्यम"}
                    </span>
                </div>
            `;
      diseasesGrid.appendChild(diseaseElement);
    });
  },

  // Get Severity Class and Text
  getSeverityClass(disease) {
    if (disease.emergency) return "critical";
    if (disease.severity === "high") return "critical";
    if (disease.severity === "low") return "mild";
    return "moderate";
  },

  getSeverityText(disease) {
    if (disease.emergency) return "गंभीर";
    if (disease.severity === "high") return "उच्च";
    if (disease.severity === "low") return "कमी";
    return "मध्यम";
  },

  // Show Disease Details
  showDiseaseDetails(disease) {
    const modal = document.createElement("div");
    modal.className = "disease-modal";
    modal.innerHTML = `
            <div class="disease-modal-content">
                <div class="disease-modal-header">
                    <h3>${disease.marathi_name}</h3>
                    <button class="disease-modal-close" onclick="this.closest('.disease-modal').remove()">✕</button>
                </div>
                <div class="disease-modal-body">
                    <p><strong>English:</strong> ${disease.english_name}</p>
                    <p><strong>वैज्ञानिक नाव:</strong> ${
                      disease.scientific_name || "माहिती नाही"
                    }</p>
                    <p><strong>गंभीरता:</strong> ${this.getSeverityText(
                      disease
                    )}</p>
                    <p><strong>सामान्यता:</strong> ${
                      disease.common ? "सामान्य" : "दुर्मिळ"
                    }</p>
                    <p><strong>प्रतिबंधक:</strong> ${
                      disease.preventable ? "होय" : "नाही"
                    }</p>
                    <p><strong>उपचार शक्य:</strong> ${
                      disease.treatable ? "होय" : "नाही"
                    }</p>
                </div>
                <div class="disease-modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.disease-modal').remove()">
                        समजले
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
  },

  // Utility Functions
  getMessage(key) {
    const lang = this.config.language;
    return this.messages[lang]?.[key] || this.messages.marathi[key] || key;
  },

  // Loading Overlay Management
  showLoadingOverlay(message = null) {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      if (message) {
        const loadingText = overlay.querySelector(".loading-text");
        if (loadingText) loadingText.textContent = message;
      }
      overlay.classList.remove("hidden");

      // Prevent body scroll when overlay is shown
      document.body.style.overflow = "hidden";
    }
  },

  hideLoadingOverlay() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");

      // Restore body scroll
      document.body.style.overflow = "";
    }
  },

  // Toast Notifications
  showToast(message, type = "info", duration = 5000) {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `flash-message flash-${type}`;
    toast.innerHTML = `
            <span class="flash-icon">${this.getToastIcon(type)}</span>
            <span class="flash-text">${message}</span>
            <button class="flash-close" onclick="this.parentElement.remove()">✕</button>
        `;

    // Add to container
    let container = document.querySelector(".flash-messages");
    if (!container) {
      container = document.createElement("div");
      container.className = "flash-messages";
      document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Auto remove
    const timeoutId = setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);

    // Cancel auto-remove on hover
    toast.addEventListener("mouseenter", () => clearTimeout(timeoutId));

    return toast;
  },

  getToastIcon(type) {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[type] || "ℹ️";
  },

  // Haptic Feedback for Mobile
  hapticFeedback(type = "light") {
    if ("vibrate" in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
        success: [10, 10, 10],
        error: [50, 25, 50],
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  },

  // Data Conversion Utilities
  dataURLToBlob(dataURL) {
    try {
      const arr = dataURL.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error("Data URL conversion failed:", error);
      throw new Error("छायाचित्र रूपांतरणात त्रुटी");
    }
  },

  // Device Detection
  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return "tablet";
    }
    if (
      /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
        userAgent
      )
    ) {
      return "mobile";
    }
    return "desktop";
  },

  // User Preferences Management
  loadUserPreferences() {
    try {
      const stored = localStorage.getItem("sugarcane-app-preferences");
      if (stored) {
        this.state.userPreferences = JSON.parse(stored);
        this.applyUserPreferences();
      }
    } catch (error) {
      console.warn("Failed to load preferences:", error);
    }
  },

  saveUserPreferences() {
    try {
      localStorage.setItem(
        "sugarcane-app-preferences",
        JSON.stringify(this.state.userPreferences)
      );
    } catch (error) {
      console.warn("Failed to save preferences:", error);
    }
  },

  applyUserPreferences() {
    const prefs = this.state.userPreferences;

    // Apply font size preference
    if (prefs.fontSize) {
      document.documentElement.style.fontSize = prefs.fontSize;
    }

    // Apply theme preference
    if (prefs.theme) {
      document.body.classList.add(`theme-${prefs.theme}`);
    }

    // Apply language preference
    if (prefs.language) {
      this.config.language = prefs.language;
    }
  },

  // Recent Results Management
  saveRecentResult(result) {
    try {
      const recentResults = JSON.parse(
        localStorage.getItem("recent-sugarcane-results") || "[]"
      );

      // Add current result
      recentResults.unshift({
        ...result,
        timestamp: new Date().toISOString(),
        id: this.generateResultId(),
      });

      // Keep only last 10 results
      recentResults.splice(10);

      localStorage.setItem(
        "recent-sugarcane-results",
        JSON.stringify(recentResults)
      );
    } catch (error) {
      console.warn("Failed to save result:", error);
    }
  },

  generateResultId() {
    return (
      "result_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  },

  getRecentResults() {
    try {
      return JSON.parse(
        localStorage.getItem("recent-sugarcane-results") || "[]"
      );
    } catch (error) {
      console.warn("Failed to load recent results:", error);
      return [];
    }
  },

  // Service Worker for PWA
  initializeServiceWorker() {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("ServiceWorker registered:", registration.scope);

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available
                  this.showUpdateAvailable(registration);
                }
              });
            });
          })
          .catch((error) => {
            console.warn("ServiceWorker registration failed:", error);
          });
      });
    }
  },

  showUpdateAvailable(registration) {
    const updateToast = this.showToast(
      "नवीन आवृत्ती उपलब्ध आहे! अपडेट करा.",
      "info",
      0 // Don't auto-hide
    );

    const updateBtn = document.createElement("button");
    updateBtn.textContent = "अपडेट करा";
    updateBtn.className = "btn btn-sm btn-primary";
    updateBtn.onclick = () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    };

    updateToast.appendChild(updateBtn);
  },

  // Accessibility Features
  initializeAccessibility() {
    // High contrast mode detection
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)");
    if (prefersHighContrast.matches) {
      document.body.classList.add("high-contrast");
    }

    prefersHighContrast.addEventListener("change", (e) => {
      document.body.classList.toggle("high-contrast", e.matches);
    });

    // Reduced motion detection
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (prefersReducedMotion.matches) {
      document.body.classList.add("reduced-motion");
    }

    prefersReducedMotion.addEventListener("change", (e) => {
      document.body.classList.toggle("reduced-motion", e.matches);
    });

    // Dark mode detection
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
    if (prefersDarkMode.matches) {
      document.body.classList.add("dark-mode");
    }

    prefersDarkMode.addEventListener("change", (e) => {
      document.body.classList.toggle("dark-mode", e.matches);
    });

    // Keyboard navigation enhancement
    this.enhanceKeyboardNavigation();
  },

  enhanceKeyboardNavigation() {
    // Add focus indicators for better keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-nav");
      }
    });

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-nav");
    });
  },

  // Touch Gestures
  initializeTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      (e) => {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();

        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        const timeDiff = touchEndTime - touchStartTime;

        // Only handle swipes that are fast enough
        if (
          timeDiff < 500 &&
          Math.abs(diffX) > Math.abs(diffY) &&
          Math.abs(diffX) > 100
        ) {
          if (diffX > 0) {
            this.handleSwipeLeft();
          } else {
            this.handleSwipeRight();
          }
        }

        // Reset values
        touchStartX = 0;
        touchStartY = 0;
        touchStartTime = 0;
      },
      { passive: true }
    );
  },

  handleSwipeLeft() {
    // Could be used to navigate to next section
    console.log("Swiped left");
  },

  handleSwipeRight() {
    // Could be used to go back or reset
    if (this.state.currentPrediction) {
      this.resetImageInput();
    }
  },

  // Keyboard Shortcuts
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (this.state.currentImage && !this.state.isProcessing) {
        this.performAnalysis();
      }
    }

    // Escape to reset/close
    if (e.key === "Escape") {
      // Close any open modals first
      const modals = document.querySelectorAll(
        ".urgent-alert-modal, .help-modal, .experts-modal, .disease-modal"
      );
      if (modals.length > 0) {
        modals[modals.length - 1].remove();
      } else if (this.state.cameraActive) {
        this.stopCamera();
      } else if (this.state.currentImage) {
        this.resetImageInput();
      }
    }

    // Space to take photo if camera is active
    if (e.key === " " && this.state.cameraActive) {
      e.preventDefault();
      if (typeof CameraHandler !== "undefined") {
        CameraHandler.capturePhoto();
      }
    }

    // R key to reset
    if (e.key.toLowerCase() === "r" && !e.target.matches("input, textarea")) {
      e.preventDefault();
      this.resetImageInput();
    }
  },

  // Window and Resize Handling
  handleResize() {
    // Update camera aspect ratio if active
    if (this.state.cameraActive && typeof CameraHandler !== "undefined") {
      CameraHandler.updateCameraSize();
    }

    // Update responsive breakpoints
    this.updateResponsiveClasses();
  },

  updateResponsiveClasses() {
    const width = window.innerWidth;
    const body = document.body;

    body.classList.toggle("mobile-view", width < 768);
    body.classList.toggle("tablet-view", width >= 768 && width < 1024);
    body.classList.toggle("desktop-view", width >= 1024);
  },

  handleScroll() {
    const scrollY = window.scrollY;

    // Update navigation background based on scroll
    const nav = document.querySelector(".main-nav");
    if (nav) {
      nav.classList.toggle("scrolled", scrollY > 100);
    }

    // Show/hide scroll to top button
    this.toggleScrollToTop(scrollY > 500);
  },

  // Enhance the toggleScrollToTop function
toggleScrollToTop(show) {
    let scrollBtn = document.getElementById("scroll-to-top");

    if (show && !scrollBtn) {
        // Create the button
        scrollBtn = document.createElement("button");
        scrollBtn.id = "scroll-to-top";
        scrollBtn.className = "scroll-to-top-btn";
        scrollBtn.setAttribute("aria-label", "वर जा");
        scrollBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
        `;
        
        // Add click handler
        scrollBtn.onclick = () => {
            window.scrollTo({ 
                top: 0, 
                behavior: "smooth" 
            });
        };
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .scroll-to-top-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: var(--primary-green, #4CAF50);
                color: white;
                border: none;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                cursor: pointer;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .scroll-to-top-btn:hover {
                background: var(--primary-green-dark, #388E3C);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }

            .scroll-to-top-btn:active {
                transform: translateY(0);
            }

            .scroll-to-top-btn.visible {
                opacity: 1;
                transform: translateY(0);
            }

            @media (max-width: 768px) {
                .scroll-to-top-btn {
                    bottom: 20px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(scrollBtn);
        
        // Add visible class after a small delay to trigger animation
        setTimeout(() => scrollBtn.classList.add('visible'), 100);
    } else if (!show && scrollBtn) {
        // Remove visible class first to trigger fade out animation
        scrollBtn.classList.remove('visible');
        // Remove button after animation completes
        setTimeout(() => scrollBtn.remove(), 300);
    }
},

  // Page Visibility Handling
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden - pause any ongoing operations
      if (this.state.cameraActive && typeof CameraHandler !== "undefined") {
        CameraHandler.pauseCamera();
      }
    } else {
      // Page is visible - resume operations
      if (this.state.cameraActive && typeof CameraHandler !== "undefined") {
        CameraHandler.resumeCamera();
      }

      // Check for system health if it's been a while
      const timeSinceLastCheck =
        Date.now() - (this.state.lastHealthCheck?.getTime() || 0);
      if (timeSinceLastCheck > 300000) {
        // 5 minutes
        this.checkSystemHealth();
      }
    }
  },

  // Progressive Disclosure
  initializeProgressiveDisclosure() {
    // Hide advanced options initially
    const advancedOptions = document.querySelectorAll(".advanced-option");
    advancedOptions.forEach((option) => {
      option.style.display = "none";
    });

    // Show/hide based on user interaction
    const showAdvanced = document.getElementById("show-advanced-options");
    if (showAdvanced) {
      showAdvanced.addEventListener("click", () => {
        advancedOptions.forEach((option) => {
          option.style.display =
            option.style.display === "none" ? "block" : "none";
        });
      });
    }
  },

  // Help System
  initializeHelpSystem() {
    // Add tooltips for complex features
    const tooltipElements = document.querySelectorAll("[data-tooltip]");
    tooltipElements.forEach((element) => {
      this.addTooltip(element);
    });

    // Add contextual help
    this.addContextualHelp();
  },

  addTooltip(element) {
    const tooltipText = element.getAttribute("data-tooltip");
    if (!tooltipText) return;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = tooltipText;

    element.addEventListener("mouseenter", () => {
      document.body.appendChild(tooltip);
      this.positionTooltip(tooltip, element);
    });

    element.addEventListener("mouseleave", () => {
      if (tooltip.parentElement) {
        tooltip.remove();
      }
    });
  },

  positionTooltip(tooltip, element) {
    const rect = element.getBoundingClientRect();
    tooltip.style.position = "fixed";
    tooltip.style.left =
      rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + "px";
    tooltip.style.zIndex = "10000";
  },

  addContextualHelp() {
    // Add help buttons in relevant sections
    const helpSections = [
      { selector: ".input-section", helpText: "फोटो अपलोडसाठी मदत" },
      { selector: ".camera-container", helpText: "कॅमेरा वापरण्यासाठी मदत" },
    ];

    helpSections.forEach((section) => {
      const element = document.querySelector(section.selector);
      if (element && !element.querySelector(".help-button")) {
        const helpBtn = document.createElement("button");
        helpBtn.className = "help-button";
        helpBtn.innerHTML = "?";
        helpBtn.title = section.helpText;
        helpBtn.onclick = () => this.showContextualHelp(section.helpText);
        element.appendChild(helpBtn);
      }
    });
  },

  showContextualHelp(helpText) {
    this.showToast(`💡 ${helpText}`, "info", 5000);
  },

  // Toast logic to prevent duplicates
  showToast(message, type = 'info', duration = 5000) {
    const now = Date.now();
    // Only suppress if exact same message/type within 2s
    if (
      message === this._lastToast.message &&
      type === this._lastToast.type &&
      now - this._lastToast.timestamp < 2000
    ) {
      return;
    }
    this._lastToast = { message, type, timestamp: now };
    // Remove any existing toast with the same message/type before showing a new one
    const toasts = document.querySelectorAll('.flash-message');
    toasts.forEach(t => {
      const text = t.querySelector('.flash-text');
      if (text && text.textContent.trim() === message.trim() && t.classList.contains(`flash-${type}`)) {
        t.remove();
      }
    });
    // Create toast element (always .flash-message style)
    const toast = document.createElement('div');
    toast.className = `flash-message flash-${type}`;
    toast.innerHTML = `
      <span class="flash-icon">${this.getToastIcon(type)}</span>
      <span class="flash-text">${message}</span>
      <button class="flash-close" onclick="this.parentElement.remove()">✕</button>
    `;
    // Add to container
    let container = document.querySelector('.flash-messages');
    if (!container) {
      container = document.createElement('div');
      container.className = 'flash-messages';
      document.body.appendChild(container);
    }
    container.appendChild(toast);
    // Auto remove
    const timeoutId = setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
    // Cancel auto-remove on hover
    toast.addEventListener('mouseenter', () => clearTimeout(timeoutId));
    return toast;
  },

  // Utility Functions for Performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Auto-initialize if not already done
  if (!SugarcaneApp.initialized) {
    SugarcaneApp.init();
    SugarcaneApp.initialized = true;
  }
});

// Global error handler
window.addEventListener("error", (e) => {
  // Disable error popup
  // (No action: popup removed as requested)
});

// Global unhandled promise rejection handler
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
  if (SugarcaneApp.showToast) {
    SugarcaneApp.showToast("नेटवर्क त्रुटी, कृपया पुन्हा प्रयत्न करा", "error");
  }
  e.preventDefault();
});

// Footer Quick Links Functions
const FooterActions = {
    // Scroll to sections on the same page
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // If section doesn't exist, scroll to common diseases
            const diseasesSection = document.querySelector('.recent-diseases-section');
            if (diseasesSection) {
                diseasesSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    },

    // Show help modal
    showHelpModal() {
        const helpModal = document.createElement('div');
        helpModal.className = 'modal-overlay';
        helpModal.innerHTML = `
            <div class="modal-content help-modal">
                <div class="modal-header">
                    <h3><span class="modal-icon">🆘</span>सहाय्य आणि मार्गदर्शन</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="help-sections">
                        <div class="help-section">
                            <h4>📸 फोटो कसा घ्यावा?</h4>
                            <ul>
                                <li>ऊसाच्या पानाचा स्पष्ट फोटो घ्या</li>
                                <li>रोगाचे लक्षण दिसणारा भाग फोकसमध्ये ठेवा</li>
                                <li>चांगला प्रकाश असल्याची खात्री करा</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h4>📞 संपर्क माहिती</h4>
                            <p><strong>हेल्पलाइन:</strong> 1800-XXX-XXXX</p>
                            <p><strong>ईमेल:</strong> support@chordz.tech</p>
                        </div>
                        <div class="help-section">
                            <h4>💡 टिप्स</h4>
                            <ul>
                                <li>निदानानंतर तज्ञांचा सल्ला घ्या</li>
                                <li>वेळेवर उपचार करा</li>
                                <li>नियमित तपासणी करा</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(helpModal);
    },

    // Show privacy modal
    showPrivacyModal() {
        const privacyModal = document.createElement('div');
        privacyModal.className = 'modal-overlay';
        privacyModal.innerHTML = `
            <div class="modal-content privacy-modal">
                <div class="modal-header">
                    <h3><span class="modal-icon">🔒</span>गोपनीयता धोरण</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="privacy-content">
                        <div class="privacy-section">
                            <h4>📊 डेटा संकलन</h4>
                            <p>आम्ही फक्त रोग निदानासाठी आवश्यक असलेली माहिती गोळा करतो.</p>
                        </div>
                        <div class="privacy-section">
                            <h4>🔐 डेटा सुरक्षा</h4>
                            <p>तुमची सर्व माहिती सुरक्षित आणि गुप्त ठेवली जाते.</p>
                        </div>
                        <div class="privacy-section">
                            <h4>🚫 डेटा शेअरिंग</h4>
                            <p>आम्ही तुमची व्यक्तिगत माहिती तृतीय पक्षांशी शेअर करत नाही.</p>
                        </div>
                        <div class="privacy-section">
                            <h4>📧 संपर्क</h4>
                            <p>गोपनीयतेबाबत प्रश्न असल्यास: <strong>privacy@chordz.tech</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(privacyModal);
    },

    // Show about modal
    showAboutModal() {
        const aboutModal = document.createElement('div');
        aboutModal.className = 'modal-overlay';
        aboutModal.innerHTML = `
            <div class="modal-content about-modal">
                <div class="modal-header">
                    <h3><span class="modal-icon">ℹ️</span>आमच्याबद्दल</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="about-content">
                        <div class="company-info">
                            <div class="company-logo-section">
                                <div class="about-logo">🌾</div>
                                <h4>Chordz Technologies</h4>
                                <p class="company-motto">भारतीय शेतकऱ्यासाठी आधुनिक तंत्रज्ञान</p>
                            </div>
                        </div>
                        <div class="about-section">
                            <h4>🎯 आमचे ध्येय</h4>
                            <p>AI तंत्रज्ञान वापरून भारतीय शेतकऱ्यांना उत्तम सेवा प्रदान करणे.</p>
                        </div>
                        <div class="about-section">
                            <h4>🏆 आमची उपलब्धी</h4>
                            <ul>
                                <li>50,000+ शेतकऱ्यांना सेवा</li>
                                <li>95% अचूक निदान</li>
                                <li>15+ रोगांची ओळख</li>
                            </ul>
                        </div>
                        <div class="about-section">
                            <h4>📞 संपर्क</h4>
                            <p><strong>ईमेल:</strong> info@chordz.tech</p>
                            <p><strong>वेबसाइट:</strong> www.chordz.tech</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(aboutModal);
    },

    // Download app function
    downloadApp() {
        // Check if it's a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Show app download options
            const downloadModal = document.createElement('div');
            downloadModal.className = 'modal-overlay';
            downloadModal.innerHTML = `
                <div class="modal-content download-modal">
                    <div class="modal-header">
                        <h3><span class="modal-icon">📱</span>अॅप डाउनलोड करा</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="download-options">
                            <div class="download-option">
                                <div class="platform-icon">🤖</div>
                                <h4>Android</h4>
                                <p>Google Play Store वरून डाउनलोड करा</p>
                                <button class="download-btn" onclick="window.open('#', '_blank')">
                                    डाउनलोड करा
                                </button>
                            </div>
                            <div class="download-option">
                                <div class="platform-icon">🍎</div>
                                <h4>iOS</h4>
                                <p>App Store वरून डाउनलोड करा</p>
                                <button class="download-btn" onclick="window.open('#', '_blank')">
                                    डाउनलोड करा
                                </button>
                            </div>
                        </div>
                        <div class="web-app-option">
                            <h4>📲 Web App</h4>
                            <p>ब्राउझरमध्येच वापर करा - डाउनलोड करण्याची गरज नाही!</p>
                            <button class="web-app-btn" onclick="this.closest('.modal-overlay').remove()">
                                सुरू ठेवा
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(downloadModal);
        } else {
            UIHandler.showToast('या सेवा मोबाईल डिव्हाइसवर उपलब्ध आहे', 'info');
        }
    }
};

// Make functions globally available
window.scrollToSection = FooterActions.scrollToSection;
window.showHelpModal = FooterActions.showHelpModal;
window.showPrivacyModal = FooterActions.showPrivacyModal;
window.showAboutModal = FooterActions.showAboutModal;
window.downloadApp = FooterActions.downloadApp;


// Export for global access
window.SugarcaneApp = SugarcaneApp;
