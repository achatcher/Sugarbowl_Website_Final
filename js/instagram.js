/**
 * SugarBowl Instagram Integration Module
 * 
 * Fetches and displays Instagram posts using Instagram Basic Display API
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
    const CONFIG = {
        // Get these from Facebook Developers Console
        accessToken: 'YOUR_INSTAGRAM_ACCESS_TOKEN_HERE',
        userId: 'YOUR_INSTAGRAM_USER_ID_HERE',
        
        // Display settings
        maxPosts: 6,
        cacheExpiration: 3600, // 1 hour in seconds
        fallbackToPlaceholders: true,
        
        // Debug mode
        debugMode: true
    };

    // Cache key for localStorage
    const CACHE_KEY = 'sugarbowl_instagram_posts';

    /**
     * Initialize Instagram feed
     */
    function init() {
        debugLog('Instagram module initializing...');
        
        // Check if we have valid configuration
        if (!isConfigured()) {
            debugLog('Instagram not configured, using placeholder images');
            if (CONFIG.fallbackToPlaceholders) {
                showPlaceholders();
            }
            return;
        }

        // Try to load from cache first
        const cachedPosts = getCachedPosts();
        if (cachedPosts) {
            debugLog('Loading Instagram posts from cache');
            renderPosts(cachedPosts);
        } else {
            // Fetch fresh data
            fetchInstagramPosts();
        }
    }

    /**
     * Check if Instagram is properly configured
     */
    function isConfigured() {
        return CONFIG.accessToken !== 'YOUR_INSTAGRAM_ACCESS_TOKEN_HERE' && 
               CONFIG.userId !== 'YOUR_INSTAGRAM_USER_ID_HERE';
    }

    /**
     * Fetch Instagram posts from API
     */
    async function fetchInstagramPosts() {
        debugLog('Fetching Instagram posts from API...');
        
        try {
            const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${CONFIG.accessToken}&limit=${CONFIG.maxPosts}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Instagram API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(`Instagram API error: ${data.error.message}`);
            }
            
            const posts = data.data || [];
            debugLog(`Fetched ${posts.length} Instagram posts`);
            
            // Cache the posts
            cachePosts(posts);
            
            // Render the posts
            renderPosts(posts);
            
        } catch (error) {
            console.error('Error fetching Instagram posts:', error);
            
            // Fall back to placeholder images
            if (CONFIG.fallbackToPlaceholders) {
                showPlaceholders();
            } else {
                showError();
            }
        }
    }

    /**
     * Render Instagram posts in the feed
     */
    function renderPosts(posts) {
        const container = document.querySelector('.instagram-placeholder-grid');
        
        if (!container) {
            debugLog('Instagram container not found');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Render each post
        posts.slice(0, CONFIG.maxPosts).forEach((post, index) => {
            const postElement = createPostElement(post, index);
            container.appendChild(postElement);
        });

        debugLog(`Rendered ${Math.min(posts.length, CONFIG.maxPosts)} Instagram posts`);
    }

    /**
     * Create a post element
     */
    function createPostElement(post, index) {
        const link = document.createElement('a');
        link.href = post.permalink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        const img = document.createElement('img');
        
        // Use thumbnail for videos, media_url for images
        const imageUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
        img.src = imageUrl;
        img.alt = post.caption ? post.caption.substring(0, 100) + '...' : 'SugarBowl Instagram post';
        img.width = 150;
        img.height = 150;
        img.loading = 'lazy';
        
        // Add error handling for broken images
        img.onerror = function() {
            this.src = `img/instagram-placeholder${(index % 3) + 1}.png`;
        };
        
        link.appendChild(img);
        
        return link;
    }

    /**
     * Show placeholder images (fallback)
     */
    function showPlaceholders() {
        const container = document.querySelector('.instagram-placeholder-grid');
        
        if (!container) return;

        container.innerHTML = `
            <a href="https://www.instagram.com/thesugarbowlkzoo/" target="_blank" rel="noopener noreferrer">
                <img src="img/instagram-placeholder1.png" alt="Latest Instagram post showing SugarBowl's atmosphere and food" width="150" height="150" loading="lazy" data-webp-src="img/instagram-placeholder1.webp">
            </a>
            <a href="https://www.instagram.com/thesugarbowlkzoo/" target="_blank" rel="noopener noreferrer">
                <img src="img/instagram-placeholder2.png" alt="Instagram photo of live music performance at SugarBowl" width="150" height="150" loading="lazy" data-webp-src="img/instagram-placeholder2.webp">
            </a>
            <a href="https://www.instagram.com/thesugarbowlkzoo/" target="_blank" rel="noopener noreferrer">
                <img src="img/instagram-placeholder3.png" alt="Instagram photo of SugarBowl's signature burgers and drinks" width="150" height="150" loading="lazy" data-webp-src="img/instagram-placeholder3.webp">
            </a>
        `;
    }

    /**
     * Show error state
     */
    function showError() {
        const container = document.querySelector('.instagram-placeholder-grid');
        
        if (!container) return;

        container.innerHTML = `
            <div class="instagram-error">
                <p>Unable to load Instagram posts at the moment.</p>
                <a href="https://www.instagram.com/thesugarbowlkzoo/" target="_blank" rel="noopener noreferrer" class="btn btn-sm">
                    Visit Instagram
                </a>
            </div>
        `;
    }

    /**
     * Cache posts in localStorage
     */
    function cachePosts(posts) {
        try {
            const cache = {
                timestamp: Date.now(),
                posts: posts
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            debugLog('Instagram posts cached successfully');
        } catch (error) {
            console.warn('Failed to cache Instagram posts:', error);
        }
    }

    /**
     * Get cached posts if still valid
     */
    function getCachedPosts() {
        try {
            const cacheStr = localStorage.getItem(CACHE_KEY);
            if (!cacheStr) return null;
            
            const cache = JSON.parse(cacheStr);
            const now = Date.now();
            
            // Check if cache is expired
            if (now - cache.timestamp > CONFIG.cacheExpiration * 1000) {
                debugLog('Instagram cache expired');
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            
            return cache.posts;
        } catch (error) {
            console.warn('Error reading Instagram cache:', error);
            return null;
        }
    }

    /**
     * Refresh Instagram feed
     */
    function refresh() {
        // Clear cache
        localStorage.removeItem(CACHE_KEY);
        
        // Fetch fresh data
        if (isConfigured()) {
            fetchInstagramPosts();
        } else {
            showPlaceholders();
        }
    }

    /**
     * Debug logging
     */
    function debugLog(message) {
        if (CONFIG.debugMode) {
            console.log('[Instagram]', message);
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    // Make refresh function available globally
    window.SugarBowlInstagram = {
        refresh: refresh,
        clearCache: function() {
            localStorage.removeItem(CACHE_KEY);
            debugLog('Instagram cache cleared');
        }
    };

})();