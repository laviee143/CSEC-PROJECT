import { authService } from './authService';
import { ApiResponse } from '../types';

interface DashboardStats {
    totalInquiries: number;
    activeSessions: number;
    aiResolutionRate: number;
    avgWaitTime: string;
    totalDocuments: number;
    totalUsers: number;
    activeUsers: number;
}

interface SystemStatus {
    database: string;
    server: string;
    timestamp: string;
}

interface UserData {
    _id: string;
    name: string;
    email: string;
    universityId?: string;
    role: 'student' | 'admin' | 'staff';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

class AdminService {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
        return await authService.apiCall<ApiResponse<DashboardStats>>('/admin/stats');
    }

    /**
     * Get all users
     */
    async getAllUsers(): Promise<ApiResponse<{ users: UserData[]; total: number }>> {
        return await authService.apiCall<ApiResponse<{ users: UserData[]; total: number }>>('/admin/users');
    }

    /**
     * Get system status
     */
    async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
        return await authService.apiCall<ApiResponse<SystemStatus>>('/admin/system-status');
    }
}

export const adminService = new AdminService();
