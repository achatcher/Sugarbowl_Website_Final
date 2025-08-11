/**
 * API Service for SugarBowl Customer Site
 * Handles public read-only access to burger and menu data
 */
import { Amplify } from 'https://cdn.skypack.dev/aws-amplify@6.0.0';
import { generateClient } from 'https://cdn.skypack.dev/aws-amplify@6.0.0/api';
import { getUrl } from 'https://cdn.skypack.dev/aws-amplify@6.0.0/storage';
import awsConfig from './aws-config.js';

// Initialize Amplify with public access configuration
Amplify.configure({
    ...awsConfig,
    aws_appsync_authenticationType: "AWS_IAM"
});

const client = generateClient();

// GraphQL Queries - These should match your backend queries
const GET_BURGER = `
  query GetBurger($id: ID!) {
    getBurger(id: $id) {
      id
      name
      description
      price
      startDate
      endDate
      imageKey
      imageUrl
    }
  }
`;

const LIST_MENU_ITEMS = `
  query ListMenuItems($filter: ModelMenuItemFilterInput, $limit: Int, $nextToken: String) {
    listMenuItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        price
        category
        published
        imageKey
        imageUrl
      }
      nextToken
    }
  }
`;

class ApiService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
 * Get current burger special
 */
async getCurrentBurger() {
    const cacheKey = 'current-burger';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
    }

    try {
        console.log('Fetching current burger special...');
        
        const result = await client.graphql({
            query: GET_BURGER,
            variables: { id: 'current' },
            authMode: 'identityPool'
        });

        let burger = result.data.getBurger;
        
        if (burger) {
            // Get image URL if we have an imageKey but no imageUrl
            if (burger.imageKey && !burger.imageUrl) {
                try {
                    const urlResult = await getUrl({ 
                        path: burger.imageKey,
                        options: {
                            accessLevel: 'public',
                            expiresIn: 3600
                        }
                    });
                    burger.imageUrl = urlResult.url.toString();
                } catch (urlError) {
                    console.warn('Could not resolve burger image URL:', urlError);
                    burger.imageUrl = null; // No fallback image
                }
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: burger,
                timestamp: Date.now()
            });

            console.log('Current burger fetched:', burger);
            return burger;
        }
        
        return null; // No current burger found
    } catch (error) {
        console.error('Error fetching current burger:', error);
        return null; // Return null instead of fallback data
    }
}

    /**
 * Get published menu items by category
 */
async getMenuItems(category = null) {
    const cacheKey = `menu-items-${category || 'all'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
    }

    try {
        console.log('Fetching menu items...', category ? `for category: ${category}` : '');
        
        const filter = {
            published: { eq: true }
        };
        
        if (category) {
            filter.category = { eq: category };
        }

        const result = await client.graphql({
            query: LIST_MENU_ITEMS,
            variables: { 
                filter: filter,
                limit: 100
            },
            authMode: 'identityPool'
        });

        const items = result.data.listMenuItems.items || [];

        // Cache the result
        this.cache.set(cacheKey, {
            data: items,
            timestamp: Date.now()
        });

        console.log(`Menu items fetched: ${items.length} items`);
        return items;
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return [];
    }
}


    /**
     * Get menu items grouped by category
     */
    async getMenuItemsByCategory() {
        const allItems = await this.getMenuItems();
        
        const categories = {
            appetizers: [],
            burgers: [],
            sandwiches: [],
            wraps: [],
            mains: [],
            drinks: []
        };

        allItems.forEach(item => {
            if (categories[item.category]) {
                categories[item.category].push(item);
            }
        });

        return categories;
    }

    /**
     * Clear cache (useful for debugging)
     */
    clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
