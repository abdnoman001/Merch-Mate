import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import UpdateNotificationBanner from '../components/UpdateNotificationBanner';
import { useTheme } from '../context/ThemeContext';
import { APP_VERSION } from '../utils/versionConfig';

export default function LandingScreen({ navigation }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Settings Button */}
            <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}>
                <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Update Notification Banner */}
                <UpdateNotificationBanner />

                {/* Header Section */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <View style={styles.logoWrapper}>
                        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>MerchMate</Text>
                    <Text style={[styles.tagline, { color: colors.textSecondary }]}>Professional Garment Costing Suite</Text>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {/* Quick Actions */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Actions</Text>
                    <View style={styles.cardsContainer}>
                        {/* FOB Costing Card */}
                        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Input')} activeOpacity={0.85}>
                            <View style={styles.cardIconContainer}>
                                <Text style={styles.cardIcon}>📝</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>FOB Cost Sheet</Text>
                                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>Calculate garment costing with fabric, trims & CM</Text>
                            </View>
                            <View style={styles.cardArrow}><Text style={styles.arrowText}>→</Text></View>
                        </TouchableOpacity>

                        {/* Fabric Analyzer Card */}
                        <TouchableOpacity style={[styles.card, styles.fabricCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('FabricAnalyzerInput')} activeOpacity={0.85}>
                            <View style={[styles.cardIconContainer, styles.fabricIconContainer]}>
                                <Text style={styles.cardIcon}>🧵</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Fabric Analyzer</Text>
                                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>Calculate consumption & marker efficiency</Text>
                            </View>
                            <View style={[styles.cardArrow, styles.fabricArrow]}><Text style={styles.arrowText}>→</Text></View>
                        </TouchableOpacity>

                        {/* Margin Analyzer Card */}
                        <TouchableOpacity style={[styles.card, styles.marginCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('BuyerAnalyzerInput')} activeOpacity={0.85}>
                            <View style={[styles.cardIconContainer, styles.marginIconContainer]}>
                                <Text style={styles.cardIcon}>📊</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Margin Analyzer</Text>
                                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>Buyer price analysis & negotiation insights</Text>
                            </View>
                            <View style={[styles.cardArrow, styles.marginArrow]}><Text style={styles.arrowText}>→</Text></View>
                        </TouchableOpacity>

                        {/* History Card */}
                        <TouchableOpacity style={[styles.card, styles.historyCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('History')} activeOpacity={0.85}>
                            <View style={[styles.cardIconContainer, styles.historyIconContainer]}>
                                <Text style={styles.cardIcon}>📂</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>View History</Text>
                                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>Access saved cost sheets & analyses</Text>
                            </View>
                            <View style={[styles.cardArrow, styles.historyArrow]}><Text style={styles.arrowText}>→</Text></View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.version}>v{APP_VERSION}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    settingsButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    settingsIcon: { fontSize: 20 },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, backgroundColor: '#fff', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
    logoWrapper: { width: 90, height: 90, borderRadius: 24, backgroundColor: '#f5f7fa', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#007bff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
    logo: { width: 60, height: 60 },
    appName: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
    tagline: { fontSize: 15, color: '#666', marginTop: 6, letterSpacing: 0.3 },
    mainContent: { flex: 1, paddingTop: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 20, marginBottom: 12 },
    cardsContainer: { paddingHorizontal: 16 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#007bff' },
    fabricCard: { borderLeftColor: '#28a745' },
    marginCard: { borderLeftColor: '#6f42c1' },
    historyCard: { borderLeftColor: '#6c757d' },
    cardIconContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#007bff15', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    fabricIconContainer: { backgroundColor: '#28a74515' },
    marginIconContainer: { backgroundColor: '#6f42c115' },
    historyIconContainer: { backgroundColor: '#6c757d15' },
    cardIcon: { fontSize: 26 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
    cardDescription: { fontSize: 13, color: '#777', lineHeight: 18 },
    cardArrow: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#007bff', alignItems: 'center', justifyContent: 'center' },
    fabricArrow: { backgroundColor: '#28a745' },
    marginArrow: { backgroundColor: '#6f42c1' },
    historyArrow: { backgroundColor: '#6c757d' },
    arrowText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    footer: { alignItems: 'center', paddingVertical: 20, paddingBottom: 32 },
    footerText: { fontSize: 13, color: '#999', marginBottom: 4 },
    version: { fontSize: 12, color: '#bbb' },
});
