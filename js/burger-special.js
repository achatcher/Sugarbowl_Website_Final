import apiService from './api-service.js';

document.addEventListener('DOMContentLoaded', async function () {
    const currentBurgerEl = document.getElementById('current-burger');
    const homeBurgerImg = document.getElementById('home-burger-image');
    if (!currentBurgerEl) return;

    try {
        currentBurgerEl.innerHTML = '<div class="loading-spinner">Loading this week\'s special...</div>';
        const burger = await apiService.getCurrentBurger();

        if (!burger) {
            currentBurgerEl.innerHTML = '<p class="no-special">Check back soon for our next special!</p>';
            return;
        }

        const shortDescription = burger.description.length > 80
            ? burger.description.substring(0, 80) + '...'
            : burger.description;

        currentBurgerEl.innerHTML = `
            <h4>${burger.name}</h4>
            <p class="price">$${parseFloat(burger.price).toFixed(2)}</p>
            <p>${shortDescription}</p>
        `;

        if (homeBurgerImg && burger.imageUrl) {
            homeBurgerImg.src = burger.imageUrl;
            homeBurgerImg.alt = burger.name;
        }

    } catch (error) {
        console.error('Error loading home burger special:', error);
        currentBurgerEl.innerHTML = '<p class="error-message">Unable to load burger special.</p>';
    }
});
