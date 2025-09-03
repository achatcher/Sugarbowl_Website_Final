/**
 * SugarBowl App - Core Navigation Module
 * 
 * Handles page navigation, deep linking, and overall app UI management.
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';

    // App configuration
    const CONFIG = {
        pageTransitionTime: 300, // milliseconds
        scrollBehavior: 'smooth',
        initialPageId: 'home',
        persistState: true, // remember last page visited
        enableDeepLinking: true, // support direct URL navigation
        debugMode: false // set to true to enable console logging
    };

    // State management
    let currentPage = '';
    let isTransitioning = false;
    let pageHistory = [];
    let menuItems = {};
    
    /**
     * Initialize the app
     */
    function init() {
        // Cache DOM elements
        const navLinks = document.querySelectorAll('.main-nav a');
        const pages = document.querySelectorAll('.page');
        
        // Create menu items lookup table for performance
        navLinks.forEach(link => {
            const pageId = link.getAttribute('href').substring(1);
            menuItems[pageId] = link;
        });
        
        // Set up navigation event listeners
        setupNavigationListeners(navLinks, pages);
        setupInPageLinks(pages);
        setupKeyboardNavigation();
        
        // Handle deep linking or load saved state
        handleInitialNavigation(navLinks);
        
        // Setup global error handlers
        setupErrorHandling();
        
        // Log initialization if in debug mode
        debugLog('App initialized successfully');
    }
    
    /**
     * Set up navigation listeners for main menu items
     * 
     * @param {NodeList} navLinks - Navigation links
     * @param {NodeList} pages - Page elements
     */
    function setupNavigationListeners(navLinks, pages) {
        navLinks.forEach(link => {
            // Both click and keyboard events
            link.addEventListener('click', handleNavigation);
            link.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigation.call(this, e);
                }
            });
            
            // Set proper ARIA attributes
            link.setAttribute('role', 'tab');
            const pageId = link.getAttribute('href').substring(1);
            link.setAttribute('aria-controls', pageId);
        });
        
        // Set ARIA attributes on pages
        pages.forEach(page => {
            page.setAttribute('role', 'tabpanel');
            page.setAttribute('aria-hidden', !page.classList.contains('active-page'));
        });
    }
    
    /**
     * Navigate to a specific page
     * 
     * @param {Event} e - The triggering event
     */
    function handleNavigation(e) {
        // Prevent default behavior
        e.preventDefault();
        
        // Don't process if already transitioning
        if (isTransitioning) return;
        
        // Get the target page ID from the href attribute
        const link = this;
        const targetId = link.getAttribute('href').substring(1);
        
        // Don't reload current page
        if (targetId === currentPage) return;
        
        // Set transitioning flag
        isTransitioning = true;
        
        // Get DOM elements
        const navLinks = document.querySelectorAll('.main-nav a');
        const pages = document.querySelectorAll('.page');
        const targetPage = document.getElementById(targetId);
        
        if (!targetPage) {
            console.error(`Target page #${targetId} not found`);
            isTransitioning = false;
            return;
        }
        
        // Update navigation state
        navLinks.forEach(navLink => {
            navLink.classList.remove('active');
            navLink.setAttribute('aria-selected', 'false');
            navLink.tabIndex = 0;
        });
        
        link.classList.add('active');
        link.setAttribute('aria-selected', 'true');
        link.tabIndex = -1; // Remove from tab order when active
        
        // Update page visibility
        pages.forEach(page => {
            page.classList.remove('active-page');
            page.setAttribute('aria-hidden', 'true');
        });
        
        targetPage.classList.add('active-page');
        targetPage.setAttribute('aria-hidden', 'false');
        
        // Record in history if feature enabled
        if (CONFIG.persistState) {
            pageHistory.push(targetId);
            try {
                localStorage.setItem('sugarBowl_lastPage', targetId);
            } catch (e) {
                console.warn('Unable to save page state to localStorage');
            }
        }
        
        // Update URL if deep linking is enabled
        if (CONFIG.enableDeepLinking && history.pushState) {
            const newUrl = window.location.pathname + '#' + targetId;
            history.pushState({pageId: targetId}, '', newUrl);
        }
        
        // Scroll to top when changing pages (unless disabled)
        const shouldScroll = link.getAttribute('data-scroll') !== 'false';
        if (shouldScroll) {
            window.scrollTo({
                top: 0, 
                behavior: CONFIG.scrollBehavior
            });
        }
        
        // Update current page tracker
        currentPage = targetId;
        
        // Update breadcrumb
        updateBreadcrumb(targetId);
        
        // Update page-specific UI elements if needed
        updatePageSpecificUI(targetId);
        
        // Reset transition flag after animation completes
        setTimeout(() => {
            isTransitioning = false;
            
            // Set focus on first focusable element in the page for accessibility
            setFocusToPage(targetPage);
            
        }, CONFIG.pageTransitionTime);
        
        // Analytics tracking (if available)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: targetId,
                page_location: window.location.href,
                page_path: window.location.pathname + '#' + targetId
            });
        }
        
        debugLog(`Navigated to page: ${targetId}`);
    }
    
    /**
     * Set focus to the first focusable element in a page
     * 
     * @param {Element} page - The page element to focus within
     */
    function setFocusToPage(page) {
        // Only perform if not on a touch device
        if (window.matchMedia('(hover: none)').matches) return;
        
        // For burger-special page, focus on the page heading instead to prevent scrolling down
        if (page.id === 'burger-special') {
            const heading = page.querySelector('h2');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
                return;
            }
        }
        
        const focusableElements = page.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length) {
            focusableElements[0].focus();
        }
    }
    
    /**
     * Set up internal page links (for navigation between pages)
     * 
     * @param {NodeList} pages - Page elements
     */
    function setupInPageLinks(pages) {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            if (!link.closest('.main-nav')) {
                link.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href').substring(1);
                    const targetPage = document.getElementById(targetId);
                    
                    if (targetPage && targetPage.classList.contains('page')) {
                        e.preventDefault();
                        
                        // Navigate to the page by simulating a click on the nav item
                        const menuItem = menuItems[targetId];
                        if (menuItem) {
                            menuItem.click();
                        } else {
                            // Direct navigation if menu item not found
                            navigateToPage(targetId);
                        }
                    }
                });
            }
        });
    }
    
    /**
     * Navigate to a specific page programmatically
     * 
     * @param {String} pageId - ID of the page to navigate to
     */
    function navigateToPage(pageId) {
        const menuItem = menuItems[pageId];
        
        if (menuItem) {
            menuItem.click();
        } else {
            // Direct navigation if menu item not found
            const targetPage = document.getElementById(pageId);
            const navLinks = document.querySelectorAll('.main-nav a');
            const pages = document.querySelectorAll('.page');
            
            if (targetPage && targetPage.classList.contains('page')) {
                // Update UI
                pages.forEach(page => page.classList.remove('active-page'));
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Highlight corresponding nav if exists
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === '#' + pageId) {
                        link.classList.add('active');
                    }
                });
                
                // Show target page
                targetPage.classList.add('active-page');
                currentPage = pageId;
                
                // Scroll to top (unless disabled by corresponding nav link)
                const correspondingNavLink = document.querySelector(`.main-nav a[href="#${pageId}"]`);
                const shouldScroll = !correspondingNavLink || correspondingNavLink.getAttribute('data-scroll') !== 'false';
                if (shouldScroll) {
                    window.scrollTo({
                        top: 0,
                        behavior: CONFIG.scrollBehavior
                    });
                }
            } else {
                console.error(`Target page #${pageId} not found`);
            }
        }
    }
    
    /**
     * Set up keyboard navigation handlers
     */
    function setupKeyboardNavigation() {
        // Handle swipe gestures (if Hammer.js is available)
        if (typeof Hammer !== 'undefined') {
            setupSwipeNavigation();
        }
    }
    
    /**
     * Set up swipe navigation with Hammer.js (if available)
     */
    function setupSwipeNavigation() {
        try {
            const pageContainer = document.querySelector('main');
            const hammer = new Hammer(pageContainer);
            
            hammer.on('swipeleft swiperight', function(e) {
                // Get all visible menu items
                const navLinks = Array.from(document.querySelectorAll('.main-nav a'));
                const activeIndex = navLinks.findIndex(link => link.classList.contains('active'));
                
                // Navigate based on swipe direction
                if (e.type === 'swipeleft' && activeIndex < navLinks.length - 1) {
                    navLinks[activeIndex + 1].click();
                } else if (e.type === 'swiperight' && activeIndex > 0) {
                    navLinks[activeIndex - 1].click();
                }
            });
        } catch (error) {
            console.warn('Swipe navigation setup failed:', error);
        }
    }
    
    /**
     * Handle initial page navigation (deep linking or saved state)
     * 
     * @param {NodeList} navLinks - Navigation links
     */
    function handleInitialNavigation(navLinks) {
        let initialPage = CONFIG.initialPageId;
        
        // Check for hash in URL (deep linking)
        if (CONFIG.enableDeepLinking && window.location.hash) {
            const targetId = window.location.hash.substring(1);
            const targetPage = document.getElementById(targetId);
            
            if (targetPage && targetPage.classList.contains('page')) {
                initialPage = targetId;
            }
        } 
        // Check for saved state
        else if (CONFIG.persistState) {
            try {
                const savedPage = localStorage.getItem('sugarBowl_lastPage');
                if (savedPage && document.getElementById(savedPage)) {
                    initialPage = savedPage;
                }
            } catch (e) {
                console.warn('Could not access localStorage for saved state');
            }
        }
        
        // Navigate to initial page
        navigateToPage(initialPage);
    }
    
    /**
     * Update page-specific UI elements or behaviors
     * 
     * @param {String} pageId - ID of the current page
     */
    function updatePageSpecificUI(pageId) {
        // Add any special handling for specific pages
        switch(pageId) {
            case 'events':
                // Refresh calendar if calendar API is available
                if (window.SugarBowlCalendar && typeof window.SugarBowlCalendar.refresh === 'function') {
                    window.SugarBowlCalendar.refresh();
                }
                break;
                
            case 'home':
                // Maybe refresh the latest burger special
                break;
                
            // Add other page-specific handlers as needed
        }
    }
    
    /**
     * Set up global error handling
     */
    function setupErrorHandling() {
        window.addEventListener('error', function(e) {
            console.error('App error:', e.error);
            
            // Only handle in production
            if (CONFIG.debugMode) return;
            
            // Prevent default browser error handling
            e.preventDefault();
            
            // Could implement reporting to a service here
        });
    }
    
    /**
     * Update breadcrumb navigation
     * 
     * @param {String} pageId - Current page ID
     */
    function updateBreadcrumb(pageId) {
        const breadcrumbCurrent = document.getElementById('current-breadcrumb');
        if (!breadcrumbCurrent) return;
        
        const pageNames = {
            'home': 'Home',
            'burger-special': 'Menu',
            'events': 'Events',
            'info': 'Info'
        };
        
        const pageName = pageNames[pageId] || 'Page';
        breadcrumbCurrent.textContent = pageName;
        breadcrumbCurrent.setAttribute('aria-current', 'page');
    }
    
    /**
     * Debug logging helper
     * 
     * @param {String} message - Debug message
     */
    function debugLog(message) {
        if (CONFIG.debugMode) {
            console.log(`[SugarBowl] ${message}`);
        }
    }
    
    // Initialize app when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Make API available globally
    window.SugarBowlApp = {
        navigateTo: navigateToPage,
        goBack: function() {
            if (pageHistory.length > 1) {
                pageHistory.pop(); // Remove current
                const lastPage = pageHistory.pop(); // Get previous
                navigateToPage(lastPage || CONFIG.initialPageId);
            }
        },
        getCurrentPage: function() {
            return currentPage;
        },
        setDebugMode: function(enable) {
            CONFIG.debugMode = !!enable;
        }
    };
})();