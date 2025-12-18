import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { Card, Input, Button, Select, DatePicker } from '@/components/core';
import { useToast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import eventsService from '@/services/events.service';
import { ClientCategory, Organisation, Venue, Lead } from '@/types/events';

export default function ConvertLeadScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lead, setLead] = useState<Lead | null>(null);

    // Reference Data
    const [categories, setCategories] = useState<ClientCategory[]>([]);
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);

    // Organisation Modal States
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [creatingOrg, setCreatingOrg] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        company: 'redmagic events' as 'redmagic events' | 'bling square events',
        clientCategory: '' as 'b2b' | 'b2c' | 'b2g',
        organisationId: null as number | null,

        venueId: null as number | null,

        typeOfEvent: 'other',
        category: 'other',
        startDate: new Date(),
        endDate: new Date(),
    });

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadData, cats, orgs, vens] = await Promise.all([
                eventsService.getLead(parseInt(id)),
                eventsService.getClientCategories(),
                eventsService.getOrganisations(),
                eventsService.getVenues(),
            ]);

            setLead(leadData);
            setCategories(cats || []);
            setOrganisations(orgs || []);
            setVenues(vens || []);

            // Pre-fill form
            if (leadData) {
                // Try to guess category from client's existing categories
                const clientCats = leadData.client.client_category || [];
                const initialCat = clientCats.length > 0 ? clientCats[0].code : 'b2c';

                // Try to guess organisation
                const clientOrgs = leadData.client.organisation || [];
                const initialOrg = clientOrgs.length > 0 ? clientOrgs[0].id : null;

                setFormData(prev => ({
                    ...prev,
                    clientCategory: initialCat,
                    organisationId: initialOrg,
                    venueId: leadData.event?.venue?.id || null,
                    startDate: leadData.event?.start_date ? new Date(leadData.event.start_date) : new Date(),
                    endDate: leadData.event?.end_date ? new Date(leadData.event.end_date) : new Date(),
                    typeOfEvent: leadData.event?.type_of_event || 'other',
                    category: leadData.event?.category || 'other',
                }));
            }
        } catch (error) {
            console.error('Failed to load lead data', error);
            showToast({ message: 'Failed to load lead details', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Get categories that belong to this client
    const getClientCategories = () => {
        if (!lead?.client?.client_category || !Array.isArray(categories)) return [];
        const clientCategoryIds = lead.client.client_category.map((c: any) => c.id || c.code);
        // Filter categories by code (b2b, b2c, b2g) matching client's categories
        return categories.filter(c =>
            lead.client.client_category.some((cc: any) => cc.code === c.code || cc.id === c.id)
        );
    };

    // Handle creating new organisation
    const handleCreateOrganisation = async () => {
        if (!newOrgName.trim()) {
            Alert.alert('Error', 'Please enter organisation name');
            return;
        }
        setCreatingOrg(true);
        try {
            const newOrg = await eventsService.createOrganisation({ name: newOrgName.trim() });
            setOrganisations(prev => [...prev, newOrg]);
            setFormData(prev => ({ ...prev, organisationId: newOrg.id }));
            setShowOrgModal(false);
            setNewOrgName('');
            showToast({ message: 'Organisation created!', type: 'success' });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create organisation');
        } finally {
            setCreatingOrg(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.clientCategory) {
            Alert.alert('Error', 'Please select a client category');
            return;
        }

        if (['b2b', 'b2g'].includes(formData.clientCategory) && !formData.organisationId) {
            Alert.alert('Error', 'Organisation is required for B2B/B2G events');
            return;
        }

        if (!formData.venueId) {
            Alert.alert('Error', 'Please select a venue');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                company: formData.company,
                client_category: formData.clientCategory,
                organisation: formData.organisationId || undefined,
                venue: formData.venueId,
                start_date: format(formData.startDate, 'yyyy-MM-dd'),
                end_date: format(formData.endDate, 'yyyy-MM-dd'),
                type_of_event: formData.typeOfEvent,
                category: formData.category,
                // Generate daily entries for the date range
                event_dates: [{ date: format(formData.startDate, 'yyyy-MM-dd') }],
            };

            await eventsService.convertLead(parseInt(id), payload);
            showToast({ message: 'Lead converted to Event successfully!', type: 'success' });
            router.replace('/(modules)/events'); // Go to events list
        } catch (error: any) {
            console.error('Convert lead error:', error);
            const msg = error.response?.data?.error || 'Failed to convert lead';
            Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text>Loading lead details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Convert to Event' }} />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Event Configuration</Text>

                    <Select
                        label="Company *"
                        options={[
                            { label: 'RedMagic Events', value: 'redmagic events' },
                            { label: 'Bling Square Events', value: 'bling square events' },
                        ]}
                        value={formData.company}
                        onChange={(val) => setFormData(prev => ({ ...prev, company: val as any }))}
                    />

                    <Select
                        label="Client Category (for this event) *"
                        options={
                            getClientCategories().length > 0
                                ? getClientCategories().map(c => ({ label: c.name, value: c.code }))
                                : [
                                    { label: 'B2C (Individual)', value: 'b2c' },
                                    { label: 'B2B (Business)', value: 'b2b' },
                                    { label: 'B2G (Government)', value: 'b2g' },
                                ]
                        }
                        value={formData.clientCategory}
                        onChange={(val) => setFormData(prev => ({ ...prev, clientCategory: val as any, organisationId: null }))}
                    />

                    {['b2b', 'b2g'].includes(formData.clientCategory) && (
                        <Select
                            label="Organisation *"
                            options={[
                                ...organisations.map(o => ({ label: o.name, value: o.id })),
                                { label: '➕ Add New Organisation', value: -1 },
                            ]}
                            value={formData.organisationId}
                            onChange={(val) => {
                                if (val === -1) {
                                    setShowOrgModal(true);
                                } else {
                                    setFormData(prev => ({ ...prev, organisationId: val as number }));
                                }
                            }}
                            placeholder="Select Organisation"
                        />
                    )}
                </Card>

                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Venue & Dates</Text>

                    <Select
                        label="Venue *"
                        options={venues.map(v => ({ label: v.name, value: v.id }))}
                        value={formData.venueId}
                        onChange={(val) => setFormData(prev => ({ ...prev, venueId: val as number }))}
                    />

                    <View style={styles.row}>
                        <View style={styles.col}>
                            <DatePicker
                                label="Start Date"
                                date={formData.startDate}
                                onChange={(d) => setFormData(prev => ({ ...prev, startDate: d }))}
                            />
                        </View>
                        <View style={styles.col}>
                            <DatePicker
                                label="End Date"
                                date={formData.endDate}
                                onChange={(d) => setFormData(prev => ({ ...prev, endDate: d }))}
                            />
                        </View>
                    </View>
                </Card>

                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Event Details</Text>

                    <Input
                        label="Type of Event"
                        value={formData.typeOfEvent}
                        onChangeText={(t) => setFormData(prev => ({ ...prev, typeOfEvent: t }))}
                        placeholder="e.g. Wedding, Conference"
                    />

                    <Select
                        label="Category"
                        options={[
                            { label: 'Social Event', value: 'social events' },
                            { label: 'Wedding', value: 'weddings' },
                            { label: 'Corporate Event', value: 'corporate events' },
                            { label: 'Religious Event', value: 'religious events' },
                            { label: 'Sports', value: 'sports' },
                            { label: 'Other', value: 'other' },
                        ]}
                        value={formData.category}
                        onChange={(val) => setFormData(prev => ({ ...prev, category: val as string }))}
                    />
                </Card>

                <Button
                    onPress={handleSubmit}
                    loading={submitting}
                    size="lg"
                    style={styles.submitBtn}
                >
                    Convert to Event
                </Button>

            </ScrollView>

            {/* Organisation Creation Modal */}
            <Modal
                visible={showOrgModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowOrgModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Organisation</Text>
                            <Pressable onPress={() => setShowOrgModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </Pressable>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.inputLabel}>Organisation Name *</Text>
                            <TextInput
                                value={newOrgName}
                                onChangeText={setNewOrgName}
                                placeholder="Enter organisation name"
                                placeholderTextColor={Colors.textSecondary}
                                style={styles.modalInput}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <Pressable
                                onPress={() => { setShowOrgModal(false); setNewOrgName(''); }}
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                            >
                                <Text style={{ color: Colors.text, fontWeight: '600' }}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleCreateOrganisation}
                                disabled={creatingOrg || !newOrgName.trim()}
                                style={[styles.modalBtn, styles.modalBtnCreate, !newOrgName.trim() && { opacity: 0.5 }]}
                            >
                                {creatingOrg && <ActivityIndicator size="small" color="#FFF" />}
                                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                                    {creatingOrg ? 'Creating...' : 'Create'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
    },
    submitBtn: {
        marginTop: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 6,
    },
    modalInput: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: Colors.text,
        backgroundColor: Colors.surface,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    modalBtnCancel: {
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalBtnCreate: {
        backgroundColor: Colors.primary,
    },
});
