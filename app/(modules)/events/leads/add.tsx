import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Card, Input, Button, Select, DatePicker } from '@/components/core';
import { useToast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import eventsService from '@/services/events.service';
import { ClientCategory, Organisation, Venue } from '@/types/events';

export default function AddLeadScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const params = useLocalSearchParams<{ leadId?: string }>();

    // Extract leadId for edit mode
    const leadId = params.leadId ? (Array.isArray(params.leadId) ? params.leadId[0] : params.leadId) : undefined;
    const isEditMode = !!leadId;

    console.log('📝 AddLeadScreen (leads/add.tsx) mounted. leadId:', leadId, '| isEditMode:', isEditMode);

    const [loading, setLoading] = useState(false);

    // Reference Data
    const [categories, setCategories] = useState<ClientCategory[]>([]);
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        // Client Info
        clientName: '',
        clientEmail: '',
        clientNumber: '',
        clientCategory: [] as number[],
        organisation: [] as number[],

        // Venue Info
        venueId: null as number | null,
        venueName: '',
        venueAddress: '',
        venueCapacity: '',
        venueRegion: 'india',
        venueType: 'home',

        // Lead Info
        source: 'online',
        message: '',
        referral: '',

        // Event Info (Initial)
        typeOfEvent: 'other',
        category: 'other',
        startDate: new Date(),
        endDate: new Date(),
    });

    const [isNewVenue, setIsNewVenue] = useState(false);

    useEffect(() => {
        fetchReferenceData();
    }, []);

    const fetchReferenceData = async () => {
        try {
            const [cats, orgs, vens] = await Promise.all([
                eventsService.getClientCategories(),
                eventsService.getOrganisations(),
                eventsService.getVenues(),
            ]);
            setCategories(cats || []);
            setOrganisations(orgs || []);
            setVenues(vens || []);
        } catch (error) {
            console.error('Failed to fetch reference data', error);
            showToast({ message: 'Failed to load form data', type: 'error' });
        }
    };

    const handleSubmit = async () => {
        console.log('🔵 handleSubmit called in leads/add.tsx');
        console.log('📋 Form data:', JSON.stringify(formData, null, 2));

        if (!formData.clientName || !formData.clientEmail || !formData.clientNumber) {
            Alert.alert('Error', 'Please fill in all client details');
            return;
        }
        if (formData.clientCategory.length === 0) {
            Alert.alert('Error', 'Please select a client category');
            return;
        }
        if (!formData.message) {
            Alert.alert('Error', 'Please enter a message/note');
            return;
        }

        console.log('✅ Validation passed, calling API...');
        setLoading(true);
        try {
            // Construct payload
            const payload = {
                client: {
                    name: formData.clientName,
                    email: formData.clientEmail,
                    number: formData.clientNumber,
                    client_category: formData.clientCategory,
                    organisation: formData.organisation,
                },
                venue: isNewVenue ? {
                    name: formData.venueName,
                    address: formData.venueAddress,
                    capacity: parseInt(formData.venueCapacity) || 0,
                    type_of_venue: formData.venueType,
                    region: formData.venueRegion,
                } : formData.venueId!,
                source: formData.source,
                message: formData.message,
                referral: formData.referral,
                type_of_event: formData.typeOfEvent,
                category: formData.category,
                start_date: format(formData.startDate, 'yyyy-MM-dd'),
                end_date: format(formData.endDate, 'yyyy-MM-dd'),
            };

            await eventsService.createLeadComplete(payload);
            showToast({ message: 'Lead created successfully', type: 'success' });
            router.back();
        } catch (error: any) {
            console.error('Create lead error:', error);
            const msg = error.response?.data?.error || 'Failed to create lead';
            Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    const toggleClientCategory = (id: number) => {
        setFormData(prev => {
            const exists = prev.clientCategory.includes(id);
            return {
                ...prev,
                clientCategory: exists
                    ? prev.clientCategory.filter(c => c !== id)
                    : [...prev.clientCategory, id]
            };
        });
    };

    const toggleOrganisation = (id: number) => {
        setFormData(prev => {
            const exists = prev.organisation.includes(id);
            return {
                ...prev,
                organisation: exists
                    ? prev.organisation.filter(o => o !== id)
                    : [...prev.organisation, id]
            };
        });
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: isEditMode ? 'Edit Lead' : 'Add New Lead' }} />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Client Section */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Details</Text>

                    <Input
                        label="Client Name *"
                        value={formData.clientName}
                        onChangeText={(t) => setFormData(prev => ({ ...prev, clientName: t }))}
                        placeholder="Enter client name"
                    />

                    <Input
                        label="Email *"
                        value={formData.clientEmail}
                        onChangeText={(t) => setFormData(prev => ({ ...prev, clientEmail: t }))}
                        placeholder="client@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Phone Number *"
                        value={formData.clientNumber}
                        onChangeText={(t) => setFormData(prev => ({ ...prev, clientNumber: t }))}
                        placeholder="+91 98765 43210"
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Client Category *</Text>
                    <View style={styles.chipContainer}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.chip,
                                    formData.clientCategory.includes(cat.id) && styles.chipSelected
                                ]}
                                onPress={() => toggleClientCategory(cat.id)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    formData.clientCategory.includes(cat.id) && styles.chipTextSelected
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Show Organisation selection if B2B/B2G is selected */}
                    {categories.some(c => formData.clientCategory.includes(c.id) && c.requires_organisation) && (
                        <>
                            <Text style={styles.label}>Organisation (Required for B2B/B2G)</Text>
                            <View style={styles.chipContainer}>
                                {organisations.map(org => (
                                    <TouchableOpacity
                                        key={org.id}
                                        style={[
                                            styles.chip,
                                            formData.organisation.includes(org.id) && styles.chipSelected
                                        ]}
                                        onPress={() => toggleOrganisation(org.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            formData.organisation.includes(org.id) && styles.chipTextSelected
                                        ]}>
                                            {org.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </Card>

                {/* Venue Section */}
                <Card style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>Venue Details</Text>
                        <TouchableOpacity onPress={() => setIsNewVenue(!isNewVenue)}>
                            <Text style={styles.linkText}>{isNewVenue ? 'Select Existing' : 'Create New'}</Text>
                        </TouchableOpacity>
                    </View>

                    {isNewVenue ? (
                        <>
                            <Input
                                label="Venue Name *"
                                value={formData.venueName}
                                onChangeText={(t) => setFormData(prev => ({ ...prev, venueName: t }))}
                                placeholder="Enter venue name"
                            />
                            <Input
                                label="Address"
                                value={formData.venueAddress}
                                onChangeText={(t) => setFormData(prev => ({ ...prev, venueAddress: t }))}
                                placeholder="Full address"
                                multiline
                            />
                            <Input
                                label="Capacity"
                                value={formData.venueCapacity}
                                onChangeText={(t) => setFormData(prev => ({ ...prev, venueCapacity: t }))}
                                placeholder="e.g. 500"
                                keyboardType="numeric"
                            />
                        </>
                    ) : (
                        <Select
                            label="Select Venue *"
                            options={venues.map(v => ({ label: v.name, value: v.id }))}
                            value={formData.venueId}
                            onSelect={(val) => setFormData(prev => ({ ...prev, venueId: val as number }))}
                            placeholder="Choose a venue"
                        />
                    )}
                </Card>

                {/* Event & Lead Info */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Event & Lead Info</Text>

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

                    <Select
                        label="Source *"
                        options={[
                            { label: 'Online', value: 'online' },
                            { label: 'Offline', value: 'offline' },
                        ]}
                        value={formData.source}
                        onSelect={(val) => setFormData(prev => ({ ...prev, source: val as string }))}
                    />

                    <Input
                        label="Referral (Optional)"
                        value={formData.referral}
                        onChangeText={(t) => setFormData(prev => ({ ...prev, referral: t }))}
                        placeholder="Referral source"
                    />

                    <Input
                        label="Notes / Message *"
                        value={formData.message}
                        onChangeText={(t) => setFormData(prev => ({ ...prev, message: t }))}
                        placeholder="Enter lead details..."
                        multiline
                        numberOfLines={4}
                        style={{ height: 100 }}
                    />
                </Card>

                <Button
                    title={isEditMode ? "Update Lead" : "Create Lead"}
                    onPress={handleSubmit}
                    loading={loading}
                    size="lg"
                    fullWidth
                />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    linkText: {
        color: Colors.primary,
        fontWeight: '500',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginTop: 8,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipSelected: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    chipTextSelected: {
        color: Colors.primary,
        fontWeight: '600',
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
});
