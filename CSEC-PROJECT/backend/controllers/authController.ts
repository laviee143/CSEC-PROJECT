import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult, Result, ValidationError } from 'express-validator';
import { User } from '../models/User';
import { IAuthRequest } from '../types';

/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @returns {string} JWT Token
 */
const generateToken = (id: string): string => {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    return jwt.sign({ id }, secret, {
        expiresIn: '7d' // Token expires in 7 days
    });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        console.log('📝 Signup attempt:', req.body.email);

        // Validate request
        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }

        const { name, email, universityId, password } = req.body;
        // Force public signups to 'student' role. Admin/staff accounts must be
        // created by a privileged process or directly in the database.
        const roleToCreate = 'student';

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('❌ User already exists:', email);
            res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
            return;
        }

        // Create user
        const user = await User.create({
            name,
            email,
            universityId,
            password, // Will be hashed by pre-save middleware
            role: roleToCreate
        });

        console.log('✅ User created successfully:', user.email);

        // Generate JWT token
        const token = generateToken((user._id as any).toString());

        // Return user data and token
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    universityId: user.universityId,
                    role: user.role,
                    createdAt: user.createdAt
                },
                token
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error('❌ Signup error:', err);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: err.message
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        console.log('🔐 Login attempt:', req.body.email);

        // Validate request
        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }

        const { email, password } = req.body;

        // Check if user exists (include password field for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('❌ User not found:', email);
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }

        // Check if user is active
        if (!user.isActive) {
            console.log('❌ User account deactivated:', email);
            res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
            return;
        }

        // Verify password
        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            console.log('❌ Invalid password for user:', email);
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }

        console.log('✅ Login successful:', user.email);

        // Generate JWT token
        const token = generateToken(user._id.toString());

        // Return user data and token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    universityId: user.universityId,
                    role: user.role,
                    createdAt: user.createdAt
                },
                token
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error('❌ Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: err.message
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
            return;
        }

        console.log('👤 Get current user:', req.user.email);

        // Fetch full user data
        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // User is already attached to request by auth middleware
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    universityId: user.universityId,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error('❌ Get current user error:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: err.message
        });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
            return;
        }

        console.log('📝 Update profile:', req.user.email);

        const { name, email } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Update fields
        if (name) user.name = name;
        if (email) {
            // Check if new email already exists
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) {
                res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
                return;
            }
            user.email = email;
        }

        await user.save();

        console.log('✅ Profile updated:', user.email);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error('❌ Update profile error:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: err.message
        });
    }
};

/**
 * @desc    Create an admin user (DEVELOPMENT ONLY)
 * @route   POST /api/auth/create-admin
 * @access  Dev-only (requires ADMIN_CREATE_KEY)
 */
export const createAdmin = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }

        const creationKey = req.body.key as string | undefined;
        if (!creationKey || creationKey !== process.env.ADMIN_CREATE_KEY) {
            res.status(401).json({ success: false, message: 'Invalid or missing admin creation key' });
            return;
        }

        const { name, email, universityId, password } = req.body;

        // Basic validation
        if (!name || !email || !universityId || !password) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }

        // Prevent creating duplicate admin
        const existing = await User.findOne({ email });
        if (existing) {
            res.status(400).json({ success: false, message: 'User already exists' });
            return;
        }

        const user = await User.create({
            name,
            email,
            universityId,
            password,
            role: 'admin'
        });

        const token = jwt.sign({ id: (user._id as any).toString() }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'Admin user created',
            data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
        });
    } catch (error) {
        const err = error as Error;
        console.error('❌ Create admin error:', err);
        res.status(500).json({ success: false, message: 'Error creating admin', error: err.message });
    }
};
