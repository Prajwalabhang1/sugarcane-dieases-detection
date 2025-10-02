/* ================================================
   API Communication Handler for ऊस एकरी १०० टन
   Professional API management with offline support
   Chordz Technologies
   ================================================= */

const APIHandler = {
    // API Configuration
    config: {
        baseURL: window.location.origin,
        endpoints: {
            predict: '/api/predict',
            health: '/api/health',
            diseases: '/api/all-diseases',
            support: '/api/farmer-support',
            diseaseInfo: '/api/disease-info'
        },
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        maxConcurrent: 2
    },

    // Request queue management
    state: {
        activeRequests: new Map(),
        requestQueue: [],
        offlineQueue: [],
        isOnline: navigator.onLine,
        rateLimitRemaining: 100,
        rateLimitReset: null
    },

    // API Messages in Marathi
    messages: {
        connecting: 'सर्व्हरशी जोडणी करत आहे...',
        uploading: 'अपलोड करत आहे...',
        processing: 'प्रक्रिया करत आहे...',
        networkError: 'नेटवर्क त्रुटी - कृपया कनेक्शन तपासा',
        serverError: 'सर्व्हर त्रुटी - कृपया पुन्हा प्रयत्न करा',
        timeout: 'विनंती वेळ संपला - कृपया पुन्हा प्रयत्न करा',
        rateLimited: 'खूप विनंत्या - कृपया थोडा वेळ थांबा',
        offline: 'इंटरनेट कनेक्शन नाही - ऑफलाइन मोडमध्ये',
        queuedOffline: 'विनंती रांगेत ठेवली - कनेक्शन परत आल्यावर पाठवेल'
    },

    // Initialize API handler
    init() {
        console.log('🌐 Initializing API Handler...');
        
        this.setupNetworkMonitoring();
        this.setupInterceptors();
        this.setupOfflineSupport();
        
        if (this.state.isOnline) {
            this.processOfflineQueue();
        }
        
        console.log('✅ API Handler initialized');
    },

    // Network monitoring
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            console.log('📶 Network back online');
            this.state.isOnline = true;
            this.showToast('इंटरनेट कनेक्शन परत आले!', 'success');
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📵 Network offline');
            this.state.isOnline = false;
            this.showToast(this.messages.offline, 'warning');
        });

        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }
    },

    handleConnectionChange() {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || connection.downlink < 0.5) {
            this.config.timeout = 60000; // Increase timeout for slow connections
            this.showToast('धीमे कनेक्शन - कृपया धीर धरा', 'info', 3000);
        } else {
            this.config.timeout = 30000; // Reset to normal
        }
    },

    setupInterceptors() {
        // Override fetch to add headers and tracking
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const [resource, config = {}] = args;

            config.headers = {
                'Content-Type': 'application/json',
                'X-Client-Version': '1.0.0',
                'X-Device-Type': this.getDeviceType(),
                'X-Language': 'marathi',
                ...config.headers
            };

            const requestId = this.generateRequestId();
            this.trackRequest(requestId, resource, 'started');

            try {
                const response = await originalFetch(resource, config);
                this.trackRequest(requestId, resource, 'completed', { status: response.status });
                return response;
            } catch (error) {
                this.trackRequest(requestId, resource, 'failed', { error: error.message });
                throw error;
            }
        };
    },

    setupOfflineSupport() {
        try {
            const stored = localStorage.getItem('api-offline-queue');
            if (stored) {
                this.state.offlineQueue = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load offline queue:', error);
        }
    },

    async predict(formData, options = {}) {
        return this.makeRequest(this.config.endpoints.predict, {
            method: 'POST',
            body: formData,
            timeout: this.config.timeout,
            ...options
        });
    },

    async checkHealth() {
        return this.makeRequest(this.config.endpoints.health, { method: 'GET', timeout: 5000, cache: 'no-cache' });
    },

    async getAllDiseases() {
        return this.makeRequest(this.config.endpoints.diseases, { method: 'GET', timeout: 10000, cache: 'force-cache' });
    },

    async getDiseaseInfo(diseaseName) {
        const endpoint = `${this.config.endpoints.diseaseInfo}/${encodeURIComponent(diseaseName)}`;
        return this.makeRequest(endpoint, { method: 'GET', timeout: 10000 });
    },

    async getFarmerSupport() {
        return this.makeRequest(this.config.endpoints.support, { method: 'GET', timeout: 10000 });
    },

    async makeRequest(endpoint, options = {}) {
        const url = this.buildURL(endpoint);

        if (this.isDuplicateRequest(url, options)) {
            console.log('Duplicate request detected, waiting for existing...');
            return this.waitForExistingRequest(url);
        }

        if (this.isRateLimited()) {
            throw new Error(this.messages.rateLimited);
        }

        if (!this.state.isOnline && options.allowOffline !== false) {
            return this.handleOfflineRequest(endpoint, options);
        }

        const requestId = this.generateRequestId();
        this.state.activeRequests.set(requestId, { url, startTime: Date.now() });

        try {
            const response = await this.executeRequest(url, options, requestId);
            return response;
        } catch (error) {
            return this.handleRequestError(error, endpoint, options, requestId);
        } finally {
            this.state.activeRequests.delete(requestId);
        }
    },

    async executeRequest(url, options, requestId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);
        
        try {
            const requestOptions = { ...options, signal: controller.signal };
            delete requestOptions.progressCallback;
            delete requestOptions.timeout;
            delete requestOptions.allowOffline;
            delete requestOptions.retryAttempts;

            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            return await this.processResponse(response, options);
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error(this.messages.timeout);
            }
            throw error;
        }
    },

    async processResponse(response, options) {
        this.updateRateLimiting(response);
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            throw new APIError(
                errorData?.error_marathi || `HTTP ${response.status}`,
                response.status,
                errorData
            );
        }

        const data = await response.json();
        this.logRequest('success', response.url, response.status);
        return data;
    },

    async handleRequestError(error, endpoint, options, requestId, retryCount = 0) {
        console.error('API Request Error:', error);
        
        const maxRetries = options.retryAttempts || this.config.retryAttempts;
        const canRetry = retryCount < maxRetries && this.shouldRetry(error);
        
        if (canRetry) {
            const delay = this.calculateRetryDelay(retryCount);
            console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await this.sleep(delay);
            try {
                return await this.makeRequest(endpoint, { ...options, _retryCount: retryCount + 1 });
            } catch (retryError) {
                return this.handleRequestError(retryError, endpoint, options, requestId, retryCount + 1);
            }
        }
        
        if (error instanceof APIError) {
            throw error;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error(this.messages.networkError);
        } else if (error.message.includes('timeout') || error.message.includes('abort')) {
            throw new Error(this.messages.timeout);
        } else {
            throw new Error(this.messages.serverError);
        }
    },

    shouldRetry(error) {
        if (error instanceof APIError) {
            return error.status >= 500 || error.status === 429;
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return true;
        }
        return false;
    },

    calculateRetryDelay(retryCount) {
        const baseDelay = this.config.retryDelay;
        const maxDelay = 30000; // 30 seconds max
        
        const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
        const jitter = Math.random() * 0.1 * delay;
        return delay + jitter;
    },

    async handleOfflineRequest(endpoint, options) {
        console.log('Handling offline request:', endpoint);

        if (options.method === 'GET' || !options.method) {
            const cached = this.getCachedData(endpoint);
            if (cached) {
                this.showToast('ऑफलाइन डेटा दाखवत आहे', 'info', 3000);
                return cached;
            }
        }

        if (options.method === 'POST' && options.body) {
            const queuedRequest = {
                id: this.generateRequestId(),
                endpoint,
                options: { ...options },
                timestamp: Date.now()
            };

            if (options.body instanceof FormData) {
                queuedRequest.formDataEntries = Array.from(options.body.entries());
                delete queuedRequest.options.body;
            }

            this.state.offlineQueue.push(queuedRequest);
            this.saveOfflineQueue();

            this.showToast(this.messages.queuedOffline, 'info', 5000);
            throw new Error('विनंती ऑफलाइन रांगेत ठेवली');
        }

        throw new Error(this.messages.offline);
    },

    async processOfflineQueue() {
        if (this.state.offlineQueue.length === 0) return;

        console.log(`Processing ${this.state.offlineQueue.length} offline requests...`);
        this.showToast('ऑफलाइन विनंत्या प्रक्रिया करत आहे...', 'info', 3000);

        const queue = [...this.state.offlineQueue];
        this.state.offlineQueue = [];
        this.saveOfflineQueue();

        for (const request of queue) {
            try {
                if (request.formDataEntries) {
                    const formData = new FormData();
                    request.formDataEntries.forEach(([key, value]) => {
                        formData.append(key, value);
                    });
                    request.options.body = formData;
                }

                await this.makeRequest(request.endpoint, { 
                    ...request.options, 
                    allowOffline: false 
                });

                console.log('Offline request processed:', request.id);

            } catch (error) {
                console.warn('Offline request failed:', request.id, error);
                // Optional: re-queue failed requests
            }
        }

        if (queue.length > 0) {
            this.showToast('ऑफलाइन विनंत्या प्रक्रिया पूर्ण!', 'success');
        }
    },

    saveOfflineQueue() {
        try {
            localStorage.setItem('api-offline-queue', JSON.stringify(this.state.offlineQueue));
        } catch (error) {
            console.warn('Failed to save offline queue:', error);
        }
    },

    getCachedData(endpoint) {
        try {
            const cacheKey = `api-cache-${endpoint}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                if (age < 3600000) { // cache max age 1 hour
                    return data;
                }
            }
        } catch (error) {
            console.warn('Cache retrieval failed:', error);
        }
        return null;
    },

    setCachedData(endpoint, data) {
        try {
            const cacheKey = `api-cache-${endpoint}`;
            const cacheData = { data, timestamp: Date.now() };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Cache storage failed:', error);
        }
    },

    updateRateLimiting(response) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');

        if (remaining) this.state.rateLimitRemaining = parseInt(remaining);
        if (reset) this.state.rateLimitReset = parseInt(reset) * 1000;
    },

    isRateLimited() {
        if (this.state.rateLimitRemaining <= 0 && this.state.rateLimitReset) {
            return Date.now() < this.state.rateLimitReset;
        }
        return false;
    },

    isDuplicateRequest(url, options) {
        const signature = this.getRequestSignature(url, options);
        for (const [_, request] of this.state.activeRequests) {
            if (request.signature === signature) {
                return true;
            }
        }
        return false;
    },

    getRequestSignature(url, options) {
        const key = `${options.method || 'GET'}-${url}`;
        if (options.body && typeof options.body === 'string') {
            return `${key}-${options.body.substring(0, 100)}`;
        }
        return key;
    },

    async waitForExistingRequest(url) {
        for (const [id, request] of this.state.activeRequests) {
            if (request.url === url) {
                return new Promise((resolve, reject) => {
                    const checkInterval = setInterval(() => {
                        if (!this.state.activeRequests.has(id)) {
                            clearInterval(checkInterval);
                            const cached = this.getCachedData(url);
                            if (cached) resolve(cached);
                            else reject(new Error('Duplicate request completed but no result available'));
                        }
                    }, 100);

                    setTimeout(() => {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for duplicate request'));
                    }, 30000);
                });
            }
        }
        throw new Error('Existing request not found');
    },

    // Utility functions
    buildURL(endpoint) {
        return `${this.config.baseURL}${endpoint}`;
    },

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    async safeJsonParse(response) {
        try {
            return await response.json();
        } catch (error) {
            return null;
        }
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/tablet|ipad/i.test(userAgent)) return 'tablet';
        if (/mobile|iphone|android/i.test(userAgent)) return 'mobile';
        return 'desktop';
    },

    // Logging and analytics
    logRequest(type, url, status) {
        const logEntry = {
            type, url, status, timestamp: new Date().toISOString(), userAgent: navigator.userAgent
        };

        console.log('API Log:', logEntry);

        try {
            const logs = JSON.parse(localStorage.getItem('api-logs') || '[]');
            logs.push(logEntry);
            if (logs.length > 100) logs.splice(0, logs.length - 100);
            localStorage.setItem('api-logs', JSON.stringify(logs));
        } catch (error) {
            console.warn('Failed to store API log:', error);
        }
    },

    trackRequest(requestId, resource, status, metadata = {}) {
        const trackingData = { requestId, resource, status, metadata, timestamp: new Date().toISOString() };
        console.log('Request Tracking:', trackingData);
    },

    showToast(message, type = 'info', duration = 5000) {
        if (window.SugarcaneApp && window.SugarcaneApp.showToast) {
            window.SugarcaneApp.showToast(message, type, duration);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
};

// Custom API Error class
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Auto-initialize API handler
document.addEventListener('DOMContentLoaded', () => {
    APIHandler.init();
});

// Export for global access
window.APIHandler = APIHandler;
window.APIError = APIError;
