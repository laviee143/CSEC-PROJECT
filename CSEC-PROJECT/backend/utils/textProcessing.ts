/**
 * Text Processing Utilities for RAG System
 * Provides text chunking, cleaning, and extraction
 */

export interface TextChunk {
    text: string;
    index: number;
    startChar: number;
    endChar: number;
}

/**
 * Split text into chunks with overlap
 * @param text - Text to chunk
 * @param chunkSize - Maximum characters per chunk
 * @param overlap - Number of overlapping characters between chunks
 * @returns Array of text chunks with metadata
 */
export const chunkText = (
    text: string,
    chunkSize: number = 1000,
    overlap: number = 200
): TextChunk[] => {
    const chunks: TextChunk[] = [];

    // Clean and normalize text
    const cleanedText = cleanText(text);

    if (cleanedText.length <= chunkSize) {
        // Text is small enough, return as single chunk
        return [{
            text: cleanedText,
            index: 0,
            startChar: 0,
            endChar: cleanedText.length
        }];
    }

    let startChar = 0;
    let chunkIndex = 0;

    while (startChar < cleanedText.length) {
        let endChar = Math.min(startChar + chunkSize, cleanedText.length);

        // Try to break at sentence boundary if not at the end
        if (endChar < cleanedText.length) {
            const sentenceEnd = findSentenceEnd(cleanedText, startChar, endChar);
            if (sentenceEnd > startChar) {
                endChar = sentenceEnd;
            }
        }

        const chunkText = cleanedText.substring(startChar, endChar).trim();

        if (chunkText.length > 0) {
            chunks.push({
                text: chunkText,
                index: chunkIndex,
                startChar,
                endChar
            });
            chunkIndex++;
        }

        // Move start position with overlap
        startChar = endChar - overlap;

        // Ensure we make progress
        if (startChar <= chunks[chunks.length - 1]?.startChar) {
            startChar = endChar;
        }
    }

    return chunks;
};

/**
 * Find the nearest sentence ending near the target position
 * @param text - Full text
 * @param start - Start position
 * @param target - Target end position
 * @returns Position of sentence end
 */
const findSentenceEnd = (text: string, start: number, target: number): number => {
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    const searchStart = Math.max(start, target - 200);
    const searchEnd = Math.min(text.length, target + 100);
    const searchText = text.substring(searchStart, searchEnd);

    let bestPos = -1;
    let minDistance = Infinity;

    for (const ender of sentenceEnders) {
        let pos = searchText.lastIndexOf(ender, target - searchStart);
        if (pos !== -1) {
            const actualPos = searchStart + pos + ender.length;
            const distance = Math.abs(actualPos - target);
            if (distance < minDistance) {
                minDistance = distance;
                bestPos = actualPos;
            }
        }
    }

    return bestPos > start ? bestPos : target;
};

/**
 * Clean and normalize text
 * @param text - Raw text
 * @returns Cleaned text
 */
export const cleanText = (text: string): string => {
    return text
        // Normalize whitespace
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove multiple spaces
        .replace(/[ \t]+/g, ' ')
        // Remove multiple newlines (keep max 2)
        .replace(/\n{3,}/g, '\n\n')
        // Trim
        .trim();
};


/**
 * Extract text content from various file types
 * Supports plain text and PDF
 * @param buffer - File buffer
 * @param fileType - MIME type or extension
 * @returns Extracted text
 */
export const extractTextFromFile = async (
    buffer: Buffer,
    fileType: string
): Promise<string> => {
    // PDF Support
    if (fileType === 'application/pdf' || fileType.endsWith('.pdf')) {
        try {
            console.log('📄 Attempting to parse PDF, buffer size:', buffer.length);
            // Using dynamic require and handling potential default export for robustness
            const pdfParseModule = require('pdf-parse');
            const pdfExtract = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;

            if (typeof pdfExtract !== 'function') {
                throw new Error('pdf-parse module did not export a function');
            }

            const data = await pdfExtract(buffer);
            console.log('✅ PDF parsed successfully, extracted characters:', data.text?.length || 0);
            return data.text;
        } catch (error: any) {
            console.error('❌ Error parsing PDF details:', error);
            throw new Error(`Failed to extract text from PDF file: ${error.message}`);
        }
    }

    // Text support
    if (fileType.includes('text') || fileType.includes('txt')) {
        return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${fileType}. Supported: .txt, .pdf`);
};

/**
 * Truncate text to a maximum length while preserving words
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
        return text;
    }

    // Find last space before maxLength
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
};
