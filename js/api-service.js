/**
 * API Service for SugarBowl Customer Site
 * Handles public read-only access to burger and menu data using direct HTTP requests
 */

class ApiService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.graphqlEndpoint = 'https://364vw33yefgirm4lhvwegdop4a.appsync-api.us-east-2.amazonaws.com/graphql';
        this.region = 'us-east-2';
    }

    /**
     * Make GraphQL request with AWS IAM authentication
     */
    async makeGraphQLRequest(query, variables = {}) {
        try {
            const response = await fetch(this.graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'your-api-key-here' // We'll need to set this up
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.errors) {
                throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
            }

            return data;
        } catch (error) {
            console.error('GraphQL request failed:', error);
            throw error;
        }
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

        const query = `
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

        try {
            const result = await this.makeGraphQLRequest(query, { id: 'current' });
            let burger = result.data.getBurger;
            
            if (burger && burger.imageKey && !burger.imageUrl) {
                // Build S3 URL for the image
                burger.imageUrl = `https://sugarbowl-admin-imagesc1ae6-dev.s3.us-east-2.amazonaws.com/public/${burger.imageKey}`;
            }

            if (burger) {
                // Cache the result
                this.cache.set(cacheKey, {
                    data: burger,
                    timestamp: Date.now()
                });
            }

            return burger;
        } catch (error) {
            console.error('Error fetching current burger:', error);
            return null;
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

        const query = `
            query ListMenuItems($filter: ModelMenuItemFilterInput, $limit: Int) {
                listMenuItems(filter: $filter, limit: $limit) {
                    items {
                        id
                        name
                        description
                        price
                        category
                        published
                    }
                }
            }
        `;

        const filter = { published: { eq: true } };
        if (category) {
            filter.category = { eq: category };
        }

        try {
            const result = await this.makeGraphQLRequest(query, { 
                filter: filter,
                limit: 100
            });

            const items = result.data.listMenuItems.items || [];

            // Cache the result
            this.cache.set(cacheKey, {
                data: items,
                timestamp: Date.now()
            });

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
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }
}

// Create singleton instance
const apiService = new ApiService();
export default apiService;
