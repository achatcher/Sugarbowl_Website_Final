/**
 * Error Handler Module
 * Provides comprehensive error handling and user-friendly error messages
 */

(function() {
    'use strict';

    // Error handler configuration
    const CONFIG = {
        showUserErrors: true,
        logErrors: true,
        retryAttempts: 3,
        retryDelay: 1000,
        fallbackMessages: true
    };

    // Error types and their user-friendly messages
    const ERROR_MESSAGES = {
        NETWORK_ERROR: 'Unable to connect to our servers. Please check your internet connection.',
        API_ERROR: 'Sorry, we\'re having trouble loading this content. Please try again.',
        CALENDAR_ERROR: 'Unable to load events at this time. Please try again later.',
        MENU_ERROR: 'Menu information is temporarily unavailable.',
        BURGER_ERROR: 'Unable to load this week\'s special burger.',
        GENERIC_ERROR: 'Something went wrong. Please refresh the page and try again.',
        TIMEOUT_ERROR: 'The request is taking too long. Please try again.',
        PARSE_ERROR: 'We received invalid data from the server.'
    };

    // Fallback data for when APIs fail
    const FALLBACK_DATA = {
        burger: {
            name: 'Classic SugarBowl Burger',
            description: 'Our signature beef patty with lettuce, tomato, and special sauce.',
            availability: 'Available Now',
            imageUrl: 'img/burger1.jpg'
        },
        menu: {
            appetizers: [
                { name: 'Loaded Nachos', price: '$8.99', description: 'Tortilla chips with cheese, jalapeños, and sour cream' },
                { name: 'Buffalo Wings', price: '$9.99', description: 'Spicy wings served with celery and blue cheese' }
            ],
            burgers: [
                { name: 'Classic Burger', price: '$10.99', description: 'Beef patty with lettuce, tomato, and onion' },
                { name: 'Bacon Cheeseburger', price: '$12.99', description: 'Classic burger with crispy bacon and cheese' }
            ]
        },
        events: [
            {
                title: 'Karaoke Night',
                time: '8:00 PM - 12:00 AM',
                description: 'Sing your heart out at our weekly karaoke night!'
            }
        ]
    };

    // Error display utilities
    function showUserError(message, element, type = 'error') {
        if (!CONFIG.showUserErrors || !element) return;

        // Remove existing error messages
        const existingError = element.querySelector('.error-message, .success-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorEl = document.createElement('div');
        errorEl.className = type === 'error' ? 'error-message' : 'success-message';
        errorEl.textContent = message;
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'assertive');

        // Insert error message
        element.insertBefore(errorEl, element.firstChild);

        // Auto-remove after 5 seconds for non-critical errors
        if (type !== 'error') {
            setTimeout(() => {
                if (errorEl.parentNode) {
                    errorEl.remove();
                }
            }, 5000);
        }

        // Announce to screen readers
        announceToScreenReader(message);
    }

    // Announce messages to screen readers
    function announceToScreenReader(message) {
        const announcement = document.getElementById('announcements');
        if (announcement) {
            announcement.textContent = message;
            // Clear after a moment so subsequent messages are announced
            setTimeout(() => {
                announcement.textContent = '';
            }, 1000);
        }
    }

    // Enhanced retry mechanism with exponential backoff
    async function retryOperation(operation, context = '', maxRetries = CONFIG.retryAttempts) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (CONFIG.logErrors) {
                    console.warn(`[ErrorHandler] ${context} attempt ${attempt}/${maxRetries} failed:`, error);
                }

                // Don't retry on certain types of errors
                if (error.status === 404 || error.status === 403 || error.name === 'AbortError') {
                    break;
                }

                if (attempt < maxRetries) {
                    // Exponential backoff: wait longer between each retry
                    const delay = CONFIG.retryDelay * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    // Network error handler
    function handleNetworkError(error, context = '') {
        let errorType = 'GENERIC_ERROR';
        
        if (!navigator.onLine) {
            errorType = 'NETWORK_ERROR';
        } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            errorType = 'TIMEOUT_ERROR';
        } else if (error.name === 'SyntaxError' || error.message.includes('JSON')) {
            errorType = 'PARSE_ERROR';
        } else if (error.status >= 500) {
            errorType = 'API_ERROR';
        }

        const userMessage = ERROR_MESSAGES[errorType];
        
        if (CONFIG.logErrors) {
            console.error(`[ErrorHandler] ${context}:`, error);
        }

        // Track error in analytics
        if (window.SugarBowlAnalytics) {
            window.SugarBowlAnalytics.trackError(error, context);
        }

        return { type: errorType, message: userMessage, originalError: error };
    }

    // API-specific error handlers
    const apiErrorHandlers = {
        // Burger API error handler
        handleBurgerError: function(error, element) {
            const errorInfo = handleNetworkError(error, 'burger_api');
            
            if (element && CONFIG.fallbackMessages) {
                showUserError(ERROR_MESSAGES.BURGER_ERROR, element);
                
                // Load fallback burger data
                const fallbackHtml = `
                    <div class="burger-details">
                        <h3>${FALLBACK_DATA.burger.name}</h3>
                        <div class="burger-availability">
                            <div class="availability-label">Available:</div>
                            <div class="availability-dates">${FALLBACK_DATA.burger.availability}</div>
                        </div>
                        <p class="description">${FALLBACK_DATA.burger.description}</p>
                        <p class="fallback-notice">⚠️ Using cached information - live data unavailable</p>
                    </div>
                `;
                
                const burgerContent = element.querySelector('.burger-details') || element;
                burgerContent.innerHTML = fallbackHtml;
            }
            
            return errorInfo;
        },

        // Menu API error handler
        handleMenuError: function(error, element) {
            const errorInfo = handleNetworkError(error, 'menu_api');
            
            if (element && CONFIG.fallbackMessages) {
                showUserError(ERROR_MESSAGES.MENU_ERROR, element);
                
                // Load fallback menu data
                const fallbackMenu = FALLBACK_DATA.menu;
                let fallbackHtml = '<div class="fallback-menu">';
                
                Object.entries(fallbackMenu).forEach(([category, items]) => {
                    fallbackHtml += `<div class="menu-category">`;
                    fallbackHtml += `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>`;
                    items.forEach(item => {
                        fallbackHtml += `
                            <div class="menu-item">
                                <div class="item-name">${item.name}</div>
                                <div class="item-price">${item.price}</div>
                                <div class="item-description">${item.description}</div>
                            </div>
                        `;
                    });
                    fallbackHtml += '</div>';
                });
                
                fallbackHtml += '<p class="fallback-notice">⚠️ Limited menu shown - full menu temporarily unavailable</p>';
                fallbackHtml += '</div>';
                
                element.innerHTML = fallbackHtml;
            }
            
            return errorInfo;
        },

        // Calendar API error handler
        handleCalendarError: function(error, element) {
            const errorInfo = handleNetworkError(error, 'calendar_api');
            
            if (element && CONFIG.fallbackMessages) {
                showUserError(ERROR_MESSAGES.CALENDAR_ERROR, element);
                
                // Show fallback event
                const fallbackEvent = FALLBACK_DATA.events[0];
                const fallbackHtml = `
                    <div class="fallback-event">
                        <h3>${fallbackEvent.title}</h3>
                        <div class="event-time">
                            <i class="far fa-clock"></i> ${fallbackEvent.time}
                        </div>
                        <p>${fallbackEvent.description}</p>
                        <p class="fallback-notice">⚠️ Showing regular weekly events - live calendar unavailable</p>
                    </div>
                `;
                
                element.innerHTML = fallbackHtml;
            }
            
            return errorInfo;
        }
    };

    // Loading state management
    const loadingStates = {
        show: function(element, message = 'Loading...') {
            if (!element) return;
            
            const existingLoader = element.querySelector('.loading-spinner');
            if (existingLoader) return; // Already showing
            
            const loader = document.createElement('div');
            loader.className = 'loading-spinner';
            loader.setAttribute('role', 'status');
            loader.setAttribute('aria-label', message);
            loader.innerHTML = `<span class="sr-only">${message}</span>${message}`;
            
            // Clear existing content
            element.innerHTML = '';
            element.appendChild(loader);
        },
        
        hide: function(element) {
            if (!element) return;
            
            const loader = element.querySelector('.loading-spinner');
            if (loader) {
                loader.remove();
            }
        },
        
        replace: function(element, newContent) {
            this.hide(element);
            if (typeof newContent === 'string') {
                element.innerHTML = newContent;
            } else {
                element.appendChild(newContent);
            }
        }
    };

    // Graceful degradation helpers
    function provideFallback(element, fallbackContent, message) {
        if (!element) return;
        
        loadingStates.hide(element);
        
        if (message) {
            showUserError(message, element.parentElement, 'info');
        }
        
        element.innerHTML = fallbackContent;
    }

    // Initialize error handling
    function initErrorHandling() {
        // Global error handlers
        window.addEventListener('error', function(event) {
            const error = event.error || new Error(event.message);
            handleNetworkError(error, 'global_error');
        });

        window.addEventListener('unhandledrejection', function(event) {
            const error = new Error(event.reason);
            handleNetworkError(error, 'unhandled_promise');
        });

        // Network status monitoring
        window.addEventListener('online', function() {
            announceToScreenReader('Connection restored. Attempting to reload content.');
            // Trigger content refresh
            if (window.SugarBowlApp && window.SugarBowlApp.refreshContent) {
                window.SugarBowlApp.refreshContent();
            }
        });

        window.addEventListener('offline', function() {
            announceToScreenReader('Connection lost. Some content may not be available.');
        });

        console.log('[ErrorHandler] Initialized');
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initErrorHandling);

    // Export public API
    window.SugarBowlErrorHandler = {
        handleNetworkError: handleNetworkError,
        showUserError: showUserError,
        retryOperation: retryOperation,
        loadingStates: loadingStates,
        apiErrorHandlers: apiErrorHandlers,
        provideFallback: provideFallback,
        announceToScreenReader: announceToScreenReader,
        
        // Configuration
        setShowUserErrors: function(enabled) {
            CONFIG.showUserErrors = !!enabled;
        },
        
        setLogErrors: function(enabled) {
            CONFIG.logErrors = !!enabled;
        }
    };

})();