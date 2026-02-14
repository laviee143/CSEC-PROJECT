import { User } from '../types';
import { apiRequest } from './apiClient';

interface AuthPayload {
    user: User;
    token: string;
}

interface AuthResponse {
    success: boolean;
    message?: string;
    data: AuthPayload;
}

interface CurrentUserResponse {
    success: boolean;
    message?: string;
    data: {
        user: User;
    };
}

class AuthService {
    private token: string | null = localStorage.getItem('token');

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getToken() {
        return this.token;
    }

    async apiCall<T>(endpoint: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: string | FormData; headers?: HeadersInit } = {}) {
        return apiRequest<T>(endpoint, {
            ...options,
            token: this.token
        });
    }

    async signup(signupData: any) {
        try {
            console.debug('[authService] signup', signupData.email || signupData);
            const data = await this.apiCall<AuthResponse>('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(signupData)
            });

            if (data?.data?.token) {
                this.setToken(data.data.token);
            }

            return data.data;
        } catch (err) {
            console.error('[authService] signup error', err);
            throw err;
        }
    }

    async login(credentials: any) {
        try {
            console.debug('[authService] login', credentials.email || credentials);
            const data = await this.apiCall<AuthResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (data?.data?.token) {
                this.setToken(data.data.token);
            }

            return data.data;
        } catch (err) {
            console.error('[authService] login error', err);
            throw err;
        }
    }

    async getCurrentUser() {
        if (!this.token) return null;

        try {
            const data = await this.apiCall<CurrentUserResponse>('/auth/me');
            return data.data.user;
        } catch (error) {
            this.logout();
            return null;
        }
    }

    logout() {
        this.setToken(null);
    }
}

export const authService = new AuthService();
