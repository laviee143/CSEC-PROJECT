import express, { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
    getDashboardStats,
    getAllUsers,
    getSystemStatus
} from '../controllers/adminController';

const router: Router = express.Router();

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (admin/staff only)
 */
router.get('/stats', protect, authorize('admin', 'staff'), getDashboardStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (admin/staff only)
 */
router.get('/users', protect, authorize('admin', 'staff'), getAllUsers);

/**
 * @route   GET /api/admin/system-status
 * @desc    Get system status
 * @access  Private (admin/staff only)
 */
router.get('/system-status', protect, authorize('admin', 'staff'), getSystemStatus);

export default router;
