// Simple Food Carousel
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.getElementById('carousel-container');
    const slides = carousel?.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const indicators = document.querySelectorAll('#carousel-indicators .carousel-dot');
    
    if (!carousel || !slides.length) return;
    
    let currentSlide = 0;
    
    function updateCarousel() {
        // Move carousel
        carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update indicators
        indicators.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarousel();
    }
    
    // Event listeners
    nextBtn?.addEventListener('click', nextSlide);
    prevBtn?.addEventListener('click', prevSlide);
    
    // Indicator clicks
    indicators.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-play every 4 seconds
    setInterval(nextSlide, 4000);
    
    // Initialize
    updateCarousel();
});
