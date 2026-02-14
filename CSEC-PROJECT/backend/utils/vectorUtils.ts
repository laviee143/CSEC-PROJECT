/**
 * Vector Utilities for RAG System
 * Provides cosine similarity and vector search operations
 */

/**
 * Calculate cosine similarity between two vectors
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Similarity score between 0 and 1
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }

    if (vecA.length === 0) {
        return 0;
    }

    // Calculate dot product
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    // Calculate norms
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    // Avoid division by zero
    if (normA === 0 || normB === 0) {
        return 0;
    }

    // Return cosine similarity
    return dotProduct / (normA * normB);
};

/**
 * Normalize a vector to unit length
 * @param vec - Vector to normalize
 * @returns Normalized vector
 */
export const normalizeVector = (vec: number[]): number[] => {
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));

    if (norm === 0) {
        return vec;
    }

    return vec.map(val => val / norm);
};

/**
 * Find top-k most similar items based on cosine similarity
 * @param queryVector - Query embedding vector
 * @param items - Array of items with embeddings
 * @param k - Number of top results to return
 * @returns Top-k items sorted by similarity (highest first)
 */
export const findTopKSimilar = <T extends { embedding: number[] }>(
    queryVector: number[],
    items: T[],
    k: number = 5
): Array<T & { similarity: number }> => {
    // Calculate similarity for each item
    const itemsWithScores = items
        .filter(item => item.embedding && item.embedding.length > 0)
        .map(item => ({
            ...item,
            similarity: cosineSimilarity(queryVector, item.embedding)
        }));

    // Sort by similarity (descending) and take top-k
    const topK = itemsWithScores
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);

    return topK;
};

/**
 * Calculate Euclidean distance between two vectors
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Distance value
 */
export const euclideanDistance = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sum += diff * diff;
    }

    return Math.sqrt(sum);
};
