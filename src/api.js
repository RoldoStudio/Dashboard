// BlockMerge API Client

const BASE_URL = 'https://back.roldostudios.com';

// Local storage keys
const MOCK_STORAGE_KEY = 'blockmerge_mock_db';
const LIVE_MODE_KEY = 'blockmerge_live_mode';
const AUTH_TOKEN_KEY = 'blockmerge_auth_token';

// Helper to check if we are in live mode
export function isLiveMode() {
  return localStorage.getItem(LIVE_MODE_KEY) === 'true';
}

export function setLiveMode(value) {
  localStorage.setItem(LIVE_MODE_KEY, value ? 'true' : 'false');
}

// Initial Mock Database setup
const INITIAL_MOCK_DB = {
  stats: {
    total_players: 2450,
    active_players_24h: 310,
    active_players_7d: 890,
    active_players_30d: 1820,
    guest_to_oauth_conversion_rate: 68.5,
    level_distribution: {
      "Level 1": 1100,
      "Level 2": 620,
      "Level 3": 410,
      "Level 4": 220,
      "Level 5": 100,
      "Level 50": 85,
      "Level 100": 70,
      "Level 500": 45,
      "Level 1000": 30,
      "Level 5000": 15,
      "Level 12000": 3
    },
    retention_rate: {
      "d1": 42.5,
      "d7": 18.2,
      "d30": 6.8
    },
    active_players_hourly: [
      { "hour": 0, "active_players": 120 },
      { "hour": 1, "active_players": 90 },
      { "hour": 2, "active_players": 70 },
      { "hour": 3, "active_players": 55 },
      { "hour": 4, "active_players": 40 },
      { "hour": 5, "active_players": 45 },
      { "hour": 6, "active_players": 65 },
      { "hour": 7, "active_players": 110 },
      { "hour": 8, "active_players": 180 },
      { "hour": 9, "active_players": 220 },
      { "hour": 10, "active_players": 250 },
      { "hour": 11, "active_players": 280 },
      { "hour": 12, "active_players": 310 },
      { "hour": 13, "active_players": 290 },
      { "hour": 14, "active_players": 270 },
      { "hour": 15, "active_players": 285 },
      { "hour": 16, "active_players": 320 },
      { "hour": 17, "active_players": 360 },
      { "hour": 18, "active_players": 410 },
      { "hour": 19, "active_players": 440 },
      { "hour": 20, "active_players": 450 },
      { "hour": 21, "active_players": 390 },
      { "hour": 22, "active_players": 310 },
      { "hour": 23, "active_players": 200 }
    ]
  },
  users: [
    {
      user_id: "user_a1b2c3",
      email: "alex@blockmerge.io",
      display_name: "Alex Mercer",
      auth_provider: "google",
      created_at: "2026-05-10T12:00:00Z",
      last_login: "2026-06-26T09:45:00Z",
      is_active: true,
      progression: {
        coins: 4800,
        gems: 120,
        total_games_played: 68,
        total_blocks_merged: 2450,
        total_playtime: 14200,
        passed_levels_count: 5
      }
    },
    {
      user_id: "user_x9y8z7",
      email: "sarah.connor@sky.net",
      display_name: "Sarah Connor",
      auth_provider: "guest",
      created_at: "2026-06-01T14:30:00Z",
      last_login: "2026-06-25T18:22:00Z",
      is_active: true,
      progression: {
        coins: 1200,
        gems: 15,
        total_games_played: 14,
        total_blocks_merged: 420,
        total_playtime: 3200,
        passed_levels_count: 2
      }
    },
    {
      user_id: "user_q5w6e7",
      email: "neo@matrix.org",
      display_name: "The One",
      auth_provider: "apple",
      created_at: "2026-06-15T08:15:00Z",
      last_login: "2026-06-26T02:11:00Z",
      is_active: false,
      progression: {
        coins: 99999,
        gems: 888,
        total_games_played: 142,
        total_blocks_merged: 9999,
        total_playtime: 86400,
        passed_levels_count: 5
      }
    }
  ],
  operations: [
    {
      id: 1,
      user_id: "user_a1b2c3",
      transaction_type: "PURCHASE",
      currency_type: "COINS",
      amount: -500,
      balance_after: 4800,
      item_id: "neon_skin_01",
      timestamp: "2026-06-26T08:30:00Z"
    },
    {
      id: 2,
      user_id: "user_x9y8z7",
      transaction_type: "REWARD",
      currency_type: "GEMS",
      amount: 5,
      balance_after: 15,
      item_id: "level_2_clear",
      timestamp: "2026-06-25T18:20:00Z"
    },
    {
      id: 3,
      user_id: "user_q5w6e7",
      transaction_type: "ADJUSTMENT",
      currency_type: "COINS",
      amount: 50000,
      balance_after: 99999,
      item_id: "admin_gift",
      timestamp: "2026-06-26T02:00:00Z"
    }
  ]
};

// Initialize DB if not present or outdated
const existingDbStr = localStorage.getItem(MOCK_STORAGE_KEY);
let dbNeedsReset = !existingDbStr;
if (existingDbStr) {
  try {
    const existing = JSON.parse(existingDbStr);
    if (!existing.stats || !existing.stats.retention_rate || !existing.stats.active_players_hourly || !existing.stats.level_distribution["Level 12000"]) {
      dbNeedsReset = true;
    }
  } catch (e) {
    dbNeedsReset = true;
  }
}
if (dbNeedsReset) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DB));
}

