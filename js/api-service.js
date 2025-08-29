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
    console.log('🔍 Making GraphQL Request...');
    console.log('📝 Query:', query);
    console.log('📋 Variables:', variables);
    console.log('🔑 API Key:', this.apiKey);
   
    try {
        const requestBody = JSON.stringify({
            query: query,
            variables: variables
        });
       
        console.log('📦 Request Body:', requestBody);
       
        const response = await fetch(this.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: requestBody
        });

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response OK:', response.ok);

        const responseText = await response.text();
        console.log('📄 Raw Response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            throw new Error(`Invalid JSON response: ${responseText}`);
        }

        console.log('📄 Parsed Response:', data);

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
            const result = await this.makeGraphQLRequest(query, { id: 'current' });
            let burger = result.data.getBurger;
            
            if (burger && burger.imageKey && !burger.imageUrl) {
                burger.imageUrl = `https://sugarbowl-admin-imagesc1ae6-dev.s3.us-east-2.amazonaws.com/public/${burger.imageKey}`;
            }

            if (burger) {
                this.cache.set(cacheKey, { data: burger, timestamp: Date.now() });
            }

            return burger;
        } catch (error) {
            console.error('Error fetching current burger:', error);
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
            const result = await this.makeGraphQLRequest(query, { filter: filter, limit: 100 });
            const items = result.data.listMenuItems.items || [];
            this.cache.set(cacheKey, { data: items, timestamp: Date.now() });
            return items;
        } catch (error) {
            console.error('Error fetching menu items:', error);
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
