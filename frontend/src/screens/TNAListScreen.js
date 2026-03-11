import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { differenceInDays, format, startOfDay } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { getAllTNAs, updateTNA } from '../utils/storageService';

const FILTERS = ['All', 'Delayed', 'At-Risk', 'On-Track'];

const STATUS_COLORS = {
    'on-track': '#28a745',
    'at-risk': '#ffc107',
    delayed: '#dc3545',
    completed: '#6c757d',
};

const STATUS_PRIORITY = { delayed: 0, 'at-risk': 1, 'on-track': 2, completed: 3 };

const ACCENT = '#e67e22';

const computeMilestoneStatus = (milestone, today) => {
    if (milestone.completedAt) return 'completed';
    const due = startOfDay(new Date(milestone.dueDate));
    const diff = differenceInDays(due, today);
    if (diff < 0) return 'delayed';
    if (diff <= 3) return 'at-risk';
    return 'on-track';
};

const getOverallStatus = (milestones) => {
    if (!milestones || milestones.length === 0) return 'on-track';
    let worst = 'completed';
    for (const m of milestones) {
        const s = m.status || 'on-track';
        if (STATUS_PRIORITY[s] < STATUS_PRIORITY[worst]) {
            worst = s;
        }
    }
    return worst;
};

const TNAListScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [tnas, setTnas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const all = await getAllTNAs();
            const today = startOfDay(new Date());

            for (const tna of all) {
                if (!tna.milestones || tna.milestones.length === 0) continue;
                let changed = false;
                const updatedMilestones = tna.milestones.map((m) => {
                    const newStatus = computeMilestoneStatus(m, today);
                    if (m.status !== newStatus) {
                        changed = true;
                        return { ...m, status: newStatus };
                    }
                    return m;
                });

                if (changed) {
                    tna.milestones = updatedMilestones;
                    await updateTNA(tna.id, { milestones: updatedMilestones });
                }
            }

            setTnas(all);
        } catch (error) {
            console.error('Error loading TNAs:', error);
            setTnas([]);
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

    const filteredTnas = tnas.filter((tna) => {
        if (activeFilter === 'All') return true;
        const overall = getOverallStatus(tna.milestones);
        const filterKey = activeFilter.toLowerCase();
        return overall === filterKey;
    });

    const getCompletedCount = (milestones) => {
        if (!milestones) return 0;
        return milestones.filter((m) => m.completedAt).length;
    };

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

    const renderStatusBadge = (status) => {
        const color = STATUS_COLORS[status] || STATUS_COLORS['on-track'];
        const label = status
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join('-');
        return (
            <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
            </View>
        );
    };

    const renderItem = ({ item }) => {
        const milestones = item.milestones || [];
        const completedCount = getCompletedCount(milestones);
        const totalCount = milestones.length;
        const overallStatus = getOverallStatus(milestones);
        const shipDate = item.shipmentDate
            ? format(new Date(item.shipmentDate), 'dd MMM yyyy')
            : '--';

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => navigation.navigate('TNADetail', { tnaId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardLeft}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.cardIcon}>📋</Text>
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
                        {renderStatusBadge(overallStatus)}
                    </View>

                    <View style={[styles.cardMeta, { backgroundColor: colors.background }]}>
                        <View style={styles.metaItem}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                                SHIPMENT DATE
                            </Text>
                            <Text style={[styles.metaValue, { color: colors.text }]}>
                                {shipDate}
                            </Text>
                        </View>
                        <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.metaItem}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                                PROGRESS
                            </Text>
                            <Text style={[styles.metaValue, { color: ACCENT }]}>
                                {completedCount}/{totalCount} milestones done
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width:
                                        totalCount > 0
                                            ? `${(completedCount / totalCount) * 100}%`
                                            : '0%',
                                },
                            ]}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📋</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No TNA Entries Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Create your first Time & Action plan to start tracking order milestones
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('TNACreate')}
            >
                <Text style={styles.emptyButtonText}>+ Create TNA</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Time & Action</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {tnas.length} {tnas.length === 1 ? 'entry' : 'entries'}
                </Text>
            </View>

            {renderFilterBar()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading...
                    </Text>
                </View>
            ) : filteredTnas.length === 0 && activeFilter === 'All' ? (
                renderEmptyState()
            ) : filteredTnas.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Text style={styles.emptyIconText}>🔍</Text>
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        No TNA entries with "{activeFilter}" status
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTnas}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('TNACreate')}
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
        marginBottom: 10,
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
    progressBarContainer: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: ACCENT,
        borderRadius: 2,
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

export default TNAListScreen;
