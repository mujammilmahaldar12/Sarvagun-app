import api from './api';

export interface ProblemReport {
    summary: string;
    details: string;
    errorpage?: any;
}


class SupportService {
    /**
     * Submit a problem report
     */
    async reportProblem(data: FormData): Promise<any> {
        const response = await api.post('/hr/problem-reports/', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    }
}

const supportService = new SupportService();
export default supportService;
