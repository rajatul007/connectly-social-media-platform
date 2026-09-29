// frontend/js/api.js
/**
 * Connectly API Client
 * Centralized Fetch API abstraction with automatic JWT handling
 */

const API_BASE = '/api';

export const api = {
  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('connectly_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 401 Unauthorized and not already on login/register, clear token
        if (response.status === 401 && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
          localStorage.removeItem('connectly_token');
          localStorage.removeItem('connectly_user');
        }
        throw new Error(data.message || data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth Endpoints
  auth: {
    register: (userData) => api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    login: (credentials) => api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    getMe: () => api.request('/auth/me')
  },

  // Users Endpoints
  users: {
    getProfile: (userId) => api.request(`/users/${userId}`),
    updateProfile: (userId, updateData) => api.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    }),
    search: (query) => api.request(`/users/search?q=${encodeURIComponent(query)}`),
    getSuggested: () => api.request('/users/suggested'),
    follow: (userId) => api.request(`/users/${userId}/follow`, { method: 'POST' }),
    unfollow: (userId) => api.request(`/users/${userId}/follow`, { method: 'DELETE' }),
    getFollowers: (userId) => api.request(`/users/${userId}/followers`),
    getFollowing: (userId) => api.request(`/users/${userId}/following`)
  },

  // Posts Endpoints
  posts: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/posts${query ? `?${query}` : ''}`);
    },
    getById: (postId) => api.request(`/posts/${postId}`),
    create: (postData) => api.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    }),
    delete: (postId) => api.request(`/posts/${postId}`, {
      method: 'DELETE'
    }),
    like: (postId) => api.request(`/posts/${postId}/like`, {
      method: 'POST'
    }),
    unlike: (postId) => api.request(`/posts/${postId}/like`, {
      method: 'DELETE'
    })
  },

  // Comments Endpoints
  comments: {
    getByPost: (postId) => api.request(`/posts/${postId}/comments`),
    create: (postId, text) => api.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),
    delete: (commentId) => api.request(`/comments/${commentId}`, {
      method: 'DELETE'
    })
  },

  // Utility
  seed: () => api.request('/seed', { method: 'POST' })
};

export default api;
