/**
 * SugarBowl Map Module
 * 
 * Provides an interactive map display for the restaurant location
 * with directions functionality and responsive design.
 * 
 * @version 1.0.0
 */
(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        apiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your actual API key
        location: {
            lat: 40.7128,  // Replace with your restaurant's latitude 
            lng: -74.0060  // Replace with your restaurant's longitude
        },
        zoom: 15,
        mapTypeId: 'roadmap', // Options: 'roadmap', 'satellite', 'hybrid', 'terrain'
        markerTitle: 'SugarBowl',
        address: '123 Main Street, Anytown',
        phone: '(555) 123-4567',
        enableScrollWheel: false,
        enableStreetView: true,
        mapStyles: [
            // Custom map styles for a more themed look
            // This creates a darker theme that matches your app's aesthetic
            {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{"color": "#242f3e"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#746855"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#242f3e"}]
            },
            {
                "featureType": "administrative.locality",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#d59563"}]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#d59563"}]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{"color": "#263c3f"}]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#6b9a76"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{"color": "#38414e"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#212a37"}]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#9ca5b3"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{"color": "#746855"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#1f2835"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#f3d19c"}]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#17263c"}]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#515c6d"}]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#17263c"}]
            }
        ]
    };
    
    // Module state
    let map;
    let marker;
    let infoWindow;
    let isLoaded = false;
    let mapContainer;
    
    /**
     * Initialize the map module
     */
    function init() {
        mapContainer = document.getElementById('map-container');
        
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }
        
        // Replace static image with interactive container
        replaceStaticMapWithContainer();
        
        // Check if page is visible before loading map (for better performance)
        if (isInfoPageActive()) {
            loadGoogleMapsScript();
        } else {
            // Set up event listeners to load map when info page becomes visible
            setupVisibilityListeners();
        }
        
        // Set up direction button functionality
        setupDirectionsButton();
        
        // Make the map responsive
        window.addEventListener('resize', handleResize);
    }
    
    /**
     * Replace static map image with an interactive container
     */
    function replaceStaticMapWithContainer() {
        const mapParent = mapContainer.parentElement;
        
        // Create map container if needed
        if (!document.getElementById('google-map')) {
            const mapDiv = document.createElement('div');
            mapDiv.id = 'google-map';
            mapDiv.className = 'google-map';
            mapDiv.style.width = '100%';
            mapDiv.style.height = '100%';
            mapDiv.style.borderRadius = 'var(--border-radius)';
            
            // Create loading overlay
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'map-loading';
            loadingOverlay.innerHTML = '<div class="loading-spinner">Loading map...</div>';
            
            // Create directions button
            const directionsBtn = document.createElement('button');
            directionsBtn.className = 'map-directions-btn';
            directionsBtn.innerHTML = '<i class="fas fa-directions"></i> Get Directions';
            directionsBtn.setAttribute('aria-label', 'Get directions to SugarBowl');
            
            // Clear the container and add our new elements
            mapContainer.innerHTML = '';
            mapContainer.appendChild(mapDiv);
            mapContainer.appendChild(loadingOverlay);
            mapContainer.appendChild(directionsBtn);
        }
    }
    
    /**
     * Setup visibility listeners for lazy loading
     */
    function setupVisibilityListeners() {
        // Listen for navigation to the info page
        document.querySelectorAll('.main-nav a').forEach(navLink => {
            navLink.addEventListener('click', function() {
                const targetId = this.getAttribute('href').substring(1);
                if (targetId === 'info' && !isLoaded) {
                    loadGoogleMapsScript();
                }
            });
        });
        
        // Also check for direct navigation via URL
        if (window.location.hash === '#info' && !isLoaded) {
            loadGoogleMapsScript();
        }
    }
    
    /**
     * Check if info page is currently active
     */
    function isInfoPageActive() {
        const infoPage = document.getElementById('info');
        return infoPage && infoPage.classList.contains('active-page');
    }
    
    /**
     * Load the Google Maps API script
     */
    function loadGoogleMapsScript() {
        // Prevent multiple loads
        if (window.googleMapsLoading) return;
        window.googleMapsLoading = true;
        
        // Show loading state
        const loadingOverlay = mapContainer.querySelector('.map-loading');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        // Create callback for Google Maps
        window.initSugarBowlMap = initializeMap;
        
        // Add script to page
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.apiKey}&callback=initSugarBowlMap`;
        script.async = true;
        script.defer = true;
        script.onerror = handleMapError;
        
        document.body.appendChild(script);
    }
    
    /**
     * Initialize the map after API is loaded
     */
    function initializeMap() {
        // Get map container
        const mapDiv = document.getElementById('google-map');
        if (!mapDiv) return;
        
        try {
            // Create the map
            map = new google.maps.Map(mapDiv, {
                center: CONFIG.location,
                zoom: CONFIG.zoom,
                mapTypeId: CONFIG.mapTypeId,
                scrollwheel: CONFIG.enableScrollWheel,
                streetViewControl: CONFIG.enableStreetView,
                mapTypeControl: false,
                fullscreenControl: true,
                styles: CONFIG.mapStyles
            });
            
            // Add marker for restaurant location
            marker = new google.maps.Marker({
                position: CONFIG.location,
                map: map,
                title: CONFIG.markerTitle,
                animation: google.maps.Animation.DROP
            });
            
            // Create info window with restaurant details
            infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="map-info-window">
                        <h3>SugarBowl</h3>
                        <p>${CONFIG.address}</p>
                        <p>${CONFIG.phone}</p>
                        <p>
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${CONFIG.location.lat},${CONFIG.location.lng}" 
                               target="_blank" rel="noopener noreferrer">Get Directions</a>
                        </p>
                    </div>
                `
            });
            
            // Show info window when marker is clicked
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
            
            // Hide loading overlay
            const loadingOverlay = mapContainer.querySelector('.map-loading');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            
            // Mark as loaded
            isLoaded = true;
            delete window.googleMapsLoading;
            
        } catch (error) {
            console.error('Error initializing map:', error);
            handleMapError();
        }
    }
    
    /**
     * Handle map errors
     */
    function handleMapError() {
        const loadingOverlay = mapContainer.querySelector('.map-loading');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="map-error">
                    <p>Unable to load map</p>
                    <a href="https://maps.google.com/?q=${CONFIG.address}" 
                       target="_blank" rel="noopener noreferrer" class="btn btn-sm">
                       View on Google Maps
                    </a>
                </div>
            `;
        }
        
        delete window.googleMapsLoading;
    }
    
    /**
     * Setup directions button functionality
     */
    function setupDirectionsButton() {
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('map-directions-btn') || 
                e.target.closest('.map-directions-btn')) {
                
                // Open Google Maps directions in new tab
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${CONFIG.location.lat},${CONFIG.location.lng}`, 
                           '_blank', 'noopener,noreferrer');
            }
        });
    }
    
    /**
     * Handle window resize events
     */
    function handleResize() {
        if (map && isInfoPageActive()) {
            // Trigger a resize event on the map to fix any sizing issues
            google.maps.event.trigger(map, 'resize');
            
            // Re-center the map
            map.setCenter(CONFIG.location);
        }
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Expose public API
    window.SugarBowlMap = {
        refresh: function() {
            if (map) {
                google.maps.event.trigger(map, 'resize');
                map.setCenter(CONFIG.location);
            } else if (isInfoPageActive() && !isLoaded) {
                loadGoogleMapsScript();
            }
        },
        getLocation: function() {
            return { ...CONFIG.location };
        },
        setLocation: function(lat, lng) {
            CONFIG.location = { lat, lng };
            if (map && marker) {
                const newPosition = new google.maps.LatLng(lat, lng);
                map.setCenter(newPosition);
                marker.setPosition(newPosition);
            }
        }
    };
})();