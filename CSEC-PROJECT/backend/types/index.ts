import { Request } from 'express';

/**
 * User payload for JWT tokens
 */
export interface IUserPayload {
    id: string;
    email: string;
    role: string;
}

/**
 * Extended Express Request with user property
 */
export interface IAuthRequest extends Request {
    user?: IUserPayload;
}

/**
 * Standard API response structure
 */
export interface IApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
}

/**
 * Environment variables interface
 */
export interface IEnvConfig {
    NODE_ENV: string;
    PORT: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRE?: string;
    FRONTEND_URL?: string;
    ALLOWED_ORIGINS?: string;
    GEMINI_API_KEY: string;
    VOYAGE_API_KEY?: string;
}

/**
 * Extend NodeJS ProcessEnv to include our custom environment variables
 */
declare global {
    namespace NodeJS {
        interface ProcessEnv extends IEnvConfig { }
    }
}

export { };
