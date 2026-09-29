// frontend/js/auth.js
import { api } from './api.js';

export const auth = {
  getToken() {
    return localStorage.getItem('connectly_token');
  },

  getUser() {
    try {
      const userStr = localStorage.getItem('connectly_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    if (token) localStorage.setItem('connectly_token', token);
    if (user) localStorage.setItem('connectly_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('connectly_token');
    localStorage.removeItem('connectly_user');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Route Guard: Ensures user is logged in
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      return false;
    }
    return true;
  },

  // Route Guard: Redirects away from login/register if already logged in
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/index.html';
      window.location.href = redirect;
      return true;
    }
    return false;
  },

  async login(credentials) {
    const res = await api.auth.login(credentials);
    if (res.success && res.data) {
      this.setSession(res.data.token, res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  },

  async register(userData) {
    const res = await api.auth.register(userData);
    if (res.success && res.data) {
      this.setSession(res.data.token, res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  },

  logout() {
    this.clearSession();
    window.location.href = '/login.html';
  },

  async refreshUser() {
    if (!this.isAuthenticated()) return null;
    try {
      const res = await api.auth.getMe();
      if (res.success && res.data) {
        localStorage.setItem('connectly_user', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
    return this.getUser();
  }
};

export default auth;
