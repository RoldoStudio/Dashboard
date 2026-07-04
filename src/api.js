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

  // Operations / Global logs
  async getOperations() {
    const data = await request('/backoffice/operations');
    return data.operations || [];
  }
};
