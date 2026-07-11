// BlockMerge API Client

const BASE_URL = 'https://back.roldostudios.com';
const AUTH_TOKEN_KEY = 'blockmerge_auth_token';

// Request helper
async function request(endpoint, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const basicAuth = localStorage.getItem('blockmerge_basic_auth');
  if (basicAuth && !headers['Authorization']) {
    headers['Authorization'] = `Basic ${basicAuth}`;
  } else if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || 'API request failed');
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// Public API Client interface
export const api = {
  // Login
  async login(username, password) {
    const basicAuth = btoa(`${username}:${password}`);
    localStorage.setItem('blockmerge_basic_auth', basicAuth);
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
      localStorage.removeItem('blockmerge_basic_auth');
      throw new Error(err.message || 'Invalid credentials. Please check your username and password.');
    }
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('blockmerge_basic_auth');
  },

  // Stats
  async getStats() {
    const basicAuth = localStorage.getItem('blockmerge_basic_auth');
    if (!basicAuth) {
      throw new Error('Unauthorized: No admin credentials stored. Please log in.');
    }

    return request('/stats/summary', {
      headers: {
        'Authorization': `Basic ${basicAuth}`
      }
    });
  },

  // AdMob Stats
  async getAdMobStats() {
    return request('/stats/admob');
  },

  // Play Store Stats
  async getPlayStoreStats() {
    return request('/stats/playstore');
  },

  // Users Directory (CRUD)
  async getUsers(search = '') {
    return request(`/backoffice/users?search=${encodeURIComponent(search)}`);
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
    return request('/store/catalog', {
      method: 'POST',
      body: JSON.stringify(skinData)
    });
  },

  async updateStoreSkin(skinId, skinData) {
    return request(`/store/catalog/${skinId}`, {
      method: 'PUT',
      body: JSON.stringify(skinData)
    });
  },

  async deleteStoreSkin(skinId) {
    return request(`/store/catalog/${skinId}`, {
      method: 'DELETE'
    });
  },

  async uploadSkinImage(skinId, file) {
    const basicAuth = localStorage.getItem('blockmerge_basic_auth');
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
  }
};
