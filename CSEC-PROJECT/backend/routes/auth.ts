import express, { Router } from 'express';
import { body } from 'express-validator';
import {
    signup,
    login,
    getCurrentUser,
    updateProfile
} from '../controllers/authController';
import { createAdmin } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/signup',
    [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('universityId')
            .trim()
            .notEmpty()
            .withMessage('University ID is required')
            .matches(/^ugr\/\d{5,6}\/\d{2}$/i)
            .withMessage('Please provide a valid university ID (format: ugr/XXXXX/XX or ugr/XXXXXX/XX)'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('role')
            .optional()
            .isIn(['student', 'admin', 'staff'])
            .withMessage('Role must be student, admin, or staff')
    ],
    signup
);

    // Dev-only admin creation endpoint (requires ADMIN_CREATE_KEY in .env)
    router.post(
        '/create-admin',
        [
            body('name').trim().notEmpty().withMessage('Name is required'),
            body('email').trim().notEmpty().isEmail().withMessage('Valid email required').normalizeEmail(),
            body('universityId').trim().notEmpty().withMessage('University ID is required'),
            body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
            body('key').notEmpty().withMessage('Admin creation key is required')
        ],
        createAdmin
    );

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
    '/profile',
    protect,
    [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),
        body('email')
            .optional()
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail()
    ],
    updateProfile
);

export default router;
