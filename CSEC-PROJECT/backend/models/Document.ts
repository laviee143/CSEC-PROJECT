import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

/**
 * Knowledge Document Interface
 * Used for አሳሽ AI RAG-based administrative assistant
 */
export interface IKnowledgeDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category:
    | 'safety'
    | 'emergency'
    | 'policy'
    | 'procedure'
    | 'resource'
    | 'other'
    | 'academics'
    | 'clearance'
    | 'registrar'
    | 'dormitory'
    | 'id_services'
    | 'finance'
    | 'discipline'
    | 'general';
  office?: string;
  embedding: number[];
  source: 'pdf' | 'manual' | 'policy' | 'procedure';
  uploadedBy: mongoose.Types.ObjectId | IUser;
  isPublic: boolean;
  status: 'processing' | 'indexed' | 'error';
  tags: string[];
  viewCount: number;

  // Chunking support
  isChunk: boolean;
  parentDocumentId?: mongoose.Types.ObjectId;
  chunkIndex?: number;
  chunkCount?: number;

  createdAt: Date;
  updatedAt: Date;

  incrementViewCount(): Promise<void>;
}

/**
 * Knowledge Document Model Interface
 */
export interface IKnowledgeDocumentModel extends Model<IKnowledgeDocument> {
  vectorSearch(
    queryEmbedding: number[],
    limit?: number
  ): Promise<Array<IKnowledgeDocument & { similarity: number }>>;
  findSimilar(query: string, limit?: number): Promise<IKnowledgeDocument[]>;
}

/**
 * Knowledge Document Schema
 */
const knowledgeDocumentSchema = new Schema<
  IKnowledgeDocument,
  IKnowledgeDocumentModel
>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    content: {
      type: String,
      required: true,
      maxlength: 8000 // Safe for embeddings
    },

    category: {
      type: String,
      enum: [
        'safety',
        'emergency',
        'policy',
        'procedure',
        'resource',
        'other',
        'academics',
        'clearance',
        'registrar',
        'dormitory',
        'id_services',
        'finance',
        'discipline',
        'general'
      ],
      default: 'general'
    },

    office: {
      type: String,
      trim: true
    },

    embedding: {
      type: [Number],
      default: []
    },

    source: {
      type: String,
      enum: ['pdf', 'manual', 'policy', 'procedure'],
      default: 'pdf'
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    isPublic: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ['processing', 'indexed', 'error'],
      default: 'processing'
    },

    tags: [
      {
        type: String,
        trim: true
      }
    ],

    viewCount: {
      type: Number,
      default: 0
    },

    // Chunking fields
    isChunk: {
      type: Boolean,
      default: false
    },

    parentDocumentId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeDocument'
    },

    chunkIndex: Number,
    chunkCount: Number
  },
  {
    timestamps: true
  }
);

/**
 * Indexes
 */
knowledgeDocumentSchema.index({ category: 1, isPublic: 1 });
knowledgeDocumentSchema.index({ parentDocumentId: 1, chunkIndex: 1 });
knowledgeDocumentSchema.index({ title: 'text', content: 'text', tags: 'text' });

/**
 * Increment view count
 */
knowledgeDocumentSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  await this.save();
};

/**
 * Atlas Vector Search for RAG
 */
knowledgeDocumentSchema.statics.vectorSearch = async function (
  queryEmbedding: number[],
  limit: number = 5
) {
  return this.aggregate([
    {
      $vectorSearch: {
        index: 'vertex_search',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: limit * 10,
        limit
      }
    },
    {
      $project: {
        title: 1,
        content: 1,
        category: 1,
        office: 1,
        source: 1,
        isChunk: 1,
        parentDocumentId: 1,
        chunkIndex: 1,
        chunkCount: 1,
        similarity: { $meta: 'vectorSearchScore' }
      }
    }
  ]);
};

knowledgeDocumentSchema.statics.findSimilar = function (
  query: string,
  limit: number = 5
) {
  return this.find(
    { $text: { $search: query }, isPublic: true, isChunk: false },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

const KnowledgeDocumentModel = mongoose.model<
  IKnowledgeDocument,
  IKnowledgeDocumentModel
>('KnowledgeDocument', knowledgeDocumentSchema);

export default KnowledgeDocumentModel;
