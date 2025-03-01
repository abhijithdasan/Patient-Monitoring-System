import React, { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      
      // Set authorization header for API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${JSON.parse(storedUser).token}`;
    }
    setLoading(false);
  }, []);
  
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/api/v1/auth/login', { email, password });
      
      const userData = response.data;
      setUser(userData);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set authorization header for future API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    // Remove user from state
    setUser(null);
    
    // Remove from localStorage
    localStorage.removeItem('user');
    
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
    
    toast.info('You have been logged out');
  };
  
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/api/v1/users/', userData);
      toast.success('Registration successful! Please log in.');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};