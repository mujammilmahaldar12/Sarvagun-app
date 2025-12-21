import { useState } from 'react';
import { Alert } from 'react-native';
import type { TaskSection } from '@/types/project';
import {
    useCreateSection,
    useUpdateSection,
    useDeleteSection,
    useSectionsByProject,
} from '@/hooks/useProjectQueries';

interface UseSectionManagementProps {
    projectId: number | null;
}

interface UseSectionManagementReturn {
    // Section data
    sections: TaskSection[];
    sectionsLoading: boolean;
    expandedSections: number[];
    selectedSectionFilter: number | null;
    showSectionFilterDropdown: boolean;

    // Section expansion
    toggleSection: (sectionId: number) => void;
    setExpandedSections: (sections: number[]) => void;

    // Section filter
    setSelectedSectionFilter: (sectionId: number | null) => void;
    setShowSectionFilterDropdown: (show: boolean) => void;

    // Add section
    showAddSection: boolean;
    newSectionName: string;
    setShowAddSection: (show: boolean) => void;
    setNewSectionName: (name: string) => void;
    handleCreateSection: () => Promise<void>;

    // Edit section
    showEditSection: boolean;
    editingSectionId: number | null;
    editSectionName: string;
    setShowEditSection: (show: boolean) => void;
    setEditingSectionId: (id: number | null) => void;
    setEditSectionName: (name: string) => void;
    openEditSection: (section: TaskSection) => void;
    handleUpdateSection: () => Promise<void>;

    // Delete section
    showDeleteSectionConfirm: boolean;
    sectionToDelete: { id: number; name: string } | null;
    setShowDeleteSectionConfirm: (show: boolean) => void;
    setSectionToDelete: (section: { id: number; name: string } | null) => void;
    confirmDeleteSection: (section: { id: number; name: string }) => void;
    handleDeleteSection: () => Promise<void>;

    // Refetch
    refetchSections: () => void;
}

/**
 * Custom hook to manage section operations
 * Handles section CRUD, expansion, and filtering
 */
export function useSectionManagement({
    projectId,
}: UseSectionManagementProps): UseSectionManagementReturn {

    // State
    const [expandedSections, setExpandedSections] = useState<number[]>([]);
    const [selectedSectionFilter, setSelectedSectionFilter] = useState<number | null>(null);
    const [showSectionFilterDropdown, setShowSectionFilterDropdown] = useState(false);

    // Add section
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    // Edit section
    const [showEditSection, setShowEditSection] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editSectionName, setEditSectionName] = useState('');

    // Delete section
    const [showDeleteSectionConfirm, setShowDeleteSectionConfirm] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState<{ id: number; name: string } | null>(null);

    // Data hooks
    const {
        data: sectionsData,
        refetch: refetchSections,
        isLoading: sectionsLoading,
    } = useSectionsByProject(projectId || 0, !!projectId);

    // Mutations
    const createSectionMutation = useCreateSection();
    const updateSectionMutation = useUpdateSection();
    const deleteSectionMutation = useDeleteSection();

    // Normalize data
    const sections = Array.isArray(sectionsData) ? sectionsData : [];

    // Toggle section expansion
    const toggleSection = (sectionId: number) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    // Create section
    const handleCreateSection = async () => {
        if (!projectId || !newSectionName.trim()) return;

        try {
            await createSectionMutation.mutateAsync({
                project: projectId,
                section_name: newSectionName,
            });

            setShowAddSection(false);
            setNewSectionName('');
            refetchSections();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to create section');
        }
    };

    // Open edit section modal
    const openEditSection = (section: TaskSection) => {
        setEditingSectionId(section.id);
        setEditSectionName(section.section_name);
        setShowEditSection(true);
    };

    // Update section
    const handleUpdateSection = async () => {
        if (!editingSectionId) return;

        try {
            await updateSectionMutation.mutateAsync({
                id: editingSectionId,
                data: { section_name: editSectionName },
            });

            setShowEditSection(false);
            setEditingSectionId(null);
            setEditSectionName('');
            refetchSections();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to update section');
        }
    };

    // Confirm delete section
    const confirmDeleteSection = (section: { id: number; name: string }) => {
        setSectionToDelete(section);
        setShowDeleteSectionConfirm(true);
    };

    // Delete section
    const handleDeleteSection = async () => {
        if (!sectionToDelete) return;

        try {
            await deleteSectionMutation.mutateAsync(sectionToDelete.id);

            setShowDeleteSectionConfirm(false);
            setSectionToDelete(null);

            // Remove from expanded sections if it was expanded
            setExpandedSections(prev => prev.filter(id => id !== sectionToDelete.id));

            refetchSections();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to delete section');
        }
    };

    return {
        // Section data
        sections,
        sectionsLoading,
        expandedSections,
        selectedSectionFilter,
        showSectionFilterDropdown,

        // Section expansion
        toggleSection,
        setExpandedSections,

        // Section filter
        setSelectedSectionFilter,
        setShowSectionFilterDropdown,

        // Add section
        showAddSection,
        newSectionName,
        setShowAddSection,
        setNewSectionName,
        handleCreateSection,

        // Edit section
        showEditSection,
        editingSectionId,
        editSectionName,
        setShowEditSection,
        setEditingSectionId,
        setEditSectionName,
        openEditSection,
        handleUpdateSection,

        // Delete section
        showDeleteSectionConfirm,
        sectionToDelete,
        setShowDeleteSectionConfirm,
        setSectionToDelete,
        confirmDeleteSection,
        handleDeleteSection,

        // Refetch
        refetchSections,
    };
}
