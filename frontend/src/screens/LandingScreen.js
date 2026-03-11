import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { differenceInDays, format, startOfDay } from 'date-fns';
import UpdateNotificationBanner from '../components/UpdateNotificationBanner';
import { useTheme } from '../context/ThemeContext';
import { getAllSampleTrackers, getAllTNAs } from '../utils/storageService';

const TNA_COLOR = '#e67e22';
const SAMPLE_COLOR = '#9c27b0';

const TNA_STATUS_COLORS = {
    'on-track': '#28a745',
    'at-risk': '#ffc107',
    delayed: '#dc3545',
    completed: '#6c757d',
};

const SAMPLE_STATUS_COLORS = {
    pending: '#6c757d',
    submitted: '#007bff',
    approved: '#28a745',
    rejected: '#dc3545',
    revision: '#e67e22',
};

const computeMilestoneStatus = (milestone, today) => {
    if (milestone.completedAt) return 'completed';
    const due = startOfDay(new Date(milestone.dueDate));
    const diff = differenceInDays(due, today);
    if (diff < 0) return 'delayed';
    if (diff <= 3) return 'at-risk';
    return 'on-track';
};

const getActiveStage = (stages) => {
    if (!stages || stages.length === 0) return null;
    const sorted = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);
    return sorted.find((s) => s.status !== 'approved') || sorted[sorted.length - 1];
};

