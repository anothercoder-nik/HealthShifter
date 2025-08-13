"use client";
import { useState, useEffect } from 'react';

// Simple state store without Context
class AuthStore {
  constructor() {
    this.listeners = [];
    this.state = {
      user: null,
      loading: true,
      initialized: false
    };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  async fetchUser() {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (response.ok) {
        const userData = await response.json();
        this.setState({ user: userData, loading: false, initialized: true });
        return;
      }
    } catch (e) {
      console.warn('fetchUser failed', e);
    }
    this.setState({ user: null, loading: false, initialized: true });
  }

  login() {
    window.location.href = '/api/auth/login';
  }

  async logout({ sso } = {}) {
    this.setState({ user: null });
    window.location.href = sso ? '/api/auth/logout?sso=1' : '/api/auth/logout';
  }

  isManager() { return this.state.user?.roles?.includes('manager') || false; }
  isEmployee() { return this.state.user?.roles?.includes('employee') || false; }
}

// Global store instance
const authStore = new AuthStore();

// Hook to use the store
export function useAuth() {
  const [state, setState] = useState(authStore.state);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(setState);
    
    // Initialize on first mount
    if (!authStore.state.initialized) {
      authStore.fetchUser();
    }

    return unsubscribe;
  }, []);

  return {
    ...state,
    login: () => authStore.login(),
  logout: (opts) => authStore.logout(opts),
  fullLogout: () => authStore.logout({ sso: true }),
    refreshUser: () => authStore.fetchUser(),
    isManager: () => authStore.isManager(),
    isEmployee: () => authStore.isEmployee()
  };
}
