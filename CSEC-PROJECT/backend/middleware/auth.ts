import { Response, NextFunction } from 'express';
console.log('🚀 Auth Middleware Loaded');
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { IAuthRequest, IUserPayload } from '../types';

/**
 * Protect routes - Verify JWT token
 * Middleware to authenticate users and attach user to request
 */
export const protect = async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    let token: string | undefined;

    try {
        // Check if authorization header exists and starts with 'Bearer'
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            // Extract token from 'Bearer <token>'
            token = req.headers.authorization.split(' ')[1];

            console.log('🔐 Token received:', token.substring(0, 20) + '...');
        }

        // Check if token exists
        if (!token) {
            console.log('❌ No token provided');
            res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
            return;
        }

        try {
            if (!process.env.JWT_SECRET) {
                res.status(500).json({
                    success: false,
                    message: 'JWT_SECRET is not configured'
                });
                return;
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as IUserPayload;
            console.log('✅ Token verified for user ID:', decoded.id);

            // Get user from token (exclude password)
            // Use a robust way to get the model to avoid "not a function" errors
            const UserModel = mongoose.models.User || User;

            if (!UserModel || typeof UserModel.findById !== 'function') {
                console.error('❌ Model Resolution Error: UserModel is not a valid Mongoose model');
                console.log('   UserModel keys:', Object.keys(UserModel || {}));
                res.status(500).json({ success: false, message: 'Internal Server Error: Model initialization failed' });
                return;
            }

            const user = await UserModel.findById(decoded.id).select('-password');

            if (!user) {
                console.log('❌ User not found for token');
                res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Check if user is active
            if (!user.isActive) {
                console.log('❌ User account is deactivated');
                res.status(401).json({
                    success: false,
                    message: 'User account is deactivated'
                });
                return;
            }

            // Attach user to request
            req.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role
            };

            console.log('✅ User authenticated:', user.email);
            next();
        } catch (error: any) {
            console.error('❌ Auth Verification Error:', error.message);

            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Token expired, please login again'
                });
                return;
            }

            res.status(401).json({
                success: false,
                message: error.message || 'Not authorized, token failed'
            });
            return;
        }
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
        return;
    }
};

/**
 * Authorize user roles
 * Middleware to check if user has required role
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles: string[]) => {
    return (req: IAuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            console.log(`❌ User ${req.user.email} with role ${req.user.role} not authorized`);
            res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
            return;
        }

        console.log(`✅ User ${req.user.email} authorized with role ${req.user.role}`);
        next();
    };
};
