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
            
            // Create item HTML with optional image
            const imageHtml = item.imageUrl 
                ? `<img src="${item.imageUrl}" alt="${item.name}" class="menu-item-image" loading="lazy" onerror="this.style.display='none'">` 
                : '';
            
            itemEl.innerHTML = `
                ${imageHtml}
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
        
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        
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
                // No current burger found
                if (burgerSpotlightEl) {
                    burgerSpotlightEl.innerHTML = '<p class="no-special">No special burger available at the moment.</p>';
                }
                if (currentBurgerEl) {
                    currentBurgerEl.innerHTML = '<p class="no-special">Check back soon for our next special!</p>';
                }
                return;
            }

            const dateRange = formatDateRange(currentBurger.startDate, currentBurger.endDate);
            const imageUrl = currentBurger.imageUrl || 'img/burgers/burger.jpg';
            
            // Update burger spotlight on food page
            if (burgerSpotlightEl) {
                burgerSpotlightEl.innerHTML = `
                    <h3>BURGER SPECIAL</h3>
                    <div class="burger-special-content">
                        <img src="${imageUrl}" alt="${currentBurger.name}" class="burger-image" loading="lazy" onerror="this.src='img/burgers/burger.jpg'">
                        <div class="burger-details">
                            <h4>${currentBurger.name}</h4>
                            ${dateRange ? `<p class="burger-availability">Available: ${dateRange}</p>` : ''}
                            <p class="burger-description">${currentBurger.description}</p>
                            <p class="burger-price">$${parseFloat(currentBurger.price).toFixed(2)}</p>
                        </div>
                    </div>
                `;
            }
            
            // Update current burger for homepage preview
            if (currentBurgerEl) {
                const shortDescription = currentBurger.description.length > 80 
                    ? currentBurger.description.substring(0, 80) + '...'
                    : currentBurger.description;
                    
                currentBurgerEl.innerHTML = `
                    <h4>${currentBurger.name}</h4>
                    <p class="price">$${parseFloat(currentBurger.price).toFixed(2)}</p>
                    <p>${shortDescription}</p>
                `;
            }

            console.log('Burger special loaded successfully');
        } catch (error) {
            console.error('Error loading burger special:', error);
            
            // Show error state
            const errorMessage = '<p class="error-message">Unable to load burger special. Please try again later.</p>';
            if (burgerSpotlightEl) burgerSpotlightEl.innerHTML = errorMessage;
            if (currentBurgerEl) currentBurgerEl.innerHTML = errorMessage;
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
