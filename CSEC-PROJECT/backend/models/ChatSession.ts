import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IChatSession extends Document {
    user: mongoose.Types.ObjectId;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>;
    isResolved: boolean;
    responseTime: number; // in seconds
    createdAt: Date;
    updatedAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        messages: [
            {
                role: {
                    type: String,
                    enum: ['user', 'assistant'],
                    required: true
                },
                content: {
                    type: String,
                    required: true
                },
                timestamp: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        isResolved: {
            type: Boolean,
            default: false
        },
        responseTime: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Indexes
chatSessionSchema.index({ user: 1, createdAt: -1 });
chatSessionSchema.index({ isResolved: 1 });

const ChatSession = mongoose.model<IChatSession>('ChatSession', chatSessionSchema);
export default ChatSession;
