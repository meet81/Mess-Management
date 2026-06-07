import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

// Decode JWT payload to extract user ID from 'sub' claim
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

// Enrich user data with ID extracted from JWT token
const enrichUserWithId = (userData) => {
    if (!userData) return null;
    if (userData.id) return userData; // Already has id
    if (userData.token) {
        const payload = parseJwt(userData.token);
        if (payload && payload.sub) {
            return { ...userData, id: parseInt(payload.sub, 10) || payload.sub };
        }
    }
    return userData;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionsLoading, setPermissionsLoading] = useState(false);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            const enriched = enrichUserWithId(parsed);
            setUser(enriched);
            // Update localStorage if we enriched it
            if (enriched !== parsed) {
                localStorage.setItem('user', JSON.stringify(enriched));
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const loadPermissions = async () => {
            if (!user?.token) return;

            try {
                setPermissionsLoading(true);
                const response = await axiosClient.get('/permissions/me');
                setUser(current => {
                    if (!current?.token) return current;
                    const updated = { ...current, permissions: response.data };
                    localStorage.setItem('user', JSON.stringify(updated));
                    return updated;
                });
            } catch {
                logout();
            } finally {
                setPermissionsLoading(false);
            }
        };

        loadPermissions();
    }, [user?.token, user?.role]);

    const login = (userData) => {
        const enriched = enrichUserWithId(userData);
        setUser(enriched);
        localStorage.setItem('user', JSON.stringify(enriched));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    if (loading) return null; // Or a loading spinner

    return (
        <AuthContext.Provider value={{ user, login, logout, permissionsLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
