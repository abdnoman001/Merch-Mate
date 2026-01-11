import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_VERSION } from '../utils/versionConfig';

export default function AboutScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* App Header */}
            <View style={styles.headerSection}>
                <View style={styles.iconContainer}>
                    <Text style={styles.appIcon}>📐</Text>
                </View>
                <Text style={styles.appName}>MerchMate</Text>
                <Text style={styles.version}>Version {APP_VERSION}</Text>
                <Text style={styles.tagline}>Professional Garment Costing Suite</Text>
            </View>

            {/* Description */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>What is MerchMate?</Text>
                <Text style={styles.description}>
                    MerchMate is a comprehensive costing tool designed specifically for garment merchandisers,
                    production managers, and textile professionals. It simplifies complex calculations and
                    helps you make accurate pricing decisions quickly.
                </Text>
            </View>

            {/* Features */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Features</Text>

                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#007bff15' }]}>
                        <Text style={styles.featureEmoji}>📝</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>FOB Cost Sheet</Text>
                        <Text style={styles.featureDesc}>Calculate complete garment costing including fabric, trims, CM charges, and profit margins</Text>
                    </View>
                </View>

                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#28a74515' }]}>
                        <Text style={styles.featureEmoji}>🧵</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Fabric Analyzer</Text>
                        <Text style={styles.featureDesc}>Analyze fabric consumption and marker efficiency for knit, woven, and denim garments</Text>
                    </View>
                </View>

                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#6f42c115' }]}>
                        <Text style={styles.featureEmoji}>📤</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Export Reports</Text>
                        <Text style={styles.featureDesc}>Generate professional Excel spreadsheets and PDF reports to share with buyers</Text>
                    </View>
                </View>

                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#fd7e1415' }]}>
                        <Text style={styles.featureEmoji}>💾</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Auto Save</Text>
                        <Text style={styles.featureDesc}>All calculations are automatically saved to history for future reference</Text>
                    </View>
                </View>

                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#dc354515' }]}>
                        <Text style={styles.featureEmoji}>📊</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Marker Efficiency</Text>
                        <Text style={styles.featureDesc}>Calculate and optimize marker efficiency to reduce fabric wastage</Text>
                    </View>
                </View>
            </View>

            {/* Target Users */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Who is it for?</Text>
                <View style={styles.usersList}>
                    <Text style={styles.userItem}>👔 Garment Merchandisers</Text>
                    <Text style={styles.userItem}>🏭 Production Managers</Text>
                    <Text style={styles.userItem}>📋 Costing Executives</Text>
                    <Text style={styles.userItem}>🧵 Textile Professionals</Text>
                    <Text style={styles.userItem}>📈 Buying House Teams</Text>
                </View>
            </View>

            {/* Tech Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Technical Info</Text>
                <View style={styles.techRow}>
                    <Text style={styles.techLabel}>Platform</Text>
                    <Text style={styles.techValue}>Android & iOS</Text>
                </View>
                <View style={styles.techRow}>
                    <Text style={styles.techLabel}>Built with</Text>
                    <Text style={styles.techValue}>React Native & Expo</Text>
                </View>
                <View style={styles.techRow}>
                    <Text style={styles.techLabel}>Data Storage</Text>
                    <Text style={styles.techValue}>Local (On Device)</Text>
                </View>
                <View style={[styles.techRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.techLabel}>Last Updated</Text>
                    <Text style={styles.techValue}>December 2025</Text>
                </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>Made with ❤️ for the garment industry</Text>
            <Text style={styles.copyright}>© 2025 MerchMate. All rights reserved.</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    content: { padding: 16, paddingBottom: 32 },
    headerSection: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 28, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    iconContainer: { width: 90, height: 90, borderRadius: 24, backgroundColor: '#007bff15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    appIcon: { fontSize: 45 },
    appName: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
    version: { fontSize: 14, color: '#007bff', fontWeight: '600', marginBottom: 8, backgroundColor: '#007bff15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    tagline: { fontSize: 15, color: '#666', textAlign: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
    description: { fontSize: 14, color: '#555', lineHeight: 22 },
    featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    featureEmoji: { fontSize: 22 },
    featureContent: { flex: 1 },
    featureTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 2 },
    featureDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
    usersList: { gap: 10 },
    userItem: { fontSize: 14, color: '#444', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f8f9fa', borderRadius: 10 },
    techRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    techLabel: { fontSize: 14, color: '#888' },
    techValue: { fontSize: 14, color: '#333', fontWeight: '600' },
    footer: { textAlign: 'center', fontSize: 14, color: '#888', marginTop: 8 },
    copyright: { textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 6 },
});
