/**
 * SugarBowl Menu Module
 * Manages menu data, category tabs, and burger special displays
 * @version 1.0.0
 */
document.addEventListener('DOMContentLoaded', function() {
    // Menu functionality
    const menuContainer = document.getElementById('menu-items');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const burgerSpotlightEl = document.getElementById('burger-spotlight');
    const currentBurgerEl = document.getElementById('current-burger');
    
    // Menu data
    const menuData = {
        appetizers: [
            {
                name: 'Loaded Nachos',
                description: 'Crispy tortilla chips topped with melted cheese, jalapeños, and your choice of chicken or beef. Served with salsa and sour cream.',
                price: 12.99,
                image: 'img/menu/nachos.jpg'
            },
            {
                name: 'Crispy Calamari',
                description: 'Tender calamari lightly breaded and fried to perfection. Served with marinara sauce and lemon aioli.',
                price: 14.99,
                image: 'img/menu/calamari.jpg'
            },
            {
                name: 'Spinach Artichoke Dip',
                description: 'Creamy blend of spinach, artichoke, and melted cheeses. Served with toasted bread and tortilla chips.',
                price: 11.99,
                image: 'img/menu/spinach-dip.jpg'
            },
            {
                name: 'Buffalo Wings',
                description: 'Crispy chicken wings tossed in your choice of sauce: mild, medium, hot, or honey BBQ. Served with celery and blue cheese dressing.',
                price: 13.99,
                image: 'img/menu/wings.jpg'
            }
        ],
        burgers: [
            {
                name: 'Classic SugarBowl Burger',
                description: 'Our signature beef patty with lettuce, tomato, onion, pickles, and special sauce on a brioche bun.',
                price: 15.99,
                image: 'img/menu/classic-burger.jpg'
            },
            {
                name: 'Bacon Blue Cheese Burger',
                description: 'Beef patty topped with crispy bacon, creamy blue cheese, caramelized onions, and arugula.',
                price: 17.99,
                image: 'img/menu/blue-burger.jpg'
            },
            {
                name: 'Mushroom Swiss Burger',
                description: 'Beef patty topped with sautéed mushrooms, Swiss cheese, and truffle aioli.',
                price: 16.99,
                image: 'img/menu/mushroom-burger.jpg'
            },
            {
                name: 'Veggie Burger',
                description: 'House-made black bean and quinoa patty with avocado, sprouts, roasted red pepper, and chipotle mayo.',
                price: 14.99,
                image: 'img/menu/veggie-burger.jpg'
            },
            {
                name: 'BBQ Bourbon Burger',
                description: 'Beef patty glazed with bourbon BBQ sauce, topped with crispy onion straws, cheddar cheese, and bacon.',
                price: 18.99,
                image: 'img/menu/bbq-burger.jpg'
            }
        ],
        mains: [
            {
                name: 'Grilled Atlantic Salmon',
                description: 'Sustainably sourced salmon with lemon herb butter, roasted asparagus, and wild rice pilaf.',
                price: 24.99,
                image: 'img/menu/salmon.jpg'
            },
            {
                name: 'Herb Roasted Chicken',
                description: 'Half chicken seasoned with fresh herbs, served with mashed potatoes and seasonal vegetables.',
                price: 19.99,
                image: 'img/menu/chicken.jpg'
            },
            {
                name: 'Ribeye Steak',
                description: '12oz ribeye grilled to your preference, served with truffle fries and chimichurri sauce.',
                price: 32.99,
                image: 'img/menu/steak.jpg'
            },
            {
                name: 'Pasta Primavera',
                description: 'Fresh linguine tossed with seasonal vegetables, white wine garlic sauce, and parmesan cheese.',
                price: 17.99,
                image: 'img/menu/pasta.jpg'
            },
            {
                name: 'Fish & Chips',
                description: 'Beer-battered cod with house-made tartar sauce, malt vinegar, and crispy fries.',
                price: 18.99,
                image: 'img/menu/fish.jpg'
            }
        ],
        drinks: [
            {
                name: 'Craft Beer Selection',
                description: 'Rotating selection of local and regional craft beers. Ask your server for current offerings.',
                price: 6.99,
                image: 'img/menu/beer.jpg'
            },
            {
                name: 'Signature Cocktails',
                description: 'House-crafted cocktails using premium spirits and fresh ingredients.',
                price: 12.99,
                image: 'img/menu/cocktail.jpg'
            },
            {
                name: 'Wine List',
                description: 'Curated selection of wines by the glass or bottle. See our wine menu for full details.',
                price: 9.99,
                image: 'img/menu/wine.jpg'
            },
            {
                name: 'Milkshakes',
                description: 'Hand-spun milkshakes in classic and creative flavors. Ask about our boozy options!',
                price: 7.99,
                image: 'img/menu/milkshake.jpg'
            },
            {
                name: 'Non-Alcoholic Beverages',
                description: 'Soft drinks, iced tea, coffee, and our house-made lemonades and sodas.',
                price: 3.99,
                image: 'img/menu/soda.jpg'
            }
        ]
    };
    
    // Burger specials (bi-weekly rotation)
    const burgerSpecials = [
        {
            name: 'The Smokehouse',
            description: 'Two beef patties layered with smoked gouda, applewood bacon, crispy onions, and house barbecue sauce on a brioche bun.',
            price: 19.99,
            image: 'img/burgers/burger.jpg',
            ingredients: ['Double beef patties', 'Smoked gouda cheese', 'Applewood smoked bacon', 'Crispy fried onions', 'House BBQ sauce', 'Brioche bun'],
            available: 'June 17 - June 30, 2025'
        },
        {
            name: 'Mediterranean Lamb Burger',
            description: 'Seasoned lamb patty topped with feta cheese, cucumber, red onion, tomato, and tzatziki sauce on a warm pita.',
            price: 18.99,
            image: 'img/burgers/burger.jpg',
            ingredients: ['Seasoned lamb patty', 'Feta cheese crumbles', 'Cucumber slices', 'Red onion', 'Fresh tomato', 'Tzatziki sauce', 'Warm pita bread'],
            available: 'July 1 - July 14, 2025'
        }
    ];
    
    /**
     * Function to render menu items for a category
     * @param {string} category - The menu category to display
     */
    function renderMenuItems(category) {
        // Make sure the container exists
        if (!menuContainer) return;
        
        menuContainer.innerHTML = '';
        
        if (!menuData[category]) {
            menuContainer.innerHTML = '<p>No items found in this category</p>';
            return;
        }
        
        menuData[category].forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item';
            
            // Removed the img element and only show text content
            itemEl.innerHTML = `
                <div class="menu-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <p class="menu-item-price">$${item.price.toFixed(2)}</p>
                </div>
            `;
            
            menuContainer.appendChild(itemEl);
        });
    }
    
    /**
     * Select the current burger special based on date
     * @returns {Object} The current burger special
     */
    function getCurrentBurgerSpecial() {
        // In a real app, we would check dates here
        return burgerSpecials[0];
    }
    
    /**
     * Initialize burger special information
     */
    function initBurgerSpecial() {
        // Get current burger special
        const currentSpecial = getCurrentBurgerSpecial();
        
        // Update burger spotlight on food page
        if (burgerSpotlightEl) {
            burgerSpotlightEl.innerHTML = `
                <h3>BURGER OF THE WEEK</h3>
                <img src="${currentSpecial.image}" alt="${currentSpecial.name}" class="burger-image">
                <h4>${currentSpecial.name}</h4>
                <p class="burger-availability">Available: ${currentSpecial.available}</p>
                <p class="burger-description">${currentSpecial.description}</p>
                <p class="burger-price">$${currentSpecial.price.toFixed(2)}</p>
            `;
        }
        
        // Update current burger for homepage preview
        if (currentBurgerEl) {
            currentBurgerEl.innerHTML = `
                <h4>${currentSpecial.name}</h4>
                <p class="price">$${currentSpecial.price.toFixed(2)}</p>
                <p>${currentSpecial.description.substring(0, 80)}...</p>
            `;
        }
    }
    
    // Set up tab button events
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Render items for selected category
                renderMenuItems(category);
            });
        });
    }
    
    // Initialize with appetizers selected
    renderMenuItems('appetizers');
    
    // Initialize burger special
    initBurgerSpecial();
});
