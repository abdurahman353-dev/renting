"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/data/apis';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    must_change_password: boolean;
    is_owner?: boolean;
    organization_id?: number | null;
    organization?: {
        id: number;
        name: string;
        slug: string;
        status: string;
        subscription_plan?: string;
    } | null;
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
    isOwner: () => boolean;
    updateUser: (user: User) => void;
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

    // Inactivity timer logic
    useEffect(() => {
        if (!user || loading) return;

        const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log('User inactive for 20 minutes, logging out...');
                logout();
            }, INACTIVITY_TIMEOUT);
        };

        // Events that reset the inactivity timer
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'click'];

        // Initialize timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [user, loading]);

    const checkAuth = () => {
        try {
            const isAuth = authAPI.isAuthenticated();
            if (isAuth) {
                const userData = authAPI.getUser();
                if (userData) {
                    setUser(userData as User);
                }
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
            const response: any = await authAPI.login(email, password);
            const { user: userData, must_change_password } = response;
            const userWithFlag = { ...userData, must_change_password: !!must_change_password };
            setUser(userWithFlag);

            if (userWithFlag.must_change_password) {
                router.replace('/profile?change_password=true');
            } else if (userWithFlag.role === 'super_admin') {
                router.replace('/super-admin');
            } else {
                router.replace('/dashboard');
            }
        } catch (error: any) {
            throw error;
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

    // Check if user is primary organization owner or super admin
    const isOwner = (): boolean => {
        if (!user) return false;
        return user.role === 'super_admin' || user.is_owner === true;
    };

    const updateUser = (userData: User) => {
        authAPI.updateUser(userData);
        setUser(userData);
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
        isOwner,
        updateUser,
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
