/**
 * Analytics and Tracking Module
 * Handles Google Analytics initialization and custom event tracking
 */

(function() {
    'use strict';

    // Analytics configuration
    const CONFIG = {
        measurementId: 'GA_MEASUREMENT_ID', // Replace with actual Google Analytics ID
        debugMode: false,
        trackingEnabled: true
    };

    // Initialize Google Analytics
    function initializeAnalytics() {
        if (!CONFIG.trackingEnabled) {
            console.log('[Analytics] Tracking disabled');
            return;
        }

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        
        // gtag function
        function gtag() {
            dataLayer.push(arguments);
        }
        
        // Make gtag available globally
        window.gtag = gtag;
        
        // Initialize with current date
        gtag('js', new Date());
        
        // Configure Analytics
        gtag('config', CONFIG.measurementId, {
            debug_mode: CONFIG.debugMode,
            send_page_view: false // We'll handle page views manually for SPA
        });

        // Track initial page view
        trackPageView(window.location.hash || '#home');
        
        console.log('[Analytics] Initialized successfully');
    }

    // Track page views for SPA navigation
    function trackPageView(page) {
        if (!window.gtag) return;
        
        const pageName = page.replace('#', '') || 'home';
        
        gtag('config', CONFIG.measurementId, {
            page_title: `SugarBowl - ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`,
            page_location: window.location.href,
            page_path: `/${pageName}`
        });

        if (CONFIG.debugMode) {
            console.log('[Analytics] Page view tracked:', pageName);
        }
    }

    // Track custom events
    function trackEvent(eventName, parameters = {}) {
        if (!window.gtag) return;
        
        gtag('event', eventName, {
            event_category: parameters.category || 'interaction',
            event_label: parameters.label || '',
            value: parameters.value || 0,
            ...parameters
        });

        if (CONFIG.debugMode) {
            console.log('[Analytics] Event tracked:', eventName, parameters);
        }
    }

    // Track menu interactions
    function trackMenuInteraction(category, item) {
        trackEvent('menu_interaction', {
            category: 'menu',
            label: `${category}_${item}`,
            item_category: category,
            item_name: item
        });
    }

    // Track event calendar interactions
    function trackCalendarInteraction(action, eventName = '') {
        trackEvent('calendar_interaction', {
            category: 'events',
            label: action,
            event_name: eventName,
            action: action
        });
    }

    // Track social media clicks
    function trackSocialClick(platform, location) {
        trackEvent('social_click', {
            category: 'social',
            label: platform,
            platform: platform,
            location: location
        });
    }

    // Track phone calls
    function trackPhoneCall() {
        trackEvent('phone_call', {
            category: 'contact',
            label: 'phone_click'
        });
    }

    // Track external link clicks
    function trackExternalLink(url, linkText) {
        trackEvent('external_link', {
            category: 'outbound',
            label: url,
            link_text: linkText
        });
    }

    // Setup automatic event tracking
    function setupEventTracking() {
        // Track navigation clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            
            // Track internal navigation
            if (href && href.startsWith('#')) {
                const page = href.substring(1);
                trackPageView(href);
                return;
            }
            
            // Track external links
            if (href && (href.startsWith('http') || href.startsWith('mailto:'))) {
                const linkText = link.textContent.trim() || link.getAttribute('aria-label') || href;
                
                if (href.includes('instagram.com')) {
                    trackSocialClick('instagram', 'main_content');
                } else if (href.includes('facebook.com')) {
                    trackSocialClick('facebook', 'main_content');
                } else if (href.startsWith('tel:')) {
                    trackPhoneCall();
                } else {
                    trackExternalLink(href, linkText);
                }
            }
        });

        // Track menu tab clicks
        document.addEventListener('click', function(e) {
            if (e.target.matches('.tab-btn')) {
                const category = e.target.getAttribute('data-category');
                trackMenuInteraction('category_switch', category);
            }
        });

        // Track burger special views
        document.addEventListener('DOMContentLoaded', function() {
            const burgerSection = document.getElementById('burger-spotlight');
            if (burgerSection) {
                const observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            trackEvent('burger_special_view', {
                                category: 'engagement',
                                label: 'burger_spotlight_visible'
                            });
                            observer.unobserve(entry.target);
                        }
                    });
                });
                observer.observe(burgerSection);
            }
        });

        // Track calendar event clicks
        document.addEventListener('click', function(e) {
            if (e.target.matches('.calendar-day.has-event')) {
                trackCalendarInteraction('day_click', 'events_available');
            } else if (e.target.matches('.event-item')) {
                const eventTitle = e.target.querySelector('h4')?.textContent || 'unknown_event';
                trackCalendarInteraction('event_detail', eventTitle);
            }
        });

        // Track form submissions (if any forms are added)
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const formId = form.id || form.className || 'unknown_form';
            
            trackEvent('form_submission', {
                category: 'engagement',
                label: formId
            });
        });

        console.log('[Analytics] Event tracking setup complete');
    }

    // Error tracking
    function trackError(error, context = '') {
        trackEvent('javascript_error', {
            category: 'error',
            label: error.message || 'unknown_error',
            error_message: error.message,
            error_stack: error.stack,
            context: context
        });
    }

    // Performance tracking
    function trackPerformance() {
        // Track page load time
        window.addEventListener('load', function() {
            setTimeout(function() {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                
                trackEvent('page_load_time', {
                    category: 'performance',
                    value: Math.round(loadTime)
                });
            }, 100);
        });

        // Track largest contentful paint
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver(function(list) {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    
                    trackEvent('largest_contentful_paint', {
                        category: 'performance',
                        value: Math.round(lastEntry.startTime)
                    });
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('[Analytics] Performance observer not supported');
            }
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeAnalytics();
        setupEventTracking();
        trackPerformance();
        
        // Setup global error tracking
        window.addEventListener('error', function(e) {
            trackError(e.error, 'global_error_handler');
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            trackError(new Error(e.reason), 'unhandled_promise_rejection');
        });
    });

    // Export public API
    window.SugarBowlAnalytics = {
        trackPageView: trackPageView,
        trackEvent: trackEvent,
        trackMenuInteraction: trackMenuInteraction,
        trackCalendarInteraction: trackCalendarInteraction,
        trackSocialClick: trackSocialClick,
        trackPhoneCall: trackPhoneCall,
        trackError: trackError,
        setDebugMode: function(enabled) {
            CONFIG.debugMode = !!enabled;
        },
        setTrackingEnabled: function(enabled) {
            CONFIG.trackingEnabled = !!enabled;
        }
    };

})();