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
                    console.error("Failed to fetch user data:", error);
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
            const response = await api.post('auth/token/login/', { username, password });
            const newToken = response.data.auth_token;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            const userResponse = await api.get('auth/users/me/');
            setUser(userResponse.data);
            return true;
        } catch (error) {
            console.error("Login failed:", error.response?.data || error.message);
            return false;
        }
    };

    const register = async (username, email, password) => {
        try {
            await api.post('auth/users/', { username, email, password });
            return true;
        } catch (error) {
            console.error("Registration failed:", error.response?.data || error.message);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};