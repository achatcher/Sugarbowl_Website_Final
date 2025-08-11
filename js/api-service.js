/**
 * API Service for SugarBowl Customer Site
 * Handles public read-only access to burger and menu data
 */

// AWS Configuration (same as your admin app)
const awsConfig = {
    "aws_project_region": "us-east-2",
    "aws_cognito_identity_pool_id": "us-east-2:099c5276-e823-4b19-868a-20f62c653782",
    "aws_cognito_region": "us-east-2",
    "aws_user_pools_id": "us-east-2_xMgT5StJT",
    "aws_user_pools_web_client_id": "2lvk66oh9p517qt6fkd7tdcm64",
    "oauth": {},
    "aws_cognito_username_attributes": [],
    "aws_cognito_social_providers": [],
    "aws_cognito_signup_attributes": ["EMAIL"],
    "aws_cognito_mfa_configuration": "OFF",
    "aws_cognito_mfa_types": ["SMS"],
    "aws_cognito_password_protection_settings": {
        "passwordPolicyMinLength": 8,
        "passwordPolicyCharacters": []
    },
    "aws_cognito_verification_mechanisms": ["EMAIL"],
    "aws_user_files_s3_bucket": "sugarbowl-admin-imagesc1ae6-dev",
    "aws_user_files_s3_bucket_region": "us-east-2",
    "aws_appsync_graphqlEndpoint": "https://364vw33yefgirm4lhvwegdop4a.appsync-api.us-east-2.amazonaws.com/graphql",
    "aws_appsync_region": "us-east-2",
    "aws_appsync_authenticationType": "AWS_IAM"
};

class ApiService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        // Wait for Amplify to be available
        while (!window.aws_amplify_core) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Configure Amplify
        window.aws_amplify_core.Amplify.configure(awsConfig);
        this.initialized = true;
        console.log('AWS Amplify initialized successfully');
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
            
            const result = await window.aws_amplify_api_graphql.GraphQLAPI.graphql({
                query: this.GET_BURGER,
                variables: { id: 'current' },
                authMode: 'AWS_IAM'
            });

            let burger = result.data.getBurger;
            
            if (burger) {
                // Get image URL if we have an imageKey but no imageUrl
                if (burger.imageKey && !burger.imageUrl) {
                    try {
                        // Build S3 URL directly for public access
                        burger.imageUrl = `https://${awsConfig.aws_user_files_s3_bucket}.s3.${awsConfig.aws_user_files_s3_bucket_region}.amazonaws.com/public/${burger.imageKey}`;
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

            const result = await window.aws_amplify_api_graphql.GraphQLAPI.graphql({
                query: this.LIST_MENU_ITEMS,
                variables: { 
                    filter: filter,
                    limit: 100
                },
                authMode: 'AWS_IAM'
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
