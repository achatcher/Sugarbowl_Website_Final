/**
 * SugarBowl Menu Module - Connected to Backend
 * Manages menu data from DynamoDB and burger special displays
 * @version 2.0.1
 */
import apiService from './api-service.js';

document.addEventListener('DOMContentLoaded', function() {
    // Menu functionality
    const menuContainer = document.getElementById('menu-items');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const burgerSpotlightEl = document.getElementById('burger-spotlight');
    const currentBurgerEl = document.getElementById('current-burger');
    
    // State
    let currentMenuData = {};
    let currentBurger = null;
    let activeCategory = 'appetizers';

    /**
     * Helper to build the permanent image URL from the S3 Key.
     * This prevents the 1-hour timeout issue.
     * @param {Object} burger - The burger data object
     */
    function getPermanentBurgerUrl(burger) {
        if (!burger) return 'img/burger1.webp';
        
        // 1. If we have the imageKey, construct the permanent URL using config
        if (burger.imageKey && window.SugarBowlConfig && window.SugarBowlConfig.aws) {
            const baseUrl = window.SugarBowlConfig.aws.publicUrl;
            // Ensure no leading slash on the key to prevent double slashes in URL
            const cleanKey = burger.imageKey.startsWith('/') 
                ? burger.imageKey.substring(1) 
                : burger.imageKey;
            
            return `${baseUrl}${cleanKey}`;
        }
        
        // 2. Fallback to the provided imageUrl (useful for legacy items)
        if (burger.imageUrl) return burger.imageUrl;
        
        // 3. Final fallback to placeholder
        return 'img/burger1.webp';
    }

    /**
     * Function to render menu items for a category
     * @param {string} category - The menu category to display
     */
    function renderMenuItems(category) {
        if (!menuContainer) return;
        
        // Show loading state
        menuContainer.innerHTML = '<div class="loading-spinner">Loading menu items...</div>';
        
        const items = currentMenuData[category] || [];
        
        if (items.length === 0) {
            menuContainer.innerHTML = '<p class="no-items">No items available in this category at the moment.</p>';
            return;
        }
        
        // Clear container
        menuContainer.innerHTML = '';
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item';
            
            itemEl.innerHTML = `
                <div class="menu-item-info">
                    <h4>${item.name}</h4>
                    <p class="menu-item-description">${item.description}</p>
                    <p class="menu-item-price">$${parseFloat(item.price).toFixed(2)}</p>
                </div>
            `;
            
            menuContainer.appendChild(itemEl);
        });
    }

    /**
     * Format date range for burger availability
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {string} Formatted date range
     */
    function formatDateRange(startDate, endDate) {
        if (!startDate || !endDate) return '';
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const options = { month: 'long', day: 'numeric' };
        
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }

    /**
     * Initialize burger special information
     */
    async function initBurgerSpecial() {
        try {
            // Show loading state
            if (burgerSpotlightEl) {
                burgerSpotlightEl.innerHTML = '<div class="loading-spinner">Loading burger special...</div>';
            }
            if (currentBurgerEl) {
                currentBurgerEl.innerHTML = '<div class="loading-spinner">Loading this week\'s special...</div>';
            }

            currentBurger = await apiService.getCurrentBurger();
            
            if (!currentBurger) {
                if (burgerSpotlightEl) {
                    burgerSpotlightEl.innerHTML = '<p class="no-special">No burger special available at the moment. Check back soon!</p>';
                }
                if (currentBurgerEl) {
                    currentBurgerEl.innerHTML = '<p class="no-special">Check back soon for our next special!</p>';
                }
                const homeBurgerImage = document.getElementById('home-burger-image');
                if (homeBurgerImage) {
                    homeBurgerImage.src = 'img/burger1.webp';
                    homeBurgerImage.alt = 'Featured weekly burger special';
                }
                return;
            }

            // RESOLVE PERMANENT URL: Check for Key first to prevent timeouts
            const burgerImageSrc = getPermanentBurgerUrl(currentBurger);
            const dateRange = formatDateRange(currentBurger.startDate, currentBurger.endDate);
            
            // Update burger spotlight on food page
            if (burgerSpotlightEl) {
                burgerSpotlightEl.innerHTML = `
                    <h3>BURGER SPECIAL</h3>
                    <div class="burger-special-content">
                        <img src="${burgerImageSrc}" alt="${currentBurger.name}" class="burger-image" loading="lazy">
                        <div class="burger-details">
                            <h4>${currentBurger.name}</h4>
                            ${dateRange ? `
                                <div class="burger-availability">
                                    <div class="availability-label">Available:</div>
                                    <div class="availability-dates">${dateRange}</div>
                                </div>
                            ` : ''}
                            <p class="burger-description">${currentBurger.description}</p>
                        </div>
                    </div>
                `;
            }
            
            // Update current burger for homepage preview
            if (currentBurgerEl) {
                const shortDescription = currentBurger.description.length > 80 
                    ? currentBurger.description.substring(0, 80) + '...'
                    : currentBurger.description;
                
                let availabilityText = '';
                if (currentBurger.startDate && currentBurger.endDate) {
                    const startDate = new Date(currentBurger.startDate);
                    const endDate = new Date(currentBurger.endDate);
                    
                    const formatDate = (date) => {
                        return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                        });
                    };
                    
                    availabilityText = `${formatDate(startDate)} - ${formatDate(endDate)}`;
                } else {
                    availabilityText = 'Available Now';
                }
                    
                currentBurgerEl.innerHTML = `
                    <h4>${currentBurger.name}</h4>
                    <div class="burger-availability">
                        <div class="availability-label">Available:</div>
                        <div class="availability-dates">${availabilityText}</div>
                    </div>
                    <p>${shortDescription}</p>
                `;
            }

            // Update home page burger image
            const homeBurgerImage = document.getElementById('home-burger-image');
            if (homeBurgerImage) {
                homeBurgerImage.src = burgerImageSrc;
                homeBurgerImage.alt = `${currentBurger.name} - Featured weekly burger special`;
                homeBurgerImage.removeAttribute('data-webp-src');
            }

            console.log('Burger special loaded successfully using permanent URL logic');
        } catch (error) {
            console.error('Error loading burger special:', error);
            
            const errorMessage = '<p class="error-message">Unable to load burger special. Please try again later.</p>';
            if (burgerSpotlightEl) burgerSpotlightEl.innerHTML = errorMessage;
            if (currentBurgerEl) currentBurgerEl.innerHTML = errorMessage;
            
            const homeBurgerImage = document.getElementById('home-burger-image');
            if (homeBurgerImage) {
                homeBurgerImage.src = 'img/burger1.webp';
            }
        }
    }

    /**
     * Load menu data from backend
     */
    async function loadMenuData() {
        try {
            if (menuContainer) {
                menuContainer.innerHTML = '<div class="loading-spinner">Loading menu items...</div>';
            }
            
            currentMenuData = await apiService.getMenuItemsByCategory();
            renderMenuItems(activeCategory);
            
        } catch (error) {
            console.error('Error loading menu data:', error);
            if (menuContainer) {
                menuContainer.innerHTML = '<p class="error-message">Unable to load menu items. Please try again later.</p>';
            }
        }
    }

    /**
     * Refresh all data
     */
    async function refreshData() {
        apiService.clearCache();
        await Promise.all([
            initBurgerSpecial(),
            loadMenuData()
        ]);
    }

    // Set up tab button events
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const category = button.dataset.category;
                if (category === activeCategory) return;
                
                activeCategory = category;
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderMenuItems(category);
            });
        });
    }

    // Initialize the page
    async function init() {
        await Promise.all([
            initBurgerSpecial(),
            loadMenuData()
        ]);
    }

    // Auto-refresh data every 5 minutes
    setInterval(refreshData, 5 * 60 * 1000);

    window.SugarBowlMenu = {
        refresh: refreshData,
        clearCache: () => apiService.clearCache()
    };

    init();
});