import { authService } from './authService';
import { ApiResponse, AdministrativeProcess } from '../types';

interface AskResponseData {
    question: string;
    answer: string;
    sources: Array<{
        id: string;
        title: string;
        category?: string;
        similarity?: number;
        isChunk?: boolean;
        chunkIndex?: number;
    }>;
    timestamp: string;
}

interface DocumentsResponseData {
    documents: AdministrativeProcess[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
}

class ChatService {
    async ask(question: string) {
        return await authService.apiCall<ApiResponse<AskResponseData>>('/chat/ask', {
            method: 'POST',
            body: JSON.stringify({ question })
        });
    }

    async getDocuments(params: { category?: string; search?: string; limit?: number; page?: number; includeChunks?: boolean } = {}) {
        const queryParams = new URLSearchParams();
        if (params.category) queryParams.append('category', params.category);
        if (params.search) queryParams.append('search', params.search);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.includeChunks) queryParams.append('includeChunks', 'true');

        const queryString = queryParams.toString();
        const endpoint = `/chat/documents${queryString ? `?${queryString}` : ''}`;

        const result = await authService.apiCall<ApiResponse<DocumentsResponseData>>(endpoint);

        // Normalize _id to id
        if (result.data && result.data.documents) {
            result.data.documents = result.data.documents.map((doc: any) => ({
                ...doc,
                id: doc.id || doc._id
            }));
        }

        return result;
    }

    async uploadText(docData: { title: string; content: string; category?: string; tags?: string[] }) {
        return await authService.apiCall('/chat/upload/text', {
            method: 'POST',
            body: JSON.stringify(docData)
        });
    }

    async uploadFile(formData: FormData) {
        return await authService.apiCall('/chat/upload/file', {
            method: 'POST',
            body: formData
        });
    }

    async deleteDocument(id: string) {
        return await authService.apiCall(`/chat/documents/${id}`, {
            method: 'DELETE'
        });
    }

    async createSession(payload: { title?: string; messages: any[] }) {
        return await authService.apiCall('/chat/sessions', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async listSessions() {
        return await authService.apiCall('/chat/sessions');
    }

    async getSession(id: string) {
        return await authService.apiCall(`/chat/sessions/${id}`);
    }

    async deleteSession(id: string) {
        return await authService.apiCall(`/chat/sessions/${id}`, { method: 'DELETE' });
    }
}

export const chatService = new ChatService();
