/**
 * API Service for SugarBowl Customer Site
 * Simple HTTP requests with API key authentication
 */

class ApiService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; 
        this.graphqlEndpoint = 'https://364vw33yefgirm4lhvwegdop4a.appsync-api.us-east-2.amazonaws.com/graphql';
        this.apiKey = 'da2-5rhu27fnxvamrkkd4cewihkjki'; 
    }

    async makeGraphQLRequest(query, variables = {}) {
        try {
            const requestBody = JSON.stringify({
                query: query,
                variables: variables
            });
           
            const response = await fetch(this.graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: requestBody
            });

            const responseText = await response.text();
            let data;
            
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            if (data.errors) {
                console.error('❌ GraphQL Errors:', data.errors);
                throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
            }
           
            return data;
        } catch (error) {
            console.error('💥 Request Failed:', error);
            throw error;
        }
    }

    async getCurrentBurger() {
        const cacheKey = 'current-burger';
        
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
            const result = await window.SugarBowlErrorHandler.retryOperation(
                () => this.makeGraphQLRequest(query, { id: 'current' }),
                'getCurrentBurger'
            );
            
            let burger = result.data.getBurger;
            
            // NOTE: We no longer hardcode the S3 URL here. 
            // The menu.js module uses SugarBowlConfig.aws.publicUrl + imageKey 
            // to build a permanent link. This keeps this service focused on data fetching.

            if (burger) {
                this.cache.set(cacheKey, { data: burger, timestamp: Date.now() });
            }

            return burger;
        } catch (error) {
            if (window.SugarBowlErrorHandler) {
                const errorInfo = window.SugarBowlErrorHandler.handleNetworkError(error, 'getCurrentBurger');
                console.error('Error fetching current burger:', errorInfo);
            } else {
                console.error('Error fetching current burger:', error);
            }
            return null;
        }
    }

    async getMenuItems(category = null) {
        const cacheKey = `menu-items-${category || 'all'}`;
        
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
            const result = await window.SugarBowlErrorHandler.retryOperation(
                () => this.makeGraphQLRequest(query, { filter: filter, limit: 100 }),
                'getMenuItems'
            );
            
            const items = result.data.listMenuItems.items || [];
            this.cache.set(cacheKey, { data: items, timestamp: Date.now() });
            return items;
        } catch (error) {
            if (window.SugarBowlErrorHandler) {
                const errorInfo = window.SugarBowlErrorHandler.handleNetworkError(error, 'getMenuItems');
                console.error('Error fetching menu items:', errorInfo);
            } else {
                console.error('Error fetching menu items:', error);
            }
            return [];
        }
    }

    async getMenuItemsByCategory() {
        const allItems = await this.getMenuItems();
        
        return {
            appetizers: allItems.filter(item => item.category === 'appetizers'),
            burgers: allItems.filter(item => item.category === 'burgers'),
            sandwiches: allItems.filter(item => item.category === 'sandwiches'),
            wraps: allItems.filter(item => item.category === 'wraps')
        };
    }

    clearCache() {
        this.cache.clear();
    }
}

const apiService = new ApiService();
export default apiService;