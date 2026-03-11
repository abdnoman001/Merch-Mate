import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getAllSampleTrackers } from '../utils/storageService';

const FILTERS = ['All', 'Pending Approval', 'Approved', 'Rejected'];

const STAGE_STATUS_COLORS = {
    approved: '#28a745',
    submitted: '#007bff',
    revision: '#e67e22',
    rejected: '#dc3545',
    pending: '#ccc',
};

const ACCENT = '#9c27b0';

const getActiveStage = (stages) => {
    if (!stages || stages.length === 0) return null;
    const sorted = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);
    const firstNonCompleted = sorted.find((s) => s.status !== 'approved');
    return firstNonCompleted || sorted[sorted.length - 1];
};

const getOverallFilter = (stages) => {
    if (!stages || stages.length === 0) return 'pending';
    const hasRejected = stages.some((s) => s.status === 'rejected');
    if (hasRejected) return 'rejected';
    const allApproved = stages.every((s) => s.status === 'approved');
    if (allApproved) return 'approved';
    const hasSubmitted = stages.some((s) => s.status === 'submitted');
    if (hasSubmitted) return 'pending_approval';
    return 'pending';
};

const getStatusLabel = (status) => {
    const labels = {
        approved: 'Approved',
        submitted: 'Submitted',
        revision: 'Revision',
        rejected: 'Rejected',
        pending: 'Pending',
    };
    return labels[status] || 'Pending';
};

const SampleListScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const all = await getAllSampleTrackers();
            setSamples(all);
        } catch (error) {
            console.error('Error loading sample trackers:', error);
            setSamples([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation, loadData]);

    const filteredSamples = samples.filter((sample) => {
        if (activeFilter === 'All') return true;
        const filterKey = getOverallFilter(sample.stages);
        if (activeFilter === 'Pending Approval') return filterKey === 'pending_approval';
        if (activeFilter === 'Approved') return filterKey === 'approved';
        if (activeFilter === 'Rejected') return filterKey === 'rejected';
        return true;
    });

    const renderFilterBar = () => (
        <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {FILTERS.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterChip,
                            { backgroundColor: colors.card },
                            isActive && styles.filterChipActive,
                        ]}
                        onPress={() => setActiveFilter(filter)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                { color: colors.textSecondary },
                                isActive && styles.filterChipTextActive,
                            ]}
                        >
                            {filter}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderStageDots = (stages) => {
        if (!stages || stages.length === 0) return null;
        const sorted = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);
        return (
            <View style={styles.stageDotsContainer}>
                {sorted.map((stage, index) => (
                    <Text
                        key={stage.id || index}
                        style={[
                            styles.stageDot,
                            { color: STAGE_STATUS_COLORS[stage.status] || STAGE_STATUS_COLORS.pending },
                        ]}
                    >
                        {stage.status === 'pending' ? '\u25CB' : '\u25CF'}
                    </Text>
                ))}
            </View>
        );
    };

    const renderStatusBadge = (status) => {
        const color = STAGE_STATUS_COLORS[status] || STAGE_STATUS_COLORS.pending;
        const label = getStatusLabel(status);
        return (
            <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
            </View>
        );
    };

    const renderItem = ({ item }) => {
        const stages = item.stages || [];
        const activeStage = getActiveStage(stages);
        const activeStatus = activeStage ? activeStage.status : 'pending';

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => navigation.navigate('SampleDetail', { sampleId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardLeft}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.cardIcon}>🧪</Text>
                            </View>
                        </View>
                        <View style={styles.cardInfo}>
                            <Text
                                style={[styles.cardTitle, { color: colors.text }]}
                                numberOfLines={1}
                            >
                                {item.orderNo || 'No Order No.'}
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                {item.buyerName || 'No buyer'}
                                {item.style ? ` \u2022 ${item.style}` : ''}
                            </Text>
                        </View>
                        {renderStatusBadge(activeStatus)}
                    </View>

                    <View style={[styles.cardMeta, { backgroundColor: colors.background }]}>
                        <View style={styles.metaItem}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                                CURRENT STAGE
                            </Text>
                            <Text style={[styles.metaValue, { color: colors.text }]}>
                                {activeStage ? activeStage.stageName : '--'}
                            </Text>
                        </View>
                        <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.metaItem}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                                PROGRESS
                            </Text>
                            {renderStageDots(stages)}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>🧪</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Sample Trackers Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Create your first sample tracker to start managing sample approvals across stages
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('SampleCreate')}
            >
                <Text style={styles.emptyButtonText}>+ Create Sample Tracker</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Sample Tracker</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {samples.length} {samples.length === 1 ? 'tracker' : 'trackers'}
                </Text>
            </View>

            {renderFilterBar()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading...
                    </Text>
                </View>
            ) : filteredSamples.length === 0 && activeFilter === 'All' ? (
                renderEmptyState()
            ) : filteredSamples.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Text style={styles.emptyIconText}>🔍</Text>
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        No sample trackers with "{activeFilter}" status
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredSamples}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('SampleCreate')}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a2e',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    filterBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    filterChipActive: {
        backgroundColor: ACCENT,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
        borderLeftWidth: 4,
        borderLeftColor: ACCENT,
    },
    cardContent: {
        padding: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardLeft: {
        marginRight: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: ACCENT + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardIcon: {
        fontSize: 22,
    },
    cardInfo: {
        flex: 1,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 5,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    cardMeta: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 10,
    },
    metaItem: {
        flex: 1,
    },
    metaDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 12,
    },
    metaLabel: {
        fontSize: 10,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    stageDotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    stageDot: {
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#fff',
        marginTop: -2,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#888',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: ACCENT + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyIconText: {
        fontSize: 36,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyButton: {
        backgroundColor: ACCENT,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default SampleListScreen;
