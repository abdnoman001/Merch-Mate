import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import uuid from 'react-native-uuid';
import { useTheme } from '../context/ThemeContext';
import { saveSampleTracker } from '../utils/storageService';

const ACCENT = '#9c27b0';

const DEFAULT_STAGES = [
    { stageName: 'Development Sample', stageOrder: 1 },
    { stageName: 'Proto Sample', stageOrder: 2 },
    { stageName: 'PP Sample', stageOrder: 3 },
    { stageName: 'Counter Sample', stageOrder: 4 },
    { stageName: 'TOP Sample', stageOrder: 5 },
    { stageName: 'Shipment Sample', stageOrder: 6 },
];

const SampleCreateScreen = ({ navigation }) => {
    const { colors } = useTheme();

    const [orderNo, setOrderNo] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [style, setStyle] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!orderNo.trim()) {
            Alert.alert('Missing Field', 'Please enter an Order No.');
            return;
        }
        if (!buyerName.trim()) {
            Alert.alert('Missing Field', 'Please enter a Buyer Name.');
            return;
        }
        if (!style.trim()) {
            Alert.alert('Missing Field', 'Please enter a Style.');
            return;
        }

        setSaving(true);

        try {
            const sample = {
                id: uuid.v4(),
                orderId: uuid.v4(),
                orderNo: orderNo.trim(),
                buyerName: buyerName.trim(),
                style: style.trim(),
                stages: DEFAULT_STAGES.map((stage) => ({
                    id: uuid.v4(),
                    stageName: stage.stageName,
                    stageOrder: stage.stageOrder,
                    status: 'pending',
                    submittedDate: null,
                    approvedDate: null,
                    buyerComments: '',
                    photos: [],
                    notes: '',
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await saveSampleTracker(sample);

            Alert.alert(
                'Success',
                'Sample tracker created successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to save sample tracker. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>🧪</Text>
                    <Text style={styles.headerTitle}>Create Sample Tracker</Text>
                    <Text style={styles.headerSubtitle}>Track sample stages from development to shipment</Text>
                </View>

                {/* Order Info Card */}
                <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: ACCENT }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>📦</Text>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Order Information</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Order No. *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={orderNo}
                                onChangeText={setOrderNo}
                                placeholder="e.g. PO-2024-001"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Buyer Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={buyerName}
                                onChangeText={setBuyerName}
                                placeholder="e.g. H&M, Zara"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Style *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={style}
                                onChangeText={setStyle}
                                placeholder="e.g. SS24-POLO-001"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>
                </View>

                {/* Preview Stages Card */}
                <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: ACCENT }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>🔬</Text>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Sample Stages</Text>
                        <View style={styles.stageBadge}>
                            <Text style={styles.stageBadgeText}>{DEFAULT_STAGES.length}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                        These stages will be auto-created for tracking.
                    </Text>
                    <View style={styles.stageList}>
                        {DEFAULT_STAGES.map((stage, index) => (
                            <View
                                key={stage.stageOrder}
                                style={[
                                    styles.stageRow,
                                    { borderBottomColor: colors.border },
                                    index === DEFAULT_STAGES.length - 1 && { borderBottomWidth: 0 },
                                ]}
                            >
                                <View style={styles.stageIndex}>
                                    <Text style={styles.stageIndexText}>{stage.stageOrder}</Text>
                                </View>
                                <View style={styles.stageInfo}>
                                    <Text style={[styles.stageName, { color: colors.text }]}>
                                        {stage.stageName}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: colors.background }]}>
                                    <Text style={styles.statusDot}>⏳</Text>
                                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>Pending</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonIcon}>💾</Text>
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Saving...' : 'CREATE SAMPLE TRACKER'}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        backgroundColor: ACCENT,
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        marginHorizontal: 16,
    },
    headerIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
    },

    // Cards
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    cardIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    cardContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cardHint: {
        fontSize: 13,
        paddingHorizontal: 16,
        marginBottom: 8,
        lineHeight: 18,
    },

    // Inputs
    inputWrapper: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },

    // Stage badge
    stageBadge: {
        backgroundColor: ACCENT + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stageBadgeText: {
        fontSize: 12,
        color: ACCENT,
        fontWeight: '700',
    },

    // Stage list
    stageList: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    stageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    stageIndex: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: ACCENT + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stageIndexText: {
        fontSize: 12,
        fontWeight: '700',
        color: ACCENT,
    },
    stageInfo: {
        flex: 1,
    },
    stageName: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Status badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusDot: {
        fontSize: 12,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Save button
    saveButton: {
        flexDirection: 'row',
        backgroundColor: ACCENT,
        marginHorizontal: 16,
        marginTop: 8,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default SampleCreateScreen;