export default function LandingScreen({ navigation }) {
    const { colors } = useTheme();
    const [tnas, setTnas] = useState([]);
    const [samples, setSamples] = useState([]);
    const [loaded, setLoaded] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [allTnas, allSamples] = await Promise.all([
                getAllTNAs(),
                getAllSampleTrackers(),
            ]);
            const today = startOfDay(new Date());
            for (const tna of allTnas) {
                if (!tna.milestones) continue;
                tna.milestones = tna.milestones.map((m) => ({
                    ...m,
                    status: computeMilestoneStatus(m, today),
                }));
            }
            setTnas(allTnas);
            setSamples(allSamples);
        } catch {
            setTnas([]);
            setSamples([]);
        }
        setLoaded(true);
    }, []);

    useEffect(() => {
        loadData();
        const unsub = navigation.addListener('focus', loadData);
        return unsub;
    }, [navigation, loadData]);

    // ─── TNA stats ───
    const allMilestones = tnas.flatMap((t) => t.milestones || []);
    const delayedCount = allMilestones.filter((m) => m.status === 'delayed').length;
    const atRiskCount = allMilestones.filter((m) => m.status === 'at-risk').length;

    // Top 3 urgent TNA milestones (delayed/at-risk, nearest due first)
    const urgentMilestones = [];
    for (const tna of tnas) {
        for (const m of tna.milestones || []) {
            if (m.status === 'delayed' || m.status === 'at-risk') {
                urgentMilestones.push({ ...m, tnaId: tna.id, orderNo: tna.orderNo, buyerName: tna.buyerName });
            }
        }
    }
    urgentMilestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const topUrgent = urgentMilestones.slice(0, 3);

    // ─── Sample stats ───
    const activeSamples = samples.filter((s) => {
        const stages = s.stages || [];
        return !stages.every((st) => st.status === 'approved');
    });
    const pendingApprovalCount = samples.filter((s) =>
        (s.stages || []).some((st) => st.status === 'submitted')
    ).length;
    const topSamples = activeSamples.slice(0, 3);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <UpdateNotificationBanner />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.settingsButton, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate('Settings')}
                        activeOpacity={0.7}>
                        <Text style={styles.settingsIcon}>☰</Text>
                    </TouchableOpacity>
                    <Text style={[styles.appName, { color: colors.text }]}>MerchMate</Text>
                </View>

                <View style={styles.mainContent}>

                    {/* ─── Activity Overview (only if data exists) ─── */}
                    {loaded && (tnas.length > 0 || samples.length > 0) && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Activity Overview</Text>
                            <View style={styles.statsRow}>
                                <TouchableOpacity
                                    style={[styles.statCard, { backgroundColor: colors.card }]}
                                    onPress={() => navigation.navigate('TNAList')}
                                    activeOpacity={0.7}>
                                    <Text style={styles.statIcon}>📅</Text>
                                    <Text style={[styles.statNum, { color: colors.text }]}>{tnas.length}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TNA Orders</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statCard, { backgroundColor: colors.card }]}
                                    onPress={() => navigation.navigate('TNAList')}
                                    activeOpacity={0.7}>
                                    <Text style={styles.statIcon}>⚠️</Text>
                                    <Text style={[styles.statNum, { color: delayedCount > 0 ? '#dc3545' : colors.text }]}>{delayedCount + atRiskCount}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TNA Alerts</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statCard, { backgroundColor: colors.card }]}
                                    onPress={() => navigation.navigate('SampleList')}
                                    activeOpacity={0.7}>
                                    <Text style={styles.statIcon}>🧪</Text>
                                    <Text style={[styles.statNum, { color: colors.text }]}>{activeSamples.length}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Samples</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statCard, { backgroundColor: colors.card }]}
                                    onPress={() => navigation.navigate('SampleList')}
                                    activeOpacity={0.7}>
                                    <Text style={styles.statIcon}>📨</Text>
                                    <Text style={[styles.statNum, { color: pendingApprovalCount > 0 ? '#007bff' : colors.text }]}>{pendingApprovalCount}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Awaiting Approval</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* ─── TNA Alerts ─── */}
                    {topUrgent.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>TNA Alerts</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('TNAList')}>
                                    <Text style={[styles.seeAll, { color: TNA_COLOR }]}>See All →</Text>
                                </TouchableOpacity>
                            </View>
                            {topUrgent.map((m, i) => {
                                const statusColor = TNA_STATUS_COLORS[m.status] || TNA_STATUS_COLORS['on-track'];
                                const today = startOfDay(new Date());
                                const due = startOfDay(new Date(m.dueDate));
                                const diff = differenceInDays(due, today);
                                const dueLabel = diff < 0
                                    ? `${Math.abs(diff)}d overdue`
                                    : diff === 0
                                        ? 'Due today'
                                        : `${diff}d left`;
                                return (
                                    <TouchableOpacity
                                        key={m.id + '-' + i}
                                        style={[styles.alertCard, { backgroundColor: colors.card, borderLeftColor: statusColor }]}
                                        onPress={() => navigation.navigate('TNADetail', { tnaId: m.tnaId })}
                                        activeOpacity={0.7}>
                                        <View style={styles.alertTop}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.alertMilestone, { color: colors.text }]} numberOfLines={1}>{m.name}</Text>
                                                <Text style={[styles.alertOrder, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {m.orderNo}{m.buyerName ? ` \u2022 ${m.buyerName}` : ''}
                                                </Text>
                                            </View>
                                            <View style={[styles.alertBadge, { backgroundColor: statusColor + '18' }]}>
                                                <Text style={[styles.alertBadgeText, { color: statusColor }]}>{dueLabel}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.alertDue, { color: colors.textSecondary }]}>
                                            Due: {format(new Date(m.dueDate), 'dd MMM yyyy')}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}

                    {/* ─── Active Samples ─── */}
                    {topSamples.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>Active Samples</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SampleList')}>
                                    <Text style={[styles.seeAll, { color: SAMPLE_COLOR }]}>See All →</Text>
                                </TouchableOpacity>
                            </View>
                            {topSamples.map((s) => {
                                const active = getActiveStage(s.stages || []);
                                const activeStatus = active ? active.status : 'pending';
                                const statusColor = SAMPLE_STATUS_COLORS[activeStatus];
                                const completedStages = (s.stages || []).filter((st) => st.status === 'approved').length;
                                const totalStages = (s.stages || []).length;
                                return (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.sampleCard, { backgroundColor: colors.card, borderLeftColor: SAMPLE_COLOR }]}
                                        onPress={() => navigation.navigate('SampleDetail', { sampleId: s.id })}
                                        activeOpacity={0.7}>
                                        <View style={styles.sampleTop}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.sampleOrder, { color: colors.text }]} numberOfLines={1}>{s.orderNo || 'No Order'}</Text>
                                                <Text style={[styles.sampleBuyer, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {s.buyerName || 'No buyer'}{s.style ? ` \u2022 ${s.style}` : ''}
                                                </Text>
                                            </View>
                                            <View style={[styles.sampleBadge, { backgroundColor: statusColor + '18' }]}>
                                                <View style={[styles.sampleBadgeDot, { backgroundColor: statusColor }]} />
                                                <Text style={[styles.sampleBadgeText, { color: statusColor }]}>
                                                    {activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[styles.sampleMeta, { backgroundColor: colors.background }]}>
                                            <Text style={[styles.sampleMetaLabel, { color: colors.textSecondary }]}>
                                                Current: <Text style={[styles.sampleMetaValue, { color: colors.text }]}>{active ? active.stageName : '--'}</Text>
                                            </Text>
                                            <Text style={[styles.sampleMetaLabel, { color: colors.textSecondary }]}>
                                                {completedStages}/{totalStages} stages done
                                            </Text>
                                        </View>
                                        {/* Mini progress bar */}
                                        <View style={styles.miniProgressBar}>
                                            <View style={[styles.miniProgressFill, { width: totalStages > 0 ? `${(completedStages / totalStages) * 100}%` : '0%' }]} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}

                    {/* ─── Costing Tools ─── */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Costing Tools</Text>
                    <View style={styles.gridContainer}>
                        <TouchableOpacity
                            style={[styles.gridCard, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('Input')}
                            activeOpacity={0.8}>
                            <View style={[styles.gridIconWrap, { backgroundColor: '#007bff15' }]}>
                                <Text style={styles.gridIcon}>📝</Text>
                            </View>
                            <Text style={[styles.gridTitle, { color: colors.text }]}>FOB Cost Sheet</Text>
                            <Text style={[styles.gridDesc, { color: colors.textSecondary }]}>Fabric, trims & CM costing</Text>
                            <View style={[styles.gridBadge, { backgroundColor: '#007bff' }]}>
                                <Text style={styles.gridBadgeText}>Open</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gridCard, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('FabricAnalyzerInput')}
                            activeOpacity={0.8}>
                            <View style={[styles.gridIconWrap, { backgroundColor: '#28a74515' }]}>
                                <Text style={styles.gridIcon}>🧵</Text>
                            </View>
                            <Text style={[styles.gridTitle, { color: colors.text }]}>Fabric Analyzer</Text>
                            <Text style={[styles.gridDesc, { color: colors.textSecondary }]}>Consumption & efficiency</Text>
                            <View style={[styles.gridBadge, { backgroundColor: '#28a745' }]}>
                                <Text style={styles.gridBadgeText}>Open</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gridCard, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('BuyerAnalyzerInput')}
                            activeOpacity={0.8}>
                            <View style={[styles.gridIconWrap, { backgroundColor: '#6f42c115' }]}>
                                <Text style={styles.gridIcon}>📊</Text>
                            </View>
                            <Text style={[styles.gridTitle, { color: colors.text }]}>Margin Analyzer</Text>
                            <Text style={[styles.gridDesc, { color: colors.textSecondary }]}>Buyer price & margins</Text>
                            <View style={[styles.gridBadge, { backgroundColor: '#6f42c1' }]}>
                                <Text style={styles.gridBadgeText}>Open</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gridCard, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate('History')}
                            activeOpacity={0.8}>
                            <View style={[styles.gridIconWrap, { backgroundColor: '#6c757d15' }]}>
                                <Text style={styles.gridIcon}>📂</Text>
                            </View>
                            <Text style={[styles.gridTitle, { color: colors.text }]}>History</Text>
                            <Text style={[styles.gridDesc, { color: colors.textSecondary }]}>Saved sheets & analyses</Text>
                            <View style={[styles.gridBadge, { backgroundColor: '#6c757d' }]}>
                                <Text style={styles.gridBadgeText}>Open</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* ─── Order Management ─── */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Order Management</Text>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate('TNAList')}
                        activeOpacity={0.8}>
                        <View style={[styles.featureAccent, { backgroundColor: TNA_COLOR }]} />
                        <View style={styles.featureBody}>
                            <View style={styles.featureTop}>
                                <View style={[styles.featureIconWrap, { backgroundColor: TNA_COLOR + '15' }]}>
                                    <Text style={styles.featureIcon}>📅</Text>
                                </View>
                                <View style={styles.featureInfo}>
                                    <Text style={[styles.featureTitle, { color: colors.text }]}>TNA Calendar</Text>
                                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Time & Action planning with backward scheduling and milestone tracking</Text>
                                </View>
                            </View>
                            <View style={styles.featureTagRow}>
                                <View style={[styles.featureTag, { backgroundColor: TNA_COLOR + '12' }]}>
                                    <Text style={[styles.featureTagText, { color: TNA_COLOR }]}>Milestones</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: TNA_COLOR + '12' }]}>
                                    <Text style={[styles.featureTagText, { color: TNA_COLOR }]}>Reminders</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: TNA_COLOR + '12' }]}>
                                    <Text style={[styles.featureTagText, { color: TNA_COLOR }]}>Status</Text>
                                </View>
                                <View style={{ flex: 1 }} />
                                <Text style={[styles.featureArrow, { color: TNA_COLOR }]}>→</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate('SampleList')}
                        activeOpacity={0.8}>
                        <View style={[styles.featureAccent, { backgroundColor: SAMPLE_COLOR }]} />
                        <View style={styles.featureBody}>
                            <View style={styles.featureTop}>
                                <View style={[styles.featureIconWrap, { backgroundColor: SAMPLE_COLOR + '15' }]}>
                                    <Text style={styles.featureIcon}>🧪</Text>
                                </View>
                                <View style={styles.featureInfo}>
                                    <Text style={[styles.featureTitle, { color: colors.text }]}>Sample Tracking</Text>
                                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Track sample stages from development to shipment with photos & approvals</Text>
                                </View>
                            </View>
                            <View style={styles.featureTagRow}>
                                <View style={[styles.featureTag, { backgroundColor: SAMPLE_COLOR + '12' }]}>
                                    <Text style={[styles.featureTagText, { color: SAMPLE_COLOR }]}>6 Stages</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: SAMPLE_COLOR + '12' }]}>
                                    <Text style={[styles.featureTagText, { color: SAMPLE_COLOR }]}>Photos</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: SAMPLE_COLOR + '12' }]}>
                                    <Text style={[styles.featureTagText, { color: SAMPLE_COLOR }]}>Approvals</Text>
                                </View>
                                <View style={{ flex: 1 }} />
                                <Text style={[styles.featureArrow, { color: SAMPLE_COLOR }]}>→</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 32 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    settingsButton: { position: 'absolute', top: 60, right: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    settingsIcon: { fontSize: 20 },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
    appName: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },

    mainContent: { flex: 1, paddingTop: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginHorizontal: 20, marginBottom: 10, marginTop: 4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 10, marginTop: 4 },
    seeAll: { fontSize: 12, fontWeight: '700' },

    /* Stats Row */
    statsRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    statIcon: { fontSize: 18, marginBottom: 4 },
    statNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' },

    /* TNA Alert Cards */
    alertCard: { marginHorizontal: 14, marginBottom: 8, borderRadius: 12, padding: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    alertTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    alertMilestone: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
    alertOrder: { fontSize: 12 },
    alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
    alertBadgeText: { fontSize: 10, fontWeight: '700' },
    alertDue: { fontSize: 11 },

    /* Sample Cards */
    sampleCard: { marginHorizontal: 14, marginBottom: 8, borderRadius: 12, padding: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, overflow: 'hidden' },
    sampleTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sampleOrder: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
    sampleBuyer: { fontSize: 12 },
    sampleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8, gap: 4 },
    sampleBadgeDot: { width: 6, height: 6, borderRadius: 3 },
    sampleBadgeText: { fontSize: 10, fontWeight: '700' },
    sampleMeta: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
    sampleMetaLabel: { fontSize: 11 },
    sampleMetaValue: { fontWeight: '700' },
    miniProgressBar: { height: 3, backgroundColor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' },
    miniProgressFill: { height: '100%', backgroundColor: SAMPLE_COLOR, borderRadius: 2 },

    /* 2x2 Grid */
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 },
    gridCard: { width: '48%', flexGrow: 1, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    gridIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    gridIcon: { fontSize: 22 },
    gridTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
    gridDesc: { fontSize: 11, lineHeight: 15, marginBottom: 10 },
    gridBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    gridBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    /* Feature Cards */
    featureCard: { marginHorizontal: 14, marginBottom: 10, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    featureAccent: { width: 5 },
    featureBody: { flex: 1, padding: 14 },
    featureTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    featureIconWrap: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    featureIcon: { fontSize: 23 },
    featureInfo: { flex: 1 },
    featureTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
    featureDesc: { fontSize: 12, lineHeight: 17 },
    featureTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    featureTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    featureTagText: { fontSize: 10, fontWeight: '700' },
    featureArrow: { fontSize: 20, fontWeight: '700' },
});