function getMockDB() {
  return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY));
}

function saveMockDB(db) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
}

// Request helper
async function request(endpoint, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (isLiveMode()) {
    const basicAuth = localStorage.getItem('blockmerge_basic_auth');
    if (basicAuth && !headers['Authorization']) {
      headers['Authorization'] = `Basic ${basicAuth}`;
    }
  } else {
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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
    if (!isLiveMode()) {
      // Mock login check: accept any username 'admin' and password 'admin', or mock validation
      if (username === 'admin' && password === 'admin') {
        localStorage.setItem(AUTH_TOKEN_KEY, 'mock-jwt-token-xyz');
        return {
          user: {
            user_id: "admin_user",
            display_name: "Administrator",
            email: "admin@roldostudios.com",
            auth_provider: "credentials",
            auth_methods: ["credentials"]
          },
          access_token: 'mock-jwt-token-xyz',
          refresh_token: 'mock-refresh-token-abc',
          expires_in: 3600
        };
      }
      throw new Error('Invalid username or password. (Use admin / admin for mock mode)');
    }

    // Live mode auth
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
      throw new Error(err.message || 'Invalid Live credentials. Please check your username and password.');
    }
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('blockmerge_basic_auth');
  },

  // Stats
  async getStats() {
    if (!isLiveMode()) {
      const db = getMockDB();
      return db.stats;
    }

    // Retrieve active Basic Auth string stored during login session
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

  // Users Directory (CRUD)
  async getUsers(search = '') {
    if (!isLiveMode()) {
      const db = getMockDB();
      let users = db.users;
      if (search) {
        const term = search.toLowerCase();
        users = users.filter(u => 
          u.display_name?.toLowerCase().includes(term) || 
          u.email?.toLowerCase().includes(term) ||
          u.user_id.toLowerCase().includes(term)
        );
      }
      return { users, total_count: users.length };
    }

    // Live backoffice route
    return request(`/backoffice/users?search=${encodeURIComponent(search)}`);
  },

  async createUser(userData) {
    if (!isLiveMode()) {
      const db = getMockDB();
      const newUser = {
        user_id: 'user_' + Math.random().toString(36).substr(2, 6),
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_active: true,
        progression: {
          coins: parseInt(userData.coins || 0),
          gems: parseInt(userData.gems || 0),
          total_games_played: 0,
          total_blocks_merged: 0,
          total_playtime: 0,
          passed_levels_count: 0
        },
        ...userData
      };
      db.users.unshift(newUser);
      saveMockDB(db);
      return newUser;
    }

    return request('/backoffice/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUserStatus(userId, isActive) {
    if (!isLiveMode()) {
      const db = getMockDB();
      const user = db.users.find(u => u.user_id === userId);
      if (user) {
        user.is_active = isActive;
        saveMockDB(db);
        
        // Log action
        this.logOperation({
          user_id: userId,
          transaction_type: 'ADJUSTMENT',
          currency_type: 'COINS',
          amount: 0,
          balance_after: user.progression.coins,
          item_id: `Account ${isActive ? 'Activated' : 'Suspended'}`
        });

        return { success: true, user_id: userId, is_active: isActive };
      }
      throw new Error('User not found');
    }

    return request(`/backoffice/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async updateUserProgression(userId, coins, gems) {
    if (!isLiveMode()) {
      const db = getMockDB();
      const user = db.users.find(u => u.user_id === userId);
      if (user) {
        const oldCoins = user.progression.coins;
        const oldGems = user.progression.gems;
        
        user.progression.coins = parseInt(coins);
        user.progression.gems = parseInt(gems);
        saveMockDB(db);

        // Log transaction history
        if (oldCoins !== user.progression.coins) {
          this.logOperation({
            user_id: userId,
            transaction_type: 'ADJUSTMENT',
            currency_type: 'COINS',
            amount: user.progression.coins - oldCoins,
            balance_after: user.progression.coins,
            item_id: 'admin_balance_adjustment'
          });
        }
        if (oldGems !== user.progression.gems) {
          this.logOperation({
            user_id: userId,
            transaction_type: 'ADJUSTMENT',
            currency_type: 'GEMS',
            amount: user.progression.gems - oldGems,
            balance_after: user.progression.gems,
            item_id: 'admin_balance_adjustment'
          });
        }

        return { success: true, user_id: userId, updated_progression: user.progression };
      }
      throw new Error('User not found');
    }

    return request(`/backoffice/users/${userId}/progression`, {
      method: 'PUT',
      body: JSON.stringify({ coins, gems })
    });
  },

  async deleteUser(userId) {
    if (!isLiveMode()) {
      const db = getMockDB();
      db.users = db.users.filter(u => u.user_id !== userId);
      saveMockDB(db);
      return { success: true };
    }

    return request(`/backoffice/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Operations / Global logs
  async getOperations() {
    if (!isLiveMode()) {
      const db = getMockDB();
      return db.operations;
    }

    const data = await request('/backoffice/operations');
    return data.operations || [];
  },

  // Helper helper to write operation logs locally
  logOperation(logEntry) {
    const db = getMockDB();
    const newLog = {
      id: db.operations.length + 1,
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    db.operations.unshift(newLog);
    saveMockDB(db);
  }
};
