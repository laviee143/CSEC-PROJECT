import { Request, Response } from 'express';
import Document from '../models/Document';
import User from '../models/User';
import ChatSession from '../models/ChatSession';

/**
 * @desc    Get dashboard statistics for admin
 * @route   GET /api/admin/stats
 * @access  Private (admin/staff only)
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Count total documents
        const totalDocuments = await Document.countDocuments();

        // Count total and active users
        const totalUsers = await User.countDocuments({ role: 'student' });
        const activeUsersCount = await User.countDocuments({ 
            role: 'student', 
            isActive: true 
        });

        // Real statistics from ChatSession
        const totalInquiries = await ChatSession.countDocuments();
        
        // Active sessions last 24h
        const activeSessions = await ChatSession.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        // AI Resolution Rate
        const resolvedCount = await ChatSession.countDocuments({ isResolved: true });
        const aiResolutionRate = totalInquiries > 0 
            ? Number(((resolvedCount / totalInquiries) * 100).toFixed(1)) 
            : 0;

        // Avg Wait Time (actually response time)
        const stats = await ChatSession.aggregate([
            { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
        ]);
        const avgWaitTime = stats.length > 0 && stats[0].avgTime 
            ? `${stats[0].avgTime.toFixed(1)}s` 
            : '0s';

        res.json({
            success: true,
            data: {
                totalInquiries,
                activeSessions,
                aiResolutionRate,
                avgWaitTime,
                totalDocuments,
                totalUsers,
                activeUsers: activeUsersCount
            }
        });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};

/**
 * @desc    Get all users (for admin user management)
 * @route   GET /api/admin/users
 * @access  Private (admin/staff only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                users,
                total: users.length
            }
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

/**
 * @desc    Get system health/status
 * @route   GET /api/admin/system-status
 * @access  Private (admin/staff only)
 */
export const getSystemStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check MongoDB connection
        const mongoose = require('mongoose');
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        res.json({
            success: true,
            data: {
                database: dbStatus,
                server: 'operational',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Error fetching system status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system status',
            error: error.message
        });
    }
};
