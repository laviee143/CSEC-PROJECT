import express, { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
    askQuestion,
    uploadDocument,
    uploadFile,
    getDocuments,
    deleteDocument
    , createSession, listSessions, getSession, deleteSession
} from '../controllers/chatController';
import { protect, authorize } from '../middleware/auth';

const router: Router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        if (
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'text/plain' ||
            file.originalname.endsWith('.pdf') ||
            file.originalname.endsWith('.txt')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf and .txt files are supported'));
        }
    }
});

/**
 * @route   POST /api/chat/ask
 * @desc    Ask chatbot a question
 * @access  Private
 */
router.post(
    '/ask',
    protect,
    [
        body('question')
            .trim()
            .notEmpty()
            .withMessage('Question is required')
            .isLength({ min: 3, max: 1000 })
            .withMessage('Question must be between 3 and 1000 characters')
    ],
    askQuestion
);

/**
 * @route   POST /api/chat/sessions
 * @desc    Save a chat session
 * @access  Private
 */
router.post('/sessions', protect, createSession);

/**
 * @route   GET /api/chat/sessions
 * @desc    List chat sessions for current user
 * @access  Private
 */
router.get('/sessions', protect, listSessions);

/**
 * @route   GET /api/chat/sessions/:id
 * @desc    Get a single chat session
 * @access  Private
 */
router.get('/sessions/:id', protect, getSession);

/**
 * @route   DELETE /api/chat/sessions/:id
 * @desc    Delete a chat session
 * @access  Private
 */
router.delete('/sessions/:id', protect, deleteSession);

/**
 * @route   POST /api/chat/upload/text
 * @desc    Upload document text for RAG system (with automatic chunking)
 * @access  Private (Admin/Staff only)
 */
router.post(
    '/upload/text',
    protect,
    authorize('admin', 'staff'),
    [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ min: 3, max: 200 })
            .withMessage('Title must be between 3 and 200 characters'),
        body('content')
            .trim()
            .notEmpty()
            .withMessage('Content is required')
            .isLength({ min: 10 })
            .withMessage('Content must be at least 10 characters'),
        body('category')
            .optional()
            .isIn(['safety', 'emergency', 'policy', 'procedure', 'resource', 'other'])
            .withMessage('Invalid category'),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array')
    ],
    uploadDocument
);

/**
 * @route   POST /api/chat/upload/file
 * @desc    Upload document file for RAG system (PDF/TXT)
 * @access  Private (Admin/Staff only)
 */
router.post(
    '/upload/file',
    protect,
    authorize('admin', 'staff'),
    upload.single('file'),
    uploadFile
);

/**
 * @route   GET /api/chat/documents
 * @desc    Get all documents
 * @access  Private
 */
router.get('/documents', protect, getDocuments);

/**
 * @route   DELETE /api/chat/documents/:id
 * @desc    Delete document and its chunks
 * @access  Private (Admin/Staff only)
 */
router.delete('/documents/:id', protect, authorize('admin', 'staff'), deleteDocument);

export default router;
