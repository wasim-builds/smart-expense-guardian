import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 expects username
      formData.append('password', password);

      const res = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      setToken(res.data.access_token);
      toast.success('Access Granted', { icon: '🔐' });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
      return false;
    }
  };

  const register = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
      setToken(res.data.access_token);
      toast.success('Secure Vault Initialized', { icon: '🛡️' });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Initialization failed');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
  };

  const value = {
    token,
    isAuthenticated,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
