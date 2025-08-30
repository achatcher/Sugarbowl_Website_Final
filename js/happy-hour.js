// Dynamic Happy Hour Specials
class HappyHourSpecials {
    constructor() {
        this.specials = {
            0: { // Sunday
                day: 'Sunday',
                status: 'closed',
                message: 'We\'re closed on Sundays. Come back tomorrow!'
            },
            1: { // Monday  
                day: 'Monday',
                status: 'closed',
                message: 'We\'re closed on Mondays. See you Tuesday!'
            },
            2: { // Tuesday
                day: 'Tuesday',
                status: 'open',
                items: [
                    '$2.00 off appetizers',
                    '$1.50 10oz domestic drafts', 
                    '$3.00 well drinks'
                ]
            },
            3: { // Wednesday
                day: 'Wednesday', 
                status: 'open',
                items: [
                    '$2.00 off appetizers',
                    '$2.50 tallboys (PBR, Old Style, High Life)',
                    '$3.00 Malort Shots'
                ]
            },
            4: { // Thursday
                day: 'Thursday',
                status: 'open', 
                items: [
                    '$2.00 off appetizers',
                    '$1.50 10oz domestic drafts',
                    '$3.00 well drinks',
                    '$3.00 atomic bomb shots'
                ]
            },
            5: { // Friday
                day: 'Friday',
                status: 'open',
                items: [
                    '$4.00 craft beers',
                    '$2.00 pints of Hamms', 
                    '$3.00 Jameson Shots'
                ]
            },
            6: { // Saturday
                day: 'Saturday',
                status: 'open',
                items: [
                    '$3.00 Jager Shots',
                    '$3.00 Malort Shots', 
                    '$4.00 Pint of Two Hearted'
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        this.updateHappyHourDisplay();
        // Update every hour in case day changes while page is open
        setInterval(() => this.updateHappyHourDisplay(), 3600000);
    }
    
    getTodaySpecials() {
        const today = new Date().getDay();
        return this.specials[today];
    }
    
    updateHappyHourDisplay() {
        // Target the correct container - look for the info section happy hour card
        const container = document.querySelector('#info .info-card:nth-child(2)');
        if (!container) return;
        
        const todaySpecials = this.getTodaySpecials();
        
        // Create the updated HTML - preserve the existing structure
        const happyHourHTML = `
            <h3>Happy Hour</h3>
            <div class="happy-hour">Tuesday - Saturday<br>3:00 PM - 6:00 PM</div>
            <div class="happy-hour-schedule">Check out our daily drink specials!</div>
            
            <div class="todays-specials">
                <div class="day-indicator">${todaySpecials.day}</div>
                <h4>Today's Specials</h4>
                ${this.renderSpecials(todaySpecials)}
            </div>
        `;
        
        container.innerHTML = happyHourHTML;
    }
    
    renderSpecials(dayData) {
        if (dayData.status === 'closed') {
            return `<div class="closed-notice">${dayData.message}</div>`;
        }
        
        const specialsList = dayData.items.map(item => `<li>${item}</li>`).join('');
        return `<ul class="specials-list">${specialsList}</ul>`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new HappyHourSpecials();
});
