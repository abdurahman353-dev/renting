"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/data/apis';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    hasRole: (roles: string | string[]) => boolean;
    isAdmin: () => boolean;
    isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        try {
            const isAuth = authAPI.isAuthenticated();
            if (isAuth) {
                const userData = authAPI.getUser();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { user: userData } = await authAPI.login(email, password);
            setUser(userData);

            // Use replace instead of push to prevent back navigation
            router.replace('/dashboard');

            // Clear browser history to prevent back button
            if (typeof window !== 'undefined') {
                window.history.pushState(null, '', window.location.href);
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await authAPI.logout();
            setUser(null);
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check if user has specific role(s)
    const hasRole = (roles: string | string[]): boolean => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    };

    // Check if user is admin
    const isAdmin = (): boolean => {
        return hasRole('admin');
    };

    // Check if user is super admin
    const isSuperAdmin = (): boolean => {
        return hasRole('super_admin');
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        isAdmin,
        isSuperAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
