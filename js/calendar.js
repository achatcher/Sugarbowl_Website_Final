/**
 * SugarBowl Calendar Module
 * 
 * Provides an interactive event calendar with modal event details.
 * Features include month navigation, event highlighting, Google Calendar integration,
 * and responsive calendar display with today's event preview.
 * 
 * @version 1.1.0
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        googleCalendarId: 'YOUR_CALENDAR_ID_HERE', // Replace with your actual calendar ID
        apiKey: 'YOUR_API_KEY_HERE', // Replace with your actual API key
        maxResults: 100,
        syncEnabled: true, // Enable Google Calendar
        useLocalEvents: true, // Keep true to use recurring events as fallback
        cacheExpiration: 1800,
        debugMode: true // Enable for testing
    };

    // Recurring Events Configuration - These always happen
    const RECURRING_EVENTS = {
        // Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
        3: [ // Wednesday
            {
                title: 'Bingo Night',
                time: '7:00 PM - 9:00 PM',
                description: 'Weekly bingo night with prizes and drink specials! Come test your luck.',
                image: 'img/events/bingo.jpg',
                recurring: true,
                category: 'weekly'
            }
        ],
        4: [ // Thursday
            {
                title: 'Pool Tournament',
                time: '6:30 PM - 10:00 PM',
                description: 'Weekly pool tournament! Sign up starts at 6:00 PM. Winner takes the pot!',
                image: 'img/events/pool.jpg',
                recurring: true,
                category: 'weekly'
            }
        ],
        5: [ // Friday
            {
                title: 'Karaoke Night',
                time: '8:00 PM - 1:00 AM',
                description: 'Sing your heart out at our legendary karaoke night! Over 10,000 songs to choose from.',
                image: 'img/events/karaoke.jpg',
                recurring: true,
                category: 'weekly'
            }
        ]
    };

    // Store references to DOM elements
    let calendarEl, currentMonthEl, prevMonthBtn, nextMonthBtn;
    let dayModal, dayModalTitle, dayModalEvents;
    
    // Calendar state
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let selectedDay = null;
    let modalCreated = false;
    let isLoading = false;
    let eventsCache = {};
    let lastFetched = null;
    
    // Cache date formatting
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                         "July", "August", "September", "October", "November", "December"];
    const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Local event data as fallback and for development
    const localEvents = {
        // Format: 'YYYY-MM-DD': [{event objects}]
        '2025-06-04': [
            {
                title: 'Bingo Night',
                time: '7:00 PM - 10:00 PM',
                description: 'Weekly bingo night with prizes and special drinks menu.',
                image: 'img/events/bingo.jpg'
            }
        ],
        '2025-06-05': [
            {
                title: 'Karaoke Night',
                time: '8:00 PM - 12:00 AM',
                description: 'Sing your heart out at our weekly karaoke night! Over 10,000 songs to choose from.',
                image: 'img/events/karaoke.jpg'
            }
        ],
        '2025-06-07': [
            {
                title: 'Live Band: The Rockers',
                time: '9:00 PM - 1:00 AM',
                description: 'The Rockers are bringing their unique blend of classic rock and modern hits to SugarBowl.',
                image: 'img/events/band1.jpg'
            }
        ],
        '2025-06-11': [
            {
                title: 'Bingo Night',
                time: '7:00 PM - 10:00 PM',
                description: 'Weekly bingo night with prizes and special drinks menu.',
                image: 'img/events/bingo.jpg'
            }
        ],
        '2025-06-12': [
            {
                title: 'Karaoke Night',
                time: '8:00 PM - 12:00 AM',
                description: 'Sing your heart out at our weekly karaoke night! Over 10,000 songs to choose from.',
                image: 'img/events/karaoke.jpg'
            }
        ],
        '2025-06-14': [
            {
                title: 'Live Band: Jazz Ensemble',
                time: '8:00 PM - 11:00 PM',
                description: 'Enjoy a sophisticated evening of jazz standards and improvisation.',
                image: 'img/events/band2.jpg'
            }
        ],
        '2025-06-18': [
            {
                title: 'Bingo Night',
                time: '7:00 PM - 10:00 PM',
                description: 'Weekly bingo night with prizes and special drinks menu.',
                image: 'img/events/bingo.jpg'
            }
        ],
        '2025-06-19': [
            {
                title: 'Karaoke Night',
                time: '8:00 PM - 12:00 AM',
                description: 'Sing your heart out at our weekly karaoke night! Over 10,000 songs to choose from.',
                image: 'img/events/karaoke.jpg'
            }
        ],
        '2025-06-21': [
            {
                title: 'Live Band: Electronic Vibes',
                time: '9:00 PM - 1:00 AM',
                description: 'Dance the night away with the best electronic music in town.',
                image: 'img/events/band3.jpg'
            }
        ],
        '2025-06-25': [
            {
                title: 'Bingo Night',
                time: '7:00 PM - 10:00 PM',
                description: 'Weekly bingo night with prizes and special drinks menu.',
                image: 'img/events/bingo.jpg'
            }
        ],
        '2025-06-26': [
            {
                title: 'Karaoke Night',
                time: '8:00 PM - 12:00 AM',
                description: 'Sing your heart out at our weekly karaoke night! Over 10,000 songs to choose from.',
                image: 'img/events/karaoke.jpg'
            }
        ],
        '2025-06-28': [
            {
                title: 'Live Band: Country Roads',
                time: '8:00 PM - 12:00 AM',
                description: 'Get ready for some boot-stomping country music that will get everyone on the dance floor.',
                image: 'img/events/band4.jpg'
            }
        ],
        '2025-06-30': [
            {
                title: 'Special Event: Summer Kickoff Party',
                time: '6:00 PM - 2:00 AM',
                description: 'Celebrate the start of summer with special menu items, drink promotions, and live DJs all night!',
                image: 'img/events/summer.jpg'
            }
        ],
        '2025-07-02': [
            {
                title: 'Bingo Night',
                time: '7:00 PM - 10:00 PM',
                description: 'Weekly bingo night with prizes and special drinks menu.',
                image: 'img/events/bingo.jpg'
            }
        ],
        '2025-07-03': [
            {
                title: 'Karaoke Night',
                time: '8:00 PM - 12:00 AM',
                description: 'Sing your heart out at our weekly karaoke night! Over 10,000 songs to choose from.',
                image: 'img/events/karaoke.jpg'
            }
        ]
    };
    
    // Current working events data (will be populated from Google Calendar or local events)
    let events = {};
    
    /**
     * Add recurring weekly events to the events object
     * This ensures we always have weekly events even if Google Calendar fails
     */
    function addRecurringEvents() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        
        // Generate recurring events for the entire year
        for (let date = new Date(startOfYear); date <= endOfYear; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            
            if (RECURRING_EVENTS[dayOfWeek]) {
                const dateString = formatDateString(date);
                
                // Only add if we don't already have events for this date
                if (!events[dateString]) {
                    events[dateString] = [];
                }
                
                // Add all recurring events for this day
                RECURRING_EVENTS[dayOfWeek].forEach(recurringEvent => {
                    // Check if we already have this event (avoid duplicates)
                    const exists = events[dateString].some(existing => 
                        existing.title === recurringEvent.title
                    );
                    
                    if (!exists) {
                        events[dateString].push({
                            ...recurringEvent,
                            date: dateString,
                            source: 'recurring'
                        });
                    }
                });
            }
        }
        
        debugLog(`Added recurring events for ${Object.keys(RECURRING_EVENTS).length} days of week`);
    }
    
    /**
     * Initialize the calendar module
     */
    function init() {
        // Get DOM elements
        calendarEl = document.getElementById('events-calendar');
        currentMonthEl = document.getElementById('current-month');
        prevMonthBtn = document.getElementById('prev-month');
        nextMonthBtn = document.getElementById('next-month');
        
        if (!calendarEl) {
            debugLog('Calendar element not found', 'error');
            return;
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Either use existing modal or prepare to create one
        if (document.getElementById('day-modal')) {
            setupExistingModal();
        }
        
        // Always load local events first for immediate display
        if (CONFIG.useLocalEvents) {
            events = JSON.parse(JSON.stringify(localEvents)); // Clone local events
            addRecurringEvents(); // Add weekly recurring events
            renderCalendar();
            updateTodayEvent();
        }
        
        // Then try to load from Google Calendar if enabled (will merge with local events)
        if (CONFIG.syncEnabled) {
            loadGoogleApi();
        }
    }
    
    /**
     * Load Google API and initialize the client
     */
    function loadGoogleApi() {
        debugLog('Loading Google API');
        showLoading(true);
        
        // Check if we have cached events that are still valid
        const cachedEvents = getCachedEvents();
        if (cachedEvents) {
            debugLog('Using cached events');
            events = cachedEvents;
            renderCalendar();
            updateTodayEvent();
            showLoading(false);
            return;
        }
        
        // Create script element to load Google API
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = initGoogleClient;
        script.onerror = handleApiLoadError;
        document.body.appendChild(script);
    }
    
    /**
     * Initialize the Google API client
     */
    function initGoogleClient() {
        debugLog('Initializing Google API client');
        
        gapi.load('client', () => {
            gapi.client.init({
                apiKey: CONFIG.apiKey,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
            }).then(() => {
                fetchGoogleCalendarEvents();
            }).catch(handleApiError);
        });
    }
    
    /**
     * Fetch events from Google Calendar
     */
    function fetchGoogleCalendarEvents() {
        debugLog('Fetching Google Calendar events');
        
        // Check if API is available
        if (!window.gapi || !gapi.client || !gapi.client.calendar) {
            debugLog('Google Calendar API not available', 'error');
            handleApiError(new Error('Google Calendar API not initialized'));
            return;
        }
        
        // Calculate time ranges (3 months before and after current month)
        const timeMin = new Date(currentYear, currentMonth - 3, 1).toISOString();
        const timeMax = new Date(currentYear, currentMonth + 4, 0).toISOString();
        
        debugLog(`Fetching events from ${timeMin} to ${timeMax}`);
        
        try {
            gapi.client.calendar.events.list({
                calendarId: CONFIG.googleCalendarId,
                timeMin: timeMin,
                timeMax: timeMax,
                maxResults: CONFIG.maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            }).then(response => {
                debugLog('Received response from Google Calendar API');
                processCalendarEvents(response);
            }).catch(error => {
                debugLog('Google Calendar API request failed: ' + error.message, 'error');
                handleApiError(error);
            });
        } catch (error) {
            debugLog('Error making Google Calendar API request: ' + error.message, 'error');
            handleApiError(error);
        }
    }
    
    /**
     * Process the calendar events from Google Calendar
     * @param {Object} response - The response from Google Calendar API
     */
    function processCalendarEvents(response) {
        debugLog('Processing calendar events');
        
        // Enhanced error checking for API response
        if (!response || !response.result) {
            debugLog('Invalid response structure from Google Calendar API', 'error');
            throw new Error('Invalid API response structure');
        }
        
        const items = response.result.items || [];
        
        if (!Array.isArray(items)) {
            debugLog('Calendar API returned invalid items structure', 'error');
            throw new Error('Invalid items structure in API response');
        }
        
        debugLog(`Processing ${items.length} calendar events`);
        
        // Convert Google Calendar events to our format and merge with existing events
        // Don't reset events object - preserve local/recurring events
        
        items.forEach(event => {
            // Get start and end times
            let start, end, isAllDay = false;
            
            if (event.start.dateTime) {
                start = new Date(event.start.dateTime);
                end = new Date(event.end.dateTime);
            } else {
                // All-day event
                start = new Date(event.start.date);
                end = new Date(event.end.date);
                isAllDay = true;
            }
            
            // Format date string (YYYY-MM-DD)
            const dateStr = formatDateString(start);
            
            // Format time string
            let timeStr;
            if (isAllDay) {
                timeStr = 'All Day';
            } else {
                timeStr = `${formatTime(start)} - ${formatTime(end)}`;
            }
            
            // Create event object
            const eventObj = {
                id: event.id,
                title: event.summary || 'Untitled Event',
                time: timeStr,
                description: event.description || 'No description available.',
                image: 'img/events/default.jpg', // Default image
                location: event.location || '',
                link: event.htmlLink || '',
                isAllDay: isAllDay,
                start: start,
                end: end,
                originalEvent: event // Store the original event for reference
            };
            
            // Add to events object, creating array if needed
            if (!events[dateStr]) {
                events[dateStr] = [];
            }
            events[dateStr].push(eventObj);
        });
        
        // Cache the events
        cacheEvents(events);
        
        // Update the UI
        renderCalendar();
        updateTodayEvent();
        showLoading(false);
    }
    
    /**
     * Cache events in localStorage
     * @param {Object} eventsData - The events data to cache
     */
    function cacheEvents(eventsData) {
        try {
            const cache = {
                timestamp: Date.now(),
                events: eventsData
            };
            localStorage.setItem('sugarbowl_events_cache', JSON.stringify(cache));
            debugLog('Events cached successfully');
        } catch (e) {
            debugLog('Failed to cache events: ' + e.message, 'warn');
        }
    }
    
    /**
     * Get cached events if they're still valid
     * @returns {Object|null} Cached events or null if invalid/expired
     */
    function getCachedEvents() {
        try {
            const cacheStr = localStorage.getItem('sugarbowl_events_cache');
            if (!cacheStr) return null;
            
            const cache = JSON.parse(cacheStr);
            const now = Date.now();
            
            // Check if cache is expired
            if (now - cache.timestamp > CONFIG.cacheExpiration * 1000) {
                debugLog('Cache expired');
                return null;
            }
            
            return cache.events;
        } catch (e) {
            debugLog('Error reading cache: ' + e.message, 'warn');
            return null;
        }
    }
    
    /**
     * Format time from Date object to readable string (12-hour format)
     * @param {Date} date - The date object
     * @returns {String} Formatted time string (e.g., "7:30 PM")
     */
    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    /**
     * Handle API load error
     */
    function handleApiLoadError() {
        debugLog('Failed to load Google API', 'error');
        showLoading(false);
        
        // Use enhanced error handler if available
        if (window.SugarBowlErrorHandler) {
            window.SugarBowlErrorHandler.apiErrorHandlers.handleCalendarError(
                new Error('Google Calendar API failed to load'),
                document.getElementById('events-calendar')
            );
        }
        
        // Fall back to local events
        if (CONFIG.useLocalEvents) {
            debugLog('Falling back to local events');
            events = JSON.parse(JSON.stringify(localEvents)); // Clone local events
            addRecurringEvents(); // Add weekly recurring events
            renderCalendar();
            updateTodayEvent();
        }
    }
    
    /**
     * Handle API errors
     * @param {Object} error - The error object
     */
    function handleApiError(error) {
        debugLog('Google API error: ' + JSON.stringify(error), 'error');
        showLoading(false);
        
        // Use enhanced error handler if available
        if (window.SugarBowlErrorHandler) {
            window.SugarBowlErrorHandler.apiErrorHandlers.handleCalendarError(
                error,
                document.getElementById('events-calendar')
            );
        }
        
        // Fall back to local events
        if (CONFIG.useLocalEvents) {
            debugLog('Falling back to local events after API error');
            events = JSON.parse(JSON.stringify(localEvents)); // Clone local events
            addRecurringEvents(); // Add weekly recurring events
            renderCalendar();
            updateTodayEvent();
        } else {
            // Show error message if no fallback available
            const calendarEl = document.getElementById('events-calendar');
            if (calendarEl) {
                calendarEl.innerHTML = '<div class="error-message">Unable to load calendar events. Please try again later.</div>';
            }
        }
    }
    
    /**
     * Show or hide loading state
     * @param {Boolean} show - Whether to show or hide loading state
     */
    function showLoading(show) {
        isLoading = show;
        
        if (calendarEl) {
            if (show) {
                calendarEl.innerHTML = '<div class="loading-spinner">Loading events...</div>';
            } else {
                // Calendar will be rendered after loading completes
            }
        }
        
        // Also update today's event display if showing loading state
        const todayEvent = document.getElementById('today-event');
        if (todayEvent && show) {
            todayEvent.innerHTML = '<div class="loading-spinner">Loading today\'s events...</div>';
        }
    }
    
    /**
     * Set up event listeners for calendar navigation
     */
    function setupEventListeners() {
        // Previous month button
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', navigateToPrevMonth);
            prevMonthBtn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToPrevMonth();
                }
            });
        }
        
        // Next month button
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', navigateToNextMonth);
            nextMonthBtn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToNextMonth();
                }
            });
        }
        
        // Keyboard navigation for month
        document.addEventListener('keydown', function(e) {
            // Only if calendar page is active
            const eventsPage = document.getElementById('events');
            if (eventsPage && !eventsPage.classList.contains('active-page')) return;
            
            if (e.key === 'ArrowLeft') {
                navigateToPrevMonth();
            } else if (e.key === 'ArrowRight') {
                navigateToNextMonth();
            }
        });
        
        // Handle escape key for modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dayModal && dayModal.style.display === 'flex') {
                closeModal();
            }
        });
        
        // "View All Events" button click handling
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('view-all-btn') || e.target.classList.contains('view-all-events-btn')) {
                e.preventDefault();
                
                // Navigate to events page
                if (window.SugarBowlApp && typeof window.SugarBowlApp.navigateTo === 'function') {
                    window.SugarBowlApp.navigateTo('events');
                } else {
                    // Fallback navigation
                    const eventLink = document.querySelector('.main-nav a[href="#events"]');
                    if (eventLink) eventLink.click();
                }
            }
        });
    }
    
    /**
     * Navigate to previous month
     */
    function navigateToPrevMonth() {
        if (isLoading) return; // Prevent navigation while loading
        
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
        
        // Fetch new events if using Google Calendar and we're viewing a month outside our cached range
        if (CONFIG.syncEnabled && shouldRefreshEvents()) {
            fetchGoogleCalendarEvents();
        }
    }
    
    /**
     * Navigate to next month
     */
    function navigateToNextMonth() {
        if (isLoading) return; // Prevent navigation while loading
        
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
        
        // Fetch new events if using Google Calendar and we're viewing a month outside our cached range
        if (CONFIG.syncEnabled && shouldRefreshEvents()) {
            fetchGoogleCalendarEvents();
        }
    }
    
    /**
     * Check if we should refresh events data
     * @returns {Boolean} True if we should refresh events
     */
    function shouldRefreshEvents() {
        // If we've never fetched events, definitely refresh
        if (!lastFetched) return true;
        
        // If last fetch was more than 30 minutes ago, refresh
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - lastFetched > thirtyMinutes) return true;
        
        return false;
    }
    
    /**
     * Use existing modal in the DOM
     */
    function setupExistingModal() {
        modalCreated = true;
        dayModal = document.getElementById('day-modal');
        dayModalTitle = document.getElementById('day-modal-title');
        dayModalEvents = document.getElementById('day-modal-events');
        
        const closeBtn = dayModal.querySelector('.close-day-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // Close on click outside
        dayModal.addEventListener('click', function(e) {
            if (e.target === dayModal) {
                closeModal();
            }
        });
    }
    
    /**
     * Create the day modal dynamically
     */
    function createDayModal() {
        // Create modal element
        dayModal = document.createElement('div');
        dayModal.className = 'day-modal';
        dayModal.id = 'day-modal';
        dayModal.setAttribute('role', 'dialog');
        dayModal.setAttribute('aria-modal', 'true');
        dayModal.setAttribute('aria-labelledby', 'day-modal-title');
        
        // Create modal content
        dayModal.innerHTML = `
            <div class="day-modal-content">
                <button type="button" class="close-day-modal" aria-label="Close">×</button>
                <h3 class="day-title" id="day-modal-title">Events for Date</h3>
                <div id="day-modal-events"></div>
            </div>
        `;
        
        document.body.appendChild(dayModal);
        
        // Get references to modal elements
        dayModalTitle = document.getElementById('day-modal-title');
        dayModalEvents = document.getElementById('day-modal-events');
        
        // Setup close button event
        const closeBtn = dayModal.querySelector('.close-day-modal');
        closeBtn.addEventListener('click', closeModal);
        
        // Close on click outside
        dayModal.addEventListener('click', function(e) {
            if (e.target === dayModal) {
                closeModal();
            }
        });
        
        // Mark as created
        modalCreated = true;
    }
    
    /**
     * Close the modal
     */
    function closeModal() {
        if (!dayModal) return;
        
        dayModal.style.display = 'none';
        
        // Return focus to the previously selected day
        if (selectedDay) {
            selectedDay.focus();
        }
    }
    
    /**
     * Render the calendar with current month/year
     */
    function renderCalendar() {
        if (!calendarEl) return;
        
        // Update month/year display
        if (currentMonthEl) {
            currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        }
        
        // Clear previous calendar
        calendarEl.innerHTML = '';
        
        // Create calendar header (days of week)
        const calendarHeader = document.createElement('div');
        calendarHeader.className = 'calendar-header';
        calendarHeader.setAttribute('role', 'row');
        
        for (let i = 0; i < 7; i++) {
            const dayEl = document.createElement('span');
            dayEl.textContent = dayOfWeekShort[i];
            dayEl.setAttribute('role', 'columnheader');
            dayEl.setAttribute('aria-label', dayOfWeekNames[i]);
            calendarHeader.appendChild(dayEl);
        }
        
        calendarEl.appendChild(calendarHeader);
        
        // Create days grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'calendar-days';
        daysGrid.setAttribute('role', 'grid');
        daysGrid.setAttribute('aria-labelledby', 'current-month');
        
        // Calculate first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // For screen readers
        const gridWeeks = Math.ceil((firstDay + lastDate) / 7);
        daysGrid.setAttribute('aria-rowcount', gridWeeks);
        
        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day inactive';
            emptyCell.setAttribute('role', 'gridcell');
            emptyCell.setAttribute('aria-hidden', 'true');
            daysGrid.appendChild(emptyCell);
        }
        
        // Add cells for each day of the month
        for (let date = 1; date <= lastDate; date++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = date;
            dayCell.setAttribute('role', 'gridcell');
            dayCell.setAttribute('tabindex', '0');
            
            const dateObj = new Date(currentYear, currentMonth, date);
            const dateString = formatDateString(dateObj);
            
            // Store date string as data attribute
            dayCell.dataset.date = dateString;
            
            // Set appropriate aria labels
            const dayName = dayOfWeekNames[dateObj.getDay()];
            const monthName = monthNames[dateObj.getMonth()];
            const hasEvents = events[dateString] ? `with ${events[dateString].length} event${events[dateString].length !== 1 ? 's' : ''}` : 'no events';
            dayCell.setAttribute('aria-label', `${dayName}, ${monthName} ${date}, ${hasEvents}`);
            
            // Check if this day has events
            if (events[dateString]) {
                dayCell.classList.add('has-event');
            }
            
            // Highlight today
            if (isToday(currentYear, currentMonth, date)) {
                dayCell.classList.add('today');
                dayCell.setAttribute('aria-current', 'date');
            }
            
            // Click event to show modal
            dayCell.addEventListener('click', function() {
                showDayModal(dateString, this);
            });
            
            // Keyboard navigation
            dayCell.addEventListener('keydown', function(e) {
                handleDayCellKeyDown(e, date, this);
            });
            
            daysGrid.appendChild(dayCell);
        }
        
        calendarEl.appendChild(daysGrid);
        
        // After rendering, handle focus for today or selected day
        setTimeout(function() {
            // If current month/year, focus on today
            if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
                const todayCell = calendarEl.querySelector('.calendar-day.today');
                if (todayCell) {
                    todayCell.focus();
                }
            }
        }, 100);
    }
    
    /**
     * Handle keyboard navigation for day cells
     * @param {Event} e - The keyboard event
     * @param {Number} date - The day of the month
     * @param {Element} cell - The day cell element
     */
    function handleDayCellKeyDown(e, date, cell) {
        let newDate, newCell;
        
        switch(e.key) {
            case 'Enter':
            case ' ':
                // Select day on Enter or Space
                e.preventDefault();
                const dateString = formatDateString(new Date(currentYear, currentMonth, date));
                showDayModal(dateString, cell);
                break;
                
            case 'ArrowLeft':
                // Move left (previous day)
                e.preventDefault();
                newDate = new Date(currentYear, currentMonth, date - 1);
                moveFocusToDate(newDate);
                break;
                
            case 'ArrowRight':
                // Move right (next day)
                e.preventDefault();
                newDate = new Date(currentYear, currentMonth, date + 1);
                moveFocusToDate(newDate);
                break;
                
            case 'ArrowUp':
                // Move up (previous week)
                e.preventDefault();
                newDate = new Date(currentYear, currentMonth, date - 7);
                moveFocusToDate(newDate);
                break;
                
            case 'ArrowDown':
                // Move down (next week)
                e.preventDefault();
                newDate = new Date(currentYear, currentMonth, date + 7);
                moveFocusToDate(newDate);
                break;
                
            case 'Home':
                // Move to first day of month
                e.preventDefault();
                newCell = calendarEl.querySelectorAll('.calendar-day:not(.inactive)')[0];
                if (newCell) newCell.focus();
                break;
                
            case 'End':
                // Move to last day of month
                e.preventDefault();
                const cells = calendarEl.querySelectorAll('.calendar-day:not(.inactive)');
                newCell = cells[cells.length - 1];
                if (newCell) newCell.focus();
                break;
        }
    }
    
    /**
     * Move focus to a specific date, changing month if needed
     * @param {Date} date - The date to focus on
     */
    function moveFocusToDate(date) {
        // If date is in a different month, navigate there
        if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
            currentMonth = date.getMonth();
            currentYear = date.getFullYear();
            renderCalendar();
            
            // After render, focus on the specific date
            setTimeout(function() {
                const dateStr = date.getDate().toString();
                const cells = calendarEl.querySelectorAll('.calendar-day:not(.inactive)');
                for (let cell of cells) {
                    if (cell.textContent === dateStr) {
                        cell.focus();
                        break;
                    }
                }
            }, 100);
        } else {
            // Same month, just focus on the right cell
            const dateStr = date.getDate().toString();
            const cells = calendarEl.querySelectorAll('.calendar-day:not(.inactive)');
            for (let cell of cells) {
                if (cell.textContent === dateStr) {
                    cell.focus();
                    break;
                }
            }
        }
    }
    
    /**
     * Show the modal for a specific day
     * @param {String} dateString - The date string in format YYYY-MM-DD
     * @param {Element} dayElement - The day cell element
     */
    function showDayModal(dateString, dayElement) {
        // Create modal if it doesn't exist
        if (!modalCreated) {
            createDayModal();
        }
        
        // Store selected day for focus management
        selectedDay = dayElement;
        
        // Remove selected class from all days
        const allDays = document.querySelectorAll('.calendar-day');
        allDays.forEach(day => day.classList.remove('selected'));
        
        // Add selected class to this day
        dayElement.classList.add('selected');
        
        // Get date components for the title
        const [year, month, day] = dateString.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dayOfWeekNames[dateObj.getDay()];
        const monthName = monthNames[dateObj.getMonth()];
        
        // Set modal title
        dayModalTitle.textContent = `${dayOfWeek}, ${monthName} ${day}`;
        
        // Clear previous events
        dayModalEvents.innerHTML = '';
        
        // Check if there are events for this date
        if (events[dateString] && events[dateString].length > 0) {
            const eventList = document.createElement('div');
            eventList.className = 'event-list';
            
            // Add each event to the list
            events[dateString].forEach((event, index) => {
                const eventItem = document.createElement('div');
                eventItem.className = 'event-item';
                eventItem.setAttribute('tabindex', '0');
                eventItem.setAttribute('role', 'button');
                eventItem.setAttribute('aria-label', `${event.title}, ${event.time}`);
                
                // Create event content with icon and proper structure
                eventItem.innerHTML = `
                    <h4>${event.title}</h4>
                    <div class="event-time">
                        <i class="far fa-clock" aria-hidden="true"></i>
                        <span>${event.time}</span>
                    </div>
                    <div class="event-desc">${event.description}</div>
                    ${event.location ? `<div class="event-location"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${event.location}</div>` : ''}
                    ${CONFIG.syncEnabled && event.link ? `<a href="${event.link}" class="event-link" target="_blank" rel="noopener noreferrer">View in Google Calendar</a>` : ''}
                `;
                
                // Accessible keyboard interaction
                eventItem.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        showEventDetails(event);
                    }
                });
                
                // Click event for details
                eventItem.addEventListener('click', function() {
                    showEventDetails(event);
                });
                
                eventList.appendChild(eventItem);
            });
            
            dayModalEvents.appendChild(eventList);
        } else {
            // No events for this date
            const noEvents = document.createElement('div');
            noEvents.className = 'no-events';
            noEvents.innerHTML = '<p>No events scheduled for this date</p>';
            dayModalEvents.appendChild(noEvents);
        }
        
        // Show the modal
        dayModal.style.display = 'flex';
        
        // Focus on the first event item or close button
        setTimeout(function() {
            const firstEvent = dayModal.querySelector('.event-item');
            if (firstEvent) {
                firstEvent.focus();
            } else {
                dayModal.querySelector('.close-day-modal').focus();
            }
        }, 100);
    }
    
    /**
     * Show detailed view of an event
     * @param {Object} event - The event object
     */
    function showEventDetails(event) {
        // Here you can implement detailed view like expanding the event or opening another modal
        // For now, we'll just use the existing modal's content to show more details
        
        // If there's a link to the Google Calendar event and it's from Google Calendar
        if (CONFIG.syncEnabled && event.link) {
            // Open the event in Google Calendar in a new tab
            window.open(event.link, '_blank', 'noopener,noreferrer');
        } else {
            // For local events, we could do something else, or even create a new modal
            debugLog('Event details clicked: ' + event.title);
            
            // For now, we'll keep using the existing behavior from your code
            console.log('Event details:', event);
        }
    }
    
    /**
     * Get upcoming events starting from today
     * @param {Number} limit - Maximum number of events to return
     * @returns {Array} Array of upcoming events with dates
     */
    function getUpcomingEvents(limit = 3) {
        const upcomingEvents = [];
        const today = new Date();
        const maxDaysAhead = 30; // Look ahead 30 days maximum
        
        for (let daysAhead = 0; daysAhead < maxDaysAhead && upcomingEvents.length < limit; daysAhead++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + daysAhead);
            const dateString = formatDateString(checkDate);
            
            if (events[dateString] && events[dateString].length > 0) {
                events[dateString].forEach(event => {
                    if (upcomingEvents.length < limit) {
                        upcomingEvents.push({
                            ...event,
                            date: checkDate,
                            dateString: dateString,
                            dayName: dayOfWeekNames[checkDate.getDay()],
                            monthName: monthNames[checkDate.getMonth()],
                            dayNumber: checkDate.getDate(),
                            isToday: daysAhead === 0,
                            isTomorrow: daysAhead === 1
                        });
                    }
                });
            }
        }
        
        return upcomingEvents;
    }
    
    /**
     * Format date for display (e.g., "Today", "Tomorrow", "Wed, Dec 15")
     */
    function formatEventDate(eventData) {
        if (eventData.isToday) return 'Today';
        if (eventData.isTomorrow) return 'Tomorrow';
        
        const dayAbbr = eventData.dayName.substring(0, 3);
        const monthAbbr = eventData.monthName.substring(0, 3);
        return `${dayAbbr}, ${monthAbbr} ${eventData.dayNumber}`;
    }
    
    /**
     * Update upcoming events on the homepage and events page
     */
    function updateUpcomingEvents() {
        const upcomingEventsContainer = document.getElementById('today-event');
        const eventsPageContainer = document.getElementById('events-page-upcoming-container');
        
        const upcomingEvents = getUpcomingEvents(5); // Get more events for events page
        
        // Update home page upcoming events (limit to 3) - keep original styling
        if (upcomingEventsContainer) {
            updateHomePageUpcomingEvents(upcomingEventsContainer, upcomingEvents.slice(0, 3));
        }
        
        // Update events page upcoming events (show all 5) - use new styling
        if (eventsPageContainer) {
            updateEventsPageUpcomingEvents(eventsPageContainer, upcomingEvents);
        }
    }
    
    /**
     * Update home page upcoming events (original styling)
     */
    function updateHomePageUpcomingEvents(container, events) {
        if (events.length > 0) {
            let eventsHtml = '<div class="upcoming-events-list">';
            
            events.forEach((event, index) => {
                const eventDate = formatEventDate(event);
                eventsHtml += `
                    <div class="upcoming-event-item" data-event-date="${event.dateString}">
                        <div class="event-info">
                            <div class="date-label">${eventDate}</div>
                            <div class="event-details">
                                <h4 class="event-title">${event.title}</h4>
                                <div class="event-time">
                                    <i class="far fa-clock" aria-hidden="true"></i>
                                    <span>${event.time}</span>
                                </div>
                            </div>
                        </div>
                        <div class="event-action">
                            <button class="more-info-btn" 
                                    data-event-date="${event.dateString}" 
                                    data-event-title="${event.title}"
                                    aria-label="More info about ${event.title}">
                                More Info
                            </button>
                        </div>
                    </div>
                `;
            });
            
            eventsHtml += '</div>';
            eventsHtml += `
                <div class="view-all-container">
                    <button class="btn view-all-events-btn">VIEW ALL EVENTS</button>
                </div>
            `;
            
            try {
                container.innerHTML = eventsHtml;
                setupMoreInfoButtons();
            } catch (e) {
                debugLog('Error updating upcoming events: ' + e.message, 'error');
                container.innerHTML = '<p>Error loading event information</p>';
            }
        } else {
            container.innerHTML = `
                <div class="no-upcoming-events">
                    <p>No upcoming events scheduled</p>
                    <button class="btn view-all-events-btn">VIEW ALL EVENTS</button>
                </div>
            `;
        }
    }
    
    /**
     * Update events page upcoming events (new styling)
     */
    function updateEventsPageUpcomingEvents(container, events) {
        if (events.length > 0) {
            let eventsHtml = '<div class="upcoming-events-list">';
            
            events.forEach((event, index) => {
                const eventDate = formatEventDate(event);
                const isPrimary = index === 0; // First event is primary
                
                // For events page, show full day name and clean date format
                const dayLabel = event.isToday ? 'Today' : 
                               event.isTomorrow ? 'Tomorrow' : 
                               event.dayName; // Full day name (e.g., "Friday")
                
                eventsHtml += `
                    <div class="upcoming-event ${isPrimary ? 'primary-event' : 'secondary-event'}" data-event-date="${event.dateString}">
                        <div class="event-date-badge">
                            <div class="date-label">${dayLabel}</div>
                            <div class="date-full">${event.monthName} ${event.dayNumber}</div>
                        </div>
                        <div class="event-content">
                            <h4>${event.title}</h4>
                            <div class="event-time">
                                <i class="far fa-clock" aria-hidden="true"></i>
                                ${event.time}
                            </div>
                            <p>${event.description}</p>
                            ${event.recurring ? '<span class="recurring-badge">Weekly</span>' : ''}
                        </div>
                    </div>
                `;
            });
            
            eventsHtml += '</div>';
            
            try {
                container.innerHTML = eventsHtml;
                setupEventClickHandlers(container);
            } catch (e) {
                debugLog('Error updating upcoming events: ' + e.message, 'error');
                container.innerHTML = '<p>Error loading event information</p>';
            }
        } else {
            container.innerHTML = `
                <div class="no-upcoming-events">
                    <p>No upcoming events scheduled</p>
                </div>
            `;
        }
    }
    
    /**
     * Set up click handlers for "More Info" buttons (home page)
     */
    function setupMoreInfoButtons() {
        const moreInfoButtons = document.querySelectorAll('.more-info-btn');
        
        moreInfoButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const eventDate = this.getAttribute('data-event-date');
                const eventTitle = this.getAttribute('data-event-title');
                
                // Navigate to events page
                if (window.SugarBowlApp && typeof window.SugarBowlApp.navigateTo === 'function') {
                    window.SugarBowlApp.navigateTo('events');
                } else {
                    // Fallback navigation
                    const eventLink = document.querySelector('.main-nav a[href="#events"]');
                    if (eventLink) eventLink.click();
                }
                
                // After a short delay, show the specific event
                setTimeout(() => {
                    showSpecificEvent(eventDate, eventTitle);
                }, 300);
                
                // Track analytics
                if (window.SugarBowlAnalytics) {
                    window.SugarBowlAnalytics.trackCalendarInteraction('more_info_click', eventTitle);
                }
            });
        });
    }
    
    /**
     * Set up click handlers for event items (events page)
     */
    function setupEventClickHandlers(container) {
        const eventItems = container.querySelectorAll('.upcoming-event');
        
        eventItems.forEach(eventItem => {
            eventItem.addEventListener('click', function(e) {
                e.preventDefault();
                
                const eventDate = this.getAttribute('data-event-date');
                const eventTitle = this.querySelector('h4').textContent;
                
                // Already on events page, show event immediately
                showSpecificEvent(eventDate, eventTitle);
                
                // Track analytics
                if (window.SugarBowlAnalytics) {
                    window.SugarBowlAnalytics.trackCalendarInteraction('upcoming_event_click', eventTitle);
                }
            });
            
            // Add keyboard accessibility
            eventItem.setAttribute('tabindex', '0');
            eventItem.setAttribute('role', 'button');
            eventItem.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }
    
    /**
     * Show specific event modal when navigating from home page
     */
    function showSpecificEvent(eventDate, eventTitle) {
        // Find the day cell for this date
        const dayCells = document.querySelectorAll('.calendar-day');
        
        dayCells.forEach(cell => {
            if (cell.dataset.date === eventDate) {
                // Simulate click on the day to show modal
                cell.click();
                return;
            }
        });
        
        // If day cell not found (different month), navigate to correct month first
        const [year, month, day] = eventDate.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        
        if (window.SugarBowlCalendar && window.SugarBowlCalendar.goToMonth) {
            window.SugarBowlCalendar.goToMonth(month - 1, year);
            
            // Wait for calendar to render, then show the event
            setTimeout(() => {
                const updatedCells = document.querySelectorAll('.calendar-day');
                updatedCells.forEach(cell => {
                    if (cell.dataset.date === eventDate) {
                        cell.click();
                    }
                });
            }, 500);
        }
    }
    
    /**
     * Update today's event on the homepage (legacy function - now calls updateUpcomingEvents)
     */
    function updateTodayEvent() {
        updateUpcomingEvents();
    }
    
    /**
     * Check if a date is today
     * @param {Number} year - The year to check
     * @param {Number} month - The month to check (0-11)
     * @param {Number} day - The day to check
     * @returns {Boolean} True if the date is today
     */
    function isToday(year, month, day) {
        return year === today.getFullYear() && 
               month === today.getMonth() && 
               day === today.getDate();
    }
    
    /**
     * Format a date as YYYY-MM-DD
     * @param {Date} date - The date object
     * @returns {String} Formatted date string
     */
    function formatDateString(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    
    /**
     * Truncate text with ellipsis if too long
     * @param {String} text - The text to truncate
     * @param {Number} maxLength - Maximum length before truncation
     * @returns {String} Truncated text
     */
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    /**
     * Handle image loading errors
     * @param {Element} img - The image element
     */
    function handleImageError(img) {
        img.onerror = function() {
            this.onerror = null;
            this.src = 'img/placeholder.jpg';
        };
    }
    
    /**
     * Debug logging helper
     * @param {String} message - The message to log
     * @param {String} level - The log level (log, warn, error)
     */
    function debugLog(message, level = 'log') {
        if (!CONFIG.debugMode) return;
        
        switch (level) {
            case 'error':
                console.error('[Calendar]', message);
                break;
            case 'warn':
                console.warn('[Calendar]', message);
                break;
            default:
                console.log('[Calendar]', message);
        }
    }
    
    /**
     * Force refresh of calendar data
     */
    function refreshCalendarData() {
        if (CONFIG.syncEnabled) {
            showLoading(true);
            fetchGoogleCalendarEvents();
        } else {
            // Just re-render with local data
            renderCalendar();
            updateTodayEvent();
        }
    }
    
    /**
     * Set up the Google Calendar integration
     * @param {Object} options - Configuration options
     */
    function setupGoogleCalendarIntegration(options) {
        // Override default configuration with provided options
        if (options) {
            Object.assign(CONFIG, options);
        }
        
        if (CONFIG.syncEnabled) {
            loadGoogleApi();
        }
        
        return {
            isEnabled: CONFIG.syncEnabled,
            refresh: refreshCalendarData
        };
    }
    
    // Initialize the calendar when the DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Export public API
    window.SugarBowlCalendar = {
        refresh: refreshCalendarData,
        goToMonth: function(month, year) {
            currentMonth = month;
            currentYear = year;
            renderCalendar();
        },
        goToToday: function() {
            currentMonth = today.getMonth();
            currentYear = today.getFullYear();
            renderCalendar();
            
            // Focus on today's cell
            setTimeout(function() {
                const todayCell = calendarEl.querySelector('.calendar-day.today');
                if (todayCell) todayCell.focus();
            }, 100);
        },
        setupGoogleCalendar: setupGoogleCalendarIntegration,
        getCurrentMonth: function() {
            return {
                month: currentMonth,
                year: currentYear,
                name: monthNames[currentMonth]
            };
        }
    };
})();