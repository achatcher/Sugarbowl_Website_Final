import apiService from './api-service.js';

document.addEventListener('DOMContentLoaded', async function () {
    const currentBurgerEl = document.getElementById('current-burger');
    const homeBurgerImg = document.getElementById('home-burger-image');
    if (!currentBurgerEl) return;

    try {
        // Enhanced loading state
        if (window.SugarBowlErrorHandler) {
            window.SugarBowlErrorHandler.loadingStates.show(currentBurgerEl, 'Loading this week\'s special...');
        } else {
            currentBurgerEl.innerHTML = '<div class="loading-spinner">Loading this week\'s special...</div>';
        }
        
        const burger = await apiService.getCurrentBurger();

        if (!burger) {
            const fallbackHTML = '<p class="no-special">Check back soon for our next special!</p>';
            
            if (window.SugarBowlErrorHandler) {
                window.SugarBowlErrorHandler.loadingStates.replace(currentBurgerEl, fallbackHTML);
            } else {
                currentBurgerEl.innerHTML = fallbackHTML;
            }
            return;
        }

        const shortDescription = burger.description.length > 80
            ? burger.description.substring(0, 80) + '...'
            : burger.description;

        // Format the availability dates
        let availabilityText = '';
        if (burger.startDate && burger.endDate) {
            const startDate = new Date(burger.startDate);
            const endDate = new Date(burger.endDate);
            
            const formatDate = (date) => {
                return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
            };
            
            availabilityText = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        } else if (burger.startDate) {
            const startDate = new Date(burger.startDate);
            availabilityText = `Starting ${startDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            })}`;
        } else {
            availabilityText = 'Available Now';
        }

        const burgerHTML = `
            <h4>${burger.name}</h4>
            <div class="burger-availability">
                <div class="availability-label">Available:</div>
                <div class="availability-dates">${availabilityText}</div>
            </div>
            <p>${shortDescription}</p>
        `;

        if (window.SugarBowlErrorHandler) {
            window.SugarBowlErrorHandler.loadingStates.replace(currentBurgerEl, burgerHTML);
        } else {
            currentBurgerEl.innerHTML = burgerHTML;
        }

        if (homeBurgerImg && burger.imageUrl) {
            const altText = `${burger.name} - This week's featured burger special`;
            
            // Use progressive image loading if available
            if (window.SugarBowlImageLoader) {
                window.SugarBowlImageLoader.handleDynamicImage(homeBurgerImg, burger.imageUrl, altText);
            } else {
                // Fallback to simple loading
                homeBurgerImg.src = burger.imageUrl;
                homeBurgerImg.alt = altText;
                
                homeBurgerImg.onerror = function() {
                    this.src = 'img/burger1.jpg';
                    this.alt = 'Featured weekly burger special';
                    console.warn('Failed to load burger image, using fallback');
                };
            }
        }

    } catch (error) {
        console.error('Error loading home burger special:', error);
        
        if (window.SugarBowlErrorHandler) {
            window.SugarBowlErrorHandler.apiErrorHandlers.handleBurgerError(error, currentBurgerEl.parentElement || currentBurgerEl);
        } else {
            currentBurgerEl.innerHTML = '<p class="error-message">Unable to load burger special.</p>';
        }
    }
});
