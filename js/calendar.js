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
        
        // Load events from Google Calendar if enabled
        if (CONFIG.syncEnabled) {
            loadGoogleApi();
        } else {
            // Use local events
            if (CONFIG.useLocalEvents) {
                events = JSON.parse(JSON.stringify(localEvents)); // Clone local events
                renderCalendar();
                updateTodayEvent();
            }
        }
        
        // Render the calendar with whatever data we have
        renderCalendar();
        updateTodayEvent();
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
        
        // Calculate time ranges (3 months before and after current month)
        const timeMin = new Date(currentYear, currentMonth - 3, 1).toISOString();
        const timeMax = new Date(currentYear, currentMonth + 4, 0).toISOString();
        
        gapi.client.calendar.events.list({
            calendarId: CONFIG.googleCalendarId,
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: CONFIG.maxResults,
            singleEvents: true,
            orderBy: 'startTime'
        }).then(processCalendarEvents).catch(handleApiError);
    }
    
    /**
     * Process the calendar events from Google Calendar
     * @param {Object} response - The response from Google Calendar API
     */
    function processCalendarEvents(response) {
        debugLog('Processing calendar events');
        const items = response.result.items;
        
        // Convert Google Calendar events to our format
        events = {};
        
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
        
        // Fall back to local events
        if (CONFIG.useLocalEvents) {
            events = JSON.parse(JSON.stringify(localEvents)); // Clone local events
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
        
        // Fall back to local events
        if (CONFIG.useLocalEvents) {
            events = JSON.parse(JSON.stringify(localEvents)); // Clone local events
            renderCalendar();
            updateTodayEvent();
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
     * Update today's event on the homepage
     */
    function updateTodayEvent() {
        const todayEvent = document.getElementById('today-event');
        if (!todayEvent) return;
        
        const todayString = formatDateString(today);
        
        if (events[todayString] && events[todayString].length > 0) {
            // Get first event or featured event if available
            const featuredEvent = events[todayString].find(e => e.featured) || events[todayString][0];
            
            // Format event display
            const eventHtml = `
                <h2>${featuredEvent.title}</h2>
                <div class="event-time">
                    <i class="far fa-clock" aria-hidden="true"></i> 
                    ${featuredEvent.time}
                </div>
                <p>${truncateText(featuredEvent.description, 80)}</p>
                <button class="btn view-all-events-btn">VIEW ALL EVENTS</button>
            `;
            
            // Update with proper error handling
            try {
                todayEvent.innerHTML = eventHtml;
            } catch (e) {
                debugLog('Error updating today\'s event: ' + e.message, 'error');
                todayEvent.innerHTML = '<p>Error loading event information</p>';
            }
        } else {
            todayEvent.innerHTML = `
                <p>No scheduled events today</p>
                <button class="btn view-all-events-btn">VIEW ALL EVENTS</button>
            `;
        }
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