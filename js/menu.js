/**
 * SugarBowl Menu Module - Connected to Backend
 * Manages menu data from DynamoDB and burger special displays
 * @version 2.0.0
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
        
        // Only show the actual data: name, description, price
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
            // No current burger found - show appropriate message
            if (burgerSpotlightEl) {
                burgerSpotlightEl.innerHTML = '<p class="no-special">No burger special available at the moment. Check back soon!</p>';
            }
            if (currentBurgerEl) {
                currentBurgerEl.innerHTML = '<p class="no-special">Check back soon for our next special!</p>';
            }
            // Reset home page image to default
            const homeBurgerImage = document.getElementById('home-burger-image');
            if (homeBurgerImage) {
                homeBurgerImage.src = 'img/burger1.webp';
                homeBurgerImage.alt = 'Featured weekly burger special';
            }
            return;
        }

        const dateRange = formatDateRange(currentBurger.startDate, currentBurger.endDate);
        
        // Update burger spotlight on food page - only show image if we have one
        if (burgerSpotlightEl) {
            const imageHtml = currentBurger.imageUrl 
                ? `<img src="${currentBurger.imageUrl}" alt="${currentBurger.name}" class="burger-image" loading="lazy">` 
                : '';
                
            burgerSpotlightEl.innerHTML = `
                <h3>BURGER SPECIAL</h3>
                <div class="burger-special-content">
                    ${imageHtml}
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
            
            // Format the availability dates (same logic as burger-special.js)
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
            } else if (currentBurger.startDate) {
                const startDate = new Date(currentBurger.startDate);
                availabilityText = `Starting ${startDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                })}`;
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

        // Update home page burger image to match the current burger from S3
        const homeBurgerImage = document.getElementById('home-burger-image');
        if (homeBurgerImage && currentBurger.imageUrl) {
            homeBurgerImage.src = currentBurger.imageUrl;
            homeBurgerImage.alt = `${currentBurger.name} - Featured weekly burger special`;
            // Remove the static data-webp-src since we're using dynamic S3 images
            homeBurgerImage.removeAttribute('data-webp-src');
        }

        console.log('Burger special loaded successfully');
    } catch (error) {
        console.error('Error loading burger special:', error);
        
        // Show error state
        const errorMessage = '<p class="error-message">Unable to load burger special. Please try again later.</p>';
        if (burgerSpotlightEl) burgerSpotlightEl.innerHTML = errorMessage;
        if (currentBurgerEl) currentBurgerEl.innerHTML = errorMessage;
        
        // Reset home page image to default on error
        const homeBurgerImage = document.getElementById('home-burger-image');
        if (homeBurgerImage) {
            homeBurgerImage.src = 'img/burger1.webp';
            homeBurgerImage.alt = 'Featured weekly burger special';
        }
    }
}


    /**
     * Load menu data from backend
     */
    async function loadMenuData() {
        try {
            console.log('Loading menu data from backend...');
            
            // Show loading state in menu container
            if (menuContainer) {
                menuContainer.innerHTML = '<div class="loading-spinner">Loading menu items...</div>';
            }
            
            currentMenuData = await apiService.getMenuItemsByCategory();
            
            // Render the active category
            renderMenuItems(activeCategory);
            
            console.log('Menu data loaded successfully:', currentMenuData);
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
        // Clear API cache to get fresh data
        apiService.clearCache();
        
        // Reload both burger and menu data
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
                
                // Don't reload if already active
                if (category === activeCategory) return;
                
                activeCategory = category;
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Render items for selected category
                renderMenuItems(category);
            });
        });
    }

    // Initialize the page
    async function init() {
        console.log('Initializing menu module...');
        
        // Load all data
        await Promise.all([
            initBurgerSpecial(),
            loadMenuData()
        ]);
    }

    // Auto-refresh data every 5 minutes to keep it fresh
    setInterval(refreshData, 5 * 60 * 1000);

    // Make refresh function available globally for debugging
    window.SugarBowlMenu = {
        refresh: refreshData,
        clearCache: () => apiService.clearCache()
    };

    // Initialize everything
    init();
});
