import apiClient from '@/services/api';
import { WhatsNew, WhatsNewLike } from '@/types/whatsnew';

class WhatsNewService {
    /**
     * Get all whats new items with pagination and filtering
     */
    async getAll(params?: {
        search?: string;
        type?: string;
        page?: number;
        page_size?: number;
        my_posts?: boolean;
    }) {
        try {
            const response = await apiClient.get<any>('/whatsnew/', { params });

            if (response?.results && Array.isArray(response.results)) {
                return response.results as WhatsNew[];
            }

            return Array.isArray(response) ? response as WhatsNew[] : [];
        } catch (error) {
            console.error('Error fetching whats new items:', error);
            throw error;
        }
    }

    /**
     * Get single item by ID
     */
    async getById(id: number) {
        return await apiClient.get<WhatsNew>(`/whatsnew/${id}/`);
    }

    /**
     * Toggle like/dislike reaction
     */
    async toggleLike(id: number, reaction: 'like' | 'dislike') {
        return await apiClient.post<WhatsNewLike>(`/whatsnew/${id}/toggle_like/`, { reaction });
    }

    /**
     * Record view
     */
    async recordView(id: number) {
        return await apiClient.post<{ status: string; created: boolean }>(`/whatsnew/${id}/record_view/`);
    }

    /**
     * Create new post
     */
    async create(data: FormData) {
        return await apiClient.post<WhatsNew>('/whatsnew/', data);
    }

    /**
     * Update post
     */
    async update(id: number, data: FormData) {
        return await apiClient.put<WhatsNew>(`/whatsnew/${id}/`, data);
    }

    /**
     * Delete post
     */
    async delete(id: number) {
        return await apiClient.delete<void>(`/whatsnew/${id}/`);
    }
}

export default new WhatsNewService();
