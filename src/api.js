// BlockMerge API Client

const BASE_URL = 'https://back.roldostudios.com';
const AUTH_TOKEN_KEY = 'blockmerge_auth_token';
const BASIC_AUTH_KEY = 'blockmerge_basic_auth';

// Request helper with intelligent auth dispatching
async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const basicAuth = localStorage.getItem(BASIC_AUTH_KEY);
  const adminToken = localStorage.getItem(AUTH_TOKEN_KEY);

  // Determine auth method if not explicitly provided
  if (!headers['Authorization']) {
    const authType = options.authType || 'auto';

    if (authType === 'bearer') {
      const token = options.token || adminToken;
      if (token && token !== 'live-admin-session-placeholder') {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else if (authType === 'basic') {
      if (basicAuth) {
        headers['Authorization'] = `Basic ${basicAuth}`;
      }
    } else {
      if (basicAuth) {
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (adminToken && adminToken !== 'live-admin-session-placeholder') {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = 'API request failed';
    if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
      errorMessage = errorData.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Handle empty 200/204 responses (like stats/sync or delete)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text().then(text => text ? JSON.parse(text) : { success: true });
}

// Public API Client interface
export const api = {
  BASE_URL,

  // Health check
  async getHealth() {
    return request('/health', { authType: 'none' });
  },

  // Login
  async login(username, password) {
    const basicAuth = btoa(`${username}:${password}`);
    localStorage.setItem(BASIC_AUTH_KEY, basicAuth);
    try {
      // Validate credentials by calling stats endpoint
      await request('/stats/summary', {
        headers: {
          'Authorization': `Basic ${basicAuth}`
        }
      });
      localStorage.setItem(AUTH_TOKEN_KEY, 'live-admin-session-placeholder');
      return {
        user: {
          user_id: "admin_user",
          display_name: username,
          email: `${username}@roldostudios.com`,
          auth_provider: "credentials",
          auth_methods: ["credentials"]
        },
        access_token: 'live-admin-session-placeholder',
        refresh_token: 'live-admin-session-placeholder',
        expires_in: 3600
      };
    } catch (err) {
      localStorage.removeItem(BASIC_AUTH_KEY);
      throw new Error(err.message || 'Invalid credentials. Please check your username and password.');
    }
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(BASIC_AUTH_KEY);
  },

  // Stats
  async getStats() {
    const basicAuth = localStorage.getItem(BASIC_AUTH_KEY);
    if (!basicAuth) {
      throw new Error('Unauthorized: No admin credentials stored. Please log in.');
    }

    return request('/stats/summary', {
      headers: {
        'Authorization': `Basic ${basicAuth}`
      }
    });
  },

  // Force Stats Sync (AdMob + Play Store)
  async syncStats() {
    return request('/stats/sync', {
      method: 'POST',
      authType: 'basic'
    });
  },

  // AdMob Stats with optional date filtering
  async getAdMobStats(params = {}) {
    const query = new URLSearchParams();
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return request(`/stats/admob${qs ? `?${qs}` : ''}`);
  },

  // Play Store Stats with optional date filtering
  async getPlayStoreStats(params = {}) {
    const query = new URLSearchParams();
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return request(`/stats/playstore${qs ? `?${qs}` : ''}`);
  },

  // Users Directory (CRUD) with pagination & search
  async getUsers(params = {}) {
    if (typeof params === 'string') {
      params = { search: params };
    }
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return request(`/backoffice/users${qs ? `?${qs}` : ''}`);
  },

  async createUser(userData) {
    return request('/backoffice/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUserStatus(userId, isActive) {
    return request(`/backoffice/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async updateUserProgression(userId, coins, gems) {
    return request(`/backoffice/users/${userId}/progression`, {
      method: 'PUT',
      body: JSON.stringify({ coins, gems })
    });
  },

  async deleteUser(userId) {
    return request(`/backoffice/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Store Catalog management (Admin)
  async getStoreCatalog() {
    return request('/store/catalog/admin');
  },

  async createStoreSkin(skinData) {
    return request('/backoffice/store/catalog', {
      method: 'POST',
      body: JSON.stringify(skinData)
    });
  },

  async updateStoreSkin(skinId, skinData) {
    return request(`/backoffice/store/catalog/${skinId}`, {
      method: 'PUT',
      body: JSON.stringify(skinData)
    });
  },

  async deleteStoreSkin(skinId) {
    return request(`/store/catalog/${skinId}`, {
      method: 'DELETE'
    });
  },

  getSkinImageUrl(skinId) {
    return `${BASE_URL}/store/catalog/skins/${skinId}/image`;
  },

  async uploadSkinImage(skinId, file) {
    const basicAuth = localStorage.getItem(BASIC_AUTH_KEY);
    const headers = {};
    if (basicAuth) {
      headers['Authorization'] = `Basic ${basicAuth}`;
    }
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/backoffice/store/catalog/${skinId}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to upload skin asset image');
    }

    return response.json();
  },

  // Store Admin Transactions
  async getStoreTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.item_id) query.append('item_id', params.item_id);
    if (params.transaction_type) query.append('transaction_type', params.transaction_type);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    
    return request(`/store/admin/transactions?${query.toString()}`);
  },

  // Operations / Global logs
  async getOperations() {
    const data = await request('/backoffice/operations');
    return data.operations || [];
  },

  // Shop Offers management (Backoffice)
  async listShopOffers() {
    return request('/backoffice/store/offers');
  },

  async createShopOffer(offerData) {
    return request('/backoffice/store/offers', {
      method: 'POST',
      body: JSON.stringify(offerData)
    });
  },

  async getShopOffer(offerId) {
    return request(`/backoffice/store/offers/${offerId}`);
  },

  async updateShopOffer(offerId, offerData) {
    return request(`/backoffice/store/offers/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(offerData)
    });
  },

  async deleteShopOffer(offerId) {
    return request(`/backoffice/store/offers/${offerId}`, {
      method: 'DELETE'
    });
  },

  // Backoffice Analytics
  async getLevelProgressionStats() {
    return request('/backoffice/analytics/levels');
  },

  async getLevelDistribution(params = {}) {
    const query = new URLSearchParams();
    if (params.mode) query.append('mode', params.mode);
    if (params.bin_size) query.append('bin_size', params.bin_size);
    if (params.range_start) query.append('range_start', params.range_start);
    if (params.range_end) query.append('range_end', params.range_end);
    if (params.limit) query.append('limit', params.limit);
    return request(`/backoffice/analytics/levels/distribution?${query.toString()}`);
  },

  async getPlayerRetention() {
    return request('/backoffice/analytics/retention');
  },

  async getHourlyActivity() {
    return request('/backoffice/analytics/hourly-activity');
  }
};
