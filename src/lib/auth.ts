import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    // Add other fields as needed
}

export interface LoginResponse {
    token: string;
    user: AdminUser;
}

export const auth = {
    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            const response = await axios.post(`${API_URL}/api/admin/login`, {
                email,
                password,
            });

            const { token, user } = response.data;

            // Store token in cookie (expires in 7 days)
            Cookies.set('admin_token', token, { expires: 7, secure: true, sameSite: 'strict' });

            // Store user info in localStorage for easy access
            localStorage.setItem('admin_user', JSON.stringify(user));

            return { token, user };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    logout() {
        Cookies.remove('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
    },

    getToken() {
        return Cookies.get('admin_token');
    },

    getUser(): AdminUser | null {
        const userStr = localStorage.getItem('admin_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!Cookies.get('admin_token');
    }
};
