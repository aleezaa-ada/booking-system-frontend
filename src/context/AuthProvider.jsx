import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AuthContext from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.get('auth/users/me/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await api.post('auth/token/login/', {
        username,
        password,
      });
      const newToken = response.data.auth_token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      const userResponse = await api.get('auth/users/me/');
      setUser(userResponse.data);
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('auth/users/', { username, email, password });
      return { success: true };
    } catch (error) {
      console.error(
        'Registration failed:',
        error.response?.data || error.message
      );

      const errorData = error.response?.data || {};
      let errorMessage = '';

      if (errorData.email) {
        errorMessage = Array.isArray(errorData.email)
          ? errorData.email[0]
          : errorData.email;
      } else if (errorData.username) {
        errorMessage = Array.isArray(errorData.username)
          ? errorData.username[0]
          : errorData.username;
      } else if (errorData.password) {
        errorMessage = Array.isArray(errorData.password)
          ? errorData.password[0]
          : errorData.password;
      } else if (errorData.non_field_errors) {
        errorMessage = Array.isArray(errorData.non_field_errors)
          ? errorData.non_field_errors[0]
          : errorData.non_field_errors;
      } else {
        errorMessage =
          'Registration failed. Please check your information and try again.';
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
