/**
 * Progressive Image Loader
 * Handles WebP detection and fallback to original formats
 */

(function() {
    'use strict';

    // WebP support detection
    let webpSupported = null;
    
    /**
     * Detect WebP support in browser
     */
    function detectWebPSupport() {
        return new Promise((resolve) => {
            if (webpSupported !== null) {
                resolve(webpSupported);
                return;
            }
            
            const webP = new Image();
            webP.onload = webP.onerror = function () {
                webpSupported = (webP.height === 2);
                resolve(webpSupported);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    /**
     * Check if a file exists
     */
    function checkFileExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    /**
     * Get WebP version of image path
     */
    function getWebPPath(imagePath) {
        const lastDot = imagePath.lastIndexOf('.');
        if (lastDot === -1) return imagePath + '.webp';
        
        return imagePath.substring(0, lastDot) + '.webp';
    }

    /**
     * Get best available image source
     */
    async function getBestImageSource(originalSrc) {
        // Check WebP support first
        const supportsWebP = await detectWebPSupport();
        
        if (!supportsWebP) {
            return originalSrc;
        }
        
        // Try WebP version
        const webpSrc = getWebPPath(originalSrc);
        const webpExists = await checkFileExists(webpSrc);
        
        return webpExists ? webpSrc : originalSrc;
    }

    /**
     * Load image progressively with WebP support
     */
    async function loadImageProgressively(imgElement, fallbackSrc) {
        if (!imgElement || !fallbackSrc) return;
        
        try {
            // Show loading state
            imgElement.style.opacity = '0.7';
            imgElement.style.filter = 'blur(2px)';
            
            // Get the best source
            const bestSrc = await getBestImageSource(fallbackSrc);
            
            // Create a new image to preload
            const preloadImg = new Image();
            
            preloadImg.onload = function() {
                imgElement.src = bestSrc;
                imgElement.style.opacity = '1';
                imgElement.style.filter = 'none';
                imgElement.style.transition = 'opacity 0.3s ease, filter 0.3s ease';
            };
            
            preloadImg.onerror = function() {
                // Fallback to original
                imgElement.src = fallbackSrc;
                imgElement.style.opacity = '1';
                imgElement.style.filter = 'none';
            };
            
            preloadImg.src = bestSrc;
            
        } catch (error) {
            console.warn('Progressive loading failed, using fallback:', error);
            imgElement.src = fallbackSrc;
            imgElement.style.opacity = '1';
            imgElement.style.filter = 'none';
        }
    }

    /**
     * Update picture elements with WebP support
     */
    async function updatePictureElements() {
        const supportsWebP = await detectWebPSupport();
        
        if (!supportsWebP) {
            // Remove WebP sources from picture elements
            document.querySelectorAll('picture source[type="image/webp"]').forEach(source => {
                source.remove();
            });
        } else {
            // Check if WebP sources exist and remove if they don't
            const webpSources = document.querySelectorAll('picture source[type="image/webp"]');
            
            for (const source of webpSources) {
                const srcset = source.getAttribute('srcset');
                if (srcset) {
                    const exists = await checkFileExists(srcset);
                    if (!exists) {
                        source.remove();
                    }
                }
            }
        }
    }

    /**
     * Initialize progressive image loading for all images
     */
    function initProgressiveLoading() {
        // Handle images with WebP data attributes
        const images = document.querySelectorAll('img[data-webp-src]');
        
        images.forEach(async (img) => {
            const originalSrc = img.src;
            const webpSrc = img.getAttribute('data-webp-src');
            
            // Check WebP support and file existence
            const supportsWebP = await detectWebPSupport();
            
            if (supportsWebP && webpSrc) {
                const webpExists = await checkFileExists(webpSrc);
                if (webpExists) {
                    // Smoothly transition to WebP
                    const preloadImg = new Image();
                    preloadImg.onload = function() {
                        img.style.transition = 'opacity 0.3s ease';
                        img.style.opacity = '0.8';
                        
                        setTimeout(() => {
                            img.src = webpSrc;
                            img.style.opacity = '1';
                        }, 100);
                    };
                    preloadImg.src = webpSrc;
                }
            }
        });
        
        // Handle regular data-src images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(async (img) => {
            const originalSrc = img.getAttribute('data-src');
            await loadImageProgressively(img, originalSrc);
        });
        
        // Update picture elements
        updatePictureElements();
    }

    /**
     * Replace picture elements with simple img elements if WebP not available
     */
    function simplifyPictureElements() {
        document.querySelectorAll('picture').forEach(async (picture) => {
            const img = picture.querySelector('img');
            const webpSource = picture.querySelector('source[type="image/webp"]');
            
            if (!img) return;
            
            const supportsWebP = await detectWebPSupport();
            
            if (!supportsWebP || !webpSource) {
                // Replace picture with simple img
                const newImg = img.cloneNode(true);
                picture.parentNode.replaceChild(newImg, picture);
            } else {
                // Check if WebP file exists
                const webpSrc = webpSource.getAttribute('srcset');
                if (webpSrc) {
                    const exists = await checkFileExists(webpSrc);
                    if (!exists) {
                        // Replace with simple img using fallback
                        const newImg = img.cloneNode(true);
                        picture.parentNode.replaceChild(newImg, picture);
                    }
                }
            }
        });
    }

    /**
     * Handle dynamic image loading (for API-loaded images)
     */
    function handleDynamicImage(imgElement, originalSrc, altText = '') {
        if (!imgElement || !originalSrc) return;
        
        // Set up fallback immediately
        imgElement.src = originalSrc;
        if (altText) imgElement.alt = altText;
        
        // Enhanced error handling
        imgElement.onerror = function() {
            // Try different fallbacks
            const fallbacks = [
                'img/burger1.jpg',
                'img/placeholder.jpg',
                'img/logo.svg'
            ];
            
            for (const fallback of fallbacks) {
                if (this.src !== fallback) {
                    this.src = fallback;
                    this.alt = altText || 'Image not available';
                    break;
                }
            }
        };
        
        // Try to load WebP version progressively
        loadImageProgressively(imgElement, originalSrc);
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initProgressiveLoading();
        simplifyPictureElements();
        
        // Detect WebP support and add class to body
        detectWebPSupport().then(supported => {
            document.body.classList.add(supported ? 'webp-supported' : 'webp-not-supported');
        });
    });

    // Export public API
    window.SugarBowlImageLoader = {
        loadImageProgressively: loadImageProgressively,
        handleDynamicImage: handleDynamicImage,
        getBestImageSource: getBestImageSource,
        detectWebPSupport: detectWebPSupport,
        checkFileExists: checkFileExists
    };

})();