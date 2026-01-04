import { useState } from 'react';
import { Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LandingScreen({ navigation }) {
    const [menuVisible, setMenuVisible] = useState(false);

    const handleDeveloper = () => {
        setMenuVisible(false);
        navigation.navigate('Developer');
    };

    const handleReport = () => {
        setMenuVisible(false);
        Linking.openURL('mailto:abdnoman001@gmail.com?subject=MerchMate%20Bug%20Report');
    };

    const handleAbout = () => {
        setMenuVisible(false);
        navigation.navigate('About');
    };

    return (
        <View style={styles.container}>
            {/* Menu Button */}
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)} activeOpacity={0.7}>
                <Text style={styles.menuDots}>⋮</Text>
            </TouchableOpacity>

            {/* Dropdown Menu Modal */}
            <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuDropdown}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleDeveloper}>
                            <Text style={styles.menuItemIcon}>👨‍💻</Text>
                            <Text style={styles.menuItemText}>Developer Info</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                            <Text style={styles.menuItemIcon}>🐛</Text>
                            <Text style={styles.menuItemText}>Report Issue</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
                            <Text style={styles.menuItemIcon}>ℹ️</Text>
                            <Text style={styles.menuItemText}>About App</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.logoWrapper}>
                    <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.appName}>MerchMate</Text>
                <Text style={styles.tagline}>Professional Garment Costing Suite</Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.cardsContainer}>
                    {/* FOB Costing Card */}
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Input')} activeOpacity={0.85}>
                        <View style={styles.cardIconContainer}>
                            <Text style={styles.cardIcon}>📝</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>FOB Cost Sheet</Text>
                            <Text style={styles.cardDescription}>Calculate garment costing with fabric, trims & CM</Text>
                        </View>
                        <View style={styles.cardArrow}><Text style={styles.arrowText}>→</Text></View>
                    </TouchableOpacity>

                    {/* Fabric Analyzer Card */}
                    <TouchableOpacity style={[styles.card, styles.fabricCard]} onPress={() => navigation.navigate('FabricAnalyzerInput')} activeOpacity={0.85}>
                        <View style={[styles.cardIconContainer, styles.fabricIconContainer]}>
                            <Text style={styles.cardIcon}>🧵</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Fabric Analyzer</Text>
                            <Text style={styles.cardDescription}>Analyze consumption & marker efficiency</Text>
                        </View>
                        <View style={[styles.cardArrow, styles.fabricArrow]}><Text style={styles.arrowText}>→</Text></View>
                    </TouchableOpacity>

                    {/* Margin Analyzer Card */}
                    <TouchableOpacity style={[styles.card, styles.marginCard]} onPress={() => navigation.navigate('BuyerAnalyzerInput')} activeOpacity={0.85}>
                        <View style={[styles.cardIconContainer, styles.marginIconContainer]}>
                            <Text style={styles.cardIcon}>📊</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Margin Analyzer</Text>
                            <Text style={styles.cardDescription}>Buyer pricing & margin viability analysis</Text>
                        </View>
                        <View style={[styles.cardArrow, styles.marginArrow]}><Text style={styles.arrowText}>→</Text></View>
                    </TouchableOpacity>

                    {/* History Card */}
                    <TouchableOpacity style={[styles.card, styles.historyCard]} onPress={() => navigation.navigate('History')} activeOpacity={0.85}>
                        <View style={[styles.cardIconContainer, styles.historyIconContainer]}>
                            <Text style={styles.cardIcon}>📋</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>View History</Text>
                            <Text style={styles.cardDescription}>Access saved cost sheets & analyses</Text>
                        </View>
                        <View style={[styles.cardArrow, styles.historyArrow]}><Text style={styles.arrowText}>→</Text></View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Made with ❤️ for the Textile industry</Text>
                <Text style={styles.version}>v1.0.4</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    menuButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    menuDots: { fontSize: 24, color: '#333', fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    menuDropdown: { position: 'absolute', top: 100, right: 20, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 8, minWidth: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    menuItemIcon: { fontSize: 18, marginRight: 12 },
    menuItemText: { fontSize: 15, color: '#333', fontWeight: '500' },
    menuDivider: { height: 1, backgroundColor: '#eee', marginHorizontal: 12 },
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
