/* ================================================
   UI Handler for ऊस एकरी १०० टन
   Professional UI interactions and animations
   Farmer-friendly interface enhancements
   Chordz Technologies
   ================================================ */

const UIHandler = {
    // Track last shown toast to prevent duplicates
    _lastToast: { message: '', type: '', timestamp: 0 },
    // UI State Management
    state: {
        activeModals: [],
        scrollPosition: 0,
        animations: new Map(),
        userPreferences: {
            reducedMotion: false,
            highContrast: false,
            fontSize: 'normal'
        },
        touchDevice: 'ontouchstart' in window
    },

    // UI Configuration
    config: {
        animationDuration: 300,
        toastDuration: 5000,
        scrollThreshold: 100,
        longPressDelay: 500,
        doubleTapDelay: 300
    },

    // Initialize UI Handler
    init() {
        console.log('🎨 Initializing UI Handler...');
        
        // Detect user preferences
        this.detectUserPreferences();
        
        // Setup global UI event listeners
        this.setupGlobalEventListeners();
        
        // Setup touch gestures
        if (this.state.touchDevice) {
            this.setupTouchGestures();
        }
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Setup scroll handling
        this.setupScrollHandling();
        
        // Setup responsive behavior
        this.setupResponsiveHandling();
        
        // Setup animation system
        this.setupAnimations();
        
        // Initialize tooltips and help system
        this.initializeTooltips();
        
        // Setup form enhancements
        this.setupFormEnhancements();
        
        console.log('✅ UI Handler initialized');
    },

    // Detect user preferences from system
    detectUserPreferences() {
        // Reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.state.userPreferences.reducedMotion = prefersReducedMotion.matches;
        
        prefersReducedMotion.addEventListener('change', (e) => {
            this.state.userPreferences.reducedMotion = e.matches;
            this.updateAnimationSettings();
        });

        // High contrast preference
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
        this.state.userPreferences.highContrast = prefersHighContrast.matches;
        
        prefersHighContrast.addEventListener('change', (e) => {
            this.state.userPreferences.highContrast = e.matches;
            document.body.classList.toggle('high-contrast', e.matches);
        });

        // Font size from localStorage
        const savedFontSize = localStorage.getItem('ui-font-size');
        if (savedFontSize) {
            this.state.userPreferences.fontSize = savedFontSize;
            this.applyFontSize(savedFontSize);
        }
    },

    // Setup global event listeners
    setupGlobalEventListeners() {
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Orientation change for mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Click outside to close modals
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        // Focus management
        document.addEventListener('focusin', (e) => {
            this.handleFocusIn(e);
        });

        document.addEventListener('focusout', (e) => {
            this.handleFocusOut(e);
        });
    },

    // Setup touch gesture recognition
    setupTouchGestures() {
        let touchState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            isLongPress: false,
            longPressTimer: null
        };

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                touchState.startX = touch.clientX;
                touchState.startY = touch.clientY;
                touchState.startTime = Date.now();
                touchState.isLongPress = false;
                
                // Start long press timer
                touchState.longPressTimer = setTimeout(() => {
                    touchState.isLongPress = true;
                    this.handleLongPress(e, touch);
                }, this.config.longPressDelay);
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (touchState.longPressTimer) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchState.startX);
                const deltaY = Math.abs(touch.clientY - touchState.startY);
                
                // Cancel long press if moved too much
                if (deltaX > 10 || deltaY > 10) {
                    clearTimeout(touchState.longPressTimer);
                    touchState.longPressTimer = null;
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (touchState.longPressTimer) {
                clearTimeout(touchState.longPressTimer);
                touchState.longPressTimer = null;
            }

            if (!touchState.isLongPress && e.changedTouches.length === 1) {
                const touch = e.changedTouches[0];
                const deltaTime = Date.now() - touchState.startTime;
                
                // Handle quick taps
                if (deltaTime < this.config.doubleTapDelay) {
                    this.handleQuickTap(e, touch);
                }
            }
        }, { passive: true });
    },

    // Handle long press gesture
    handleLongPress(e, touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element) {
            // Haptic feedback
            this.hapticFeedback('medium');
            
            // Show context menu for certain elements
            if (element.classList.contains('result-card') || 
                element.classList.contains('disease-item') ||
                element.classList.contains('info-card')) {
                this.showContextMenu(element, touch.clientX, touch.clientY);
            }
            
            // Show tooltip for elements with data-tooltip
            if (element.hasAttribute('data-tooltip')) {
                this.showTooltip(element, touch.clientX, touch.clientY);
            }
        }
    },

    // Handle quick tap
    handleQuickTap(e, touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element) {
            // Add ripple effect for buttons
            if (element.classList.contains('btn') || 
                element.classList.contains('option-btn') ||
                element.classList.contains('action-btn')) {
                this.createRippleEffect(element, touch.clientX, touch.clientY);
            }
        }
    },

    // Create ripple effect animation
    createRippleEffect(element, x, y) {
        if (this.state.userPreferences.reducedMotion) return;

        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            left: ${x - rect.left}px;
            top: ${y - rect.top}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Add ripple animation styles if not exists
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        width: 200px;
                        height: 200px;
                        opacity: 0;
                    }
                }
                .ripple-container {
                    position: relative;
                    overflow: hidden;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Make element ripple container
        if (!element.classList.contains('ripple-container')) {
            element.classList.add('ripple-container');
        }
        
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentElement) {
                ripple.remove();
            }
        }, 600);
    },

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        let isTabbing = false;

        document.addEventListener('keydown', (e) => {
            // Track tab navigation
            if (e.key === 'Tab') {
                isTabbing = true;
                document.body.classList.add('keyboard-navigation');
            }

            // Handle keyboard shortcuts
            this.handleKeyboardShortcuts(e);
        });

        document.addEventListener('mousedown', () => {
            if (isTabbing) {
                isTabbing = false;
                document.body.classList.remove('keyboard-navigation');
            }
        });

        // Enhanced focus management
        this.setupFocusTraps();
    },

    // Setup focus traps for modals
    setupFocusTraps() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && (
                            node.classList.contains('modal') ||
                            node.classList.contains('urgent-alert-modal') ||
                            node.classList.contains('help-modal')
                        )) {
                            this.createFocusTrap(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    },

    // Create focus trap for modal
    createFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        setTimeout(() => firstElement.focus(), 100);

        // Handle tab cycling
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }

            // Close on Escape
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeModal(modal);
            }
        });
    },

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Global shortcuts
        const shortcuts = {
            // Alt + H - Help
            'Alt+KeyH': () => this.showGlobalHelp(),
            
            // Alt + S - Settings
            'Alt+KeyS': () => this.showSettings(),
            
            // Ctrl/Cmd + K - Search/Command palette
            'Control+KeyK': (e) => {
                e.preventDefault();
                this.showCommandPalette();
            },
            'Meta+KeyK': (e) => {
                e.preventDefault();
                this.showCommandPalette();
            },

            // F1 - Help
            'F1': (e) => {
                e.preventDefault();
                this.showContextualHelp();
            }
        };

        const key = `${e.ctrlKey ? 'Control+' : ''}${e.metaKey ? 'Meta+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.code}`;
        
        if (shortcuts[key]) {
            shortcuts[key](e);
        }
    },

    // Setup scroll handling
    setupScrollHandling() {
        let scrollTimer = null;
        let isScrolling = false;

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                document.body.classList.add('scrolling');
            }

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                isScrolling = false;
                document.body.classList.remove('scrolling');
            }, 150);

            this.handleScroll();
        }, { passive: true });
    },

    // Handle scroll events
    handleScroll() {
        const scrollY = window.pageYOffset;
        const scrollDelta = scrollY - this.state.scrollPosition;
        this.state.scrollPosition = scrollY;

        // Update navigation bar
        this.updateNavigationScroll(scrollY, scrollDelta);

        // Handle scroll-to-top button
        this.updateScrollToTop(scrollY);

        // Lazy load elements
        this.handleLazyLoading();

        // Update scroll progress
        this.updateScrollProgress();
    },

    // Update navigation on scroll
    updateNavigationScroll(scrollY, scrollDelta) {
        const nav = document.querySelector('.main-nav');
        if (!nav) return;

        // Add shadow when scrolled
        nav.classList.toggle('scrolled', scrollY > this.config.scrollThreshold);

        // Hide/show navigation on mobile based on scroll direction
        if (window.innerWidth <= 768) {
            if (scrollDelta > 5 && scrollY > 100) {
                nav.classList.add('nav-hidden');
            } else if (scrollDelta < -5) {
                nav.classList.remove('nav-hidden');
            }
        }
    },

    // Create scroll to top button
    updateScrollToTop(scrollY) {
        // Show/hide scroll-to-top button based on scroll position
        const button = document.getElementById('scroll-to-top');
        if (button) {
            if (scrollY > 200) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        }
    },

    // Create scroll to top button
    createScrollToTopButton() {
        const button = document.createElement('button');
        button.id = 'scroll-to-top';
        button.className = 'scroll-to-top-btn';
        button.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m18 15-6-6-6 6"/>
            </svg>
        `;
        button.title = 'वर जा';
        button.setAttribute('aria-label', 'वर स्क्रॉल करा');
        button.addEventListener('click', () => {
            if (typeof this.smoothScrollTo === 'function') {
                this.smoothScrollTo(0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        // Add styles if not exist
        if (!document.getElementById('scroll-to-top-styles')) {
            const style = document.createElement('style');
            style.id = 'scroll-to-top-styles';
            style.textContent = `
                .scroll-to-top-btn {
                    position: fixed;
                    bottom: 80px;
                    right: 20px;
                    width: 48px;
                    height: 48px;
                    border: none;
                    border-radius: 24px;
                    background: #388e3c;
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    cursor: pointer;
                    opacity: 0.85;
                    z-index: 9999;
                    transition: opacity 0.2s;
                }
                .scroll-to-top-btn.visible {
                    opacity: 1;
                    pointer-events: auto;
                }
            `;
            document.head.appendChild(style);
        }
        document.body.appendChild(button);
        return button;
    }
    //                 opacity: 0;
    //                 transform: translateY(20px);
    //                 transition: all 0.3s ease;
    //                 z-index: 1000;
    //                 display: flex;
    //                 align-items: center;
    //                 justify-content: center;
    //             }
    //             .scroll-to-top-btn.visible {
    //                 opacity: 1;
    //                 transform: translateY(0);
    //             }
    //             .scroll-to-top-btn:hover {
    //                 background: var(--primary-green-dark);
    //                 transform: translateY(-2px);
    //                 box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    //             }
    //             .scroll-to-top-btn:active {
    //                 transform: translateY(0);
    //             }
    //             @media (max-width: 768px) {
    //                 .scroll-to-top-btn {
    //                     bottom: 100px;
    //                     right: 16px;
    //                     width: 44px;
    //                     height: 44px;
    //                 }
    //             }
    //         `;
    //         document.head.appendChild(style);
    //     }
        
    //     document.body.appendChild(button);
    //     return button;
    // },

    // Setup responsive handling
    ,setupResponsiveHandling() {
        // Initial responsive classes
        this.updateResponsiveClasses();
        
        // Handle resize
        window.addEventListener('resize', this.debounce(() => {
            this.updateResponsiveClasses();
        }, 100));
    },

    // Update responsive classes
    updateResponsiveClasses() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const body = document.body;
        
        // Viewport classes
        body.classList.toggle('viewport-mobile', width <= 768);
        body.classList.toggle('viewport-tablet', width > 768 && width <= 1024);
        body.classList.toggle('viewport-desktop', width > 1024);
        
        // Orientation classes
        body.classList.toggle('landscape', width > height);
        body.classList.toggle('portrait', width <= height);
        
        // Small screen detection
        body.classList.toggle('small-screen', height < 600);
    },

    // Handle orientation change
    handleOrientationChange() {
        // Force layout recalculation
        document.body.style.height = '100vh';
        
        setTimeout(() => {
            document.body.style.height = '';
            this.updateResponsiveClasses();
            
            // Notify camera handler if active
            if (window.CameraHandler && window.CameraHandler.state.isActive) {
                window.CameraHandler.updateCameraSize();
            }
        }, 100);
    },

    // Setup animation system
    setupAnimations() {
        // Intersection Observer for scroll animations
        if ('IntersectionObserver' in window && !this.state.userPreferences.reducedMotion) {
            this.setupScrollAnimations();
        }
        
        // Setup page transition animations
        this.setupPageTransitions();
    },

    // Setup scroll-triggered animations
    setupScrollAnimations() {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe animatable elements
        document.querySelectorAll('.animate-on-scroll, .feature-card, .info-card, .disease-item').forEach((el) => {
            animationObserver.observe(el);
        });

        this.animationObserver = animationObserver;
    },

    // Animate element when it comes into view
    animateElement(element) {
        if (this.state.animations.has(element)) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = `all ${this.config.animationDuration}ms ease-out`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
        
        this.state.animations.set(element, true);
    },

    // Setup page transitions
    setupPageTransitions() {
        // Handle link clicks for smooth transitions
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="/"]') && !e.target.hasAttribute('target')) {
                e.preventDefault();
                this.navigateWithTransition(e.target.href);
            }
        });
    },

    // Navigate with page transition
    navigateWithTransition(url) {
        if (this.state.userPreferences.reducedMotion) {
            window.location.href = url;
            return;
        }

        // Fade out current page
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 300ms ease-out';
        
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    },

    // Initialize tooltips
    initializeTooltips() {
        // Create tooltip container
        if (!document.getElementById('tooltip-container')) {
            const container = document.createElement('div');
            container.id = 'tooltip-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 10000;
            `;
            document.body.appendChild(container);
        }

        // Setup tooltip listeners
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE && e.target.hasAttribute('data-tooltip')) {
                this.showTooltip(e.target);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE && e.target.hasAttribute('data-tooltip')) {
                this.hideTooltip();
            }
        }, true);
    },

    // Show tooltip
    showTooltip(element, x = null, y = null) {
        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) return;

        const container = document.getElementById('tooltip-container');
        if (!container) return;

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = tooltipText;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            max-width: 200px;
            opacity: 0;
            transform: translateY(5px);
            transition: all 0.2s ease-out;
            z-index: 10001;
        `;

        container.appendChild(tooltip);

        // Position tooltip
        if (x !== null && y !== null) {
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y - 40}px`;
        } else {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        }

        // Animate in
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });

        this.currentTooltip = tooltip;
    },

    // Hide tooltip
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.style.opacity = '0';
            this.currentTooltip.style.transform = 'translateY(5px)';
            
            setTimeout(() => {
                if (this.currentTooltip && this.currentTooltip.parentElement) {
                    this.currentTooltip.remove();
                }
                this.currentTooltip = null;
            }, 200);
        }
    },

    // Setup form enhancements
    setupFormEnhancements() {
        // Enhanced input focus states
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.enhanceInputFocus(e.target);
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.removeInputFocus(e.target);
            }
        });

        // Real-time validation
        this.setupRealTimeValidation();
        
        // Input formatting
        this.setupInputFormatting();
    },

    // Enhance input focus
    enhanceInputFocus(input) {
        const wrapper = input.closest('.form-group, .option-group');
        if (wrapper) {
            wrapper.classList.add('focused');
        }
        
        // Add floating label effect
        if (input.value || input.placeholder) {
            input.classList.add('has-content');
        }
    },

    // Remove input focus
    removeInputFocus(input) {
        const wrapper = input.closest('.form-group, .option-group');
        if (wrapper) {
            wrapper.classList.remove('focused');
        }
        
        if (!input.value) {
            input.classList.remove('has-content');
        }
    },

    // Setup real-time validation
    setupRealTimeValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[type="number"]')) {
                this.validateNumberInput(e.target);
            } else if (e.target.matches('input[type="text"]')) {
                this.validateTextInput(e.target);
            }
        });
    },

    // Validate number input
    validateNumberInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        
        let isValid = true;
        let message = '';
        
        if (isNaN(value)) {
            isValid = false;
            message = 'कृपया वैध संख्या प्रविष्ट करा';
        } else if (min && value < min) {
            isValid = false;
            message = `किमान ${min} असावी`;
        } else if (max && value > max) {
            isValid = false;
            message = `कमाल ${max} असावी`;
        }
        
        this.updateInputValidation(input, isValid, message);
    },

    // Validate text input
    validateTextInput(input) {
        const value = input.value.trim();
        const minLength = parseInt(input.minLength) || 0;
        const maxLength = parseInt(input.maxLength) || Infinity;
        
        let isValid = true;
        let message = '';
        
        if (input.required && !value) {
            isValid = false;
            message = 'हे फील्ड आवश्यक आहे';
        } else if (value.length < minLength) {
            isValid = false;
            message = `किमान ${minLength} अक्षर आवश्यक`;
        } else if (value.length > maxLength) {
            isValid = false;
            message = `कमाल ${maxLength} अक्षर परवानगी`;
        }
        
        this.updateInputValidation(input, isValid, message);
    },

    // Update input validation state
    updateInputValidation(input, isValid, message) {
        const wrapper = input.closest('.form-group, .option-group');
        if (!wrapper) return;
        
        wrapper.classList.toggle('invalid', !isValid);
        wrapper.classList.toggle('valid', isValid);
        
        // Show/hide validation message
        let validationMsg = wrapper.querySelector('.validation-message');
        
        if (!isValid && message) {
            if (!validationMsg) {
                validationMsg = document.createElement('div');
                validationMsg.className = 'validation-message';
                wrapper.appendChild(validationMsg);
            }
            validationMsg.textContent = message;
        } else if (validationMsg) {
            validationMsg.remove();
        }
    },

    // Setup input formatting
    setupInputFormatting() {
        // Phone number formatting
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[data-format="phone"]')) {
                this.formatPhoneNumber(e.target);
            }
        });
    },

    // Format phone number input
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        
        if (value.length >= 10) {
            value = value.substring(0, 10); // Limit to 10 digits
            // Format as: 98765 43210
            value = value.replace(/(\d{5})(\d{5})/, '$1 $2');
        }
        
        input.value = value;
    },

    // Modal management
    showModal(modalElement) {
        if (!modalElement) return;
        
        // Add to active modals stack
        this.state.activeModals.push(modalElement);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Show modal with animation
        modalElement.style.display = 'flex';
        modalElement.style.opacity = '0';
        
        requestAnimationFrame(() => {
            modalElement.style.opacity = '1';
            const content = modalElement.querySelector('.modal-content, .alert-content, .help-content');
            if (content) {
                content.style.transform = 'scale(0.9)';
                content.style.transition = 'transform 0.3s ease-out';
                
                requestAnimationFrame(() => {
                    content.style.transform = 'scale(1)';
                });
            }
        });
        
        // Create focus trap
        this.createFocusTrap(modalElement);
    },

    closeModal(modalElement) {
        if (!modalElement) return;
        
        // Remove from active modals
        const index = this.state.activeModals.indexOf(modalElement);
        if (index > -1) {
            this.state.activeModals.splice(index, 1);
        }
        
        // Restore body scroll if no more modals
        if (this.state.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
        
        // Hide with animation
        modalElement.style.opacity = '0';
        const content = modalElement.querySelector('.modal-content, .alert-content, .help-content');
        if (content) {
            content.style.transform = 'scale(0.9)';
        }
        
        setTimeout(() => {
            modalElement.style.display = 'none';
            if (modalElement.parentElement) {
                modalElement.remove();
            }
        }, 300);
    },

    // Context menu
    showContextMenu(element, x, y) {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="copy">
                📋 कॉपी करा
            </div>
            <div class="context-menu-item" data-action="share">
                📤 शेअर करा
            </div>
            <div class="context-menu-item" data-action="info">
                ℹ️ माहिती
            </div>
        `;
        
        contextMenu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 4px 0;
            z-index: 10000;
            min-width: 120px;
        `;
        
        // Add click handlers
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleContextAction(action, element);
                contextMenu.remove();
            }
        });
        
        document.body.appendChild(contextMenu);
        
        // Remove on outside click
        setTimeout(() => {
            document.addEventListener('click', () => {
                if (contextMenu.parentElement) {
                    contextMenu.remove();
                }
            }, { once: true });
        }, 100);
    },

    // Handle context menu actions
    handleContextAction(action, element) {
        switch (action) {
            case 'copy':
                this.copyElementText(element);
                break;
            case 'share':
                this.shareElement(element);
                break;
            case 'info':
                this.showElementInfo(element);
                break;
        }
    },

    // Copy element text
    copyElementText(element) {
        const text = element.textContent || element.innerText;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('टेक्स्ट कॉपी केले!', 'success', 2000);
        }).catch(() => {
            this.showToast('कॉपी करण्यात त्रुटी', 'error', 2000);
        });
    },

    // Share element
    shareElement(element) {
        const text = element.textContent || element.innerText;
        if (navigator.share) {
            navigator.share({
                title: 'ऊस रोग माहिती',
                text: text
            });
        } else {
            this.copyElementText(element);
        }
    },

    // Show element info
    showElementInfo(element) {
        this.showToast('हे फीचर लवकरच उपलब्ध होईल', 'info', 3000);
    },

    // Smooth scroll
    smoothScrollTo(target, duration = 800) {
        const start = window.pageYOffset;
        const targetPosition = typeof target === 'number' ? target : target.offsetTop;
        const distance = targetPosition - start;
        let startTime = null;
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.easeInOutQuad(timeElapsed, start, distance, duration);
            
            window.scrollTo(0, run);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    },

    // Easing function
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },

    // Update animation settings
    updateAnimationSettings() {
        if (this.state.userPreferences.reducedMotion) {
            document.body.classList.add('reduced-motion');
            this.config.animationDuration = 0;
        } else {
            document.body.classList.remove('reduced-motion');
            this.config.animationDuration = 300;
        }
    },

    // Apply font size
    applyFontSize(size) {
        const sizes = {
            'small': '14px',
            'normal': '16px',
            'large': '18px',
            'xlarge': '20px'
        };
        
        if (sizes[size]) {
            document.documentElement.style.fontSize = sizes[size];
            localStorage.setItem('ui-font-size', size);
        }
    },

    // Lazy loading
    handleLazyLoading() {
        const lazyElements = document.querySelectorAll('[data-lazy]');
        
        lazyElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight + 100) {
                const src = element.dataset.lazy;
                if (element.tagName === 'IMG') {
                    element.src = src;
                } else {
                    element.style.backgroundImage = `url(${src})`;
                }
                element.removeAttribute('data-lazy');
            }
        });
    },

    // Update scroll progress
    updateScrollProgress() {
        const progress = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
        
        let progressBar = document.getElementById('scroll-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'scroll-progress';
            progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 3px;
                background: var(--primary-green);
                z-index: 10000;
                transition: width 0.1s ease;
            `;
            document.body.appendChild(progressBar);
        }
        
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    },

    // Global click handler
    handleGlobalClick(e) {
        // Close dropdowns and tooltips on outside click
        if (!e.target.closest('.dropdown, .context-menu')) {
            this.closeAllDropdowns();
        }
        
        if (!e.target.closest('.tooltip')) {
            this.hideTooltip();
        }
    },

    // Close all dropdowns
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown.open, .context-menu').forEach((dropdown) => {
            dropdown.classList.remove('open');
            if (dropdown.classList.contains('context-menu')) {
                dropdown.remove();
            }
        });
    },

    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden
            this.pauseAnimations();
        } else {
            // Page is visible
            this.resumeAnimations();
        }
    },

    // Pause animations when page is hidden
    pauseAnimations() {
        document.body.classList.add('animations-paused');
    },

    // Resume animations when page becomes visible
    resumeAnimations() {
        document.body.classList.remove('animations-paused');
    },

    // Handle resize
    handleResize() {
        this.hideTooltip();
        this.closeAllDropdowns();
        
        // Update responsive classes
        this.updateResponsiveClasses();
    },

    // Handle focus events
    handleFocusIn(e) {
        // Add focused class to parent elements
        let parent = e.target.parentElement;
        while (parent) {
            if (parent.classList && parent.classList.contains('form-group')) {
                parent.classList.add('child-focused');
                break;
            }
            parent = parent.parentElement;
        }
    },

    handleFocusOut(e) {
        // Remove focused class from parent elements
        let parent = e.target.parentElement;
        while (parent) {
            if (parent.classList && parent.classList.contains('form-group')) {
                parent.classList.remove('child-focused');
                break;
            }
            parent = parent.parentElement;
        }
    },

    // Utility functions
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
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    hapticFeedback(type = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                'light': [10],
                'medium': [20],
                'heavy': [30, 10, 30]
            };
            navigator.vibrate(patterns[type] || patterns.light);
        }
    },

    showToast(message, type = 'info', duration = 5000) {
        // Always delegate to SugarcaneApp for toast logic (no duplicate suppression here)
        if (window.SugarcaneApp && window.SugarcaneApp.showToast) {
            window.SugarcaneApp.showToast(message, type, duration);
        } else {
            // Fallback: simple log
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },

    // Global help system
    showGlobalHelp() {
        this.showToast('💡 सहाय्यासाठी F1 दाबा किंवा तज्ञांशी संपर्क साधा', 'info', 5000);
    },

    showSettings() {
        this.showToast('⚙️ सेटिंग्ज लवकरच उपलब्ध होतील', 'info', 3000);
    },

    showCommandPalette() {
        this.showToast('⌘ कमांड पॅलेट लवकरच उपलब्ध होईल', 'info', 3000);
    },

    showContextualHelp() {
        this.showToast('❓ संदर्भित मदत सिस्टम लवकरच तयार होईल', 'info', 3000);
    }
};

// Auto-initialize UI handler
document.addEventListener('DOMContentLoaded', () => {
    UIHandler.init();
});

// Export for global access
window.UIHandler = UIHandler;
