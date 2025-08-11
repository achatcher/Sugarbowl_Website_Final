/**
 * API Service for SugarBowl Customer Site
 * Handles public read-only access to burger and menu data
 */

// We'll load AWS Amplify via script tag instead of ES6 imports
// Add this script tag to your HTML head section first

class ApiService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        // Wait for AWS Amplify to be available globally
        if (typeof window.aws_amplify === 'undefined') {
            throw new Error('AWS Amplify not loaded');
        }

        const awsConfig = {
            "aws_project_region": "us-east-2",
            "aws_cognito_identity_pool_id": "us-east-2:099c5276-e823-4b19-868a-20f62c653782",
            "aws_cognito_region": "us-east-2",
            "aws_appsync_graphqlEndpoint": "https://364vw33yefgirm4lhvwegdop4a.appsync-api.us-east-2.amazonaws.com/graphql",
            "aws_appsync_region": "us-east-2",
            "aws_appsync_authenticationType": "AWS_IAM",
            "aws_user_files_s3_bucket": "sugarbowl-admin-imagesc1ae6-dev",
            "aws_user_files_s3_bucket_region": "us-east-2"
        };

        window.aws_amplify.Amplify.configure(awsConfig);
        this.client = window.aws_amplify.API.generateClient();
        this.initialized = true;
    }

    // GraphQL Queries
    GET_BURGER = `
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

    LIST_MENU_ITEMS = `
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

    /**
     * Get current burger special
     */
    async getCurrentBurger() {
        await this.initialize();
        
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
            
            const result = await this.client.graphql({
                query: this.GET_BURGER,
                variables: { id: 'current' },
                authMode: 'identityPool'
            });

            let burger = result.data.getBurger;
            
            if (burger) {
                // Get image URL if we have an imageKey but no imageUrl
                if (burger.imageKey && !burger.imageUrl) {
                    try {
                        const urlResult = await window.aws_amplify.Storage.getUrl({ 
                            path: burger.imageKey,
                            options: {
                                accessLevel: 'public',
                                expiresIn: 3600
                            }
                        });
                        burger.imageUrl = urlResult.url.toString();
                    } catch (urlError) {
                        console.warn('Could not resolve burger image URL:', urlError);
                        burger.imageUrl = null;
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
            
            return null;
        } catch (error) {
            console.error('Error fetching current burger:', error);
            return null;
        }
    }

    /**
     * Get published menu items by category
     */
    async getMenuItems(category = null) {
        await this.initialize();
        
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

            const result = await this.client.graphql({
                query: this.LIST_MENU_ITEMS,
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

// Make it available globally
window.SugarBowlAPI = apiService;

export default apiService;
