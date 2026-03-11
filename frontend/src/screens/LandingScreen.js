import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import UpdateNotificationBanner from '../components/UpdateNotificationBanner';
import { useTheme } from '../context/ThemeContext';
import { APP_VERSION } from '../utils/versionConfig';

export default function LandingScreen({ navigation }) {
    const { colors } = useTheme();

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
                    {/* Costing Tools - 2-column grid */}
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

                    {/* Order Management - featured horizontal cards */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Order Management</Text>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate('TNAList')}
                        activeOpacity={0.8}>
                        <View style={[styles.featureAccent, { backgroundColor: '#e67e22' }]} />
                        <View style={styles.featureBody}>
                            <View style={styles.featureTop}>
                                <View style={[styles.featureIconWrap, { backgroundColor: '#e67e2215' }]}>
                                    <Text style={styles.featureIcon}>📅</Text>
                                </View>
                                <View style={styles.featureInfo}>
                                    <Text style={[styles.featureTitle, { color: colors.text }]}>TNA Calendar</Text>
                                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Time & Action planning with backward scheduling and milestone tracking</Text>
                                </View>
                            </View>
                            <View style={styles.featureTagRow}>
                                <View style={[styles.featureTag, { backgroundColor: '#e67e2212' }]}>
                                    <Text style={[styles.featureTagText, { color: '#e67e22' }]}>Milestones</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: '#e67e2212' }]}>
                                    <Text style={[styles.featureTagText, { color: '#e67e22' }]}>Reminders</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: '#e67e2212' }]}>
                                    <Text style={[styles.featureTagText, { color: '#e67e22' }]}>Status</Text>
                                </View>
                                <View style={{ flex: 1 }} />
                                <Text style={[styles.featureArrow, { color: '#e67e22' }]}>→</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate('SampleList')}
                        activeOpacity={0.8}>
                        <View style={[styles.featureAccent, { backgroundColor: '#9c27b0' }]} />
                        <View style={styles.featureBody}>
                            <View style={styles.featureTop}>
                                <View style={[styles.featureIconWrap, { backgroundColor: '#9c27b015' }]}>
                                    <Text style={styles.featureIcon}>🧪</Text>
                                </View>
                                <View style={styles.featureInfo}>
                                    <Text style={[styles.featureTitle, { color: colors.text }]}>Sample Tracking</Text>
                                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Track sample stages from development to shipment with photos & approvals</Text>
                                </View>
                            </View>
                            <View style={styles.featureTagRow}>
                                <View style={[styles.featureTag, { backgroundColor: '#9c27b012' }]}>
                                    <Text style={[styles.featureTagText, { color: '#9c27b0' }]}>6 Stages</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: '#9c27b012' }]}>
                                    <Text style={[styles.featureTagText, { color: '#9c27b0' }]}>Photos</Text>
                                </View>
                                <View style={[styles.featureTag, { backgroundColor: '#9c27b012' }]}>
                                    <Text style={[styles.featureTagText, { color: '#9c27b0' }]}>Approvals</Text>
                                </View>
                                <View style={{ flex: 1 }} />
                                <Text style={[styles.featureArrow, { color: '#9c27b0' }]}>→</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
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
    logoWrapper: { width: 80, height: 80, borderRadius: 22, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#007bff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
    logo: { width: 52, height: 52 },
    appName: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    tagline: { fontSize: 14, marginTop: 4, letterSpacing: 0.3 },

    mainContent: { flex: 1, paddingTop: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginHorizontal: 20, marginBottom: 10, marginTop: 4 },

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

    footer: { alignItems: 'center', paddingVertical: 20, paddingBottom: 32 },
    version: { fontSize: 12 },
});
