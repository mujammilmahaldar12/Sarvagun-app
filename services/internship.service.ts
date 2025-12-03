import api from './api';
import type { Internship, InternshipExtension, CreateExtensionRequest } from '../types/internship';

class InternshipService {
    /**
     * Get current user's internship details
     */
    /**
     * Get current user's internship details
     */
    async getMyInternship(userId: number): Promise<Internship | undefined> {
        // Since there is no specific endpoint for "my internship", we fetch all and filter
        // Ideally backend should provide this, but for now we handle it here
        const internships = await api.get<Internship[]>('/hr/internships/');
        return internships.find((internship: Internship) => internship.intern === userId);
    }

    /**
     * Get extension requests for the current internship
     */
    async getMyExtensions(userId: number): Promise<InternshipExtension[]> {
        // Fetch all extensions and filter by user
        const extensions = await api.get<InternshipExtension[]>('/hr/extensions/');
        return extensions.filter((extension: InternshipExtension) => extension.requested_by === userId);
    }

    /**
     * Request an internship extension
     */
    async requestExtension(data: CreateExtensionRequest): Promise<InternshipExtension> {
        const response = await api.post<InternshipExtension>('/hr/extensions/', data);
        return response;
    }
}

const internshipService = new InternshipService();
export default internshipService;
