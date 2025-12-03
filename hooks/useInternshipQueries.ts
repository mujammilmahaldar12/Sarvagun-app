import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import internshipService from '../services/internship.service';
import { useAuthStore } from '../store/authStore';
import type { CreateExtensionRequest } from '../types/internship';

export const internshipQueryKeys = {
    all: ['internship'] as const,
    myInternship: () => [...internshipQueryKeys.all, 'my'] as const,
    myExtensions: () => [...internshipQueryKeys.all, 'extensions'] as const,
};

export const useMyInternship = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: internshipQueryKeys.myInternship(),
        queryFn: () => {
            if (!user?.id) throw new Error('User not authenticated');
            return internshipService.getMyInternship(user.id);
        },
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useMyExtensions = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: internshipQueryKeys.myExtensions(),
        queryFn: () => {
            if (!user?.id) throw new Error('User not authenticated');
            return internshipService.getMyExtensions(user.id);
        },
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useRequestExtension = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateExtensionRequest) => internshipService.requestExtension(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: internshipQueryKeys.myExtensions() });
        },
    });
};
