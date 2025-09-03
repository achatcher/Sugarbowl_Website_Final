/**
 * Service Worker Registration
 * Handles PWA functionality and offline caching
 */

(function() {
    'use strict';

    // Service worker configuration
    const CONFIG = {
        serviceWorkerPath: 'service-worker.js',
        enableNotifications: true,
        offlineSupport: true,
        debugMode: false
    };

    // Initialize service worker
    function initServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[ServiceWorker] Not supported in this browser');
            return;
        }

        window.addEventListener('load', function() {
            navigator.serviceWorker.register(CONFIG.serviceWorkerPath)
                .then(function(registration) {
                    console.log('[ServiceWorker] Registered with scope:', registration.scope);
                    
                    // Handle updates
                    registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available
                                showUpdateNotification();
                            }
                        });
                    });

                    // Setup notification permissions if enabled
                    if (CONFIG.enableNotifications) {
                        setupNotifications(registration);
                    }
                })
                .catch(function(error) {
                    console.error('[ServiceWorker] Registration failed:', error);
                });
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (CONFIG.debugMode) {
                console.log('[ServiceWorker] Message received:', event.data);
            }
            
            handleServiceWorkerMessage(event.data);
        });
    }

    // Show update notification to user
    function showUpdateNotification() {
        const announcement = document.getElementById('announcements');
        if (announcement) {
            announcement.textContent = 'A new version of the app is available. Please refresh the page.';
        }
        
        // Create update banner
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>🔄 New version available!</span>
                <button onclick="window.location.reload()" class="btn btn-sm">Update Now</button>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm btn-ghost">Later</button>
            </div>
        `;
        
        document.body.appendChild(updateBanner);
    }

    // Setup push notifications
    function setupNotifications(registration) {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('[Notifications] Not supported in this browser');
            return;
        }

        // Don't ask immediately - wait for user interaction
        let interactionCount = 0;
        
        function requestNotificationPermission() {
            if (Notification.permission === 'default' && interactionCount > 3) {
                Notification.requestPermission().then(function(permission) {
                    if (permission === 'granted') {
                        console.log('[Notifications] Permission granted');
                        subscribeToNotifications(registration);
                    }
                });
            }
        }

        // Track user interactions before asking for permission
        ['click', 'touchstart'].forEach(event => {
            document.addEventListener(event, function() {
                interactionCount++;
                if (interactionCount === 4) {
                    setTimeout(requestNotificationPermission, 2000);
                }
            }, { once: false, passive: true });
        });
    }

    // Subscribe to push notifications
    function subscribeToNotifications(registration) {
        // This would integrate with your backend for push notifications
        // For now, just log that we're ready for notifications
        console.log('[Notifications] Ready for push notifications');
        
        // Example: You could send subscription to your server here
        // fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(subscription) });
    }

    // Handle messages from service worker
    function handleServiceWorkerMessage(data) {
        switch (data.type) {
            case 'CACHE_UPDATED':
                console.log('[ServiceWorker] Cache updated');
                break;
                
            case 'OFFLINE_READY':
                console.log('[ServiceWorker] App ready for offline use');
                break;
                
            case 'ERROR':
                console.error('[ServiceWorker] Error:', data.error);
                break;
                
            default:
                if (CONFIG.debugMode) {
                    console.log('[ServiceWorker] Unknown message:', data);
                }
        }
    }

    // Network status handling
    function setupNetworkHandling() {
        let wasOffline = false;
        
        function updateOnlineStatus() {
            const announcement = document.getElementById('announcements');
            
            if (navigator.onLine) {
                if (wasOffline) {
                    if (announcement) {
                        announcement.textContent = 'Connection restored. You are back online.';
                    }
                    console.log('[Network] Connection restored');
                }
                wasOffline = false;
            } else {
                if (announcement) {
                    announcement.textContent = 'You are currently offline. Some features may be limited.';
                }
                console.log('[Network] Connection lost - offline mode');
                wasOffline = true;
            }
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Initial check
        updateOnlineStatus();
    }

    // Install prompt handling
    function setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', function(e) {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            
            // Show install button after user has interacted with the site
            setTimeout(function() {
                showInstallButton(deferredPrompt);
            }, 30000); // Show after 30 seconds
        });

        window.addEventListener('appinstalled', function() {
            console.log('[PWA] App was installed');
            
            // Track installation
            if (window.SugarBowlAnalytics) {
                window.SugarBowlAnalytics.trackEvent('pwa_install', {
                    category: 'engagement',
                    label: 'app_installed'
                });
            }
            
            // Hide install button
            const installBtn = document.querySelector('.install-button');
            if (installBtn) {
                installBtn.remove();
            }
        });
    }

    // Show install app button
    function showInstallButton(deferredPrompt) {
        // Don't show if already installed or on iOS (different install process)
        if (window.matchMedia('(display-mode: standalone)').matches || /iPad|iPhone|iPod/.test(navigator.userAgent)) {
            return;
        }
        
        const installButton = document.createElement('button');
        installButton.className = 'install-button btn';
        installButton.innerHTML = '📱 Install App';
        installButton.style.position = 'fixed';
        installButton.style.bottom = '20px';
        installButton.style.right = '20px';
        installButton.style.zIndex = '9999';
        
        installButton.addEventListener('click', function() {
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[PWA] User accepted the install prompt');
                } else {
                    console.log('[PWA] User dismissed the install prompt');
                }
                
                deferredPrompt = null;
                installButton.remove();
            });
        });
        
        document.body.appendChild(installButton);
        
        // Auto-hide after 30 seconds if not clicked
        setTimeout(function() {
            if (installButton.parentNode) {
                installButton.remove();
            }
        }, 30000);
    }

    // Initialize everything when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initServiceWorker();
        setupNetworkHandling();
        setupInstallPrompt();
    });

    // Export public API
    window.SugarBowlSW = {
        forceUpdate: function() {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ command: 'SKIP_WAITING' });
                window.location.reload();
            }
        },
        
        clearCache: function() {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ command: 'CLEAR_CACHE' });
            }
        }
    };

})();