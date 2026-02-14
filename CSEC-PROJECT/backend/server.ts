import 'dotenv/config';
import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import connectDB from './config/db';

import authRoutes from './routes/auth.ts';
import chatRoutes from './routes/chat.ts';
import adminRoutes from './routes/admin.ts';

const app: Application = express();

const parseAllowedOrigins = (): string[] => {
    const configured = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
    const origins = configured
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    // Ensure both localhost and 127.0.0.1 are allowed for development
    if (origins.some(o => o.includes('localhost'))) {
        const withIp = origins.map(o => o.replace('localhost', '127.0.0.1'));
        origins.push(...withIp);
    }

    // Add versions without trailing slashes if they have them
    const normalized = origins.map(o => o.endsWith('/') ? o.slice(0, -1) : o);
    return [...new Set(normalized)];
};

const allowedOrigins = parseAllowedOrigins();
console.log('🔒 Allowed Origins for CORS:', allowedOrigins);
app.use(
    cors({
        origin: (origin, callback) => {
            console.log(`🔍 CORS Check: Incoming origin = ${origin}`);

            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) {
                callback(null, true);
                return;
            }

            // Always allow localhost/127.0.0.1 in development
            const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
            if (process.env.NODE_ENV === 'development' && isLocalhost) {
                console.log(`✅ CORS Allowed: Localhost origin (${origin})`);
                callback(null, true);
                return;
            }

            if (allowedOrigins.includes(origin)) {
                console.log(`✅ CORS Allowed: Origin ${origin} is in allowed list`);
                callback(null, true);
                return;
            }

            console.error(`🚫 CORS blocked: Origin ${origin} not in allowed list:`, allowedOrigins);
            callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true,
        optionsSuccessStatus: 200
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`${req.method} ${req.path} ${new Date().toISOString()}`);
        next();
    });
}

app.get('/', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'አሳሽ AI API is running',
        timestamp: new Date(),
        version: '1.0.0'
    });
});

app.get('/api/status', (_req: Request, res: Response) => {
    const state = mongoose.connection.readyState;
    const databaseStatus = state === 1 ? 'connected' : state === 2 ? 'connecting' : 'disconnected';

    res.json({
        success: true,
        status: databaseStatus === 'connected' ? 'operational' : 'degraded',
        database: databaseStatus,
        timestamp: new Date()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        const isSizeError = err.code === 'LIMIT_FILE_SIZE';
        res.status(400).json({
            success: false,
            message: isSizeError ? 'File exceeds max upload size (10MB)' : err.message
        });
        return;
    }

    if (err?.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({
            success: false,
            message: 'Validation error',
            errors
        });
        return;
    }

    if (err?.code === 11000) {
        const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
        res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
        return;
    }

    if (err?.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
        return;
    }

    if (err?.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired'
        });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(err?.statusCode || 500).json({
        success: false,
        message: err?.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' ? { stack: err?.stack } : {})
    });
});

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
            console.log(`API base: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled promise rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down.');
    process.exit(0);
});

startServer();
